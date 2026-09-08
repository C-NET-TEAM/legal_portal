#!/bin/bash
set -e

echo "========================================================="
echo "  Setting up Legal Portal Backend on AWS EC2 Ubuntu"
echo "========================================================="

# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20 LTS and essential tools
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# 3. Install Nginx and Certbot
echo "Installing Nginx and Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx python3-pip

# 4. Install PM2 process manager
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# 5. Create EBS upload storage directory
echo "Setting up EBS storage volume directory..."
sudo mkdir -p /data/legal_portal/uploads
sudo chown -R ubuntu:ubuntu /data/legal_portal
sudo chmod -R 775 /data/legal_portal/uploads

echo "EBS storage directory ready at: /data/legal_portal/uploads"

# 6. Install project dependencies
cd /home/ubuntu/legal-portal-backend
npm install --production

# 7. Start backend with PM2
echo "Starting backend process with PM2..."
pm2 start deploy/ecosystem.config.cjs
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "Backend setup complete!"
