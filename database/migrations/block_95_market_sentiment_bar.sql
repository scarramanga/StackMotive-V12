-- Block 95: Market Sentiment Bar - Database Migration
-- Real-time Market Sentiment Tracking and Analysis Tables

-- Market Sentiment Bars - Main configuration table
CREATE TABLE market_sentiment_bars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    bar_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuration
    sentiment_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    visualization_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    alert_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_sentiment_bars_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Real-time Sentiment Readings - Current and historical sentiment data
CREATE TABLE sentiment_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bar_id UUID NOT NULL,
    
    -- Core sentiment metrics
    overall_sentiment DECIMAL(5,4) NOT NULL CHECK (overall_sentiment >= -1 AND overall_sentiment <= 1),
    sentiment_grade VARCHAR(50) NOT NULL,
    confidence DECIMAL(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Metadata
    calculation_method VARCHAR(100) NOT NULL,
    sample_size INTEGER NOT NULL DEFAULT 0,
    
    -- Quality metrics
    quality_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_as_of_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_sentiment_readings_bar FOREIGN KEY (bar_id) REFERENCES market_sentiment_bars(id) ON DELETE CASCADE
);

-- Component Sentiments - Breakdown by sentiment components
CREATE TABLE component_sentiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reading_id UUID NOT NULL,
    component_id VARCHAR(100) NOT NULL,
    component_name VARCHAR(255) NOT NULL,
    component_type VARCHAR(100) NOT NULL,
    
    -- Sentiment metrics
    sentiment DECIMAL(5,4) NOT NULL CHECK (sentiment >= -1 AND sentiment <= 1),
    confidence DECIMAL(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    weight DECIMAL(4,3) NOT NULL CHECK (weight >= 0 AND weight <= 1),
    
    -- Quality metrics
    data_quality DECIMAL(4,3) NOT NULL CHECK (data_quality >= 0 AND data_quality <= 1),
    sample_size INTEGER NOT NULL DEFAULT 0,
    
    -- Trend analysis
    trend_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_component_sentiments_reading FOREIGN KEY (reading_id) REFERENCES sentiment_readings(id) ON DELETE CASCADE
);

-- Sentiment Factors - Contributing factors to sentiment
CREATE TABLE sentiment_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id UUID NOT NULL,
    factor_id VARCHAR(100) NOT NULL,
    factor_name VARCHAR(255) NOT NULL,
    factor_type VARCHAR(100) NOT NULL,
    
    -- Impact metrics
    impact DECIMAL(5,4) NOT NULL CHECK (impact >= -1 AND impact <= 1),
    confidence DECIMAL(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    weight DECIMAL(4,3) NOT NULL CHECK (weight >= 0 AND weight <= 1),
    
    -- Description and context
    description TEXT,
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Temporal data
    duration_hours INTEGER NOT NULL DEFAULT 0,
    intensity DECIMAL(4,3) NOT NULL CHECK (intensity >= 0 AND intensity <= 1),
    
    -- Source information
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_sentiment_factors_component FOREIGN KEY (component_id) REFERENCES component_sentiments(id) ON DELETE CASCADE
);

-- Sentiment Data Sources - External data source configurations
CREATE TABLE sentiment_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bar_id UUID NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    
    -- Connection configuration
    connection_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    data_flow_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    processing_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status and performance
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_enabled BOOLEAN DEFAULT true,
    quality_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Geographic and jurisdiction data
    jurisdiction VARCHAR(10) NOT NULL DEFAULT 'AU',
    market_coverage JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_successful_update TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT fk_sentiment_data_sources_bar FOREIGN KEY (bar_id) REFERENCES market_sentiment_bars(id) ON DELETE CASCADE,
    CONSTRAINT unique_source_per_bar UNIQUE (bar_id, source_id)
);

-- Source Sentiment Breakdown - Sentiment contribution by source
CREATE TABLE source_sentiment_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reading_id UUID NOT NULL,
    source_id UUID NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    
    -- Sentiment metrics
    sentiment DECIMAL(5,4) NOT NULL CHECK (sentiment >= -1 AND sentiment <= 1),
    confidence DECIMAL(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    weight DECIMAL(4,3) NOT NULL CHECK (weight >= 0 AND weight <= 1),
    contribution DECIMAL(5,4) NOT NULL,
    
    -- Data metrics
    data_points INTEGER NOT NULL DEFAULT 0,
    freshness_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
    reliability DECIMAL(4,3) NOT NULL CHECK (reliability >= 0 AND reliability <= 1),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_source_breakdown_reading FOREIGN KEY (reading_id) REFERENCES sentiment_readings(id) ON DELETE CASCADE,
    CONSTRAINT fk_source_breakdown_source FOREIGN KEY (source_id) REFERENCES sentiment_data_sources(id) ON DELETE CASCADE
);

-- Segment Sentiments - Sentiment by market segments
CREATE TABLE segment_sentiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reading_id UUID NOT NULL,
    segment_id VARCHAR(100) NOT NULL,
    segment_name VARCHAR(255) NOT NULL,
    segment_type VARCHAR(100) NOT NULL,
    
    -- Sentiment metrics
    sentiment DECIMAL(5,4) NOT NULL CHECK (sentiment >= -1 AND sentiment <= 1),
    confidence DECIMAL(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Market data
    market_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    performance_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_segment_sentiments_reading FOREIGN KEY (reading_id) REFERENCES sentiment_readings(id) ON DELETE CASCADE
);

-- Sentiment Drivers - Key drivers for segment sentiment
CREATE TABLE sentiment_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id UUID NOT NULL,
    driver_id VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    
    -- Impact metrics
    impact DECIMAL(5,4) NOT NULL CHECK (impact >= -1 AND impact <= 1),
    confidence DECIMAL(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    category VARCHAR(100) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_sentiment_drivers_segment FOREIGN KEY (segment_id) REFERENCES segment_sentiments(id) ON DELETE CASCADE
);

-- Sentiment History - Historical sentiment tracking
CREATE TABLE sentiment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bar_id UUID NOT NULL,
    reading_id UUID NOT NULL,
    
    -- Market context
    market_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    significant_events JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Timestamps
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_sentiment_history_bar FOREIGN KEY (bar_id) REFERENCES market_sentiment_bars(id) ON DELETE CASCADE,
    CONSTRAINT fk_sentiment_history_reading FOREIGN KEY (reading_id) REFERENCES sentiment_readings(id) ON DELETE CASCADE
);

-- Temporal Sentiment Analysis - Time-based sentiment analysis
CREATE TABLE temporal_sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reading_id UUID NOT NULL,
    
    -- Intraday analysis
    intraday_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    daily_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    weekly_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    monthly_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Trend analysis
    trend_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    volatility_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Patterns and correlations
    seasonal_patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
    correlation_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_temporal_analysis_reading FOREIGN KEY (reading_id) REFERENCES sentiment_readings(id) ON DELETE CASCADE
);

-- Sentiment Alerts - Alert configurations and history
CREATE TABLE sentiment_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bar_id UUID NOT NULL,
    alert_name VARCHAR(255) NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    
    -- Alert configuration
    alert_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status
    is_enabled BOOLEAN DEFAULT true,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_sentiment_alerts_bar FOREIGN KEY (bar_id) REFERENCES market_sentiment_bars(id) ON DELETE CASCADE
);

-- Alert History - Historical alert triggers
CREATE TABLE alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL,
    bar_id UUID NOT NULL,
    
    -- Alert details
    alert_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    trigger_value DECIMAL(10,4),
    
    -- Status
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_alert_history_alert FOREIGN KEY (alert_id) REFERENCES sentiment_alerts(id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_history_bar FOREIGN KEY (bar_id) REFERENCES market_sentiment_bars(id) ON DELETE CASCADE
);

-- AU/NZ Compliance Framework - Regulatory compliance tracking
CREATE TABLE sentiment_compliance_framework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bar_id UUID NOT NULL,
    jurisdiction VARCHAR(10) NOT NULL,
    
    -- Compliance requirements
    compliance_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Data retention policies
    data_retention_days INTEGER NOT NULL DEFAULT 2555, -- 7 years for AU/NZ
    archival_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Audit trail
    audit_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_sentiment_compliance_bar FOREIGN KEY (bar_id) REFERENCES market_sentiment_bars(id) ON DELETE CASCADE,
    CONSTRAINT check_jurisdiction CHECK (jurisdiction IN ('AU', 'NZ', 'BOTH'))
);

-- Performance Metrics - System performance tracking
CREATE TABLE sentiment_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bar_id UUID NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    
    -- Performance data
    average_latency_ms INTEGER NOT NULL DEFAULT 0,
    success_rate DECIMAL(5,4) NOT NULL DEFAULT 1.0,
    error_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0,
    uptime_percentage DECIMAL(5,4) NOT NULL DEFAULT 1.0,
    
    -- Data quality metrics
    data_freshness_score DECIMAL(4,3) NOT NULL DEFAULT 1.0,
    data_completeness_score DECIMAL(4,3) NOT NULL DEFAULT 1.0,
    data_accuracy_score DECIMAL(4,3) NOT NULL DEFAULT 1.0,
    
    -- Timestamps
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_sentiment_performance_bar FOREIGN KEY (bar_id) REFERENCES market_sentiment_bars(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_sentiment_bars_user_id ON market_sentiment_bars(user_id);
CREATE INDEX idx_sentiment_bars_active ON market_sentiment_bars(is_active);
CREATE INDEX idx_sentiment_bars_updated ON market_sentiment_bars(updated_at);

CREATE INDEX idx_sentiment_readings_bar_id ON sentiment_readings(bar_id);
CREATE INDEX idx_sentiment_readings_timestamp ON sentiment_readings(timestamp);
CREATE INDEX idx_sentiment_readings_sentiment ON sentiment_readings(overall_sentiment);

CREATE INDEX idx_component_sentiments_reading ON component_sentiments(reading_id);
CREATE INDEX idx_component_sentiments_type ON component_sentiments(component_type);

CREATE INDEX idx_sentiment_factors_component ON sentiment_factors(component_id);
CREATE INDEX idx_sentiment_factors_type ON sentiment_factors(factor_type);

CREATE INDEX idx_sentiment_data_sources_bar ON sentiment_data_sources(bar_id);
CREATE INDEX idx_sentiment_data_sources_type ON sentiment_data_sources(source_type);
CREATE INDEX idx_sentiment_data_sources_status ON sentiment_data_sources(status);

CREATE INDEX idx_source_breakdown_reading ON source_sentiment_breakdown(reading_id);
CREATE INDEX idx_source_breakdown_source ON source_sentiment_breakdown(source_id);

CREATE INDEX idx_segment_sentiments_reading ON segment_sentiments(reading_id);
CREATE INDEX idx_segment_sentiments_type ON segment_sentiments(segment_type);

CREATE INDEX idx_sentiment_drivers_segment ON sentiment_drivers(segment_id);
CREATE INDEX idx_sentiment_drivers_category ON sentiment_drivers(category);

CREATE INDEX idx_sentiment_history_bar ON sentiment_history(bar_id);
CREATE INDEX idx_sentiment_history_recorded ON sentiment_history(recorded_at);

CREATE INDEX idx_temporal_analysis_reading ON temporal_sentiment_analysis(reading_id);

CREATE INDEX idx_sentiment_alerts_bar ON sentiment_alerts(bar_id);
CREATE INDEX idx_sentiment_alerts_enabled ON sentiment_alerts(is_enabled);
CREATE INDEX idx_sentiment_alerts_priority ON sentiment_alerts(priority);

CREATE INDEX idx_alert_history_alert ON alert_history(alert_id);
CREATE INDEX idx_alert_history_triggered ON alert_history(triggered_at);
CREATE INDEX idx_alert_history_acknowledged ON alert_history(acknowledged);

CREATE INDEX idx_sentiment_compliance_bar ON sentiment_compliance_framework(bar_id);
CREATE INDEX idx_sentiment_compliance_jurisdiction ON sentiment_compliance_framework(jurisdiction);

CREATE INDEX idx_sentiment_performance_bar ON sentiment_performance_metrics(bar_id);
CREATE INDEX idx_sentiment_performance_type ON sentiment_performance_metrics(metric_type);
CREATE INDEX idx_sentiment_performance_recorded ON sentiment_performance_metrics(recorded_at);

-- Add updated_at trigger for market_sentiment_bars
CREATE OR REPLACE FUNCTION update_sentiment_bar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sentiment_bar_timestamp
    BEFORE UPDATE ON market_sentiment_bars
    FOR EACH ROW
    EXECUTE FUNCTION update_sentiment_bar_timestamp();

-- Add updated_at trigger for sentiment_data_sources
CREATE OR REPLACE FUNCTION update_sentiment_source_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sentiment_source_timestamp
    BEFORE UPDATE ON sentiment_data_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_sentiment_source_timestamp();

-- Add updated_at trigger for sentiment_alerts
CREATE OR REPLACE FUNCTION update_sentiment_alert_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sentiment_alert_timestamp
    BEFORE UPDATE ON sentiment_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_sentiment_alert_timestamp();

-- Add updated_at trigger for sentiment_compliance_framework
CREATE OR REPLACE FUNCTION update_sentiment_compliance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sentiment_compliance_timestamp
    BEFORE UPDATE ON sentiment_compliance_framework
    FOR EACH ROW
    EXECUTE FUNCTION update_sentiment_compliance_timestamp();

-- Create views for common queries
CREATE VIEW sentiment_bars_summary AS
SELECT 
    b.id,
    b.user_id,
    b.bar_name,
    b.description,
    b.is_active,
    b.created_at,
    b.updated_at,
    b.last_updated,
    COUNT(DISTINCT ds.id) as data_source_count,
    COUNT(DISTINCT sr.id) as reading_count,
    COALESCE(sr_latest.overall_sentiment, 0) as latest_sentiment,
    COALESCE(sr_latest.confidence, 0) as latest_confidence
FROM market_sentiment_bars b
LEFT JOIN sentiment_data_sources ds ON b.id = ds.bar_id AND ds.is_enabled = true
LEFT JOIN sentiment_readings sr ON b.id = sr.bar_id
LEFT JOIN LATERAL (
    SELECT overall_sentiment, confidence
    FROM sentiment_readings
    WHERE bar_id = b.id
    ORDER BY timestamp DESC
    LIMIT 1
) sr_latest ON true
GROUP BY b.id, b.user_id, b.bar_name, b.description, b.is_active, 
         b.created_at, b.updated_at, b.last_updated,
         sr_latest.overall_sentiment, sr_latest.confidence;

CREATE VIEW sentiment_performance_summary AS
SELECT 
    b.id as bar_id,
    b.bar_name,
    COUNT(DISTINCT sr.id) as total_readings,
    AVG(sr.overall_sentiment) as avg_sentiment,
    AVG(sr.confidence) as avg_confidence,
    AVG(pm.success_rate) as avg_success_rate,
    AVG(pm.average_latency_ms) as avg_latency_ms,
    AVG(pm.data_freshness_score) as avg_freshness_score,
    MAX(sr.timestamp) as last_reading_time
FROM market_sentiment_bars b
LEFT JOIN sentiment_readings sr ON b.id = sr.bar_id
LEFT JOIN sentiment_performance_metrics pm ON b.id = pm.bar_id
WHERE b.is_active = true
GROUP BY b.id, b.bar_name;

CREATE VIEW active_alerts_summary AS
SELECT 
    a.id as alert_id,
    a.bar_id,
    b.bar_name,
    a.alert_name,
    a.alert_type,
    a.priority,
    COUNT(ah.id) as trigger_count,
    MAX(ah.triggered_at) as last_triggered,
    SUM(CASE WHEN ah.acknowledged = false THEN 1 ELSE 0 END) as unacknowledged_count
FROM sentiment_alerts a
JOIN market_sentiment_bars b ON a.bar_id = b.id
LEFT JOIN alert_history ah ON a.id = ah.alert_id
WHERE a.is_enabled = true
GROUP BY a.id, a.bar_id, b.bar_name, a.alert_name, a.alert_type, a.priority;

-- Insert sample data for testing
INSERT INTO market_sentiment_bars (user_id, bar_name, description, sentiment_config, is_active)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'ASX Market Sentiment', 'Real-time sentiment for Australian equity markets', 
     '{"scope": {"marketScope": {"exchanges": ["ASX"], "indices": ["ASX200", "ASX300"], "assetClasses": ["equity"]}, "jurisdiction": "AU", "refreshInterval": "5m"}, "enabledSources": ["news", "options_flow", "vix", "bonds"], "aggregationMethod": "weighted_average"}'::jsonb, true),
    ('550e8400-e29b-41d4-a716-446655440001', 'NZX Market Sentiment', 'Real-time sentiment for New Zealand equity markets', 
     '{"scope": {"marketScope": {"exchanges": ["NZX"], "indices": ["NZX50"], "assetClasses": ["equity"]}, "jurisdiction": "NZ", "refreshInterval": "15m"}, "enabledSources": ["news", "bonds"], "aggregationMethod": "weighted_average"}'::jsonb, true);

-- Comment on tables and columns
COMMENT ON TABLE market_sentiment_bars IS 'Main configuration table for market sentiment bars';
COMMENT ON TABLE sentiment_readings IS 'Current and historical sentiment readings with quality metrics';
COMMENT ON TABLE component_sentiments IS 'Breakdown of sentiment by individual components';
COMMENT ON TABLE sentiment_factors IS 'Contributing factors to component sentiments';
COMMENT ON TABLE sentiment_data_sources IS 'External data source configurations and status';
COMMENT ON TABLE source_sentiment_breakdown IS 'Sentiment contribution by individual data sources';
COMMENT ON TABLE segment_sentiments IS 'Sentiment analysis by market segments';
COMMENT ON TABLE sentiment_drivers IS 'Key drivers for segment-specific sentiment';
COMMENT ON TABLE sentiment_history IS 'Historical tracking of sentiment readings';
COMMENT ON TABLE temporal_sentiment_analysis IS 'Time-based sentiment analysis and trends';
COMMENT ON TABLE sentiment_alerts IS 'Alert configurations and thresholds';
COMMENT ON TABLE alert_history IS 'Historical record of alert triggers and acknowledgments';
COMMENT ON TABLE sentiment_compliance_framework IS 'AU/NZ regulatory compliance tracking';
COMMENT ON TABLE sentiment_performance_metrics IS 'System performance and data quality metrics';

COMMENT ON COLUMN market_sentiment_bars.sentiment_config IS 'JSON configuration for sentiment calculation and data sources';
COMMENT ON COLUMN market_sentiment_bars.visualization_config IS 'JSON configuration for bar visualization and appearance';
COMMENT ON COLUMN market_sentiment_bars.alert_config IS 'JSON configuration for alerts and notifications';
COMMENT ON COLUMN sentiment_readings.overall_sentiment IS 'Overall sentiment score from -1 (very negative) to +1 (very positive)';
COMMENT ON COLUMN sentiment_readings.confidence IS 'Confidence score from 0 to 1 for the sentiment reading';
COMMENT ON COLUMN component_sentiments.sentiment IS 'Component-specific sentiment score from -1 to +1';
COMMENT ON COLUMN sentiment_data_sources.jurisdiction IS 'Regulatory jurisdiction: AU (Australia), NZ (New Zealand), or BOTH'; 