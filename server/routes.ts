import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

const router = express.Router();

// --- Recipients ---
router.get('/recipients', (req, res) => {
    const recipients = db.prepare('SELECT * FROM email_recipients ORDER BY created_at DESC').all();
    res.json(recipients);
});

router.post('/recipients', (req, res) => {
    const { email, name } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO email_recipients (id, email, name) VALUES (?, ?, ?)').run(id, email, name);
    const recipient = db.prepare('SELECT * FROM email_recipients WHERE id = ?').get(id);
    res.json(recipient);
});

router.delete('/recipients/:id', (req, res) => {
    db.prepare('DELETE FROM email_recipients WHERE id = ?').run(req.params.id);
    res.status(204).end();
});

// --- Templates ---
router.get('/templates', (req, res) => {
    const templates = db.prepare('SELECT * FROM email_templates ORDER BY created_at DESC').all();
    res.json(templates);
});

router.post('/templates', (req, res) => {
    const { name, subject, html_content } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO email_templates (id, name, subject, html_content) VALUES (?, ?, ?, ?)').run(id, name, subject, html_content);
    const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(id);
    res.json(template);
});

router.delete('/templates/:id', (req, res) => {
    db.prepare('DELETE FROM email_templates WHERE id = ?').run(req.params.id);
    res.status(204).end();
});

// --- Campaigns ---
router.get('/campaigns', (req, res) => {
    const campaigns = db.prepare('SELECT * FROM email_campaigns ORDER BY created_at DESC').all();
    // Parse recipient_ids JSON string
    const formattedCampaigns = campaigns.map((c: any) => ({
        ...c,
        recipient_ids: JSON.parse(c.recipient_ids)
    }));
    res.json(formattedCampaigns);
});

router.post('/campaigns', (req, res) => {
    const { name, subject, html_content, template_id, recipient_ids, delay_seconds, scheduled_at } = req.body;
    const id = uuidv4();
    const status = scheduled_at ? 'scheduled' : 'draft';

    db.prepare(`
    INSERT INTO email_campaigns (id, name, subject, html_content, template_id, recipient_ids, delay_seconds, status, scheduled_at, total_recipients)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, subject, html_content, template_id, JSON.stringify(recipient_ids), delay_seconds, status, scheduled_at, recipient_ids.length);

    const campaign = db.prepare('SELECT * FROM email_campaigns WHERE id = ?').get(id) as any;
    res.json({ ...campaign, recipient_ids: JSON.parse(campaign.recipient_ids) });
});

router.delete('/campaigns/:id', (req, res) => {
    try {
        const id = req.params.id;

        // Use a transaction to ensure both logs and campaign are deleted
        const deleteTx = db.transaction(() => {
            // Delete logs first to avoid foreign key constraints if CASCADE is not working
            db.prepare('DELETE FROM email_logs WHERE campaign_id = ?').run(id);
            db.prepare('DELETE FROM email_campaigns WHERE id = ?').run(id);
        });

        deleteTx();
        res.status(204).end();
    } catch (error: any) {
        console.error(`ERROR: Failed to delete campaign ${req.params.id}:`, error);
        res.status(500).json({
            error: 'Failed to delete campaign',
            message: error.message,
            stack: error.stack
        });
    }
});

router.patch('/campaigns/:id/status', (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE email_campaigns SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true, status });
});

// --- Config ---
router.get('/config', (req, res) => {
    const config = db.prepare('SELECT * FROM mail_config LIMIT 1').get();
    res.json(config);
});

router.post('/config', (req, res) => {
    const currentConfig = db.prepare('SELECT id FROM mail_config LIMIT 1').get() as any;
    const {
        provider, from_email, from_name, api_key,
        mailgun_api_key, mailgun_domain,
        smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure,
        is_configured, tracking_enabled,
        telegram_notifications_enabled, telegram_bot_token, telegram_chat_id
    } = req.body;

    if (currentConfig) {
        db.prepare(`
      UPDATE mail_config SET 
        provider = ?, from_email = ?, from_name = ?, api_key = ?, 
        mailgun_api_key = ?, mailgun_domain = ?, mailgun_region = ?,
        smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_pass = ?, smtp_secure = ?,
        is_configured = ?, tracking_enabled = ?, telegram_notifications_enabled = ?, 
        telegram_bot_token = ?, telegram_chat_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
            provider || 'sendgrid', from_email, from_name, api_key,
            mailgun_api_key, mailgun_domain, req.body.mailgun_region || 'us',
            smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure ? 1 : 0,
            is_configured ? 1 : 0, tracking_enabled ? 1 : 0, telegram_notifications_enabled ? 1 : 0,
            telegram_bot_token, telegram_chat_id, currentConfig.id
        );
    } else {
        db.prepare(`
      INSERT INTO mail_config (
        id, provider, from_email, from_name, api_key, 
        mailgun_api_key, mailgun_domain, mailgun_region,
        smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure,
        is_configured, tracking_enabled, telegram_notifications_enabled, telegram_bot_token, telegram_chat_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            uuidv4(), provider || 'sendgrid', from_email, from_name, api_key,
            mailgun_api_key, mailgun_domain, req.body.mailgun_region || 'us',
            smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure ? 1 : 0,
            is_configured ? 1 : 0, tracking_enabled ? 1 : 0, telegram_notifications_enabled ? 1 : 0, telegram_bot_token, telegram_chat_id
        );
    }

    const config = db.prepare('SELECT * FROM mail_config LIMIT 1').get();
    res.json(config);
});

// --- Stats & Logs ---
router.get('/campaigns/:id/logs', (req, res) => {
    const logs = db.prepare('SELECT * FROM email_logs WHERE campaign_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(logs);
});

router.get('/stats/summary', (req, res) => {
    const totalSent = (db.prepare('SELECT SUM(sent_count) as total FROM email_campaigns').get() as any).total || 0;
    const totalFailed = (db.prepare('SELECT SUM(failed_count) as total FROM email_campaigns').get() as any).total || 0;
    const totalCampaigns = (db.prepare('SELECT COUNT(*) as total FROM email_campaigns').get() as any).total || 0;
    res.json({ totalSent, totalFailed, totalCampaigns });
});

export default router;
