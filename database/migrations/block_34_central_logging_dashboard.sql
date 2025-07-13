-- Block 34: Central Logging Dashboard - Database Schema
-- Complete Supabase migration for central logging functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE log_level AS ENUM ('debug', 'info', 'warn', 'error');
CREATE TYPE log_category AS ENUM (
    'system', 
    'user_action', 
    'api', 
    'error', 
    'gpt', 
    'signals', 
    'trading', 
    'auth', 
    'data', 
    'performance',
    'security',
    'notifications'
);
CREATE TYPE log_export_format AS ENUM ('json', 'csv');
CREATE TYPE metrics_period AS ENUM ('hour', 'day', 'week', 'month');

-- Log Entries table
CREATE TABLE log_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    level log_level NOT NULL,
    category log_category NOT NULL,
    message TEXT NOT NULL,
    
    -- Context information
    source VARCHAR(255) NOT NULL, -- Component/service that generated the log
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    
    -- Additional data (JSON payload)
    data JSONB DEFAULT '{}',
    
    -- Tagging system
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Error context (for error logs)
    error_code VARCHAR(100),
    error_stack TEXT,
    
    -- Performance metrics (for performance logs)
    duration_ms INTEGER,
    memory_usage_mb DECIMAL(10, 2),
    cpu_usage_percent DECIMAL(5, 2),
    
    -- Request context (for API logs)
    request_id VARCHAR(255),
    endpoint VARCHAR(500),
    http_method VARCHAR(10),
    http_status INTEGER,
    user_agent TEXT,
    ip_address INET,
    
    -- Metadata
    correlation_id VARCHAR(255), -- For grouping related logs
    parent_log_id UUID REFERENCES log_entries(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'
);

-- Log Settings table
CREATE TABLE log_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Retention settings
    max_log_entries INTEGER DEFAULT 100000 CHECK (max_log_entries > 0),
    retention_period_days INTEGER DEFAULT 90 CHECK (retention_period_days > 0),
    auto_cleanup BOOLEAN DEFAULT TRUE,
    
    -- Logging preferences
    enabled_log_levels log_level[] DEFAULT ARRAY['debug', 'info', 'warn', 'error'],
    enabled_categories log_category[] DEFAULT ARRAY['system', 'user_action', 'api', 'error', 'gpt', 'signals', 'trading', 'auth', 'data', 'performance', 'security', 'notifications'],
    
    -- Notification settings
    enable_notifications BOOLEAN DEFAULT TRUE,
    enable_export BOOLEAN DEFAULT TRUE,
    
    -- Performance settings
    buffer_size INTEGER DEFAULT 1000,
    flush_interval_seconds INTEGER DEFAULT 60,
    
    -- Display preferences
    default_page_size INTEGER DEFAULT 50 CHECK (default_page_size > 0 AND default_page_size <= 1000),
    auto_refresh_interval_seconds INTEGER DEFAULT 30,
    show_stack_traces BOOLEAN DEFAULT TRUE,
    show_performance_metrics BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_log_settings UNIQUE(user_id)
);

-- Log Alerts table
CREATE TABLE log_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Alert conditions
    condition_level log_level,
    condition_category log_category,
    condition_source VARCHAR(255),
    condition_message_pattern VARCHAR(1000), -- Regex pattern
    condition_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Frequency-based conditions
    frequency_count INTEGER, -- Number of occurrences
    frequency_time_window_minutes INTEGER, -- Within this time window
    
    -- Alert actions
    action_notify BOOLEAN DEFAULT TRUE,
    action_email TEXT[], -- Email addresses to notify
    action_webhook TEXT, -- Webhook URL
    action_create_notification BOOLEAN DEFAULT FALSE,
    
    -- Alert metadata
    last_triggered TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_alert_name UNIQUE(user_id, name),
    CONSTRAINT valid_frequency_settings CHECK (
        (frequency_count IS NULL AND frequency_time_window_minutes IS NULL) OR
        (frequency_count IS NOT NULL AND frequency_time_window_minutes IS NOT NULL AND 
         frequency_count > 0 AND frequency_time_window_minutes > 0)
    )
);

-- Log Metrics table (aggregated statistics)
CREATE TABLE log_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period metrics_period NOT NULL,
    
    -- Time range for this metric
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Total counts
    total_logs INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    warn_count INTEGER DEFAULT 0,
    info_count INTEGER DEFAULT 0,
    debug_count INTEGER DEFAULT 0,
    
    -- Performance metrics
    average_logs_per_minute DECIMAL(10, 2) DEFAULT 0,
    peak_logs_per_minute INTEGER DEFAULT 0,
    average_response_time_ms DECIMAL(10, 2),
    
    -- Top errors (JSON array)
    top_errors JSONB DEFAULT '[]', -- [{message, count}, ...]
    top_sources JSONB DEFAULT '[]', -- [{source, count}, ...]
    top_endpoints JSONB DEFAULT '[]', -- [{endpoint, count}, ...]
    
    -- Category breakdown
    category_breakdown JSONB DEFAULT '{}', -- {category: count, ...}
    
    -- Additional metrics
    unique_users INTEGER DEFAULT 0,
    unique_sessions INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT unique_user_period_metrics UNIQUE(user_id, period, period_start)
);

-- Log Export Jobs table
CREATE TABLE log_export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Export parameters
    format log_export_format NOT NULL,
    
    -- Filters applied
    filter_levels log_level[] DEFAULT NULL,
    filter_categories log_category[] DEFAULT NULL,
    filter_sources TEXT[] DEFAULT NULL,
    filter_date_from TIMESTAMP WITH TIME ZONE,
    filter_date_to TIMESTAMP WITH TIME ZONE,
    filter_user_id UUID,
    filter_session_id VARCHAR(255),
    filter_tags TEXT[] DEFAULT NULL,
    filter_search_query TEXT,
    
    -- Job status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Results
    total_entries INTEGER,
    file_path TEXT, -- Path to exported file
    file_size_bytes BIGINT,
    download_url TEXT,
    
    -- Progress tracking
    processed_entries INTEGER DEFAULT 0,
    progress_percent DECIMAL(5, 2) DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- When download link expires
    
    -- Error handling
    error_message TEXT,
    error_details JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Log Search History table (for query optimization)
CREATE TABLE log_search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Search parameters
    search_query TEXT,
    filters JSONB NOT NULL DEFAULT '{}', -- Complete filter object
    
    -- Search metadata
    result_count INTEGER,
    execution_time_ms INTEGER,
    used_indexes TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Usage tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 1
);

-- Indexes for performance
CREATE INDEX idx_log_entries_timestamp ON log_entries(timestamp DESC);
CREATE INDEX idx_log_entries_level ON log_entries(level);
CREATE INDEX idx_log_entries_category ON log_entries(category);
CREATE INDEX idx_log_entries_source ON log_entries(source);
CREATE INDEX idx_log_entries_user_id ON log_entries(user_id, timestamp DESC);
CREATE INDEX idx_log_entries_session_id ON log_entries(session_id, timestamp DESC);
CREATE INDEX idx_log_entries_tags ON log_entries USING GIN(tags);
CREATE INDEX idx_log_entries_correlation_id ON log_entries(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_log_entries_request_id ON log_entries(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX idx_log_entries_endpoint ON log_entries(endpoint) WHERE endpoint IS NOT NULL;
CREATE INDEX idx_log_entries_level_timestamp ON log_entries(level, timestamp DESC);
CREATE INDEX idx_log_entries_category_timestamp ON log_entries(category, timestamp DESC);
CREATE INDEX idx_log_entries_user_level_timestamp ON log_entries(user_id, level, timestamp DESC);

-- Composite indexes for common queries
CREATE INDEX idx_log_entries_level_category_timestamp ON log_entries(level, category, timestamp DESC);
CREATE INDEX idx_log_entries_user_category_timestamp ON log_entries(user_id, category, timestamp DESC);

-- Full text search index
CREATE INDEX idx_log_entries_message_fts ON log_entries USING GIN(to_tsvector('english', message));

-- Other table indexes
CREATE INDEX idx_log_alerts_user_id ON log_alerts(user_id);
CREATE INDEX idx_log_alerts_enabled ON log_alerts(user_id, enabled);
CREATE INDEX idx_log_alerts_last_triggered ON log_alerts(last_triggered DESC) WHERE last_triggered IS NOT NULL;

CREATE INDEX idx_log_metrics_user_id ON log_metrics(user_id, period, period_start DESC);
CREATE INDEX idx_log_metrics_period ON log_metrics(period, period_start DESC);
CREATE INDEX idx_log_metrics_timestamp ON log_metrics(timestamp DESC);

CREATE INDEX idx_log_export_jobs_user_id ON log_export_jobs(user_id, created_at DESC);
CREATE INDEX idx_log_export_jobs_status ON log_export_jobs(status, created_at DESC);

CREATE INDEX idx_log_search_history_user_id ON log_search_history(user_id, last_used DESC);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_export_job_progress()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_entries > 0 THEN
        NEW.progress_percent = (NEW.processed_entries::DECIMAL / NEW.total_entries) * 100;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_log_alerts()
RETURNS TRIGGER AS $$
DECLARE
    alert_record RECORD;
    condition_met BOOLEAN;
    frequency_check_passed BOOLEAN;
    alert_count INTEGER;
BEGIN
    -- Check each enabled alert for this user (if user_id exists)
    IF NEW.user_id IS NOT NULL THEN
        FOR alert_record IN 
            SELECT * FROM log_alerts 
            WHERE user_id = NEW.user_id AND enabled = TRUE
        LOOP
            condition_met := TRUE;
            
            -- Check level condition
            IF alert_record.condition_level IS NOT NULL AND NEW.level != alert_record.condition_level THEN
                condition_met := FALSE;
            END IF;
            
            -- Check category condition
            IF condition_met AND alert_record.condition_category IS NOT NULL AND NEW.category != alert_record.condition_category THEN
                condition_met := FALSE;
            END IF;
            
            -- Check source condition
            IF condition_met AND alert_record.condition_source IS NOT NULL AND NEW.source != alert_record.condition_source THEN
                condition_met := FALSE;
            END IF;
            
            -- Check message pattern
            IF condition_met AND alert_record.condition_message_pattern IS NOT NULL 
               AND NEW.message !~ alert_record.condition_message_pattern THEN
                condition_met := FALSE;
            END IF;
            
            -- Check tags condition
            IF condition_met AND array_length(alert_record.condition_tags, 1) > 0 
               AND NOT (alert_record.condition_tags && NEW.tags) THEN
                condition_met := FALSE;
            END IF;
            
            -- Check frequency condition if basic conditions are met
            IF condition_met AND alert_record.frequency_count IS NOT NULL THEN
                SELECT COUNT(*) INTO alert_count
                FROM log_entries
                WHERE user_id = NEW.user_id
                  AND timestamp >= NOW() - INTERVAL '1 minute' * alert_record.frequency_time_window_minutes
                  AND (alert_record.condition_level IS NULL OR level = alert_record.condition_level)
                  AND (alert_record.condition_category IS NULL OR category = alert_record.condition_category)
                  AND (alert_record.condition_source IS NULL OR source = alert_record.condition_source)
                  AND (alert_record.condition_message_pattern IS NULL OR message ~ alert_record.condition_message_pattern)
                  AND (array_length(alert_record.condition_tags, 1) = 0 OR alert_record.condition_tags && tags);
                
                condition_met := alert_count >= alert_record.frequency_count;
            END IF;
            
            -- If all conditions are met, trigger the alert
            IF condition_met THEN
                UPDATE log_alerts 
                SET last_triggered = NOW(), trigger_count = trigger_count + 1
                WHERE id = alert_record.id;
                
                -- Create notification if enabled
                IF alert_record.action_create_notification THEN
                    INSERT INTO notifications (user_id, type, title, message, priority, data)
                    VALUES (
                        NEW.user_id,
                        'system',
                        'Log Alert: ' || alert_record.name,
                        'Alert triggered for log entry: ' || NEW.message,
                        'high',
                        jsonb_build_object(
                            'alert_id', alert_record.id,
                            'log_entry_id', NEW.id,
                            'alert_name', alert_record.name
                        )
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_log_settings_updated_at
    BEFORE UPDATE ON log_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_log_alerts_updated_at
    BEFORE UPDATE ON log_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_export_job_progress
    BEFORE UPDATE ON log_export_jobs
    FOR EACH ROW EXECUTE FUNCTION update_export_job_progress();

CREATE TRIGGER trigger_check_log_alerts
    AFTER INSERT ON log_entries
    FOR EACH ROW EXECUTE FUNCTION check_log_alerts();

-- Row Level Security (RLS)
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_search_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view logs they have access to" ON log_entries
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id IS NULL OR
        auth.uid() IN (SELECT user_id FROM log_settings WHERE user_id = auth.uid())
    );

CREATE POLICY "System can insert all log entries" ON log_entries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their own log settings" ON log_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own log alerts" ON log_alerts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own log metrics" ON log_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own export jobs" ON log_export_jobs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own search history" ON log_search_history
    FOR ALL USING (auth.uid() = user_id);

-- Views for common queries
CREATE VIEW log_summary AS
SELECT 
    user_id,
    COUNT(*) as total_logs,
    COUNT(*) FILTER (WHERE level = 'error') as error_count,
    COUNT(*) FILTER (WHERE level = 'warn') as warn_count,
    COUNT(*) FILTER (WHERE level = 'info') as info_count,
    COUNT(*) FILTER (WHERE level = 'debug') as debug_count,
    COUNT(DISTINCT source) as unique_sources,
    COUNT(DISTINCT session_id) as unique_sessions,
    MIN(timestamp) as oldest_log,
    MAX(timestamp) as newest_log,
    AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as avg_duration_ms
FROM log_entries
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY user_id;

CREATE VIEW recent_errors AS
SELECT 
    le.*,
    COUNT(*) OVER (PARTITION BY user_id, message) as error_frequency
FROM log_entries le
WHERE level = 'error' 
  AND timestamp >= NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;

-- Sample data for development (uncomment if needed)
/*
-- Insert default log settings for new users
INSERT INTO log_settings (user_id) VALUES (auth.uid());

-- Sample log alert
INSERT INTO log_alerts (user_id, name, condition_level, condition_category, frequency_count, frequency_time_window_minutes) 
VALUES (auth.uid(), 'High Error Rate', 'error', 'system', 5, 10);
*/

-- Comments
COMMENT ON TABLE log_entries IS 'Central repository for all application logs';
COMMENT ON TABLE log_settings IS 'User preferences for log display and behavior';
COMMENT ON TABLE log_alerts IS 'Automated alerts based on log patterns';
COMMENT ON TABLE log_metrics IS 'Aggregated logging statistics and metrics';
COMMENT ON TABLE log_export_jobs IS 'Background jobs for exporting log data';
COMMENT ON TABLE log_search_history IS 'User search history for query optimization'; 