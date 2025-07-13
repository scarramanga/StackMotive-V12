-- Block 33: Notification Center - Database Schema
-- Complete Supabase migration for notification center functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE notification_type AS ENUM ('alerts', 'signals', 'gpt', 'system', 'trading');
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE notification_channel_type AS ENUM ('browser', 'email', 'webhook', 'sms');
CREATE TYPE digest_period AS ENUM ('daily', 'weekly');
CREATE TYPE rule_action_type AS ENUM ('auto_read', 'auto_archive', 'auto_dismiss', 'email', 'webhook');

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    priority notification_priority DEFAULT 'medium',
    
    -- Status flags
    read BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    dismissed BOOLEAN DEFAULT FALSE,
    
    -- Additional data (JSON payload)
    data JSONB DEFAULT '{}',
    
    -- Actions available for this notification
    actions JSONB DEFAULT '[]', -- Array of {id, label, action}
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    source VARCHAR(255), -- Where the notification originated
    correlation_id VARCHAR(255), -- For grouping related notifications
    metadata JSONB DEFAULT '{}'
);

-- Notification Settings table
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Global settings
    enabled BOOLEAN DEFAULT TRUE,
    max_stored_notifications INTEGER DEFAULT 1000 CHECK (max_stored_notifications > 0),
    auto_mark_read BOOLEAN DEFAULT FALSE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    browser_notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT FALSE,
    digest_frequency VARCHAR(20) DEFAULT 'never' CHECK (digest_frequency IN ('never', 'daily', 'weekly')),
    
    -- Category-specific settings
    alerts_enabled BOOLEAN DEFAULT TRUE,
    signals_enabled BOOLEAN DEFAULT TRUE,
    gpt_enabled BOOLEAN DEFAULT TRUE,
    system_enabled BOOLEAN DEFAULT TRUE,
    trading_enabled BOOLEAN DEFAULT TRUE,
    
    -- Advanced settings
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    weekend_notifications BOOLEAN DEFAULT TRUE,
    notification_retention_days INTEGER DEFAULT 30,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_notification_settings UNIQUE(user_id)
);

-- Notification Rules table (for auto-processing)
CREATE TABLE notification_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Rule conditions
    condition_types notification_type[] DEFAULT NULL, -- NULL means all types
    condition_priorities notification_priority[] DEFAULT NULL, -- NULL means all priorities
    condition_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    condition_older_than_days INTEGER,
    condition_source_pattern VARCHAR(255), -- Regex pattern for source matching
    
    -- Rule actions
    actions JSONB NOT NULL DEFAULT '[]', -- Array of {type, value}
    
    -- Rule metadata
    execution_count INTEGER DEFAULT 0,
    last_executed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_rule_name UNIQUE(user_id, name)
);

-- Notification Templates table
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type notification_type NOT NULL,
    
    -- Template content (supports {{variable}} substitution)
    title_template VARCHAR(500) NOT NULL,
    message_template TEXT NOT NULL,
    priority notification_priority DEFAULT 'medium',
    
    -- Template metadata
    usage_count INTEGER DEFAULT 0,
    variables JSONB DEFAULT '{}', -- Available template variables
    example_data JSONB DEFAULT '{}', -- Example data for preview
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_template_name UNIQUE(user_id, name)
);

-- Notification Channels table
CREATE TABLE notification_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type notification_channel_type NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Channel-specific configuration
    config JSONB NOT NULL DEFAULT '{}', -- Email address, webhook URL, etc.
    
    -- Rate limiting
    rate_limit_per_hour INTEGER DEFAULT 60,
    rate_limit_per_day INTEGER DEFAULT 500,
    
    -- Status tracking
    last_used TIMESTAMP WITH TIME ZONE,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_channel_name UNIQUE(user_id, name)
);

-- Notification Subscriptions table (which channels get which notifications)
CREATE TABLE notification_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
    
    -- Subscription filters
    types notification_type[] NOT NULL DEFAULT ARRAY['alerts', 'signals', 'gpt', 'system', 'trading'],
    priorities notification_priority[] NOT NULL DEFAULT ARRAY['low', 'medium', 'high'],
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Scheduling (when to send notifications via this channel)
    schedule_start_time TIME DEFAULT '08:00:00',
    schedule_end_time TIME DEFAULT '22:00:00',
    schedule_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- Days of week (1=Monday)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_channel_subscription UNIQUE(user_id, channel_id)
);

-- Notification Digests table
CREATE TABLE notification_digests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period digest_period NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Digest content
    notification_count INTEGER NOT NULL DEFAULT 0,
    high_priority_count INTEGER DEFAULT 0,
    alerts_count INTEGER DEFAULT 0,
    signals_count INTEGER DEFAULT 0,
    gpt_count INTEGER DEFAULT 0,
    trading_count INTEGER DEFAULT 0,
    system_count INTEGER DEFAULT 0,
    
    -- Digest metadata
    digest_data JSONB DEFAULT '{}', -- Summarized notification data
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    channels_sent TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Constraints
    CONSTRAINT unique_user_digest_period UNIQUE(user_id, period, start_date)
);

-- Notification Delivery Logs table
CREATE TABLE notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
    channel_id UUID REFERENCES notification_channels(id) ON DELETE SET NULL,
    
    -- Delivery details
    delivery_method notification_channel_type NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    
    -- Attempt tracking
    attempt_count INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 3,
    
    -- Timing
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    error_message TEXT,
    error_code VARCHAR(50),
    retry_after TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    delivery_data JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(user_id, type);
CREATE INDEX idx_notifications_priority ON notifications(user_id, priority);
CREATE INDEX idx_notifications_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_archived ON notifications(user_id, archived);
CREATE INDEX idx_notifications_dismissed ON notifications(user_id, dismissed);
CREATE INDEX idx_notifications_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_notifications_correlation_id ON notifications(correlation_id) WHERE correlation_id IS NOT NULL;

CREATE INDEX idx_notification_rules_user_id ON notification_rules(user_id);
CREATE INDEX idx_notification_rules_enabled ON notification_rules(user_id, enabled);

CREATE INDEX idx_notification_channels_user_id ON notification_channels(user_id);
CREATE INDEX idx_notification_channels_type ON notification_channels(user_id, type);
CREATE INDEX idx_notification_channels_enabled ON notification_channels(user_id, enabled);

CREATE INDEX idx_notification_subscriptions_user_id ON notification_subscriptions(user_id);
CREATE INDEX idx_notification_subscriptions_channel_id ON notification_subscriptions(channel_id);

CREATE INDEX idx_notification_digests_user_id ON notification_digests(user_id, period, start_date DESC);

CREATE INDEX idx_notification_delivery_logs_user_id ON notification_delivery_logs(user_id);
CREATE INDEX idx_notification_delivery_logs_notification_id ON notification_delivery_logs(notification_id);
CREATE INDEX idx_notification_delivery_logs_status ON notification_delivery_logs(status, sent_at DESC);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_read_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.read = TRUE AND OLD.read = FALSE THEN
        NEW.read_at = NOW();
    ELSIF NEW.read = FALSE THEN
        NEW.read_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_archived_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.archived = TRUE AND OLD.archived = FALSE THEN
        NEW.archived_at = NOW();
    ELSIF NEW.archived = FALSE THEN
        NEW.archived_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_dismissed_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.dismissed = TRUE AND OLD.dismissed = FALSE THEN
        NEW.dismissed_at = NOW();
    ELSIF NEW.dismissed = FALSE THEN
        NEW.dismissed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION expire_old_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-archive expired notifications
    UPDATE notifications 
    SET archived = TRUE, archived_at = NOW()
    WHERE expires_at < NOW() AND archived = FALSE;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notification_rules_updated_at
    BEFORE UPDATE ON notification_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notification_channels_updated_at
    BEFORE UPDATE ON notification_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notification_subscriptions_updated_at
    BEFORE UPDATE ON notification_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notification_read_timestamp
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION set_read_timestamp();

CREATE TRIGGER trigger_notification_archived_timestamp
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION set_archived_timestamp();

CREATE TRIGGER trigger_notification_dismissed_timestamp
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION set_dismissed_timestamp();

-- Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification settings" ON notification_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification rules" ON notification_rules
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification templates" ON notification_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification channels" ON notification_channels
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification subscriptions" ON notification_subscriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notification digests" ON notification_digests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own delivery logs" ON notification_delivery_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Views for common queries
CREATE VIEW notification_summary AS
SELECT 
    n.user_id,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE NOT n.read) as unread_count,
    COUNT(*) FILTER (WHERE n.archived) as archived_count,
    COUNT(*) FILTER (WHERE n.dismissed) as dismissed_count,
    COUNT(*) FILTER (WHERE n.priority = 'high') as high_priority_count,
    COUNT(*) FILTER (WHERE n.type = 'alerts') as alerts_count,
    COUNT(*) FILTER (WHERE n.type = 'signals') as signals_count,
    COUNT(*) FILTER (WHERE n.type = 'gpt') as gpt_count,
    COUNT(*) FILTER (WHERE n.type = 'trading') as trading_count,
    COUNT(*) FILTER (WHERE n.type = 'system') as system_count,
    MIN(n.created_at) FILTER (WHERE NOT n.read) as oldest_unread,
    MAX(n.created_at) FILTER (WHERE NOT n.read) as newest_unread
FROM notifications n
GROUP BY n.user_id;

-- Sample data for development (uncomment if needed)
/*
INSERT INTO notification_settings (user_id) VALUES (auth.uid());

INSERT INTO notification_templates (user_id, name, type, title_template, message_template) VALUES
    (auth.uid(), 'Price Alert', 'alerts', '{{symbol}} Price Alert', '{{symbol}} has {{direction}} your target price of {{target_price}}'),
    (auth.uid(), 'Signal Alert', 'signals', '{{symbol}} Signal', 'New {{signal_type}} signal for {{symbol}}: {{message}}'),
    (auth.uid(), 'System Update', 'system', 'System {{type}}', '{{message}}');
*/

-- Comments
COMMENT ON TABLE notifications IS 'All user notifications from various system sources';
COMMENT ON TABLE notification_settings IS 'User preferences for notification behavior';
COMMENT ON TABLE notification_rules IS 'Automated rules for processing notifications';
COMMENT ON TABLE notification_templates IS 'Reusable templates for generating notifications';
COMMENT ON TABLE notification_channels IS 'Delivery channels for notifications (email, webhook, etc.)';
COMMENT ON TABLE notification_subscriptions IS 'User subscriptions to specific notification channels';
COMMENT ON TABLE notification_digests IS 'Periodic summaries of notifications';
COMMENT ON TABLE notification_delivery_logs IS 'Audit trail of notification delivery attempts'; 