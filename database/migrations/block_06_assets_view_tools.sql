-- Block 6: Assets View Tools - Database Schema
-- Comprehensive asset viewing, tagging, and allocation tools

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Asset View Preferences Table
CREATE TABLE IF NOT EXISTS asset_view_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- View Configuration
    default_view_type TEXT DEFAULT 'holdings', -- 'holdings', 'allocation', 'performance'
    columns_visible TEXT[] DEFAULT ARRAY['symbol', 'name', 'value', 'change'],
    sort_column TEXT DEFAULT 'value',
    sort_direction TEXT DEFAULT 'desc',
    
    -- Display Preferences
    show_performance_tab BOOLEAN DEFAULT true,
    show_allocation_chart BOOLEAN DEFAULT true,
    refresh_interval INTEGER DEFAULT 30, -- seconds
    items_per_page INTEGER DEFAULT 25,
    
    -- Filter Settings
    default_filters JSONB DEFAULT '{}',
    saved_filters JSONB DEFAULT '[]',
    
    -- Chart Preferences
    chart_type TEXT DEFAULT 'donut', -- 'donut', 'bar', 'treemap'
    chart_theme TEXT DEFAULT 'default',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Asset Tags Table
CREATE TABLE IF NOT EXISTS asset_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tag Details
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    description TEXT,
    
    -- Tag Metadata
    usage_count INTEGER DEFAULT 0,
    is_system_tag BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Hierarchical Tags
    parent_tag_id UUID REFERENCES asset_tags(id) ON DELETE SET NULL,
    
    -- Organization
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Asset Tag Assignments Table
CREATE TABLE IF NOT EXISTS asset_tag_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Asset and Tag Reference
    asset_symbol TEXT NOT NULL,
    tag_id UUID NOT NULL REFERENCES asset_tags(id) ON DELETE CASCADE,
    
    -- Assignment Details
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by TEXT DEFAULT 'user', -- 'user', 'rule', 'ai'
    
    -- Assignment Context
    assignment_reason TEXT,
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, asset_symbol, tag_id)
);

-- Asset Allocation Rings Table
CREATE TABLE IF NOT EXISTS asset_allocation_rings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Ring Configuration
    name TEXT NOT NULL,
    description TEXT,
    ring_type TEXT DEFAULT 'asset_class', -- 'asset_class', 'sector', 'geography'
    
    -- Display Settings
    inner_radius DECIMAL(5,2) DEFAULT 40.0,
    outer_radius DECIMAL(5,2) DEFAULT 80.0,
    colors JSONB DEFAULT '[]',
    
    -- Allocation Settings
    total_target_percentage DECIMAL(5,2) DEFAULT 100.0,
    rebalance_threshold DECIMAL(5,2) DEFAULT 5.0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Asset Class Allocations Table
CREATE TABLE IF NOT EXISTS asset_class_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ring_id UUID NOT NULL REFERENCES asset_allocation_rings(id) ON DELETE CASCADE,
    
    -- Asset Class Details
    asset_class TEXT NOT NULL,
    sub_class TEXT,
    
    -- Allocation Targets
    target_percentage DECIMAL(5,2) NOT NULL,
    min_percentage DECIMAL(5,2) DEFAULT 0,
    max_percentage DECIMAL(5,2) DEFAULT 100,
    
    -- Current State
    current_percentage DECIMAL(5,2) DEFAULT 0,
    current_value DECIMAL(18,2) DEFAULT 0,
    
    -- Performance Metrics
    drift_percentage DECIMAL(5,2) DEFAULT 0,
    days_since_rebalance INTEGER DEFAULT 0,
    
    -- Visual Properties
    color TEXT DEFAULT '#3B82F6',
    sort_order INTEGER DEFAULT 0,
    
    -- Tax Considerations
    tax_efficiency_score DECIMAL(3,2) DEFAULT 0,
    holding_period_days INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, ring_id, asset_class)
);

-- Asset View Layouts Table
CREATE TABLE IF NOT EXISTS asset_view_layouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Layout Configuration
    layout_name TEXT NOT NULL,
    layout_type TEXT DEFAULT 'dashboard', -- 'dashboard', 'table', 'grid'
    
    -- Widget Configuration
    widgets JSONB DEFAULT '[]',
    layout_config JSONB DEFAULT '{}',
    
    -- Responsive Settings
    breakpoints JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, layout_name)
);

-- Asset View Filters Table
CREATE TABLE IF NOT EXISTS asset_view_filters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Filter Configuration
    filter_name TEXT NOT NULL,
    filter_type TEXT DEFAULT 'custom', -- 'custom', 'saved', 'system'
    
    -- Filter Criteria
    criteria JSONB NOT NULL DEFAULT '{}',
    
    -- Usage Statistics
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_favorite BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, filter_name)
);

-- Asset View History Table
CREATE TABLE IF NOT EXISTS asset_view_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- View Details
    view_type TEXT NOT NULL,
    view_config JSONB,
    
    -- Context
    asset_symbol TEXT,
    filters_applied JSONB,
    
    -- Session Information
    session_id TEXT,
    view_duration INTEGER, -- seconds
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE asset_view_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_allocation_rings ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_class_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_view_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_view_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_view_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for all tables
CREATE POLICY "Users can manage own asset view preferences" ON asset_view_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own asset tags" ON asset_tags
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own asset tag assignments" ON asset_tag_assignments
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own allocation rings" ON asset_allocation_rings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own asset class allocations" ON asset_class_allocations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own asset view layouts" ON asset_view_layouts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own asset view filters" ON asset_view_filters
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own asset view history" ON asset_view_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own asset view history" ON asset_view_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_asset_view_preferences_user_id ON asset_view_preferences(user_id);
CREATE INDEX idx_asset_tags_user_id ON asset_tags(user_id);
CREATE INDEX idx_asset_tags_name ON asset_tags(name);
CREATE INDEX idx_asset_tag_assignments_user_id ON asset_tag_assignments(user_id);
CREATE INDEX idx_asset_tag_assignments_asset_symbol ON asset_tag_assignments(asset_symbol);
CREATE INDEX idx_asset_tag_assignments_tag_id ON asset_tag_assignments(tag_id);
CREATE INDEX idx_asset_allocation_rings_user_id ON asset_allocation_rings(user_id);
CREATE INDEX idx_asset_class_allocations_user_id ON asset_class_allocations(user_id);
CREATE INDEX idx_asset_class_allocations_ring_id ON asset_class_allocations(ring_id);
CREATE INDEX idx_asset_view_layouts_user_id ON asset_view_layouts(user_id);
CREATE INDEX idx_asset_view_filters_user_id ON asset_view_filters(user_id);
CREATE INDEX idx_asset_view_history_user_id ON asset_view_history(user_id);
CREATE INDEX idx_asset_view_history_asset_symbol ON asset_view_history(asset_symbol);
CREATE INDEX idx_asset_view_history_created_at ON asset_view_history(created_at DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_asset_view_preferences_updated_at
    BEFORE UPDATE ON asset_view_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_tags_updated_at
    BEFORE UPDATE ON asset_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_allocation_rings_updated_at
    BEFORE UPDATE ON asset_allocation_rings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_class_allocations_updated_at
    BEFORE UPDATE ON asset_class_allocations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_view_layouts_updated_at
    BEFORE UPDATE ON asset_view_layouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_view_filters_updated_at
    BEFORE UPDATE ON asset_view_filters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for asset view tools
CREATE OR REPLACE FUNCTION get_user_asset_tags(p_user_id UUID)
RETURNS TABLE(
    tag_id UUID,
    tag_name TEXT,
    tag_color TEXT,
    tag_description TEXT,
    usage_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.color,
        t.description,
        COUNT(a.id)::INTEGER as usage_count
    FROM asset_tags t
    LEFT JOIN asset_tag_assignments a ON t.id = a.tag_id AND a.is_active = true
    WHERE t.user_id = p_user_id AND t.is_active = true
    GROUP BY t.id, t.name, t.color, t.description
    ORDER BY usage_count DESC, t.name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_asset_tags_for_symbol(p_user_id UUID, p_symbol TEXT)
RETURNS TABLE(
    tag_id UUID,
    tag_name TEXT,
    tag_color TEXT,
    assigned_at TIMESTAMPTZ,
    assigned_by TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.color,
        a.assigned_at,
        a.assigned_by
    FROM asset_tags t
    INNER JOIN asset_tag_assignments a ON t.id = a.tag_id
    WHERE t.user_id = p_user_id 
    AND a.asset_symbol = p_symbol 
    AND a.is_active = true
    ORDER BY a.assigned_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_asset_tag(
    p_user_id UUID,
    p_name TEXT,
    p_color TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    tag_id UUID;
BEGIN
    INSERT INTO asset_tags (user_id, name, color, description)
    VALUES (p_user_id, p_name, p_color, p_description)
    RETURNING id INTO tag_id;
    
    RETURN tag_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tag_asset(
    p_user_id UUID,
    p_asset_symbol TEXT,
    p_tag_id UUID,
    p_assigned_by TEXT DEFAULT 'user'
)
RETURNS UUID AS $$
DECLARE
    assignment_id UUID;
BEGIN
    INSERT INTO asset_tag_assignments (user_id, asset_symbol, tag_id, assigned_by)
    VALUES (p_user_id, p_asset_symbol, p_tag_id, p_assigned_by)
    ON CONFLICT (user_id, asset_symbol, tag_id)
    DO UPDATE SET 
        is_active = true,
        assigned_at = NOW(),
        assigned_by = p_assigned_by
    RETURNING id INTO assignment_id;
    
    -- Update usage count
    UPDATE asset_tags 
    SET usage_count = usage_count + 1
    WHERE id = p_tag_id;
    
    RETURN assignment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION untag_asset(
    p_user_id UUID,
    p_asset_symbol TEXT,
    p_tag_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE asset_tag_assignments 
    SET is_active = false
    WHERE user_id = p_user_id 
    AND asset_symbol = p_asset_symbol 
    AND tag_id = p_tag_id;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    -- Update usage count
    IF rows_affected > 0 THEN
        UPDATE asset_tags 
        SET usage_count = GREATEST(usage_count - 1, 0)
        WHERE id = p_tag_id;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_allocation_ring(
    p_user_id UUID,
    p_name TEXT,
    p_ring_type TEXT DEFAULT 'asset_class',
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    ring_id UUID;
BEGIN
    INSERT INTO asset_allocation_rings (user_id, name, ring_type, description)
    VALUES (p_user_id, p_name, p_ring_type, p_description)
    RETURNING id INTO ring_id;
    
    RETURN ring_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_allocation_drift(p_user_id UUID, p_ring_id UUID)
RETURNS TABLE(
    asset_class TEXT,
    target_percentage DECIMAL,
    current_percentage DECIMAL,
    drift_percentage DECIMAL,
    requires_rebalance BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.asset_class,
        ac.target_percentage,
        ac.current_percentage,
        (ac.current_percentage - ac.target_percentage) as drift_percentage,
        ABS(ac.current_percentage - ac.target_percentage) > 
            (SELECT rebalance_threshold FROM asset_allocation_rings WHERE id = p_ring_id)
            as requires_rebalance
    FROM asset_class_allocations ac
    WHERE ac.user_id = p_user_id AND ac.ring_id = p_ring_id
    ORDER BY ABS(ac.current_percentage - ac.target_percentage) DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_asset_view_preferences(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    prefs JSON;
BEGIN
    SELECT row_to_json(p)
    INTO prefs
    FROM (
        SELECT 
            default_view_type,
            columns_visible,
            sort_column,
            sort_direction,
            show_performance_tab,
            show_allocation_chart,
            refresh_interval,
            items_per_page,
            default_filters,
            chart_type,
            chart_theme
        FROM asset_view_preferences 
        WHERE user_id = p_user_id
    ) p;
    
    -- Return default preferences if none exist
    IF prefs IS NULL THEN
        prefs := '{
            "default_view_type": "holdings",
            "columns_visible": ["symbol", "name", "value", "change"],
            "sort_column": "value",
            "sort_direction": "desc",
            "show_performance_tab": true,
            "show_allocation_chart": true,
            "refresh_interval": 30,
            "items_per_page": 25,
            "default_filters": {},
            "chart_type": "donut",
            "chart_theme": "default"
        }'::JSON;
    END IF;
    
    RETURN prefs;
END;
$$ LANGUAGE plpgsql; 
-- Comprehensive asset viewing, tagging, and allocation tools

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Asset View Preferences Table
CREATE TABLE IF NOT EXISTS asset_view_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- View Configuration
    default_view_type TEXT DEFAULT 'holdings', -- 'holdings', 'allocation', 'performance'
    columns_visible TEXT[] DEFAULT ARRAY['symbol', 'name', 'value', 'change'],
    sort_column TEXT DEFAULT 'value',
    sort_direction TEXT DEFAULT 'desc',
    
    -- Display Preferences
    show_performance_tab BOOLEAN DEFAULT true,
    show_allocation_chart BOOLEAN DEFAULT true,
    refresh_interval INTEGER DEFAULT 30, -- seconds
    items_per_page INTEGER DEFAULT 25,
    
    -- Filter Settings
    default_filters JSONB DEFAULT '{}',
    saved_filters JSONB DEFAULT '[]',
    
    -- Chart Preferences
    chart_type TEXT DEFAULT 'donut', -- 'donut', 'bar', 'treemap'
    chart_theme TEXT DEFAULT 'default',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Asset Tags Table
CREATE TABLE IF NOT EXISTS asset_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tag Details
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    description TEXT,
    
    -- Tag Metadata
    usage_count INTEGER DEFAULT 0,
    is_system_tag BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Hierarchical Tags
    parent_tag_id UUID REFERENCES asset_tags(id) ON DELETE SET NULL,
    
    -- Organization
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Asset Tag Assignments Table
CREATE TABLE IF NOT EXISTS asset_tag_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Asset and Tag Reference
    asset_symbol TEXT NOT NULL,
    tag_id UUID NOT NULL REFERENCES asset_tags(id) ON DELETE CASCADE,
    
    -- Assignment Details
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by TEXT DEFAULT 'user', -- 'user', 'rule', 'ai'
    
    -- Assignment Context
    assignment_reason TEXT,
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, asset_symbol, tag_id)
);

-- Asset Allocation Rings Table
CREATE TABLE IF NOT EXISTS asset_allocation_rings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Ring Configuration
    name TEXT NOT NULL,
    description TEXT,
    ring_type TEXT DEFAULT 'asset_class', -- 'asset_class', 'sector', 'geography'
    
    -- Display Settings
    inner_radius DECIMAL(5,2) DEFAULT 40.0,
    outer_radius DECIMAL(5,2) DEFAULT 80.0,
    colors JSONB DEFAULT '[]',
    
    -- Allocation Settings
    total_target_percentage DECIMAL(5,2) DEFAULT 100.0,
    rebalance_threshold DECIMAL(5,2) DEFAULT 5.0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Asset Class Allocations Table
CREATE TABLE IF NOT EXISTS asset_class_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ring_id UUID NOT NULL REFERENCES asset_allocation_rings(id) ON DELETE CASCADE,
    
    -- Asset Class Details
    asset_class TEXT NOT NULL,
    sub_class TEXT,
    
    -- Allocation Targets
    target_percentage DECIMAL(5,2) NOT NULL,
    min_percentage DECIMAL(5,2) DEFAULT 0,
    max_percentage DECIMAL(5,2) DEFAULT 100,
    
    -- Current State
    current_percentage DECIMAL(5,2) DEFAULT 0,
    current_value DECIMAL(18,2) DEFAULT 0,
    
    -- Performance Metrics
    drift_percentage DECIMAL(5,2) DEFAULT 0,
    days_since_rebalance INTEGER DEFAULT 0,
    
    -- Visual Properties
    color TEXT DEFAULT '#3B82F6',
    sort_order INTEGER DEFAULT 0,
    
    -- Tax Considerations
    tax_efficiency_score DECIMAL(3,2) DEFAULT 0,
    holding_period_days INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, ring_id, asset_class)
);

-- Asset View Layouts Table
CREATE TABLE IF NOT EXISTS asset_view_layouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Layout Configuration
    layout_name TEXT NOT NULL,
    layout_type TEXT DEFAULT 'dashboard', -- 'dashboard', 'table', 'grid'
    
    -- Widget Configuration
    widgets JSONB DEFAULT '[]',
    layout_config JSONB DEFAULT '{}',
    
    -- Responsive Settings
    breakpoints JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, layout_name)
);

-- Asset View Filters Table
CREATE TABLE IF NOT EXISTS asset_view_filters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Filter Configuration
    filter_name TEXT NOT NULL,
    filter_type TEXT DEFAULT 'custom', -- 'custom', 'saved', 'system'
    
    -- Filter Criteria
    criteria JSONB NOT NULL DEFAULT '{}',
    
    -- Usage Statistics
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_favorite BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, filter_name)
);

-- Asset View History Table
CREATE TABLE IF NOT EXISTS asset_view_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- View Details
    view_type TEXT NOT NULL,
    view_config JSONB,
    
    -- Context
    asset_symbol TEXT,
    filters_applied JSONB,
    
    -- Session Information
    session_id TEXT,
    view_duration INTEGER, -- seconds
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE asset_view_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_allocation_rings ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_class_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_view_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_view_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_view_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for all tables
CREATE POLICY "Users can manage own asset view preferences" ON asset_view_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own asset tags" ON asset_tags
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own asset tag assignments" ON asset_tag_assignments
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own allocation rings" ON asset_allocation_rings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own asset class allocations" ON asset_class_allocations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own asset view layouts" ON asset_view_layouts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own asset view filters" ON asset_view_filters
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own asset view history" ON asset_view_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own asset view history" ON asset_view_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_asset_view_preferences_user_id ON asset_view_preferences(user_id);
CREATE INDEX idx_asset_tags_user_id ON asset_tags(user_id);
CREATE INDEX idx_asset_tags_name ON asset_tags(name);
CREATE INDEX idx_asset_tag_assignments_user_id ON asset_tag_assignments(user_id);
CREATE INDEX idx_asset_tag_assignments_asset_symbol ON asset_tag_assignments(asset_symbol);
CREATE INDEX idx_asset_tag_assignments_tag_id ON asset_tag_assignments(tag_id);
CREATE INDEX idx_asset_allocation_rings_user_id ON asset_allocation_rings(user_id);
CREATE INDEX idx_asset_class_allocations_user_id ON asset_class_allocations(user_id);
CREATE INDEX idx_asset_class_allocations_ring_id ON asset_class_allocations(ring_id);
CREATE INDEX idx_asset_view_layouts_user_id ON asset_view_layouts(user_id);
CREATE INDEX idx_asset_view_filters_user_id ON asset_view_filters(user_id);
CREATE INDEX idx_asset_view_history_user_id ON asset_view_history(user_id);
CREATE INDEX idx_asset_view_history_asset_symbol ON asset_view_history(asset_symbol);
CREATE INDEX idx_asset_view_history_created_at ON asset_view_history(created_at DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_asset_view_preferences_updated_at
    BEFORE UPDATE ON asset_view_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_tags_updated_at
    BEFORE UPDATE ON asset_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_allocation_rings_updated_at
    BEFORE UPDATE ON asset_allocation_rings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_class_allocations_updated_at
    BEFORE UPDATE ON asset_class_allocations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_view_layouts_updated_at
    BEFORE UPDATE ON asset_view_layouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_view_filters_updated_at
    BEFORE UPDATE ON asset_view_filters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for asset view tools
CREATE OR REPLACE FUNCTION get_user_asset_tags(p_user_id UUID)
RETURNS TABLE(
    tag_id UUID,
    tag_name TEXT,
    tag_color TEXT,
    tag_description TEXT,
    usage_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.color,
        t.description,
        COUNT(a.id)::INTEGER as usage_count
    FROM asset_tags t
    LEFT JOIN asset_tag_assignments a ON t.id = a.tag_id AND a.is_active = true
    WHERE t.user_id = p_user_id AND t.is_active = true
    GROUP BY t.id, t.name, t.color, t.description
    ORDER BY usage_count DESC, t.name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_asset_tags_for_symbol(p_user_id UUID, p_symbol TEXT)
RETURNS TABLE(
    tag_id UUID,
    tag_name TEXT,
    tag_color TEXT,
    assigned_at TIMESTAMPTZ,
    assigned_by TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.color,
        a.assigned_at,
        a.assigned_by
    FROM asset_tags t
    INNER JOIN asset_tag_assignments a ON t.id = a.tag_id
    WHERE t.user_id = p_user_id 
    AND a.asset_symbol = p_symbol 
    AND a.is_active = true
    ORDER BY a.assigned_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_asset_tag(
    p_user_id UUID,
    p_name TEXT,
    p_color TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    tag_id UUID;
BEGIN
    INSERT INTO asset_tags (user_id, name, color, description)
    VALUES (p_user_id, p_name, p_color, p_description)
    RETURNING id INTO tag_id;
    
    RETURN tag_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tag_asset(
    p_user_id UUID,
    p_asset_symbol TEXT,
    p_tag_id UUID,
    p_assigned_by TEXT DEFAULT 'user'
)
RETURNS UUID AS $$
DECLARE
    assignment_id UUID;
BEGIN
    INSERT INTO asset_tag_assignments (user_id, asset_symbol, tag_id, assigned_by)
    VALUES (p_user_id, p_asset_symbol, p_tag_id, p_assigned_by)
    ON CONFLICT (user_id, asset_symbol, tag_id)
    DO UPDATE SET 
        is_active = true,
        assigned_at = NOW(),
        assigned_by = p_assigned_by
    RETURNING id INTO assignment_id;
    
    -- Update usage count
    UPDATE asset_tags 
    SET usage_count = usage_count + 1
    WHERE id = p_tag_id;
    
    RETURN assignment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION untag_asset(
    p_user_id UUID,
    p_asset_symbol TEXT,
    p_tag_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE asset_tag_assignments 
    SET is_active = false
    WHERE user_id = p_user_id 
    AND asset_symbol = p_asset_symbol 
    AND tag_id = p_tag_id;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    -- Update usage count
    IF rows_affected > 0 THEN
        UPDATE asset_tags 
        SET usage_count = GREATEST(usage_count - 1, 0)
        WHERE id = p_tag_id;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_allocation_ring(
    p_user_id UUID,
    p_name TEXT,
    p_ring_type TEXT DEFAULT 'asset_class',
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    ring_id UUID;
BEGIN
    INSERT INTO asset_allocation_rings (user_id, name, ring_type, description)
    VALUES (p_user_id, p_name, p_ring_type, p_description)
    RETURNING id INTO ring_id;
    
    RETURN ring_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_allocation_drift(p_user_id UUID, p_ring_id UUID)
RETURNS TABLE(
    asset_class TEXT,
    target_percentage DECIMAL,
    current_percentage DECIMAL,
    drift_percentage DECIMAL,
    requires_rebalance BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.asset_class,
        ac.target_percentage,
        ac.current_percentage,
        (ac.current_percentage - ac.target_percentage) as drift_percentage,
        ABS(ac.current_percentage - ac.target_percentage) > 
            (SELECT rebalance_threshold FROM asset_allocation_rings WHERE id = p_ring_id)
            as requires_rebalance
    FROM asset_class_allocations ac
    WHERE ac.user_id = p_user_id AND ac.ring_id = p_ring_id
    ORDER BY ABS(ac.current_percentage - ac.target_percentage) DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_asset_view_preferences(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    prefs JSON;
BEGIN
    SELECT row_to_json(p)
    INTO prefs
    FROM (
        SELECT 
            default_view_type,
            columns_visible,
            sort_column,
            sort_direction,
            show_performance_tab,
            show_allocation_chart,
            refresh_interval,
            items_per_page,
            default_filters,
            chart_type,
            chart_theme
        FROM asset_view_preferences 
        WHERE user_id = p_user_id
    ) p;
    
    -- Return default preferences if none exist
    IF prefs IS NULL THEN
        prefs := '{
            "default_view_type": "holdings",
            "columns_visible": ["symbol", "name", "value", "change"],
            "sort_column": "value",
            "sort_direction": "desc",
            "show_performance_tab": true,
            "show_allocation_chart": true,
            "refresh_interval": 30,
            "items_per_page": 25,
            "default_filters": {},
            "chart_type": "donut",
            "chart_theme": "default"
        }'::JSON;
    END IF;
    
    RETURN prefs;
END;
$$ LANGUAGE plpgsql; 