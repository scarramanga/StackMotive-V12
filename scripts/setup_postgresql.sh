#!/bin/bash

# Phase 5: PostgreSQL Setup Script
# Installs, configures, and initializes PostgreSQL for StackMotive production

set -e

echo "🚀 Phase 5: PostgreSQL Setup for StackMotive"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="stackmotive"
DB_USER="stackmotive"
DB_PASSWORD="stackmotive123"
DB_HOST="localhost"
DB_PORT="5432"

# Function to print colored output
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

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_step "Detected macOS - Installing PostgreSQL via Homebrew"
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        print_error "Homebrew is not installed. Please install Homebrew first:"
        echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    # Install PostgreSQL
    print_step "Installing PostgreSQL..."
    brew install postgresql@14
    
    # Start PostgreSQL service
    print_step "Starting PostgreSQL service..."
    brew services start postgresql@14
    
    # Add PostgreSQL to PATH
    export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"
    
    # Wait for PostgreSQL to start
    sleep 5
    
else
    print_error "This script is designed for macOS. For other systems, please install PostgreSQL manually."
    exit 1
fi

# Check if PostgreSQL is running
print_step "Checking PostgreSQL status..."
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    print_error "PostgreSQL is not running or not accessible"
    exit 1
fi

print_status "PostgreSQL is running successfully"

# Create database and user
print_step "Creating database and user..."

# Create user if it doesn't exist
psql -h $DB_HOST -p $DB_PORT -d postgres -c "
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;
" 2>/dev/null || true

# Create database if it doesn't exist
psql -h $DB_HOST -p $DB_PORT -d postgres -c "
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME');
" | grep -q "CREATE DATABASE" && psql -h $DB_HOST -p $DB_PORT -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || true

# Grant privileges
psql -h $DB_HOST -p $DB_PORT -d postgres -c "
ALTER USER $DB_USER CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
"

print_status "Database and user created successfully"

# Run the migration script
print_step "Running PostgreSQL schema migration..."
psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -f database/migrations/phase5_postgresql_migration.sql

print_status "Schema migration completed successfully"

# Create environment file
print_step "Creating environment configuration..."
cat > .env.production << EOF
# PostgreSQL Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
POSTGRES_HOST=$DB_HOST
POSTGRES_PORT=$DB_PORT
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASSWORD

# Application Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=\$(openssl rand -hex 32)
ENCRYPTION_KEY=\$(openssl rand -hex 32)

# Feature Flags
ENABLE_RLS=true
ENABLE_AUDIT_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=true
EOF

print_status "Environment configuration created"

# Update Prisma schema for PostgreSQL
print_step "Updating Prisma schema for PostgreSQL..."
cp prisma/schema.prisma prisma/schema.prisma.backup

# Update datasource in Prisma schema
sed -i '' 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
sed -i '' 's/url      = env("DATABASE_URL")/url      = env("DATABASE_URL")/' prisma/schema.prisma

print_status "Prisma schema updated"

# Install Python dependencies for data migration
print_step "Installing Python dependencies..."
pip install psycopg2-binary

# Test database connection
print_step "Testing database connection..."
python3 -c "
import psycopg2
try:
    conn = psycopg2.connect(
        host='$DB_HOST',
        port='$DB_PORT',
        database='$DB_NAME',
        user='$DB_USER',
        password='$DB_PASSWORD'
    )
    cursor = conn.cursor()
    cursor.execute('SELECT version();')
    version = cursor.fetchone()
    print(f'✓ Connected to PostgreSQL: {version[0][:50]}...')
    cursor.close()
    conn.close()
except Exception as e:
    print(f'✗ Connection failed: {e}')
    exit(1)
"

# Check table count
print_step "Verifying migration..."
TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT LIKE 'pg_%';")
print_status "Created $TABLE_COUNT tables in PostgreSQL"

# Performance optimization
print_step "Applying performance optimizations..."
psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "
-- Enable query optimization
SET shared_preload_libraries = 'pg_stat_statements';

-- Update PostgreSQL configuration for performance
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Reload configuration
SELECT pg_reload_conf();
"

print_status "Performance optimizations applied"

# Create backup script
print_step "Creating backup script..."
cat > scripts/backup_postgresql.sh << 'EOF'
#!/bin/bash
# PostgreSQL Backup Script

DB_NAME="stackmotive"
DB_USER="stackmotive"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Creating PostgreSQL backup..."
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_DIR/stackmotive_backup_$TIMESTAMP.sql

echo "Backup created: $BACKUP_DIR/stackmotive_backup_$TIMESTAMP.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "stackmotive_backup_*.sql" -mtime +7 -delete
EOF

chmod +x scripts/backup_postgresql.sh

print_status "Backup script created"

# Final verification
print_step "Final verification..."
echo "
🎉 PostgreSQL Setup Complete!

Database Details:
- Host: $DB_HOST
- Port: $DB_PORT
- Database: $DB_NAME
- User: $DB_USER
- Tables: $TABLE_COUNT

Next Steps:
1. Run data migration: python3 database/migrations/data_migration_sqlite_to_postgresql.py
2. Update your application configuration to use PostgreSQL
3. Test all functionality with the new database
4. Set up regular backups with scripts/backup_postgresql.sh

Connection String:
postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
"

print_status "Setup completed successfully!" 