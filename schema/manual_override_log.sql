-- Block 72: Manual Override Log Schema

-- Override types and categories
CREATE TABLE override_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Type definition
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('trading', 'risk', 'portfolio', 'system', 'compliance', 'custom')),
    
    -- Type properties
    is_system_type BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Risk classification
    risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    requires_approval BOOLEAN DEFAULT false,
    
    -- Documentation
    documentation TEXT,
    examples JSONB DEFAULT '[]',
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(type_name, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'))
);

-- Manual override log entries
CREATE TABLE manual_override_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    override_type_id UUID NOT NULL REFERENCES override_types(id) ON DELETE RESTRICT,
    
    -- Override identification
    override_title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- Context and target
    target_system VARCHAR(100) NOT NULL,
    target_component VARCHAR(100),
    target_asset VARCHAR(20),
    
    -- Override details
    original_value JSONB,
    override_value JSONB NOT NULL,
    override_reason TEXT NOT NULL,
    
    -- Impact assessment
    impact_level VARCHAR(20) DEFAULT 'low' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
    affected_systems JSONB DEFAULT '[]',
    estimated_impact TEXT,
    
    -- Authorization
    initiated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    authorized_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    requires_approval BOOLEAN DEFAULT false,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'expired', 'reverted')),
    
    -- Timing
    scheduled_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    reverted_at TIMESTAMP WITH TIME ZONE,
    
    -- Execution details
    execution_method VARCHAR(50) DEFAULT 'manual' CHECK (execution_method IN ('manual', 'automated', 'scheduled', 'api')),
    execution_context JSONB DEFAULT '{}',
    
    -- Monitoring
    monitoring_enabled BOOLEAN DEFAULT true,
    alert_threshold JSONB DEFAULT '{}',
    
    -- Compliance
    compliance_notes TEXT,
    regulatory_impact TEXT,
    
    -- Additional metadata
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Override approval workflow
CREATE TABLE override_approval_workflow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    override_log_id UUID NOT NULL REFERENCES manual_override_log(id) ON DELETE CASCADE,
    
    -- Approval step
    step_order INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    
    -- Approver information
    approver_role VARCHAR(50) NOT NULL,
    assigned_approver UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Approval status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
    
    -- Decision details
    decision_at TIMESTAMP WITH TIME ZONE,
    decision_reason TEXT,
    conditions JSONB DEFAULT '{}',
    
    -- Timing
    due_date TIMESTAMP WITH TIME ZONE,
    escalation_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Override impact tracking
CREATE TABLE override_impact_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    override_log_id UUID NOT NULL REFERENCES manual_override_log(id) ON DELETE CASCADE,
    
    -- Impact measurement
    measurement_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    impact_type VARCHAR(50) NOT NULL CHECK (impact_type IN ('financial', 'operational', 'risk', 'compliance', 'performance')),
    
    -- Impact data
    before_value JSONB,
    after_value JSONB,
    difference JSONB,
    
    -- Metrics
    impact_score DECIMAL(8,4),
    confidence_level DECIMAL(5,2) CHECK (confidence_level >= 0 AND confidence_level <= 100),
    
    -- Context
    measurement_context JSONB DEFAULT '{}',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Override rollback plans
CREATE TABLE override_rollback_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    override_log_id UUID NOT NULL REFERENCES manual_override_log(id) ON DELETE CASCADE,
    
    -- Rollback plan details
    plan_name VARCHAR(100) NOT NULL,
    plan_description TEXT NOT NULL,
    
    -- Rollback steps
    rollback_steps JSONB NOT NULL DEFAULT '[]',
    
    -- Conditions
    trigger_conditions JSONB DEFAULT '{}',
    automatic_rollback BOOLEAN DEFAULT false,
    
    -- Timing
    rollback_window INTEGER, -- in minutes
    grace_period INTEGER DEFAULT 0, -- in minutes
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Execution tracking
    executed_at TIMESTAMP WITH TIME ZONE,
    execution_status VARCHAR(20) CHECK (execution_status IN ('pending', 'in_progress', 'completed', 'failed')),
    execution_details JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Override performance metrics
CREATE TABLE override_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    override_type_id UUID REFERENCES override_types(id) ON DELETE CASCADE,
    
    -- Analysis period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Override statistics
    total_overrides INTEGER DEFAULT 0,
    successful_overrides INTEGER DEFAULT 0,
    failed_overrides INTEGER DEFAULT 0,
    reverted_overrides INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_impact_score DECIMAL(8,4) DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    avg_duration INTEGER DEFAULT 0, -- in minutes
    
    -- Risk metrics
    high_risk_overrides INTEGER DEFAULT 0,
    compliance_violations INTEGER DEFAULT 0,
    
    -- Financial impact
    total_financial_impact DECIMAL(15,2) DEFAULT 0,
    positive_impact DECIMAL(15,2) DEFAULT 0,
    negative_impact DECIMAL(15,2) DEFAULT 0,
    
    -- Additional metrics
    metrics JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, override_type_id, period_start, period_end)
);

-- Override compliance audit
CREATE TABLE override_compliance_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    override_log_id UUID NOT NULL REFERENCES manual_override_log(id) ON DELETE CASCADE,
    
    -- Audit details
    audit_type VARCHAR(50) NOT NULL CHECK (audit_type IN ('pre_override', 'post_override', 'periodic', 'incident')),
    audit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auditor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Compliance status
    compliance_status VARCHAR(20) NOT NULL CHECK (compliance_status IN ('compliant', 'non_compliant', 'under_review', 'requires_action')),
    
    -- Findings
    findings TEXT,
    violations JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    
    -- Risk assessment
    risk_rating VARCHAR(20) DEFAULT 'medium' CHECK (risk_rating IN ('low', 'medium', 'high', 'critical')),
    risk_factors JSONB DEFAULT '[]',
    
    -- Actions required
    required_actions JSONB DEFAULT '[]',
    action_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    
    -- Documentation
    evidence_documents JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Override notifications
CREATE TABLE override_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    override_log_id UUID NOT NULL REFERENCES manual_override_log(id) ON DELETE CASCADE,
    
    -- Notification details
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('override_created', 'approval_required', 'override_activated', 'override_expired', 'rollback_triggered', 'compliance_alert')),
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Message content
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Priority and urgency
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    urgency_level INTEGER DEFAULT 3 CHECK (urgency_level >= 1 AND urgency_level <= 5),
    
    -- Delivery settings
    delivery_channels JSONB DEFAULT '["email", "in_app"]',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'dismissed')),
    
    -- Timing
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    
    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Context
    notification_context JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Override audit trail
CREATE TABLE override_audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    override_log_id UUID NOT NULL REFERENCES manual_override_log(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Action details
    action VARCHAR(100) NOT NULL CHECK (action IN ('created', 'updated', 'approved', 'rejected', 'activated', 'deactivated', 'reverted', 'expired')),
    action_description TEXT,
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    action_context JSONB DEFAULT '{}',
    
    -- Session information
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_override_types_user_id ON override_types(user_id);
CREATE INDEX idx_override_types_category ON override_types(category);
CREATE INDEX idx_manual_override_log_user_id ON manual_override_log(user_id);
CREATE INDEX idx_manual_override_log_override_type_id ON manual_override_log(override_type_id);
CREATE INDEX idx_manual_override_log_status ON manual_override_log(status);
CREATE INDEX idx_manual_override_log_target_system ON manual_override_log(target_system);
CREATE INDEX idx_manual_override_log_created_at ON manual_override_log(created_at);
CREATE INDEX idx_override_approval_workflow_override_log_id ON override_approval_workflow(override_log_id);
CREATE INDEX idx_override_approval_workflow_assigned_approver ON override_approval_workflow(assigned_approver);
CREATE INDEX idx_override_approval_workflow_status ON override_approval_workflow(status);
CREATE INDEX idx_override_impact_tracking_override_log_id ON override_impact_tracking(override_log_id);
CREATE INDEX idx_override_impact_tracking_measurement_time ON override_impact_tracking(measurement_time);
CREATE INDEX idx_override_rollback_plans_override_log_id ON override_rollback_plans(override_log_id);
CREATE INDEX idx_override_performance_metrics_user_id ON override_performance_metrics(user_id);
CREATE INDEX idx_override_performance_metrics_period ON override_performance_metrics(period_start, period_end);
CREATE INDEX idx_override_compliance_audit_override_log_id ON override_compliance_audit(override_log_id);
CREATE INDEX idx_override_compliance_audit_compliance_status ON override_compliance_audit(compliance_status);
CREATE INDEX idx_override_notifications_override_log_id ON override_notifications(override_log_id);
CREATE INDEX idx_override_notifications_recipient_id ON override_notifications(recipient_id);
CREATE INDEX idx_override_notifications_status ON override_notifications(status);
CREATE INDEX idx_override_audit_trail_override_log_id ON override_audit_trail(override_log_id);
CREATE INDEX idx_override_audit_trail_user_id ON override_audit_trail(user_id);
CREATE INDEX idx_override_audit_trail_created_at ON override_audit_trail(created_at);

-- RLS Policies
ALTER TABLE override_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_override_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE override_approval_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE override_impact_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE override_rollback_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE override_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE override_compliance_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE override_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE override_audit_trail ENABLE ROW LEVEL SECURITY;

-- Users can manage their own data
CREATE POLICY "Users can manage own override types" ON override_types
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage own override logs" ON manual_override_log
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own performance metrics" ON override_performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON override_notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can view own audit trail" ON override_audit_trail
    FOR SELECT USING (auth.uid() = user_id);

-- Override-based access for related tables
CREATE POLICY "Users can manage approval workflows for their overrides" ON override_approval_workflow
    FOR ALL USING (
        override_log_id IN (
            SELECT id FROM manual_override_log WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view impact tracking for their overrides" ON override_impact_tracking
    FOR SELECT USING (
        override_log_id IN (
            SELECT id FROM manual_override_log WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage rollback plans for their overrides" ON override_rollback_plans
    FOR ALL USING (
        override_log_id IN (
            SELECT id FROM manual_override_log WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view compliance audits for their overrides" ON override_compliance_audit
    FOR SELECT USING (
        override_log_id IN (
            SELECT id FROM manual_override_log WHERE user_id = auth.uid()
        )
    );

-- System override types are viewable by all
CREATE POLICY "System override types are public" ON override_types
    FOR SELECT USING (is_system_type = true);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_override_types_updated_at BEFORE UPDATE ON override_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manual_override_log_updated_at BEFORE UPDATE ON manual_override_log FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_override_approval_workflow_updated_at BEFORE UPDATE ON override_approval_workflow FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_override_rollback_plans_updated_at BEFORE UPDATE ON override_rollback_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_override_compliance_audit_updated_at BEFORE UPDATE ON override_compliance_audit FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_override_notifications_updated_at BEFORE UPDATE ON override_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update override type usage count
CREATE OR REPLACE FUNCTION update_override_type_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE override_types 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.override_type_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for usage tracking
CREATE TRIGGER update_override_type_usage_trigger
    AFTER INSERT ON manual_override_log
    FOR EACH ROW EXECUTE FUNCTION update_override_type_usage();

-- Function to create audit trail entries
CREATE OR REPLACE FUNCTION create_override_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO override_audit_trail (
            override_log_id, user_id, action, action_description, new_values
        ) VALUES (
            NEW.id, NEW.user_id, 'created', 'Override log entry created', to_jsonb(NEW)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO override_audit_trail (
            override_log_id, user_id, action, action_description, old_values, new_values
        ) VALUES (
            NEW.id, NEW.user_id, 'updated', 'Override log entry updated', to_jsonb(OLD), to_jsonb(NEW)
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for audit trail
CREATE TRIGGER create_override_audit_trail_trigger
    AFTER INSERT OR UPDATE ON manual_override_log
    FOR EACH ROW EXECUTE FUNCTION create_override_audit_trail();

-- Function to validate override timing
CREATE OR REPLACE FUNCTION validate_override_timing()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate that activation time is not in the past
    IF NEW.activated_at IS NOT NULL AND NEW.activated_at < NOW() THEN
        RAISE EXCEPTION 'Override activation time cannot be in the past';
    END IF;
    
    -- Validate that expiration is after activation
    IF NEW.expires_at IS NOT NULL AND NEW.activated_at IS NOT NULL 
       AND NEW.expires_at <= NEW.activated_at THEN
        RAISE EXCEPTION 'Override expiration must be after activation time';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for timing validation
CREATE TRIGGER validate_override_timing_trigger
    BEFORE INSERT OR UPDATE ON manual_override_log
    FOR EACH ROW EXECUTE FUNCTION validate_override_timing(); 