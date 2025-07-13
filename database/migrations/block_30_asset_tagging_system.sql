-- Block 30: Asset Tagging System - Database Schema
-- Complete Supabase migration for asset tagging functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE asset_type AS ENUM (
    'equity', 
    'crypto', 
    'cash', 
    'bond', 
    'commodity', 
    'real_estate', 
    'alternative'
);

CREATE TYPE tag_filter_operator AS ENUM ('AND', 'OR');

-- Asset Tags table
CREATE TABLE asset_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color code
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_tag_name UNIQUE(user_id, name),
    CONSTRAINT valid_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Assets table (portfolio assets that can be tagged)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    asset_type asset_type NOT NULL DEFAULT 'equity',
    value DECIMAL(15, 2) DEFAULT 0,
    allocation DECIMAL(5, 4) DEFAULT 0, -- Percentage as decimal (0.1234 = 12.34%)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_asset_symbol UNIQUE(user_id, symbol),
    CONSTRAINT positive_value CHECK (value >= 0),
    CONSTRAINT valid_allocation CHECK (allocation >= 0 AND allocation <= 1)
);

-- Asset-Tag relationships (many-to-many)
CREATE TABLE asset_tag_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES asset_tags(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT unique_asset_tag_assignment UNIQUE(asset_id, tag_id)
);

-- Tag Filters (saved filter configurations)
CREATE TABLE tag_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    include_tags UUID[] DEFAULT ARRAY[]::UUID[],
    exclude_tags UUID[] DEFAULT ARRAY[]::UUID[],
    operator tag_filter_operator DEFAULT 'AND',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_filter_name UNIQUE(user_id, name)
);

-- Asset Tagging Settings
CREATE TABLE asset_tagging_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    max_tags_per_asset INTEGER DEFAULT 10,
    auto_suggest_tags BOOLEAN DEFAULT TRUE,
    default_tag_color VARCHAR(7) DEFAULT '#3B82F6',
    enable_quick_tags BOOLEAN DEFAULT TRUE,
    show_tag_stats BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_settings UNIQUE(user_id),
    CONSTRAINT valid_default_color CHECK (default_tag_color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Quick Tags (predefined commonly used tags)
CREATE TABLE quick_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES asset_tags(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_quick_tag UNIQUE(user_id, tag_id)
);

-- Tagging History (for audit trail)
CREATE TABLE tagging_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES asset_tags(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('added', 'removed')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX idx_asset_tags_user_id ON asset_tags(user_id);
CREATE INDEX idx_asset_tags_name ON asset_tags(name);
CREATE INDEX idx_asset_tags_usage_count ON asset_tags(usage_count DESC);
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_symbol ON assets(user_id, symbol);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_asset_tag_assignments_user_id ON asset_tag_assignments(user_id);
CREATE INDEX idx_asset_tag_assignments_asset_id ON asset_tag_assignments(asset_id);
CREATE INDEX idx_asset_tag_assignments_tag_id ON asset_tag_assignments(tag_id);
CREATE INDEX idx_tag_filters_user_id ON tag_filters(user_id);
CREATE INDEX idx_quick_tags_user_id ON quick_tags(user_id, sort_order);
CREATE INDEX idx_tagging_history_user_id ON tagging_history(user_id);
CREATE INDEX idx_tagging_history_timestamp ON tagging_history(timestamp DESC);

-- Functions
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE asset_tags 
        SET usage_count = usage_count + 1, updated_at = NOW()
        WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE asset_tags 
        SET usage_count = GREATEST(usage_count - 1, 0), updated_at = NOW()
        WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_tag_usage_count
    AFTER INSERT OR DELETE ON asset_tag_assignments
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

CREATE TRIGGER trigger_asset_tags_updated_at
    BEFORE UPDATE ON asset_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tag_filters_updated_at
    BEFORE UPDATE ON tag_filters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_asset_tagging_settings_updated_at
    BEFORE UPDATE ON asset_tagging_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE asset_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_tagging_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tagging_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own asset tags" ON asset_tags
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own assets" ON assets
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own asset tag assignments" ON asset_tag_assignments
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tag filters" ON tag_filters
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tagging settings" ON asset_tagging_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own quick tags" ON quick_tags
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own tagging history" ON tagging_history
    FOR SELECT USING (auth.uid() = user_id);

-- Views for common queries
CREATE VIEW asset_tag_summary AS
SELECT 
    a.id,
    a.user_id,
    a.symbol,
    a.name,
    a.asset_type,
    a.value,
    a.allocation,
    COALESCE(
        ARRAY_AGG(
            CASE WHEN at.name IS NOT NULL 
            THEN jsonb_build_object(
                'id', at.id,
                'name', at.name,
                'color', at.color,
                'description', at.description
            ) END
        ) FILTER (WHERE at.name IS NOT NULL), 
        ARRAY[]::jsonb[]
    ) as tags,
    COUNT(ata.tag_id) as tag_count
FROM assets a
LEFT JOIN asset_tag_assignments ata ON a.id = ata.asset_id
LEFT JOIN asset_tags at ON ata.tag_id = at.id
GROUP BY a.id, a.user_id, a.symbol, a.name, a.asset_type, a.value, a.allocation;

-- Sample data for development (uncomment if needed)
/*
INSERT INTO asset_tags (user_id, name, color, description) VALUES
    (auth.uid(), 'High Growth', '#10B981', 'High growth potential assets'),
    (auth.uid(), 'Dividend', '#3B82F6', 'Dividend paying stocks'),
    (auth.uid(), 'Tech', '#8B5CF6', 'Technology sector'),
    (auth.uid(), 'ESG', '#10B981', 'Environmental, Social, Governance');

INSERT INTO asset_tagging_settings (user_id) VALUES (auth.uid());
*/

-- Comments
COMMENT ON TABLE asset_tags IS 'User-defined tags for categorizing assets';
COMMENT ON TABLE assets IS 'Portfolio assets that can be tagged';
COMMENT ON TABLE asset_tag_assignments IS 'Many-to-many relationship between assets and tags';
COMMENT ON TABLE tag_filters IS 'Saved filter configurations for asset views';
COMMENT ON TABLE asset_tagging_settings IS 'User preferences for asset tagging';
COMMENT ON TABLE quick_tags IS 'Frequently used tags for quick access';
COMMENT ON TABLE tagging_history IS 'Audit trail of tagging actions'; 