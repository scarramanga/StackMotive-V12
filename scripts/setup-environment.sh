#!/bin/bash

# StackMotive Environment Setup Script
# Helps set up and manage different environments (dev/staging/production)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="$PROJECT_ROOT/config"

# Available environments
ENVIRONMENTS=("development" "staging" "production" "test")

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    echo "Usage: $0 [COMMAND] [ENVIRONMENT]"
    echo ""
    echo "Commands:"
    echo "  setup [env]      Set up environment configuration"
    echo "  switch [env]     Switch to different environment"
    echo "  validate [env]   Validate environment configuration"
    echo "  backup [env]     Backup current environment"
    echo "  list             List all environments"
    echo "  check            Check current environment status"
    echo ""
    echo "Environments: development, staging, production, test"
    echo ""
    echo "Examples:"
    echo "  $0 setup development"
    echo "  $0 switch staging"
    echo "  $0 validate production"
}

validate_environment() {
    local env=$1
    
    if [[ ! " ${ENVIRONMENTS[@]} " =~ " ${env} " ]]; then
        log_error "Invalid environment: $env"
        log_info "Available environments: ${ENVIRONMENTS[*]}"
        exit 1
    fi
}

setup_environment() {
    local env=$1
    
    log_info "Setting up $env environment..."
    
    # Create environment file from template
    local template_file="$CONFIG_DIR/env.$env.template"
    local env_file="$PROJECT_ROOT/.env.$env"
    
    if [[ ! -f "$template_file" ]]; then
        log_error "Template file not found: $template_file"
        exit 1
    fi
    
    if [[ -f "$env_file" ]]; then
        log_warning "Environment file already exists: $env_file"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Skipping environment setup"
            return
        fi
    fi
    
    # Copy template to environment file
    cp "$template_file" "$env_file"
    log_success "Created $env_file from template"
    
    # Set up directory structure
    setup_directories "$env"
    
    # Environment-specific setup
    case $env in
        "development")
            setup_development
            ;;
        "staging")
            setup_staging
            ;;
        "production")
            setup_production
            ;;
        "test")
            setup_test
            ;;
    esac
    
    log_success "$env environment setup complete!"
    log_warning "Remember to update the configuration values in $env_file"
}

setup_directories() {
    local env=$1
    
    log_info "Creating directory structure for $env..."
    
    # Create environment-specific directories
    mkdir -p "$PROJECT_ROOT/logs/$env"
    mkdir -p "$PROJECT_ROOT/uploads/$env"
    mkdir -p "$PROJECT_ROOT/backups/$env"
    mkdir -p "$PROJECT_ROOT/cache/$env"
    mkdir -p "$PROJECT_ROOT/tmp/$env"
    
    log_success "Directory structure created"
}

setup_development() {
    log_info "Setting up development environment..."
    
    # Check for required development tools
    check_development_tools
    
    # Set up development database
    setup_development_database
    
    log_success "Development environment ready"
}

setup_staging() {
    log_info "Setting up staging environment..."
    
    # Staging-specific setup
    log_warning "Staging environment requires manual configuration of:"
    log_warning "- Database connection string"
    log_warning "- External API keys"
    log_warning "- SSL certificates"
    
    log_success "Staging environment template ready"
}

setup_production() {
    log_info "Setting up production environment..."
    
    log_error "Production setup requires manual configuration!"
    log_warning "CRITICAL: Update all CHANGE_ME values in .env.production"
    log_warning "NEVER commit production secrets to version control"
    
    # Create production checklist
    create_production_checklist
    
    log_success "Production environment template ready"
}

setup_test() {
    log_info "Setting up test environment..."
    
    # Test-specific setup
    setup_test_database
    
    log_success "Test environment ready"
}

check_development_tools() {
    log_info "Checking development tools..."
    
    # Check Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        log_success "Node.js found: $node_version"
    else
        log_error "Node.js not found. Please install Node.js 18+"
        exit 1
    fi
    
    # Check Python
    if command -v python3 &> /dev/null; then
        local python_version=$(python3 --version)
        log_success "Python found: $python_version"
    else
        log_error "Python 3 not found. Please install Python 3.9+"
        exit 1
    fi
    
    # Check PostgreSQL
    if command -v psql &> /dev/null; then
        local psql_version=$(psql --version)
        log_success "PostgreSQL found: $psql_version"
    else
        log_warning "PostgreSQL not found. Install for local development"
    fi
    
    # Check Redis
    if command -v redis-cli &> /dev/null; then
        log_success "Redis CLI found"
    else
        log_warning "Redis not found. Install for caching support"
    fi
}

setup_development_database() {
    log_info "Setting up development database..."
    
    # Check if PostgreSQL is running
    if pg_isready -h localhost -p 5432 &> /dev/null; then
        log_success "PostgreSQL is running"
        
        # Create database if it doesn't exist
        if ! psql -h localhost -p 5432 -U postgres -lqt | cut -d \| -f 1 | grep -qw stackmotive; then
            log_info "Creating stackmotive database..."
            createdb -h localhost -p 5432 -U postgres stackmotive || true
        fi
        
        log_success "Development database ready"
    else
        log_warning "PostgreSQL not running. Start it manually"
    fi
}

setup_test_database() {
    log_info "Setting up test database..."
    
    # Create test database
    if pg_isready -h localhost -p 5432 &> /dev/null; then
        if ! psql -h localhost -p 5432 -U postgres -lqt | cut -d \| -f 1 | grep -qw stackmotive_test; then
            log_info "Creating stackmotive_test database..."
            createdb -h localhost -p 5432 -U postgres stackmotive_test || true
        fi
        
        log_success "Test database ready"
    else
        log_warning "PostgreSQL not running. Start it for testing"
    fi
}

create_production_checklist() {
    local checklist_file="$PROJECT_ROOT/PRODUCTION_CHECKLIST.md"
    
    cat > "$checklist_file" << EOF
# Production Deployment Checklist

## Environment Variables
- [ ] Update all CHANGE_ME values in .env.production
- [ ] Set strong JWT_SECRET (64+ characters)
- [ ] Configure production database credentials
- [ ] Set Stripe LIVE API keys
- [ ] Configure production email service
- [ ] Set Sentry DSN for error tracking

## Security
- [ ] Enable SSL/TLS
- [ ] Configure security headers
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Review API documentation exposure

## Infrastructure
- [ ] Set up load balancer
- [ ] Configure auto-scaling
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Set up logging aggregation
- [ ] Configure CDN

## Testing
- [ ] Run full test suite
- [ ] Load testing
- [ ] Security testing
- [ ] Backup/restore testing
- [ ] Failover testing

## Legal & Compliance
- [ ] Terms of Service review
- [ ] Privacy Policy update
- [ ] GDPR compliance check
- [ ] Data retention policies
- [ ] Audit logging enabled

## Launch
- [ ] DNS configuration
- [ ] SSL certificate installation
- [ ] Health check setup
- [ ] Monitoring dashboards
- [ ] Incident response plan
- [ ] Communication plan
EOF

    log_success "Production checklist created: $checklist_file"
}

switch_environment() {
    local env=$1
    
    log_info "Switching to $env environment..."
    
    # Check if environment file exists
    local env_file="$PROJECT_ROOT/.env.$env"
    if [[ ! -f "$env_file" ]]; then
        log_error "Environment file not found: $env_file"
        log_info "Run: $0 setup $env"
        exit 1
    fi
    
    # Create/update main .env file
    cp "$env_file" "$PROJECT_ROOT/.env"
    
    # Update NODE_ENV in package.json scripts if exists
    if [[ -f "$PROJECT_ROOT/package.json" ]]; then
        log_info "Environment switched in package.json"
    fi
    
    log_success "Switched to $env environment"
    log_info "Current environment: $env"
}

validate_environment() {
    local env=$1
    
    log_info "Validating $env environment..."
    
    local env_file="$PROJECT_ROOT/.env.$env"
    if [[ ! -f "$env_file" ]]; then
        log_error "Environment file not found: $env_file"
        exit 1
    fi
    
    # Check for required variables
    local required_vars=("NODE_ENV" "DB_HOST" "DB_NAME" "JWT_SECRET")
    local missing_vars=()
    
    while IFS= read -r line; do
        if [[ $line =~ ^([A-Z_]+)=(.*)$ ]]; then
            local var_name="${BASH_REMATCH[1]}"
            local var_value="${BASH_REMATCH[2]}"
            
            if [[ " ${required_vars[@]} " =~ " ${var_name} " ]]; then
                if [[ -z "$var_value" || "$var_value" =~ ^CHANGE_ME ]]; then
                    missing_vars+=("$var_name")
                fi
            fi
        fi
    done < "$env_file"
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing or invalid configuration for: ${missing_vars[*]}"
        exit 1
    fi
    
    log_success "$env environment configuration is valid"
}

list_environments() {
    log_info "Available environments:"
    
    for env in "${ENVIRONMENTS[@]}"; do
        local env_file="$PROJECT_ROOT/.env.$env"
        if [[ -f "$env_file" ]]; then
            echo -e "  ${GREEN}✓${NC} $env (configured)"
        else
            echo -e "  ${YELLOW}○${NC} $env (not configured)"
        fi
    done
}

check_current_environment() {
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        local current_env=$(grep "^NODE_ENV=" "$PROJECT_ROOT/.env" | cut -d'=' -f2)
        log_info "Current environment: ${current_env:-unknown}"
        
        # Show basic health check
        log_info "Running basic health checks..."
        
        # Check database connection
        if command -v psql &> /dev/null; then
            local db_host=$(grep "^DB_HOST=" "$PROJECT_ROOT/.env" | cut -d'=' -f2)
            local db_port=$(grep "^DB_PORT=" "$PROJECT_ROOT/.env" | cut -d'=' -f2)
            
            if pg_isready -h "${db_host:-localhost}" -p "${db_port:-5432}" &> /dev/null; then
                log_success "Database connection: OK"
            else
                log_warning "Database connection: Failed"
            fi
        fi
        
    else
        log_warning "No environment configured (.env file not found)"
        log_info "Run: $0 setup development"
    fi
}

# Main script logic
case "${1:-}" in
    "setup")
        if [[ -z "${2:-}" ]]; then
            log_error "Environment required for setup"
            show_usage
            exit 1
        fi
        validate_environment "$2"
        setup_environment "$2"
        ;;
    "switch")
        if [[ -z "${2:-}" ]]; then
            log_error "Environment required for switch"
            show_usage
            exit 1
        fi
        validate_environment "$2"
        switch_environment "$2"
        ;;
    "validate")
        if [[ -z "${2:-}" ]]; then
            log_error "Environment required for validation"
            show_usage
            exit 1
        fi
        validate_environment "$2"
        ;;
    "list")
        list_environments
        ;;
    "check")
        check_current_environment
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    *)
        log_error "Unknown command: ${1:-}"
        show_usage
        exit 1
        ;;
esac 