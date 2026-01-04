import axios from 'axios';
import nodemailer from 'nodemailer';
import db from './db.js';
import { v4 as uuidv4 } from 'uuid';

const sleep = (seconds: number) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const processTemplateVariables = (
    htmlContent: string,
    recipient: { email: string; name?: string },
    logId: string,
    trackingEnabled: boolean,
    baseUrl: string
): string => {
    let processed = htmlContent;
    processed = processed.replace(/\{\{name\}\}/gi, recipient.name || recipient.email.split('@')[0]);
    processed = processed.replace(/\{\{email\}\}/gi, recipient.email);

    if (trackingEnabled) {
        const trackingPixelUrl = `${baseUrl}/api/track-email?id=${logId}&type=open`;
        const trackingPixel = `<img src="${trackingPixelUrl}" alt="" width="1" height="1" style="display:none;visibility:hidden;" />`;

        if (htmlContent.toLowerCase().includes('{{tracking}}')) {
            processed = processed.replace(/\{\{tracking\}\}/gi, trackingPixel);
        } else if (processed.toLowerCase().includes('</body>')) {
            processed = processed.replace(/<\/body>/i, `${trackingPixel}</body>`);
        } else {
            processed += trackingPixel;
        }
    } else {
        processed = processed.replace(/\{\{tracking\}\}/gi, '');
    }
    return processed;
};

const sendWithSendGrid = async (
    to: string,
    subject: string,
    htmlContent: string,
    fromEmail: string,
    fromName: string,
    apiKey: string
) => {
    try {
        await axios.post(
            'https://api.sendgrid.com/v3/mail/send',
            {
                personalizations: [{ to: [{ email: to }] }],
                from: { email: fromEmail, name: fromName },
                subject,
                content: [{ type: 'text/html', value: htmlContent }],
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return { success: true };
    } catch (error: any) {
        console.error(`SendGrid error for ${to}:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

const sendWithMailgun = async (
    to: string,
    subject: string,
    htmlContent: string,
    fromEmail: string,
    fromName: string,
    apiKey: string,
    domain: string,
    region: string = 'us'
) => {
    try {
        const auth = Buffer.from(`api:${apiKey}`).toString('base64');
        const baseUrl = region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';
        const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

        await axios.post(
            `${baseUrl}/v3/${domain}/messages`,
            new URLSearchParams({
                from,
                to,
                subject,
                html: htmlContent,
            }),
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                },
            }
        );
        return { success: true };
    } catch (error: any) {
        console.error(`Mailgun error for ${to}:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

const sendWithSMTP = async (
    to: string,
    subject: string,
    htmlContent: string,
    fromEmail: string,
    fromName: string,
    host: string,
    port: number,
    user: string,
    pass: string,
    secure: boolean
) => {
    try {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
        });

        await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            html: htmlContent,
        });
        return { success: true };
    } catch (error: any) {
        console.error(`SMTP error for ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

export const processCampaign = async (campaignId: string, baseUrl: string) => {
    const campaign = db.prepare('SELECT * FROM email_campaigns WHERE id = ?').get(campaignId) as any;
    if (!campaign) return;

    const config = db.prepare('SELECT * FROM mail_config LIMIT 1').get() as any;
    if (!config || !config.is_configured) {
        console.error('Email provider not configured');
        db.prepare('UPDATE email_campaigns SET status = ? WHERE id = ?').run('failed', campaignId);
        return;
    }

    console.log(`Starting campaign ${campaignId} using ${config.provider} provider`);

    const recipientIds = JSON.parse(campaign.recipient_ids);
    const recipients = db.prepare(`SELECT * FROM email_recipients WHERE id IN (${recipientIds.map(() => '?').join(',')})`).all(...recipientIds) as any[];

    db.prepare('UPDATE email_campaigns SET status = ?, total_recipients = ? WHERE id = ?').run('sending', recipients.length, campaignId);

    let baseHtmlContent = campaign.html_content;
    if (!baseHtmlContent && campaign.template_id) {
        const template = db.prepare('SELECT html_content FROM email_templates WHERE id = ?').get(campaign.template_id) as any;
        baseHtmlContent = template?.html_content || '';
    }

    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i++) {
        try {
            // Check for pause or cancellation
            let currentStatus = (db.prepare('SELECT status FROM email_campaigns WHERE id = ?').get(campaignId) as any)?.status;

            while (currentStatus === 'paused') {
                await sleep(5); // Wait 5 seconds and check again
                currentStatus = (db.prepare('SELECT status FROM email_campaigns WHERE id = ?').get(campaignId) as any)?.status;
            }

            if (currentStatus !== 'sending') {
                console.log(`Campaign ${campaignId} stopped (status: ${currentStatus})`);
                return;
            }

            const recipient = recipients[i];
            const logId = uuidv4();

            db.prepare(`
      INSERT INTO email_logs (id, campaign_id, recipient_id, recipient_email, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(logId, campaignId, recipient.id, recipient.email, 'pending');

            const personalizedHtml = processTemplateVariables(
                baseHtmlContent,
                recipient,
                logId,
                config.tracking_enabled === 1,
                baseUrl
            );

            let result;
            if (config.provider === 'mailgun') {
                result = await sendWithMailgun(
                    recipient.email,
                    campaign.subject,
                    personalizedHtml,
                    config.from_email,
                    config.from_name,
                    config.mailgun_api_key,
                    config.mailgun_domain,
                    config.mailgun_region
                );
            } else if (config.provider === 'smtp') {
                result = await sendWithSMTP(
                    recipient.email,
                    campaign.subject,
                    personalizedHtml,
                    config.from_email,
                    config.from_name,
                    config.smtp_host,
                    config.smtp_port,
                    config.smtp_user,
                    config.smtp_pass,
                    config.smtp_secure === 1
                );
            } else {
                // Default to SendGrid
                result = await sendWithSendGrid(
                    recipient.email,
                    campaign.subject,
                    personalizedHtml,
                    config.from_email,
                    config.from_name,
                    config.api_key
                );
            }

            db.prepare(`
      UPDATE email_logs SET status = ?, error_message = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(result.success ? 'sent' : 'failed', result.error ? JSON.stringify(result.error) : null, logId);

            db.prepare('UPDATE email_recipients SET status = ? WHERE id = ?').run(result.success ? 'sent' : 'failed', recipient.id);

            if (result.success) sentCount++;
            else failedCount++;

            db.prepare('UPDATE email_campaigns SET sent_count = ?, failed_count = ? WHERE id = ?').run(sentCount, failedCount, campaignId);

            if (i < recipients.length - 1 && campaign.delay_seconds > 0) {
                await sleep(campaign.delay_seconds);
            }
        } catch (error: any) {
            console.error(`Error processing recipient in campaign ${campaignId}:`, error.message);
            // If campaign is missing, stop
            const status = (db.prepare('SELECT status FROM email_campaigns WHERE id = ?').get(campaignId) as any)?.status;
            if (!status) return;
        }
    }

    const finalStatus = failedCount === recipients.length ? 'failed' : 'sent';
    db.prepare('UPDATE email_campaigns SET status = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?').run(finalStatus, campaignId);

    // Telegram notification
    if (config.telegram_notifications_enabled && config.telegram_bot_token && config.telegram_chat_id) {
        try {
            const message = `📧 Campaign Completed: ${campaign.name}\n✅ Sent: ${sentCount}\n❌ Failed: ${failedCount}`;
            await axios.post(`https://api.telegram.org/bot${config.telegram_bot_token}/sendMessage`, {
                chat_id: config.telegram_chat_id,
                text: message,
            });
        } catch (e) {
            console.error('Failed to send Telegram notification');
        }
    }
};
