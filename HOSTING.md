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

## 4. Install PostgreSQL
Install and configure the PostgreSQL database:
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE mail_muse;"
sudo -u postgres psql -c "CREATE USER mailmuseuser WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mail_muse TO mailmuseuser;"
```

## 5. Setup the Application
Clone your repository and install dependencies:
```bash
git clone https://github.com/yourusername/mail-muse.git
cd mail-muse
npm install
npm run build
```

Configure your `.env` file with the `DATABASE_URL`:
`DATABASE_URL=postgresql://mailmuseuser:yourpassword@localhost:5432/mail_muse`

## 6. Configure PM2
Start the application using the integrated production script:
```bash
# Start the production server
pm2 start "npm run start" --name mail-muse
```

## 7. Setup Nginx (Reverse Proxy)
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
    server_name 143.244.142.6; # Your server IP

    location / {
        proxy_pass http://localhost:3001; # IMPORTANT: No "/api" at the end
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

> [!WARNING]
> Ensure your `proxy_pass` does **NOT** end with `/api`. Since the Express app now handles the prefix and serves the frontend, pointing Nginx to `/api` will cause "double prefixing" errors (like `/apiapi`) and prevent the frontend from loading.

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/mail-muse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 8. Setup SSL (Certbot)
Secure your application with HTTPS:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

## 9. Backup Data
Ensure you back up your PostgreSQL database regularly using `pg_dump`:
```bash
pg_dump mail_muse > mail_muse_backup.sql
```

---

> [!TIP]
> Always check your firewall settings (`ufw`) to ensure ports 80 and 443 are open.
