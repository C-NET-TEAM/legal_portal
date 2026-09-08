import subprocess
import urllib.request
import os

def get_public_ip():
    try:
        # Try AWS metadata service
        req = urllib.request.Request("http://checkip.amazonaws.com")
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.read().decode('utf-8').strip()
    except Exception:
        return "13.232.33.208"

public_ip = get_public_ip()
dashed_ip = public_ip.replace(".", "-")
domain = f"{dashed_ip}.sslip.io"

print(f"Configuring Nginx reverse proxy for: {domain}")

nginx_conf = f"""server {{
    listen 80;
    listen [::]:80;
    server_name {domain};

    client_max_body_size 100M;

    location / {{
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_buffering off;
    }}
}}
"""

conf_path = "/etc/nginx/sites-available/default"
with open(conf_path, "w") as f:
    f.write(nginx_conf)

subprocess.run(["nginx", "-t"], check=True)
subprocess.run(["systemctl", "reload", "nginx"], check=True)
print(f"Nginx HTTP configuration active for {domain}!")

# Acquire and configure Let's Encrypt SSL certificate
print("Requesting Let's Encrypt SSL certificate via Certbot...")
try:
    certbot_cmd = [
        "certbot",
        "--nginx",
        "-d", domain,
        "--non-interactive",
        "--agree-tos",
        "--email", "admin@legalportal.com",
        "--redirect"
    ]
    subprocess.run(certbot_cmd, check=True)
    print(f"\nSUCCESS! HTTPS SSL is active at: https://{domain}/")
except Exception as e:
    print(f"Note: Certbot encountered an issue ({e}). Ensure port 80 and 443 are open in EC2 Security Groups.")
