-- Block 50: User Tier Enforcement - Database Schema

-- User Tiers Configuration
CREATE TABLE user_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL CHECK (level >= 0 AND level <= 10),
    is_active BOOLEAN DEFAULT true,
    
    -- Pricing
    monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    yearly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    trial_days INTEGER DEFAULT 0,
    setup_fee DECIMAL(10,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Features (JSONB for flexible feature flags)
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}',
    permissions JSONB NOT NULL DEFAULT '{}',
    restrictions JSONB NOT NULL DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Tier Assignments
CREATE TABLE user_tier_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES user_tiers(id) ON DELETE RESTRICT,
    
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'pending_upgrade', 'pending_downgrade')),
    billing_status VARCHAR(20) DEFAULT 'current' CHECK (billing_status IN ('current', 'overdue', 'suspended', 'cancelled')),
    
    -- Usage tracking
    usage_stats JSONB DEFAULT '{}',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, tier_id)
);

-- Usage Statistics
CREATE TABLE tier_usage_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES user_tier_assignments(id) ON DELETE CASCADE,
    
    -- Usage counters
    portfolios_used INTEGER DEFAULT 0,
    positions_used INTEGER DEFAULT 0,
    trades_executed INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    data_requests_made INTEGER DEFAULT 0,
    storage_used_gb DECIMAL(10,3) DEFAULT 0,
    reports_generated INTEGER DEFAULT 0,
    exports_performed INTEGER DEFAULT 0,
    
    -- Performance metrics
    average_daily_trades DECIMAL(8,2) DEFAULT 0,
    average_position_size DECIMAL(15,2) DEFAULT 0,
    total_volume_traded DECIMAL(20,2) DEFAULT 0,
    peak_concurrent_users INTEGER DEFAULT 1,
    
    -- Feature usage
    features_used JSONB DEFAULT '[]',
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_trade_at TIMESTAMP WITH TIME ZONE,
    last_api_call_at TIMESTAMP WITH TIME ZONE,
    
    -- Limits status
    limits_reached JSONB DEFAULT '[]',
    warning_thresholds JSONB DEFAULT '[]',
    utilization_percentages JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tier Violations
CREATE TABLE tier_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_assignment_id UUID NOT NULL REFERENCES user_tier_assignments(id) ON DELETE CASCADE,
    
    violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN ('limit_exceeded', 'unauthorized_access', 'terms_violation', 'payment_failure')),
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'acknowledged', 'disputed')),
    
    action_taken VARCHAR(50) CHECK (action_taken IN ('warning', 'restriction', 'suspension', 'downgrade', 'termination')),
    action_details JSONB DEFAULT '{}',
    
    resolution_details JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tier Change History
CREATE TABLE tier_change_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_tier_id UUID REFERENCES user_tiers(id) ON DELETE SET NULL,
    to_tier_id UUID NOT NULL REFERENCES user_tiers(id) ON DELETE RESTRICT,
    
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'migration', 'suspension', 'restoration')),
    reason TEXT,
    initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
    
    payment_details JSONB DEFAULT '{}',
    migration_details JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking for rate limiting and quotas
CREATE TABLE tier_usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_assignment_id UUID NOT NULL REFERENCES user_tier_assignments(id) ON DELETE CASCADE,
    
    resource_type VARCHAR(50) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    quota_limit INTEGER,
    
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, resource_type, period_start)
);

-- Enforcement Configuration
CREATE TABLE tier_enforcement_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    enabled BOOLEAN DEFAULT true,
    strict_mode BOOLEAN DEFAULT false,
    grace_period_days INTEGER DEFAULT 7,
    warning_thresholds JSONB DEFAULT '{}',
    auto_downgrade_enabled BOOLEAN DEFAULT false,
    
    enforcement_actions JSONB DEFAULT '[]',
    suspension_thresholds JSONB DEFAULT '[]',
    notification_settings JSONB DEFAULT '{}',
    
    auditing_enabled BOOLEAN DEFAULT true,
    reporting_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enforcement audit log
CREATE TABLE tier_enforcement_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    result VARCHAR(20) CHECK (result IN ('allowed', 'denied', 'warning')),
    reason TEXT,
    
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_tier_assignments_user_id ON user_tier_assignments(user_id);
CREATE INDEX idx_user_tier_assignments_tier_id ON user_tier_assignments(tier_id);
CREATE INDEX idx_user_tier_assignments_status ON user_tier_assignments(status);
CREATE INDEX idx_tier_usage_stats_user_id ON tier_usage_stats(user_id);
CREATE INDEX idx_tier_violations_user_id ON tier_violations(user_id);
CREATE INDEX idx_tier_violations_status ON tier_violations(status);
CREATE INDEX idx_tier_change_history_user_id ON tier_change_history(user_id);
CREATE INDEX idx_tier_usage_tracking_user_id ON tier_usage_tracking(user_id);
CREATE INDEX idx_tier_usage_tracking_period ON tier_usage_tracking(period_start, period_end);
CREATE INDEX idx_tier_enforcement_audit_user_id ON tier_enforcement_audit(user_id);
CREATE INDEX idx_tier_enforcement_audit_created_at ON tier_enforcement_audit(created_at);

-- RLS Policies
ALTER TABLE user_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tier_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_enforcement_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_enforcement_audit ENABLE ROW LEVEL SECURITY;

-- Admin can see everything
CREATE POLICY "Admins can manage all tiers" ON user_tiers FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage all assignments" ON user_tier_assignments FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view all usage stats" ON tier_usage_stats FOR SELECT TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view all violations" ON tier_violations FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view all history" ON tier_change_history FOR SELECT TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage config" ON tier_enforcement_config FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can view audit log" ON tier_enforcement_audit FOR SELECT TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Users can see their own data
CREATE POLICY "Users can view their assignments" ON user_tier_assignments FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "Users can view their usage" ON tier_usage_stats FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "Users can view their violations" ON tier_violations FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "Users can view their history" ON tier_change_history FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "Users can view their usage tracking" ON tier_usage_tracking FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

-- Everyone can view active tiers
CREATE POLICY "Anyone can view active tiers" ON user_tiers FOR SELECT TO authenticated USING (is_active = true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_tiers_updated_at BEFORE UPDATE ON user_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_tier_assignments_updated_at BEFORE UPDATE ON user_tier_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tier_usage_stats_updated_at BEFORE UPDATE ON tier_usage_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tier_violations_updated_at BEFORE UPDATE ON tier_violations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tier_change_history_updated_at BEFORE UPDATE ON tier_change_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tier_usage_tracking_updated_at BEFORE UPDATE ON tier_usage_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tier_enforcement_config_updated_at BEFORE UPDATE ON tier_enforcement_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 