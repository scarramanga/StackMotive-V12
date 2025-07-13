#!/bin/bash

# StackMotive Digital Ocean Deployment Script
# This script deploys the complete StackMotive application to a Digital Ocean Droplet

set -e  # Exit on any error

echo "🚀 Starting StackMotive Digital Ocean Deployment"
echo "=================================================="

# Configuration
APP_NAME="stackmotive"
DEPLOY_USER="stackmotive"
DEPLOY_DIR="/opt/stackmotive"
DOMAIN="${1:-your-domain.com}"
EMAIL="${2:-admin@your-domain.com}"
ENVIRONMENT="${3:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
}

# Function to create deploy user
create_deploy_user() {
    print_status "Creating deployment user..."
    if id "$DEPLOY_USER" &>/dev/null; then
        print_warning "User $DEPLOY_USER already exists"
    else
        useradd -m -s /bin/bash "$DEPLOY_USER"
        usermod -aG sudo "$DEPLOY_USER"
        print_status "User $DEPLOY_USER created successfully"
    fi
}

# Function to install system dependencies
install_system_dependencies() {
    print_status "Installing system dependencies..."
    
    # Update system packages
    apt-get update -y
    apt-get upgrade -y
    
    # Install essential packages
    apt-get install -y \
        curl \
        git \
        htop \
        nginx \
        certbot \
        python3-certbot-nginx \
        ufw \
        fail2ban \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release
    
    print_status "System dependencies installed"
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add deploy user to docker group
    usermod -aG docker "$DEPLOY_USER"
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    print_status "Docker installed successfully"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js..."
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Install PM2 for process management
    npm install -g pm2
    
    print_status "Node.js installed successfully"
}

# Function to install PostgreSQL
install_postgresql() {
    print_status "Installing PostgreSQL..."
    
    # Install PostgreSQL
    apt-get install -y postgresql postgresql-contrib
    
    # Start and enable PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    print_status "PostgreSQL installed successfully"
}

# Function to configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    # Reset UFW to default
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (adjust port if needed)
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow PostgreSQL (only from localhost)
    ufw allow from 127.0.0.1 to any port 5432
    
    # Enable firewall
    ufw --force enable
    
    print_status "Firewall configured successfully"
}

# Function to setup application directory
setup_app_directory() {
    print_status "Setting up application directory..."
    
    # Create application directory
    mkdir -p "$DEPLOY_DIR"
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
    
    # Create log directory
    mkdir -p "/var/log/stackmotive"
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "/var/log/stackmotive"
    
    print_status "Application directory created"
}

# Function to configure Nginx
configure_nginx() {
    print_status "Configuring Nginx..."
    
    # Remove default Nginx site
    rm -f /etc/nginx/sites-enabled/default
    
    # Create StackMotive Nginx configuration
    cat > /etc/nginx/sites-available/stackmotive << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL configuration (will be updated by certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Client body size
    client_max_body_size 10M;
    
    # Frontend (React app)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files
    location /static {
        alias $DEPLOY_DIR/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/stackmotive /etc/nginx/sites-enabled/stackmotive
    
    # Test Nginx configuration
    nginx -t
    
    print_status "Nginx configured successfully"
}

# Function to setup SSL with Let's Encrypt
setup_ssl() {
    print_status "Setting up SSL with Let's Encrypt..."
    
    # Obtain SSL certificate
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"
    
    # Set up automatic renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    print_status "SSL configured successfully"
}

# Function to create systemd services
create_systemd_services() {
    print_status "Creating systemd services..."
    
    # StackMotive Frontend Service
    cat > /etc/systemd/system/stackmotive-frontend.service << EOF
[Unit]
Description=StackMotive Frontend
After=network.target

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$DEPLOY_DIR
Environment=NODE_ENV=$ENVIRONMENT
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=stackmotive-frontend

[Install]
WantedBy=multi-user.target
EOF
    
    # StackMotive Backend Service
    cat > /etc/systemd/system/stackmotive-backend.service << EOF
[Unit]
Description=StackMotive Backend
After=network.target postgresql.service

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$DEPLOY_DIR/server
Environment=ENVIRONMENT=$ENVIRONMENT
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=stackmotive-backend

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd
    systemctl daemon-reload
    
    print_status "Systemd services created"
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Install monitoring tools
    apt-get install -y htop iotop nethogs
    
    # Setup log rotation
    cat > /etc/logrotate.d/stackmotive << EOF
/var/log/stackmotive/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 $DEPLOY_USER $DEPLOY_USER
}
EOF
    
    print_status "Monitoring configured"
}

# Function to create deployment info
create_deployment_info() {
    print_status "Creating deployment information..."
    
    cat > "$DEPLOY_DIR/deployment-info.txt" << EOF
StackMotive Deployment Information
=================================

Deployment Date: $(date)
Environment: $ENVIRONMENT
Domain: $DOMAIN
Deploy User: $DEPLOY_USER
Deploy Directory: $DEPLOY_DIR

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Database: PostgreSQL on localhost:5432

Logs:
- Frontend: journalctl -u stackmotive-frontend -f
- Backend: journalctl -u stackmotive-backend -f
- Nginx: tail -f /var/log/nginx/access.log
- System: /var/log/stackmotive/

Management Commands:
- Start services: systemctl start stackmotive-frontend stackmotive-backend
- Stop services: systemctl stop stackmotive-frontend stackmotive-backend
- Restart services: systemctl restart stackmotive-frontend stackmotive-backend
- Check status: systemctl status stackmotive-frontend stackmotive-backend

SSL Certificate:
- Domain: $DOMAIN
- Renewal: Automatic via cron job
- Manual renewal: certbot renew

Firewall:
- SSH: Port 22
- HTTP: Port 80 (redirects to HTTPS)
- HTTPS: Port 443
- PostgreSQL: Port 5432 (localhost only)

Next Steps:
1. Upload your application code to $DEPLOY_DIR
2. Set up environment variables
3. Initialize database
4. Start services
5. Test deployment
EOF
    
    chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/deployment-info.txt"
    
    print_status "Deployment information created"
}

# Main deployment function
main() {
    print_status "Starting Digital Ocean deployment for StackMotive"
    
    # Check if running as root
    check_root
    
    # Create deploy user
    create_deploy_user
    
    # Install system dependencies
    install_system_dependencies
    
    # Install Docker
    install_docker
    
    # Install Node.js
    install_nodejs
    
    # Install PostgreSQL
    install_postgresql
    
    # Configure firewall
    configure_firewall
    
    # Setup application directory
    setup_app_directory
    
    # Configure Nginx
    configure_nginx
    
    # Setup SSL (skip if domain is placeholder)
    if [[ "$DOMAIN" != "your-domain.com" ]]; then
        setup_ssl
    else
        print_warning "Skipping SSL setup - please update domain and run: certbot --nginx -d your-domain.com"
    fi
    
    # Create systemd services
    create_systemd_services
    
    # Setup monitoring
    setup_monitoring
    
    # Create deployment info
    create_deployment_info
    
    print_status "✅ Digital Ocean deployment completed successfully!"
    echo ""
    echo "🎉 Your StackMotive server is ready!"
    echo "📁 Application directory: $DEPLOY_DIR"
    echo "👤 Deploy user: $DEPLOY_USER"
    echo "🌐 Domain: $DOMAIN"
    echo "📋 Deployment info: $DEPLOY_DIR/deployment-info.txt"
    echo ""
    echo "Next steps:"
    echo "1. Upload your application code"
    echo "2. Run the application deployment script"
    echo "3. Configure environment variables"
    echo "4. Initialize database"
    echo "5. Start services"
    echo ""
    echo "🚀 Ready to deploy your StackMotive application!"
}

# Run main function
main "$@" 