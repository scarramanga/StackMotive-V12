-- Block 40: Live Signal Summary Panel - Database Schema
-- Real-time signal aggregation and display system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Live Signals Table
CREATE TABLE IF NOT EXISTS live_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Signal Identification
    signal_id TEXT NOT NULL,
    signal_source TEXT NOT NULL,
    signal_type TEXT NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold', 'watch', 'alert')),
    
    -- Asset Information
    asset_symbol TEXT NOT NULL,
    asset_name TEXT,
    asset_type TEXT DEFAULT 'equity' CHECK (asset_type IN ('equity', 'crypto', 'forex', 'commodity', 'bond')),
    
    -- Signal Data
    signal_strength DECIMAL(5,2) DEFAULT 0, -- 0-100
    confidence_score DECIMAL(5,2) DEFAULT 0, -- 0-100
    priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Signal Content
    signal_title TEXT NOT NULL,
    signal_description TEXT,
    signal_rationale TEXT,
    action_required TEXT,
    
    -- Price Information
    current_price DECIMAL(15,8),
    target_price DECIMAL(15,8),
    stop_loss_price DECIMAL(15,8),
    price_change DECIMAL(15,8),
    price_change_pct DECIMAL(8,4),
    
    -- Timing
    signal_timestamp TIMESTAMPTZ NOT NULL,
    expiry_timestamp TIMESTAMPTZ,
    
    -- Status
    signal_status TEXT DEFAULT 'active' CHECK (signal_status IN ('active', 'expired', 'triggered', 'cancelled', 'acknowledged')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(signal_id, signal_source)
);

-- Signal Summary Aggregations Table
CREATE TABLE IF NOT EXISTS signal_summary_aggregations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Aggregation Period
    aggregation_period TEXT NOT NULL CHECK (aggregation_period IN ('5min', '15min', '1hour', '4hour', 'daily')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Signal Counts
    total_signals INTEGER DEFAULT 0,
    buy_signals INTEGER DEFAULT 0,
    sell_signals INTEGER DEFAULT 0,
    hold_signals INTEGER DEFAULT 0,
    watch_signals INTEGER DEFAULT 0,
    alert_signals INTEGER DEFAULT 0,
    
    -- Priority Distribution
    critical_signals INTEGER DEFAULT 0,
    high_priority_signals INTEGER DEFAULT 0,
    medium_priority_signals INTEGER DEFAULT 0,
    low_priority_signals INTEGER DEFAULT 0,
    
    -- Asset Type Distribution
    equity_signals INTEGER DEFAULT 0,
    crypto_signals INTEGER DEFAULT 0,
    forex_signals INTEGER DEFAULT 0,
    commodity_signals INTEGER DEFAULT 0,
    
    -- Performance Metrics
    avg_confidence_score DECIMAL(5,2) DEFAULT 0,
    avg_signal_strength DECIMAL(5,2) DEFAULT 0,
    top_assets JSONB DEFAULT '[]',
    signal_sources JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, aggregation_period, period_start)
);

-- Signal Subscriptions Table
CREATE TABLE IF NOT EXISTS signal_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Subscription Details
    subscription_name TEXT NOT NULL,
    signal_source TEXT NOT NULL,
    
    -- Filter Criteria
    asset_symbols TEXT[] DEFAULT ARRAY[]::TEXT[],
    signal_types TEXT[] DEFAULT ARRAY[]::TEXT[],
    min_confidence_score DECIMAL(5,2) DEFAULT 0,
    min_signal_strength DECIMAL(5,2) DEFAULT 0,
    priority_levels TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Subscription Settings
    is_active BOOLEAN DEFAULT true,
    real_time_updates BOOLEAN DEFAULT true,
    notification_enabled BOOLEAN DEFAULT false,
    
    -- Limits
    max_signals_per_hour INTEGER DEFAULT 100,
    max_signals_per_day INTEGER DEFAULT 1000,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, subscription_name)
);

-- Signal Actions Table
CREATE TABLE IF NOT EXISTS signal_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Signal Reference
    signal_id UUID NOT NULL REFERENCES live_signals(id) ON DELETE CASCADE,
    
    -- Action Details
    action_type TEXT NOT NULL CHECK (action_type IN ('acknowledge', 'dismiss', 'follow', 'trade', 'watchlist_add')),
    action_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Action Context
    action_data JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Results
    result_status TEXT CHECK (result_status IN ('pending', 'completed', 'failed', 'cancelled')),
    result_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signal Performance Tracking Table
CREATE TABLE IF NOT EXISTS signal_performance_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Signal Reference
    signal_id UUID NOT NULL REFERENCES live_signals(id) ON DELETE CASCADE,
    
    -- Performance Metrics
    tracking_date DATE DEFAULT CURRENT_DATE,
    price_at_signal DECIMAL(15,8),
    current_price DECIMAL(15,8),
    price_change DECIMAL(15,8),
    price_change_pct DECIMAL(8,4),
    
    -- Signal Accuracy
    signal_accurate BOOLEAN,
    accuracy_reason TEXT,
    
    -- Time to Target
    target_hit BOOLEAN DEFAULT false,
    target_hit_timestamp TIMESTAMPTZ,
    days_to_target INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(signal_id, tracking_date)
);

-- Live Signal Summary Settings Table
CREATE TABLE IF NOT EXISTS live_signal_summary_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Display Settings
    max_signals_displayed INTEGER DEFAULT 50,
    auto_refresh_interval INTEGER DEFAULT 30, -- seconds
    default_time_filter TEXT DEFAULT '24h',
    
    -- Grouping Settings
    group_by_asset BOOLEAN DEFAULT false,
    group_by_source BOOLEAN DEFAULT true,
    group_by_type BOOLEAN DEFAULT false,
    
    -- Filter Settings
    default_signal_types TEXT[] DEFAULT ARRAY['buy', 'sell', 'alert']::TEXT[],
    default_priority_filter TEXT[] DEFAULT ARRAY['medium', 'high', 'critical']::TEXT[],
    min_confidence_threshold DECIMAL(5,2) DEFAULT 70,
    
    -- Alert Settings
    enable_sound_alerts BOOLEAN DEFAULT false,
    enable_desktop_notifications BOOLEAN DEFAULT true,
    alert_for_priority_levels TEXT[] DEFAULT ARRAY['high', 'critical']::TEXT[],
    
    -- Performance Settings
    track_signal_performance BOOLEAN DEFAULT true,
    performance_tracking_days INTEGER DEFAULT 30,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Signal Sources Configuration Table
CREATE TABLE IF NOT EXISTS signal_sources_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Source Details
    source_name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('api', 'webhook', 'manual', 'system')),
    source_url TEXT,
    
    -- Configuration
    api_key TEXT,
    webhook_secret TEXT,
    update_frequency INTEGER DEFAULT 300, -- seconds
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_update TIMESTAMPTZ,
    last_signal_count INTEGER DEFAULT 0,
    
    -- Reliability Metrics
    uptime_percentage DECIMAL(5,2) DEFAULT 100,
    avg_response_time_ms INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, source_name)
);

-- Indexes for performance
CREATE INDEX idx_live_signals_user_id ON live_signals(user_id);
CREATE INDEX idx_live_signals_timestamp ON live_signals(signal_timestamp DESC);
CREATE INDEX idx_live_signals_status ON live_signals(signal_status);
CREATE INDEX idx_live_signals_asset ON live_signals(asset_symbol);
CREATE INDEX idx_live_signals_type ON live_signals(signal_type);
CREATE INDEX idx_live_signals_priority ON live_signals(priority_level);
CREATE INDEX idx_live_signals_source ON live_signals(signal_source);

CREATE INDEX idx_signal_summary_aggregations_user_period ON signal_summary_aggregations(user_id, aggregation_period, period_start DESC);

CREATE INDEX idx_signal_subscriptions_user_id ON signal_subscriptions(user_id);
CREATE INDEX idx_signal_subscriptions_active ON signal_subscriptions(is_active);

CREATE INDEX idx_signal_actions_user_id ON signal_actions(user_id);
CREATE INDEX idx_signal_actions_signal_id ON signal_actions(signal_id);
CREATE INDEX idx_signal_actions_timestamp ON signal_actions(action_timestamp DESC);

CREATE INDEX idx_signal_performance_tracking_user_id ON signal_performance_tracking(user_id);
CREATE INDEX idx_signal_performance_tracking_signal_id ON signal_performance_tracking(signal_id);
CREATE INDEX idx_signal_performance_tracking_date ON signal_performance_tracking(tracking_date DESC);

CREATE INDEX idx_live_signal_summary_settings_user_id ON live_signal_summary_settings(user_id);

CREATE INDEX idx_signal_sources_config_user_id ON signal_sources_config(user_id);
CREATE INDEX idx_signal_sources_config_active ON signal_sources_config(is_active);

-- Functions for signal processing
CREATE OR REPLACE FUNCTION process_incoming_signal(
    p_user_id UUID,
    p_signal_source TEXT,
    p_signal_data JSONB
)
RETURNS UUID AS $$
DECLARE
    signal_id UUID;
    signal_record RECORD;
BEGIN
    -- Extract signal data
    SELECT 
        p_signal_data->>'signal_id' as signal_id,
        p_signal_data->>'signal_type' as signal_type,
        p_signal_data->>'asset_symbol' as asset_symbol,
        p_signal_data->>'signal_title' as signal_title,
        (p_signal_data->>'confidence_score')::DECIMAL as confidence_score,
        (p_signal_data->>'signal_strength')::DECIMAL as signal_strength,
        p_signal_data->>'priority_level' as priority_level,
        p_signal_data->>'signal_description' as signal_description
    INTO signal_record;
    
    -- Insert signal
    INSERT INTO live_signals (
        user_id,
        signal_id,
        signal_source,
        signal_type,
        asset_symbol,
        signal_title,
        signal_description,
        confidence_score,
        signal_strength,
        priority_level,
        current_price,
        signal_timestamp,
        metadata
    )
    VALUES (
        p_user_id,
        signal_record.signal_id,
        p_signal_source,
        signal_record.signal_type,
        signal_record.asset_symbol,
        signal_record.signal_title,
        signal_record.signal_description,
        signal_record.confidence_score,
        signal_record.signal_strength,
        signal_record.priority_level,
        (p_signal_data->>'current_price')::DECIMAL,
        NOW(),
        p_signal_data
    )
    ON CONFLICT (signal_id, signal_source)
    DO UPDATE SET
        signal_type = signal_record.signal_type,
        confidence_score = signal_record.confidence_score,
        signal_strength = signal_record.signal_strength,
        current_price = (p_signal_data->>'current_price')::DECIMAL,
        updated_at = NOW()
    RETURNING id INTO signal_id;
    
    RETURN signal_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION aggregate_signals_for_period(
    p_user_id UUID,
    p_period TEXT,
    p_period_start TIMESTAMPTZ,
    p_period_end TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
    aggregation_id UUID;
    signal_stats RECORD;
BEGIN
    -- Calculate aggregations
    SELECT 
        COUNT(*) as total_signals,
        COUNT(CASE WHEN signal_type = 'buy' THEN 1 END) as buy_signals,
        COUNT(CASE WHEN signal_type = 'sell' THEN 1 END) as sell_signals,
        COUNT(CASE WHEN signal_type = 'hold' THEN 1 END) as hold_signals,
        COUNT(CASE WHEN signal_type = 'watch' THEN 1 END) as watch_signals,
        COUNT(CASE WHEN signal_type = 'alert' THEN 1 END) as alert_signals,
        COUNT(CASE WHEN priority_level = 'critical' THEN 1 END) as critical_signals,
        COUNT(CASE WHEN priority_level = 'high' THEN 1 END) as high_priority_signals,
        COUNT(CASE WHEN priority_level = 'medium' THEN 1 END) as medium_priority_signals,
        COUNT(CASE WHEN priority_level = 'low' THEN 1 END) as low_priority_signals,
        COUNT(CASE WHEN asset_type = 'equity' THEN 1 END) as equity_signals,
        COUNT(CASE WHEN asset_type = 'crypto' THEN 1 END) as crypto_signals,
        AVG(confidence_score) as avg_confidence_score,
        AVG(signal_strength) as avg_signal_strength
    INTO signal_stats
    FROM live_signals
    WHERE user_id = p_user_id
    AND signal_timestamp >= p_period_start
    AND signal_timestamp < p_period_end;
    
    -- Insert aggregation
    INSERT INTO signal_summary_aggregations (
        user_id,
        aggregation_period,
        period_start,
        period_end,
        total_signals,
        buy_signals,
        sell_signals,
        hold_signals,
        watch_signals,
        alert_signals,
        critical_signals,
        high_priority_signals,
        medium_priority_signals,
        low_priority_signals,
        equity_signals,
        crypto_signals,
        avg_confidence_score,
        avg_signal_strength
    )
    VALUES (
        p_user_id,
        p_period,
        p_period_start,
        p_period_end,
        signal_stats.total_signals,
        signal_stats.buy_signals,
        signal_stats.sell_signals,
        signal_stats.hold_signals,
        signal_stats.watch_signals,
        signal_stats.alert_signals,
        signal_stats.critical_signals,
        signal_stats.high_priority_signals,
        signal_stats.medium_priority_signals,
        signal_stats.low_priority_signals,
        signal_stats.equity_signals,
        signal_stats.crypto_signals,
        signal_stats.avg_confidence_score,
        signal_stats.avg_signal_strength
    )
    ON CONFLICT (user_id, aggregation_period, period_start)
    DO UPDATE SET
        total_signals = signal_stats.total_signals,
        buy_signals = signal_stats.buy_signals,
        sell_signals = signal_stats.sell_signals,
        hold_signals = signal_stats.hold_signals,
        watch_signals = signal_stats.watch_signals,
        alert_signals = signal_stats.alert_signals,
        critical_signals = signal_stats.critical_signals,
        high_priority_signals = signal_stats.high_priority_signals,
        medium_priority_signals = signal_stats.medium_priority_signals,
        low_priority_signals = signal_stats.low_priority_signals,
        equity_signals = signal_stats.equity_signals,
        crypto_signals = signal_stats.crypto_signals,
        avg_confidence_score = signal_stats.avg_confidence_score,
        avg_signal_strength = signal_stats.avg_signal_strength
    RETURNING id INTO aggregation_id;
    
    RETURN aggregation_id;
END;
$$ LANGUAGE plpgsql;

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_live_signals_updated_at
    BEFORE UPDATE ON live_signals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_signal_subscriptions_updated_at
    BEFORE UPDATE ON signal_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_live_signal_summary_settings_updated_at
    BEFORE UPDATE ON live_signal_summary_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_signal_sources_config_updated_at
    BEFORE UPDATE ON signal_sources_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE live_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_summary_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_performance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_signal_summary_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_sources_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own signals" ON live_signals
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own aggregations" ON signal_summary_aggregations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own aggregations" ON signal_summary_aggregations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subscriptions" ON signal_subscriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own signal actions" ON signal_actions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own performance tracking" ON signal_performance_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance tracking" ON signal_performance_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own summary settings" ON live_signal_summary_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own signal sources" ON signal_sources_config
    FOR ALL USING (auth.uid() = user_id);

-- Views for common queries
CREATE VIEW active_signals_summary AS
SELECT 
    user_id,
    COUNT(*) as total_active_signals,
    COUNT(CASE WHEN signal_type = 'buy' THEN 1 END) as active_buy_signals,
    COUNT(CASE WHEN signal_type = 'sell' THEN 1 END) as active_sell_signals,
    COUNT(CASE WHEN priority_level = 'critical' THEN 1 END) as critical_signals,
    COUNT(CASE WHEN priority_level = 'high' THEN 1 END) as high_priority_signals,
    AVG(confidence_score) as avg_confidence,
    MAX(signal_timestamp) as latest_signal_time
FROM live_signals
WHERE signal_status = 'active'
GROUP BY user_id;

-- Comments
COMMENT ON TABLE live_signals IS 'Real-time trading signals from various sources';
COMMENT ON TABLE signal_summary_aggregations IS 'Aggregated signal statistics for different time periods';
COMMENT ON TABLE signal_subscriptions IS 'User subscriptions to specific signal sources and filters';
COMMENT ON TABLE signal_actions IS 'User actions taken on signals (acknowledge, follow, trade, etc.)';
COMMENT ON TABLE signal_performance_tracking IS 'Performance tracking of signals over time';
COMMENT ON TABLE live_signal_summary_settings IS 'User preferences for signal display and behavior';
COMMENT ON TABLE signal_sources_config IS 'Configuration for signal data sources'; 
-- Real-time signal aggregation and display system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Live Signals Table
CREATE TABLE IF NOT EXISTS live_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Signal Identification
    signal_id TEXT NOT NULL,
    signal_source TEXT NOT NULL,
    signal_type TEXT NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold', 'watch', 'alert')),
    
    -- Asset Information
    asset_symbol TEXT NOT NULL,
    asset_name TEXT,
    asset_type TEXT DEFAULT 'equity' CHECK (asset_type IN ('equity', 'crypto', 'forex', 'commodity', 'bond')),
    
    -- Signal Data
    signal_strength DECIMAL(5,2) DEFAULT 0, -- 0-100
    confidence_score DECIMAL(5,2) DEFAULT 0, -- 0-100
    priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Signal Content
    signal_title TEXT NOT NULL,
    signal_description TEXT,
    signal_rationale TEXT,
    action_required TEXT,
    
    -- Price Information
    current_price DECIMAL(15,8),
    target_price DECIMAL(15,8),
    stop_loss_price DECIMAL(15,8),
    price_change DECIMAL(15,8),
    price_change_pct DECIMAL(8,4),
    
    -- Timing
    signal_timestamp TIMESTAMPTZ NOT NULL,
    expiry_timestamp TIMESTAMPTZ,
    
    -- Status
    signal_status TEXT DEFAULT 'active' CHECK (signal_status IN ('active', 'expired', 'triggered', 'cancelled', 'acknowledged')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(signal_id, signal_source)
);

-- Signal Summary Aggregations Table
CREATE TABLE IF NOT EXISTS signal_summary_aggregations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Aggregation Period
    aggregation_period TEXT NOT NULL CHECK (aggregation_period IN ('5min', '15min', '1hour', '4hour', 'daily')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Signal Counts
    total_signals INTEGER DEFAULT 0,
    buy_signals INTEGER DEFAULT 0,
    sell_signals INTEGER DEFAULT 0,
    hold_signals INTEGER DEFAULT 0,
    watch_signals INTEGER DEFAULT 0,
    alert_signals INTEGER DEFAULT 0,
    
    -- Priority Distribution
    critical_signals INTEGER DEFAULT 0,
    high_priority_signals INTEGER DEFAULT 0,
    medium_priority_signals INTEGER DEFAULT 0,
    low_priority_signals INTEGER DEFAULT 0,
    
    -- Asset Type Distribution
    equity_signals INTEGER DEFAULT 0,
    crypto_signals INTEGER DEFAULT 0,
    forex_signals INTEGER DEFAULT 0,
    commodity_signals INTEGER DEFAULT 0,
    
    -- Performance Metrics
    avg_confidence_score DECIMAL(5,2) DEFAULT 0,
    avg_signal_strength DECIMAL(5,2) DEFAULT 0,
    top_assets JSONB DEFAULT '[]',
    signal_sources JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, aggregation_period, period_start)
);

-- Signal Subscriptions Table
CREATE TABLE IF NOT EXISTS signal_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Subscription Details
    subscription_name TEXT NOT NULL,
    signal_source TEXT NOT NULL,
    
    -- Filter Criteria
    asset_symbols TEXT[] DEFAULT ARRAY[]::TEXT[],
    signal_types TEXT[] DEFAULT ARRAY[]::TEXT[],
    min_confidence_score DECIMAL(5,2) DEFAULT 0,
    min_signal_strength DECIMAL(5,2) DEFAULT 0,
    priority_levels TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Subscription Settings
    is_active BOOLEAN DEFAULT true,
    real_time_updates BOOLEAN DEFAULT true,
    notification_enabled BOOLEAN DEFAULT false,
    
    -- Limits
    max_signals_per_hour INTEGER DEFAULT 100,
    max_signals_per_day INTEGER DEFAULT 1000,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, subscription_name)
);

-- Signal Actions Table
CREATE TABLE IF NOT EXISTS signal_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Signal Reference
    signal_id UUID NOT NULL REFERENCES live_signals(id) ON DELETE CASCADE,
    
    -- Action Details
    action_type TEXT NOT NULL CHECK (action_type IN ('acknowledge', 'dismiss', 'follow', 'trade', 'watchlist_add')),
    action_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Action Context
    action_data JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Results
    result_status TEXT CHECK (result_status IN ('pending', 'completed', 'failed', 'cancelled')),
    result_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signal Performance Tracking Table
CREATE TABLE IF NOT EXISTS signal_performance_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Signal Reference
    signal_id UUID NOT NULL REFERENCES live_signals(id) ON DELETE CASCADE,
    
    -- Performance Metrics
    tracking_date DATE DEFAULT CURRENT_DATE,
    price_at_signal DECIMAL(15,8),
    current_price DECIMAL(15,8),
    price_change DECIMAL(15,8),
    price_change_pct DECIMAL(8,4),
    
    -- Signal Accuracy
    signal_accurate BOOLEAN,
    accuracy_reason TEXT,
    
    -- Time to Target
    target_hit BOOLEAN DEFAULT false,
    target_hit_timestamp TIMESTAMPTZ,
    days_to_target INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(signal_id, tracking_date)
);

-- Live Signal Summary Settings Table
CREATE TABLE IF NOT EXISTS live_signal_summary_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Display Settings
    max_signals_displayed INTEGER DEFAULT 50,
    auto_refresh_interval INTEGER DEFAULT 30, -- seconds
    default_time_filter TEXT DEFAULT '24h',
    
    -- Grouping Settings
    group_by_asset BOOLEAN DEFAULT false,
    group_by_source BOOLEAN DEFAULT true,
    group_by_type BOOLEAN DEFAULT false,
    
    -- Filter Settings
    default_signal_types TEXT[] DEFAULT ARRAY['buy', 'sell', 'alert']::TEXT[],
    default_priority_filter TEXT[] DEFAULT ARRAY['medium', 'high', 'critical']::TEXT[],
    min_confidence_threshold DECIMAL(5,2) DEFAULT 70,
    
    -- Alert Settings
    enable_sound_alerts BOOLEAN DEFAULT false,
    enable_desktop_notifications BOOLEAN DEFAULT true,
    alert_for_priority_levels TEXT[] DEFAULT ARRAY['high', 'critical']::TEXT[],
    
    -- Performance Settings
    track_signal_performance BOOLEAN DEFAULT true,
    performance_tracking_days INTEGER DEFAULT 30,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Signal Sources Configuration Table
CREATE TABLE IF NOT EXISTS signal_sources_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Source Details
    source_name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('api', 'webhook', 'manual', 'system')),
    source_url TEXT,
    
    -- Configuration
    api_key TEXT,
    webhook_secret TEXT,
    update_frequency INTEGER DEFAULT 300, -- seconds
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_update TIMESTAMPTZ,
    last_signal_count INTEGER DEFAULT 0,
    
    -- Reliability Metrics
    uptime_percentage DECIMAL(5,2) DEFAULT 100,
    avg_response_time_ms INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, source_name)
);

-- Indexes for performance
CREATE INDEX idx_live_signals_user_id ON live_signals(user_id);
CREATE INDEX idx_live_signals_timestamp ON live_signals(signal_timestamp DESC);
CREATE INDEX idx_live_signals_status ON live_signals(signal_status);
CREATE INDEX idx_live_signals_asset ON live_signals(asset_symbol);
CREATE INDEX idx_live_signals_type ON live_signals(signal_type);
CREATE INDEX idx_live_signals_priority ON live_signals(priority_level);
CREATE INDEX idx_live_signals_source ON live_signals(signal_source);

CREATE INDEX idx_signal_summary_aggregations_user_period ON signal_summary_aggregations(user_id, aggregation_period, period_start DESC);

CREATE INDEX idx_signal_subscriptions_user_id ON signal_subscriptions(user_id);
CREATE INDEX idx_signal_subscriptions_active ON signal_subscriptions(is_active);

CREATE INDEX idx_signal_actions_user_id ON signal_actions(user_id);
CREATE INDEX idx_signal_actions_signal_id ON signal_actions(signal_id);
CREATE INDEX idx_signal_actions_timestamp ON signal_actions(action_timestamp DESC);

CREATE INDEX idx_signal_performance_tracking_user_id ON signal_performance_tracking(user_id);
CREATE INDEX idx_signal_performance_tracking_signal_id ON signal_performance_tracking(signal_id);
CREATE INDEX idx_signal_performance_tracking_date ON signal_performance_tracking(tracking_date DESC);

CREATE INDEX idx_live_signal_summary_settings_user_id ON live_signal_summary_settings(user_id);

CREATE INDEX idx_signal_sources_config_user_id ON signal_sources_config(user_id);
CREATE INDEX idx_signal_sources_config_active ON signal_sources_config(is_active);

-- Functions for signal processing
CREATE OR REPLACE FUNCTION process_incoming_signal(
    p_user_id UUID,
    p_signal_source TEXT,
    p_signal_data JSONB
)
RETURNS UUID AS $$
DECLARE
    signal_id UUID;
    signal_record RECORD;
BEGIN
    -- Extract signal data
    SELECT 
        p_signal_data->>'signal_id' as signal_id,
        p_signal_data->>'signal_type' as signal_type,
        p_signal_data->>'asset_symbol' as asset_symbol,
        p_signal_data->>'signal_title' as signal_title,
        (p_signal_data->>'confidence_score')::DECIMAL as confidence_score,
        (p_signal_data->>'signal_strength')::DECIMAL as signal_strength,
        p_signal_data->>'priority_level' as priority_level,
        p_signal_data->>'signal_description' as signal_description
    INTO signal_record;
    
    -- Insert signal
    INSERT INTO live_signals (
        user_id,
        signal_id,
        signal_source,
        signal_type,
        asset_symbol,
        signal_title,
        signal_description,
        confidence_score,
        signal_strength,
        priority_level,
        current_price,
        signal_timestamp,
        metadata
    )
    VALUES (
        p_user_id,
        signal_record.signal_id,
        p_signal_source,
        signal_record.signal_type,
        signal_record.asset_symbol,
        signal_record.signal_title,
        signal_record.signal_description,
        signal_record.confidence_score,
        signal_record.signal_strength,
        signal_record.priority_level,
        (p_signal_data->>'current_price')::DECIMAL,
        NOW(),
        p_signal_data
    )
    ON CONFLICT (signal_id, signal_source)
    DO UPDATE SET
        signal_type = signal_record.signal_type,
        confidence_score = signal_record.confidence_score,
        signal_strength = signal_record.signal_strength,
        current_price = (p_signal_data->>'current_price')::DECIMAL,
        updated_at = NOW()
    RETURNING id INTO signal_id;
    
    RETURN signal_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION aggregate_signals_for_period(
    p_user_id UUID,
    p_period TEXT,
    p_period_start TIMESTAMPTZ,
    p_period_end TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
    aggregation_id UUID;
    signal_stats RECORD;
BEGIN
    -- Calculate aggregations
    SELECT 
        COUNT(*) as total_signals,
        COUNT(CASE WHEN signal_type = 'buy' THEN 1 END) as buy_signals,
        COUNT(CASE WHEN signal_type = 'sell' THEN 1 END) as sell_signals,
        COUNT(CASE WHEN signal_type = 'hold' THEN 1 END) as hold_signals,
        COUNT(CASE WHEN signal_type = 'watch' THEN 1 END) as watch_signals,
        COUNT(CASE WHEN signal_type = 'alert' THEN 1 END) as alert_signals,
        COUNT(CASE WHEN priority_level = 'critical' THEN 1 END) as critical_signals,
        COUNT(CASE WHEN priority_level = 'high' THEN 1 END) as high_priority_signals,
        COUNT(CASE WHEN priority_level = 'medium' THEN 1 END) as medium_priority_signals,
        COUNT(CASE WHEN priority_level = 'low' THEN 1 END) as low_priority_signals,
        COUNT(CASE WHEN asset_type = 'equity' THEN 1 END) as equity_signals,
        COUNT(CASE WHEN asset_type = 'crypto' THEN 1 END) as crypto_signals,
        AVG(confidence_score) as avg_confidence_score,
        AVG(signal_strength) as avg_signal_strength
    INTO signal_stats
    FROM live_signals
    WHERE user_id = p_user_id
    AND signal_timestamp >= p_period_start
    AND signal_timestamp < p_period_end;
    
    -- Insert aggregation
    INSERT INTO signal_summary_aggregations (
        user_id,
        aggregation_period,
        period_start,
        period_end,
        total_signals,
        buy_signals,
        sell_signals,
        hold_signals,
        watch_signals,
        alert_signals,
        critical_signals,
        high_priority_signals,
        medium_priority_signals,
        low_priority_signals,
        equity_signals,
        crypto_signals,
        avg_confidence_score,
        avg_signal_strength
    )
    VALUES (
        p_user_id,
        p_period,
        p_period_start,
        p_period_end,
        signal_stats.total_signals,
        signal_stats.buy_signals,
        signal_stats.sell_signals,
        signal_stats.hold_signals,
        signal_stats.watch_signals,
        signal_stats.alert_signals,
        signal_stats.critical_signals,
        signal_stats.high_priority_signals,
        signal_stats.medium_priority_signals,
        signal_stats.low_priority_signals,
        signal_stats.equity_signals,
        signal_stats.crypto_signals,
        signal_stats.avg_confidence_score,
        signal_stats.avg_signal_strength
    )
    ON CONFLICT (user_id, aggregation_period, period_start)
    DO UPDATE SET
        total_signals = signal_stats.total_signals,
        buy_signals = signal_stats.buy_signals,
        sell_signals = signal_stats.sell_signals,
        hold_signals = signal_stats.hold_signals,
        watch_signals = signal_stats.watch_signals,
        alert_signals = signal_stats.alert_signals,
        critical_signals = signal_stats.critical_signals,
        high_priority_signals = signal_stats.high_priority_signals,
        medium_priority_signals = signal_stats.medium_priority_signals,
        low_priority_signals = signal_stats.low_priority_signals,
        equity_signals = signal_stats.equity_signals,
        crypto_signals = signal_stats.crypto_signals,
        avg_confidence_score = signal_stats.avg_confidence_score,
        avg_signal_strength = signal_stats.avg_signal_strength
    RETURNING id INTO aggregation_id;
    
    RETURN aggregation_id;
END;
$$ LANGUAGE plpgsql;

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_live_signals_updated_at
    BEFORE UPDATE ON live_signals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_signal_subscriptions_updated_at
    BEFORE UPDATE ON signal_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_live_signal_summary_settings_updated_at
    BEFORE UPDATE ON live_signal_summary_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_signal_sources_config_updated_at
    BEFORE UPDATE ON signal_sources_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE live_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_summary_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_performance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_signal_summary_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_sources_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own signals" ON live_signals
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own aggregations" ON signal_summary_aggregations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own aggregations" ON signal_summary_aggregations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subscriptions" ON signal_subscriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own signal actions" ON signal_actions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own performance tracking" ON signal_performance_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance tracking" ON signal_performance_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own summary settings" ON live_signal_summary_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own signal sources" ON signal_sources_config
    FOR ALL USING (auth.uid() = user_id);

-- Views for common queries
CREATE VIEW active_signals_summary AS
SELECT 
    user_id,
    COUNT(*) as total_active_signals,
    COUNT(CASE WHEN signal_type = 'buy' THEN 1 END) as active_buy_signals,
    COUNT(CASE WHEN signal_type = 'sell' THEN 1 END) as active_sell_signals,
    COUNT(CASE WHEN priority_level = 'critical' THEN 1 END) as critical_signals,
    COUNT(CASE WHEN priority_level = 'high' THEN 1 END) as high_priority_signals,
    AVG(confidence_score) as avg_confidence,
    MAX(signal_timestamp) as latest_signal_time
FROM live_signals
WHERE signal_status = 'active'
GROUP BY user_id;

-- Comments
COMMENT ON TABLE live_signals IS 'Real-time trading signals from various sources';
COMMENT ON TABLE signal_summary_aggregations IS 'Aggregated signal statistics for different time periods';
COMMENT ON TABLE signal_subscriptions IS 'User subscriptions to specific signal sources and filters';
COMMENT ON TABLE signal_actions IS 'User actions taken on signals (acknowledge, follow, trade, etc.)';
COMMENT ON TABLE signal_performance_tracking IS 'Performance tracking of signals over time';
COMMENT ON TABLE live_signal_summary_settings IS 'User preferences for signal display and behavior';
COMMENT ON TABLE signal_sources_config IS 'Configuration for signal data sources'; 