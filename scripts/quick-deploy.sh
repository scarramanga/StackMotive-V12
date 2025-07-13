#!/bin/bash

# StackMotive Quick Deployment Script
# This script provides a fast, one-command deployment for StackMotive

set -e  # Exit on any error

echo "⚡ StackMotive Quick Deploy"
echo "=========================="

# Configuration
DOMAIN="${1:-localhost}"
EMAIL="${2:-admin@localhost}"
ENVIRONMENT="${3:-production}"

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

# Function to check if script is run as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root for initial setup"
        print_warning "Run: sudo bash $0"
        exit 1
    fi
}

# Function to display banner
display_banner() {
    echo ""
    echo "🚀 StackMotive Quick Deploy"
    echo "=========================="
    echo ""
    echo "Domain: $DOMAIN"
    echo "Email: $EMAIL"
    echo "Environment: $ENVIRONMENT"
    echo ""
    echo "This script will:"
    echo "✅ Install all system dependencies"
    echo "✅ Configure server environment"
    echo "✅ Deploy StackMotive application"
    echo "✅ Set up SSL certificates"
    echo "✅ Start all services"
    echo ""
    read -p "Continue? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled by user"
        exit 0
    fi
}

# Function to run server setup
setup_server() {
    print_step "Setting up server environment..."
    
    # Check if setup script exists
    if [ ! -f "scripts/deploy-digital-ocean.sh" ]; then
        print_error "Server setup script not found"
        exit 1
    fi
    
    # Run server setup
    bash scripts/deploy-digital-ocean.sh "$DOMAIN" "$EMAIL" "$ENVIRONMENT"
    
    print_success "Server setup completed"
}

# Function to deploy application
deploy_application() {
    print_step "Deploying StackMotive application..."
    
    # Switch to deploy user
    sudo -u stackmotive bash << 'EOF'
# Check if app deployment script exists
if [ ! -f "/opt/stackmotive/scripts/deploy-app.sh" ]; then
    # Copy deployment script to deploy directory
    cp scripts/deploy-app.sh /opt/stackmotive/scripts/
    chmod +x /opt/stackmotive/scripts/deploy-app.sh
fi

# Run application deployment
cd /opt/stackmotive
bash scripts/deploy-app.sh "$ENVIRONMENT" "$DOMAIN"
EOF
    
    print_success "Application deployment completed"
}

# Function to perform final checks
final_checks() {
    print_step "Performing final checks..."
    
    # Check if services are running
    if systemctl is-active --quiet stackmotive-frontend; then
        print_success "✅ Frontend service is running"
    else
        print_error "❌ Frontend service is not running"
    fi
    
    if systemctl is-active --quiet stackmotive-backend; then
        print_success "✅ Backend service is running"
    else
        print_error "❌ Backend service is not running"
    fi
    
    if systemctl is-active --quiet nginx; then
        print_success "✅ Nginx service is running"
    else
        print_error "❌ Nginx service is not running"
    fi
    
    if systemctl is-active --quiet postgresql; then
        print_success "✅ PostgreSQL service is running"
    else
        print_error "❌ PostgreSQL service is not running"
    fi
    
    # Test HTTP response
    sleep 5
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_success "✅ Web server is responding"
    else
        print_warning "⚠️  Web server is not responding (may need time to start)"
    fi
}

# Function to display final instructions
display_final_instructions() {
    echo ""
    echo "🎉 StackMotive Deployment Complete!"
    echo "==================================="
    echo ""
    echo "Your StackMotive application is now deployed and running!"
    echo ""
    echo "🌐 Access your application:"
    if [ "$DOMAIN" != "localhost" ]; then
        echo "   Production: https://$DOMAIN"
        echo "   Staging: https://staging.$DOMAIN"
    else
        echo "   Local: http://localhost"
    fi
    echo ""
    echo "🔧 Management Commands:"
    echo "   Start services:   sudo systemctl start stackmotive-frontend stackmotive-backend"
    echo "   Stop services:    sudo systemctl stop stackmotive-frontend stackmotive-backend"
    echo "   Restart services: sudo systemctl restart stackmotive-frontend stackmotive-backend"
    echo "   Check status:     sudo systemctl status stackmotive-frontend stackmotive-backend"
    echo ""
    echo "📋 View Logs:"
    echo "   Frontend: sudo journalctl -u stackmotive-frontend -f"
    echo "   Backend:  sudo journalctl -u stackmotive-backend -f"
    echo "   Nginx:    sudo tail -f /var/log/nginx/access.log"
    echo ""
    echo "🔐 Security:"
    echo "   Firewall: sudo ufw status"
    echo "   SSL:      sudo certbot certificates"
    echo ""
    echo "📁 Application Files:"
    echo "   Deploy directory: /opt/stackmotive"
    echo "   Current release:  /opt/stackmotive/current"
    echo "   Logs directory:   /opt/stackmotive/logs"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Configure your environment variables in /opt/stackmotive/current/.env"
    echo "2. Update your Stripe keys for production billing"
    echo "3. Configure your domain DNS to point to this server"
    echo "4. Test all functionality"
    echo "5. Set up monitoring and backups"
    echo ""
    echo "💡 Need help? Check the deployment info:"
    echo "   cat /opt/stackmotive/deployment-info.txt"
    echo ""
    echo "🎊 Congratulations! Your StackMotive MVP is live!"
}

# Function to create quick management script
create_management_script() {
    print_step "Creating management script..."
    
    cat > /usr/local/bin/stackmotive << 'EOF'
#!/bin/bash

# StackMotive Management Script

case "$1" in
    start)
        echo "Starting StackMotive services..."
        systemctl start stackmotive-frontend stackmotive-backend nginx
        echo "Services started"
        ;;
    stop)
        echo "Stopping StackMotive services..."
        systemctl stop stackmotive-frontend stackmotive-backend
        echo "Services stopped"
        ;;
    restart)
        echo "Restarting StackMotive services..."
        systemctl restart stackmotive-frontend stackmotive-backend nginx
        echo "Services restarted"
        ;;
    status)
        echo "StackMotive Service Status:"
        systemctl status stackmotive-frontend stackmotive-backend nginx postgresql
        ;;
    logs)
        if [ -n "$2" ]; then
            case "$2" in
                frontend)
                    journalctl -u stackmotive-frontend -f
                    ;;
                backend)
                    journalctl -u stackmotive-backend -f
                    ;;
                nginx)
                    tail -f /var/log/nginx/access.log
                    ;;
                *)
                    echo "Available logs: frontend, backend, nginx"
                    ;;
            esac
        else
            echo "Usage: stackmotive logs [frontend|backend|nginx]"
        fi
        ;;
    deploy)
        echo "Deploying latest version..."
        cd /opt/stackmotive
        sudo -u stackmotive bash scripts/deploy-app.sh production
        ;;
    backup)
        echo "Creating backup..."
        BACKUP_DIR="/opt/stackmotive/backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp -r /opt/stackmotive/current "$BACKUP_DIR/"
        sudo -u postgres pg_dump stackmotive > "$BACKUP_DIR/database.sql"
        echo "Backup created at $BACKUP_DIR"
        ;;
    *)
        echo "StackMotive Management Script"
        echo "Usage: stackmotive {start|stop|restart|status|logs|deploy|backup}"
        echo ""
        echo "Commands:"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Show service status"
        echo "  logs     - View logs (frontend|backend|nginx)"
        echo "  deploy   - Deploy latest version"
        echo "  backup   - Create backup"
        ;;
esac
EOF
    
    chmod +x /usr/local/bin/stackmotive
    print_success "Management script created: /usr/local/bin/stackmotive"
}

# Main function
main() {
    # Display banner
    display_banner
    
    # Check root privileges
    check_root
    
    # Setup server
    setup_server
    
    # Deploy application
    deploy_application
    
    # Create management script
    create_management_script
    
    # Final checks
    final_checks
    
    # Display final instructions
    display_final_instructions
    
    print_success "🎉 Quick deployment completed successfully!"
}

# Run main function
main "$@" 