#!/bin/bash

# StackMotive Application Deployment Script
# This script deploys the actual StackMotive application code and starts services

set -e  # Exit on any error

echo "🚀 Deploying StackMotive Application"
echo "====================================="

# Configuration
DEPLOY_DIR="/opt/stackmotive"
DEPLOY_USER="stackmotive"
ENVIRONMENT="${1:-production}"
DOMAIN="${2:-localhost}"
BRANCH="${3:-main}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Function to check if running as deploy user
check_user() {
    if [[ "$USER" != "$DEPLOY_USER" ]]; then
        print_error "This script must be run as the $DEPLOY_USER user"
        print_warning "Run: sudo su - $DEPLOY_USER"
        exit 1
    fi
}

# Function to backup current deployment
backup_current() {
    print_step "Creating backup of current deployment..."
    
    if [ -d "$DEPLOY_DIR/current" ]; then
        BACKUP_DIR="$DEPLOY_DIR/backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp -r "$DEPLOY_DIR/current" "$BACKUP_DIR/"
        print_status "Backup created at $BACKUP_DIR"
    else
        print_warning "No current deployment found - skipping backup"
    fi
}

# Function to clone or update repository
deploy_code() {
    print_step "Deploying application code..."
    
    # Create releases directory
    mkdir -p "$DEPLOY_DIR/releases"
    
    # Create new release directory
    RELEASE_DIR="$DEPLOY_DIR/releases/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$RELEASE_DIR"
    
    # Clone the repository (assuming it's already on the server)
    if [ -d "$DEPLOY_DIR/repo" ]; then
        print_status "Updating repository..."
        cd "$DEPLOY_DIR/repo"
        git fetch origin
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
        cp -r . "$RELEASE_DIR/"
    else
        print_warning "Repository not found - copying from local files"
        # If running from local directory, copy files
        if [ -f "../package.json" ]; then
            cp -r ../* "$RELEASE_DIR/"
        else
            print_error "No source code found. Please upload your code first."
            exit 1
        fi
    fi
    
    # Update current symlink
    rm -f "$DEPLOY_DIR/current"
    ln -s "$RELEASE_DIR" "$DEPLOY_DIR/current"
    
    print_status "Code deployed to $RELEASE_DIR"
}

# Function to setup environment variables
setup_environment() {
    print_step "Setting up environment variables..."
    
    cd "$DEPLOY_DIR/current"
    
    # Copy environment template
    if [ ! -f ".env" ]; then
        if [ -f "config/env.$ENVIRONMENT.template" ]; then
            cp "config/env.$ENVIRONMENT.template" ".env"
            print_status "Environment template copied"
        else
            print_warning "No environment template found - creating basic .env"
            cat > .env << EOF
# StackMotive Environment Configuration
NODE_ENV=$ENVIRONMENT
ENVIRONMENT=$ENVIRONMENT
PORT=3000
API_PORT=8000
DATABASE_URL=postgresql://stackmotive:password@localhost:5432/stackmotive
DOMAIN=$DOMAIN
EOF
        fi
    fi
    
    # Make environment setup script executable
    if [ -f "scripts/setup-environment.sh" ]; then
        chmod +x "scripts/setup-environment.sh"
    fi
    
    print_status "Environment configuration ready"
}

# Function to install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    cd "$DEPLOY_DIR/current"
    
    # Install Node.js dependencies
    if [ -f "package.json" ]; then
        print_status "Installing Node.js dependencies..."
        npm ci --production
    fi
    
    # Install Python dependencies
    if [ -f "server/requirements.txt" ]; then
        print_status "Installing Python dependencies..."
        cd server
        
        # Create virtual environment if it doesn't exist
        if [ ! -d "venv" ]; then
            python3 -m venv venv
        fi
        
        # Activate virtual environment and install dependencies
        source venv/bin/activate
        pip install -r requirements.txt
        cd ..
    fi
    
    print_status "Dependencies installed"
}

# Function to build frontend
build_frontend() {
    print_step "Building frontend..."
    
    cd "$DEPLOY_DIR/current"
    
    if [ -f "package.json" ]; then
        # Build the React app
        npm run build
        
        # Create static files directory
        mkdir -p "$DEPLOY_DIR/static"
        
        # Copy built files to static directory
        if [ -d "dist" ]; then
            cp -r dist/* "$DEPLOY_DIR/static/"
        elif [ -d "build" ]; then
            cp -r build/* "$DEPLOY_DIR/static/"
        fi
        
        print_status "Frontend built successfully"
    else
        print_warning "No package.json found - skipping frontend build"
    fi
}

# Function to setup database
setup_database() {
    print_step "Setting up database..."
    
    cd "$DEPLOY_DIR/current"
    
    # Create database user and database
    sudo -u postgres psql << EOF
-- Create database user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'stackmotive') THEN
        CREATE USER stackmotive WITH PASSWORD 'stackmotive_secure_password_2024';
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE stackmotive OWNER stackmotive'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'stackmotive')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE stackmotive TO stackmotive;
ALTER USER stackmotive CREATEDB;
EOF
    
    # Run database migrations
    if [ -f "database/migrations/phase5_postgresql_migration.sql" ]; then
        print_status "Running database migrations..."
        PGPASSWORD=stackmotive_secure_password_2024 psql -h localhost -U stackmotive -d stackmotive -f database/migrations/phase5_postgresql_migration.sql
    fi
    
    # Run RLS setup
    if [ -f "database/migrations/phase5_rls_implementation.sql" ]; then
        print_status "Setting up Row Level Security..."
        PGPASSWORD=stackmotive_secure_password_2024 psql -h localhost -U stackmotive -d stackmotive -f database/migrations/phase5_rls_implementation.sql
    fi
    
    print_status "Database setup completed"
}

# Function to setup SSL certificates for production
setup_ssl_production() {
    if [ "$ENVIRONMENT" = "production" ] && [ "$DOMAIN" != "localhost" ]; then
        print_step "Setting up SSL certificates..."
        
        # Generate SSL certificate with Let's Encrypt
        sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN"
        
        print_status "SSL certificates configured"
    fi
}

# Function to start services
start_services() {
    print_step "Starting services..."
    
    # Stop existing services
    sudo systemctl stop stackmotive-frontend stackmotive-backend 2>/dev/null || true
    
    # Update systemd service files with current paths
    sudo sed -i "s|WorkingDirectory=.*|WorkingDirectory=$DEPLOY_DIR/current|g" /etc/systemd/system/stackmotive-frontend.service
    sudo sed -i "s|WorkingDirectory=.*|WorkingDirectory=$DEPLOY_DIR/current/server|g" /etc/systemd/system/stackmotive-backend.service
    
    # Reload systemd
    sudo systemctl daemon-reload
    
    # Enable and start services
    sudo systemctl enable stackmotive-frontend stackmotive-backend
    sudo systemctl start stackmotive-frontend stackmotive-backend
    
    # Restart nginx
    sudo systemctl restart nginx
    
    print_status "Services started"
}

# Function to run health checks
run_health_checks() {
    print_step "Running health checks..."
    
    # Wait for services to start
    sleep 10
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "✅ Frontend is running"
    else
        print_error "❌ Frontend is not responding"
    fi
    
    # Check backend
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_status "✅ Backend is running"
    else
        print_error "❌ Backend is not responding"
    fi
    
    # Check database
    if PGPASSWORD=stackmotive_secure_password_2024 psql -h localhost -U stackmotive -d stackmotive -c "SELECT 1;" > /dev/null 2>&1; then
        print_status "✅ Database is accessible"
    else
        print_error "❌ Database is not accessible"
    fi
    
    # Check nginx
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_status "✅ Nginx is running"
    else
        print_error "❌ Nginx is not responding"
    fi
}

# Function to show deployment summary
show_deployment_summary() {
    print_step "Deployment Summary"
    echo "=================="
    echo ""
    echo "🚀 StackMotive Application Deployed Successfully!"
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Domain: $DOMAIN"
    echo "Release: $(basename $(readlink $DEPLOY_DIR/current))"
    echo "Deploy Directory: $DEPLOY_DIR/current"
    echo ""
    echo "Services:"
    echo "- Frontend: http://localhost:3000"
    echo "- Backend: http://localhost:8000"
    echo "- Web: http://$DOMAIN"
    echo ""
    echo "Management Commands:"
    echo "- View logs: journalctl -u stackmotive-frontend -f"
    echo "- View logs: journalctl -u stackmotive-backend -f"
    echo "- Restart: sudo systemctl restart stackmotive-frontend stackmotive-backend"
    echo "- Status: sudo systemctl status stackmotive-frontend stackmotive-backend"
    echo ""
    echo "🎉 Your StackMotive application is now live!"
}

# Function to setup monitoring and logging
setup_monitoring() {
    print_step "Setting up monitoring..."
    
    # Create log directories
    mkdir -p "$DEPLOY_DIR/logs"
    
    # Setup PM2 for additional process monitoring
    if command -v pm2 > /dev/null; then
        cd "$DEPLOY_DIR/current"
        
        # Create PM2 ecosystem file
        cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'stackmotive-frontend',
      script: 'npm',
      args: 'start',
      cwd: '$DEPLOY_DIR/current',
      env: {
        NODE_ENV: '$ENVIRONMENT',
        PORT: 3000
      },
      log_file: '$DEPLOY_DIR/logs/frontend.log',
      error_file: '$DEPLOY_DIR/logs/frontend-error.log',
      out_file: '$DEPLOY_DIR/logs/frontend-out.log'
    },
    {
      name: 'stackmotive-backend',
      script: 'server/venv/bin/python',
      args: 'main.py',
      cwd: '$DEPLOY_DIR/current/server',
      env: {
        ENVIRONMENT: '$ENVIRONMENT',
        PORT: 8000
      },
      log_file: '$DEPLOY_DIR/logs/backend.log',
      error_file: '$DEPLOY_DIR/logs/backend-error.log',
      out_file: '$DEPLOY_DIR/logs/backend-out.log'
    }
  ]
};
EOF
        
        print_status "PM2 monitoring configured"
    fi
}

# Main deployment function
main() {
    print_status "Starting StackMotive application deployment"
    
    # Check if running as deploy user
    check_user
    
    # Create necessary directories
    mkdir -p "$DEPLOY_DIR/backups"
    mkdir -p "$DEPLOY_DIR/logs"
    
    # Backup current deployment
    backup_current
    
    # Deploy code
    deploy_code
    
    # Setup environment
    setup_environment
    
    # Install dependencies
    install_dependencies
    
    # Build frontend
    build_frontend
    
    # Setup database
    setup_database
    
    # Setup SSL for production
    setup_ssl_production
    
    # Setup monitoring
    setup_monitoring
    
    # Start services
    start_services
    
    # Run health checks
    run_health_checks
    
    # Show deployment summary
    show_deployment_summary
    
    print_status "✅ Deployment completed successfully!"
}

# Run main function
main "$@" 