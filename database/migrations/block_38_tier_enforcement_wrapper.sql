-- Block 38: Tier Enforcement Wrapper - Database Schema
-- Wrapper system for applying tier enforcement across the application

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Tier Enforcement Wrapper Configuration Table
CREATE TABLE IF NOT EXISTS tier_enforcement_wrapper_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Wrapper Configuration
    wrapper_name TEXT NOT NULL,
    wrapper_type TEXT NOT NULL CHECK (wrapper_type IN ('component', 'route', 'api', 'middleware', 'global')),
    target_identifier TEXT NOT NULL, -- Component name, route path, API endpoint, etc.
    
    -- Enforcement Settings
    enforcement_enabled BOOLEAN DEFAULT true,
    strict_mode BOOLEAN DEFAULT false,
    bypass_conditions JSONB DEFAULT '[]',
    
    -- Tier Requirements
    minimum_tier_level INTEGER DEFAULT 0,
    required_permissions JSONB DEFAULT '[]',
    feature_flags JSONB DEFAULT '[]',
    
    -- Wrapper Behavior
    on_violation_action TEXT DEFAULT 'block' CHECK (on_violation_action IN ('block', 'redirect', 'degrade', 'warn', 'log')),
    fallback_component TEXT,
    redirect_url TEXT,
    custom_message TEXT,
    
    -- Usage Tracking
    usage_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ,
    
    -- Metadata
    created_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(wrapper_name, target_identifier)
);

-- Tier Enforcement Wrapper Instances Table
CREATE TABLE IF NOT EXISTS tier_enforcement_wrapper_instances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wrapper_config_id UUID NOT NULL REFERENCES tier_enforcement_wrapper_config(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Instance Details
    instance_id TEXT NOT NULL, -- Unique identifier for this wrapper instance
    session_id TEXT,
    
    -- Access Context
    access_timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_tier_level INTEGER NOT NULL,
    user_permissions JSONB DEFAULT '[]',
    
    -- Access Decision
    access_granted BOOLEAN NOT NULL,
    violation_reason TEXT,
    action_taken TEXT,
    
    -- Request Context
    request_path TEXT,
    request_method TEXT,
    request_headers JSONB DEFAULT '{}',
    request_ip INET,
    user_agent TEXT,
    
    -- Performance Metrics
    check_duration_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tier Enforcement Wrapper Rules Table
CREATE TABLE IF NOT EXISTS tier_enforcement_wrapper_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Rule Identification
    rule_name TEXT NOT NULL,
    rule_description TEXT,
    rule_priority INTEGER DEFAULT 0,
    
    -- Rule Conditions
    condition_type TEXT NOT NULL CHECK (condition_type IN ('tier_level', 'permission', 'feature_flag', 'usage_limit', 'time_based', 'custom')),
    condition_config JSONB NOT NULL,
    
    -- Rule Actions
    action_type TEXT NOT NULL CHECK (action_type IN ('allow', 'deny', 'redirect', 'degrade', 'warn')),
    action_config JSONB DEFAULT '{}',
    
    -- Rule Scope
    applies_to_wrappers TEXT[] DEFAULT ARRAY[]::TEXT[],
    applies_to_users TEXT[] DEFAULT ARRAY[]::TEXT[],
    applies_to_tiers TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Rule Status
    is_active BOOLEAN DEFAULT true,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(rule_name)
);

-- Tier Enforcement Wrapper Cache Table
CREATE TABLE IF NOT EXISTS tier_enforcement_wrapper_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Cache Key
    cache_key TEXT NOT NULL UNIQUE,
    cache_type TEXT NOT NULL CHECK (cache_type IN ('user_tier', 'permissions', 'feature_flags', 'rules')),
    
    -- Cache Data
    cached_data JSONB NOT NULL,
    
    -- Cache Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_hit TIMESTAMPTZ
);

-- Tier Enforcement Wrapper Performance Table
CREATE TABLE IF NOT EXISTS tier_enforcement_wrapper_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Performance Tracking
    date DATE DEFAULT CURRENT_DATE,
    wrapper_config_id UUID REFERENCES tier_enforcement_wrapper_config(id) ON DELETE SET NULL,
    
    -- Metrics
    total_checks INTEGER DEFAULT 0,
    allowed_checks INTEGER DEFAULT 0,
    denied_checks INTEGER DEFAULT 0,
    
    -- Performance
    avg_check_duration_ms DECIMAL(8,2) DEFAULT 0,
    max_check_duration_ms INTEGER DEFAULT 0,
    min_check_duration_ms INTEGER DEFAULT 0,
    
    -- Cache Performance
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    cache_hit_ratio DECIMAL(5,2) DEFAULT 0,
    
    -- Error Tracking
    error_count INTEGER DEFAULT 0,
    timeout_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date, wrapper_config_id)
);

-- Tier Enforcement Wrapper Settings Table
CREATE TABLE IF NOT EXISTS tier_enforcement_wrapper_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Global Wrapper Settings
    global_enforcement_enabled BOOLEAN DEFAULT true,
    debug_mode BOOLEAN DEFAULT false,
    
    -- Performance Settings
    cache_enabled BOOLEAN DEFAULT true,
    cache_ttl_seconds INTEGER DEFAULT 300, -- 5 minutes
    max_check_duration_ms INTEGER DEFAULT 5000, -- 5 seconds
    
    -- Fallback Settings
    default_on_error TEXT DEFAULT 'allow' CHECK (default_on_error IN ('allow', 'deny')),
    default_on_timeout TEXT DEFAULT 'allow' CHECK (default_on_timeout IN ('allow', 'deny')),
    
    -- Notification Settings
    notify_on_violations BOOLEAN DEFAULT true,
    notify_on_errors BOOLEAN DEFAULT false,
    notification_throttle_minutes INTEGER DEFAULT 60,
    
    -- Audit Settings
    audit_all_checks BOOLEAN DEFAULT false,
    audit_violations_only BOOLEAN DEFAULT true,
    audit_retention_days INTEGER DEFAULT 90,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Tier Enforcement Wrapper Bypass Tokens Table
CREATE TABLE IF NOT EXISTS tier_enforcement_wrapper_bypass_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Token Details
    token_value TEXT NOT NULL UNIQUE,
    token_name TEXT NOT NULL,
    
    -- Bypass Configuration
    bypass_type TEXT NOT NULL CHECK (bypass_type IN ('global', 'wrapper_specific', 'user_specific', 'temporary')),
    bypass_scope JSONB DEFAULT '{}',
    
    -- Token Limits
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    
    -- Token Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    created_by TEXT NOT NULL,
    reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_tier_enforcement_wrapper_config_type ON tier_enforcement_wrapper_config(wrapper_type);
CREATE INDEX idx_tier_enforcement_wrapper_config_target ON tier_enforcement_wrapper_config(target_identifier);
CREATE INDEX idx_tier_enforcement_wrapper_config_user ON tier_enforcement_wrapper_config(user_id);

CREATE INDEX idx_tier_enforcement_wrapper_instances_config ON tier_enforcement_wrapper_instances(wrapper_config_id);
CREATE INDEX idx_tier_enforcement_wrapper_instances_user ON tier_enforcement_wrapper_instances(user_id);
CREATE INDEX idx_tier_enforcement_wrapper_instances_timestamp ON tier_enforcement_wrapper_instances(access_timestamp DESC);
CREATE INDEX idx_tier_enforcement_wrapper_instances_session ON tier_enforcement_wrapper_instances(session_id);

CREATE INDEX idx_tier_enforcement_wrapper_rules_type ON tier_enforcement_wrapper_rules(condition_type);
CREATE INDEX idx_tier_enforcement_wrapper_rules_active ON tier_enforcement_wrapper_rules(is_active, effective_from, effective_until);
CREATE INDEX idx_tier_enforcement_wrapper_rules_priority ON tier_enforcement_wrapper_rules(rule_priority DESC);

CREATE INDEX idx_tier_enforcement_wrapper_cache_key ON tier_enforcement_wrapper_cache(cache_key);
CREATE INDEX idx_tier_enforcement_wrapper_cache_expires ON tier_enforcement_wrapper_cache(expires_at);
CREATE INDEX idx_tier_enforcement_wrapper_cache_type ON tier_enforcement_wrapper_cache(cache_type);

CREATE INDEX idx_tier_enforcement_wrapper_performance_date ON tier_enforcement_wrapper_performance(date DESC);
CREATE INDEX idx_tier_enforcement_wrapper_performance_config ON tier_enforcement_wrapper_performance(wrapper_config_id);

CREATE INDEX idx_tier_enforcement_wrapper_settings_user ON tier_enforcement_wrapper_settings(user_id);

CREATE INDEX idx_tier_enforcement_wrapper_bypass_tokens_token ON tier_enforcement_wrapper_bypass_tokens(token_value);
CREATE INDEX idx_tier_enforcement_wrapper_bypass_tokens_active ON tier_enforcement_wrapper_bypass_tokens(is_active, expires_at);

-- Functions for tier enforcement wrapper logic
CREATE OR REPLACE FUNCTION check_tier_enforcement_wrapper(
    p_wrapper_name TEXT,
    p_target_identifier TEXT,
    p_user_id UUID,
    p_user_tier_level INTEGER,
    p_user_permissions JSONB DEFAULT '[]'
)
RETURNS TABLE (
    access_granted BOOLEAN,
    violation_reason TEXT,
    action_taken TEXT,
    fallback_component TEXT,
    redirect_url TEXT
) AS $$
DECLARE
    wrapper_config RECORD;
    rule_result RECORD;
    cache_key TEXT;
    cached_result RECORD;
    bypass_token RECORD;
BEGIN
    -- Check for bypass tokens first
    SELECT * INTO bypass_token
    FROM tier_enforcement_wrapper_bypass_tokens
    WHERE is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses)
    AND (
        bypass_type = 'global' OR
        (bypass_type = 'wrapper_specific' AND bypass_scope->>'wrapper_name' = p_wrapper_name) OR
        (bypass_type = 'user_specific' AND bypass_scope->>'user_id' = p_user_id::text)
    )
    LIMIT 1;
    
    IF FOUND THEN
        -- Update token usage
        UPDATE tier_enforcement_wrapper_bypass_tokens
        SET current_uses = current_uses + 1, last_used = NOW()
        WHERE id = bypass_token.id;
        
        RETURN QUERY SELECT true, null, 'bypass_token_used', null, null;
        RETURN;
    END IF;
    
    -- Check cache first
    cache_key := format('wrapper_check_%s_%s_%s_%s', p_wrapper_name, p_target_identifier, p_user_id, p_user_tier_level);
    
    SELECT cached_data INTO cached_result
    FROM tier_enforcement_wrapper_cache
    WHERE cache_key = cache_key
    AND expires_at > NOW();
    
    IF FOUND THEN
        -- Update cache hit count
        UPDATE tier_enforcement_wrapper_cache
        SET hit_count = hit_count + 1, last_hit = NOW()
        WHERE cache_key = cache_key;
        
        RETURN QUERY SELECT 
            (cached_result->>'access_granted')::BOOLEAN,
            cached_result->>'violation_reason',
            cached_result->>'action_taken',
            cached_result->>'fallback_component',
            cached_result->>'redirect_url';
        RETURN;
    END IF;
    
    -- Get wrapper configuration
    SELECT * INTO wrapper_config
    FROM tier_enforcement_wrapper_config
    WHERE wrapper_name = p_wrapper_name
    AND target_identifier = p_target_identifier
    AND enforcement_enabled = TRUE;
    
    IF NOT FOUND THEN
        -- No wrapper configuration, allow by default
        RETURN QUERY SELECT true, null, 'no_wrapper_config', null, null;
        RETURN;
    END IF;
    
    -- Check minimum tier level
    IF p_user_tier_level < wrapper_config.minimum_tier_level THEN
        RETURN QUERY SELECT 
            false,
            format('Requires tier level %s or higher', wrapper_config.minimum_tier_level),
            wrapper_config.on_violation_action,
            wrapper_config.fallback_component,
            wrapper_config.redirect_url;
        RETURN;
    END IF;
    
    -- Check required permissions
    IF jsonb_array_length(wrapper_config.required_permissions) > 0 THEN
        IF NOT (wrapper_config.required_permissions <@ p_user_permissions) THEN
            RETURN QUERY SELECT 
                false,
                'Missing required permissions',
                wrapper_config.on_violation_action,
                wrapper_config.fallback_component,
                wrapper_config.redirect_url;
            RETURN;
        END IF;
    END IF;
    
    -- Apply additional rules
    FOR rule_result IN
        SELECT r.*, 
               check_tier_enforcement_rule(r.id, p_user_id, p_user_tier_level, p_user_permissions) as rule_passed
        FROM tier_enforcement_wrapper_rules r
        WHERE r.is_active = TRUE
        AND (r.effective_until IS NULL OR r.effective_until > NOW())
        AND r.effective_from <= NOW()
        AND (array_length(r.applies_to_wrappers, 1) IS NULL OR p_wrapper_name = ANY(r.applies_to_wrappers))
        ORDER BY r.rule_priority DESC
    LOOP
        IF NOT rule_result.rule_passed THEN
            RETURN QUERY SELECT 
                false,
                format('Rule violation: %s', rule_result.rule_name),
                (rule_result.action_config->>'action_type')::TEXT,
                (rule_result.action_config->>'fallback_component')::TEXT,
                (rule_result.action_config->>'redirect_url')::TEXT;
            RETURN;
        END IF;
    END LOOP;
    
    -- All checks passed
    RETURN QUERY SELECT true, null, 'allowed', null, null;
    
    -- Cache the result
    INSERT INTO tier_enforcement_wrapper_cache (cache_key, cache_type, cached_data, expires_at)
    VALUES (
        cache_key,
        'wrapper_check',
        jsonb_build_object(
            'access_granted', true,
            'violation_reason', null,
            'action_taken', 'allowed',
            'fallback_component', null,
            'redirect_url', null
        ),
        NOW() + INTERVAL '5 minutes'
    )
    ON CONFLICT (cache_key) DO UPDATE SET
        cached_data = EXCLUDED.cached_data,
        expires_at = EXCLUDED.expires_at,
        hit_count = 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_tier_enforcement_rule(
    p_rule_id UUID,
    p_user_id UUID,
    p_user_tier_level INTEGER,
    p_user_permissions JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    rule_record RECORD;
    condition_result BOOLEAN := TRUE;
BEGIN
    SELECT * INTO rule_record
    FROM tier_enforcement_wrapper_rules
    WHERE id = p_rule_id;
    
    IF NOT FOUND THEN
        RETURN TRUE; -- Rule not found, allow by default
    END IF;
    
    -- Check rule conditions based on type
    CASE rule_record.condition_type
        WHEN 'tier_level' THEN
            condition_result := p_user_tier_level >= (rule_record.condition_config->>'min_level')::INTEGER;
        WHEN 'permission' THEN
            condition_result := (rule_record.condition_config->'required_permissions') <@ p_user_permissions;
        WHEN 'usage_limit' THEN
            -- Check usage limits (simplified - would need usage tracking integration)
            condition_result := TRUE;
        ELSE
            condition_result := TRUE;
    END CASE;
    
    -- Return result based on action type
    CASE rule_record.action_type
        WHEN 'allow' THEN
            RETURN condition_result;
        WHEN 'deny' THEN
            RETURN NOT condition_result;
        ELSE
            RETURN condition_result;
    END CASE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_tier_enforcement_wrapper_access(
    p_wrapper_config_id UUID,
    p_user_id UUID,
    p_instance_id TEXT,
    p_session_id TEXT,
    p_user_tier_level INTEGER,
    p_user_permissions JSONB,
    p_access_granted BOOLEAN,
    p_violation_reason TEXT,
    p_action_taken TEXT,
    p_request_path TEXT DEFAULT NULL,
    p_request_method TEXT DEFAULT NULL,
    p_request_ip INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_check_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    instance_id UUID;
BEGIN
    INSERT INTO tier_enforcement_wrapper_instances (
        wrapper_config_id,
        user_id,
        instance_id,
        session_id,
        user_tier_level,
        user_permissions,
        access_granted,
        violation_reason,
        action_taken,
        request_path,
        request_method,
        request_ip,
        user_agent,
        check_duration_ms
    )
    VALUES (
        p_wrapper_config_id,
        p_user_id,
        p_instance_id,
        p_session_id,
        p_user_tier_level,
        p_user_permissions,
        p_access_granted,
        p_violation_reason,
        p_action_taken,
        p_request_path,
        p_request_method,
        p_request_ip,
        p_user_agent,
        p_check_duration_ms
    )
    RETURNING id INTO instance_id;
    
    -- Update wrapper usage count
    UPDATE tier_enforcement_wrapper_config
    SET usage_count = usage_count + 1, last_accessed = NOW()
    WHERE id = p_wrapper_config_id;
    
    RETURN instance_id;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for expired cache entries
CREATE OR REPLACE FUNCTION cleanup_tier_enforcement_wrapper_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tier_enforcement_wrapper_cache
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
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

CREATE TRIGGER trigger_tier_enforcement_wrapper_config_updated_at
    BEFORE UPDATE ON tier_enforcement_wrapper_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tier_enforcement_wrapper_rules_updated_at
    BEFORE UPDATE ON tier_enforcement_wrapper_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tier_enforcement_wrapper_settings_updated_at
    BEFORE UPDATE ON tier_enforcement_wrapper_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE tier_enforcement_wrapper_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_enforcement_wrapper_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_enforcement_wrapper_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_enforcement_wrapper_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_enforcement_wrapper_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_enforcement_wrapper_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_enforcement_wrapper_bypass_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own wrapper configs" ON tier_enforcement_wrapper_config
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own wrapper instances" ON tier_enforcement_wrapper_instances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wrapper instances" ON tier_enforcement_wrapper_instances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own wrapper rules" ON tier_enforcement_wrapper_rules
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Cache is globally readable" ON tier_enforcement_wrapper_cache
    FOR SELECT USING (true);

CREATE POLICY "Cache is globally writable" ON tier_enforcement_wrapper_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Cache is globally updatable" ON tier_enforcement_wrapper_cache
    FOR UPDATE USING (true);

CREATE POLICY "Performance data is globally readable" ON tier_enforcement_wrapper_performance
    FOR SELECT USING (true);

CREATE POLICY "Performance data is globally writable" ON tier_enforcement_wrapper_performance
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their own wrapper settings" ON tier_enforcement_wrapper_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Bypass tokens are admin only" ON tier_enforcement_wrapper_bypass_tokens
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Views for common queries
CREATE VIEW active_wrapper_configs AS
SELECT 
    wc.*,
    COALESCE(wp.total_checks, 0) as total_checks_today,
    COALESCE(wp.allowed_checks, 0) as allowed_checks_today,
    COALESCE(wp.denied_checks, 0) as denied_checks_today,
    COALESCE(wp.avg_check_duration_ms, 0) as avg_duration_today
FROM tier_enforcement_wrapper_config wc
LEFT JOIN tier_enforcement_wrapper_performance wp ON wc.id = wp.wrapper_config_id 
    AND wp.date = CURRENT_DATE
WHERE wc.enforcement_enabled = TRUE;

CREATE VIEW wrapper_performance_summary AS
SELECT 
    wc.wrapper_name,
    wc.wrapper_type,
    wc.target_identifier,
    SUM(wp.total_checks) as total_checks,
    SUM(wp.allowed_checks) as total_allowed,
    SUM(wp.denied_checks) as total_denied,
    AVG(wp.avg_check_duration_ms) as avg_duration_ms,
    AVG(wp.cache_hit_ratio) as avg_cache_hit_ratio
FROM tier_enforcement_wrapper_config wc
LEFT JOIN tier_enforcement_wrapper_performance wp ON wc.id = wp.wrapper_config_id
WHERE wp.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY wc.id, wc.wrapper_name, wc.wrapper_type, wc.target_identifier
ORDER BY total_checks DESC;

-- Comments
COMMENT ON TABLE tier_enforcement_wrapper_config IS 'Configuration for tier enforcement wrappers';
COMMENT ON TABLE tier_enforcement_wrapper_instances IS 'Audit log of wrapper access attempts';
COMMENT ON TABLE tier_enforcement_wrapper_rules IS 'Custom rules for tier enforcement logic';
COMMENT ON TABLE tier_enforcement_wrapper_cache IS 'Cache for tier enforcement check results';
COMMENT ON TABLE tier_enforcement_wrapper_performance IS 'Performance metrics for wrapper operations';
COMMENT ON TABLE tier_enforcement_wrapper_settings IS 'User settings for wrapper behavior';
COMMENT ON TABLE tier_enforcement_wrapper_bypass_tokens IS 'Bypass tokens for emergency access'; 
-- Wrapper system for applying tier enforcement across the application

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Tier Enforcement Wrapper Configuration Table
CREATE TABLE IF NOT EXISTS tier_enforcement_wrapper_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Wrapper Configuration
    wrapper_name TEXT NOT NULL,
    wrapper_type TEXT NOT NULL CHECK (wrapper_type IN ('component', 'route', 'api', 'middleware', 'global')),
    target_identifier TEXT NOT NULL, -- Component name, route path, API endpoint, etc.
    
    -- Enforcement Settings
    enforcement_enabled BOOLEAN DEFAULT true,
    strict_mode BOOLEAN DEFAULT false,
    bypass_conditions JSONB DEFAULT '[]',
    
    -- Tier Requirements
    minimum_tier_level INTEGER DEFAULT 0,
    required_permissions JSONB DEFAULT '[]',
    feature_flags JSONB DEFAULT '[]',
    
    -- Wrapper Behavior
    on_violation_action TEXT DEFAULT 'block' CHECK (on_violation_action IN ('block', 'redirect', 'degrade', 'warn', 'log')),
    fallback_component TEXT,
    redirect_url TEXT,
    custom_message TEXT,
    
    -- Usage Tracking
    usage_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ,
    
    -- Metadata
    created_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(wrapper_name, target_identifier)
);

-- Tier Enforcement Wrapper Instances Table
CREATE TABLE IF NOT EXISTS tier_enforcement_wrapper_instances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wrapper_config_id UUID NOT NULL REFERENCES tier_enforcement_wrapper_config(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Instance Details
    instance_id TEXT NOT NULL, -- Unique identifier for this wrapper instance
    session_id TEXT,
    
    -- Access Context
    access_timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_tier_level INTEGER NOT NULL,
    user_permissions JSONB DEFAULT '[]',
    
    -- Access Decision
    access_granted BOOLEAN NOT NULL,
    violation_reason TEXT,
    action_taken TEXT,
    
    -- Request Context
    request_path TEXT,
    request_method TEXT,
    request_headers JSONB DEFAULT '{}',
    request_ip INET,
    user_agent TEXT,
    
    -- Performance Metrics
    check_duration_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tier Enforcement Wrapper Rules Table
CREATE TABLE IF NOT EXISTS tier_enforcement_wrapper_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Rule Identification
    rule_name TEXT NOT NULL,
    rule_description TEXT,
    rule_priority INTEGER DEFAULT 0,
    
    -- Rule Conditions
    condition_type TEXT NOT NULL CHECK (condition_type IN ('tier_level', 'permission', 'feature_flag', 'usage_limit', 'time_based', 'custom')),
    condition_config JSONB NOT NULL,
    
    -- Rule Actions
    action_type TEXT NOT NULL CHECK (action_type IN ('allow', 'deny', 'redirect', 'degrade', 'warn')),
    action_config JSONB DEFAULT '{}',
    
    -- Rule Scope
    applies_to_wrappers TEXT[] DEFAULT ARRAY[]::TEXT[],
    applies_to_users TEXT[] DEFAULT ARRAY[]::TEXT[],
    applies_to_tiers TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Rule Status
    is_active BOOLEAN DEFAULT true,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(rule_name)
);

-- Tier Enforcement Wrapper Cache Table
CREATE TABLE IF NOT EXISTS tier_enforcement_wrapper_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Cache Key
    cache_key TEXT NOT NULL UNIQUE,
    cache_type TEXT NOT NULL CHECK (cache_type IN ('user_tier', 'permissions', 'feature_flags', 'rules')),
    
    -- Cache Data
    cached_data JSONB NOT NULL,
    
    -- Cache Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_hit TIMESTAMPTZ
);

-- Tier Enforcement Wrapper Performance Table
CREATE TABLE IF NOT EXISTS tier_enforcement_wrapper_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Performance Tracking
    date DATE DEFAULT CURRENT_DATE,
    wrapper_config_id UUID REFERENCES tier_enforcement_wrapper_config(id) ON DELETE SET NULL,
    
    -- Metrics
    total_checks INTEGER DEFAULT 0,
    allowed_checks INTEGER DEFAULT 0,
    denied_checks INTEGER DEFAULT 0,
    
    -- Performance
    avg_check_duration_ms DECIMAL(8,2) DEFAULT 0,
    max_check_duration_ms INTEGER DEFAULT 0,
    min_check_duration_ms INTEGER DEFAULT 0,
    
    -- Cache Performance
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    cache_hit_ratio DECIMAL(5,2) DEFAULT 0,
    
    -- Error Tracking
    error_count INTEGER DEFAULT 0,
    timeout_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date, wrapper_config_id)
);

-- Tier Enforcement Wrapper Settings Table
CREATE TABLE IF NOT EXISTS tier_enforcement_wrapper_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Global Wrapper Settings
    global_enforcement_enabled BOOLEAN DEFAULT true,
    debug_mode BOOLEAN DEFAULT false,
    
    -- Performance Settings
    cache_enabled BOOLEAN DEFAULT true,
    cache_ttl_seconds INTEGER DEFAULT 300, -- 5 minutes
    max_check_duration_ms INTEGER DEFAULT 5000, -- 5 seconds
    
    -- Fallback Settings
    default_on_error TEXT DEFAULT 'allow' CHECK (default_on_error IN ('allow', 'deny')),
    default_on_timeout TEXT DEFAULT 'allow' CHECK (default_on_timeout IN ('allow', 'deny')),
    
    -- Notification Settings
    notify_on_violations BOOLEAN DEFAULT true,
    notify_on_errors BOOLEAN DEFAULT false,
    notification_throttle_minutes INTEGER DEFAULT 60,
    
    -- Audit Settings
    audit_all_checks BOOLEAN DEFAULT false,
    audit_violations_only BOOLEAN DEFAULT true,
    audit_retention_days INTEGER DEFAULT 90,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Tier Enforcement Wrapper Bypass Tokens Table
CREATE TABLE IF NOT EXISTS tier_enforcement_wrapper_bypass_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Token Details
    token_value TEXT NOT NULL UNIQUE,
    token_name TEXT NOT NULL,
    
    -- Bypass Configuration
    bypass_type TEXT NOT NULL CHECK (bypass_type IN ('global', 'wrapper_specific', 'user_specific', 'temporary')),
    bypass_scope JSONB DEFAULT '{}',
    
    -- Token Limits
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    
    -- Token Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    created_by TEXT NOT NULL,
    reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_tier_enforcement_wrapper_config_type ON tier_enforcement_wrapper_config(wrapper_type);
CREATE INDEX idx_tier_enforcement_wrapper_config_target ON tier_enforcement_wrapper_config(target_identifier);
CREATE INDEX idx_tier_enforcement_wrapper_config_user ON tier_enforcement_wrapper_config(user_id);

CREATE INDEX idx_tier_enforcement_wrapper_instances_config ON tier_enforcement_wrapper_instances(wrapper_config_id);
CREATE INDEX idx_tier_enforcement_wrapper_instances_user ON tier_enforcement_wrapper_instances(user_id);
CREATE INDEX idx_tier_enforcement_wrapper_instances_timestamp ON tier_enforcement_wrapper_instances(access_timestamp DESC);
CREATE INDEX idx_tier_enforcement_wrapper_instances_session ON tier_enforcement_wrapper_instances(session_id);

CREATE INDEX idx_tier_enforcement_wrapper_rules_type ON tier_enforcement_wrapper_rules(condition_type);
CREATE INDEX idx_tier_enforcement_wrapper_rules_active ON tier_enforcement_wrapper_rules(is_active, effective_from, effective_until);
CREATE INDEX idx_tier_enforcement_wrapper_rules_priority ON tier_enforcement_wrapper_rules(rule_priority DESC);

CREATE INDEX idx_tier_enforcement_wrapper_cache_key ON tier_enforcement_wrapper_cache(cache_key);
CREATE INDEX idx_tier_enforcement_wrapper_cache_expires ON tier_enforcement_wrapper_cache(expires_at);
CREATE INDEX idx_tier_enforcement_wrapper_cache_type ON tier_enforcement_wrapper_cache(cache_type);

CREATE INDEX idx_tier_enforcement_wrapper_performance_date ON tier_enforcement_wrapper_performance(date DESC);
CREATE INDEX idx_tier_enforcement_wrapper_performance_config ON tier_enforcement_wrapper_performance(wrapper_config_id);

CREATE INDEX idx_tier_enforcement_wrapper_settings_user ON tier_enforcement_wrapper_settings(user_id);

CREATE INDEX idx_tier_enforcement_wrapper_bypass_tokens_token ON tier_enforcement_wrapper_bypass_tokens(token_value);
CREATE INDEX idx_tier_enforcement_wrapper_bypass_tokens_active ON tier_enforcement_wrapper_bypass_tokens(is_active, expires_at);

-- Functions for tier enforcement wrapper logic
CREATE OR REPLACE FUNCTION check_tier_enforcement_wrapper(
    p_wrapper_name TEXT,
    p_target_identifier TEXT,
    p_user_id UUID,
    p_user_tier_level INTEGER,
    p_user_permissions JSONB DEFAULT '[]'
)
RETURNS TABLE (
    access_granted BOOLEAN,
    violation_reason TEXT,
    action_taken TEXT,
    fallback_component TEXT,
    redirect_url TEXT
) AS $$
DECLARE
    wrapper_config RECORD;
    rule_result RECORD;
    cache_key TEXT;
    cached_result RECORD;
    bypass_token RECORD;
BEGIN
    -- Check for bypass tokens first
    SELECT * INTO bypass_token
    FROM tier_enforcement_wrapper_bypass_tokens
    WHERE is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses)
    AND (
        bypass_type = 'global' OR
        (bypass_type = 'wrapper_specific' AND bypass_scope->>'wrapper_name' = p_wrapper_name) OR
        (bypass_type = 'user_specific' AND bypass_scope->>'user_id' = p_user_id::text)
    )
    LIMIT 1;
    
    IF FOUND THEN
        -- Update token usage
        UPDATE tier_enforcement_wrapper_bypass_tokens
        SET current_uses = current_uses + 1, last_used = NOW()
        WHERE id = bypass_token.id;
        
        RETURN QUERY SELECT true, null, 'bypass_token_used', null, null;
        RETURN;
    END IF;
    
    -- Check cache first
    cache_key := format('wrapper_check_%s_%s_%s_%s', p_wrapper_name, p_target_identifier, p_user_id, p_user_tier_level);
    
    SELECT cached_data INTO cached_result
    FROM tier_enforcement_wrapper_cache
    WHERE cache_key = cache_key
    AND expires_at > NOW();
    
    IF FOUND THEN
        -- Update cache hit count
        UPDATE tier_enforcement_wrapper_cache
        SET hit_count = hit_count + 1, last_hit = NOW()
        WHERE cache_key = cache_key;
        
        RETURN QUERY SELECT 
            (cached_result->>'access_granted')::BOOLEAN,
            cached_result->>'violation_reason',
            cached_result->>'action_taken',
            cached_result->>'fallback_component',
            cached_result->>'redirect_url';
        RETURN;
    END IF;
    
    -- Get wrapper configuration
    SELECT * INTO wrapper_config
    FROM tier_enforcement_wrapper_config
    WHERE wrapper_name = p_wrapper_name
    AND target_identifier = p_target_identifier
    AND enforcement_enabled = TRUE;
    
    IF NOT FOUND THEN
        -- No wrapper configuration, allow by default
        RETURN QUERY SELECT true, null, 'no_wrapper_config', null, null;
        RETURN;
    END IF;
    
    -- Check minimum tier level
    IF p_user_tier_level < wrapper_config.minimum_tier_level THEN
        RETURN QUERY SELECT 
            false,
            format('Requires tier level %s or higher', wrapper_config.minimum_tier_level),
            wrapper_config.on_violation_action,
            wrapper_config.fallback_component,
            wrapper_config.redirect_url;
        RETURN;
    END IF;
    
    -- Check required permissions
    IF jsonb_array_length(wrapper_config.required_permissions) > 0 THEN
        IF NOT (wrapper_config.required_permissions <@ p_user_permissions) THEN
            RETURN QUERY SELECT 
                false,
                'Missing required permissions',
                wrapper_config.on_violation_action,
                wrapper_config.fallback_component,
                wrapper_config.redirect_url;
            RETURN;
        END IF;
    END IF;
    
    -- Apply additional rules
    FOR rule_result IN
        SELECT r.*, 
               check_tier_enforcement_rule(r.id, p_user_id, p_user_tier_level, p_user_permissions) as rule_passed
        FROM tier_enforcement_wrapper_rules r
        WHERE r.is_active = TRUE
        AND (r.effective_until IS NULL OR r.effective_until > NOW())
        AND r.effective_from <= NOW()
        AND (array_length(r.applies_to_wrappers, 1) IS NULL OR p_wrapper_name = ANY(r.applies_to_wrappers))
        ORDER BY r.rule_priority DESC
    LOOP
        IF NOT rule_result.rule_passed THEN
            RETURN QUERY SELECT 
                false,
                format('Rule violation: %s', rule_result.rule_name),
                (rule_result.action_config->>'action_type')::TEXT,
                (rule_result.action_config->>'fallback_component')::TEXT,
                (rule_result.action_config->>'redirect_url')::TEXT;
            RETURN;
        END IF;
    END LOOP;
    
    -- All checks passed
    RETURN QUERY SELECT true, null, 'allowed', null, null;
    
    -- Cache the result
    INSERT INTO tier_enforcement_wrapper_cache (cache_key, cache_type, cached_data, expires_at)
    VALUES (
        cache_key,
        'wrapper_check',
        jsonb_build_object(
            'access_granted', true,
            'violation_reason', null,
            'action_taken', 'allowed',
            'fallback_component', null,
            'redirect_url', null
        ),
        NOW() + INTERVAL '5 minutes'
    )
    ON CONFLICT (cache_key) DO UPDATE SET
        cached_data = EXCLUDED.cached_data,
        expires_at = EXCLUDED.expires_at,
        hit_count = 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_tier_enforcement_rule(
    p_rule_id UUID,
    p_user_id UUID,
    p_user_tier_level INTEGER,
    p_user_permissions JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    rule_record RECORD;
    condition_result BOOLEAN := TRUE;
BEGIN
    SELECT * INTO rule_record
    FROM tier_enforcement_wrapper_rules
    WHERE id = p_rule_id;
    
    IF NOT FOUND THEN
        RETURN TRUE; -- Rule not found, allow by default
    END IF;
    
    -- Check rule conditions based on type
    CASE rule_record.condition_type
        WHEN 'tier_level' THEN
            condition_result := p_user_tier_level >= (rule_record.condition_config->>'min_level')::INTEGER;
        WHEN 'permission' THEN
            condition_result := (rule_record.condition_config->'required_permissions') <@ p_user_permissions;
        WHEN 'usage_limit' THEN
            -- Check usage limits (simplified - would need usage tracking integration)
            condition_result := TRUE;
        ELSE
            condition_result := TRUE;
    END CASE;
    
    -- Return result based on action type
    CASE rule_record.action_type
        WHEN 'allow' THEN
            RETURN condition_result;
        WHEN 'deny' THEN
            RETURN NOT condition_result;
        ELSE
            RETURN condition_result;
    END CASE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_tier_enforcement_wrapper_access(
    p_wrapper_config_id UUID,
    p_user_id UUID,
    p_instance_id TEXT,
    p_session_id TEXT,
    p_user_tier_level INTEGER,
    p_user_permissions JSONB,
    p_access_granted BOOLEAN,
    p_violation_reason TEXT,
    p_action_taken TEXT,
    p_request_path TEXT DEFAULT NULL,
    p_request_method TEXT DEFAULT NULL,
    p_request_ip INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_check_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    instance_id UUID;
BEGIN
    INSERT INTO tier_enforcement_wrapper_instances (
        wrapper_config_id,
        user_id,
        instance_id,
        session_id,
        user_tier_level,
        user_permissions,
        access_granted,
        violation_reason,
        action_taken,
        request_path,
        request_method,
        request_ip,
        user_agent,
        check_duration_ms
    )
    VALUES (
        p_wrapper_config_id,
        p_user_id,
        p_instance_id,
        p_session_id,
        p_user_tier_level,
        p_user_permissions,
        p_access_granted,
        p_violation_reason,
        p_action_taken,
        p_request_path,
        p_request_method,
        p_request_ip,
        p_user_agent,
        p_check_duration_ms
    )
    RETURNING id INTO instance_id;
    
    -- Update wrapper usage count
    UPDATE tier_enforcement_wrapper_config
    SET usage_count = usage_count + 1, last_accessed = NOW()
    WHERE id = p_wrapper_config_id;
    
    RETURN instance_id;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for expired cache entries
CREATE OR REPLACE FUNCTION cleanup_tier_enforcement_wrapper_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tier_enforcement_wrapper_cache
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
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

CREATE TRIGGER trigger_tier_enforcement_wrapper_config_updated_at
    BEFORE UPDATE ON tier_enforcement_wrapper_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tier_enforcement_wrapper_rules_updated_at
    BEFORE UPDATE ON tier_enforcement_wrapper_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tier_enforcement_wrapper_settings_updated_at
    BEFORE UPDATE ON tier_enforcement_wrapper_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE tier_enforcement_wrapper_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_enforcement_wrapper_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_enforcement_wrapper_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_enforcement_wrapper_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_enforcement_wrapper_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_enforcement_wrapper_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_enforcement_wrapper_bypass_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own wrapper configs" ON tier_enforcement_wrapper_config
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own wrapper instances" ON tier_enforcement_wrapper_instances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wrapper instances" ON tier_enforcement_wrapper_instances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own wrapper rules" ON tier_enforcement_wrapper_rules
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Cache is globally readable" ON tier_enforcement_wrapper_cache
    FOR SELECT USING (true);

CREATE POLICY "Cache is globally writable" ON tier_enforcement_wrapper_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Cache is globally updatable" ON tier_enforcement_wrapper_cache
    FOR UPDATE USING (true);

CREATE POLICY "Performance data is globally readable" ON tier_enforcement_wrapper_performance
    FOR SELECT USING (true);

CREATE POLICY "Performance data is globally writable" ON tier_enforcement_wrapper_performance
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their own wrapper settings" ON tier_enforcement_wrapper_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Bypass tokens are admin only" ON tier_enforcement_wrapper_bypass_tokens
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Views for common queries
CREATE VIEW active_wrapper_configs AS
SELECT 
    wc.*,
    COALESCE(wp.total_checks, 0) as total_checks_today,
    COALESCE(wp.allowed_checks, 0) as allowed_checks_today,
    COALESCE(wp.denied_checks, 0) as denied_checks_today,
    COALESCE(wp.avg_check_duration_ms, 0) as avg_duration_today
FROM tier_enforcement_wrapper_config wc
LEFT JOIN tier_enforcement_wrapper_performance wp ON wc.id = wp.wrapper_config_id 
    AND wp.date = CURRENT_DATE
WHERE wc.enforcement_enabled = TRUE;

CREATE VIEW wrapper_performance_summary AS
SELECT 
    wc.wrapper_name,
    wc.wrapper_type,
    wc.target_identifier,
    SUM(wp.total_checks) as total_checks,
    SUM(wp.allowed_checks) as total_allowed,
    SUM(wp.denied_checks) as total_denied,
    AVG(wp.avg_check_duration_ms) as avg_duration_ms,
    AVG(wp.cache_hit_ratio) as avg_cache_hit_ratio
FROM tier_enforcement_wrapper_config wc
LEFT JOIN tier_enforcement_wrapper_performance wp ON wc.id = wp.wrapper_config_id
WHERE wp.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY wc.id, wc.wrapper_name, wc.wrapper_type, wc.target_identifier
ORDER BY total_checks DESC;

-- Comments
COMMENT ON TABLE tier_enforcement_wrapper_config IS 'Configuration for tier enforcement wrappers';
COMMENT ON TABLE tier_enforcement_wrapper_instances IS 'Audit log of wrapper access attempts';
COMMENT ON TABLE tier_enforcement_wrapper_rules IS 'Custom rules for tier enforcement logic';
COMMENT ON TABLE tier_enforcement_wrapper_cache IS 'Cache for tier enforcement check results';
COMMENT ON TABLE tier_enforcement_wrapper_performance IS 'Performance metrics for wrapper operations';
COMMENT ON TABLE tier_enforcement_wrapper_settings IS 'User settings for wrapper behavior';
COMMENT ON TABLE tier_enforcement_wrapper_bypass_tokens IS 'Bypass tokens for emergency access'; 