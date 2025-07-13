-- Block 37: Asset Exclusion Panel - Database Schema
-- Comprehensive asset filtering and exclusion system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Asset Exclusion Rules Table
CREATE TABLE IF NOT EXISTS asset_exclusion_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Rule Identification
    rule_name TEXT NOT NULL,
    rule_description TEXT,
    
    -- Rule Type and Scope
    rule_type TEXT NOT NULL CHECK (rule_type IN ('individual', 'criteria', 'bulk', 'temporary')),
    exclusion_scope TEXT NOT NULL DEFAULT 'portfolio' CHECK (exclusion_scope IN ('portfolio', 'trading', 'watchlist', 'all')),
    
    -- Rule Configuration
    rule_config JSONB NOT NULL DEFAULT '{}',
    
    -- Rule Status
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    
    -- Time-based Rules
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    
    -- Metadata
    created_by TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, rule_name)
);

-- Individual Asset Exclusions Table
CREATE TABLE IF NOT EXISTS individual_asset_exclusions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Asset Details
    asset_symbol TEXT NOT NULL,
    asset_name TEXT,
    asset_type TEXT DEFAULT 'equity' CHECK (asset_type IN ('equity', 'crypto', 'bond', 'commodity', 'etf', 'mutual_fund')),
    
    -- Exclusion Details
    exclusion_reason TEXT NOT NULL,
    exclusion_type TEXT DEFAULT 'manual' CHECK (exclusion_type IN ('manual', 'automatic', 'rule_based', 'temporary')),
    exclusion_category TEXT CHECK (exclusion_category IN ('performance', 'risk', 'ethics', 'sector', 'regulatory', 'personal', 'other')),
    
    -- Exclusion Scope
    exclude_from_portfolio BOOLEAN DEFAULT true,
    exclude_from_trading BOOLEAN DEFAULT true,
    exclude_from_watchlist BOOLEAN DEFAULT false,
    exclude_from_suggestions BOOLEAN DEFAULT true,
    
    -- Time-based Exclusion
    excluded_from TIMESTAMPTZ DEFAULT NOW(),
    excluded_until TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    added_by TEXT DEFAULT 'user',
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, asset_symbol)
);

-- Criteria-based Exclusion Filters Table
CREATE TABLE IF NOT EXISTS criteria_exclusion_filters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Filter Identification
    filter_name TEXT NOT NULL,
    filter_description TEXT,
    
    -- Filter Type
    criteria_type TEXT NOT NULL CHECK (criteria_type IN (
        'market_cap', 'sector', 'industry', 'country', 'exchange',
        'price_range', 'volatility', 'volume', 'dividend_yield',
        'pe_ratio', 'debt_ratio', 'esg_score', 'analyst_rating'
    )),
    
    -- Filter Configuration
    filter_operator TEXT NOT NULL CHECK (filter_operator IN ('equals', 'not_equals', 'greater_than', 'less_than', 'between', 'in', 'not_in', 'contains', 'not_contains')),
    filter_value JSONB NOT NULL,
    
    -- Filter Status
    is_active BOOLEAN DEFAULT true,
    apply_to_portfolio BOOLEAN DEFAULT true,
    apply_to_trading BOOLEAN DEFAULT true,
    apply_to_watchlist BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, filter_name)
);

-- Exclusion History Table (Audit Trail)
CREATE TABLE IF NOT EXISTS exclusion_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Action Details
    action_type TEXT NOT NULL CHECK (action_type IN ('add', 'remove', 'modify', 'activate', 'deactivate')),
    exclusion_type TEXT NOT NULL CHECK (exclusion_type IN ('individual', 'filter', 'bulk')),
    
    -- Target Information
    target_identifier TEXT NOT NULL, -- Asset symbol or filter ID
    target_name TEXT,
    
    -- Action Context
    action_reason TEXT,
    action_data JSONB DEFAULT '{}',
    
    -- Timestamp
    action_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- User Context
    performed_by TEXT DEFAULT 'user',
    user_agent TEXT,
    ip_address INET
);

-- Bulk Exclusion Operations Table
CREATE TABLE IF NOT EXISTS bulk_exclusion_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Operation Details
    operation_name TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('add_bulk', 'remove_bulk', 'import', 'export')),
    
    -- Operation Data
    asset_list TEXT[] NOT NULL,
    operation_config JSONB DEFAULT '{}',
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    total_assets INTEGER NOT NULL,
    processed_assets INTEGER DEFAULT 0,
    failed_assets INTEGER DEFAULT 0,
    
    -- Results
    success_list TEXT[] DEFAULT ARRAY[]::TEXT[],
    failure_list TEXT[] DEFAULT ARRAY[]::TEXT[],
    error_details JSONB DEFAULT '{}',
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exclusion Settings Table
CREATE TABLE IF NOT EXISTS exclusion_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- General Settings
    enable_automatic_exclusions BOOLEAN DEFAULT false,
    enable_temporary_exclusions BOOLEAN DEFAULT true,
    default_exclusion_duration INTEGER, -- Days
    
    -- Notification Settings
    notify_on_exclusion_add BOOLEAN DEFAULT true,
    notify_on_exclusion_remove BOOLEAN DEFAULT true,
    notify_on_automatic_exclusion BOOLEAN DEFAULT true,
    
    -- Scope Settings
    default_portfolio_exclusion BOOLEAN DEFAULT true,
    default_trading_exclusion BOOLEAN DEFAULT true,
    default_watchlist_exclusion BOOLEAN DEFAULT false,
    default_suggestion_exclusion BOOLEAN DEFAULT true,
    
    -- Performance Settings
    auto_exclude_poor_performers BOOLEAN DEFAULT false,
    poor_performance_threshold DECIMAL(5,2) DEFAULT -20.0, -- -20%
    performance_evaluation_period INTEGER DEFAULT 90, -- Days
    
    -- Risk Settings
    auto_exclude_high_volatility BOOLEAN DEFAULT false,
    volatility_threshold DECIMAL(5,2) DEFAULT 50.0, -- 50%
    
    -- Import/Export Settings
    allow_bulk_operations BOOLEAN DEFAULT true,
    max_bulk_operation_size INTEGER DEFAULT 1000,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Exclusion Templates Table
CREATE TABLE IF NOT EXISTS exclusion_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template Details
    template_name TEXT NOT NULL,
    template_description TEXT,
    template_category TEXT CHECK (template_category IN ('risk_management', 'sector_focus', 'esg', 'custom')),
    
    -- Template Configuration
    template_config JSONB NOT NULL,
    
    -- Template Status
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, template_name)
);

-- Exclusion Impact Analysis Table
CREATE TABLE IF NOT EXISTS exclusion_impact_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Analysis Context
    analysis_date DATE DEFAULT CURRENT_DATE,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('individual', 'filter', 'bulk', 'portfolio')),
    
    -- Exclusion Details
    exclusion_identifier TEXT NOT NULL,
    exclusion_name TEXT,
    
    -- Impact Metrics
    assets_affected INTEGER DEFAULT 0,
    portfolio_allocation_impact DECIMAL(8,4) DEFAULT 0, -- Percentage
    estimated_return_impact DECIMAL(8,4) DEFAULT 0,
    risk_impact DECIMAL(8,4) DEFAULT 0,
    
    -- Alternative Suggestions
    suggested_alternatives JSONB DEFAULT '[]',
    
    -- Analysis Data
    analysis_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_asset_exclusion_rules_user_id ON asset_exclusion_rules(user_id);
CREATE INDEX idx_asset_exclusion_rules_active ON asset_exclusion_rules(is_active, effective_from, effective_until);
CREATE INDEX idx_asset_exclusion_rules_type ON asset_exclusion_rules(rule_type, exclusion_scope);

CREATE INDEX idx_individual_asset_exclusions_user_id ON individual_asset_exclusions(user_id);
CREATE INDEX idx_individual_asset_exclusions_symbol ON individual_asset_exclusions(asset_symbol);
CREATE INDEX idx_individual_asset_exclusions_active ON individual_asset_exclusions(is_active, excluded_from, excluded_until);
CREATE INDEX idx_individual_asset_exclusions_type ON individual_asset_exclusions(exclusion_type, exclusion_category);

CREATE INDEX idx_criteria_exclusion_filters_user_id ON criteria_exclusion_filters(user_id);
CREATE INDEX idx_criteria_exclusion_filters_active ON criteria_exclusion_filters(is_active);
CREATE INDEX idx_criteria_exclusion_filters_type ON criteria_exclusion_filters(criteria_type);

CREATE INDEX idx_exclusion_history_user_id ON exclusion_history(user_id);
CREATE INDEX idx_exclusion_history_timestamp ON exclusion_history(action_timestamp DESC);
CREATE INDEX idx_exclusion_history_type ON exclusion_history(action_type, exclusion_type);

CREATE INDEX idx_bulk_exclusion_operations_user_id ON bulk_exclusion_operations(user_id);
CREATE INDEX idx_bulk_exclusion_operations_status ON bulk_exclusion_operations(status, started_at DESC);

CREATE INDEX idx_exclusion_settings_user_id ON exclusion_settings(user_id);

CREATE INDEX idx_exclusion_templates_user_id ON exclusion_templates(user_id);
CREATE INDEX idx_exclusion_templates_active ON exclusion_templates(is_active, is_public);

CREATE INDEX idx_exclusion_impact_analysis_user_id ON exclusion_impact_analysis(user_id);
CREATE INDEX idx_exclusion_impact_analysis_date ON exclusion_impact_analysis(analysis_date DESC);

-- Functions for exclusion logic
CREATE OR REPLACE FUNCTION check_asset_exclusion(
    p_user_id UUID,
    p_asset_symbol TEXT,
    p_scope TEXT DEFAULT 'portfolio'
)
RETURNS BOOLEAN AS $$
DECLARE
    is_excluded BOOLEAN := FALSE;
BEGIN
    -- Check individual exclusions
    SELECT EXISTS(
        SELECT 1 FROM individual_asset_exclusions 
        WHERE user_id = p_user_id 
        AND asset_symbol = p_asset_symbol 
        AND is_active = TRUE
        AND (excluded_until IS NULL OR excluded_until > NOW())
        AND (
            (p_scope = 'portfolio' AND exclude_from_portfolio = TRUE) OR
            (p_scope = 'trading' AND exclude_from_trading = TRUE) OR
            (p_scope = 'watchlist' AND exclude_from_watchlist = TRUE) OR
            (p_scope = 'suggestions' AND exclude_from_suggestions = TRUE)
        )
    ) INTO is_excluded;
    
    IF is_excluded THEN
        RETURN TRUE;
    END IF;
    
    -- Check criteria-based exclusions (simplified - would need asset data)
    -- This would require integration with asset data tables
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_individual_exclusion(
    p_user_id UUID,
    p_asset_symbol TEXT,
    p_exclusion_reason TEXT,
    p_exclusion_category TEXT DEFAULT 'manual',
    p_exclude_from_portfolio BOOLEAN DEFAULT TRUE,
    p_exclude_from_trading BOOLEAN DEFAULT TRUE,
    p_exclude_from_watchlist BOOLEAN DEFAULT FALSE,
    p_exclude_from_suggestions BOOLEAN DEFAULT TRUE,
    p_excluded_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    exclusion_id UUID;
BEGIN
    INSERT INTO individual_asset_exclusions (
        user_id, asset_symbol, exclusion_reason, exclusion_category,
        exclude_from_portfolio, exclude_from_trading, exclude_from_watchlist, exclude_from_suggestions,
        excluded_until
    )
    VALUES (
        p_user_id, p_asset_symbol, p_exclusion_reason, p_exclusion_category,
        p_exclude_from_portfolio, p_exclude_from_trading, p_exclude_from_watchlist, p_exclude_from_suggestions,
        p_excluded_until
    )
    ON CONFLICT (user_id, asset_symbol)
    DO UPDATE SET
        exclusion_reason = p_exclusion_reason,
        exclusion_category = p_exclusion_category,
        exclude_from_portfolio = p_exclude_from_portfolio,
        exclude_from_trading = p_exclude_from_trading,
        exclude_from_watchlist = p_exclude_from_watchlist,
        exclude_from_suggestions = p_exclude_from_suggestions,
        excluded_until = p_excluded_until,
        is_active = TRUE,
        updated_at = NOW()
    RETURNING id INTO exclusion_id;
    
    -- Log the action
    INSERT INTO exclusion_history (
        user_id, action_type, exclusion_type, target_identifier, target_name, action_reason
    )
    VALUES (
        p_user_id, 'add', 'individual', p_asset_symbol, p_asset_symbol, p_exclusion_reason
    );
    
    RETURN exclusion_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_individual_exclusion(
    p_user_id UUID,
    p_asset_symbol TEXT,
    p_reason TEXT DEFAULT 'Manual removal'
)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE individual_asset_exclusions 
    SET is_active = FALSE, updated_at = NOW()
    WHERE user_id = p_user_id AND asset_symbol = p_asset_symbol AND is_active = TRUE;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    IF rows_affected > 0 THEN
        -- Log the action
        INSERT INTO exclusion_history (
            user_id, action_type, exclusion_type, target_identifier, target_name, action_reason
        )
        VALUES (
            p_user_id, 'remove', 'individual', p_asset_symbol, p_asset_symbol, p_reason
        );
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_excluded_assets(
    p_user_id UUID,
    p_scope TEXT DEFAULT 'portfolio'
)
RETURNS TABLE (
    asset_symbol TEXT,
    exclusion_reason TEXT,
    exclusion_category TEXT,
    excluded_from TIMESTAMPTZ,
    excluded_until TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        iae.asset_symbol,
        iae.exclusion_reason,
        iae.exclusion_category,
        iae.excluded_from,
        iae.excluded_until
    FROM individual_asset_exclusions iae
    WHERE iae.user_id = p_user_id 
    AND iae.is_active = TRUE
    AND (iae.excluded_until IS NULL OR iae.excluded_until > NOW())
    AND (
        (p_scope = 'portfolio' AND iae.exclude_from_portfolio = TRUE) OR
        (p_scope = 'trading' AND iae.exclude_from_trading = TRUE) OR
        (p_scope = 'watchlist' AND iae.exclude_from_watchlist = TRUE) OR
        (p_scope = 'suggestions' AND iae.exclude_from_suggestions = TRUE)
    )
    ORDER BY iae.excluded_from DESC;
END;
$$ LANGUAGE plpgsql;

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_asset_exclusion_rules_updated_at
    BEFORE UPDATE ON asset_exclusion_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_individual_asset_exclusions_updated_at
    BEFORE UPDATE ON individual_asset_exclusions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_criteria_exclusion_filters_updated_at
    BEFORE UPDATE ON criteria_exclusion_filters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_exclusion_settings_updated_at
    BEFORE UPDATE ON exclusion_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_exclusion_templates_updated_at
    BEFORE UPDATE ON exclusion_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE asset_exclusion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_asset_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria_exclusion_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_exclusion_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusion_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusion_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusion_impact_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own exclusion rules" ON asset_exclusion_rules
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own individual exclusions" ON individual_asset_exclusions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own criteria filters" ON criteria_exclusion_filters
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own exclusion history" ON exclusion_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exclusion history" ON exclusion_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bulk operations" ON bulk_exclusion_operations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own exclusion settings" ON exclusion_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own exclusion templates" ON exclusion_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public exclusion templates" ON exclusion_templates
    FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can view their own exclusion impact analysis" ON exclusion_impact_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exclusion impact analysis" ON exclusion_impact_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Views for common queries
CREATE VIEW active_exclusions AS
SELECT 
    iae.user_id,
    iae.asset_symbol,
    iae.asset_name,
    iae.exclusion_reason,
    iae.exclusion_category,
    iae.exclude_from_portfolio,
    iae.exclude_from_trading,
    iae.exclude_from_watchlist,
    iae.exclude_from_suggestions,
    iae.excluded_from,
    iae.excluded_until,
    iae.notes
FROM individual_asset_exclusions iae
WHERE iae.is_active = TRUE
AND (iae.excluded_until IS NULL OR iae.excluded_until > NOW());

CREATE VIEW exclusion_summary AS
SELECT 
    user_id,
    COUNT(*) as total_exclusions,
    COUNT(CASE WHEN exclude_from_portfolio = TRUE THEN 1 END) as portfolio_exclusions,
    COUNT(CASE WHEN exclude_from_trading = TRUE THEN 1 END) as trading_exclusions,
    COUNT(CASE WHEN exclude_from_watchlist = TRUE THEN 1 END) as watchlist_exclusions,
    COUNT(CASE WHEN excluded_until IS NOT NULL AND excluded_until > NOW() THEN 1 END) as temporary_exclusions,
    COUNT(CASE WHEN exclusion_category = 'performance' THEN 1 END) as performance_exclusions,
    COUNT(CASE WHEN exclusion_category = 'risk' THEN 1 END) as risk_exclusions
FROM active_exclusions
GROUP BY user_id;

-- Comments
COMMENT ON TABLE asset_exclusion_rules IS 'Master table for all types of asset exclusion rules';
COMMENT ON TABLE individual_asset_exclusions IS 'Individual asset exclusions with detailed scope control';
COMMENT ON TABLE criteria_exclusion_filters IS 'Criteria-based filters for automatic asset exclusion';
COMMENT ON TABLE exclusion_history IS 'Audit trail of all exclusion-related actions';
COMMENT ON TABLE bulk_exclusion_operations IS 'Bulk operations for adding/removing multiple exclusions';
COMMENT ON TABLE exclusion_settings IS 'User preferences for exclusion behavior';
COMMENT ON TABLE exclusion_templates IS 'Reusable exclusion rule templates';
COMMENT ON TABLE exclusion_impact_analysis IS 'Analysis of exclusion impact on portfolio performance'; 
-- Comprehensive asset filtering and exclusion system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Asset Exclusion Rules Table
CREATE TABLE IF NOT EXISTS asset_exclusion_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Rule Identification
    rule_name TEXT NOT NULL,
    rule_description TEXT,
    
    -- Rule Type and Scope
    rule_type TEXT NOT NULL CHECK (rule_type IN ('individual', 'criteria', 'bulk', 'temporary')),
    exclusion_scope TEXT NOT NULL DEFAULT 'portfolio' CHECK (exclusion_scope IN ('portfolio', 'trading', 'watchlist', 'all')),
    
    -- Rule Configuration
    rule_config JSONB NOT NULL DEFAULT '{}',
    
    -- Rule Status
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    
    -- Time-based Rules
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    
    -- Metadata
    created_by TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, rule_name)
);

-- Individual Asset Exclusions Table
CREATE TABLE IF NOT EXISTS individual_asset_exclusions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Asset Details
    asset_symbol TEXT NOT NULL,
    asset_name TEXT,
    asset_type TEXT DEFAULT 'equity' CHECK (asset_type IN ('equity', 'crypto', 'bond', 'commodity', 'etf', 'mutual_fund')),
    
    -- Exclusion Details
    exclusion_reason TEXT NOT NULL,
    exclusion_type TEXT DEFAULT 'manual' CHECK (exclusion_type IN ('manual', 'automatic', 'rule_based', 'temporary')),
    exclusion_category TEXT CHECK (exclusion_category IN ('performance', 'risk', 'ethics', 'sector', 'regulatory', 'personal', 'other')),
    
    -- Exclusion Scope
    exclude_from_portfolio BOOLEAN DEFAULT true,
    exclude_from_trading BOOLEAN DEFAULT true,
    exclude_from_watchlist BOOLEAN DEFAULT false,
    exclude_from_suggestions BOOLEAN DEFAULT true,
    
    -- Time-based Exclusion
    excluded_from TIMESTAMPTZ DEFAULT NOW(),
    excluded_until TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    added_by TEXT DEFAULT 'user',
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, asset_symbol)
);

-- Criteria-based Exclusion Filters Table
CREATE TABLE IF NOT EXISTS criteria_exclusion_filters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Filter Identification
    filter_name TEXT NOT NULL,
    filter_description TEXT,
    
    -- Filter Type
    criteria_type TEXT NOT NULL CHECK (criteria_type IN (
        'market_cap', 'sector', 'industry', 'country', 'exchange',
        'price_range', 'volatility', 'volume', 'dividend_yield',
        'pe_ratio', 'debt_ratio', 'esg_score', 'analyst_rating'
    )),
    
    -- Filter Configuration
    filter_operator TEXT NOT NULL CHECK (filter_operator IN ('equals', 'not_equals', 'greater_than', 'less_than', 'between', 'in', 'not_in', 'contains', 'not_contains')),
    filter_value JSONB NOT NULL,
    
    -- Filter Status
    is_active BOOLEAN DEFAULT true,
    apply_to_portfolio BOOLEAN DEFAULT true,
    apply_to_trading BOOLEAN DEFAULT true,
    apply_to_watchlist BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, filter_name)
);

-- Exclusion History Table (Audit Trail)
CREATE TABLE IF NOT EXISTS exclusion_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Action Details
    action_type TEXT NOT NULL CHECK (action_type IN ('add', 'remove', 'modify', 'activate', 'deactivate')),
    exclusion_type TEXT NOT NULL CHECK (exclusion_type IN ('individual', 'filter', 'bulk')),
    
    -- Target Information
    target_identifier TEXT NOT NULL, -- Asset symbol or filter ID
    target_name TEXT,
    
    -- Action Context
    action_reason TEXT,
    action_data JSONB DEFAULT '{}',
    
    -- Timestamp
    action_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- User Context
    performed_by TEXT DEFAULT 'user',
    user_agent TEXT,
    ip_address INET
);

-- Bulk Exclusion Operations Table
CREATE TABLE IF NOT EXISTS bulk_exclusion_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Operation Details
    operation_name TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('add_bulk', 'remove_bulk', 'import', 'export')),
    
    -- Operation Data
    asset_list TEXT[] NOT NULL,
    operation_config JSONB DEFAULT '{}',
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    total_assets INTEGER NOT NULL,
    processed_assets INTEGER DEFAULT 0,
    failed_assets INTEGER DEFAULT 0,
    
    -- Results
    success_list TEXT[] DEFAULT ARRAY[]::TEXT[],
    failure_list TEXT[] DEFAULT ARRAY[]::TEXT[],
    error_details JSONB DEFAULT '{}',
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exclusion Settings Table
CREATE TABLE IF NOT EXISTS exclusion_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- General Settings
    enable_automatic_exclusions BOOLEAN DEFAULT false,
    enable_temporary_exclusions BOOLEAN DEFAULT true,
    default_exclusion_duration INTEGER, -- Days
    
    -- Notification Settings
    notify_on_exclusion_add BOOLEAN DEFAULT true,
    notify_on_exclusion_remove BOOLEAN DEFAULT true,
    notify_on_automatic_exclusion BOOLEAN DEFAULT true,
    
    -- Scope Settings
    default_portfolio_exclusion BOOLEAN DEFAULT true,
    default_trading_exclusion BOOLEAN DEFAULT true,
    default_watchlist_exclusion BOOLEAN DEFAULT false,
    default_suggestion_exclusion BOOLEAN DEFAULT true,
    
    -- Performance Settings
    auto_exclude_poor_performers BOOLEAN DEFAULT false,
    poor_performance_threshold DECIMAL(5,2) DEFAULT -20.0, -- -20%
    performance_evaluation_period INTEGER DEFAULT 90, -- Days
    
    -- Risk Settings
    auto_exclude_high_volatility BOOLEAN DEFAULT false,
    volatility_threshold DECIMAL(5,2) DEFAULT 50.0, -- 50%
    
    -- Import/Export Settings
    allow_bulk_operations BOOLEAN DEFAULT true,
    max_bulk_operation_size INTEGER DEFAULT 1000,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Exclusion Templates Table
CREATE TABLE IF NOT EXISTS exclusion_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template Details
    template_name TEXT NOT NULL,
    template_description TEXT,
    template_category TEXT CHECK (template_category IN ('risk_management', 'sector_focus', 'esg', 'custom')),
    
    -- Template Configuration
    template_config JSONB NOT NULL,
    
    -- Template Status
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, template_name)
);

-- Exclusion Impact Analysis Table
CREATE TABLE IF NOT EXISTS exclusion_impact_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Analysis Context
    analysis_date DATE DEFAULT CURRENT_DATE,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('individual', 'filter', 'bulk', 'portfolio')),
    
    -- Exclusion Details
    exclusion_identifier TEXT NOT NULL,
    exclusion_name TEXT,
    
    -- Impact Metrics
    assets_affected INTEGER DEFAULT 0,
    portfolio_allocation_impact DECIMAL(8,4) DEFAULT 0, -- Percentage
    estimated_return_impact DECIMAL(8,4) DEFAULT 0,
    risk_impact DECIMAL(8,4) DEFAULT 0,
    
    -- Alternative Suggestions
    suggested_alternatives JSONB DEFAULT '[]',
    
    -- Analysis Data
    analysis_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_asset_exclusion_rules_user_id ON asset_exclusion_rules(user_id);
CREATE INDEX idx_asset_exclusion_rules_active ON asset_exclusion_rules(is_active, effective_from, effective_until);
CREATE INDEX idx_asset_exclusion_rules_type ON asset_exclusion_rules(rule_type, exclusion_scope);

CREATE INDEX idx_individual_asset_exclusions_user_id ON individual_asset_exclusions(user_id);
CREATE INDEX idx_individual_asset_exclusions_symbol ON individual_asset_exclusions(asset_symbol);
CREATE INDEX idx_individual_asset_exclusions_active ON individual_asset_exclusions(is_active, excluded_from, excluded_until);
CREATE INDEX idx_individual_asset_exclusions_type ON individual_asset_exclusions(exclusion_type, exclusion_category);

CREATE INDEX idx_criteria_exclusion_filters_user_id ON criteria_exclusion_filters(user_id);
CREATE INDEX idx_criteria_exclusion_filters_active ON criteria_exclusion_filters(is_active);
CREATE INDEX idx_criteria_exclusion_filters_type ON criteria_exclusion_filters(criteria_type);

CREATE INDEX idx_exclusion_history_user_id ON exclusion_history(user_id);
CREATE INDEX idx_exclusion_history_timestamp ON exclusion_history(action_timestamp DESC);
CREATE INDEX idx_exclusion_history_type ON exclusion_history(action_type, exclusion_type);

CREATE INDEX idx_bulk_exclusion_operations_user_id ON bulk_exclusion_operations(user_id);
CREATE INDEX idx_bulk_exclusion_operations_status ON bulk_exclusion_operations(status, started_at DESC);

CREATE INDEX idx_exclusion_settings_user_id ON exclusion_settings(user_id);

CREATE INDEX idx_exclusion_templates_user_id ON exclusion_templates(user_id);
CREATE INDEX idx_exclusion_templates_active ON exclusion_templates(is_active, is_public);

CREATE INDEX idx_exclusion_impact_analysis_user_id ON exclusion_impact_analysis(user_id);
CREATE INDEX idx_exclusion_impact_analysis_date ON exclusion_impact_analysis(analysis_date DESC);

-- Functions for exclusion logic
CREATE OR REPLACE FUNCTION check_asset_exclusion(
    p_user_id UUID,
    p_asset_symbol TEXT,
    p_scope TEXT DEFAULT 'portfolio'
)
RETURNS BOOLEAN AS $$
DECLARE
    is_excluded BOOLEAN := FALSE;
BEGIN
    -- Check individual exclusions
    SELECT EXISTS(
        SELECT 1 FROM individual_asset_exclusions 
        WHERE user_id = p_user_id 
        AND asset_symbol = p_asset_symbol 
        AND is_active = TRUE
        AND (excluded_until IS NULL OR excluded_until > NOW())
        AND (
            (p_scope = 'portfolio' AND exclude_from_portfolio = TRUE) OR
            (p_scope = 'trading' AND exclude_from_trading = TRUE) OR
            (p_scope = 'watchlist' AND exclude_from_watchlist = TRUE) OR
            (p_scope = 'suggestions' AND exclude_from_suggestions = TRUE)
        )
    ) INTO is_excluded;
    
    IF is_excluded THEN
        RETURN TRUE;
    END IF;
    
    -- Check criteria-based exclusions (simplified - would need asset data)
    -- This would require integration with asset data tables
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_individual_exclusion(
    p_user_id UUID,
    p_asset_symbol TEXT,
    p_exclusion_reason TEXT,
    p_exclusion_category TEXT DEFAULT 'manual',
    p_exclude_from_portfolio BOOLEAN DEFAULT TRUE,
    p_exclude_from_trading BOOLEAN DEFAULT TRUE,
    p_exclude_from_watchlist BOOLEAN DEFAULT FALSE,
    p_exclude_from_suggestions BOOLEAN DEFAULT TRUE,
    p_excluded_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    exclusion_id UUID;
BEGIN
    INSERT INTO individual_asset_exclusions (
        user_id, asset_symbol, exclusion_reason, exclusion_category,
        exclude_from_portfolio, exclude_from_trading, exclude_from_watchlist, exclude_from_suggestions,
        excluded_until
    )
    VALUES (
        p_user_id, p_asset_symbol, p_exclusion_reason, p_exclusion_category,
        p_exclude_from_portfolio, p_exclude_from_trading, p_exclude_from_watchlist, p_exclude_from_suggestions,
        p_excluded_until
    )
    ON CONFLICT (user_id, asset_symbol)
    DO UPDATE SET
        exclusion_reason = p_exclusion_reason,
        exclusion_category = p_exclusion_category,
        exclude_from_portfolio = p_exclude_from_portfolio,
        exclude_from_trading = p_exclude_from_trading,
        exclude_from_watchlist = p_exclude_from_watchlist,
        exclude_from_suggestions = p_exclude_from_suggestions,
        excluded_until = p_excluded_until,
        is_active = TRUE,
        updated_at = NOW()
    RETURNING id INTO exclusion_id;
    
    -- Log the action
    INSERT INTO exclusion_history (
        user_id, action_type, exclusion_type, target_identifier, target_name, action_reason
    )
    VALUES (
        p_user_id, 'add', 'individual', p_asset_symbol, p_asset_symbol, p_exclusion_reason
    );
    
    RETURN exclusion_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_individual_exclusion(
    p_user_id UUID,
    p_asset_symbol TEXT,
    p_reason TEXT DEFAULT 'Manual removal'
)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE individual_asset_exclusions 
    SET is_active = FALSE, updated_at = NOW()
    WHERE user_id = p_user_id AND asset_symbol = p_asset_symbol AND is_active = TRUE;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    IF rows_affected > 0 THEN
        -- Log the action
        INSERT INTO exclusion_history (
            user_id, action_type, exclusion_type, target_identifier, target_name, action_reason
        )
        VALUES (
            p_user_id, 'remove', 'individual', p_asset_symbol, p_asset_symbol, p_reason
        );
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_excluded_assets(
    p_user_id UUID,
    p_scope TEXT DEFAULT 'portfolio'
)
RETURNS TABLE (
    asset_symbol TEXT,
    exclusion_reason TEXT,
    exclusion_category TEXT,
    excluded_from TIMESTAMPTZ,
    excluded_until TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        iae.asset_symbol,
        iae.exclusion_reason,
        iae.exclusion_category,
        iae.excluded_from,
        iae.excluded_until
    FROM individual_asset_exclusions iae
    WHERE iae.user_id = p_user_id 
    AND iae.is_active = TRUE
    AND (iae.excluded_until IS NULL OR iae.excluded_until > NOW())
    AND (
        (p_scope = 'portfolio' AND iae.exclude_from_portfolio = TRUE) OR
        (p_scope = 'trading' AND iae.exclude_from_trading = TRUE) OR
        (p_scope = 'watchlist' AND iae.exclude_from_watchlist = TRUE) OR
        (p_scope = 'suggestions' AND iae.exclude_from_suggestions = TRUE)
    )
    ORDER BY iae.excluded_from DESC;
END;
$$ LANGUAGE plpgsql;

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_asset_exclusion_rules_updated_at
    BEFORE UPDATE ON asset_exclusion_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_individual_asset_exclusions_updated_at
    BEFORE UPDATE ON individual_asset_exclusions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_criteria_exclusion_filters_updated_at
    BEFORE UPDATE ON criteria_exclusion_filters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_exclusion_settings_updated_at
    BEFORE UPDATE ON exclusion_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_exclusion_templates_updated_at
    BEFORE UPDATE ON exclusion_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE asset_exclusion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_asset_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria_exclusion_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_exclusion_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusion_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusion_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusion_impact_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own exclusion rules" ON asset_exclusion_rules
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own individual exclusions" ON individual_asset_exclusions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own criteria filters" ON criteria_exclusion_filters
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own exclusion history" ON exclusion_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exclusion history" ON exclusion_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bulk operations" ON bulk_exclusion_operations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own exclusion settings" ON exclusion_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own exclusion templates" ON exclusion_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public exclusion templates" ON exclusion_templates
    FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can view their own exclusion impact analysis" ON exclusion_impact_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exclusion impact analysis" ON exclusion_impact_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Views for common queries
CREATE VIEW active_exclusions AS
SELECT 
    iae.user_id,
    iae.asset_symbol,
    iae.asset_name,
    iae.exclusion_reason,
    iae.exclusion_category,
    iae.exclude_from_portfolio,
    iae.exclude_from_trading,
    iae.exclude_from_watchlist,
    iae.exclude_from_suggestions,
    iae.excluded_from,
    iae.excluded_until,
    iae.notes
FROM individual_asset_exclusions iae
WHERE iae.is_active = TRUE
AND (iae.excluded_until IS NULL OR iae.excluded_until > NOW());

CREATE VIEW exclusion_summary AS
SELECT 
    user_id,
    COUNT(*) as total_exclusions,
    COUNT(CASE WHEN exclude_from_portfolio = TRUE THEN 1 END) as portfolio_exclusions,
    COUNT(CASE WHEN exclude_from_trading = TRUE THEN 1 END) as trading_exclusions,
    COUNT(CASE WHEN exclude_from_watchlist = TRUE THEN 1 END) as watchlist_exclusions,
    COUNT(CASE WHEN excluded_until IS NOT NULL AND excluded_until > NOW() THEN 1 END) as temporary_exclusions,
    COUNT(CASE WHEN exclusion_category = 'performance' THEN 1 END) as performance_exclusions,
    COUNT(CASE WHEN exclusion_category = 'risk' THEN 1 END) as risk_exclusions
FROM active_exclusions
GROUP BY user_id;

-- Comments
COMMENT ON TABLE asset_exclusion_rules IS 'Master table for all types of asset exclusion rules';
COMMENT ON TABLE individual_asset_exclusions IS 'Individual asset exclusions with detailed scope control';
COMMENT ON TABLE criteria_exclusion_filters IS 'Criteria-based filters for automatic asset exclusion';
COMMENT ON TABLE exclusion_history IS 'Audit trail of all exclusion-related actions';
COMMENT ON TABLE bulk_exclusion_operations IS 'Bulk operations for adding/removing multiple exclusions';
COMMENT ON TABLE exclusion_settings IS 'User preferences for exclusion behavior';
COMMENT ON TABLE exclusion_templates IS 'Reusable exclusion rule templates';
COMMENT ON TABLE exclusion_impact_analysis IS 'Analysis of exclusion impact on portfolio performance'; 