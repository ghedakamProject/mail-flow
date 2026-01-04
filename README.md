# 📧 Mail Muse

**Mail Muse** is a sleek, powerful, and self-hosted email marketing platform designed for simplicity and flexibility. Send beautiful campaigns using your own infrastructure or popular email providers.

![Mail Muse Banner](https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&q=80&w=1200&h=400)

## ✨ Features

- **Multi-Provider Support**: Choose between SendGrid, Mailgun, or your own Custom SMTP server.
- **Campaign Management**: Create, schedule, and track email campaigns with ease.
- **Template System**: Build beautiful HTML templates with dynamic variables like `{{name}}` and `{{email}}`.
- **Real-time Analytics**: Track email opens, sent counts, and failure rates in real-time.
- **Recipient Lists**: Manage and segment your audience effortlessly.
- **Telegram Integration**: Get instant notifications on your phone when campaigns complete.
- **Self-Hosted**: Built with Vite, React, Express, and a local SQLite database.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/mail-muse.git
   cd mail-muse
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3001
   ```

4. **Start the application**:
   ```bash
   npm run dev:all
   ```
   This will start both the Express backend and the Vite frontend concurrently.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI, Framer Motion.
- **Backend**: Node.js, Express.
- **Database**: SQLite (via `better-sqlite3`).
- **Mailing**: Nodemailer (SMTP), Axios (SendGrid/Mailgun APIs).

## 📖 Documentation

- [Hosting Guide](HOSTING.md) - How to host on Ubuntu 24.04.
- [Deployment Guide](DEPLOYMENT.md) - Step-by-step deployment instructions.

## 📄 License

MIT License - feel free to use and modify for your own projects!
