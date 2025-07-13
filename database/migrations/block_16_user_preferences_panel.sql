-- Block 16: User Preferences Panel - Database Schema
-- Comprehensive user preferences and settings management system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Main User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Display Preferences
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system', 'auto')),
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'Pacific/Auckland',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    time_format TEXT DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
    number_format TEXT DEFAULT 'en-US',
    
    -- Currency and Regional
    base_currency TEXT DEFAULT 'NZD' CHECK (base_currency IN ('NZD', 'AUD', 'USD', 'EUR', 'GBP')),
    secondary_currency TEXT,
    currency_display_format TEXT DEFAULT 'symbol', -- 'symbol', 'code', 'name'
    
    -- Dashboard Layout
    dashboard_layout TEXT DEFAULT 'default',
    sidebar_collapsed BOOLEAN DEFAULT false,
    panel_arrangement JSONB DEFAULT '[]',
    default_page TEXT DEFAULT '/dashboard',
    
    -- Data Preferences
    auto_refresh_enabled BOOLEAN DEFAULT true,
    auto_refresh_interval INTEGER DEFAULT 30, -- seconds
    data_retention_days INTEGER DEFAULT 365,
    cache_enabled BOOLEAN DEFAULT true,
    
    -- Notification Preferences
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    slack_notifications BOOLEAN DEFAULT false,
    discord_notifications BOOLEAN DEFAULT false,
    
    -- Trading Preferences
    default_order_type TEXT DEFAULT 'market' CHECK (default_order_type IN ('market', 'limit', 'stop')),
    confirm_trades BOOLEAN DEFAULT true,
    show_advanced_trading BOOLEAN DEFAULT false,
    paper_trading_default BOOLEAN DEFAULT true,
    
    -- Chart Preferences
    default_chart_type TEXT DEFAULT 'candlestick',
    chart_theme TEXT DEFAULT 'light',
    show_volume BOOLEAN DEFAULT true,
    show_indicators BOOLEAN DEFAULT true,
    chart_timeframe TEXT DEFAULT '1D',
    
    -- Privacy Settings
    profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('public', 'private', 'friends')),
    show_performance BOOLEAN DEFAULT false,
    show_holdings BOOLEAN DEFAULT false,
    analytics_tracking BOOLEAN DEFAULT true,
    
    -- Accessibility
    high_contrast BOOLEAN DEFAULT false,
    large_text BOOLEAN DEFAULT false,
    reduce_motion BOOLEAN DEFAULT false,
    screen_reader_support BOOLEAN DEFAULT false,
    keyboard_navigation BOOLEAN DEFAULT false,
    
    -- Performance Settings
    lazy_loading BOOLEAN DEFAULT true,
    image_optimization BOOLEAN DEFAULT true,
    animation_enabled BOOLEAN DEFAULT true,
    transition_speed TEXT DEFAULT 'normal' CHECK (transition_speed IN ('slow', 'normal', 'fast')),
    
    -- Advanced Settings
    debug_mode BOOLEAN DEFAULT false,
    beta_features BOOLEAN DEFAULT false,
    developer_mode BOOLEAN DEFAULT false,
    api_rate_limit INTEGER DEFAULT 100,
    
    -- Backup and Sync
    auto_backup BOOLEAN DEFAULT true,
    backup_frequency TEXT DEFAULT 'daily' CHECK (backup_frequency IN ('hourly', 'daily', 'weekly')),
    cloud_sync BOOLEAN DEFAULT true,
    sync_across_devices BOOLEAN DEFAULT true,
    
    -- Custom Settings (for extensibility)
    custom_settings JSONB DEFAULT '{}',
    
    -- Metadata
    last_updated_section TEXT,
    preferences_version TEXT DEFAULT '1.0',
    migration_status TEXT DEFAULT 'current',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Theme Preferences Table (detailed theme settings)
CREATE TABLE IF NOT EXISTS user_theme_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core Theme Settings
    theme_mode TEXT DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system', 'auto')),
    color_scheme TEXT DEFAULT 'default',
    accent_color TEXT DEFAULT '#3B82F6',
    primary_color TEXT DEFAULT '#1E40AF',
    secondary_color TEXT DEFAULT '#64748B',
    
    -- Typography
    font_family TEXT DEFAULT 'Inter',
    font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'extra_large')),
    font_weight TEXT DEFAULT 'normal' CHECK (font_weight IN ('light', 'normal', 'medium', 'bold')),
    line_height DECIMAL(3,2) DEFAULT 1.5,
    letter_spacing DECIMAL(3,2) DEFAULT 0.0,
    
    -- Layout
    container_width TEXT DEFAULT 'full' CHECK (container_width IN ('narrow', 'normal', 'wide', 'full')),
    border_radius TEXT DEFAULT 'medium' CHECK (border_radius IN ('none', 'small', 'medium', 'large')),
    shadow_intensity TEXT DEFAULT 'medium' CHECK (shadow_intensity IN ('none', 'light', 'medium', 'strong')),
    
    -- Component Styling
    button_style TEXT DEFAULT 'default',
    input_style TEXT DEFAULT 'default',
    card_style TEXT DEFAULT 'default',
    
    -- Dark Mode Specific
    dark_mode_accent TEXT DEFAULT '#60A5FA',
    dark_mode_background TEXT DEFAULT '#0F172A',
    dark_mode_surface TEXT DEFAULT '#1E293B',
    dark_mode_text TEXT DEFAULT '#F1F5F9',
    
    -- Custom CSS
    custom_css TEXT,
    css_variables JSONB DEFAULT '{}',
    
    -- Responsive Settings
    mobile_optimized BOOLEAN DEFAULT true,
    tablet_layout TEXT DEFAULT 'adaptive',
    desktop_layout TEXT DEFAULT 'full',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Notification Preferences Table (detailed notification settings)
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Email Notifications
    email_enabled BOOLEAN DEFAULT true,
    email_address TEXT,
    email_frequency TEXT DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
    email_types JSONB DEFAULT '["trades", "alerts", "reports"]',
    
    -- Push Notifications
    push_enabled BOOLEAN DEFAULT true,
    push_device_tokens JSONB DEFAULT '[]',
    push_types JSONB DEFAULT '["price_alerts", "trade_confirmations"]',
    
    -- SMS Notifications
    sms_enabled BOOLEAN DEFAULT false,
    sms_number TEXT,
    sms_types JSONB DEFAULT '["urgent_alerts"]',
    
    -- In-App Notifications
    in_app_enabled BOOLEAN DEFAULT true,
    in_app_position TEXT DEFAULT 'top-right' CHECK (in_app_position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right')),
    in_app_duration INTEGER DEFAULT 5000, -- milliseconds
    
    -- Webhook Notifications
    webhook_enabled BOOLEAN DEFAULT false,
    webhook_url TEXT,
    webhook_secret TEXT,
    webhook_events JSONB DEFAULT '[]',
    
    -- Slack Integration
    slack_enabled BOOLEAN DEFAULT false,
    slack_webhook_url TEXT,
    slack_channel TEXT DEFAULT '#trading',
    slack_username TEXT DEFAULT 'StackMotive',
    
    -- Discord Integration
    discord_enabled BOOLEAN DEFAULT false,
    discord_webhook_url TEXT,
    discord_username TEXT DEFAULT 'StackMotive Bot',
    
    -- Telegram Integration
    telegram_enabled BOOLEAN DEFAULT false,
    telegram_bot_token TEXT,
    telegram_chat_id TEXT,
    
    -- Notification Categories
    trade_notifications BOOLEAN DEFAULT true,
    price_alerts BOOLEAN DEFAULT true,
    portfolio_alerts BOOLEAN DEFAULT true,
    market_news BOOLEAN DEFAULT false,
    system_notifications BOOLEAN DEFAULT true,
    security_alerts BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    
    -- Quiet Hours
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    quiet_hours_timezone TEXT DEFAULT 'Pacific/Auckland',
    
    -- Rate Limiting
    max_notifications_per_hour INTEGER DEFAULT 10,
    max_notifications_per_day INTEGER DEFAULT 100,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Trading Preferences Table (detailed trading settings)
CREATE TABLE IF NOT EXISTS user_trading_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Order Defaults
    default_order_type TEXT DEFAULT 'market',
    default_time_in_force TEXT DEFAULT 'GTC' CHECK (default_time_in_force IN ('GTC', 'IOC', 'FOK', 'DAY')),
    default_position_size DECIMAL(5,2) DEFAULT 1.0, -- percentage
    default_stop_loss DECIMAL(5,2) DEFAULT 5.0, -- percentage
    default_take_profit DECIMAL(5,2) DEFAULT 10.0, -- percentage
    
    -- Risk Management
    max_position_size DECIMAL(5,2) DEFAULT 25.0, -- percentage
    max_daily_loss DECIMAL(10,2) DEFAULT 1000.0,
    max_drawdown DECIMAL(5,2) DEFAULT 20.0, -- percentage
    risk_per_trade DECIMAL(5,2) DEFAULT 2.0, -- percentage
    
    -- Trading Modes
    paper_trading_enabled BOOLEAN DEFAULT true,
    live_trading_enabled BOOLEAN DEFAULT false,
    copy_trading_enabled BOOLEAN DEFAULT false,
    auto_trading_enabled BOOLEAN DEFAULT false,
    
    -- Confirmations
    confirm_market_orders BOOLEAN DEFAULT false,
    confirm_limit_orders BOOLEAN DEFAULT true,
    confirm_stop_orders BOOLEAN DEFAULT true,
    confirm_large_orders BOOLEAN DEFAULT true,
    large_order_threshold DECIMAL(10,2) DEFAULT 10000.0,
    
    -- Market Data
    real_time_data BOOLEAN DEFAULT true,
    level_2_data BOOLEAN DEFAULT false,
    news_feed_enabled BOOLEAN DEFAULT true,
    market_analysis BOOLEAN DEFAULT true,
    
    -- Advanced Features
    margin_trading BOOLEAN DEFAULT false,
    options_trading BOOLEAN DEFAULT false,
    futures_trading BOOLEAN DEFAULT false,
    crypto_trading BOOLEAN DEFAULT true,
    
    -- Automation
    trailing_stops BOOLEAN DEFAULT false,
    bracket_orders BOOLEAN DEFAULT false,
    oco_orders BOOLEAN DEFAULT false, -- One-Cancels-Other
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- User Interface Preferences Table
CREATE TABLE IF NOT EXISTS user_interface_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Layout Preferences
    layout_style TEXT DEFAULT 'modern',
    navigation_style TEXT DEFAULT 'sidebar',
    header_style TEXT DEFAULT 'fixed',
    footer_style TEXT DEFAULT 'minimal',
    
    -- Panel Configuration
    show_sidebar BOOLEAN DEFAULT true,
    sidebar_width INTEGER DEFAULT 250, -- pixels
    show_toolbar BOOLEAN DEFAULT true,
    show_status_bar BOOLEAN DEFAULT true,
    show_breadcrumbs BOOLEAN DEFAULT true,
    
    -- Dashboard Configuration
    dashboard_widgets JSONB DEFAULT '["portfolio", "watchlist", "news", "analysis"]',
    widget_arrangement JSONB DEFAULT '{}',
    default_dashboard_tab TEXT DEFAULT 'overview',
    
    -- Chart Configuration
    chart_layout TEXT DEFAULT 'single',
    chart_tools_visible BOOLEAN DEFAULT true,
    chart_studies JSONB DEFAULT '["volume", "ma20", "rsi"]',
    
    -- Table Configuration
    table_density TEXT DEFAULT 'normal' CHECK (table_density IN ('compact', 'normal', 'comfortable')),
    table_page_size INTEGER DEFAULT 25,
    table_auto_resize BOOLEAN DEFAULT true,
    
    -- Form Configuration
    form_validation_style TEXT DEFAULT 'inline',
    form_save_frequency INTEGER DEFAULT 30, -- seconds
    form_auto_complete BOOLEAN DEFAULT true,
    
    -- Shortcuts and Hotkeys
    keyboard_shortcuts JSONB DEFAULT '{}',
    mouse_shortcuts JSONB DEFAULT '{}',
    quick_actions JSONB DEFAULT '[]',
    
    -- Customization
    custom_css TEXT,
    custom_javascript TEXT,
    theme_overrides JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Security Preferences Table
CREATE TABLE IF NOT EXISTS user_security_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Authentication
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_method TEXT DEFAULT 'totp' CHECK (two_factor_method IN ('totp', 'sms', 'email', 'hardware')),
    backup_codes_generated BOOLEAN DEFAULT false,
    
    -- Session Management
    session_timeout INTEGER DEFAULT 3600, -- seconds
    remember_me_enabled BOOLEAN DEFAULT true,
    concurrent_sessions_allowed INTEGER DEFAULT 3,
    force_logout_on_ip_change BOOLEAN DEFAULT false,
    
    -- API Security
    api_access_enabled BOOLEAN DEFAULT false,
    api_rate_limit INTEGER DEFAULT 100,
    api_ip_whitelist JSONB DEFAULT '[]',
    webhook_verification BOOLEAN DEFAULT true,
    
    -- Privacy
    activity_logging BOOLEAN DEFAULT true,
    data_sharing_analytics BOOLEAN DEFAULT true,
    data_sharing_marketing BOOLEAN DEFAULT false,
    data_retention_period INTEGER DEFAULT 2555, -- days (7 years)
    
    -- Login Security
    login_ip_restrictions BOOLEAN DEFAULT false,
    allowed_ip_addresses JSONB DEFAULT '[]',
    suspicious_login_alerts BOOLEAN DEFAULT true,
    
    -- Data Export
    data_export_enabled BOOLEAN DEFAULT true,
    data_export_format TEXT DEFAULT 'json' CHECK (data_export_format IN ('json', 'csv', 'xml')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Preference Change History Table
CREATE TABLE IF NOT EXISTS user_preference_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Change Details
    preference_category TEXT NOT NULL, -- 'theme', 'notifications', 'trading', etc.
    preference_key TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    
    -- Change Context
    changed_by TEXT DEFAULT 'user', -- 'user', 'system', 'migration'
    change_source TEXT DEFAULT 'web', -- 'web', 'mobile', 'api'
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    change_reason TEXT,
    rollback_data JSONB, -- For potential rollbacks
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_theme_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trading_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interface_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference_history ENABLE ROW LEVEL SECURITY;

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own theme preferences" ON user_theme_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences" ON user_notification_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trading preferences" ON user_trading_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own interface preferences" ON user_interface_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own security preferences" ON user_security_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Preference history policies
CREATE POLICY "Users can view own preference history" ON user_preference_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert preference history" ON user_preference_history
    FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_theme ON user_preferences(theme);
CREATE INDEX idx_user_preferences_language ON user_preferences(language);
CREATE INDEX idx_user_preferences_base_currency ON user_preferences(base_currency);

CREATE INDEX idx_user_theme_preferences_user_id ON user_theme_preferences(user_id);
CREATE INDEX idx_user_theme_preferences_theme_mode ON user_theme_preferences(theme_mode);

CREATE INDEX idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX idx_user_notification_preferences_email_enabled ON user_notification_preferences(email_enabled);

CREATE INDEX idx_user_trading_preferences_user_id ON user_trading_preferences(user_id);
CREATE INDEX idx_user_trading_preferences_paper_trading ON user_trading_preferences(paper_trading_enabled);

CREATE INDEX idx_user_interface_preferences_user_id ON user_interface_preferences(user_id);
CREATE INDEX idx_user_interface_preferences_layout_style ON user_interface_preferences(layout_style);

CREATE INDEX idx_user_security_preferences_user_id ON user_security_preferences(user_id);
CREATE INDEX idx_user_security_preferences_two_factor ON user_security_preferences(two_factor_enabled);

CREATE INDEX idx_user_preference_history_user_id ON user_preference_history(user_id);
CREATE INDEX idx_user_preference_history_category ON user_preference_history(preference_category);
CREATE INDEX idx_user_preference_history_created_at ON user_preference_history(created_at DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_theme_preferences_updated_at
    BEFORE UPDATE ON user_theme_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_trading_preferences_updated_at
    BEFORE UPDATE ON user_trading_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_interface_preferences_updated_at
    BEFORE UPDATE ON user_interface_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_security_preferences_updated_at
    BEFORE UPDATE ON user_security_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for preference management
CREATE OR REPLACE FUNCTION get_user_preferences(
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    preferences JSONB;
    theme_prefs JSONB;
    notification_prefs JSONB;
    trading_prefs JSONB;
    interface_prefs JSONB;
    security_prefs JSONB;
BEGIN
    -- Get main preferences
    SELECT to_jsonb(up.*) INTO preferences
    FROM user_preferences up
    WHERE up.user_id = p_user_id;
    
    -- Get theme preferences
    SELECT to_jsonb(utp.*) INTO theme_prefs
    FROM user_theme_preferences utp
    WHERE utp.user_id = p_user_id;
    
    -- Get notification preferences
    SELECT to_jsonb(unp.*) INTO notification_prefs
    FROM user_notification_preferences unp
    WHERE unp.user_id = p_user_id;
    
    -- Get trading preferences
    SELECT to_jsonb(utrp.*) INTO trading_prefs
    FROM user_trading_preferences utrp
    WHERE utrp.user_id = p_user_id;
    
    -- Get interface preferences
    SELECT to_jsonb(uip.*) INTO interface_prefs
    FROM user_interface_preferences uip
    WHERE uip.user_id = p_user_id;
    
    -- Get security preferences (limited fields)
    SELECT jsonb_build_object(
        'two_factor_enabled', usp.two_factor_enabled,
        'session_timeout', usp.session_timeout,
        'api_access_enabled', usp.api_access_enabled
    ) INTO security_prefs
    FROM user_security_preferences usp
    WHERE usp.user_id = p_user_id;
    
    -- Combine all preferences
    RETURN jsonb_build_object(
        'general', COALESCE(preferences, '{}'::jsonb),
        'theme', COALESCE(theme_prefs, '{}'::jsonb),
        'notifications', COALESCE(notification_prefs, '{}'::jsonb),
        'trading', COALESCE(trading_prefs, '{}'::jsonb),
        'interface', COALESCE(interface_prefs, '{}'::jsonb),
        'security', COALESCE(security_prefs, '{}'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_preference(
    p_user_id UUID,
    p_category TEXT,
    p_preference_key TEXT,
    p_new_value TEXT,
    p_change_source TEXT DEFAULT 'web'
)
RETURNS BOOLEAN AS $$
DECLARE
    old_value TEXT;
    table_name TEXT;
    column_name TEXT;
    sql_query TEXT;
BEGIN
    -- Determine table and column based on category and key
    CASE p_category
        WHEN 'general' THEN
            table_name := 'user_preferences';
        WHEN 'theme' THEN
            table_name := 'user_theme_preferences';
        WHEN 'notifications' THEN
            table_name := 'user_notification_preferences';
        WHEN 'trading' THEN
            table_name := 'user_trading_preferences';
        WHEN 'interface' THEN
            table_name := 'user_interface_preferences';
        WHEN 'security' THEN
            table_name := 'user_security_preferences';
        ELSE
            RAISE EXCEPTION 'Invalid preference category: %', p_category;
    END CASE;
    
    -- Get old value (simplified - in reality you'd need proper column mapping)
    -- For now, assume the preference_key maps directly to column name
    column_name := p_preference_key;
    
    -- Log the change to history
    INSERT INTO user_preference_history (
        user_id, preference_category, preference_key, 
        old_value, new_value, change_source
    )
    VALUES (
        p_user_id, p_category, p_preference_key,
        old_value, p_new_value, p_change_source
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reset_user_preferences(
    p_user_id UUID,
    p_category TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_category IS NULL OR p_category = 'general' THEN
        DELETE FROM user_preferences WHERE user_id = p_user_id;
    END IF;
    
    IF p_category IS NULL OR p_category = 'theme' THEN
        DELETE FROM user_theme_preferences WHERE user_id = p_user_id;
    END IF;
    
    IF p_category IS NULL OR p_category = 'notifications' THEN
        DELETE FROM user_notification_preferences WHERE user_id = p_user_id;
    END IF;
    
    IF p_category IS NULL OR p_category = 'trading' THEN
        DELETE FROM user_trading_preferences WHERE user_id = p_user_id;
    END IF;
    
    IF p_category IS NULL OR p_category = 'interface' THEN
        DELETE FROM user_interface_preferences WHERE user_id = p_user_id;
    END IF;
    
    -- Note: Security preferences are not reset for safety
    
    -- Log the reset
    INSERT INTO user_preference_history (
        user_id, preference_category, preference_key,
        old_value, new_value, change_source, changed_by
    )
    VALUES (
        p_user_id, COALESCE(p_category, 'all'), 'reset',
        'various', 'default', 'system', 'user'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql; 
-- Comprehensive user preferences and settings management system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Main User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Display Preferences
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system', 'auto')),
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'Pacific/Auckland',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    time_format TEXT DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
    number_format TEXT DEFAULT 'en-US',
    
    -- Currency and Regional
    base_currency TEXT DEFAULT 'NZD' CHECK (base_currency IN ('NZD', 'AUD', 'USD', 'EUR', 'GBP')),
    secondary_currency TEXT,
    currency_display_format TEXT DEFAULT 'symbol', -- 'symbol', 'code', 'name'
    
    -- Dashboard Layout
    dashboard_layout TEXT DEFAULT 'default',
    sidebar_collapsed BOOLEAN DEFAULT false,
    panel_arrangement JSONB DEFAULT '[]',
    default_page TEXT DEFAULT '/dashboard',
    
    -- Data Preferences
    auto_refresh_enabled BOOLEAN DEFAULT true,
    auto_refresh_interval INTEGER DEFAULT 30, -- seconds
    data_retention_days INTEGER DEFAULT 365,
    cache_enabled BOOLEAN DEFAULT true,
    
    -- Notification Preferences
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    slack_notifications BOOLEAN DEFAULT false,
    discord_notifications BOOLEAN DEFAULT false,
    
    -- Trading Preferences
    default_order_type TEXT DEFAULT 'market' CHECK (default_order_type IN ('market', 'limit', 'stop')),
    confirm_trades BOOLEAN DEFAULT true,
    show_advanced_trading BOOLEAN DEFAULT false,
    paper_trading_default BOOLEAN DEFAULT true,
    
    -- Chart Preferences
    default_chart_type TEXT DEFAULT 'candlestick',
    chart_theme TEXT DEFAULT 'light',
    show_volume BOOLEAN DEFAULT true,
    show_indicators BOOLEAN DEFAULT true,
    chart_timeframe TEXT DEFAULT '1D',
    
    -- Privacy Settings
    profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('public', 'private', 'friends')),
    show_performance BOOLEAN DEFAULT false,
    show_holdings BOOLEAN DEFAULT false,
    analytics_tracking BOOLEAN DEFAULT true,
    
    -- Accessibility
    high_contrast BOOLEAN DEFAULT false,
    large_text BOOLEAN DEFAULT false,
    reduce_motion BOOLEAN DEFAULT false,
    screen_reader_support BOOLEAN DEFAULT false,
    keyboard_navigation BOOLEAN DEFAULT false,
    
    -- Performance Settings
    lazy_loading BOOLEAN DEFAULT true,
    image_optimization BOOLEAN DEFAULT true,
    animation_enabled BOOLEAN DEFAULT true,
    transition_speed TEXT DEFAULT 'normal' CHECK (transition_speed IN ('slow', 'normal', 'fast')),
    
    -- Advanced Settings
    debug_mode BOOLEAN DEFAULT false,
    beta_features BOOLEAN DEFAULT false,
    developer_mode BOOLEAN DEFAULT false,
    api_rate_limit INTEGER DEFAULT 100,
    
    -- Backup and Sync
    auto_backup BOOLEAN DEFAULT true,
    backup_frequency TEXT DEFAULT 'daily' CHECK (backup_frequency IN ('hourly', 'daily', 'weekly')),
    cloud_sync BOOLEAN DEFAULT true,
    sync_across_devices BOOLEAN DEFAULT true,
    
    -- Custom Settings (for extensibility)
    custom_settings JSONB DEFAULT '{}',
    
    -- Metadata
    last_updated_section TEXT,
    preferences_version TEXT DEFAULT '1.0',
    migration_status TEXT DEFAULT 'current',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Theme Preferences Table (detailed theme settings)
CREATE TABLE IF NOT EXISTS user_theme_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core Theme Settings
    theme_mode TEXT DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system', 'auto')),
    color_scheme TEXT DEFAULT 'default',
    accent_color TEXT DEFAULT '#3B82F6',
    primary_color TEXT DEFAULT '#1E40AF',
    secondary_color TEXT DEFAULT '#64748B',
    
    -- Typography
    font_family TEXT DEFAULT 'Inter',
    font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'extra_large')),
    font_weight TEXT DEFAULT 'normal' CHECK (font_weight IN ('light', 'normal', 'medium', 'bold')),
    line_height DECIMAL(3,2) DEFAULT 1.5,
    letter_spacing DECIMAL(3,2) DEFAULT 0.0,
    
    -- Layout
    container_width TEXT DEFAULT 'full' CHECK (container_width IN ('narrow', 'normal', 'wide', 'full')),
    border_radius TEXT DEFAULT 'medium' CHECK (border_radius IN ('none', 'small', 'medium', 'large')),
    shadow_intensity TEXT DEFAULT 'medium' CHECK (shadow_intensity IN ('none', 'light', 'medium', 'strong')),
    
    -- Component Styling
    button_style TEXT DEFAULT 'default',
    input_style TEXT DEFAULT 'default',
    card_style TEXT DEFAULT 'default',
    
    -- Dark Mode Specific
    dark_mode_accent TEXT DEFAULT '#60A5FA',
    dark_mode_background TEXT DEFAULT '#0F172A',
    dark_mode_surface TEXT DEFAULT '#1E293B',
    dark_mode_text TEXT DEFAULT '#F1F5F9',
    
    -- Custom CSS
    custom_css TEXT,
    css_variables JSONB DEFAULT '{}',
    
    -- Responsive Settings
    mobile_optimized BOOLEAN DEFAULT true,
    tablet_layout TEXT DEFAULT 'adaptive',
    desktop_layout TEXT DEFAULT 'full',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Notification Preferences Table (detailed notification settings)
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Email Notifications
    email_enabled BOOLEAN DEFAULT true,
    email_address TEXT,
    email_frequency TEXT DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
    email_types JSONB DEFAULT '["trades", "alerts", "reports"]',
    
    -- Push Notifications
    push_enabled BOOLEAN DEFAULT true,
    push_device_tokens JSONB DEFAULT '[]',
    push_types JSONB DEFAULT '["price_alerts", "trade_confirmations"]',
    
    -- SMS Notifications
    sms_enabled BOOLEAN DEFAULT false,
    sms_number TEXT,
    sms_types JSONB DEFAULT '["urgent_alerts"]',
    
    -- In-App Notifications
    in_app_enabled BOOLEAN DEFAULT true,
    in_app_position TEXT DEFAULT 'top-right' CHECK (in_app_position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right')),
    in_app_duration INTEGER DEFAULT 5000, -- milliseconds
    
    -- Webhook Notifications
    webhook_enabled BOOLEAN DEFAULT false,
    webhook_url TEXT,
    webhook_secret TEXT,
    webhook_events JSONB DEFAULT '[]',
    
    -- Slack Integration
    slack_enabled BOOLEAN DEFAULT false,
    slack_webhook_url TEXT,
    slack_channel TEXT DEFAULT '#trading',
    slack_username TEXT DEFAULT 'StackMotive',
    
    -- Discord Integration
    discord_enabled BOOLEAN DEFAULT false,
    discord_webhook_url TEXT,
    discord_username TEXT DEFAULT 'StackMotive Bot',
    
    -- Telegram Integration
    telegram_enabled BOOLEAN DEFAULT false,
    telegram_bot_token TEXT,
    telegram_chat_id TEXT,
    
    -- Notification Categories
    trade_notifications BOOLEAN DEFAULT true,
    price_alerts BOOLEAN DEFAULT true,
    portfolio_alerts BOOLEAN DEFAULT true,
    market_news BOOLEAN DEFAULT false,
    system_notifications BOOLEAN DEFAULT true,
    security_alerts BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    
    -- Quiet Hours
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    quiet_hours_timezone TEXT DEFAULT 'Pacific/Auckland',
    
    -- Rate Limiting
    max_notifications_per_hour INTEGER DEFAULT 10,
    max_notifications_per_day INTEGER DEFAULT 100,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Trading Preferences Table (detailed trading settings)
CREATE TABLE IF NOT EXISTS user_trading_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Order Defaults
    default_order_type TEXT DEFAULT 'market',
    default_time_in_force TEXT DEFAULT 'GTC' CHECK (default_time_in_force IN ('GTC', 'IOC', 'FOK', 'DAY')),
    default_position_size DECIMAL(5,2) DEFAULT 1.0, -- percentage
    default_stop_loss DECIMAL(5,2) DEFAULT 5.0, -- percentage
    default_take_profit DECIMAL(5,2) DEFAULT 10.0, -- percentage
    
    -- Risk Management
    max_position_size DECIMAL(5,2) DEFAULT 25.0, -- percentage
    max_daily_loss DECIMAL(10,2) DEFAULT 1000.0,
    max_drawdown DECIMAL(5,2) DEFAULT 20.0, -- percentage
    risk_per_trade DECIMAL(5,2) DEFAULT 2.0, -- percentage
    
    -- Trading Modes
    paper_trading_enabled BOOLEAN DEFAULT true,
    live_trading_enabled BOOLEAN DEFAULT false,
    copy_trading_enabled BOOLEAN DEFAULT false,
    auto_trading_enabled BOOLEAN DEFAULT false,
    
    -- Confirmations
    confirm_market_orders BOOLEAN DEFAULT false,
    confirm_limit_orders BOOLEAN DEFAULT true,
    confirm_stop_orders BOOLEAN DEFAULT true,
    confirm_large_orders BOOLEAN DEFAULT true,
    large_order_threshold DECIMAL(10,2) DEFAULT 10000.0,
    
    -- Market Data
    real_time_data BOOLEAN DEFAULT true,
    level_2_data BOOLEAN DEFAULT false,
    news_feed_enabled BOOLEAN DEFAULT true,
    market_analysis BOOLEAN DEFAULT true,
    
    -- Advanced Features
    margin_trading BOOLEAN DEFAULT false,
    options_trading BOOLEAN DEFAULT false,
    futures_trading BOOLEAN DEFAULT false,
    crypto_trading BOOLEAN DEFAULT true,
    
    -- Automation
    trailing_stops BOOLEAN DEFAULT false,
    bracket_orders BOOLEAN DEFAULT false,
    oco_orders BOOLEAN DEFAULT false, -- One-Cancels-Other
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- User Interface Preferences Table
CREATE TABLE IF NOT EXISTS user_interface_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Layout Preferences
    layout_style TEXT DEFAULT 'modern',
    navigation_style TEXT DEFAULT 'sidebar',
    header_style TEXT DEFAULT 'fixed',
    footer_style TEXT DEFAULT 'minimal',
    
    -- Panel Configuration
    show_sidebar BOOLEAN DEFAULT true,
    sidebar_width INTEGER DEFAULT 250, -- pixels
    show_toolbar BOOLEAN DEFAULT true,
    show_status_bar BOOLEAN DEFAULT true,
    show_breadcrumbs BOOLEAN DEFAULT true,
    
    -- Dashboard Configuration
    dashboard_widgets JSONB DEFAULT '["portfolio", "watchlist", "news", "analysis"]',
    widget_arrangement JSONB DEFAULT '{}',
    default_dashboard_tab TEXT DEFAULT 'overview',
    
    -- Chart Configuration
    chart_layout TEXT DEFAULT 'single',
    chart_tools_visible BOOLEAN DEFAULT true,
    chart_studies JSONB DEFAULT '["volume", "ma20", "rsi"]',
    
    -- Table Configuration
    table_density TEXT DEFAULT 'normal' CHECK (table_density IN ('compact', 'normal', 'comfortable')),
    table_page_size INTEGER DEFAULT 25,
    table_auto_resize BOOLEAN DEFAULT true,
    
    -- Form Configuration
    form_validation_style TEXT DEFAULT 'inline',
    form_save_frequency INTEGER DEFAULT 30, -- seconds
    form_auto_complete BOOLEAN DEFAULT true,
    
    -- Shortcuts and Hotkeys
    keyboard_shortcuts JSONB DEFAULT '{}',
    mouse_shortcuts JSONB DEFAULT '{}',
    quick_actions JSONB DEFAULT '[]',
    
    -- Customization
    custom_css TEXT,
    custom_javascript TEXT,
    theme_overrides JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Security Preferences Table
CREATE TABLE IF NOT EXISTS user_security_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Authentication
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_method TEXT DEFAULT 'totp' CHECK (two_factor_method IN ('totp', 'sms', 'email', 'hardware')),
    backup_codes_generated BOOLEAN DEFAULT false,
    
    -- Session Management
    session_timeout INTEGER DEFAULT 3600, -- seconds
    remember_me_enabled BOOLEAN DEFAULT true,
    concurrent_sessions_allowed INTEGER DEFAULT 3,
    force_logout_on_ip_change BOOLEAN DEFAULT false,
    
    -- API Security
    api_access_enabled BOOLEAN DEFAULT false,
    api_rate_limit INTEGER DEFAULT 100,
    api_ip_whitelist JSONB DEFAULT '[]',
    webhook_verification BOOLEAN DEFAULT true,
    
    -- Privacy
    activity_logging BOOLEAN DEFAULT true,
    data_sharing_analytics BOOLEAN DEFAULT true,
    data_sharing_marketing BOOLEAN DEFAULT false,
    data_retention_period INTEGER DEFAULT 2555, -- days (7 years)
    
    -- Login Security
    login_ip_restrictions BOOLEAN DEFAULT false,
    allowed_ip_addresses JSONB DEFAULT '[]',
    suspicious_login_alerts BOOLEAN DEFAULT true,
    
    -- Data Export
    data_export_enabled BOOLEAN DEFAULT true,
    data_export_format TEXT DEFAULT 'json' CHECK (data_export_format IN ('json', 'csv', 'xml')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Preference Change History Table
CREATE TABLE IF NOT EXISTS user_preference_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Change Details
    preference_category TEXT NOT NULL, -- 'theme', 'notifications', 'trading', etc.
    preference_key TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    
    -- Change Context
    changed_by TEXT DEFAULT 'user', -- 'user', 'system', 'migration'
    change_source TEXT DEFAULT 'web', -- 'web', 'mobile', 'api'
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    change_reason TEXT,
    rollback_data JSONB, -- For potential rollbacks
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_theme_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trading_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interface_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference_history ENABLE ROW LEVEL SECURITY;

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own theme preferences" ON user_theme_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences" ON user_notification_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trading preferences" ON user_trading_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own interface preferences" ON user_interface_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own security preferences" ON user_security_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Preference history policies
CREATE POLICY "Users can view own preference history" ON user_preference_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert preference history" ON user_preference_history
    FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_theme ON user_preferences(theme);
CREATE INDEX idx_user_preferences_language ON user_preferences(language);
CREATE INDEX idx_user_preferences_base_currency ON user_preferences(base_currency);

CREATE INDEX idx_user_theme_preferences_user_id ON user_theme_preferences(user_id);
CREATE INDEX idx_user_theme_preferences_theme_mode ON user_theme_preferences(theme_mode);

CREATE INDEX idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX idx_user_notification_preferences_email_enabled ON user_notification_preferences(email_enabled);

CREATE INDEX idx_user_trading_preferences_user_id ON user_trading_preferences(user_id);
CREATE INDEX idx_user_trading_preferences_paper_trading ON user_trading_preferences(paper_trading_enabled);

CREATE INDEX idx_user_interface_preferences_user_id ON user_interface_preferences(user_id);
CREATE INDEX idx_user_interface_preferences_layout_style ON user_interface_preferences(layout_style);

CREATE INDEX idx_user_security_preferences_user_id ON user_security_preferences(user_id);
CREATE INDEX idx_user_security_preferences_two_factor ON user_security_preferences(two_factor_enabled);

CREATE INDEX idx_user_preference_history_user_id ON user_preference_history(user_id);
CREATE INDEX idx_user_preference_history_category ON user_preference_history(preference_category);
CREATE INDEX idx_user_preference_history_created_at ON user_preference_history(created_at DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_theme_preferences_updated_at
    BEFORE UPDATE ON user_theme_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_trading_preferences_updated_at
    BEFORE UPDATE ON user_trading_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_interface_preferences_updated_at
    BEFORE UPDATE ON user_interface_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_security_preferences_updated_at
    BEFORE UPDATE ON user_security_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for preference management
CREATE OR REPLACE FUNCTION get_user_preferences(
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    preferences JSONB;
    theme_prefs JSONB;
    notification_prefs JSONB;
    trading_prefs JSONB;
    interface_prefs JSONB;
    security_prefs JSONB;
BEGIN
    -- Get main preferences
    SELECT to_jsonb(up.*) INTO preferences
    FROM user_preferences up
    WHERE up.user_id = p_user_id;
    
    -- Get theme preferences
    SELECT to_jsonb(utp.*) INTO theme_prefs
    FROM user_theme_preferences utp
    WHERE utp.user_id = p_user_id;
    
    -- Get notification preferences
    SELECT to_jsonb(unp.*) INTO notification_prefs
    FROM user_notification_preferences unp
    WHERE unp.user_id = p_user_id;
    
    -- Get trading preferences
    SELECT to_jsonb(utrp.*) INTO trading_prefs
    FROM user_trading_preferences utrp
    WHERE utrp.user_id = p_user_id;
    
    -- Get interface preferences
    SELECT to_jsonb(uip.*) INTO interface_prefs
    FROM user_interface_preferences uip
    WHERE uip.user_id = p_user_id;
    
    -- Get security preferences (limited fields)
    SELECT jsonb_build_object(
        'two_factor_enabled', usp.two_factor_enabled,
        'session_timeout', usp.session_timeout,
        'api_access_enabled', usp.api_access_enabled
    ) INTO security_prefs
    FROM user_security_preferences usp
    WHERE usp.user_id = p_user_id;
    
    -- Combine all preferences
    RETURN jsonb_build_object(
        'general', COALESCE(preferences, '{}'::jsonb),
        'theme', COALESCE(theme_prefs, '{}'::jsonb),
        'notifications', COALESCE(notification_prefs, '{}'::jsonb),
        'trading', COALESCE(trading_prefs, '{}'::jsonb),
        'interface', COALESCE(interface_prefs, '{}'::jsonb),
        'security', COALESCE(security_prefs, '{}'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_preference(
    p_user_id UUID,
    p_category TEXT,
    p_preference_key TEXT,
    p_new_value TEXT,
    p_change_source TEXT DEFAULT 'web'
)
RETURNS BOOLEAN AS $$
DECLARE
    old_value TEXT;
    table_name TEXT;
    column_name TEXT;
    sql_query TEXT;
BEGIN
    -- Determine table and column based on category and key
    CASE p_category
        WHEN 'general' THEN
            table_name := 'user_preferences';
        WHEN 'theme' THEN
            table_name := 'user_theme_preferences';
        WHEN 'notifications' THEN
            table_name := 'user_notification_preferences';
        WHEN 'trading' THEN
            table_name := 'user_trading_preferences';
        WHEN 'interface' THEN
            table_name := 'user_interface_preferences';
        WHEN 'security' THEN
            table_name := 'user_security_preferences';
        ELSE
            RAISE EXCEPTION 'Invalid preference category: %', p_category;
    END CASE;
    
    -- Get old value (simplified - in reality you'd need proper column mapping)
    -- For now, assume the preference_key maps directly to column name
    column_name := p_preference_key;
    
    -- Log the change to history
    INSERT INTO user_preference_history (
        user_id, preference_category, preference_key, 
        old_value, new_value, change_source
    )
    VALUES (
        p_user_id, p_category, p_preference_key,
        old_value, p_new_value, p_change_source
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reset_user_preferences(
    p_user_id UUID,
    p_category TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_category IS NULL OR p_category = 'general' THEN
        DELETE FROM user_preferences WHERE user_id = p_user_id;
    END IF;
    
    IF p_category IS NULL OR p_category = 'theme' THEN
        DELETE FROM user_theme_preferences WHERE user_id = p_user_id;
    END IF;
    
    IF p_category IS NULL OR p_category = 'notifications' THEN
        DELETE FROM user_notification_preferences WHERE user_id = p_user_id;
    END IF;
    
    IF p_category IS NULL OR p_category = 'trading' THEN
        DELETE FROM user_trading_preferences WHERE user_id = p_user_id;
    END IF;
    
    IF p_category IS NULL OR p_category = 'interface' THEN
        DELETE FROM user_interface_preferences WHERE user_id = p_user_id;
    END IF;
    
    -- Note: Security preferences are not reset for safety
    
    -- Log the reset
    INSERT INTO user_preference_history (
        user_id, preference_category, preference_key,
        old_value, new_value, change_source, changed_by
    )
    VALUES (
        p_user_id, COALESCE(p_category, 'all'), 'reset',
        'various', 'default', 'system', 'user'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql; 