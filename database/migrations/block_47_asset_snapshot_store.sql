-- Block 47: Asset Snapshot Store - Database Schema
-- Time-based snapshot storage for portfolio metrics and analytics

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Asset Snapshots Table
CREATE TABLE IF NOT EXISTS asset_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_id UUID,
    snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'manual', 'rebalance', 'event')),
    snapshot_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Asset Details
    symbol TEXT NOT NULL,
    asset_name TEXT,
    asset_class TEXT,
    sector TEXT,
    market TEXT DEFAULT 'NZX',
    
    -- Price and Quantity Data
    quantity DECIMAL(18,8) NOT NULL DEFAULT 0,
    price_per_unit DECIMAL(18,8) NOT NULL DEFAULT 0,
    market_value DECIMAL(18,2) NOT NULL DEFAULT 0,
    cost_basis DECIMAL(18,2) DEFAULT 0,
    unrealized_gain_loss DECIMAL(18,2) DEFAULT 0,
    realized_gain_loss DECIMAL(18,2) DEFAULT 0,
    
    -- Allocation Data
    target_allocation_percent DECIMAL(5,2) DEFAULT 0,
    actual_allocation_percent DECIMAL(5,2) DEFAULT 0,
    allocation_drift DECIMAL(5,2) DEFAULT 0,
    
    -- Performance Metrics
    day_change DECIMAL(18,2) DEFAULT 0,
    day_change_percent DECIMAL(5,2) DEFAULT 0,
    week_change DECIMAL(18,2) DEFAULT 0,
    week_change_percent DECIMAL(5,2) DEFAULT 0,
    month_change DECIMAL(18,2) DEFAULT 0,
    month_change_percent DECIMAL(5,2) DEFAULT 0,
    ytd_change DECIMAL(18,2) DEFAULT 0,
    ytd_change_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Risk Metrics
    volatility DECIMAL(5,4) DEFAULT 0,
    beta DECIMAL(5,4) DEFAULT 0,
    sharpe_ratio DECIMAL(5,4) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    
    -- Strategy Assignment
    strategy_id TEXT,
    strategy_name TEXT,
    strategy_weight DECIMAL(5,2) DEFAULT 0,
    
    -- Metadata
    snapshot_source TEXT DEFAULT 'automatic',
    snapshot_trigger TEXT, -- rebalance, schedule, manual, etc.
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_percentages CHECK (
        actual_allocation_percent >= 0 AND actual_allocation_percent <= 100 AND
        target_allocation_percent >= 0 AND target_allocation_percent <= 100
    )
);

-- Portfolio Snapshots Summary Table
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_id UUID,
    snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'manual', 'rebalance', 'event')),
    snapshot_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Portfolio Totals
    total_market_value DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_cost_basis DECIMAL(18,2) DEFAULT 0,
    total_unrealized_gain_loss DECIMAL(18,2) DEFAULT 0,
    total_realized_gain_loss DECIMAL(18,2) DEFAULT 0,
    cash_balance DECIMAL(18,2) DEFAULT 0,
    
    -- Performance Metrics
    portfolio_day_change DECIMAL(18,2) DEFAULT 0,
    portfolio_day_change_percent DECIMAL(5,2) DEFAULT 0,
    portfolio_week_change DECIMAL(18,2) DEFAULT 0,
    portfolio_week_change_percent DECIMAL(5,2) DEFAULT 0,
    portfolio_month_change DECIMAL(18,2) DEFAULT 0,
    portfolio_month_change_percent DECIMAL(5,2) DEFAULT 0,
    portfolio_ytd_change DECIMAL(18,2) DEFAULT 0,
    portfolio_ytd_change_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Risk and Diversification
    portfolio_volatility DECIMAL(5,4) DEFAULT 0,
    portfolio_beta DECIMAL(5,4) DEFAULT 0,
    portfolio_sharpe_ratio DECIMAL(5,4) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    diversification_score DECIMAL(5,2) DEFAULT 0,
    concentration_risk DECIMAL(5,2) DEFAULT 0,
    
    -- Asset Class Breakdown (JSON for flexibility)
    asset_class_breakdown JSONB DEFAULT '{}',
    sector_breakdown JSONB DEFAULT '{}',
    geographic_breakdown JSONB DEFAULT '{}',
    strategy_breakdown JSONB DEFAULT '{}',
    
    -- Counts
    total_positions INTEGER DEFAULT 0,
    active_strategies INTEGER DEFAULT 0,
    
    -- Snapshot Metadata
    snapshot_source TEXT DEFAULT 'automatic',
    snapshot_trigger TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snapshot Retention Policy Table
CREATE TABLE IF NOT EXISTS snapshot_retention_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_type TEXT NOT NULL,
    retention_days INTEGER NOT NULL DEFAULT 365,
    max_snapshots INTEGER DEFAULT 1000,
    auto_cleanup BOOLEAN DEFAULT true,
    compression_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, snapshot_type)
);

-- RLS Policies
ALTER TABLE asset_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshot_retention_policies ENABLE ROW LEVEL SECURITY;

-- Asset snapshots policies
CREATE POLICY "Users can view own asset snapshots" ON asset_snapshots
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own asset snapshots" ON asset_snapshots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own asset snapshots" ON asset_snapshots
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own asset snapshots" ON asset_snapshots
    FOR DELETE USING (auth.uid() = user_id);

-- Portfolio snapshots policies
CREATE POLICY "Users can view own portfolio snapshots" ON portfolio_snapshots
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio snapshots" ON portfolio_snapshots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio snapshots" ON portfolio_snapshots
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio snapshots" ON portfolio_snapshots
    FOR DELETE USING (auth.uid() = user_id);

-- Retention policies
CREATE POLICY "Users can manage own retention policies" ON snapshot_retention_policies
    FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_asset_snapshots_user_id ON asset_snapshots(user_id);
CREATE INDEX idx_asset_snapshots_timestamp ON asset_snapshots(snapshot_timestamp DESC);
CREATE INDEX idx_asset_snapshots_symbol ON asset_snapshots(symbol);
CREATE INDEX idx_asset_snapshots_type ON asset_snapshots(snapshot_type);
CREATE INDEX idx_asset_snapshots_user_symbol_time ON asset_snapshots(user_id, symbol, snapshot_timestamp DESC);

CREATE INDEX idx_portfolio_snapshots_user_id ON portfolio_snapshots(user_id);
CREATE INDEX idx_portfolio_snapshots_timestamp ON portfolio_snapshots(snapshot_timestamp DESC);
CREATE INDEX idx_portfolio_snapshots_type ON portfolio_snapshots(snapshot_type);
CREATE INDEX idx_portfolio_snapshots_user_time ON portfolio_snapshots(user_id, snapshot_timestamp DESC);

CREATE INDEX idx_snapshot_retention_user_id ON snapshot_retention_policies(user_id);

-- Functions for snapshot management
CREATE OR REPLACE FUNCTION create_asset_snapshot(
    p_user_id UUID,
    p_symbol TEXT,
    p_quantity DECIMAL,
    p_price DECIMAL,
    p_snapshot_type TEXT DEFAULT 'manual',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    snapshot_id UUID;
    market_value DECIMAL;
BEGIN
    market_value := p_quantity * p_price;
    
    INSERT INTO asset_snapshots (
        user_id, symbol, quantity, price_per_unit, market_value, 
        snapshot_type, metadata, snapshot_source
    )
    VALUES (
        p_user_id, p_symbol, p_quantity, p_price, market_value,
        p_snapshot_type, p_metadata, 'function'
    )
    RETURNING id INTO snapshot_id;
    
    RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_portfolio_snapshot(
    p_user_id UUID,
    p_snapshot_type TEXT DEFAULT 'manual',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    snapshot_id UUID;
    total_value DECIMAL := 0;
    total_positions INTEGER := 0;
BEGIN
    -- Calculate portfolio totals from current asset snapshots
    SELECT 
        COALESCE(SUM(market_value), 0),
        COUNT(DISTINCT symbol)
    INTO total_value, total_positions
    FROM asset_snapshots
    WHERE user_id = p_user_id
    AND snapshot_timestamp >= NOW() - INTERVAL '1 day';
    
    INSERT INTO portfolio_snapshots (
        user_id, snapshot_type, total_market_value, 
        total_positions, metadata, snapshot_source
    )
    VALUES (
        p_user_id, p_snapshot_type, total_value,
        total_positions, p_metadata, 'function'
    )
    RETURNING id INTO snapshot_id;
    
    RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for old snapshots
CREATE OR REPLACE FUNCTION cleanup_old_snapshots()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    policy RECORD;
BEGIN
    -- Loop through retention policies
    FOR policy IN 
        SELECT user_id, snapshot_type, retention_days, max_snapshots, auto_cleanup
        FROM snapshot_retention_policies
        WHERE auto_cleanup = true
    LOOP
        -- Delete old asset snapshots based on retention days
        DELETE FROM asset_snapshots
        WHERE user_id = policy.user_id
        AND snapshot_type = policy.snapshot_type
        AND snapshot_timestamp < NOW() - (policy.retention_days || ' days')::INTERVAL;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        -- If max_snapshots is set, delete excess snapshots
        IF policy.max_snapshots IS NOT NULL THEN
            DELETE FROM asset_snapshots
            WHERE id IN (
                SELECT id FROM asset_snapshots
                WHERE user_id = policy.user_id
                AND snapshot_type = policy.snapshot_type
                ORDER BY snapshot_timestamp DESC
                OFFSET policy.max_snapshots
            );
        END IF;
        
        -- Same cleanup for portfolio snapshots
        DELETE FROM portfolio_snapshots
        WHERE user_id = policy.user_id
        AND snapshot_type = policy.snapshot_type
        AND snapshot_timestamp < NOW() - (policy.retention_days || ' days')::INTERVAL;
        
        IF policy.max_snapshots IS NOT NULL THEN
            DELETE FROM portfolio_snapshots
            WHERE id IN (
                SELECT id FROM portfolio_snapshots
                WHERE user_id = policy.user_id
                AND snapshot_type = policy.snapshot_type
                ORDER BY snapshot_timestamp DESC
                OFFSET policy.max_snapshots
            );
        END IF;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create default retention policies for new users
CREATE OR REPLACE FUNCTION create_default_retention_policies(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO snapshot_retention_policies (user_id, snapshot_type, retention_days, max_snapshots)
    VALUES 
        (p_user_id, 'daily', 90, 500),
        (p_user_id, 'weekly', 365, 200),
        (p_user_id, 'monthly', 1095, 100), -- 3 years
        (p_user_id, 'quarterly', 1825, 50), -- 5 years
        (p_user_id, 'manual', 1095, 100),
        (p_user_id, 'rebalance', 1095, 200),
        (p_user_id, 'event', 1095, 100)
    ON CONFLICT (user_id, snapshot_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql; 