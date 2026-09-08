# Deployment script from local machine to AWS EC2
$EC2_IP = "13.202.10.28"
$PEM_KEY = "c:\Users\welcome\Downloads\combine\lex_ai.pem"
$REMOTE_DIR = "/home/ubuntu/legal-portal-backend"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " Deploying Legal Portal Backend to $EC2_IP" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Create remote directory
Write-Host "1. Creating remote directory..." -ForegroundColor Yellow
ssh -i $PEM_KEY -o StrictHostKeyChecking=no ubuntu@$EC2_IP "mkdir -p $REMOTE_DIR"

# 2. Upload project files (excluding node_modules and local uploads)
Write-Host "2. Copying project files..." -ForegroundColor Yellow
scp -i $PEM_KEY -o StrictHostKeyChecking=no -r package.json .env server.js db.js upload.js models deploy ubuntu@${EC2_IP}:${REMOTE_DIR}/

# 3. Copy extracted media files to remote EBS folder
Write-Host "3. Transferring media assets to EBS storage..." -ForegroundColor Yellow
ssh -i $PEM_KEY -o StrictHostKeyChecking=no ubuntu@$EC2_IP "sudo mkdir -p /data/legal_portal/uploads && sudo chown -R ubuntu:ubuntu /data/legal_portal"
scp -i $PEM_KEY -o StrictHostKeyChecking=no -r uploads/* ubuntu@${EC2_IP}:/data/legal_portal/uploads/

# 4. Run automated EC2 setup
Write-Host "4. Running EC2 environment setup (Node.js, Nginx, PM2)..." -ForegroundColor Yellow
ssh -i $PEM_KEY -o StrictHostKeyChecking=no ubuntu@$EC2_IP "chmod +x ${REMOTE_DIR}/deploy/setup_ec2.sh && ${REMOTE_DIR}/deploy/setup_ec2.sh"

# 5. Configure Nginx and SSL
Write-Host "5. Configuring Nginx reverse proxy and SSL certificate..." -ForegroundColor Yellow
ssh -i $PEM_KEY -o StrictHostKeyChecking=no ubuntu@$EC2_IP "sudo python3 ${REMOTE_DIR}/deploy/nginx_ssl.py"

Write-Host "`n=========================================================" -ForegroundColor Green
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host " HTTPS API: https://13-232-33-208.sslip.io/api/health" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
