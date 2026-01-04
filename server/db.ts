import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export const initDb = () => {
  // Create email_recipients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_recipients (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create email_templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      html_content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create email_campaigns table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      html_content TEXT,
      template_id TEXT REFERENCES email_templates(id),
      recipient_ids TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft',
      scheduled_at DATETIME,
      sent_at DATETIME,
      delay_seconds INTEGER NOT NULL DEFAULT 0,
      total_recipients INTEGER NOT NULL DEFAULT 0,
      sent_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create email_logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      campaign_id TEXT REFERENCES email_campaigns(id) ON DELETE CASCADE,
      recipient_id TEXT REFERENCES email_recipients(id) ON DELETE CASCADE,
      recipient_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indices for better performance
  db.exec('CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON email_logs(campaign_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_id ON email_logs(recipient_id)');

  // Create mail_config table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mail_config (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL DEFAULT 'sendgrid',
      from_email TEXT NOT NULL,
      from_name TEXT NOT NULL,
      api_key TEXT, -- SendGrid API Key
      mailgun_api_key TEXT,
      mailgun_domain TEXT,
      mailgun_region TEXT DEFAULT 'us',
      smtp_host TEXT,
      smtp_port INTEGER,
      smtp_user TEXT,
      smtp_pass TEXT,
      smtp_secure BOOLEAN DEFAULT 0,
      is_configured BOOLEAN NOT NULL DEFAULT 0,
      tracking_enabled BOOLEAN NOT NULL DEFAULT 1,
      telegram_notifications_enabled BOOLEAN NOT NULL DEFAULT 0,
      telegram_bot_token TEXT,
      telegram_chat_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration for existing sendgrid_config table if it exists
  try {
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sendgrid_config'").get();
    if (tableExists) {
      console.log('Migrating sendgrid_config to mail_config...');
      db.exec(`
        INSERT INTO mail_config (id, from_email, from_name, api_key, is_configured, tracking_enabled, telegram_notifications_enabled, telegram_bot_token, telegram_chat_id, created_at, updated_at)
        SELECT id, from_email, from_name, api_key, is_configured, tracking_enabled, telegram_notifications_enabled, telegram_bot_token, telegram_chat_id, created_at, updated_at FROM sendgrid_config
      `);
      db.exec('DROP TABLE sendgrid_config');
    }
  } catch (e) {
    console.error('Migration failed or not needed:', e);
  }

  // Ensure mailgun_region exists in mail_config
  try {
    db.exec("ALTER TABLE mail_config ADD COLUMN mailgun_region TEXT DEFAULT 'us'");
    console.log('Added mailgun_region column to mail_config');
  } catch (e) {
    // Column likely already exists
  }

  // Insert default config if it doesn't exist
  const config = db.prepare('SELECT * FROM mail_config LIMIT 1').get();
  if (!config) {
    db.prepare(`
      INSERT INTO mail_config (id, from_email, from_name, is_configured)
      VALUES (?, ?, ?, ?)
    `).run(crypto.randomUUID(), '', '', 0);
  }
};

export default db;
