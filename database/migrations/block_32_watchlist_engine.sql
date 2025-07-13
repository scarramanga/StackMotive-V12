-- Block 32: Watchlist Engine - Database Schema
-- Complete Supabase migration for watchlist functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE watchlist_alert_type AS ENUM ('price', 'score', 'volume');
CREATE TYPE watchlist_alert_condition AS ENUM ('above', 'below', 'crosses');
CREATE TYPE price_target_type AS ENUM ('buy', 'sell');
CREATE TYPE watchlist_sort_field AS ENUM ('score', 'priority', 'symbol', 'addedAt');
CREATE TYPE sort_order AS ENUM ('asc', 'desc');

-- Watchlist Items table
CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_scored TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Current score data (denormalized for performance)
    current_score DECIMAL(5, 2), -- 0-100
    score_confidence DECIMAL(5, 2), -- 0-100
    technical_score DECIMAL(5, 2),
    fundamental_score DECIMAL(5, 2),
    sentiment_score DECIMAL(5, 2),
    momentum_score DECIMAL(5, 2),
    risk_score DECIMAL(5, 2),
    score_last_updated TIMESTAMP WITH TIME ZONE,
    
    -- Price target
    price_target DECIMAL(15, 4),
    price_target_type price_target_type,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_watchlist_symbol UNIQUE(user_id, symbol),
    CONSTRAINT valid_scores CHECK (
        (current_score IS NULL OR (current_score >= 0 AND current_score <= 100)) AND
        (score_confidence IS NULL OR (score_confidence >= 0 AND score_confidence <= 100)) AND
        (technical_score IS NULL OR (technical_score >= 0 AND technical_score <= 100)) AND
        (fundamental_score IS NULL OR (fundamental_score >= 0 AND fundamental_score <= 100)) AND
        (sentiment_score IS NULL OR (sentiment_score >= 0 AND sentiment_score <= 100)) AND
        (momentum_score IS NULL OR (momentum_score >= 0 AND momentum_score <= 100)) AND
        (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100))
    )
);

-- Watchlist Scores History table (for tracking score changes over time)
CREATE TABLE watchlist_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    watchlist_item_id UUID NOT NULL REFERENCES watchlist_items(id) ON DELETE CASCADE,
    total_score DECIMAL(5, 2) NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
    confidence DECIMAL(5, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    
    -- Individual criteria scores
    technical DECIMAL(5, 2) CHECK (technical >= 0 AND technical <= 100),
    fundamental DECIMAL(5, 2) CHECK (fundamental >= 0 AND fundamental <= 100),
    sentiment DECIMAL(5, 2) CHECK (sentiment >= 0 AND sentiment <= 100),
    momentum DECIMAL(5, 2) CHECK (momentum >= 0 AND momentum <= 100),
    risk DECIMAL(5, 2) CHECK (risk >= 0 AND risk <= 100),
    
    -- Score calculation metadata
    calculation_data JSONB DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Performance tracking
    processing_time_ms INTEGER,
    data_sources TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Watchlist Alerts table
CREATE TABLE watchlist_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    watchlist_item_id UUID NOT NULL REFERENCES watchlist_items(id) ON DELETE CASCADE,
    alert_type watchlist_alert_type NOT NULL,
    condition watchlist_alert_condition NOT NULL,
    value DECIMAL(15, 4) NOT NULL,
    triggered BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    triggered_value DECIMAL(15, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Alert metadata
    metadata JSONB DEFAULT '{}'
);

-- Watchlist Settings table
CREATE TABLE watchlist_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    max_items INTEGER DEFAULT 100 CHECK (max_items > 0),
    auto_score BOOLEAN DEFAULT TRUE,
    score_threshold DECIMAL(5, 2) DEFAULT 70.0 CHECK (score_threshold >= 0 AND score_threshold <= 100),
    refresh_interval INTEGER DEFAULT 300000, -- 5 minutes in milliseconds
    notifications BOOLEAN DEFAULT TRUE,
    
    -- Display preferences
    default_sort_by watchlist_sort_field DEFAULT 'score',
    default_sort_order sort_order DEFAULT 'desc',
    show_score_breakdown BOOLEAN DEFAULT TRUE,
    show_price_targets BOOLEAN DEFAULT TRUE,
    show_alerts BOOLEAN DEFAULT TRUE,
    
    -- Scoring preferences
    technical_weight DECIMAL(3, 2) DEFAULT 0.25 CHECK (technical_weight >= 0 AND technical_weight <= 1),
    fundamental_weight DECIMAL(3, 2) DEFAULT 0.25 CHECK (fundamental_weight >= 0 AND fundamental_weight <= 1),
    sentiment_weight DECIMAL(3, 2) DEFAULT 0.20 CHECK (sentiment_weight >= 0 AND sentiment_weight <= 1),
    momentum_weight DECIMAL(3, 2) DEFAULT 0.15 CHECK (momentum_weight >= 0 AND momentum_weight <= 1),
    risk_weight DECIMAL(3, 2) DEFAULT 0.15 CHECK (risk_weight >= 0 AND risk_weight <= 1),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_watchlist_settings UNIQUE(user_id),
    CONSTRAINT valid_weight_sum CHECK (
        technical_weight + fundamental_weight + sentiment_weight + momentum_weight + risk_weight = 1.00
    )
);

-- Watchlist Score Templates (for different scoring strategies)
CREATE TABLE watchlist_score_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Weight configuration
    technical_weight DECIMAL(3, 2) NOT NULL CHECK (technical_weight >= 0 AND technical_weight <= 1),
    fundamental_weight DECIMAL(3, 2) NOT NULL CHECK (fundamental_weight >= 0 AND fundamental_weight <= 1),
    sentiment_weight DECIMAL(3, 2) NOT NULL CHECK (sentiment_weight >= 0 AND sentiment_weight <= 1),
    momentum_weight DECIMAL(3, 2) NOT NULL CHECK (momentum_weight >= 0 AND momentum_weight <= 1),
    risk_weight DECIMAL(3, 2) NOT NULL CHECK (risk_weight >= 0 AND risk_weight <= 1),
    
    -- Template metadata
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_template_name UNIQUE(user_id, name),
    CONSTRAINT valid_template_weight_sum CHECK (
        technical_weight + fundamental_weight + sentiment_weight + momentum_weight + risk_weight = 1.00
    )
);

-- Watchlist Recommendations table
CREATE TABLE watchlist_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('buy', 'sell', 'hold', 'monitor')),
    reason TEXT NOT NULL,
    confidence DECIMAL(5, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    target_price DECIMAL(15, 4),
    
    -- Recommendation context
    based_on_score DECIMAL(5, 2) CHECK (based_on_score >= 0 AND based_on_score <= 100),
    market_conditions JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'dismissed', 'expired')),
    user_action VARCHAR(20) CHECK (user_action IN ('accepted', 'dismissed', 'modified')),
    user_action_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_active_symbol_recommendation UNIQUE(user_id, symbol, status) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for performance
CREATE INDEX idx_watchlist_items_user_id ON watchlist_items(user_id);
CREATE INDEX idx_watchlist_items_symbol ON watchlist_items(user_id, symbol);
CREATE INDEX idx_watchlist_items_score ON watchlist_items(user_id, current_score DESC NULLS LAST);
CREATE INDEX idx_watchlist_items_priority ON watchlist_items(user_id, priority DESC);
CREATE INDEX idx_watchlist_items_added_at ON watchlist_items(user_id, added_at DESC);
CREATE INDEX idx_watchlist_items_tags ON watchlist_items USING GIN(tags);

CREATE INDEX idx_watchlist_scores_item_id ON watchlist_scores(watchlist_item_id);
CREATE INDEX idx_watchlist_scores_calculated_at ON watchlist_scores(calculated_at DESC);
CREATE INDEX idx_watchlist_scores_total_score ON watchlist_scores(total_score DESC);

CREATE INDEX idx_watchlist_alerts_item_id ON watchlist_alerts(watchlist_item_id);
CREATE INDEX idx_watchlist_alerts_triggered ON watchlist_alerts(user_id, triggered, created_at DESC);
CREATE INDEX idx_watchlist_alerts_type ON watchlist_alerts(alert_type);

CREATE INDEX idx_watchlist_recommendations_user_id ON watchlist_recommendations(user_id);
CREATE INDEX idx_watchlist_recommendations_status ON watchlist_recommendations(user_id, status, created_at DESC);
CREATE INDEX idx_watchlist_recommendations_confidence ON watchlist_recommendations(confidence DESC);

-- Functions
CREATE OR REPLACE FUNCTION update_watchlist_item_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the denormalized score data in watchlist_items
    UPDATE watchlist_items 
    SET 
        current_score = NEW.total_score,
        score_confidence = NEW.confidence,
        technical_score = NEW.technical,
        fundamental_score = NEW.fundamental,
        sentiment_score = NEW.sentiment,
        momentum_score = NEW.momentum,
        risk_score = NEW.risk,
        score_last_updated = NEW.calculated_at,
        last_scored = NEW.calculated_at,
        updated_at = NOW()
    WHERE id = NEW.watchlist_item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION expire_old_recommendations()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark expired recommendations as expired
    UPDATE watchlist_recommendations 
    SET status = 'expired'
    WHERE expires_at < NOW() AND status = 'active';
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_watchlist_score
    AFTER INSERT ON watchlist_scores
    FOR EACH ROW EXECUTE FUNCTION update_watchlist_item_score();

CREATE TRIGGER trigger_watchlist_items_updated_at
    BEFORE UPDATE ON watchlist_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_watchlist_settings_updated_at
    BEFORE UPDATE ON watchlist_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_watchlist_score_templates_updated_at
    BEFORE UPDATE ON watchlist_score_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Scheduled trigger for expiring recommendations (would need pg_cron extension)
-- CREATE TRIGGER trigger_expire_recommendations
--     AFTER INSERT OR UPDATE ON watchlist_recommendations
--     FOR EACH ROW EXECUTE FUNCTION expire_old_recommendations();

-- Row Level Security (RLS)
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_score_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own watchlist items" ON watchlist_items
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own watchlist scores" ON watchlist_scores
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own watchlist alerts" ON watchlist_alerts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own watchlist settings" ON watchlist_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own score templates" ON watchlist_score_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own recommendations" ON watchlist_recommendations
    FOR ALL USING (auth.uid() = user_id);

-- Views for common queries
CREATE VIEW watchlist_summary AS
SELECT 
    wi.id,
    wi.user_id,
    wi.symbol,
    wi.name,
    wi.priority,
    wi.current_score,
    wi.score_confidence,
    wi.price_target,
    wi.price_target_type,
    wi.added_at,
    wi.last_scored,
    wi.tags,
    COUNT(wa.id) as alert_count,
    COUNT(wa.id) FILTER (WHERE wa.triggered = TRUE) as triggered_alert_count,
    CASE 
        WHEN wi.current_score >= 80 THEN 'excellent'
        WHEN wi.current_score >= 60 THEN 'good'
        WHEN wi.current_score >= 40 THEN 'fair'
        ELSE 'poor'
    END as score_rating
FROM watchlist_items wi
LEFT JOIN watchlist_alerts wa ON wi.id = wa.watchlist_item_id
GROUP BY wi.id, wi.user_id, wi.symbol, wi.name, wi.priority, 
         wi.current_score, wi.score_confidence, wi.price_target, 
         wi.price_target_type, wi.added_at, wi.last_scored, wi.tags;

-- Sample data for development (uncomment if needed)
/*
INSERT INTO watchlist_settings (user_id) VALUES (auth.uid());

INSERT INTO watchlist_score_templates (user_id, name, description, is_default, technical_weight, fundamental_weight, sentiment_weight, momentum_weight, risk_weight) VALUES
    (auth.uid(), 'Balanced', 'Equal weight across all criteria', TRUE, 0.20, 0.20, 0.20, 0.20, 0.20),
    (auth.uid(), 'Technical Focus', 'Heavy emphasis on technical analysis', FALSE, 0.50, 0.15, 0.15, 0.15, 0.05),
    (auth.uid(), 'Fundamental Focus', 'Heavy emphasis on fundamental analysis', FALSE, 0.10, 0.50, 0.15, 0.15, 0.10);
*/

-- Comments
COMMENT ON TABLE watchlist_items IS 'Assets being monitored in user watchlists';
COMMENT ON TABLE watchlist_scores IS 'Historical scoring data for watchlist items';
COMMENT ON TABLE watchlist_alerts IS 'Price and score alerts for watchlist items';
COMMENT ON TABLE watchlist_settings IS 'User preferences for watchlist behavior';
COMMENT ON TABLE watchlist_score_templates IS 'Scoring weight templates for different strategies';
COMMENT ON TABLE watchlist_recommendations IS 'AI-generated recommendations based on watchlist analysis'; 