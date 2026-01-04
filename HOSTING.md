# 🌐 Hosting Guide (Ubuntu 24.04)

This guide will walk you through setting up Mail Muse on a fresh Ubuntu 24.04 (LTS) server.

## 1. System Update
First, ensure your server is up to date:
```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Install Node.js
We recommend using **nvm** (Node Version Manager) to install Node.js:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

## 3. Install PM2
PM2 is a process manager that will keep your app running in the background:
```bash
npm install pm2 -g
```

## 4. Setup the Application
Clone your repository and install dependencies:
```bash
git clone https://github.com/yourusername/mail-muse.git
cd mail-muse
npm install
npm run build
```

## 5. Configure PM2
Start the application using the integrated production script:
```bash
# Start the production server
pm2 start "npm run start" --name mail-muse
```
This will start the backend server, which is now correctly built into the `dist/server` directory.

## 6. Setup Nginx (Reverse Proxy)
Install Nginx:
```bash
sudo apt install nginx -y
```

Create a configuration file:
```bash
sudo nano /etc/nginx/sites-available/mail-muse
```

Add the following (replace `yourdomain.com` and `3001` with your actual domain and port):
```nginx
server {
    listen 80;
    server_name 143.244.142.6;

    location / {
        proxy_pass http://localhost:3001/api; # Backend port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/mail-muse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. Setup SSL (Certbot)
Secure your application with HTTPS:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

## 8. Backup Data
The database is stored in `sqlite.db` (or as configured in `server/db.ts`). Ensure you back up this file regularly.

---

> [!TIP]
> Always check your firewall settings (`ufw`) to ensure ports 80 and 443 are open.
