-- Block 58: Auto-Trim Toggle - Database Schema
-- Automated position trimming and profit-taking system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Auto Trim Settings Table
CREATE TABLE IF NOT EXISTS auto_trim_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Global Settings
    auto_trim_enabled BOOLEAN NOT NULL DEFAULT false,
    default_trim_threshold DECIMAL(5,2) DEFAULT 20.0 CHECK (default_trim_threshold > 0 AND default_trim_threshold <= 100),
    default_trim_percentage DECIMAL(5,2) DEFAULT 25.0 CHECK (default_trim_percentage > 0 AND default_trim_percentage <= 100),
    
    -- Trigger Conditions
    trigger_on_percentage_gain BOOLEAN DEFAULT true,
    trigger_on_dollar_gain BOOLEAN DEFAULT false,
    trigger_on_volatility_spike BOOLEAN DEFAULT false,
    trigger_on_overbought_rsi BOOLEAN DEFAULT false,
    
    -- Risk Management
    max_position_size_percent DECIMAL(5,2) DEFAULT 10.0,
    min_position_value DECIMAL(18,2) DEFAULT 1000.00,
    preserve_core_holdings BOOLEAN DEFAULT true,
    
    -- Tax Optimization
    consider_tax_implications BOOLEAN DEFAULT true,
    avoid_short_term_gains BOOLEAN DEFAULT true,
    min_holding_period_days INTEGER DEFAULT 365,
    
    -- Execution Settings
    trim_execution_method TEXT DEFAULT 'market' CHECK (trim_execution_method IN ('market', 'limit', 'trailing_stop')),
    execution_time_preference TEXT DEFAULT 'market_open' CHECK (execution_time_preference IN ('immediate', 'market_open', 'market_close', 'scheduled')),
    
    -- Notification Settings
    notify_before_trim BOOLEAN DEFAULT true,
    notification_delay_minutes INTEGER DEFAULT 60,
    require_manual_approval BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Asset-Specific Trim Rules Table
CREATE TABLE IF NOT EXISTS asset_trim_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Asset Identification
    symbol TEXT NOT NULL,
    asset_name TEXT,
    asset_class TEXT,
    
    -- Trim Rules
    is_auto_trim_enabled BOOLEAN DEFAULT true,
    trim_threshold DECIMAL(5,2) DEFAULT 20.0,
    trim_percentage DECIMAL(5,2) DEFAULT 25.0,
    
    -- Custom Conditions
    custom_trigger_conditions JSONB DEFAULT '{}',
    max_trim_per_period INTEGER DEFAULT 1,
    trim_cooldown_days INTEGER DEFAULT 30,
    
    -- Position Limits
    max_position_percent DECIMAL(5,2) DEFAULT 10.0,
    target_position_percent DECIMAL(5,2) DEFAULT 5.0,
    min_position_value DECIMAL(18,2) DEFAULT 500.00,
    
    -- Core Holding Settings
    is_core_holding BOOLEAN DEFAULT false,
    core_holding_percent DECIMAL(5,2) DEFAULT 0,
    never_trim_below_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Tax Settings
    consider_capital_gains BOOLEAN DEFAULT true,
    preferred_holding_period INTEGER DEFAULT 365,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_trim_date TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, symbol)
);

-- Trim Execution History Table
CREATE TABLE IF NOT EXISTS trim_execution_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Execution Details
    execution_date TIMESTAMPTZ DEFAULT NOW(),
    symbol TEXT NOT NULL,
    execution_type TEXT DEFAULT 'auto' CHECK (execution_type IN ('auto', 'manual', 'scheduled')),
    
    -- Trade Details
    shares_trimmed DECIMAL(18,8) NOT NULL,
    trim_price DECIMAL(18,8) NOT NULL,
    trim_value DECIMAL(18,2) NOT NULL,
    trim_percentage DECIMAL(5,2) NOT NULL,
    
    -- Position Context
    position_before_trim DECIMAL(18,8) NOT NULL,
    position_after_trim DECIMAL(18,8) NOT NULL,
    portfolio_percent_before DECIMAL(5,2),
    portfolio_percent_after DECIMAL(5,2),
    
    -- Performance Context
    gain_realized DECIMAL(18,2) DEFAULT 0,
    gain_percentage DECIMAL(5,2) DEFAULT 0,
    holding_period_days INTEGER,
    cost_basis DECIMAL(18,8),
    
    -- Trigger Information
    trigger_condition TEXT NOT NULL,
    trigger_value DECIMAL(18,2),
    rsi_at_trim DECIMAL(5,2),
    volatility_at_trim DECIMAL(5,2),
    
    -- Tax Impact
    capital_gains_tax DECIMAL(18,2) DEFAULT 0,
    is_short_term_gain BOOLEAN DEFAULT false,
    
    -- Execution Quality
    execution_status TEXT DEFAULT 'completed' CHECK (execution_status IN ('pending', 'completed', 'failed', 'cancelled')),
    slippage_bps INTEGER DEFAULT 0,
    execution_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trim Alerts Table
CREATE TABLE IF NOT EXISTS trim_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Alert Details
    alert_date TIMESTAMPTZ DEFAULT NOW(),
    symbol TEXT NOT NULL,
    alert_type TEXT DEFAULT 'threshold_reached' CHECK (alert_type IN ('threshold_reached', 'manual_review', 'tax_warning', 'error')),
    
    -- Alert Context
    current_gain_percent DECIMAL(5,2),
    current_position_percent DECIMAL(5,2),
    suggested_trim_percent DECIMAL(5,2),
    suggested_trim_value DECIMAL(18,2),
    
    -- Alert Status
    alert_status TEXT DEFAULT 'pending' CHECK (alert_status IN ('pending', 'approved', 'rejected', 'expired')),
    user_response TEXT,
    response_date TIMESTAMPTZ,
    
    -- Auto-Execution
    auto_execute_after TIMESTAMPTZ,
    execution_id UUID REFERENCES trim_execution_history(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE auto_trim_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_trim_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE trim_execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trim_alerts ENABLE ROW LEVEL SECURITY;

-- Auto trim settings policies
CREATE POLICY "Users can manage own auto trim settings" ON auto_trim_settings
    FOR ALL USING (auth.uid() = user_id);

-- Asset trim rules policies
CREATE POLICY "Users can manage own asset trim rules" ON asset_trim_rules
    FOR ALL USING (auth.uid() = user_id);

-- Trim execution history policies
CREATE POLICY "Users can view own trim history" ON trim_execution_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trim history" ON trim_execution_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trim alerts policies
CREATE POLICY "Users can manage own trim alerts" ON trim_alerts
    FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_auto_trim_settings_user_id ON auto_trim_settings(user_id);
CREATE INDEX idx_auto_trim_settings_enabled ON auto_trim_settings(user_id, auto_trim_enabled);

CREATE INDEX idx_asset_trim_rules_user_id ON asset_trim_rules(user_id);
CREATE INDEX idx_asset_trim_rules_symbol ON asset_trim_rules(symbol);
CREATE INDEX idx_asset_trim_rules_enabled ON asset_trim_rules(user_id, is_auto_trim_enabled);
CREATE INDEX idx_asset_trim_rules_active ON asset_trim_rules(user_id, is_active);

CREATE INDEX idx_trim_history_user_id ON trim_execution_history(user_id);
CREATE INDEX idx_trim_history_symbol ON trim_execution_history(symbol);
CREATE INDEX idx_trim_history_date ON trim_execution_history(execution_date DESC);
CREATE INDEX idx_trim_history_type ON trim_execution_history(execution_type);

CREATE INDEX idx_trim_alerts_user_id ON trim_alerts(user_id);
CREATE INDEX idx_trim_alerts_symbol ON trim_alerts(symbol);
CREATE INDEX idx_trim_alerts_status ON trim_alerts(alert_status);
CREATE INDEX idx_trim_alerts_date ON trim_alerts(alert_date DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_auto_trim_settings_updated_at
    BEFORE UPDATE ON auto_trim_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_trim_rules_updated_at
    BEFORE UPDATE ON asset_trim_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions
CREATE OR REPLACE FUNCTION create_default_auto_trim_settings(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    settings_id UUID;
BEGIN
    INSERT INTO auto_trim_settings (user_id)
    VALUES (p_user_id)
    RETURNING id INTO settings_id;
    
    RETURN settings_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_trim_conditions(
    p_user_id UUID,
    p_symbol TEXT,
    p_current_price DECIMAL,
    p_current_gain_percent DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    global_settings RECORD;
    asset_rules RECORD;
    should_trim BOOLEAN := false;
BEGIN
    -- Get global settings
    SELECT * INTO global_settings
    FROM auto_trim_settings
    WHERE user_id = p_user_id;
    
    IF NOT global_settings.auto_trim_enabled THEN
        RETURN false;
    END IF;
    
    -- Get asset-specific rules
    SELECT * INTO asset_rules
    FROM asset_trim_rules
    WHERE user_id = p_user_id AND symbol = p_symbol AND is_active = true;
    
    -- Use asset-specific rules if available, otherwise use global defaults
    IF asset_rules.is_auto_trim_enabled AND p_current_gain_percent >= COALESCE(asset_rules.trim_threshold, global_settings.default_trim_threshold) THEN
        should_trim := true;
    END IF;
    
    RETURN should_trim;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_trim_amount(
    p_user_id UUID,
    p_symbol TEXT,
    p_current_position DECIMAL,
    p_current_value DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    global_settings RECORD;
    asset_rules RECORD;
    trim_percentage DECIMAL;
    trim_amount DECIMAL;
BEGIN
    -- Get settings
    SELECT * INTO global_settings
    FROM auto_trim_settings
    WHERE user_id = p_user_id;
    
    SELECT * INTO asset_rules
    FROM asset_trim_rules
    WHERE user_id = p_user_id AND symbol = p_symbol AND is_active = true;
    
    -- Determine trim percentage
    trim_percentage := COALESCE(asset_rules.trim_percentage, global_settings.default_trim_percentage);
    
    -- Calculate trim amount
    trim_amount := p_current_position * (trim_percentage / 100.0);
    
    -- Apply minimum position constraints
    IF asset_rules.is_core_holding AND asset_rules.never_trim_below_percent > 0 THEN
        -- Ensure we don't trim below core holding threshold
        trim_amount := LEAST(trim_amount, p_current_position - (p_current_position * asset_rules.never_trim_below_percent / 100.0));
    END IF;
    
    RETURN GREATEST(0, trim_amount);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_trim_execution(
    p_user_id UUID,
    p_symbol TEXT,
    p_shares_trimmed DECIMAL,
    p_trim_price DECIMAL,
    p_trigger_condition TEXT,
    p_execution_type TEXT DEFAULT 'auto'
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
    trim_value DECIMAL;
BEGIN
    trim_value := p_shares_trimmed * p_trim_price;
    
    INSERT INTO trim_execution_history (
        user_id, symbol, shares_trimmed, trim_price, trim_value,
        trigger_condition, execution_type
    )
    VALUES (
        p_user_id, p_symbol, p_shares_trimmed, p_trim_price, trim_value,
        p_trigger_condition, p_execution_type
    )
    RETURNING id INTO history_id;
    
    -- Update last trim date in asset rules
    UPDATE asset_trim_rules
    SET last_trim_date = NOW()
    WHERE user_id = p_user_id AND symbol = p_symbol;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql; 
-- Automated position trimming and profit-taking system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Auto Trim Settings Table
CREATE TABLE IF NOT EXISTS auto_trim_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Global Settings
    auto_trim_enabled BOOLEAN NOT NULL DEFAULT false,
    default_trim_threshold DECIMAL(5,2) DEFAULT 20.0 CHECK (default_trim_threshold > 0 AND default_trim_threshold <= 100),
    default_trim_percentage DECIMAL(5,2) DEFAULT 25.0 CHECK (default_trim_percentage > 0 AND default_trim_percentage <= 100),
    
    -- Trigger Conditions
    trigger_on_percentage_gain BOOLEAN DEFAULT true,
    trigger_on_dollar_gain BOOLEAN DEFAULT false,
    trigger_on_volatility_spike BOOLEAN DEFAULT false,
    trigger_on_overbought_rsi BOOLEAN DEFAULT false,
    
    -- Risk Management
    max_position_size_percent DECIMAL(5,2) DEFAULT 10.0,
    min_position_value DECIMAL(18,2) DEFAULT 1000.00,
    preserve_core_holdings BOOLEAN DEFAULT true,
    
    -- Tax Optimization
    consider_tax_implications BOOLEAN DEFAULT true,
    avoid_short_term_gains BOOLEAN DEFAULT true,
    min_holding_period_days INTEGER DEFAULT 365,
    
    -- Execution Settings
    trim_execution_method TEXT DEFAULT 'market' CHECK (trim_execution_method IN ('market', 'limit', 'trailing_stop')),
    execution_time_preference TEXT DEFAULT 'market_open' CHECK (execution_time_preference IN ('immediate', 'market_open', 'market_close', 'scheduled')),
    
    -- Notification Settings
    notify_before_trim BOOLEAN DEFAULT true,
    notification_delay_minutes INTEGER DEFAULT 60,
    require_manual_approval BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Asset-Specific Trim Rules Table
CREATE TABLE IF NOT EXISTS asset_trim_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Asset Identification
    symbol TEXT NOT NULL,
    asset_name TEXT,
    asset_class TEXT,
    
    -- Trim Rules
    is_auto_trim_enabled BOOLEAN DEFAULT true,
    trim_threshold DECIMAL(5,2) DEFAULT 20.0,
    trim_percentage DECIMAL(5,2) DEFAULT 25.0,
    
    -- Custom Conditions
    custom_trigger_conditions JSONB DEFAULT '{}',
    max_trim_per_period INTEGER DEFAULT 1,
    trim_cooldown_days INTEGER DEFAULT 30,
    
    -- Position Limits
    max_position_percent DECIMAL(5,2) DEFAULT 10.0,
    target_position_percent DECIMAL(5,2) DEFAULT 5.0,
    min_position_value DECIMAL(18,2) DEFAULT 500.00,
    
    -- Core Holding Settings
    is_core_holding BOOLEAN DEFAULT false,
    core_holding_percent DECIMAL(5,2) DEFAULT 0,
    never_trim_below_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Tax Settings
    consider_capital_gains BOOLEAN DEFAULT true,
    preferred_holding_period INTEGER DEFAULT 365,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_trim_date TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, symbol)
);

-- Trim Execution History Table
CREATE TABLE IF NOT EXISTS trim_execution_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Execution Details
    execution_date TIMESTAMPTZ DEFAULT NOW(),
    symbol TEXT NOT NULL,
    execution_type TEXT DEFAULT 'auto' CHECK (execution_type IN ('auto', 'manual', 'scheduled')),
    
    -- Trade Details
    shares_trimmed DECIMAL(18,8) NOT NULL,
    trim_price DECIMAL(18,8) NOT NULL,
    trim_value DECIMAL(18,2) NOT NULL,
    trim_percentage DECIMAL(5,2) NOT NULL,
    
    -- Position Context
    position_before_trim DECIMAL(18,8) NOT NULL,
    position_after_trim DECIMAL(18,8) NOT NULL,
    portfolio_percent_before DECIMAL(5,2),
    portfolio_percent_after DECIMAL(5,2),
    
    -- Performance Context
    gain_realized DECIMAL(18,2) DEFAULT 0,
    gain_percentage DECIMAL(5,2) DEFAULT 0,
    holding_period_days INTEGER,
    cost_basis DECIMAL(18,8),
    
    -- Trigger Information
    trigger_condition TEXT NOT NULL,
    trigger_value DECIMAL(18,2),
    rsi_at_trim DECIMAL(5,2),
    volatility_at_trim DECIMAL(5,2),
    
    -- Tax Impact
    capital_gains_tax DECIMAL(18,2) DEFAULT 0,
    is_short_term_gain BOOLEAN DEFAULT false,
    
    -- Execution Quality
    execution_status TEXT DEFAULT 'completed' CHECK (execution_status IN ('pending', 'completed', 'failed', 'cancelled')),
    slippage_bps INTEGER DEFAULT 0,
    execution_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trim Alerts Table
CREATE TABLE IF NOT EXISTS trim_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Alert Details
    alert_date TIMESTAMPTZ DEFAULT NOW(),
    symbol TEXT NOT NULL,
    alert_type TEXT DEFAULT 'threshold_reached' CHECK (alert_type IN ('threshold_reached', 'manual_review', 'tax_warning', 'error')),
    
    -- Alert Context
    current_gain_percent DECIMAL(5,2),
    current_position_percent DECIMAL(5,2),
    suggested_trim_percent DECIMAL(5,2),
    suggested_trim_value DECIMAL(18,2),
    
    -- Alert Status
    alert_status TEXT DEFAULT 'pending' CHECK (alert_status IN ('pending', 'approved', 'rejected', 'expired')),
    user_response TEXT,
    response_date TIMESTAMPTZ,
    
    -- Auto-Execution
    auto_execute_after TIMESTAMPTZ,
    execution_id UUID REFERENCES trim_execution_history(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE auto_trim_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_trim_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE trim_execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trim_alerts ENABLE ROW LEVEL SECURITY;

-- Auto trim settings policies
CREATE POLICY "Users can manage own auto trim settings" ON auto_trim_settings
    FOR ALL USING (auth.uid() = user_id);

-- Asset trim rules policies
CREATE POLICY "Users can manage own asset trim rules" ON asset_trim_rules
    FOR ALL USING (auth.uid() = user_id);

-- Trim execution history policies
CREATE POLICY "Users can view own trim history" ON trim_execution_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trim history" ON trim_execution_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trim alerts policies
CREATE POLICY "Users can manage own trim alerts" ON trim_alerts
    FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_auto_trim_settings_user_id ON auto_trim_settings(user_id);
CREATE INDEX idx_auto_trim_settings_enabled ON auto_trim_settings(user_id, auto_trim_enabled);

CREATE INDEX idx_asset_trim_rules_user_id ON asset_trim_rules(user_id);
CREATE INDEX idx_asset_trim_rules_symbol ON asset_trim_rules(symbol);
CREATE INDEX idx_asset_trim_rules_enabled ON asset_trim_rules(user_id, is_auto_trim_enabled);
CREATE INDEX idx_asset_trim_rules_active ON asset_trim_rules(user_id, is_active);

CREATE INDEX idx_trim_history_user_id ON trim_execution_history(user_id);
CREATE INDEX idx_trim_history_symbol ON trim_execution_history(symbol);
CREATE INDEX idx_trim_history_date ON trim_execution_history(execution_date DESC);
CREATE INDEX idx_trim_history_type ON trim_execution_history(execution_type);

CREATE INDEX idx_trim_alerts_user_id ON trim_alerts(user_id);
CREATE INDEX idx_trim_alerts_symbol ON trim_alerts(symbol);
CREATE INDEX idx_trim_alerts_status ON trim_alerts(alert_status);
CREATE INDEX idx_trim_alerts_date ON trim_alerts(alert_date DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_auto_trim_settings_updated_at
    BEFORE UPDATE ON auto_trim_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_trim_rules_updated_at
    BEFORE UPDATE ON asset_trim_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions
CREATE OR REPLACE FUNCTION create_default_auto_trim_settings(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    settings_id UUID;
BEGIN
    INSERT INTO auto_trim_settings (user_id)
    VALUES (p_user_id)
    RETURNING id INTO settings_id;
    
    RETURN settings_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_trim_conditions(
    p_user_id UUID,
    p_symbol TEXT,
    p_current_price DECIMAL,
    p_current_gain_percent DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    global_settings RECORD;
    asset_rules RECORD;
    should_trim BOOLEAN := false;
BEGIN
    -- Get global settings
    SELECT * INTO global_settings
    FROM auto_trim_settings
    WHERE user_id = p_user_id;
    
    IF NOT global_settings.auto_trim_enabled THEN
        RETURN false;
    END IF;
    
    -- Get asset-specific rules
    SELECT * INTO asset_rules
    FROM asset_trim_rules
    WHERE user_id = p_user_id AND symbol = p_symbol AND is_active = true;
    
    -- Use asset-specific rules if available, otherwise use global defaults
    IF asset_rules.is_auto_trim_enabled AND p_current_gain_percent >= COALESCE(asset_rules.trim_threshold, global_settings.default_trim_threshold) THEN
        should_trim := true;
    END IF;
    
    RETURN should_trim;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_trim_amount(
    p_user_id UUID,
    p_symbol TEXT,
    p_current_position DECIMAL,
    p_current_value DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    global_settings RECORD;
    asset_rules RECORD;
    trim_percentage DECIMAL;
    trim_amount DECIMAL;
BEGIN
    -- Get settings
    SELECT * INTO global_settings
    FROM auto_trim_settings
    WHERE user_id = p_user_id;
    
    SELECT * INTO asset_rules
    FROM asset_trim_rules
    WHERE user_id = p_user_id AND symbol = p_symbol AND is_active = true;
    
    -- Determine trim percentage
    trim_percentage := COALESCE(asset_rules.trim_percentage, global_settings.default_trim_percentage);
    
    -- Calculate trim amount
    trim_amount := p_current_position * (trim_percentage / 100.0);
    
    -- Apply minimum position constraints
    IF asset_rules.is_core_holding AND asset_rules.never_trim_below_percent > 0 THEN
        -- Ensure we don't trim below core holding threshold
        trim_amount := LEAST(trim_amount, p_current_position - (p_current_position * asset_rules.never_trim_below_percent / 100.0));
    END IF;
    
    RETURN GREATEST(0, trim_amount);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_trim_execution(
    p_user_id UUID,
    p_symbol TEXT,
    p_shares_trimmed DECIMAL,
    p_trim_price DECIMAL,
    p_trigger_condition TEXT,
    p_execution_type TEXT DEFAULT 'auto'
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
    trim_value DECIMAL;
BEGIN
    trim_value := p_shares_trimmed * p_trim_price;
    
    INSERT INTO trim_execution_history (
        user_id, symbol, shares_trimmed, trim_price, trim_value,
        trigger_condition, execution_type
    )
    VALUES (
        p_user_id, p_symbol, p_shares_trimmed, p_trim_price, trim_value,
        p_trigger_condition, p_execution_type
    )
    RETURNING id INTO history_id;
    
    -- Update last trim date in asset rules
    UPDATE asset_trim_rules
    SET last_trim_date = NOW()
    WHERE user_id = p_user_id AND symbol = p_symbol;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql; 