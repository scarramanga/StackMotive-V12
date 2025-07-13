-- Block 48: Rotation Aggression Control - Database Schema
-- User rotation preferences and risk tolerance settings

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- User Rotation Preferences Table
CREATE TABLE IF NOT EXISTS user_rotation_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core Rotation Settings
    rotation_aggression_level INTEGER NOT NULL DEFAULT 5 CHECK (rotation_aggression_level >= 1 AND rotation_aggression_level <= 10),
    rotation_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (rotation_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'manual')),
    max_rotation_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.0 CHECK (max_rotation_percentage >= 0 AND max_rotation_percentage <= 100),
    min_rotation_threshold DECIMAL(5,2) NOT NULL DEFAULT 5.0 CHECK (min_rotation_threshold >= 0 AND min_rotation_threshold <= 50),
    
    -- Risk Tolerance Settings
    risk_tolerance TEXT NOT NULL DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive', 'very_aggressive')),
    volatility_tolerance DECIMAL(5,2) NOT NULL DEFAULT 15.0 CHECK (volatility_tolerance >= 0 AND volatility_tolerance <= 100),
    drawdown_tolerance DECIMAL(5,2) NOT NULL DEFAULT 10.0 CHECK (drawdown_tolerance >= 0 AND drawdown_tolerance <= 50),
    
    -- Rebalancing Controls
    auto_rebalance_enabled BOOLEAN NOT NULL DEFAULT true,
    rebalance_trigger_threshold DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    max_single_trade_size DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    cash_buffer_percentage DECIMAL(5,2) NOT NULL DEFAULT 2.0,
    
    -- Strategy Rotation Settings
    strategy_rotation_enabled BOOLEAN NOT NULL DEFAULT true,
    max_active_strategies INTEGER NOT NULL DEFAULT 3 CHECK (max_active_strategies >= 1 AND max_active_strategies <= 10),
    strategy_change_frequency TEXT NOT NULL DEFAULT 'monthly',
    momentum_factor DECIMAL(5,4) NOT NULL DEFAULT 0.5000,
    mean_reversion_factor DECIMAL(5,4) NOT NULL DEFAULT 0.3000,
    
    -- Tax Optimization
    tax_loss_harvesting_enabled BOOLEAN NOT NULL DEFAULT true,
    tax_optimization_priority INTEGER NOT NULL DEFAULT 5 CHECK (tax_optimization_priority >= 1 AND tax_optimization_priority <= 10),
    wash_sale_avoidance BOOLEAN NOT NULL DEFAULT true,
    
    -- Market Conditions Response
    bear_market_protection BOOLEAN NOT NULL DEFAULT true,
    bull_market_aggression BOOLEAN NOT NULL DEFAULT false,
    volatility_scaling BOOLEAN NOT NULL DEFAULT true,
    correlation_adjustment BOOLEAN NOT NULL DEFAULT true,
    
    -- AU/NZ Specific Settings
    nz_tax_optimization BOOLEAN NOT NULL DEFAULT true,
    franking_credits_consideration BOOLEAN NOT NULL DEFAULT true,
    currency_hedging_preference TEXT DEFAULT 'auto' CHECK (currency_hedging_preference IN ('auto', 'hedge_all', 'hedge_none', 'selective')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_applied_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(user_id)
);

-- Rotation History Table
CREATE TABLE IF NOT EXISTS rotation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rotation_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Rotation Details
    rotation_type TEXT NOT NULL CHECK (rotation_type IN ('automatic', 'manual', 'triggered', 'scheduled')),
    aggression_level INTEGER NOT NULL,
    assets_rotated INTEGER NOT NULL DEFAULT 0,
    total_rotation_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    -- Performance Impact
    expected_return_improvement DECIMAL(5,2) DEFAULT 0,
    risk_reduction_achieved DECIMAL(5,2) DEFAULT 0,
    transaction_costs DECIMAL(18,2) DEFAULT 0,
    tax_impact DECIMAL(18,2) DEFAULT 0,
    
    -- Market Context
    market_volatility DECIMAL(5,2) DEFAULT 0,
    market_trend TEXT CHECK (market_trend IN ('bullish', 'bearish', 'neutral', 'volatile')),
    rotation_trigger TEXT,
    
    -- Metadata
    rotation_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rotation Performance Metrics Table
CREATE TABLE IF NOT EXISTS rotation_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    measurement_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Performance Metrics
    rotation_success_rate DECIMAL(5,2) DEFAULT 0,
    avg_rotation_return DECIMAL(5,2) DEFAULT 0,
    rotation_sharpe_ratio DECIMAL(5,4) DEFAULT 0,
    rotation_volatility DECIMAL(5,2) DEFAULT 0,
    
    -- Cost Analysis
    total_transaction_costs DECIMAL(18,2) DEFAULT 0,
    cost_per_rotation DECIMAL(18,2) DEFAULT 0,
    tax_efficiency_score DECIMAL(5,2) DEFAULT 0,
    
    -- Risk Metrics
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    var_95 DECIMAL(5,2) DEFAULT 0,
    beta_to_market DECIMAL(5,4) DEFAULT 0,
    
    -- Rotation Statistics
    total_rotations INTEGER DEFAULT 0,
    successful_rotations INTEGER DEFAULT 0,
    avg_holding_period INTEGER DEFAULT 0, -- days
    
    -- Metadata
    calculation_period TEXT DEFAULT '30d',
    metrics_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_rotation_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotation_performance_metrics ENABLE ROW LEVEL SECURITY;

-- User rotation preferences policies
CREATE POLICY "Users can view own rotation preferences" ON user_rotation_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own rotation preferences" ON user_rotation_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rotation preferences" ON user_rotation_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rotation preferences" ON user_rotation_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Rotation history policies
CREATE POLICY "Users can view own rotation history" ON rotation_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rotation history" ON rotation_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Performance metrics policies
CREATE POLICY "Users can view own rotation metrics" ON rotation_performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rotation metrics" ON rotation_performance_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_rotation_preferences_user_id ON user_rotation_preferences(user_id);
CREATE INDEX idx_rotation_history_user_id ON rotation_history(user_id);
CREATE INDEX idx_rotation_history_date ON rotation_history(rotation_date DESC);
CREATE INDEX idx_rotation_performance_user_id ON rotation_performance_metrics(user_id);
CREATE INDEX idx_rotation_performance_date ON rotation_performance_metrics(measurement_date DESC);

-- Updated timestamp trigger
CREATE TRIGGER update_user_rotation_preferences_updated_at
    BEFORE UPDATE ON user_rotation_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for rotation management
CREATE OR REPLACE FUNCTION create_default_rotation_preferences(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    preference_id UUID;
BEGIN
    INSERT INTO user_rotation_preferences (user_id)
    VALUES (p_user_id)
    RETURNING id INTO preference_id;
    
    RETURN preference_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_rotation_score(
    p_user_id UUID,
    p_current_allocation JSONB,
    p_target_allocation JSONB
)
RETURNS DECIMAL AS $$
DECLARE
    rotation_score DECIMAL := 0;
    aggression_level INTEGER;
    max_rotation DECIMAL;
BEGIN
    -- Get user's rotation preferences
    SELECT rotation_aggression_level, max_rotation_percentage
    INTO aggression_level, max_rotation
    FROM user_rotation_preferences
    WHERE user_id = p_user_id;
    
    -- Calculate allocation drift and rotation necessity
    -- This is a simplified calculation - would be more complex in production
    rotation_score := aggression_level * 0.1;
    
    RETURN rotation_score;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_rotation_event(
    p_user_id UUID,
    p_rotation_type TEXT,
    p_aggression_level INTEGER,
    p_assets_rotated INTEGER,
    p_rotation_amount DECIMAL,
    p_rotation_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
BEGIN
    INSERT INTO rotation_history (
        user_id, rotation_type, aggression_level, assets_rotated, 
        total_rotation_amount, rotation_data
    )
    VALUES (
        p_user_id, p_rotation_type, p_aggression_level, p_assets_rotated,
        p_rotation_amount, p_rotation_data
    )
    RETURNING id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_applied_at when preferences are updated
CREATE OR REPLACE FUNCTION update_rotation_applied_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_applied_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rotation_applied_at
    BEFORE UPDATE ON user_rotation_preferences
    FOR EACH ROW EXECUTE FUNCTION update_rotation_applied_timestamp(); 
-- User rotation preferences and risk tolerance settings

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- User Rotation Preferences Table
CREATE TABLE IF NOT EXISTS user_rotation_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core Rotation Settings
    rotation_aggression_level INTEGER NOT NULL DEFAULT 5 CHECK (rotation_aggression_level >= 1 AND rotation_aggression_level <= 10),
    rotation_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (rotation_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'manual')),
    max_rotation_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.0 CHECK (max_rotation_percentage >= 0 AND max_rotation_percentage <= 100),
    min_rotation_threshold DECIMAL(5,2) NOT NULL DEFAULT 5.0 CHECK (min_rotation_threshold >= 0 AND min_rotation_threshold <= 50),
    
    -- Risk Tolerance Settings
    risk_tolerance TEXT NOT NULL DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive', 'very_aggressive')),
    volatility_tolerance DECIMAL(5,2) NOT NULL DEFAULT 15.0 CHECK (volatility_tolerance >= 0 AND volatility_tolerance <= 100),
    drawdown_tolerance DECIMAL(5,2) NOT NULL DEFAULT 10.0 CHECK (drawdown_tolerance >= 0 AND drawdown_tolerance <= 50),
    
    -- Rebalancing Controls
    auto_rebalance_enabled BOOLEAN NOT NULL DEFAULT true,
    rebalance_trigger_threshold DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    max_single_trade_size DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    cash_buffer_percentage DECIMAL(5,2) NOT NULL DEFAULT 2.0,
    
    -- Strategy Rotation Settings
    strategy_rotation_enabled BOOLEAN NOT NULL DEFAULT true,
    max_active_strategies INTEGER NOT NULL DEFAULT 3 CHECK (max_active_strategies >= 1 AND max_active_strategies <= 10),
    strategy_change_frequency TEXT NOT NULL DEFAULT 'monthly',
    momentum_factor DECIMAL(5,4) NOT NULL DEFAULT 0.5000,
    mean_reversion_factor DECIMAL(5,4) NOT NULL DEFAULT 0.3000,
    
    -- Tax Optimization
    tax_loss_harvesting_enabled BOOLEAN NOT NULL DEFAULT true,
    tax_optimization_priority INTEGER NOT NULL DEFAULT 5 CHECK (tax_optimization_priority >= 1 AND tax_optimization_priority <= 10),
    wash_sale_avoidance BOOLEAN NOT NULL DEFAULT true,
    
    -- Market Conditions Response
    bear_market_protection BOOLEAN NOT NULL DEFAULT true,
    bull_market_aggression BOOLEAN NOT NULL DEFAULT false,
    volatility_scaling BOOLEAN NOT NULL DEFAULT true,
    correlation_adjustment BOOLEAN NOT NULL DEFAULT true,
    
    -- AU/NZ Specific Settings
    nz_tax_optimization BOOLEAN NOT NULL DEFAULT true,
    franking_credits_consideration BOOLEAN NOT NULL DEFAULT true,
    currency_hedging_preference TEXT DEFAULT 'auto' CHECK (currency_hedging_preference IN ('auto', 'hedge_all', 'hedge_none', 'selective')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_applied_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(user_id)
);

-- Rotation History Table
CREATE TABLE IF NOT EXISTS rotation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rotation_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Rotation Details
    rotation_type TEXT NOT NULL CHECK (rotation_type IN ('automatic', 'manual', 'triggered', 'scheduled')),
    aggression_level INTEGER NOT NULL,
    assets_rotated INTEGER NOT NULL DEFAULT 0,
    total_rotation_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    -- Performance Impact
    expected_return_improvement DECIMAL(5,2) DEFAULT 0,
    risk_reduction_achieved DECIMAL(5,2) DEFAULT 0,
    transaction_costs DECIMAL(18,2) DEFAULT 0,
    tax_impact DECIMAL(18,2) DEFAULT 0,
    
    -- Market Context
    market_volatility DECIMAL(5,2) DEFAULT 0,
    market_trend TEXT CHECK (market_trend IN ('bullish', 'bearish', 'neutral', 'volatile')),
    rotation_trigger TEXT,
    
    -- Metadata
    rotation_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rotation Performance Metrics Table
CREATE TABLE IF NOT EXISTS rotation_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    measurement_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Performance Metrics
    rotation_success_rate DECIMAL(5,2) DEFAULT 0,
    avg_rotation_return DECIMAL(5,2) DEFAULT 0,
    rotation_sharpe_ratio DECIMAL(5,4) DEFAULT 0,
    rotation_volatility DECIMAL(5,2) DEFAULT 0,
    
    -- Cost Analysis
    total_transaction_costs DECIMAL(18,2) DEFAULT 0,
    cost_per_rotation DECIMAL(18,2) DEFAULT 0,
    tax_efficiency_score DECIMAL(5,2) DEFAULT 0,
    
    -- Risk Metrics
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    var_95 DECIMAL(5,2) DEFAULT 0,
    beta_to_market DECIMAL(5,4) DEFAULT 0,
    
    -- Rotation Statistics
    total_rotations INTEGER DEFAULT 0,
    successful_rotations INTEGER DEFAULT 0,
    avg_holding_period INTEGER DEFAULT 0, -- days
    
    -- Metadata
    calculation_period TEXT DEFAULT '30d',
    metrics_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_rotation_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotation_performance_metrics ENABLE ROW LEVEL SECURITY;

-- User rotation preferences policies
CREATE POLICY "Users can view own rotation preferences" ON user_rotation_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own rotation preferences" ON user_rotation_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rotation preferences" ON user_rotation_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rotation preferences" ON user_rotation_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Rotation history policies
CREATE POLICY "Users can view own rotation history" ON rotation_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rotation history" ON rotation_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Performance metrics policies
CREATE POLICY "Users can view own rotation metrics" ON rotation_performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rotation metrics" ON rotation_performance_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_rotation_preferences_user_id ON user_rotation_preferences(user_id);
CREATE INDEX idx_rotation_history_user_id ON rotation_history(user_id);
CREATE INDEX idx_rotation_history_date ON rotation_history(rotation_date DESC);
CREATE INDEX idx_rotation_performance_user_id ON rotation_performance_metrics(user_id);
CREATE INDEX idx_rotation_performance_date ON rotation_performance_metrics(measurement_date DESC);

-- Updated timestamp trigger
CREATE TRIGGER update_user_rotation_preferences_updated_at
    BEFORE UPDATE ON user_rotation_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for rotation management
CREATE OR REPLACE FUNCTION create_default_rotation_preferences(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    preference_id UUID;
BEGIN
    INSERT INTO user_rotation_preferences (user_id)
    VALUES (p_user_id)
    RETURNING id INTO preference_id;
    
    RETURN preference_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_rotation_score(
    p_user_id UUID,
    p_current_allocation JSONB,
    p_target_allocation JSONB
)
RETURNS DECIMAL AS $$
DECLARE
    rotation_score DECIMAL := 0;
    aggression_level INTEGER;
    max_rotation DECIMAL;
BEGIN
    -- Get user's rotation preferences
    SELECT rotation_aggression_level, max_rotation_percentage
    INTO aggression_level, max_rotation
    FROM user_rotation_preferences
    WHERE user_id = p_user_id;
    
    -- Calculate allocation drift and rotation necessity
    -- This is a simplified calculation - would be more complex in production
    rotation_score := aggression_level * 0.1;
    
    RETURN rotation_score;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_rotation_event(
    p_user_id UUID,
    p_rotation_type TEXT,
    p_aggression_level INTEGER,
    p_assets_rotated INTEGER,
    p_rotation_amount DECIMAL,
    p_rotation_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
BEGIN
    INSERT INTO rotation_history (
        user_id, rotation_type, aggression_level, assets_rotated, 
        total_rotation_amount, rotation_data
    )
    VALUES (
        p_user_id, p_rotation_type, p_aggression_level, p_assets_rotated,
        p_rotation_amount, p_rotation_data
    )
    RETURNING id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_applied_at when preferences are updated
CREATE OR REPLACE FUNCTION update_rotation_applied_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_applied_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rotation_applied_at
    BEFORE UPDATE ON user_rotation_preferences
    FOR EACH ROW EXECUTE FUNCTION update_rotation_applied_timestamp(); 