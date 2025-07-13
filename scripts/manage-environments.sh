#!/bin/bash

# StackMotive Environment Management Script
# This script helps manage different environments for StackMotive

set -e  # Exit on any error

echo "🌍 StackMotive Environment Manager"
echo "=================================="

# Configuration
DEPLOY_DIR="/opt/stackmotive"
CURRENT_ENV_FILE="$DEPLOY_DIR/current/.env"
ENVIRONMENT="${1:-status}"
ACTION="${2:-info}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_success() {
    echo -e "${PURPLE}[SUCCESS]${NC} $1"
}

# Function to get current environment
get_current_environment() {
    if [ -f "$CURRENT_ENV_FILE" ]; then
        grep "^ENVIRONMENT=" "$CURRENT_ENV_FILE" | cut -d'=' -f2 | tr -d '"'
    else
        echo "unknown"
    fi
}

# Function to show environment status
show_environment_status() {
    local current_env=$(get_current_environment)
    
    echo "Current Environment: $current_env"
    echo "Environment File: $CURRENT_ENV_FILE"
    echo ""
    
    if [ -f "$CURRENT_ENV_FILE" ]; then
        echo "Environment Variables:"
        echo "======================"
        grep -E "^(ENVIRONMENT|NODE_ENV|DATABASE_URL|STRIPE_|DOMAIN)" "$CURRENT_ENV_FILE" | while read line; do
            key=$(echo "$line" | cut -d'=' -f1)
            value=$(echo "$line" | cut -d'=' -f2)
            
            # Mask sensitive values
            if [[ "$key" == *"SECRET"* ]] || [[ "$key" == *"KEY"* ]] || [[ "$key" == *"PASSWORD"* ]]; then
                echo "  $key=***HIDDEN***"
            else
                echo "  $line"
            fi
        done
    else
        print_warning "No environment file found"
    fi
    
    echo ""
    echo "Available Environments:"
    echo "======================"
    for env in development staging production; do
        if [ -f "$DEPLOY_DIR/current/config/env.$env.template" ]; then
            echo "  ✅ $env"
        else
            echo "  ❌ $env (template not found)"
        fi
    done
}

# Function to switch environment
switch_environment() {
    local target_env="$1"
    local template_file="$DEPLOY_DIR/current/config/env.$target_env.template"
    
    if [ ! -f "$template_file" ]; then
        print_error "Environment template not found: $template_file"
        exit 1
    fi
    
    # Backup current environment
    if [ -f "$CURRENT_ENV_FILE" ]; then
        cp "$CURRENT_ENV_FILE" "$CURRENT_ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
        print_status "Current environment backed up"
    fi
    
    # Copy template
    cp "$template_file" "$CURRENT_ENV_FILE"
    
    # Update environment variables
    sed -i "s/ENVIRONMENT=.*/ENVIRONMENT=$target_env/" "$CURRENT_ENV_FILE"
    sed -i "s/NODE_ENV=.*/NODE_ENV=$target_env/" "$CURRENT_ENV_FILE"
    
    print_success "Switched to $target_env environment"
    
    # Restart services
    if systemctl is-active --quiet stackmotive-frontend stackmotive-backend; then
        print_step "Restarting services..."
        systemctl restart stackmotive-frontend stackmotive-backend
        print_success "Services restarted"
    fi
}

# Function to configure development environment
configure_development() {
    print_step "Configuring development environment..."
    
    local env_file="$DEPLOY_DIR/current/.env"
    
    # Development specific settings
    cat > "$env_file" << EOF
# StackMotive Development Environment
ENVIRONMENT=development
NODE_ENV=development
PORT=3000
API_PORT=8000

# Database
DATABASE_URL=postgresql://stackmotive:stackmotive_dev@localhost:5432/stackmotive_dev

# Domain
DOMAIN=localhost
API_URL=http://localhost:8000

# Stripe (Test Keys)
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Security
JWT_SECRET=dev_jwt_secret_change_in_production
SESSION_SECRET=dev_session_secret_change_in_production

# Features
ENABLE_LOGGING=true
ENABLE_METRICS=true
DEBUG=true

# External APIs
FINNHUB_API_KEY=your_finnhub_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
EOF
    
    print_success "Development environment configured"
}

# Function to configure staging environment
configure_staging() {
    print_step "Configuring staging environment..."
    
    local env_file="$DEPLOY_DIR/current/.env"
    
    # Staging specific settings
    cat > "$env_file" << EOF
# StackMotive Staging Environment
ENVIRONMENT=staging
NODE_ENV=production
PORT=3000
API_PORT=8000

# Database
DATABASE_URL=postgresql://stackmotive:stackmotive_staging@localhost:5432/stackmotive_staging

# Domain
DOMAIN=staging.yourdomain.com
API_URL=https://staging.yourdomain.com/api

# Stripe (Test Keys)
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Security
JWT_SECRET=staging_jwt_secret_generate_random
SESSION_SECRET=staging_session_secret_generate_random

# Features
ENABLE_LOGGING=true
ENABLE_METRICS=true
DEBUG=false

# External APIs
FINNHUB_API_KEY=your_finnhub_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
EOF
    
    print_success "Staging environment configured"
}

# Function to configure production environment
configure_production() {
    print_step "Configuring production environment..."
    
    local env_file="$DEPLOY_DIR/current/.env"
    
    # Production specific settings
    cat > "$env_file" << EOF
# StackMotive Production Environment
ENVIRONMENT=production
NODE_ENV=production
PORT=3000
API_PORT=8000

# Database
DATABASE_URL=postgresql://stackmotive:stackmotive_production@localhost:5432/stackmotive

# Domain
DOMAIN=yourdomain.com
API_URL=https://yourdomain.com/api

# Stripe (Live Keys - UPDATE THESE!)
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
STRIPE_SECRET_KEY=sk_live_your_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here

# Security (GENERATE RANDOM SECRETS!)
JWT_SECRET=production_jwt_secret_generate_random_64_chars
SESSION_SECRET=production_session_secret_generate_random_64_chars

# Features
ENABLE_LOGGING=true
ENABLE_METRICS=true
DEBUG=false

# External APIs
FINNHUB_API_KEY=your_finnhub_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
EOF
    
    print_warning "IMPORTANT: Update all placeholder values with real credentials!"
    print_success "Production environment configured"
}

# Function to validate environment
validate_environment() {
    local env_file="$DEPLOY_DIR/current/.env"
    
    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: $env_file"
        exit 1
    fi
    
    print_step "Validating environment configuration..."
    
    # Check required variables
    local required_vars=("ENVIRONMENT" "DATABASE_URL" "STRIPE_SECRET_KEY" "JWT_SECRET")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$env_file"; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    # Check for placeholder values
    local placeholder_found=false
    
    if grep -q "your_.*_key_here" "$env_file"; then
        print_warning "Placeholder values found - update with real credentials"
        placeholder_found=true
    fi
    
    if grep -q "generate_random" "$env_file"; then
        print_warning "Generate random secrets for security"
        placeholder_found=true
    fi
    
    if [ "$placeholder_found" = true ]; then
        print_warning "Environment has placeholder values - update before production use"
    else
        print_success "Environment validation passed"
    fi
}

# Function to create database for environment
create_database() {
    local env="$1"
    local db_name="stackmotive"
    local db_user="stackmotive"
    local db_pass="stackmotive_${env}"
    
    if [ "$env" = "development" ]; then
        db_name="stackmotive_dev"
        db_pass="stackmotive_dev"
    elif [ "$env" = "staging" ]; then
        db_name="stackmotive_staging"
        db_pass="stackmotive_staging"
    fi
    
    print_step "Creating database for $env environment..."
    
    # Create database and user
    sudo -u postgres psql << EOF
-- Create database user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$db_user') THEN
        CREATE USER $db_user WITH PASSWORD '$db_pass';
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $db_name OWNER $db_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db_name')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $db_name TO $db_user;
ALTER USER $db_user CREATEDB;
EOF
    
    print_success "Database created for $env environment"
}

# Function to show help
show_help() {
    echo "StackMotive Environment Manager"
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  development  - Local development environment"
    echo "  staging      - Staging environment for testing"
    echo "  production   - Production environment"
    echo "  status       - Show current environment status"
    echo ""
    echo "Actions:"
    echo "  info         - Show environment information"
    echo "  switch       - Switch to environment"
    echo "  configure    - Configure environment from template"
    echo "  validate     - Validate environment configuration"
    echo "  create-db    - Create database for environment"
    echo ""
    echo "Examples:"
    echo "  $0 status                    # Show current environment"
    echo "  $0 development configure     # Configure development environment"
    echo "  $0 staging switch           # Switch to staging environment"
    echo "  $0 production validate      # Validate production environment"
    echo "  $0 development create-db    # Create development database"
}

# Main function
main() {
    case "$ENVIRONMENT" in
        "development"|"staging"|"production")
            case "$ACTION" in
                "info")
                    show_environment_status
                    ;;
                "switch")
                    switch_environment "$ENVIRONMENT"
                    ;;
                "configure")
                    case "$ENVIRONMENT" in
                        "development")
                            configure_development
                            ;;
                        "staging")
                            configure_staging
                            ;;
                        "production")
                            configure_production
                            ;;
                    esac
                    ;;
                "validate")
                    validate_environment
                    ;;
                "create-db")
                    create_database "$ENVIRONMENT"
                    ;;
                *)
                    show_help
                    ;;
            esac
            ;;
        "status")
            show_environment_status
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            show_help
            ;;
    esac
}

# Run main function
main "$@" 