#!/bin/bash

# StackMotive Staging Deployment Script
# Deploys staging environment to Digital Ocean on different ports

set -e

echo "🧪 StackMotive Staging Deployment to Digital Ocean"
echo "================================================="

# Configuration
DROPLET_IP="170.64.239.17"
SSH_KEY="~/.ssh/id_rsa"
SSH_USER="andy"
DEPLOY_DIR="/opt/stackmotive-staging"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to run command on remote server
run_remote() {
    ssh -i $SSH_KEY $SSH_USER@$DROPLET_IP "$1"
}

# Function to copy files to remote server
copy_to_remote() {
    scp -i $SSH_KEY -r "$1" $SSH_USER@$DROPLET_IP:"$2"
}

print_step "1. Preparing staging deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the StackMotive root directory"
    exit 1
fi

print_step "2. Creating staging environment file..."

# Create staging .env file
cat > .env.staging << EOF
# StackMotive Staging Environment
NODE_ENV=staging
DEBUG=false

# API Configuration  
API_PORT=7000
API_BASE_URL=http://170.64.239.17:7000
FRONTEND_URL=http://170.64.239.17:3000

# Database Configuration
DATABASE_URL=postgresql://stackmotive:staging_password_123@localhost:5433/stackmotive_staging

# Stripe (Test Keys)
STRIPE_PUBLISHABLE_KEY=pk_test_51RQFeJRfTZm4mhTAKEAdQtyVFCgooOgWj1Xx7Sl79UMYLqAeCAvoWUT5DkfSERrG7TriYwyprj5OoOnI6enQCoH900KcG5TCdn
STRIPE_SECRET_KEY=sk_test_51RQFeJRfTZm4mhTAUMPDT1aRk0BreePfNV9nGmt01a56L940DdHDFNUZaNPagUAw578fny7PFD0XFARmKBvFOasy0083VoR24n
STRIPE_WEBHOOK_SECRET=whsec_staging_webhook_secret

# Security
JWT_SECRET=staging_jwt_secret_change_me_2024
SESSION_SECRET=staging_session_secret_change_me_2024

# External APIs (Test)
FINNHUB_API_KEY=demo_key
NEWSAPI_KEY=demo_key
OPENAI_API_KEY=demo_key

# Staging Database Password
STAGING_DB_PASSWORD=staging_password_123
EOF

print_step "3. Connecting to Digital Ocean droplet..."

# Create staging directory on server
run_remote "sudo mkdir -p $DEPLOY_DIR && sudo chown $SSH_USER:$SSH_USER $DEPLOY_DIR"

print_step "4. Copying application files..."

# Copy application files
copy_to_remote "." "$DEPLOY_DIR/"

print_step "5. Setting up staging environment on server..."

run_remote "cd $DEPLOY_DIR && cat > setup-staging.sh << 'EOF'
#!/bin/bash
set -e

echo \"Setting up StackMotive Staging Environment...\"

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo \"Installing Docker...\"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker \$USER
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo \"Installing Docker Compose...\"
    sudo curl -L \"https://github.com/docker/compose/releases/download/1.29.2/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Stop any existing staging containers
echo \"Stopping existing staging containers...\"
docker-compose -f docker-compose.staging.yml down || true

# Build and start staging environment
echo \"Starting staging environment...\"
docker-compose -f docker-compose.staging.yml up -d --build

# Wait for services to start
echo \"Waiting for services to start...\"
sleep 30

# Check if services are running
echo \"Checking service status...\"
docker-compose -f docker-compose.staging.yml ps

echo \"✅ Staging deployment complete!\"
echo \"\"
echo \"Access your staging environment:\"
echo \"Frontend: http://170.64.239.17:3000\"
echo \"Backend:  http://170.64.239.17:7000\"
echo \"API Docs: http://170.64.239.17:7000/api/docs\"
EOF"

print_step "6. Running staging setup on server..."

run_remote "cd $DEPLOY_DIR && chmod +x setup-staging.sh && ./setup-staging.sh"

print_step "7. Verifying staging deployment..."

# Check if staging services are accessible
sleep 10
if curl -s http://$DROPLET_IP:7000/health > /dev/null; then
    print_success "✅ Staging backend is responding!"
else
    print_warning "⚠️ Staging backend may still be starting..."
fi

print_success "🎉 Staging Deployment Complete!"
echo ""
echo "📋 Staging Environment Access:"
echo "================================"
echo "Frontend: http://170.64.239.17:3000"
echo "Backend:  http://170.64.239.17:7000" 
echo "API Docs: http://170.64.239.17:7000/api/docs"
echo ""
echo "📊 Service Ports:"
echo "Frontend (Staging): 3000 (Production: 5173)"
echo "Backend (Staging):  7000 (Production: 8000)"
echo "Database (Staging): 5433 (Production: 5432)"
echo ""
echo "🔧 Management Commands:"
echo "ssh -i ~/.ssh/id_rsa andy@170.64.239.17"
echo "cd /opt/stackmotive-staging"
echo "docker-compose -f docker-compose.staging.yml logs -f" 