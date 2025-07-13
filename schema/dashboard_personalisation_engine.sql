-- Block 56: Dashboard Personalisation Engine Schema

-- Dashboard layouts
CREATE TABLE dashboard_layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Layout metadata
    layout_type VARCHAR(50) NOT NULL CHECK (layout_type IN ('default', 'custom', 'template', 'shared')),
    category VARCHAR(50) DEFAULT 'general',
    
    -- Layout configuration
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    
    -- Grid configuration
    grid_columns INTEGER DEFAULT 12,
    grid_rows INTEGER DEFAULT 20,
    grid_gap INTEGER DEFAULT 8,
    
    -- Responsive settings
    responsive_breakpoints JSONB DEFAULT '{}',
    
    -- Layout structure
    layout_config JSONB NOT NULL DEFAULT '{}',
    widgets JSONB DEFAULT '[]',
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Widget definitions
CREATE TABLE widget_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Widget identification
    widget_type VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Widget classification
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    
    -- Widget properties
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    
    -- Configuration schema
    config_schema JSONB NOT NULL DEFAULT '{}',
    default_config JSONB DEFAULT '{}',
    
    -- Layout constraints
    min_width INTEGER DEFAULT 1,
    min_height INTEGER DEFAULT 1,
    max_width INTEGER DEFAULT 12,
    max_height INTEGER DEFAULT 20,
    
    -- Permissions
    required_permissions JSONB DEFAULT '[]',
    
    -- Widget icon and display
    icon VARCHAR(100),
    preview_image VARCHAR(500),
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(widget_type, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'))
);

-- User widget instances
CREATE TABLE user_widget_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    layout_id UUID NOT NULL REFERENCES dashboard_layouts(id) ON DELETE CASCADE,
    widget_definition_id UUID NOT NULL REFERENCES widget_definitions(id) ON DELETE CASCADE,
    
    -- Instance identification
    instance_name VARCHAR(100),
    
    -- Position and size
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    width INTEGER NOT NULL DEFAULT 1,
    height INTEGER NOT NULL DEFAULT 1,
    
    -- Z-index for layering
    z_index INTEGER DEFAULT 0,
    
    -- Instance configuration
    config JSONB DEFAULT '{}',
    
    -- State management
    state JSONB DEFAULT '{}',
    
    -- Display settings
    is_visible BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    
    -- Responsive settings
    responsive_config JSONB DEFAULT '{}',
    
    -- Performance settings
    refresh_interval INTEGER DEFAULT 300, -- seconds
    auto_refresh BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'loading')),
    error_message TEXT,
    
    -- Usage tracking
    last_interacted_at TIMESTAMP WITH TIME ZONE,
    interaction_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_dashboard_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Global dashboard settings
    theme VARCHAR(50) DEFAULT 'default',
    color_scheme VARCHAR(50) DEFAULT 'light',
    density VARCHAR(20) DEFAULT 'comfortable' CHECK (density IN ('compact', 'comfortable', 'spacious')),
    
    -- Animation settings
    animations_enabled BOOLEAN DEFAULT true,
    transition_speed VARCHAR(20) DEFAULT 'normal' CHECK (transition_speed IN ('slow', 'normal', 'fast')),
    
    -- Auto-save settings
    auto_save_enabled BOOLEAN DEFAULT true,
    auto_save_interval INTEGER DEFAULT 30, -- seconds
    
    -- Notification settings
    show_notifications BOOLEAN DEFAULT true,
    notification_position VARCHAR(20) DEFAULT 'top-right',
    
    -- Data refresh settings
    global_refresh_interval INTEGER DEFAULT 300, -- seconds
    pause_refresh_on_tab_switch BOOLEAN DEFAULT true,
    
    -- Accessibility settings
    high_contrast BOOLEAN DEFAULT false,
    large_text BOOLEAN DEFAULT false,
    reduce_motion BOOLEAN DEFAULT false,
    
    -- Performance settings
    enable_caching BOOLEAN DEFAULT true,
    lazy_loading BOOLEAN DEFAULT true,
    
    -- Custom CSS
    custom_css TEXT,
    
    -- Additional preferences
    preferences JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Dashboard themes
CREATE TABLE dashboard_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Theme type
    theme_type VARCHAR(50) DEFAULT 'custom' CHECK (theme_type IN ('system', 'custom', 'shared')),
    
    -- Theme configuration
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    
    -- Color palette
    colors JSONB NOT NULL DEFAULT '{}',
    
    -- Typography
    fonts JSONB DEFAULT '{}',
    
    -- Spacing and layout
    spacing JSONB DEFAULT '{}',
    
    -- Component styles
    component_styles JSONB DEFAULT '{}',
    
    -- Custom CSS
    custom_css TEXT,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    
    -- Preview
    preview_image VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'))
);

-- Layout templates
CREATE TABLE layout_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Template metadata
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('beginner', 'intermediate', 'advanced', 'industry', 'custom')),
    category VARCHAR(50) NOT NULL,
    
    -- Template properties
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    
    -- Template configuration
    layout_config JSONB NOT NULL,
    default_widgets JSONB DEFAULT '[]',
    
    -- Requirements
    required_permissions JSONB DEFAULT '[]',
    minimum_screen_size JSONB DEFAULT '{}',
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    
    -- Preview
    preview_image VARCHAR(500),
    screenshots JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'))
);

-- User layout history
CREATE TABLE user_layout_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    layout_id UUID NOT NULL REFERENCES dashboard_layouts(id) ON DELETE CASCADE,
    
    -- Change details
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted', 'restored', 'shared')),
    change_description TEXT,
    
    -- Layout snapshot
    layout_snapshot JSONB,
    
    -- Change metadata
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    change_reason TEXT,
    
    -- Rollback capability
    can_rollback BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Widget data cache
CREATE TABLE widget_data_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    widget_instance_id UUID NOT NULL REFERENCES user_widget_instances(id) ON DELETE CASCADE,
    
    -- Cache key
    cache_key VARCHAR(255) NOT NULL,
    
    -- Cached data
    cached_data JSONB,
    
    -- Cache metadata
    cache_size INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Cache statistics
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, widget_instance_id, cache_key)
);

-- Dashboard analytics
CREATE TABLE dashboard_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session information
    session_id VARCHAR(255) NOT NULL,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view', 'click', 'drag', 'resize', 'configure', 'export')),
    event_target VARCHAR(100),
    
    -- Context
    layout_id UUID REFERENCES dashboard_layouts(id) ON DELETE SET NULL,
    widget_instance_id UUID REFERENCES user_widget_instances(id) ON DELETE SET NULL,
    
    -- Event data
    event_data JSONB DEFAULT '{}',
    
    -- Performance metrics
    load_time INTEGER, -- milliseconds
    response_time INTEGER, -- milliseconds
    
    -- User context
    user_agent TEXT,
    screen_resolution VARCHAR(20),
    viewport_size VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);
CREATE INDEX idx_dashboard_layouts_is_active ON dashboard_layouts(is_active);
CREATE INDEX idx_widget_definitions_widget_type ON widget_definitions(widget_type);
CREATE INDEX idx_widget_definitions_category ON widget_definitions(category);
CREATE INDEX idx_user_widget_instances_user_id ON user_widget_instances(user_id);
CREATE INDEX idx_user_widget_instances_layout_id ON user_widget_instances(layout_id);
CREATE INDEX idx_user_dashboard_preferences_user_id ON user_dashboard_preferences(user_id);
CREATE INDEX idx_dashboard_themes_user_id ON dashboard_themes(user_id);
CREATE INDEX idx_layout_templates_category ON layout_templates(category);
CREATE INDEX idx_user_layout_history_user_id ON user_layout_history(user_id);
CREATE INDEX idx_user_layout_history_layout_id ON user_layout_history(layout_id);
CREATE INDEX idx_widget_data_cache_user_id ON widget_data_cache(user_id);
CREATE INDEX idx_widget_data_cache_widget_instance_id ON widget_data_cache(widget_instance_id);
CREATE INDEX idx_widget_data_cache_expires_at ON widget_data_cache(expires_at);
CREATE INDEX idx_dashboard_analytics_user_id ON dashboard_analytics(user_id);
CREATE INDEX idx_dashboard_analytics_session_id ON dashboard_analytics(session_id);
CREATE INDEX idx_dashboard_analytics_created_at ON dashboard_analytics(created_at);

-- RLS Policies
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_widget_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_layout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_analytics ENABLE ROW LEVEL SECURITY;

-- Users can manage their own layouts and preferences
CREATE POLICY "Users can manage own layouts" ON dashboard_layouts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own widget instances" ON user_widget_instances
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON user_dashboard_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own themes" ON dashboard_themes
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage own templates" ON layout_templates
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own history" ON user_layout_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cache" ON widget_data_cache
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics" ON dashboard_analytics
    FOR SELECT USING (auth.uid() = user_id);

-- System and public content access
CREATE POLICY "System widget definitions are public" ON widget_definitions
    FOR SELECT USING (is_system = true OR is_public = true);

CREATE POLICY "Public themes are viewable" ON dashboard_themes
    FOR SELECT USING (is_public = true);

CREATE POLICY "Public templates are viewable" ON layout_templates
    FOR SELECT USING (is_public = true);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_dashboard_layouts_updated_at BEFORE UPDATE ON dashboard_layouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widget_definitions_updated_at BEFORE UPDATE ON widget_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_widget_instances_updated_at BEFORE UPDATE ON user_widget_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_dashboard_preferences_updated_at BEFORE UPDATE ON user_dashboard_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboard_themes_updated_at BEFORE UPDATE ON dashboard_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_layout_templates_updated_at BEFORE UPDATE ON layout_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widget_data_cache_updated_at BEFORE UPDATE ON widget_data_cache FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM widget_data_cache 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ language 'plpgsql';

-- Function to update usage counts
CREATE OR REPLACE FUNCTION update_usage_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'user_widget_instances' THEN
        UPDATE widget_definitions 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.widget_definition_id;
    ELSIF TG_TABLE_NAME = 'dashboard_layouts' THEN
        UPDATE dashboard_layouts 
        SET usage_count = usage_count + 1, last_used_at = NOW() 
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for usage tracking
CREATE TRIGGER update_widget_usage_count_trigger
    AFTER INSERT ON user_widget_instances
    FOR EACH ROW EXECUTE FUNCTION update_usage_counts();

CREATE TRIGGER update_layout_usage_count_trigger
    AFTER UPDATE ON dashboard_layouts
    FOR EACH ROW EXECUTE FUNCTION update_usage_counts(); 