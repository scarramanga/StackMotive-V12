-- Block 4: Portfolio Dashboard - Database Schema
-- Comprehensive portfolio dashboard data and analytics

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Portfolio Summary Table
CREATE TABLE IF NOT EXISTS portfolio_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vault_id UUID,
    
    -- Summary Metrics
    total_value DECIMAL(18,2) NOT NULL DEFAULT 0,
    cash_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    holdings_value DECIMAL(18,2) NOT NULL DEFAULT 0,
    net_worth DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    -- Change Metrics
    change_value DECIMAL(18,2) DEFAULT 0,
    change_percent DECIMAL(5,2) DEFAULT 0,
    day_change_value DECIMAL(18,2) DEFAULT 0,
    day_change_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Performance Metrics
    total_return DECIMAL(18,2) DEFAULT 0,
    total_return_percent DECIMAL(5,2) DEFAULT 0,
    annualized_return DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(5,4) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    volatility DECIMAL(5,2) DEFAULT 0,
    
    -- Asset Breakdown
    asset_count INTEGER DEFAULT 0,
    asset_class_breakdown JSONB DEFAULT '{}',
    sector_breakdown JSONB DEFAULT '{}',
    geographic_breakdown JSONB DEFAULT '{}',
    
    -- Risk Metrics
    portfolio_beta DECIMAL(5,4) DEFAULT 0,
    var_95 DECIMAL(5,2) DEFAULT 0,
    correlation_spy DECIMAL(5,4) DEFAULT 0,
    
    -- Update Information
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    data_source TEXT DEFAULT 'calculated',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, vault_id, DATE(last_updated))
);

-- Portfolio Holdings Table
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vault_id UUID,
    
    -- Asset Details
    symbol TEXT NOT NULL,
    asset_name TEXT,
    asset_class TEXT,
    sector TEXT,
    market TEXT DEFAULT 'NZX',
    
    -- Position Details
    quantity DECIMAL(18,8) NOT NULL DEFAULT 0,
    average_cost DECIMAL(18,8) DEFAULT 0,
    current_price DECIMAL(18,8) DEFAULT 0,
    market_value DECIMAL(18,2) NOT NULL DEFAULT 0,
    cost_basis DECIMAL(18,2) DEFAULT 0,
    
    -- Performance
    unrealized_pnl DECIMAL(18,2) DEFAULT 0,
    unrealized_pnl_percent DECIMAL(5,2) DEFAULT 0,
    day_change DECIMAL(18,2) DEFAULT 0,
    day_change_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Allocation
    portfolio_percent DECIMAL(5,2) DEFAULT 0,
    target_percent DECIMAL(5,2) DEFAULT 0,
    allocation_drift DECIMAL(5,2) DEFAULT 0,
    
    -- Broker Information
    broker_account TEXT,
    account_type TEXT,
    
    -- Last Update
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    price_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, vault_id, symbol, broker_account),
    CHECK (quantity >= 0),
    CHECK (current_price >= 0),
    CHECK (market_value >= 0)
);

-- Dashboard Configuration Table
CREATE TABLE IF NOT EXISTS dashboard_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Display Preferences
    default_currency TEXT DEFAULT 'NZD',
    default_time_zone TEXT DEFAULT 'Pacific/Auckland',
    refresh_interval INTEGER DEFAULT 300, -- seconds
    auto_refresh BOOLEAN DEFAULT true,
    
    -- Chart Preferences
    chart_time_range TEXT DEFAULT '1y',
    show_benchmark BOOLEAN DEFAULT true,
    benchmark_symbol TEXT DEFAULT 'SPY',
    
    -- Metric Preferences
    preferred_metrics TEXT[] DEFAULT ARRAY['total_value', 'day_change', 'total_return', 'asset_count'],
    show_advanced_metrics BOOLEAN DEFAULT false,
    
    -- Notification Settings
    alert_on_large_moves BOOLEAN DEFAULT true,
    large_move_threshold DECIMAL(5,2) DEFAULT 5.0,
    
    -- Data Sources
    preferred_data_source TEXT DEFAULT 'real_time',
    include_paper_trading BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Portfolio Performance History Table
CREATE TABLE IF NOT EXISTS portfolio_performance_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vault_id UUID,
    
    -- Time Series Data
    date DATE NOT NULL,
    portfolio_value DECIMAL(18,2) NOT NULL,
    cash_balance DECIMAL(18,2) DEFAULT 0,
    holdings_value DECIMAL(18,2) DEFAULT 0,
    
    -- Daily Performance
    daily_return DECIMAL(5,4) DEFAULT 0,
    daily_return_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Cumulative Performance
    cumulative_return DECIMAL(18,2) DEFAULT 0,
    cumulative_return_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Benchmark Comparison
    benchmark_value DECIMAL(18,2),
    benchmark_return DECIMAL(5,4) DEFAULT 0,
    alpha DECIMAL(5,4) DEFAULT 0,
    
    -- Volume and Activity
    trade_count INTEGER DEFAULT 0,
    trade_volume DECIMAL(18,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, vault_id, date)
);

-- RLS Policies
ALTER TABLE portfolio_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_performance_history ENABLE ROW LEVEL SECURITY;

-- Portfolio summary policies
CREATE POLICY "Users can manage own portfolio summary" ON portfolio_summary
    FOR ALL USING (auth.uid() = user_id);

-- Portfolio holdings policies
CREATE POLICY "Users can manage own portfolio holdings" ON portfolio_holdings
    FOR ALL USING (auth.uid() = user_id);

-- Dashboard config policies
CREATE POLICY "Users can manage own dashboard config" ON dashboard_config
    FOR ALL USING (auth.uid() = user_id);

-- Portfolio performance history policies
CREATE POLICY "Users can view own performance history" ON portfolio_performance_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance history" ON portfolio_performance_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_portfolio_summary_user_id ON portfolio_summary(user_id);
CREATE INDEX idx_portfolio_summary_vault_id ON portfolio_summary(vault_id);
CREATE INDEX idx_portfolio_summary_updated ON portfolio_summary(last_updated DESC);

CREATE INDEX idx_portfolio_holdings_user_id ON portfolio_holdings(user_id);
CREATE INDEX idx_portfolio_holdings_vault_id ON portfolio_holdings(vault_id);
CREATE INDEX idx_portfolio_holdings_symbol ON portfolio_holdings(symbol);
CREATE INDEX idx_portfolio_holdings_updated ON portfolio_holdings(last_updated DESC);

CREATE INDEX idx_dashboard_config_user_id ON dashboard_config(user_id);

CREATE INDEX idx_performance_history_user_id ON portfolio_performance_history(user_id);
CREATE INDEX idx_performance_history_vault_id ON portfolio_performance_history(vault_id);
CREATE INDEX idx_performance_history_date ON portfolio_performance_history(date DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_portfolio_summary_updated_at
    BEFORE UPDATE ON portfolio_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_holdings_updated_at
    BEFORE UPDATE ON portfolio_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_config_updated_at
    BEFORE UPDATE ON dashboard_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for portfolio calculations
CREATE OR REPLACE FUNCTION calculate_portfolio_summary(p_user_id UUID, p_vault_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    summary_id UUID;
    total_value DECIMAL;
    holdings_value DECIMAL;
    asset_count INTEGER;
BEGIN
    -- Calculate current portfolio metrics
    SELECT 
        COALESCE(SUM(market_value), 0),
        COUNT(DISTINCT symbol)
    INTO holdings_value, asset_count
    FROM portfolio_holdings
    WHERE user_id = p_user_id 
    AND (p_vault_id IS NULL OR vault_id = p_vault_id);
    
    -- Get cash balance (placeholder - would integrate with actual cash tracking)
    total_value := holdings_value; -- + cash_balance when available
    
    -- Insert or update portfolio summary
    INSERT INTO portfolio_summary (
        user_id, vault_id, total_value, holdings_value, 
        asset_count, last_updated
    )
    VALUES (
        p_user_id, p_vault_id, total_value, holdings_value,
        asset_count, NOW()
    )
    ON CONFLICT (user_id, vault_id, DATE(last_updated))
    DO UPDATE SET
        total_value = EXCLUDED.total_value,
        holdings_value = EXCLUDED.holdings_value,
        asset_count = EXCLUDED.asset_count,
        last_updated = EXCLUDED.last_updated
    RETURNING id INTO summary_id;
    
    RETURN summary_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_portfolio_holding(
    p_user_id UUID,
    p_vault_id UUID,
    p_symbol TEXT,
    p_quantity DECIMAL,
    p_current_price DECIMAL,
    p_broker_account TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    holding_id UUID;
    market_value DECIMAL;
    portfolio_percent DECIMAL;
    total_portfolio_value DECIMAL;
BEGIN
    market_value := p_quantity * p_current_price;
    
    -- Get total portfolio value for percentage calculation
    SELECT total_value INTO total_portfolio_value
    FROM portfolio_summary
    WHERE user_id = p_user_id 
    AND (p_vault_id IS NULL OR vault_id = p_vault_id)
    ORDER BY last_updated DESC
    LIMIT 1;
    
    portfolio_percent := CASE 
        WHEN total_portfolio_value > 0 THEN (market_value / total_portfolio_value) * 100
        ELSE 0
    END;
    
    -- Insert or update holding
    INSERT INTO portfolio_holdings (
        user_id, vault_id, symbol, quantity, current_price,
        market_value, portfolio_percent, broker_account, last_updated
    )
    VALUES (
        p_user_id, p_vault_id, p_symbol, p_quantity, p_current_price,
        market_value, portfolio_percent, p_broker_account, NOW()
    )
    ON CONFLICT (user_id, vault_id, symbol, broker_account)
    DO UPDATE SET
        quantity = EXCLUDED.quantity,
        current_price = EXCLUDED.current_price,
        market_value = EXCLUDED.market_value,
        portfolio_percent = EXCLUDED.portfolio_percent,
        last_updated = EXCLUDED.last_updated
    RETURNING id INTO holding_id;
    
    RETURN holding_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_default_dashboard_config(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    config_id UUID;
BEGIN
    INSERT INTO dashboard_config (user_id)
    VALUES (p_user_id)
    RETURNING id INTO config_id;
    
    RETURN config_id;
END;
$$ LANGUAGE plpgsql; 
-- Comprehensive portfolio dashboard data and analytics

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Portfolio Summary Table
CREATE TABLE IF NOT EXISTS portfolio_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vault_id UUID,
    
    -- Summary Metrics
    total_value DECIMAL(18,2) NOT NULL DEFAULT 0,
    cash_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    holdings_value DECIMAL(18,2) NOT NULL DEFAULT 0,
    net_worth DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    -- Change Metrics
    change_value DECIMAL(18,2) DEFAULT 0,
    change_percent DECIMAL(5,2) DEFAULT 0,
    day_change_value DECIMAL(18,2) DEFAULT 0,
    day_change_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Performance Metrics
    total_return DECIMAL(18,2) DEFAULT 0,
    total_return_percent DECIMAL(5,2) DEFAULT 0,
    annualized_return DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(5,4) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    volatility DECIMAL(5,2) DEFAULT 0,
    
    -- Asset Breakdown
    asset_count INTEGER DEFAULT 0,
    asset_class_breakdown JSONB DEFAULT '{}',
    sector_breakdown JSONB DEFAULT '{}',
    geographic_breakdown JSONB DEFAULT '{}',
    
    -- Risk Metrics
    portfolio_beta DECIMAL(5,4) DEFAULT 0,
    var_95 DECIMAL(5,2) DEFAULT 0,
    correlation_spy DECIMAL(5,4) DEFAULT 0,
    
    -- Update Information
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    data_source TEXT DEFAULT 'calculated',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, vault_id, DATE(last_updated))
);

-- Portfolio Holdings Table
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vault_id UUID,
    
    -- Asset Details
    symbol TEXT NOT NULL,
    asset_name TEXT,
    asset_class TEXT,
    sector TEXT,
    market TEXT DEFAULT 'NZX',
    
    -- Position Details
    quantity DECIMAL(18,8) NOT NULL DEFAULT 0,
    average_cost DECIMAL(18,8) DEFAULT 0,
    current_price DECIMAL(18,8) DEFAULT 0,
    market_value DECIMAL(18,2) NOT NULL DEFAULT 0,
    cost_basis DECIMAL(18,2) DEFAULT 0,
    
    -- Performance
    unrealized_pnl DECIMAL(18,2) DEFAULT 0,
    unrealized_pnl_percent DECIMAL(5,2) DEFAULT 0,
    day_change DECIMAL(18,2) DEFAULT 0,
    day_change_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Allocation
    portfolio_percent DECIMAL(5,2) DEFAULT 0,
    target_percent DECIMAL(5,2) DEFAULT 0,
    allocation_drift DECIMAL(5,2) DEFAULT 0,
    
    -- Broker Information
    broker_account TEXT,
    account_type TEXT,
    
    -- Last Update
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    price_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, vault_id, symbol, broker_account),
    CHECK (quantity >= 0),
    CHECK (current_price >= 0),
    CHECK (market_value >= 0)
);

-- Dashboard Configuration Table
CREATE TABLE IF NOT EXISTS dashboard_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Display Preferences
    default_currency TEXT DEFAULT 'NZD',
    default_time_zone TEXT DEFAULT 'Pacific/Auckland',
    refresh_interval INTEGER DEFAULT 300, -- seconds
    auto_refresh BOOLEAN DEFAULT true,
    
    -- Chart Preferences
    chart_time_range TEXT DEFAULT '1y',
    show_benchmark BOOLEAN DEFAULT true,
    benchmark_symbol TEXT DEFAULT 'SPY',
    
    -- Metric Preferences
    preferred_metrics TEXT[] DEFAULT ARRAY['total_value', 'day_change', 'total_return', 'asset_count'],
    show_advanced_metrics BOOLEAN DEFAULT false,
    
    -- Notification Settings
    alert_on_large_moves BOOLEAN DEFAULT true,
    large_move_threshold DECIMAL(5,2) DEFAULT 5.0,
    
    -- Data Sources
    preferred_data_source TEXT DEFAULT 'real_time',
    include_paper_trading BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Portfolio Performance History Table
CREATE TABLE IF NOT EXISTS portfolio_performance_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vault_id UUID,
    
    -- Time Series Data
    date DATE NOT NULL,
    portfolio_value DECIMAL(18,2) NOT NULL,
    cash_balance DECIMAL(18,2) DEFAULT 0,
    holdings_value DECIMAL(18,2) DEFAULT 0,
    
    -- Daily Performance
    daily_return DECIMAL(5,4) DEFAULT 0,
    daily_return_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Cumulative Performance
    cumulative_return DECIMAL(18,2) DEFAULT 0,
    cumulative_return_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Benchmark Comparison
    benchmark_value DECIMAL(18,2),
    benchmark_return DECIMAL(5,4) DEFAULT 0,
    alpha DECIMAL(5,4) DEFAULT 0,
    
    -- Volume and Activity
    trade_count INTEGER DEFAULT 0,
    trade_volume DECIMAL(18,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, vault_id, date)
);

-- RLS Policies
ALTER TABLE portfolio_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_performance_history ENABLE ROW LEVEL SECURITY;

-- Portfolio summary policies
CREATE POLICY "Users can manage own portfolio summary" ON portfolio_summary
    FOR ALL USING (auth.uid() = user_id);

-- Portfolio holdings policies
CREATE POLICY "Users can manage own portfolio holdings" ON portfolio_holdings
    FOR ALL USING (auth.uid() = user_id);

-- Dashboard config policies
CREATE POLICY "Users can manage own dashboard config" ON dashboard_config
    FOR ALL USING (auth.uid() = user_id);

-- Portfolio performance history policies
CREATE POLICY "Users can view own performance history" ON portfolio_performance_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance history" ON portfolio_performance_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_portfolio_summary_user_id ON portfolio_summary(user_id);
CREATE INDEX idx_portfolio_summary_vault_id ON portfolio_summary(vault_id);
CREATE INDEX idx_portfolio_summary_updated ON portfolio_summary(last_updated DESC);

CREATE INDEX idx_portfolio_holdings_user_id ON portfolio_holdings(user_id);
CREATE INDEX idx_portfolio_holdings_vault_id ON portfolio_holdings(vault_id);
CREATE INDEX idx_portfolio_holdings_symbol ON portfolio_holdings(symbol);
CREATE INDEX idx_portfolio_holdings_updated ON portfolio_holdings(last_updated DESC);

CREATE INDEX idx_dashboard_config_user_id ON dashboard_config(user_id);

CREATE INDEX idx_performance_history_user_id ON portfolio_performance_history(user_id);
CREATE INDEX idx_performance_history_vault_id ON portfolio_performance_history(vault_id);
CREATE INDEX idx_performance_history_date ON portfolio_performance_history(date DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_portfolio_summary_updated_at
    BEFORE UPDATE ON portfolio_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_holdings_updated_at
    BEFORE UPDATE ON portfolio_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_config_updated_at
    BEFORE UPDATE ON dashboard_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for portfolio calculations
CREATE OR REPLACE FUNCTION calculate_portfolio_summary(p_user_id UUID, p_vault_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    summary_id UUID;
    total_value DECIMAL;
    holdings_value DECIMAL;
    asset_count INTEGER;
BEGIN
    -- Calculate current portfolio metrics
    SELECT 
        COALESCE(SUM(market_value), 0),
        COUNT(DISTINCT symbol)
    INTO holdings_value, asset_count
    FROM portfolio_holdings
    WHERE user_id = p_user_id 
    AND (p_vault_id IS NULL OR vault_id = p_vault_id);
    
    -- Get cash balance (placeholder - would integrate with actual cash tracking)
    total_value := holdings_value; -- + cash_balance when available
    
    -- Insert or update portfolio summary
    INSERT INTO portfolio_summary (
        user_id, vault_id, total_value, holdings_value, 
        asset_count, last_updated
    )
    VALUES (
        p_user_id, p_vault_id, total_value, holdings_value,
        asset_count, NOW()
    )
    ON CONFLICT (user_id, vault_id, DATE(last_updated))
    DO UPDATE SET
        total_value = EXCLUDED.total_value,
        holdings_value = EXCLUDED.holdings_value,
        asset_count = EXCLUDED.asset_count,
        last_updated = EXCLUDED.last_updated
    RETURNING id INTO summary_id;
    
    RETURN summary_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_portfolio_holding(
    p_user_id UUID,
    p_vault_id UUID,
    p_symbol TEXT,
    p_quantity DECIMAL,
    p_current_price DECIMAL,
    p_broker_account TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    holding_id UUID;
    market_value DECIMAL;
    portfolio_percent DECIMAL;
    total_portfolio_value DECIMAL;
BEGIN
    market_value := p_quantity * p_current_price;
    
    -- Get total portfolio value for percentage calculation
    SELECT total_value INTO total_portfolio_value
    FROM portfolio_summary
    WHERE user_id = p_user_id 
    AND (p_vault_id IS NULL OR vault_id = p_vault_id)
    ORDER BY last_updated DESC
    LIMIT 1;
    
    portfolio_percent := CASE 
        WHEN total_portfolio_value > 0 THEN (market_value / total_portfolio_value) * 100
        ELSE 0
    END;
    
    -- Insert or update holding
    INSERT INTO portfolio_holdings (
        user_id, vault_id, symbol, quantity, current_price,
        market_value, portfolio_percent, broker_account, last_updated
    )
    VALUES (
        p_user_id, p_vault_id, p_symbol, p_quantity, p_current_price,
        market_value, portfolio_percent, p_broker_account, NOW()
    )
    ON CONFLICT (user_id, vault_id, symbol, broker_account)
    DO UPDATE SET
        quantity = EXCLUDED.quantity,
        current_price = EXCLUDED.current_price,
        market_value = EXCLUDED.market_value,
        portfolio_percent = EXCLUDED.portfolio_percent,
        last_updated = EXCLUDED.last_updated
    RETURNING id INTO holding_id;
    
    RETURN holding_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_default_dashboard_config(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    config_id UUID;
BEGIN
    INSERT INTO dashboard_config (user_id)
    VALUES (p_user_id)
    RETURNING id INTO config_id;
    
    RETURN config_id;
END;
$$ LANGUAGE plpgsql; 