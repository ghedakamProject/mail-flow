# 🚀 Deployment Guide

This guide describes the manual deployment process for Mail Muse.

## 1. Preparation
Before deploying, ensure you have:
- A server with Node.js and npm installed (see [Hosting Guide](HOSTING.md)).
- Access to the server via SSH.
- Your project configured with the correct environment variables.

## 2. Build Process
Mail Muse uses a Vite-based frontend and an Express backend.

### Local Build
For production, you need to build the frontend first:
```bash
npm run build
```
This generates a `dist` directory containing the optimized frontend assets and the transpiled backend code.

## 3. Deployment Steps

### Method A: Manual File Transfer (SCP/FTP)
1. Build the project locally as shown above.
2. Transfer the `dist` folder, `package.json`, and `.env` file to your server.
   ```bash
   scp -r dist package.json .env user@yourserver:/path/to/mail-muse
   ```
3. SSH into your server:
   ```bash
   ssh user@yourserver
   cd /path/to/mail-muse
   ```
4. Install production dependencies:
   ```bash
   npm install --production
   ```
5. Restart your process runner (e.g., PM2):
   ```bash
   pm2 restart mail-muse
   # or if first time:
   pm2 start "npm run start" --name mail-muse
   ```

### Method B: Git-based Deployment
1. SSH into your server.
2. Navigate to the project directory.
3. Pull the latest changes:
   ```bash
   git pull origin main
   ```
4. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```
5. Restart PM2:
   ```bash
   pm2 restart mail-muse-api
   ```

## 4. Environment Variables
Ensure your production `.env` file contains:
- `PORT`: The port your backend server will listen on.
- `NODE_ENV`: Set to `production`.

## 5. Database Management
Mail Muse uses SQLite. The database file (`sqlite.db`) is automatically created on migrations. If you are moving from local to production, you might want to transfer the `sqlite.db` file if it contains initial data (like recipients or templates).

---

> [!WARNING]
> Never commit your `.env` file or `sqlite.db` to a public repository. Ensure they are in your `.gitignore`.
