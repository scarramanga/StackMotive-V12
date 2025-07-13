-- Block 56: Dashboard Personalisation Engine - Database Schema
-- User dashboard layout and widget configuration system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Dashboard Layouts Table
CREATE TABLE IF NOT EXISTS dashboard_layouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Layout Details
    layout_name TEXT NOT NULL DEFAULT 'Default',
    layout_type TEXT DEFAULT 'grid' CHECK (layout_type IN ('grid', 'flexible', 'masonry', 'fixed')),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Grid Configuration
    grid_columns INTEGER DEFAULT 12,
    grid_rows INTEGER DEFAULT 8,
    grid_gap INTEGER DEFAULT 16,
    
    -- Responsive Settings
    mobile_columns INTEGER DEFAULT 1,
    tablet_columns INTEGER DEFAULT 6,
    desktop_columns INTEGER DEFAULT 12,
    
    -- Theme and Styling
    theme_variant TEXT DEFAULT 'auto' CHECK (theme_variant IN ('light', 'dark', 'auto')),
    color_scheme TEXT DEFAULT 'default',
    widget_border_radius INTEGER DEFAULT 8,
    widget_shadow BOOLEAN DEFAULT true,
    
    -- Layout Metadata
    layout_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, layout_name)
);

-- Dashboard Widgets Table
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    layout_id UUID NOT NULL REFERENCES dashboard_layouts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Widget Identification
    widget_id TEXT NOT NULL, -- Unique identifier for widget type
    widget_name TEXT NOT NULL,
    widget_type TEXT NOT NULL CHECK (widget_type IN ('chart', 'metric', 'table', 'list', 'calendar', 'news', 'alerts', 'custom')),
    widget_category TEXT DEFAULT 'general',
    
    -- Position and Size
    grid_x INTEGER NOT NULL DEFAULT 0,
    grid_y INTEGER NOT NULL DEFAULT 0,
    grid_width INTEGER NOT NULL DEFAULT 4,
    grid_height INTEGER NOT NULL DEFAULT 3,
    
    -- Widget Configuration
    widget_config JSONB DEFAULT '{}',
    data_source TEXT,
    refresh_interval INTEGER DEFAULT 300, -- seconds
    auto_refresh BOOLEAN DEFAULT true,
    
    -- Display Settings
    show_title BOOLEAN DEFAULT true,
    show_border BOOLEAN DEFAULT true,
    title_override TEXT,
    custom_styles JSONB DEFAULT '{}',
    
    -- Responsive Behavior
    mobile_hidden BOOLEAN DEFAULT false,
    tablet_width INTEGER,
    tablet_height INTEGER,
    mobile_width INTEGER,
    mobile_height INTEGER,
    
    -- Status
    is_visible BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(layout_id, widget_id)
);

-- Widget Templates Table
CREATE TABLE IF NOT EXISTS widget_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template Details
    template_name TEXT NOT NULL,
    template_description TEXT,
    widget_type TEXT NOT NULL,
    category TEXT DEFAULT 'user',
    
    -- Template Configuration
    default_config JSONB DEFAULT '{}',
    default_size JSONB DEFAULT '{"width": 4, "height": 3}',
    
    -- Sharing and Usage
    is_public BOOLEAN DEFAULT false,
    is_system_template BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, template_name)
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS dashboard_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Display Preferences
    default_layout_id UUID REFERENCES dashboard_layouts(id),
    theme_preference TEXT DEFAULT 'auto' CHECK (theme_preference IN ('light', 'dark', 'auto')),
    compact_mode BOOLEAN DEFAULT false,
    animation_enabled BOOLEAN DEFAULT true,
    
    -- Data Preferences
    default_currency TEXT DEFAULT 'NZD',
    default_time_zone TEXT DEFAULT 'Pacific/Auckland',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    number_format TEXT DEFAULT 'en-NZ',
    
    -- Refresh Settings
    global_refresh_interval INTEGER DEFAULT 300,
    auto_refresh_enabled BOOLEAN DEFAULT true,
    refresh_when_hidden BOOLEAN DEFAULT false,
    
    -- Notification Settings
    show_widget_errors BOOLEAN DEFAULT true,
    show_data_staleness BOOLEAN DEFAULT true,
    error_notification_delay INTEGER DEFAULT 30,
    
    -- Performance Settings
    max_widgets_per_layout INTEGER DEFAULT 20,
    enable_widget_lazy_loading BOOLEAN DEFAULT true,
    cache_widget_data BOOLEAN DEFAULT true,
    
    -- Accessibility
    high_contrast BOOLEAN DEFAULT false,
    large_fonts BOOLEAN DEFAULT false,
    reduce_motion BOOLEAN DEFAULT false,
    keyboard_navigation BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Layout History Table
CREATE TABLE IF NOT EXISTS dashboard_layout_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    layout_id UUID NOT NULL REFERENCES dashboard_layouts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Change Details
    change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'widget_added', 'widget_removed', 'widget_moved', 'widget_resized', 'config_changed')),
    change_description TEXT,
    
    -- Layout Snapshot
    layout_snapshot JSONB NOT NULL,
    widgets_snapshot JSONB DEFAULT '{}',
    
    -- Change Context
    change_source TEXT DEFAULT 'manual' CHECK (change_source IN ('manual', 'auto_save', 'import', 'reset', 'sync')),
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_layout_history ENABLE ROW LEVEL SECURITY;

-- Dashboard layouts policies
CREATE POLICY "Users can manage own dashboard layouts" ON dashboard_layouts
    FOR ALL USING (auth.uid() = user_id);

-- Dashboard widgets policies
CREATE POLICY "Users can manage own dashboard widgets" ON dashboard_widgets
    FOR ALL USING (auth.uid() = user_id);

-- Widget templates policies
CREATE POLICY "Users can view public and own templates" ON widget_templates
    FOR SELECT USING (auth.uid() = user_id OR is_public = true OR is_system_template = true);

CREATE POLICY "Users can manage own templates" ON widget_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON widget_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON widget_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Dashboard preferences policies
CREATE POLICY "Users can manage own preferences" ON dashboard_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Layout history policies
CREATE POLICY "Users can view own layout history" ON dashboard_layout_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own layout history" ON dashboard_layout_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);
CREATE INDEX idx_dashboard_layouts_default ON dashboard_layouts(user_id, is_default);
CREATE INDEX idx_dashboard_layouts_active ON dashboard_layouts(user_id, is_active);

CREATE INDEX idx_dashboard_widgets_layout_id ON dashboard_widgets(layout_id);
CREATE INDEX idx_dashboard_widgets_user_id ON dashboard_widgets(user_id);
CREATE INDEX idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX idx_dashboard_widgets_visible ON dashboard_widgets(layout_id, is_visible);

CREATE INDEX idx_widget_templates_user_id ON widget_templates(user_id);
CREATE INDEX idx_widget_templates_type ON widget_templates(widget_type);
CREATE INDEX idx_widget_templates_public ON widget_templates(is_public);
CREATE INDEX idx_widget_templates_system ON widget_templates(is_system_template);

CREATE INDEX idx_dashboard_preferences_user_id ON dashboard_preferences(user_id);

CREATE INDEX idx_layout_history_layout_id ON dashboard_layout_history(layout_id);
CREATE INDEX idx_layout_history_user_id ON dashboard_layout_history(user_id);
CREATE INDEX idx_layout_history_created_at ON dashboard_layout_history(created_at DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_dashboard_layouts_updated_at
    BEFORE UPDATE ON dashboard_layouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at
    BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widget_templates_updated_at
    BEFORE UPDATE ON widget_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_preferences_updated_at
    BEFORE UPDATE ON dashboard_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions
CREATE OR REPLACE FUNCTION create_default_dashboard_layout(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    layout_id UUID;
BEGIN
    -- Create default layout
    INSERT INTO dashboard_layouts (user_id, layout_name, is_default)
    VALUES (p_user_id, 'Default Dashboard', true)
    RETURNING id INTO layout_id;
    
    -- Add default widgets
    INSERT INTO dashboard_widgets (layout_id, user_id, widget_id, widget_name, widget_type, grid_x, grid_y, grid_width, grid_height)
    VALUES 
        (layout_id, p_user_id, 'portfolio_summary', 'Portfolio Summary', 'metric', 0, 0, 6, 2),
        (layout_id, p_user_id, 'portfolio_chart', 'Portfolio Performance', 'chart', 6, 0, 6, 4),
        (layout_id, p_user_id, 'top_holdings', 'Top Holdings', 'table', 0, 2, 6, 3),
        (layout_id, p_user_id, 'recent_trades', 'Recent Trades', 'list', 0, 5, 12, 3),
        (layout_id, p_user_id, 'market_news', 'Market News', 'news', 6, 4, 6, 4);
    
    RETURN layout_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_default_dashboard_preferences(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    preference_id UUID;
    default_layout_id UUID;
BEGIN
    -- Get or create default layout
    SELECT id INTO default_layout_id
    FROM dashboard_layouts
    WHERE user_id = p_user_id AND is_default = true
    LIMIT 1;
    
    IF default_layout_id IS NULL THEN
        default_layout_id := create_default_dashboard_layout(p_user_id);
    END IF;
    
    -- Create preferences
    INSERT INTO dashboard_preferences (user_id, default_layout_id)
    VALUES (p_user_id, default_layout_id)
    RETURNING id INTO preference_id;
    
    RETURN preference_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_layout_change(
    p_layout_id UUID,
    p_user_id UUID,
    p_change_type TEXT,
    p_change_description TEXT,
    p_layout_data JSONB,
    p_widgets_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
BEGIN
    INSERT INTO dashboard_layout_history (
        layout_id, user_id, change_type, change_description,
        layout_snapshot, widgets_snapshot
    )
    VALUES (
        p_layout_id, p_user_id, p_change_type, p_change_description,
        p_layout_data, p_widgets_data
    )
    RETURNING id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql;

-- Create system widget templates
INSERT INTO widget_templates (template_name, template_description, widget_type, category, default_config, is_system_template, is_public)
VALUES 
    ('Portfolio Performance Chart', 'Line chart showing portfolio value over time', 'chart', 'portfolio', 
     '{"chartType": "line", "timeRange": "1y", "showBenchmark": true}', true, true),
    ('Asset Allocation Pie', 'Pie chart showing current asset allocation', 'chart', 'allocation',
     '{"chartType": "pie", "showPercentages": true, "showLegend": true}', true, true),
    ('Holdings Table', 'Table displaying current holdings with key metrics', 'table', 'holdings',
     '{"columns": ["symbol", "quantity", "value", "return"], "sortBy": "value"}', true, true),
    ('Performance Metrics', 'Key performance indicators for portfolio', 'metric', 'performance',
     '{"metrics": ["totalValue", "dayChange", "totalReturn"], "showComparison": true}', true, true),
    ('Market News Feed', 'Latest market news and updates', 'news', 'market',
     '{"sources": ["general"], "limit": 10, "showImages": true}', true, true)
ON CONFLICT DO NOTHING; 
-- User dashboard layout and widget configuration system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Dashboard Layouts Table
CREATE TABLE IF NOT EXISTS dashboard_layouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Layout Details
    layout_name TEXT NOT NULL DEFAULT 'Default',
    layout_type TEXT DEFAULT 'grid' CHECK (layout_type IN ('grid', 'flexible', 'masonry', 'fixed')),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Grid Configuration
    grid_columns INTEGER DEFAULT 12,
    grid_rows INTEGER DEFAULT 8,
    grid_gap INTEGER DEFAULT 16,
    
    -- Responsive Settings
    mobile_columns INTEGER DEFAULT 1,
    tablet_columns INTEGER DEFAULT 6,
    desktop_columns INTEGER DEFAULT 12,
    
    -- Theme and Styling
    theme_variant TEXT DEFAULT 'auto' CHECK (theme_variant IN ('light', 'dark', 'auto')),
    color_scheme TEXT DEFAULT 'default',
    widget_border_radius INTEGER DEFAULT 8,
    widget_shadow BOOLEAN DEFAULT true,
    
    -- Layout Metadata
    layout_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, layout_name)
);

-- Dashboard Widgets Table
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    layout_id UUID NOT NULL REFERENCES dashboard_layouts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Widget Identification
    widget_id TEXT NOT NULL, -- Unique identifier for widget type
    widget_name TEXT NOT NULL,
    widget_type TEXT NOT NULL CHECK (widget_type IN ('chart', 'metric', 'table', 'list', 'calendar', 'news', 'alerts', 'custom')),
    widget_category TEXT DEFAULT 'general',
    
    -- Position and Size
    grid_x INTEGER NOT NULL DEFAULT 0,
    grid_y INTEGER NOT NULL DEFAULT 0,
    grid_width INTEGER NOT NULL DEFAULT 4,
    grid_height INTEGER NOT NULL DEFAULT 3,
    
    -- Widget Configuration
    widget_config JSONB DEFAULT '{}',
    data_source TEXT,
    refresh_interval INTEGER DEFAULT 300, -- seconds
    auto_refresh BOOLEAN DEFAULT true,
    
    -- Display Settings
    show_title BOOLEAN DEFAULT true,
    show_border BOOLEAN DEFAULT true,
    title_override TEXT,
    custom_styles JSONB DEFAULT '{}',
    
    -- Responsive Behavior
    mobile_hidden BOOLEAN DEFAULT false,
    tablet_width INTEGER,
    tablet_height INTEGER,
    mobile_width INTEGER,
    mobile_height INTEGER,
    
    -- Status
    is_visible BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(layout_id, widget_id)
);

-- Widget Templates Table
CREATE TABLE IF NOT EXISTS widget_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template Details
    template_name TEXT NOT NULL,
    template_description TEXT,
    widget_type TEXT NOT NULL,
    category TEXT DEFAULT 'user',
    
    -- Template Configuration
    default_config JSONB DEFAULT '{}',
    default_size JSONB DEFAULT '{"width": 4, "height": 3}',
    
    -- Sharing and Usage
    is_public BOOLEAN DEFAULT false,
    is_system_template BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, template_name)
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS dashboard_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Display Preferences
    default_layout_id UUID REFERENCES dashboard_layouts(id),
    theme_preference TEXT DEFAULT 'auto' CHECK (theme_preference IN ('light', 'dark', 'auto')),
    compact_mode BOOLEAN DEFAULT false,
    animation_enabled BOOLEAN DEFAULT true,
    
    -- Data Preferences
    default_currency TEXT DEFAULT 'NZD',
    default_time_zone TEXT DEFAULT 'Pacific/Auckland',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    number_format TEXT DEFAULT 'en-NZ',
    
    -- Refresh Settings
    global_refresh_interval INTEGER DEFAULT 300,
    auto_refresh_enabled BOOLEAN DEFAULT true,
    refresh_when_hidden BOOLEAN DEFAULT false,
    
    -- Notification Settings
    show_widget_errors BOOLEAN DEFAULT true,
    show_data_staleness BOOLEAN DEFAULT true,
    error_notification_delay INTEGER DEFAULT 30,
    
    -- Performance Settings
    max_widgets_per_layout INTEGER DEFAULT 20,
    enable_widget_lazy_loading BOOLEAN DEFAULT true,
    cache_widget_data BOOLEAN DEFAULT true,
    
    -- Accessibility
    high_contrast BOOLEAN DEFAULT false,
    large_fonts BOOLEAN DEFAULT false,
    reduce_motion BOOLEAN DEFAULT false,
    keyboard_navigation BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Layout History Table
CREATE TABLE IF NOT EXISTS dashboard_layout_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    layout_id UUID NOT NULL REFERENCES dashboard_layouts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Change Details
    change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'widget_added', 'widget_removed', 'widget_moved', 'widget_resized', 'config_changed')),
    change_description TEXT,
    
    -- Layout Snapshot
    layout_snapshot JSONB NOT NULL,
    widgets_snapshot JSONB DEFAULT '{}',
    
    -- Change Context
    change_source TEXT DEFAULT 'manual' CHECK (change_source IN ('manual', 'auto_save', 'import', 'reset', 'sync')),
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_layout_history ENABLE ROW LEVEL SECURITY;

-- Dashboard layouts policies
CREATE POLICY "Users can manage own dashboard layouts" ON dashboard_layouts
    FOR ALL USING (auth.uid() = user_id);

-- Dashboard widgets policies
CREATE POLICY "Users can manage own dashboard widgets" ON dashboard_widgets
    FOR ALL USING (auth.uid() = user_id);

-- Widget templates policies
CREATE POLICY "Users can view public and own templates" ON widget_templates
    FOR SELECT USING (auth.uid() = user_id OR is_public = true OR is_system_template = true);

CREATE POLICY "Users can manage own templates" ON widget_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON widget_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON widget_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Dashboard preferences policies
CREATE POLICY "Users can manage own preferences" ON dashboard_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Layout history policies
CREATE POLICY "Users can view own layout history" ON dashboard_layout_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own layout history" ON dashboard_layout_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);
CREATE INDEX idx_dashboard_layouts_default ON dashboard_layouts(user_id, is_default);
CREATE INDEX idx_dashboard_layouts_active ON dashboard_layouts(user_id, is_active);

CREATE INDEX idx_dashboard_widgets_layout_id ON dashboard_widgets(layout_id);
CREATE INDEX idx_dashboard_widgets_user_id ON dashboard_widgets(user_id);
CREATE INDEX idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX idx_dashboard_widgets_visible ON dashboard_widgets(layout_id, is_visible);

CREATE INDEX idx_widget_templates_user_id ON widget_templates(user_id);
CREATE INDEX idx_widget_templates_type ON widget_templates(widget_type);
CREATE INDEX idx_widget_templates_public ON widget_templates(is_public);
CREATE INDEX idx_widget_templates_system ON widget_templates(is_system_template);

CREATE INDEX idx_dashboard_preferences_user_id ON dashboard_preferences(user_id);

CREATE INDEX idx_layout_history_layout_id ON dashboard_layout_history(layout_id);
CREATE INDEX idx_layout_history_user_id ON dashboard_layout_history(user_id);
CREATE INDEX idx_layout_history_created_at ON dashboard_layout_history(created_at DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_dashboard_layouts_updated_at
    BEFORE UPDATE ON dashboard_layouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at
    BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_widget_templates_updated_at
    BEFORE UPDATE ON widget_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_preferences_updated_at
    BEFORE UPDATE ON dashboard_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions
CREATE OR REPLACE FUNCTION create_default_dashboard_layout(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    layout_id UUID;
BEGIN
    -- Create default layout
    INSERT INTO dashboard_layouts (user_id, layout_name, is_default)
    VALUES (p_user_id, 'Default Dashboard', true)
    RETURNING id INTO layout_id;
    
    -- Add default widgets
    INSERT INTO dashboard_widgets (layout_id, user_id, widget_id, widget_name, widget_type, grid_x, grid_y, grid_width, grid_height)
    VALUES 
        (layout_id, p_user_id, 'portfolio_summary', 'Portfolio Summary', 'metric', 0, 0, 6, 2),
        (layout_id, p_user_id, 'portfolio_chart', 'Portfolio Performance', 'chart', 6, 0, 6, 4),
        (layout_id, p_user_id, 'top_holdings', 'Top Holdings', 'table', 0, 2, 6, 3),
        (layout_id, p_user_id, 'recent_trades', 'Recent Trades', 'list', 0, 5, 12, 3),
        (layout_id, p_user_id, 'market_news', 'Market News', 'news', 6, 4, 6, 4);
    
    RETURN layout_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_default_dashboard_preferences(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    preference_id UUID;
    default_layout_id UUID;
BEGIN
    -- Get or create default layout
    SELECT id INTO default_layout_id
    FROM dashboard_layouts
    WHERE user_id = p_user_id AND is_default = true
    LIMIT 1;
    
    IF default_layout_id IS NULL THEN
        default_layout_id := create_default_dashboard_layout(p_user_id);
    END IF;
    
    -- Create preferences
    INSERT INTO dashboard_preferences (user_id, default_layout_id)
    VALUES (p_user_id, default_layout_id)
    RETURNING id INTO preference_id;
    
    RETURN preference_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_layout_change(
    p_layout_id UUID,
    p_user_id UUID,
    p_change_type TEXT,
    p_change_description TEXT,
    p_layout_data JSONB,
    p_widgets_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
BEGIN
    INSERT INTO dashboard_layout_history (
        layout_id, user_id, change_type, change_description,
        layout_snapshot, widgets_snapshot
    )
    VALUES (
        p_layout_id, p_user_id, p_change_type, p_change_description,
        p_layout_data, p_widgets_data
    )
    RETURNING id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql;

-- Create system widget templates
INSERT INTO widget_templates (template_name, template_description, widget_type, category, default_config, is_system_template, is_public)
VALUES 
    ('Portfolio Performance Chart', 'Line chart showing portfolio value over time', 'chart', 'portfolio', 
     '{"chartType": "line", "timeRange": "1y", "showBenchmark": true}', true, true),
    ('Asset Allocation Pie', 'Pie chart showing current asset allocation', 'chart', 'allocation',
     '{"chartType": "pie", "showPercentages": true, "showLegend": true}', true, true),
    ('Holdings Table', 'Table displaying current holdings with key metrics', 'table', 'holdings',
     '{"columns": ["symbol", "quantity", "value", "return"], "sortBy": "value"}', true, true),
    ('Performance Metrics', 'Key performance indicators for portfolio', 'metric', 'performance',
     '{"metrics": ["totalValue", "dayChange", "totalReturn"], "showComparison": true}', true, true),
    ('Market News Feed', 'Latest market news and updates', 'news', 'market',
     '{"sources": ["general"], "limit": 10, "showImages": true}', true, true)
ON CONFLICT DO NOTHING; 