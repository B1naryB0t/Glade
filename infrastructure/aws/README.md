# AWS Deployment - MVP

## 1. Launch EC2
- Ubuntu 22.04, t2.micro
- Security Group: SSH (22), HTTP (80), HTTPS (443)
- Download key pair

## 2. Install Docker
```bash
ssh -i your-key.pem ubuntu@{ip_address}

sudo apt update
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit
```

## 3. Generate SSL Certificate (self-signed)
```bash
ssh -i your-key.pem ubuntu@{ip_address}

mkdir -p ~/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ~/ssl/nginx.key -out ~/ssl/nginx.crt \
  -subj "/CN=ec2-{ip_address}.compute-1.amazonaws.com"
```

## 4. Deploy
```bash
git clone YOUR_REPO_URL app
cd app

cp infrastructure/aws/.env.prod.example .env
nano .env  # Set DB_PASSWORD and SECRET_KEY

docker compose -f infrastructure/docker/docker-compose.prod.yml up -d --build
docker compose -f infrastructure/docker/docker-compose.prod.yml exec backend python manage.py migrate
```

Access at: `https://ec2-{ip_address}.compute-1.amazonaws.com` (accept browser warning)
