import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Mail, User, Save, CheckCircle, XCircle, Loader2, Edit2, X, Key, Eye, EyeOff, BarChart3, Info, Send, MessageCircle, Server, Globe } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useSendgridConfig, EmailProvider } from '@/hooks/useSendgridConfig';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const {
    config,
    isLoading,
    isConfigured,
    trackingEnabled,
    telegramEnabled,
    saveConfig,
    updateTracking,
    saveTelegramConfig,
    testTelegram,
    isTestingTelegram
  } = useSendgridConfig();

  const [provider, setProvider] = useState<EmailProvider>('sendgrid');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');

  // SendGrid State
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Mailgun State
  const [mailgunApiKey, setMailgunApiKey] = useState('');
  const [mailgunDomain, setMailgunDomain] = useState('');
  const [showMailgunKey, setShowMailgunKey] = useState(false);

  // SMTP State
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  // Telegram state
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramNotifications, setTelegramNotifications] = useState(false);
  const [showBotToken, setShowBotToken] = useState(false);
  const [isEditingTelegram, setIsEditingTelegram] = useState(false);

  useEffect(() => {
    if (config) {
      setProvider(config.provider || 'sendgrid');
      setFromEmail(config.from_email || '');
      setFromName(config.from_name || '');
      setApiKey(config.api_key || '');
      setMailgunApiKey(config.mailgun_api_key || '');
      setMailgunDomain(config.mailgun_domain || '');
      setSmtpHost(config.smtp_host || '');
      setSmtpPort(config.smtp_port?.toString() || '587');
      setSmtpUser(config.smtp_user || '');
      setSmtpPass(config.smtp_pass || '');
      setSmtpSecure(config.smtp_secure || false);

      setTelegramBotToken(config.telegram_bot_token || '');
      setTelegramChatId(config.telegram_chat_id || '');
      setTelegramNotifications(config.telegram_notifications_enabled || false);
    }
  }, [config]);

  const handleSave = () => {
    saveConfig({
      provider,
      from_email: fromEmail,
      from_name: fromName,
      api_key: apiKey,
      mailgun_api_key: mailgunApiKey,
      mailgun_domain: mailgunDomain,
      smtp_host: smtpHost,
      smtp_port: parseInt(smtpPort),
      smtp_user: smtpUser,
      smtp_pass: smtpPass,
      smtp_secure: smtpSecure,
      tracking_enabled: trackingEnabled
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (config) {
      setProvider(config.provider || 'sendgrid');
      setFromEmail(config.from_email || '');
      setFromName(config.from_name || '');
      setApiKey(config.api_key || '');
      setMailgunApiKey(config.mailgun_api_key || '');
      setMailgunDomain(config.mailgun_domain || '');
      setSmtpHost(config.smtp_host || '');
      setSmtpPort(config.smtp_port?.toString() || '587');
      setSmtpUser(config.smtp_user || '');
      setSmtpPass(config.smtp_pass || '');
      setSmtpSecure(config.smtp_secure || false);
    }
    setIsEditing(false);
  };

  const handleTrackingToggle = (enabled: boolean) => {
    updateTracking(enabled);
  };

  const handleSaveTelegram = () => {
    saveTelegramConfig({
      botToken: telegramBotToken,
      chatId: telegramChatId,
      enabled: telegramNotifications
    });
    setIsEditingTelegram(false);
  };

  const handleCancelTelegram = () => {
    if (config) {
      setTelegramBotToken(config.telegram_bot_token || '');
      setTelegramChatId(config.telegram_chat_id || '');
      setTelegramNotifications(config.telegram_notifications_enabled || false);
    }
    setIsEditingTelegram(false);
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const hasExistingConfig = config && config.is_configured;
  const hasExistingTelegram = config && config.telegram_bot_token && config.telegram_chat_id;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your email sending preferences
          </p>
        </div>

        {/* Email Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <SettingsIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Email Configuration</h3>
                <div className="flex items-center gap-2 mt-1">
                  {isConfigured ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm text-success">Connected via {provider}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm text-destructive">Not configured</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {hasExistingConfig && !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>

          {(!hasExistingConfig || isEditing) ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email Provider</label>
                  <Select value={provider} onValueChange={(v) => setProvider(v as EmailProvider)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="smtp">Custom SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      From Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="noreply@yourdomain.com"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      From Name
                    </label>
                    <Input
                      placeholder="Your Company Name"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                    />
                  </div>
                </div>

                {provider === 'sendgrid' && (
                  <div>
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      SendGrid API Key *
                    </label>
                    <div className="relative">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {provider === 'mailgun' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Key className="w-4 h-4 text-muted-foreground" />
                        Mailgun API Key *
                      </label>
                      <div className="relative">
                        <Input
                          type={showMailgunKey ? 'text' : 'password'}
                          placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxx"
                          value={mailgunApiKey}
                          onChange={(e) => setMailgunApiKey(e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowMailgunKey(!showMailgunKey)}
                        >
                          {showMailgunKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        Mailgun Domain *
                      </label>
                      <Input
                        placeholder="mg.yourdomain.com"
                        value={mailgunDomain}
                        onChange={(e) => setMailgunDomain(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {provider === 'smtp' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Server className="w-4 h-4 text-muted-foreground" />
                          SMTP Host *
                        </label>
                        <Input
                          placeholder="smtp.gmail.com"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Port *</label>
                        <Input
                          type="number"
                          placeholder="587"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">User *</label>
                        <Input
                          placeholder="user@gmail.com"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Password *</label>
                        <div className="relative">
                          <Input
                            type={showSmtpPass ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={smtpPass}
                            onChange={(e) => setSmtpPass(e.target.value)}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => setShowSmtpPass(!showSmtpPass)}
                          >
                            {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="secure" checked={smtpSecure} onCheckedChange={setSmtpSecure} />
                      <label htmlFor="secure" className="text-sm font-medium cursor-pointer">Use Secure (SSL/TLS)</label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {isEditing && (
                  <Button variant="outline" onClick={handleCancel} className="flex-1 gap-2">
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                )}
                <Button onClick={handleSave} className="flex-1 gap-2" disabled={!fromEmail}>
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Update Settings' : 'Save Settings'}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Active Provider</span>
                <span className="text-sm text-foreground capitalize">{provider}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">From Email</span>
                <span className="text-sm text-foreground">{fromEmail}</span>
              </div>
              {provider === 'sendgrid' && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">SendGrid Key</span>
                  <span className="text-sm text-foreground font-mono">{maskApiKey(config?.api_key || '')}</span>
                </div>
              )}
              {provider === 'mailgun' && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Domain</span>
                  <span className="text-sm text-foreground font-mono">{mailgunDomain}</span>
                </div>
              )}
              {provider === 'smtp' && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">SMTP Host</span>
                  <span className="text-sm text-foreground font-mono">{smtpHost}:{smtpPort}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Email Tracking Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Email Tracking</h3>
              <p className="text-sm text-muted-foreground">Track email opens and clicks</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Enable Email Tracking</p>
              <p className="text-sm text-muted-foreground">Track when recipients open emails</p>
            </div>
            <Switch
              checked={trackingEnabled}
              onCheckedChange={handleTrackingToggle}
            />
          </div>
        </motion.div>

        {/* Telegram Bot Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <MessageCircle className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Telegram Notifications</h3>
                <div className="flex items-center gap-2 mt-1">
                  {telegramEnabled ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm text-success">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Not configured</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {hasExistingTelegram && !isEditingTelegram && (
              <Button variant="outline" size="sm" onClick={() => setIsEditingTelegram(true)} className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>

          {(!hasExistingTelegram || isEditingTelegram) ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    Bot Token *
                  </label>
                  <div className="relative">
                    <Input
                      type={showBotToken ? 'text' : 'password'}
                      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowBotToken(!showBotToken)}
                    >
                      {showBotToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    Chat ID *
                  </label>
                  <Input
                    placeholder="-1001234567890 or your user ID"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Enable Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive campaign updates on Telegram</p>
                  </div>
                  <Switch
                    checked={telegramNotifications}
                    onCheckedChange={setTelegramNotifications}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                {isEditingTelegram && (
                  <Button variant="outline" onClick={handleCancelTelegram} className="flex-1 gap-2">
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                )}
                <Button onClick={handleSaveTelegram} className="flex-1 gap-2" disabled={!telegramBotToken || !telegramChatId}>
                  <Save className="w-4 h-4" />
                  {isEditingTelegram ? 'Update Telegram' : 'Save Telegram'}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Bot Token</span>
                  <span className="text-sm text-foreground font-mono">{maskApiKey(telegramBotToken)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Chat ID</span>
                  <span className="text-sm text-foreground">{telegramChatId}</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => testTelegram()}
                disabled={isTestingTelegram}
                className="w-full gap-2"
              >
                {isTestingTelegram ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Test Message
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}