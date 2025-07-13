-- Phase 5: PostgreSQL Migration Script
-- Convert SQLite schema to PostgreSQL with optimizations and RLS setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Enable Row Level Security globally
ALTER DATABASE postgres SET row_level_security = on;

-- ===========================
-- CORE TABLES MIGRATION
-- ===========================

-- Session table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Users table with enhanced fields
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    
    -- Subscription and billing
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'free',
    trial_started_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    
    -- Onboarding
    onboarding_complete BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 0,
    
    -- Tax information
    tax_residency VARCHAR(255),
    secondary_tax_residency VARCHAR(255),
    tax_identification_number VARCHAR(255),
    tax_file_number VARCHAR(255),
    tax_registered_business BOOLEAN DEFAULT FALSE,
    tax_year VARCHAR(10),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading accounts
CREATE TABLE IF NOT EXISTS trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    broker VARCHAR(100) NOT NULL,
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    api_passphrase VARCHAR(255),
    account_number VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    balance DECIMAL(18,8),
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced TIMESTAMPTZ,
    connection_status VARCHAR(50) DEFAULT 'disconnected',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Strategies
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    account_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    indicators TEXT NOT NULL,
    entry_conditions TEXT NOT NULL,
    exit_conditions TEXT NOT NULL,
    risk_percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'inactive',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    performance DECIMAL(10,4),
    win_rate DECIMAL(5,2),
    profit_factor DECIMAL(8,4),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES trading_accounts(id) ON DELETE SET NULL
);

-- Trades
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    strategy_id UUID,
    account_id UUID,
    symbol VARCHAR(20) NOT NULL,
    trade_type VARCHAR(10) NOT NULL,
    entry_price DECIMAL(18,8) NOT NULL,
    exit_price DECIMAL(18,8),
    quantity DECIMAL(18,8) NOT NULL,
    status VARCHAR(20) NOT NULL,
    profit_loss DECIMAL(18,8),
    profit_loss_percentage DECIMAL(8,4),
    exchange VARCHAR(50),
    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ,
    is_automated BOOLEAN DEFAULT FALSE,
    tax_impact TEXT,
    fees DECIMAL(18,8) DEFAULT 0,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES trading_accounts(id) ON DELETE SET NULL
);

-- Automation preferences
CREATE TABLE IF NOT EXISTS automation_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    strategy_id UUID,
    symbol VARCHAR(20),
    automation_level VARCHAR(20) DEFAULT 'notification',
    notification_channels TEXT NOT NULL,
    min_signal_strength DECIMAL(5,2),
    max_trade_amount DECIMAL(18,8),
    cooldown_period INTEGER,
    active_hours TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
);

-- Backtest sessions
CREATE TABLE IF NOT EXISTS backtest_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    strategy_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    interval VARCHAR(10) NOT NULL,
    initial_capital DECIMAL(18,8) NOT NULL,
    final_capital DECIMAL(18,8),
    profit_loss DECIMAL(18,8),
    profit_loss_percentage DECIMAL(8,4),
    max_drawdown DECIMAL(8,4),
    win_rate DECIMAL(5,2),
    total_trades INTEGER,
    winning_trades INTEGER,
    losing_trades INTEGER,
    sharpe_ratio DECIMAL(8,4),
    status VARCHAR(20) NOT NULL,
    result_summary TEXT,
    configuration JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
);

-- Backtest trades
CREATE TABLE IF NOT EXISTS backtest_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    trade_type VARCHAR(10) NOT NULL,
    entry_price DECIMAL(18,8) NOT NULL,
    exit_price DECIMAL(18,8),
    quantity DECIMAL(18,8) NOT NULL,
    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ,
    profit_loss DECIMAL(18,8),
    profit_loss_percentage DECIMAL(8,4),
    indicators TEXT,
    notes TEXT,
    status VARCHAR(20) NOT NULL,
    
    FOREIGN KEY (session_id) REFERENCES backtest_sessions(id) ON DELETE CASCADE
);

-- Tax settings
CREATE TABLE IF NOT EXISTS tax_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    country VARCHAR(2) NOT NULL,
    region VARCHAR(100),
    tax_year VARCHAR(10) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    accounting_method VARCHAR(20) DEFAULT 'FIFO',
    include_fees BOOLEAN DEFAULT TRUE,
    include_foreign_tax BOOLEAN DEFAULT TRUE,
    capital_gains_rules TEXT,
    rates_table JSONB,
    exemptions TEXT,
    offset_losses BOOLEAN DEFAULT TRUE,
    carry_forward BOOLEAN DEFAULT TRUE,
    previous_year_losses DECIMAL(18,8) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tax lots
CREATE TABLE IF NOT EXISTS tax_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    trade_id UUID,
    tax_year VARCHAR(10) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    asset_type VARCHAR(20) NOT NULL,
    acquired_date TIMESTAMPTZ NOT NULL,
    disposed_date TIMESTAMPTZ,
    quantity DECIMAL(18,8) NOT NULL,
    cost_basis DECIMAL(18,8) NOT NULL,
    proceeds DECIMAL(18,8),
    adjusted_cost_basis DECIMAL(18,8),
    fees_paid DECIMAL(18,8) DEFAULT 0,
    foreign_tax_paid DECIMAL(18,8) DEFAULT 0,
    exchange_rate DECIMAL(18,8),
    gain_loss DECIMAL(18,8),
    gain_type VARCHAR(20),
    tax_rate DECIMAL(5,2),
    tax_owed DECIMAL(18,8),
    wash_sale BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'open',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE SET NULL
);

-- Portfolio plans
CREATE TABLE IF NOT EXISTS portfolio_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    rebalance_frequency VARCHAR(20) DEFAULT 'quarterly',
    last_rebalanced TIMESTAMPTZ,
    next_scheduled_rebalance TIMESTAMPTZ,
    deviation_threshold DECIMAL(5,2) DEFAULT 5,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Rebalance recommendations
CREATE TABLE IF NOT EXISTS rebalance_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_plan_id UUID NOT NULL,
    user_id UUID NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    total_portfolio_value DECIMAL(18,8) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    applied_at TIMESTAMPTZ,
    recommendations JSONB NOT NULL,
    estimated_fees DECIMAL(18,8),
    estimated_tax_impact DECIMAL(18,8),
    notes TEXT,
    
    FOREIGN KEY (portfolio_plan_id) REFERENCES portfolio_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Paper trading accounts
CREATE TABLE IF NOT EXISTS paper_trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    initial_balance DECIMAL(18,8) NOT NULL,
    current_balance DECIMAL(18,8) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    reset_count INTEGER DEFAULT 0,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Paper trading transactions
CREATE TABLE IF NOT EXISTS paper_trading_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    user_id UUID NOT NULL,
    strategy_id UUID,
    symbol VARCHAR(20),
    transaction_type VARCHAR(10) NOT NULL,
    quantity DECIMAL(18,8) NOT NULL,
    price DECIMAL(18,8),
    amount DECIMAL(18,8) NOT NULL,
    fees DECIMAL(18,8) DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL,
    notes TEXT,
    
    FOREIGN KEY (account_id) REFERENCES paper_trading_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE SET NULL
);

-- Tax calculations
CREATE TABLE IF NOT EXISTS tax_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    tax_year VARCHAR(10) NOT NULL,
    total_gains DECIMAL(18,8) NOT NULL,
    total_losses DECIMAL(18,8) NOT NULL,
    net_income DECIMAL(18,8) NOT NULL,
    taxable_income DECIMAL(18,8) NOT NULL,
    tax_owed DECIMAL(18,8) NOT NULL,
    carry_forward_losses DECIMAL(18,8) NOT NULL,
    foreign_income DECIMAL(18,8) NOT NULL,
    fees_paid DECIMAL(18,8) NOT NULL,
    year_breakdown JSONB NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, tax_year)
);

-- Portfolio positions
CREATE TABLE IF NOT EXISTS portfolio_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    quantity DECIMAL(18,8) NOT NULL,
    avg_price DECIMAL(18,8) NOT NULL,
    current_price DECIMAL(18,8),
    asset_class VARCHAR(20) NOT NULL,
    account VARCHAR(100) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    sync_source VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    market_value DECIMAL(18,8) GENERATED ALWAYS AS (quantity * COALESCE(current_price, avg_price)) STORED,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Portfolio sync logs
CREATE TABLE IF NOT EXISTS portfolio_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    sync_source VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    records_imported INTEGER DEFAULT 0,
    error_message TEXT,
    filename VARCHAR(255),
    sync_started TIMESTAMPTZ DEFAULT NOW(),
    sync_completed TIMESTAMPTZ,
    metadata JSONB,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Agent memory
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    block_id VARCHAR(10) NOT NULL,
    action VARCHAR(100) NOT NULL,
    context TEXT,
    user_input TEXT,
    agent_response TEXT,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id VARCHAR(255),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===========================
-- ADDITIONAL TABLES FROM SCHEMA
-- ===========================

-- AI suggestion responses
CREATE TABLE IF NOT EXISTS ai_suggestion_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    suggestion_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_notes TEXT,
    modified_amount DECIMAL(18,8),
    response_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Holding tags
CREATE TABLE IF NOT EXISTS holding_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    position_id UUID NOT NULL,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES portfolio_positions(id) ON DELETE CASCADE,
    UNIQUE(user_id, position_id, tag)
);

-- Macro signals
CREATE TABLE IF NOT EXISTS macro_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator VARCHAR(100) NOT NULL,
    value DECIMAL(18,8) NOT NULL,
    previous_value DECIMAL(18,8),
    change DECIMAL(18,8),
    change_percentage DECIMAL(8,4),
    timestamp TIMESTAMPTZ NOT NULL,
    source VARCHAR(100) NOT NULL,
    ai_insight TEXT,
    impact_score DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rebalance schedules
CREATE TABLE IF NOT EXISTS rebalance_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    frequency VARCHAR(20) DEFAULT 'manual',
    threshold DECIMAL(5,2) DEFAULT 5.0,
    only_if_thresholds_exceeded BOOLEAN DEFAULT TRUE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
    exclude_weekends BOOLEAN DEFAULT TRUE,
    allow_partial_rebalancing BOOLEAN DEFAULT FALSE,
    max_trades_per_session INTEGER DEFAULT 10,
    time_of_day TIME DEFAULT '09:30',
    last_rebalance_time TIMESTAMPTZ,
    next_scheduled_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Strategy assignments
CREATE TABLE IF NOT EXISTS strategy_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    position_id UUID,
    strategy_name VARCHAR(255) NOT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    metadata JSONB,
    assigned_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES portfolio_positions(id) ON DELETE CASCADE
);

-- ===========================
-- INDEXES FOR PERFORMANCE
-- ===========================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_last_activity ON users(last_activity_at);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Sessions table indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_last_used ON sessions(last_used_at);

-- Trading accounts indexes
CREATE INDEX idx_trading_accounts_user_id ON trading_accounts(user_id);
CREATE INDEX idx_trading_accounts_broker ON trading_accounts(broker);
CREATE INDEX idx_trading_accounts_is_active ON trading_accounts(is_active);

-- Strategies indexes
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_symbol ON strategies(symbol);
CREATE INDEX idx_strategies_status ON strategies(status);

-- Trades indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_entry_time ON trades(entry_time);
CREATE INDEX idx_trades_status ON trades(status);

-- Portfolio positions indexes
CREATE INDEX idx_portfolio_positions_user_id ON portfolio_positions(user_id);
CREATE INDEX idx_portfolio_positions_symbol ON portfolio_positions(symbol);
CREATE INDEX idx_portfolio_positions_asset_class ON portfolio_positions(asset_class);
CREATE INDEX idx_portfolio_positions_last_updated ON portfolio_positions(last_updated);

-- Tax lots indexes
CREATE INDEX idx_tax_lots_user_id ON tax_lots(user_id);
CREATE INDEX idx_tax_lots_symbol ON tax_lots(symbol);
CREATE INDEX idx_tax_lots_tax_year ON tax_lots(tax_year);

-- Agent memory indexes
CREATE INDEX idx_agent_memory_user_id ON agent_memory(user_id);
CREATE INDEX idx_agent_memory_block_id ON agent_memory(block_id);
CREATE INDEX idx_agent_memory_timestamp ON agent_memory(timestamp);

-- Macro signals indexes
CREATE INDEX idx_macro_signals_indicator ON macro_signals(indicator);
CREATE INDEX idx_macro_signals_timestamp ON macro_signals(timestamp);
CREATE INDEX idx_macro_signals_impact_score ON macro_signals(impact_score);

-- ===========================
-- FOREIGN KEY CONSTRAINTS
-- ===========================

-- Add foreign key constraint for sessions
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update tables to use updated_at trigger
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_accounts_updated_at BEFORE UPDATE ON trading_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_preferences_updated_at BEFORE UPDATE ON automation_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_settings_updated_at BEFORE UPDATE ON tax_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_lots_updated_at BEFORE UPDATE ON tax_lots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_plans_updated_at BEFORE UPDATE ON portfolio_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paper_trading_accounts_updated_at BEFORE UPDATE ON paper_trading_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rebalance_schedules_updated_at BEFORE UPDATE ON rebalance_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- COMMENTS FOR DOCUMENTATION
-- ===========================

COMMENT ON TABLE users IS 'Core user accounts with authentication and profile information';
COMMENT ON TABLE sessions IS 'User session management for authentication';
COMMENT ON TABLE trading_accounts IS 'External broker account connections';
COMMENT ON TABLE strategies IS 'Trading strategies and algorithms';
COMMENT ON TABLE trades IS 'Historical trade records';
COMMENT ON TABLE portfolio_positions IS 'Current portfolio holdings';
COMMENT ON TABLE tax_lots IS 'Tax lot tracking for capital gains calculations';
COMMENT ON TABLE agent_memory IS 'AI agent interaction and memory storage';
COMMENT ON TABLE macro_signals IS 'Macroeconomic indicators and signals';

-- ===========================
-- COMPLETION MESSAGE
-- ===========================

-- Create a migration status table
CREATE TABLE IF NOT EXISTS migration_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    migration_name VARCHAR(255) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'running',
    notes TEXT
);

INSERT INTO migration_status (migration_name, status, notes) 
VALUES ('phase5_postgresql_migration', 'completed', 'Core SQLite to PostgreSQL migration completed successfully');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Phase 5 PostgreSQL Migration Complete!';
    RAISE NOTICE 'Tables created: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT LIKE 'pg_%');
    RAISE NOTICE 'Indexes created: %', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public');
END $$; 