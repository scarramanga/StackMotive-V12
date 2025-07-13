#!/bin/bash

# StackMotive Installation Script
# One-command installation for StackMotive on Digital Ocean

set -e

echo "🚀 StackMotive Installation Script"
echo "=================================="
echo ""
echo "This script will set up StackMotive on your Digital Ocean droplet."
echo ""

# Get deployment details
read -p "Enter your domain name (or press Enter for localhost): " DOMAIN
DOMAIN=${DOMAIN:-localhost}

read -p "Enter your email address: " EMAIL
EMAIL=${EMAIL:-admin@localhost}

read -p "Enter environment (development/staging/production): " ENVIRONMENT
ENVIRONMENT=${ENVIRONMENT:-production}

echo ""
echo "🔧 Installation Configuration:"
echo "   Domain: $DOMAIN"
echo "   Email: $EMAIL"
echo "   Environment: $ENVIRONMENT"
echo ""

read -p "Continue with installation? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting StackMotive installation..."
echo ""

# Make all scripts executable
chmod +x scripts/*.sh

# Run quick deployment
if [ -f "scripts/quick-deploy.sh" ]; then
    echo "Running quick deployment..."
    ./scripts/quick-deploy.sh "$DOMAIN" "$EMAIL" "$ENVIRONMENT"
else
    echo "Running manual deployment..."
    
    # Server setup
    if [ -f "scripts/deploy-digital-ocean.sh" ]; then
        ./scripts/deploy-digital-ocean.sh "$DOMAIN" "$EMAIL" "$ENVIRONMENT"
    fi
    
    # Application deployment
    if [ -f "scripts/deploy-app.sh" ]; then
        sudo -u stackmotive ./scripts/deploy-app.sh "$ENVIRONMENT" "$DOMAIN"
    fi
fi

echo ""
echo "🎉 StackMotive installation completed!"
echo ""
echo "🌐 Your application is available at:"
if [ "$DOMAIN" != "localhost" ]; then
    echo "   https://$DOMAIN"
else
    echo "   http://localhost"
fi
echo ""
echo "🔧 Management commands:"
echo "   stackmotive start      # Start services"
echo "   stackmotive stop       # Stop services"
echo "   stackmotive restart    # Restart services"
echo "   stackmotive status     # Check status"
echo "   stackmotive logs       # View logs"
echo ""
echo "📖 Read the full deployment guide:"
echo "   cat DIGITAL_OCEAN_DEPLOYMENT_GUIDE.md"
echo ""
echo "🎊 Congratulations! Your StackMotive MVP is now live!" 