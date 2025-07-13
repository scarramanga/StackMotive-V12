-- Block 8: Drilldown Assets Page - Database Schema
-- Comprehensive asset drilldown analytics and performance tracking

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Asset Details Table
CREATE TABLE IF NOT EXISTS asset_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    
    -- Basic Information
    name TEXT NOT NULL,
    asset_class TEXT,
    sector TEXT,
    market TEXT DEFAULT 'NZX',
    exchange TEXT,
    currency TEXT DEFAULT 'NZD',
    
    -- Market Data
    current_price DECIMAL(18,8) DEFAULT 0,
    market_cap DECIMAL(18,2) DEFAULT 0,
    volume_24h DECIMAL(18,2) DEFAULT 0,
    circulating_supply DECIMAL(18,8) DEFAULT 0,
    total_supply DECIMAL(18,8) DEFAULT 0,
    
    -- Performance Metrics
    price_change_24h DECIMAL(5,2) DEFAULT 0,
    price_change_7d DECIMAL(5,2) DEFAULT 0,
    price_change_30d DECIMAL(5,2) DEFAULT 0,
    price_change_1y DECIMAL(5,2) DEFAULT 0,
    
    -- Technical Indicators
    beta DECIMAL(5,4) DEFAULT 0,
    volatility DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(5,4) DEFAULT 0,
    rsi DECIMAL(5,2) DEFAULT 50,
    
    -- Fundamental Data
    pe_ratio DECIMAL(8,2) DEFAULT 0,
    pb_ratio DECIMAL(8,2) DEFAULT 0,
    dividend_yield DECIMAL(5,2) DEFAULT 0,
    earnings_per_share DECIMAL(8,2) DEFAULT 0,
    
    -- Sentiment & Analysis
    sentiment_score DECIMAL(3,2) DEFAULT 0,
    analyst_rating TEXT DEFAULT 'HOLD',
    price_target DECIMAL(18,8) DEFAULT 0,
    
    -- Metadata
    description TEXT,
    website TEXT,
    logo_url TEXT,
    data_source TEXT DEFAULT 'manual',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(symbol)
);

-- Asset Performance History Table
CREATE TABLE IF NOT EXISTS asset_performance_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    
    -- Time Series Data
    date DATE NOT NULL,
    open_price DECIMAL(18,8) NOT NULL,
    high_price DECIMAL(18,8) NOT NULL,
    low_price DECIMAL(18,8) NOT NULL,
    close_price DECIMAL(18,8) NOT NULL,
    volume DECIMAL(18,2) DEFAULT 0,
    
    -- Calculated Metrics
    daily_return DECIMAL(5,4) DEFAULT 0,
    volatility DECIMAL(5,2) DEFAULT 0,
    
    -- Technical Indicators
    sma_20 DECIMAL(18,8) DEFAULT 0,
    sma_50 DECIMAL(18,8) DEFAULT 0,
    sma_200 DECIMAL(18,8) DEFAULT 0,
    ema_20 DECIMAL(18,8) DEFAULT 0,
    rsi DECIMAL(5,2) DEFAULT 50,
    macd DECIMAL(8,4) DEFAULT 0,
    macd_signal DECIMAL(8,4) DEFAULT 0,
    bollinger_upper DECIMAL(18,8) DEFAULT 0,
    bollinger_lower DECIMAL(18,8) DEFAULT 0,
    
    -- Volume Indicators
    volume_sma_20 DECIMAL(18,2) DEFAULT 0,
    volume_ratio DECIMAL(5,2) DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(symbol, date)
);

-- Asset News & Events Table
CREATE TABLE IF NOT EXISTS asset_news_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    
    -- Event Details
    event_type TEXT NOT NULL, -- 'news', 'earnings', 'dividend', 'split', 'announcement'
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    
    -- Impact Analysis
    sentiment_impact DECIMAL(3,2) DEFAULT 0, -- -1 to 1
    price_impact DECIMAL(5,2) DEFAULT 0, -- percentage
    volume_impact DECIMAL(5,2) DEFAULT 0, -- percentage
    importance_score DECIMAL(3,2) DEFAULT 0, -- 0 to 1
    
    -- Source Information
    source TEXT,
    source_url TEXT,
    author TEXT,
    
    -- Categorization
    category TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Publication Details
    published_at TIMESTAMPTZ NOT NULL,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_sentiment_impact CHECK (sentiment_impact >= -1 AND sentiment_impact <= 1),
    CONSTRAINT valid_importance_score CHECK (importance_score >= 0 AND importance_score <= 1)
);

-- Asset Analysis & Signals Table
CREATE TABLE IF NOT EXISTS asset_analysis_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    
    -- Signal Details
    signal_type TEXT NOT NULL, -- 'buy', 'sell', 'hold', 'watch'
    signal_source TEXT NOT NULL, -- 'technical', 'fundamental', 'sentiment', 'ai'
    signal_strength DECIMAL(3,2) DEFAULT 0, -- 0 to 1
    
    -- Analysis Details
    title TEXT NOT NULL,
    description TEXT,
    reasoning TEXT,
    
    -- Price Targets
    target_price DECIMAL(18,8),
    stop_loss_price DECIMAL(18,8),
    confidence_level DECIMAL(3,2) DEFAULT 0, -- 0 to 1
    
    -- Risk Assessment
    risk_level TEXT DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH'
    time_horizon TEXT DEFAULT 'MEDIUM', -- 'SHORT', 'MEDIUM', 'LONG'
    
    -- Performance Tracking
    entry_price DECIMAL(18,8),
    current_performance DECIMAL(5,2) DEFAULT 0,
    max_performance DECIMAL(5,2) DEFAULT 0,
    min_performance DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    
    -- Metadata
    generated_by TEXT DEFAULT 'system',
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_signal_strength CHECK (signal_strength >= 0 AND signal_strength <= 1),
    CONSTRAINT valid_confidence_level CHECK (confidence_level >= 0 AND confidence_level <= 1)
);

-- User Asset Watchlist Table
CREATE TABLE IF NOT EXISTS user_asset_watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    
    -- Watchlist Details
    watchlist_name TEXT DEFAULT 'default',
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_reason TEXT,
    
    -- Alert Preferences
    price_alert_enabled BOOLEAN DEFAULT false,
    price_alert_upper DECIMAL(18,8),
    price_alert_lower DECIMAL(18,8),
    volume_alert_enabled BOOLEAN DEFAULT false,
    volume_alert_threshold DECIMAL(5,2) DEFAULT 0,
    news_alert_enabled BOOLEAN DEFAULT true,
    
    -- Tracking Preferences
    track_performance BOOLEAN DEFAULT true,
    track_news BOOLEAN DEFAULT true,
    track_signals BOOLEAN DEFAULT true,
    
    -- User Notes
    notes TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, symbol, watchlist_name)
);

-- Asset Drilldown Views Table (User Preferences)
CREATE TABLE IF NOT EXISTS asset_drilldown_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- View Configuration
    default_time_range TEXT DEFAULT '1y', -- '1d', '7d', '1m', '3m', '6m', '1y', '2y', '5y'
    default_chart_type TEXT DEFAULT 'candlestick', -- 'line', 'candlestick', 'area'
    show_volume BOOLEAN DEFAULT true,
    show_indicators BOOLEAN DEFAULT true,
    
    -- Enabled Indicators
    enabled_indicators TEXT[] DEFAULT ARRAY['SMA', 'RSI', 'MACD'],
    
    -- Panel Configuration
    panels_layout JSONB DEFAULT '{}',
    panels_enabled TEXT[] DEFAULT ARRAY['performance', 'news', 'signals', 'analysis'],
    
    -- Display Preferences
    auto_refresh BOOLEAN DEFAULT true,
    refresh_interval INTEGER DEFAULT 60, -- seconds
    show_extended_hours BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Asset Visit History Table
CREATE TABLE IF NOT EXISTS asset_visit_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    
    -- Visit Details
    visit_duration INTEGER DEFAULT 0, -- seconds
    pages_viewed TEXT[] DEFAULT ARRAY[]::TEXT[],
    actions_taken TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Context
    referrer TEXT,
    session_id TEXT,
    device_type TEXT,
    
    visited_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE asset_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_news_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_analysis_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_asset_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_drilldown_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_visit_history ENABLE ROW LEVEL SECURITY;

-- Asset details are public (read-only)
CREATE POLICY "Asset details are publicly readable" ON asset_details
    FOR SELECT USING (true);

-- Performance history is public (read-only)
CREATE POLICY "Asset performance history is publicly readable" ON asset_performance_history
    FOR SELECT USING (true);

-- News and events are public (read-only)
CREATE POLICY "Asset news and events are publicly readable" ON asset_news_events
    FOR SELECT USING (true);

-- Analysis and signals are public (read-only)
CREATE POLICY "Asset analysis and signals are publicly readable" ON asset_analysis_signals
    FOR SELECT USING (true);

-- User-specific policies
CREATE POLICY "Users can manage own watchlist" ON user_asset_watchlist
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own drilldown views" ON asset_drilldown_views
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own visit history" ON asset_visit_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visit history" ON asset_visit_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_asset_details_symbol ON asset_details(symbol);
CREATE INDEX idx_asset_details_asset_class ON asset_details(asset_class);
CREATE INDEX idx_asset_details_market ON asset_details(market);
CREATE INDEX idx_asset_details_updated ON asset_details(last_updated DESC);

CREATE INDEX idx_asset_performance_symbol ON asset_performance_history(symbol);
CREATE INDEX idx_asset_performance_date ON asset_performance_history(date DESC);
CREATE INDEX idx_asset_performance_symbol_date ON asset_performance_history(symbol, date DESC);

CREATE INDEX idx_asset_news_symbol ON asset_news_events(symbol);
CREATE INDEX idx_asset_news_published ON asset_news_events(published_at DESC);
CREATE INDEX idx_asset_news_type ON asset_news_events(event_type);
CREATE INDEX idx_asset_news_importance ON asset_news_events(importance_score DESC);

CREATE INDEX idx_asset_signals_symbol ON asset_analysis_signals(symbol);
CREATE INDEX idx_asset_signals_type ON asset_analysis_signals(signal_type);
CREATE INDEX idx_asset_signals_active ON asset_analysis_signals(is_active, generated_at DESC);
CREATE INDEX idx_asset_signals_strength ON asset_analysis_signals(signal_strength DESC);

CREATE INDEX idx_user_watchlist_user_id ON user_asset_watchlist(user_id);
CREATE INDEX idx_user_watchlist_symbol ON user_asset_watchlist(symbol);
CREATE INDEX idx_user_watchlist_active ON user_asset_watchlist(is_active, added_at DESC);

CREATE INDEX idx_asset_drilldown_views_user_id ON asset_drilldown_views(user_id);

CREATE INDEX idx_asset_visit_history_user_id ON asset_visit_history(user_id);
CREATE INDEX idx_asset_visit_history_symbol ON asset_visit_history(symbol);
CREATE INDEX idx_asset_visit_history_visited ON asset_visit_history(visited_at DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_asset_details_updated_at
    BEFORE UPDATE ON asset_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_analysis_signals_updated_at
    BEFORE UPDATE ON asset_analysis_signals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_asset_watchlist_updated_at
    BEFORE UPDATE ON user_asset_watchlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_drilldown_views_updated_at
    BEFORE UPDATE ON asset_drilldown_views
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for asset drilldown
CREATE OR REPLACE FUNCTION get_asset_performance_data(
    p_symbol TEXT,
    p_days INTEGER DEFAULT 365
)
RETURNS TABLE(
    date DATE,
    open_price DECIMAL,
    high_price DECIMAL,
    low_price DECIMAL,
    close_price DECIMAL,
    volume DECIMAL,
    daily_return DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.date,
        h.open_price,
        h.high_price,
        h.low_price,
        h.close_price,
        h.volume,
        h.daily_return
    FROM asset_performance_history h
    WHERE h.symbol = p_symbol
    AND h.date >= CURRENT_DATE - INTERVAL '1 day' * p_days
    ORDER BY h.date DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_asset_signals_summary(p_symbol TEXT)
RETURNS TABLE(
    total_signals INTEGER,
    buy_signals INTEGER,
    sell_signals INTEGER,
    hold_signals INTEGER,
    avg_confidence DECIMAL,
    latest_signal_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_signals,
        COUNT(CASE WHEN signal_type = 'buy' THEN 1 END)::INTEGER as buy_signals,
        COUNT(CASE WHEN signal_type = 'sell' THEN 1 END)::INTEGER as sell_signals,
        COUNT(CASE WHEN signal_type = 'hold' THEN 1 END)::INTEGER as hold_signals,
        AVG(confidence_level) as avg_confidence,
        MAX(generated_at) as latest_signal_date
    FROM asset_analysis_signals
    WHERE symbol = p_symbol AND is_active = true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_asset_details(
    p_symbol TEXT,
    p_current_price DECIMAL,
    p_price_change_24h DECIMAL DEFAULT NULL,
    p_volume_24h DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    asset_id UUID;
BEGIN
    INSERT INTO asset_details (symbol, name, current_price, price_change_24h, volume_24h)
    VALUES (p_symbol, p_symbol, p_current_price, p_price_change_24h, p_volume_24h)
    ON CONFLICT (symbol)
    DO UPDATE SET
        current_price = p_current_price,
        price_change_24h = COALESCE(p_price_change_24h, asset_details.price_change_24h),
        volume_24h = COALESCE(p_volume_24h, asset_details.volume_24h),
        last_updated = NOW()
    RETURNING id INTO asset_id;
    
    RETURN asset_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION track_asset_visit(
    p_user_id UUID,
    p_symbol TEXT,
    p_duration INTEGER DEFAULT 0,
    p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    visit_id UUID;
BEGIN
    INSERT INTO asset_visit_history (user_id, symbol, visit_duration, session_id)
    VALUES (p_user_id, p_symbol, p_duration, p_session_id)
    RETURNING id INTO visit_id;
    
    RETURN visit_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_asset_news_recent(
    p_symbol TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    title TEXT,
    description TEXT,
    sentiment_impact DECIMAL,
    importance_score DECIMAL,
    source TEXT,
    published_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.title,
        n.description,
        n.sentiment_impact,
        n.importance_score,
        n.source,
        n.published_at
    FROM asset_news_events n
    WHERE n.symbol = p_symbol
    ORDER BY n.published_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql; 
-- Comprehensive asset drilldown analytics and performance tracking

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Asset Details Table
CREATE TABLE IF NOT EXISTS asset_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    
    -- Basic Information
    name TEXT NOT NULL,
    asset_class TEXT,
    sector TEXT,
    market TEXT DEFAULT 'NZX',
    exchange TEXT,
    currency TEXT DEFAULT 'NZD',
    
    -- Market Data
    current_price DECIMAL(18,8) DEFAULT 0,
    market_cap DECIMAL(18,2) DEFAULT 0,
    volume_24h DECIMAL(18,2) DEFAULT 0,
    circulating_supply DECIMAL(18,8) DEFAULT 0,
    total_supply DECIMAL(18,8) DEFAULT 0,
    
    -- Performance Metrics
    price_change_24h DECIMAL(5,2) DEFAULT 0,
    price_change_7d DECIMAL(5,2) DEFAULT 0,
    price_change_30d DECIMAL(5,2) DEFAULT 0,
    price_change_1y DECIMAL(5,2) DEFAULT 0,
    
    -- Technical Indicators
    beta DECIMAL(5,4) DEFAULT 0,
    volatility DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(5,4) DEFAULT 0,
    rsi DECIMAL(5,2) DEFAULT 50,
    
    -- Fundamental Data
    pe_ratio DECIMAL(8,2) DEFAULT 0,
    pb_ratio DECIMAL(8,2) DEFAULT 0,
    dividend_yield DECIMAL(5,2) DEFAULT 0,
    earnings_per_share DECIMAL(8,2) DEFAULT 0,
    
    -- Sentiment & Analysis
    sentiment_score DECIMAL(3,2) DEFAULT 0,
    analyst_rating TEXT DEFAULT 'HOLD',
    price_target DECIMAL(18,8) DEFAULT 0,
    
    -- Metadata
    description TEXT,
    website TEXT,
    logo_url TEXT,
    data_source TEXT DEFAULT 'manual',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(symbol)
);

-- Asset Performance History Table
CREATE TABLE IF NOT EXISTS asset_performance_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    
    -- Time Series Data
    date DATE NOT NULL,
    open_price DECIMAL(18,8) NOT NULL,
    high_price DECIMAL(18,8) NOT NULL,
    low_price DECIMAL(18,8) NOT NULL,
    close_price DECIMAL(18,8) NOT NULL,
    volume DECIMAL(18,2) DEFAULT 0,
    
    -- Calculated Metrics
    daily_return DECIMAL(5,4) DEFAULT 0,
    volatility DECIMAL(5,2) DEFAULT 0,
    
    -- Technical Indicators
    sma_20 DECIMAL(18,8) DEFAULT 0,
    sma_50 DECIMAL(18,8) DEFAULT 0,
    sma_200 DECIMAL(18,8) DEFAULT 0,
    ema_20 DECIMAL(18,8) DEFAULT 0,
    rsi DECIMAL(5,2) DEFAULT 50,
    macd DECIMAL(8,4) DEFAULT 0,
    macd_signal DECIMAL(8,4) DEFAULT 0,
    bollinger_upper DECIMAL(18,8) DEFAULT 0,
    bollinger_lower DECIMAL(18,8) DEFAULT 0,
    
    -- Volume Indicators
    volume_sma_20 DECIMAL(18,2) DEFAULT 0,
    volume_ratio DECIMAL(5,2) DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(symbol, date)
);

-- Asset News & Events Table
CREATE TABLE IF NOT EXISTS asset_news_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    
    -- Event Details
    event_type TEXT NOT NULL, -- 'news', 'earnings', 'dividend', 'split', 'announcement'
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    
    -- Impact Analysis
    sentiment_impact DECIMAL(3,2) DEFAULT 0, -- -1 to 1
    price_impact DECIMAL(5,2) DEFAULT 0, -- percentage
    volume_impact DECIMAL(5,2) DEFAULT 0, -- percentage
    importance_score DECIMAL(3,2) DEFAULT 0, -- 0 to 1
    
    -- Source Information
    source TEXT,
    source_url TEXT,
    author TEXT,
    
    -- Categorization
    category TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Publication Details
    published_at TIMESTAMPTZ NOT NULL,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_sentiment_impact CHECK (sentiment_impact >= -1 AND sentiment_impact <= 1),
    CONSTRAINT valid_importance_score CHECK (importance_score >= 0 AND importance_score <= 1)
);

-- Asset Analysis & Signals Table
CREATE TABLE IF NOT EXISTS asset_analysis_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    
    -- Signal Details
    signal_type TEXT NOT NULL, -- 'buy', 'sell', 'hold', 'watch'
    signal_source TEXT NOT NULL, -- 'technical', 'fundamental', 'sentiment', 'ai'
    signal_strength DECIMAL(3,2) DEFAULT 0, -- 0 to 1
    
    -- Analysis Details
    title TEXT NOT NULL,
    description TEXT,
    reasoning TEXT,
    
    -- Price Targets
    target_price DECIMAL(18,8),
    stop_loss_price DECIMAL(18,8),
    confidence_level DECIMAL(3,2) DEFAULT 0, -- 0 to 1
    
    -- Risk Assessment
    risk_level TEXT DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH'
    time_horizon TEXT DEFAULT 'MEDIUM', -- 'SHORT', 'MEDIUM', 'LONG'
    
    -- Performance Tracking
    entry_price DECIMAL(18,8),
    current_performance DECIMAL(5,2) DEFAULT 0,
    max_performance DECIMAL(5,2) DEFAULT 0,
    min_performance DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    
    -- Metadata
    generated_by TEXT DEFAULT 'system',
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_signal_strength CHECK (signal_strength >= 0 AND signal_strength <= 1),
    CONSTRAINT valid_confidence_level CHECK (confidence_level >= 0 AND confidence_level <= 1)
);

-- User Asset Watchlist Table
CREATE TABLE IF NOT EXISTS user_asset_watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    
    -- Watchlist Details
    watchlist_name TEXT DEFAULT 'default',
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_reason TEXT,
    
    -- Alert Preferences
    price_alert_enabled BOOLEAN DEFAULT false,
    price_alert_upper DECIMAL(18,8),
    price_alert_lower DECIMAL(18,8),
    volume_alert_enabled BOOLEAN DEFAULT false,
    volume_alert_threshold DECIMAL(5,2) DEFAULT 0,
    news_alert_enabled BOOLEAN DEFAULT true,
    
    -- Tracking Preferences
    track_performance BOOLEAN DEFAULT true,
    track_news BOOLEAN DEFAULT true,
    track_signals BOOLEAN DEFAULT true,
    
    -- User Notes
    notes TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, symbol, watchlist_name)
);

-- Asset Drilldown Views Table (User Preferences)
CREATE TABLE IF NOT EXISTS asset_drilldown_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- View Configuration
    default_time_range TEXT DEFAULT '1y', -- '1d', '7d', '1m', '3m', '6m', '1y', '2y', '5y'
    default_chart_type TEXT DEFAULT 'candlestick', -- 'line', 'candlestick', 'area'
    show_volume BOOLEAN DEFAULT true,
    show_indicators BOOLEAN DEFAULT true,
    
    -- Enabled Indicators
    enabled_indicators TEXT[] DEFAULT ARRAY['SMA', 'RSI', 'MACD'],
    
    -- Panel Configuration
    panels_layout JSONB DEFAULT '{}',
    panels_enabled TEXT[] DEFAULT ARRAY['performance', 'news', 'signals', 'analysis'],
    
    -- Display Preferences
    auto_refresh BOOLEAN DEFAULT true,
    refresh_interval INTEGER DEFAULT 60, -- seconds
    show_extended_hours BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Asset Visit History Table
CREATE TABLE IF NOT EXISTS asset_visit_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    
    -- Visit Details
    visit_duration INTEGER DEFAULT 0, -- seconds
    pages_viewed TEXT[] DEFAULT ARRAY[]::TEXT[],
    actions_taken TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Context
    referrer TEXT,
    session_id TEXT,
    device_type TEXT,
    
    visited_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE asset_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_news_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_analysis_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_asset_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_drilldown_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_visit_history ENABLE ROW LEVEL SECURITY;

-- Asset details are public (read-only)
CREATE POLICY "Asset details are publicly readable" ON asset_details
    FOR SELECT USING (true);

-- Performance history is public (read-only)
CREATE POLICY "Asset performance history is publicly readable" ON asset_performance_history
    FOR SELECT USING (true);

-- News and events are public (read-only)
CREATE POLICY "Asset news and events are publicly readable" ON asset_news_events
    FOR SELECT USING (true);

-- Analysis and signals are public (read-only)
CREATE POLICY "Asset analysis and signals are publicly readable" ON asset_analysis_signals
    FOR SELECT USING (true);

-- User-specific policies
CREATE POLICY "Users can manage own watchlist" ON user_asset_watchlist
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own drilldown views" ON asset_drilldown_views
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own visit history" ON asset_visit_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visit history" ON asset_visit_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_asset_details_symbol ON asset_details(symbol);
CREATE INDEX idx_asset_details_asset_class ON asset_details(asset_class);
CREATE INDEX idx_asset_details_market ON asset_details(market);
CREATE INDEX idx_asset_details_updated ON asset_details(last_updated DESC);

CREATE INDEX idx_asset_performance_symbol ON asset_performance_history(symbol);
CREATE INDEX idx_asset_performance_date ON asset_performance_history(date DESC);
CREATE INDEX idx_asset_performance_symbol_date ON asset_performance_history(symbol, date DESC);

CREATE INDEX idx_asset_news_symbol ON asset_news_events(symbol);
CREATE INDEX idx_asset_news_published ON asset_news_events(published_at DESC);
CREATE INDEX idx_asset_news_type ON asset_news_events(event_type);
CREATE INDEX idx_asset_news_importance ON asset_news_events(importance_score DESC);

CREATE INDEX idx_asset_signals_symbol ON asset_analysis_signals(symbol);
CREATE INDEX idx_asset_signals_type ON asset_analysis_signals(signal_type);
CREATE INDEX idx_asset_signals_active ON asset_analysis_signals(is_active, generated_at DESC);
CREATE INDEX idx_asset_signals_strength ON asset_analysis_signals(signal_strength DESC);

CREATE INDEX idx_user_watchlist_user_id ON user_asset_watchlist(user_id);
CREATE INDEX idx_user_watchlist_symbol ON user_asset_watchlist(symbol);
CREATE INDEX idx_user_watchlist_active ON user_asset_watchlist(is_active, added_at DESC);

CREATE INDEX idx_asset_drilldown_views_user_id ON asset_drilldown_views(user_id);

CREATE INDEX idx_asset_visit_history_user_id ON asset_visit_history(user_id);
CREATE INDEX idx_asset_visit_history_symbol ON asset_visit_history(symbol);
CREATE INDEX idx_asset_visit_history_visited ON asset_visit_history(visited_at DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_asset_details_updated_at
    BEFORE UPDATE ON asset_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_analysis_signals_updated_at
    BEFORE UPDATE ON asset_analysis_signals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_asset_watchlist_updated_at
    BEFORE UPDATE ON user_asset_watchlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_drilldown_views_updated_at
    BEFORE UPDATE ON asset_drilldown_views
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for asset drilldown
CREATE OR REPLACE FUNCTION get_asset_performance_data(
    p_symbol TEXT,
    p_days INTEGER DEFAULT 365
)
RETURNS TABLE(
    date DATE,
    open_price DECIMAL,
    high_price DECIMAL,
    low_price DECIMAL,
    close_price DECIMAL,
    volume DECIMAL,
    daily_return DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.date,
        h.open_price,
        h.high_price,
        h.low_price,
        h.close_price,
        h.volume,
        h.daily_return
    FROM asset_performance_history h
    WHERE h.symbol = p_symbol
    AND h.date >= CURRENT_DATE - INTERVAL '1 day' * p_days
    ORDER BY h.date DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_asset_signals_summary(p_symbol TEXT)
RETURNS TABLE(
    total_signals INTEGER,
    buy_signals INTEGER,
    sell_signals INTEGER,
    hold_signals INTEGER,
    avg_confidence DECIMAL,
    latest_signal_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_signals,
        COUNT(CASE WHEN signal_type = 'buy' THEN 1 END)::INTEGER as buy_signals,
        COUNT(CASE WHEN signal_type = 'sell' THEN 1 END)::INTEGER as sell_signals,
        COUNT(CASE WHEN signal_type = 'hold' THEN 1 END)::INTEGER as hold_signals,
        AVG(confidence_level) as avg_confidence,
        MAX(generated_at) as latest_signal_date
    FROM asset_analysis_signals
    WHERE symbol = p_symbol AND is_active = true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_asset_details(
    p_symbol TEXT,
    p_current_price DECIMAL,
    p_price_change_24h DECIMAL DEFAULT NULL,
    p_volume_24h DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    asset_id UUID;
BEGIN
    INSERT INTO asset_details (symbol, name, current_price, price_change_24h, volume_24h)
    VALUES (p_symbol, p_symbol, p_current_price, p_price_change_24h, p_volume_24h)
    ON CONFLICT (symbol)
    DO UPDATE SET
        current_price = p_current_price,
        price_change_24h = COALESCE(p_price_change_24h, asset_details.price_change_24h),
        volume_24h = COALESCE(p_volume_24h, asset_details.volume_24h),
        last_updated = NOW()
    RETURNING id INTO asset_id;
    
    RETURN asset_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION track_asset_visit(
    p_user_id UUID,
    p_symbol TEXT,
    p_duration INTEGER DEFAULT 0,
    p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    visit_id UUID;
BEGIN
    INSERT INTO asset_visit_history (user_id, symbol, visit_duration, session_id)
    VALUES (p_user_id, p_symbol, p_duration, p_session_id)
    RETURNING id INTO visit_id;
    
    RETURN visit_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_asset_news_recent(
    p_symbol TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    title TEXT,
    description TEXT,
    sentiment_impact DECIMAL,
    importance_score DECIMAL,
    source TEXT,
    published_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.title,
        n.description,
        n.sentiment_impact,
        n.importance_score,
        n.source,
        n.published_at
    FROM asset_news_events n
    WHERE n.symbol = p_symbol
    ORDER BY n.published_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql; 