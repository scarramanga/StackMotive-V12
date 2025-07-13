-- Block 20: Theme Toggle - Database Schema
-- Stores user theme preferences with sync capabilities

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- User Theme Preferences Table
CREATE TABLE IF NOT EXISTS user_theme_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme_mode TEXT NOT NULL CHECK (theme_mode IN ('light', 'dark', 'auto', 'system')),
    accent_color TEXT DEFAULT '#3B82F6',
    font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
    high_contrast BOOLEAN DEFAULT false,
    reduce_motion BOOLEAN DEFAULT false,
    compact_mode BOOLEAN DEFAULT false,
    sidebar_collapsed BOOLEAN DEFAULT false,
    
    -- Metadata
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id)
);

-- Theme Sync History Table (for device synchronization)
CREATE TABLE IF NOT EXISTS theme_sync_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT,
    theme_data JSONB NOT NULL,
    sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
    sync_source TEXT DEFAULT 'web',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_theme_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_sync_history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own theme preferences
CREATE POLICY "Users can view own theme preferences" ON user_theme_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own theme preferences" ON user_theme_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own theme preferences" ON user_theme_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own theme preferences" ON user_theme_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Theme sync history policies
CREATE POLICY "Users can view own theme sync history" ON theme_sync_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own theme sync history" ON theme_sync_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_theme_preferences_user_id ON user_theme_preferences(user_id);
CREATE INDEX idx_theme_sync_history_user_id ON theme_sync_history(user_id);
CREATE INDEX idx_theme_sync_history_timestamp ON theme_sync_history(sync_timestamp DESC);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_theme_preferences_updated_at
    BEFORE UPDATE ON user_theme_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit logging function
CREATE OR REPLACE FUNCTION log_theme_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO theme_sync_history (user_id, theme_data, sync_source)
    VALUES (
        NEW.user_id,
        row_to_json(NEW)::jsonb,
        'database_trigger'
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_theme_preference_changes
    AFTER INSERT OR UPDATE ON user_theme_preferences
    FOR EACH ROW EXECUTE FUNCTION log_theme_change();

-- Default theme preferences function
CREATE OR REPLACE FUNCTION create_default_theme_preference(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    preference_id UUID;
BEGIN
    INSERT INTO user_theme_preferences (user_id)
    VALUES (p_user_id)
    RETURNING id INTO preference_id;
    
    RETURN preference_id;
END;
$$ language 'plpgsql'; 