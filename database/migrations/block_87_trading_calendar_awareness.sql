-- Block 87: Trading Calendar Awareness - Database Migration
-- Comprehensive schema for trading calendar awareness and market closure conflict detection
-- Optimized for AU/NZ markets with integration to Notification Center

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- TRADING CALENDARS AND MARKET DATA
-- =====================================================

-- Trading calendars table
CREATE TABLE trading_calendars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_code VARCHAR(10) NOT NULL UNIQUE,
    market_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    region VARCHAR(50) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    
    -- Market hours
    regular_market_open TIME NOT NULL,
    regular_market_close TIME NOT NULL,
    pre_market_start TIME,
    post_market_end TIME,
    
    -- Extended hours
    extended_hours_available BOOLEAN DEFAULT false,
    extended_pre_market_start TIME,
    extended_after_hours_end TIME,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    data_source VARCHAR(100) NOT NULL,
    reliability_score DECIMAL(3,2) DEFAULT 0.95 CHECK (reliability_score >= 0 AND reliability_score <= 1),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Constraints
    CONSTRAINT valid_market_hours CHECK (regular_market_close > regular_market_open),
    CONSTRAINT valid_timezone CHECK (timezone ~ '^[A-Za-z_/]+$')
);

-- Market holidays table
CREATE TABLE market_holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_id UUID NOT NULL REFERENCES trading_calendars(id) ON DELETE CASCADE,
    
    -- Holiday details
    holiday_name VARCHAR(200) NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_type VARCHAR(50) NOT NULL, -- 'national', 'market_specific', 'religious', 'bank'
    
    -- Trading impact
    trading_status VARCHAR(20) NOT NULL DEFAULT 'closed', -- 'closed', 'limited', 'normal', 'extended'
    settlement_impact VARCHAR(20) DEFAULT 'delayed', -- 'none', 'delayed', 'expedited', 'suspended'
    
    -- Planning information
    advance_notice_days INTEGER DEFAULT 30,
    alternative_markets TEXT[], -- Array of alternative market codes
    workarounds TEXT[],
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB, -- Store recurrence rules as JSON
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(calendar_id, holiday_date),
    CONSTRAINT valid_trading_status CHECK (trading_status IN ('closed', 'limited', 'normal', 'extended')),
    CONSTRAINT valid_settlement_impact CHECK (settlement_impact IN ('none', 'delayed', 'expedited', 'suspended'))
);

-- Special trading sessions table
CREATE TABLE special_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_id UUID NOT NULL REFERENCES trading_calendars(id) ON DELETE CASCADE,
    
    -- Session details
    session_date DATE NOT NULL,
    session_type VARCHAR(50) NOT NULL, -- 'opening_auction', 'closing_auction', 'volatility_halt', etc.
    session_start_time TIME NOT NULL,
    session_end_time TIME NOT NULL,
    
    -- Conditions and restrictions
    trading_conditions JSONB DEFAULT '{}',
    volume_expectations JSONB DEFAULT '{}',
    liquidity_conditions JSONB DEFAULT '{}',
    affected_assets TEXT[], -- Array of asset IDs or symbols
    trading_restrictions JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(calendar_id, session_date, session_type),
    CONSTRAINT valid_session_times CHECK (session_end_time > session_start_time)
);

-- Trading rules table
CREATE TABLE trading_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_id UUID NOT NULL REFERENCES trading_calendars(id) ON DELETE CASCADE,
    
    -- Rule definition
    rule_name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'trading_hour', 'settlement', 'market_maker', 'volatility'
    rule_condition TEXT NOT NULL,
    rule_action TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    
    -- Scope
    applicable_assets TEXT[],
    applicable_date_ranges JSONB, -- Array of date ranges
    
    -- Impact
    trading_impact VARCHAR(20) DEFAULT 'none', -- 'none', 'limited', 'restricted', 'suspended'
    settlement_impact VARCHAR(20) DEFAULT 'none',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    effective_from DATE NOT NULL,
    effective_until DATE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(calendar_id, rule_name),
    CONSTRAINT valid_trading_impact CHECK (trading_impact IN ('none', 'limited', 'restricted', 'suspended'))
);

-- =====================================================
-- CALENDAR AWARENESS INSTANCES
-- =====================================================

-- Calendar awareness instances
CREATE TABLE calendar_awareness_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Configuration
    monitored_markets TEXT[] NOT NULL, -- Array of market codes
    primary_markets TEXT[] NOT NULL,
    secondary_markets TEXT[],
    look_ahead_days INTEGER DEFAULT 14 CHECK (look_ahead_days > 0),
    
    -- Settings
    enable_monitoring BOOLEAN DEFAULT true,
    monitoring_frequency VARCHAR(20) DEFAULT 'hourly', -- 'realtime', 'hourly', 'daily', 'weekly'
    
    -- Alert preferences
    min_alert_severity VARCHAR(20) DEFAULT 'medium', -- 'info', 'low', 'medium', 'high', 'critical'
    advance_notice_hours INTEGER[] DEFAULT '{24,48,168}', -- Array of advance notice periods
    business_hours_only BOOLEAN DEFAULT false,
    weekends_enabled BOOLEAN DEFAULT true,
    
    -- Notification channels
    email_alerts BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_alerts BOOLEAN DEFAULT false,
    dashboard_alerts BOOLEAN DEFAULT true,
    
    -- Automation
    enable_automation BOOLEAN DEFAULT false,
    automation_rules JSONB DEFAULT '[]',
    business_rules JSONB DEFAULT '[]',
    
    -- Integration
    notification_center_integration BOOLEAN DEFAULT true,
    external_integrations JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'error', 'updating'
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    next_update TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    version VARCHAR(10) DEFAULT '1.0.0',
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'error', 'updating')),
    CONSTRAINT valid_monitoring_frequency CHECK (monitoring_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
    CONSTRAINT valid_alert_severity CHECK (min_alert_severity IN ('info', 'low', 'medium', 'high', 'critical'))
);

-- Allocation intents table
CREATE TABLE allocation_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    awareness_id UUID NOT NULL REFERENCES calendar_awareness_instances(id) ON DELETE CASCADE,
    
    -- Target allocation
    asset_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    target_weight DECIMAL(8,6) NOT NULL CHECK (target_weight >= 0 AND target_weight <= 1),
    current_weight DECIMAL(8,6) NOT NULL CHECK (current_weight >= 0 AND current_weight <= 1),
    deviation DECIMAL(8,6) NOT NULL,
    
    -- Market info
    primary_market VARCHAR(10) NOT NULL,
    trading_markets TEXT[] NOT NULL,
    preferred_market VARCHAR(10),
    
    -- Trading requirements
    minimum_trade_size DECIMAL(15,2) DEFAULT 0,
    trading_increments DECIMAL(15,2) DEFAULT 1,
    liquidity_requirements JSONB DEFAULT '{}',
    
    -- Timing sensitivity
    timing_sensitivity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    market_dependency JSONB DEFAULT '{}',
    
    -- Target timing
    target_date TIMESTAMPTZ NOT NULL,
    deadline TIMESTAMPTZ,
    flexibility_level VARCHAR(20) DEFAULT 'moderate', -- 'rigid', 'limited', 'moderate', 'flexible'
    
    -- Priority
    priority_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical', 'urgent'
    urgency_level VARCHAR(20) DEFAULT 'medium',
    reason_code VARCHAR(100),
    
    -- Constraints
    allocation_constraints JSONB DEFAULT '[]',
    required_markets TEXT[],
    optional_markets TEXT[],
    fallback_options JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_timing_sensitivity CHECK (timing_sensitivity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_flexibility CHECK (flexibility_level IN ('rigid', 'limited', 'moderate', 'flexible', 'very_flexible')),
    CONSTRAINT valid_priority CHECK (priority_level IN ('low', 'medium', 'high', 'critical', 'urgent'))
);

-- Pending rebalances table
CREATE TABLE pending_rebalances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    awareness_id UUID NOT NULL REFERENCES calendar_awareness_instances(id) ON DELETE CASCADE,
    rebalance_id UUID NOT NULL,
    portfolio_id UUID NOT NULL,
    strategy_id UUID,
    
    -- Rebalance details
    total_value DECIMAL(15,2) NOT NULL,
    estimated_cost DECIMAL(15,2) DEFAULT 0,
    planned_trades_count INTEGER DEFAULT 0,
    
    -- Timing
    scheduled_date TIMESTAMPTZ NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    estimated_duration_minutes INTEGER DEFAULT 60,
    
    -- Market dependencies
    market_dependencies JSONB DEFAULT '[]',
    critical_markets TEXT[],
    
    -- Flexibility
    can_defer BOOLEAN DEFAULT true,
    max_deferral_days INTEGER DEFAULT 7,
    deferral_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'pending', 'executing', 'completed', 'cancelled', 'deferred'
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_rebalance_status CHECK (status IN ('planned', 'pending', 'executing', 'completed', 'cancelled', 'deferred')),
    CONSTRAINT valid_timing CHECK (deadline >= scheduled_date)
);

-- Scheduled trades table
CREATE TABLE scheduled_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    awareness_id UUID NOT NULL REFERENCES calendar_awareness_instances(id) ON DELETE CASCADE,
    trade_id UUID NOT NULL,
    portfolio_id UUID NOT NULL,
    
    -- Trade details
    asset_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL, -- 'buy', 'sell'
    quantity DECIMAL(15,4) NOT NULL,
    order_type VARCHAR(20) DEFAULT 'market', -- 'market', 'limit', 'stop', etc.
    
    -- Timing
    scheduled_time TIMESTAMPTZ NOT NULL,
    window_start TIMESTAMPTZ,
    window_end TIMESTAMPTZ,
    
    -- Market requirements
    preferred_market VARCHAR(10) NOT NULL,
    acceptable_markets TEXT[],
    required_market_conditions JSONB DEFAULT '[]',
    
    -- Flexibility
    is_flexible BOOLEAN DEFAULT false,
    earliest_time TIMESTAMPTZ,
    latest_time TIMESTAMPTZ,
    
    -- Dependencies
    trade_dependencies JSONB DEFAULT '[]',
    trade_blockers JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_trade_side CHECK (side IN ('buy', 'sell')),
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT valid_timing_window CHECK (window_end IS NULL OR window_end >= window_start)
);

-- =====================================================
-- ALERTS AND CONFLICTS
-- =====================================================

-- Calendar alerts table
CREATE TABLE calendar_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    awareness_id UUID NOT NULL REFERENCES calendar_awareness_instances(id) ON DELETE CASCADE,
    
    -- Alert classification
    alert_type VARCHAR(30) NOT NULL, -- 'market_closure', 'holiday_warning', 'liquidity_alert', 'conflict_detected'
    severity VARCHAR(20) NOT NULL, -- 'info', 'low', 'medium', 'high', 'critical'
    
    -- Alert content
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    description TEXT,
    
    -- Timing
    alert_time TIMESTAMPTZ DEFAULT NOW(),
    event_time TIMESTAMPTZ NOT NULL,
    lead_time_hours DECIMAL(8,2) NOT NULL,
    
    -- Affected items
    affected_rebalances UUID[],
    affected_trades UUID[],
    affected_markets TEXT[],
    affected_assets TEXT[],
    
    -- Impact assessment
    financial_impact JSONB DEFAULT '{}',
    operational_impact JSONB DEFAULT '{}',
    strategic_impact JSONB DEFAULT '{}',
    risk_impact JSONB DEFAULT '{}',
    overall_impact_rating VARCHAR(20) DEFAULT 'low', -- 'minimal', 'low', 'moderate', 'high', 'severe'
    impact_confidence DECIMAL(3,2) DEFAULT 0.5,
    
    -- Actions
    suggested_actions JSONB DEFAULT '[]',
    automatic_actions JSONB DEFAULT '[]',
    
    -- Status and acknowledgment
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'expired', 'escalated'
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    
    -- Response requirements
    requires_response BOOLEAN DEFAULT false,
    response_deadline TIMESTAMPTZ,
    escalation_rules JSONB DEFAULT '[]',
    
    -- Integration
    sent_to_notification_center BOOLEAN DEFAULT false,
    notification_center_id UUID,
    external_notifications JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_alert_type CHECK (alert_type IN ('market_closure', 'holiday_warning', 'liquidity_alert', 'conflict_detected', 'deadline_approaching')),
    CONSTRAINT valid_alert_severity CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_alert_status CHECK (status IN ('active', 'acknowledged', 'resolved', 'expired', 'escalated')),
    CONSTRAINT valid_impact_rating CHECK (overall_impact_rating IN ('minimal', 'low', 'moderate', 'high', 'severe')),
    CONSTRAINT valid_confidence CHECK (impact_confidence >= 0 AND impact_confidence <= 1)
);

-- Market conflicts table
CREATE TABLE market_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    awareness_id UUID NOT NULL REFERENCES calendar_awareness_instances(id) ON DELETE CASCADE,
    
    -- Conflict classification
    conflict_type VARCHAR(30) NOT NULL, -- 'market_closure', 'liquidity_shortage', 'timing_conflict', 'settlement_delay'
    severity VARCHAR(20) NOT NULL, -- 'minor', 'moderate', 'major', 'critical', 'blocking'
    
    -- Conflict description
    description TEXT NOT NULL,
    affected_operations JSONB NOT NULL, -- Array of affected operations with details
    
    -- Timing
    conflict_start TIMESTAMPTZ NOT NULL,
    conflict_end TIMESTAMPTZ NOT NULL,
    duration_hours DECIMAL(8,2) GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (conflict_end - conflict_start)) / 3600) STORED,
    
    -- Market impact
    affected_markets TEXT[] NOT NULL,
    available_alternatives TEXT[],
    
    -- Resolution options
    resolution_options JSONB DEFAULT '[]',
    recommended_action TEXT,
    
    -- Cost implications
    direct_costs DECIMAL(15,2) DEFAULT 0,
    indirect_costs DECIMAL(15,2) DEFAULT 0,
    opportunity_costs DECIMAL(15,2) DEFAULT 0,
    total_cost_impact DECIMAL(15,2) GENERATED ALWAYS AS (direct_costs + indirect_costs + opportunity_costs) STORED,
    cost_per_hour DECIMAL(15,2) DEFAULT 0,
    cost_per_day DECIMAL(15,2) DEFAULT 0,
    
    -- Status and resolution
    status VARCHAR(20) DEFAULT 'detected', -- 'detected', 'analyzing', 'resolved', 'deferred', 'escalated'
    resolution JSONB,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    
    -- Performance tracking
    actual_cost DECIMAL(15,2),
    resolution_effectiveness DECIMAL(3,2),
    lessons_learned TEXT[],
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_conflict_type CHECK (conflict_type IN ('market_closure', 'liquidity_shortage', 'timing_conflict', 'settlement_delay', 'system_maintenance')),
    CONSTRAINT valid_conflict_severity CHECK (severity IN ('minor', 'moderate', 'major', 'critical', 'blocking')),
    CONSTRAINT valid_conflict_status CHECK (status IN ('detected', 'analyzing', 'resolved', 'deferred', 'escalated')),
    CONSTRAINT valid_timing CHECK (conflict_end > conflict_start),
    CONSTRAINT valid_effectiveness CHECK (resolution_effectiveness IS NULL OR (resolution_effectiveness >= 0 AND resolution_effectiveness <= 1))
);

-- =====================================================
-- MONITORING AND AUDIT
-- =====================================================

-- Calendar monitoring status table
CREATE TABLE calendar_monitoring_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    awareness_id UUID NOT NULL REFERENCES calendar_awareness_instances(id) ON DELETE CASCADE,
    
    -- Monitoring state
    is_active BOOLEAN DEFAULT false,
    last_check TIMESTAMPTZ DEFAULT NOW(),
    next_check TIMESTAMPTZ,
    check_interval_seconds INTEGER DEFAULT 3600,
    
    -- Performance metrics
    total_checks INTEGER DEFAULT 0,
    successful_checks INTEGER DEFAULT 0,
    failed_checks INTEGER DEFAULT 0,
    average_response_time_ms DECIMAL(8,2) DEFAULT 0,
    
    -- Error tracking
    last_error TEXT,
    last_error_at TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,
    max_consecutive_failures INTEGER DEFAULT 5,
    
    -- Data quality
    data_quality_score DECIMAL(3,2) DEFAULT 0.95,
    coverage_percentage DECIMAL(5,2) DEFAULT 100.0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 95.0,
    
    -- Alert metrics
    alerts_generated INTEGER DEFAULT 0,
    conflicts_detected INTEGER DEFAULT 0,
    false_positives INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_quality_score CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
    CONSTRAINT valid_coverage CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
    CONSTRAINT valid_accuracy CHECK (accuracy_percentage >= 0 AND accuracy_percentage <= 100)
);

-- Calendar audit log table
CREATE TABLE calendar_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    awareness_id UUID REFERENCES calendar_awareness_instances(id) ON DELETE SET NULL,
    calendar_id UUID REFERENCES trading_calendars(id) ON DELETE SET NULL,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'calendar_loaded', 'awareness_created', 'conflict_detected', 'alert_generated'
    event_action VARCHAR(100) NOT NULL,
    event_description TEXT,
    
    -- Context
    user_id UUID,
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    
    -- Data
    before_data JSONB,
    after_data JSONB,
    event_data JSONB DEFAULT '{}',
    
    -- Impact
    impact_level VARCHAR(20) DEFAULT 'low', -- 'none', 'low', 'medium', 'high', 'critical'
    affected_records INTEGER DEFAULT 0,
    
    -- Processing
    processing_time_ms INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    stack_trace TEXT,
    
    -- Metadata
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT valid_impact_level CHECK (impact_level IN ('none', 'low', 'medium', 'high', 'critical'))
);

-- =====================================================
-- INTEGRATION TABLES
-- =====================================================

-- External data sources table
CREATE TABLE external_data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source details
    source_name VARCHAR(100) NOT NULL UNIQUE,
    source_type VARCHAR(50) NOT NULL, -- 'official', 'third_party', 'aggregated'
    endpoint_url TEXT,
    
    -- Authentication
    auth_type VARCHAR(30), -- 'none', 'api_key', 'oauth', 'basic'
    auth_config JSONB DEFAULT '{}',
    
    -- Data configuration
    data_format VARCHAR(20) DEFAULT 'json', -- 'json', 'xml', 'csv', 'ical'
    update_frequency VARCHAR(20) DEFAULT 'daily', -- 'realtime', 'hourly', 'daily', 'weekly'
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Quality metrics
    reliability_score DECIMAL(3,2) DEFAULT 0.8,
    latency_ms INTEGER DEFAULT 1000,
    uptime_percentage DECIMAL(5,2) DEFAULT 99.0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMPTZ,
    next_sync TIMESTAMPTZ,
    
    -- Error handling
    retry_count INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,
    timeout_seconds INTEGER DEFAULT 30,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_reliability CHECK (reliability_score >= 0 AND reliability_score <= 1),
    CONSTRAINT valid_uptime CHECK (uptime_percentage >= 0 AND uptime_percentage <= 100)
);

-- Notification center integration table
CREATE TABLE notification_center_integration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    awareness_id UUID NOT NULL REFERENCES calendar_awareness_instances(id) ON DELETE CASCADE,
    alert_id UUID NOT NULL REFERENCES calendar_alerts(id) ON DELETE CASCADE,
    
    -- Notification details
    notification_center_id UUID NOT NULL, -- References notification_center table (Block 33)
    notification_type VARCHAR(50) DEFAULT 'calendar_alert',
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    
    -- Channel configuration
    channels TEXT[] DEFAULT '{"email","dashboard"}',
    channel_configs JSONB DEFAULT '{}',
    
    -- Status
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered BOOLEAN DEFAULT false,
    delivery_attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMPTZ,
    
    -- Response tracking
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID,
    
    -- Performance
    delivery_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Trading calendars indexes
CREATE INDEX idx_trading_calendars_market_code ON trading_calendars(market_code);
CREATE INDEX idx_trading_calendars_active ON trading_calendars(is_active) WHERE is_active = true;
CREATE INDEX idx_trading_calendars_country ON trading_calendars(country_code);

-- Market holidays indexes
CREATE INDEX idx_market_holidays_calendar_date ON market_holidays(calendar_id, holiday_date);
CREATE INDEX idx_market_holidays_date_range ON market_holidays(holiday_date);
CREATE INDEX idx_market_holidays_recurring ON market_holidays(is_recurring) WHERE is_recurring = true;

-- Calendar awareness indexes
CREATE INDEX idx_awareness_portfolio_user ON calendar_awareness_instances(portfolio_id, user_id);
CREATE INDEX idx_awareness_status ON calendar_awareness_instances(status);
CREATE INDEX idx_awareness_monitoring ON calendar_awareness_instances(enable_monitoring) WHERE enable_monitoring = true;
CREATE INDEX idx_awareness_next_update ON calendar_awareness_instances(next_update) WHERE status = 'active';

-- Allocation intents indexes
CREATE INDEX idx_allocation_awareness_asset ON allocation_intents(awareness_id, asset_id);
CREATE INDEX idx_allocation_target_date ON allocation_intents(target_date);
CREATE INDEX idx_allocation_primary_market ON allocation_intents(primary_market);

-- Alerts indexes
CREATE INDEX idx_alerts_awareness_severity ON calendar_alerts(awareness_id, severity);
CREATE INDEX idx_alerts_status_time ON calendar_alerts(status, alert_time);
CREATE INDEX idx_alerts_event_time ON calendar_alerts(event_time);
CREATE INDEX idx_alerts_unacknowledged ON calendar_alerts(acknowledged) WHERE acknowledged = false;
CREATE INDEX idx_alerts_requires_response ON calendar_alerts(requires_response, response_deadline) WHERE requires_response = true;

-- Conflicts indexes
CREATE INDEX idx_conflicts_awareness_severity ON market_conflicts(awareness_id, severity);
CREATE INDEX idx_conflicts_status_time ON market_conflicts(status, conflict_start);
CREATE INDEX idx_conflicts_markets ON market_conflicts USING GIN(affected_markets);
CREATE INDEX idx_conflicts_timing ON market_conflicts(conflict_start, conflict_end);

-- Monitoring indexes
CREATE INDEX idx_monitoring_awareness ON calendar_monitoring_status(awareness_id);
CREATE INDEX idx_monitoring_next_check ON calendar_monitoring_status(next_check) WHERE is_active = true;

-- Audit log indexes
CREATE INDEX idx_audit_awareness_event ON calendar_audit_log(awareness_id, event_type);
CREATE INDEX idx_audit_timestamp ON calendar_audit_log(event_timestamp);
CREATE INDEX idx_audit_user ON calendar_audit_log(user_id);
CREATE INDEX idx_audit_correlation ON calendar_audit_log(correlation_id);

-- Full-text search indexes
CREATE INDEX idx_alerts_search ON calendar_alerts USING GIN(to_tsvector('english', title || ' ' || message));
CREATE INDEX idx_conflicts_search ON market_conflicts USING GIN(to_tsvector('english', description));

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE trading_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_awareness_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_rebalances ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_monitoring_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_center_integration ENABLE ROW LEVEL SECURITY;

-- Public calendar data (read-only for all authenticated users)
CREATE POLICY "Public calendar read access" ON trading_calendars
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Public holidays read access" ON market_holidays
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Public sessions read access" ON special_sessions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Public rules read access" ON trading_rules
    FOR SELECT TO authenticated USING (true);

-- User-specific awareness data
CREATE POLICY "Users can view own awareness" ON calendar_awareness_instances
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create own awareness" ON calendar_awareness_instances
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own awareness" ON calendar_awareness_instances
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own awareness" ON calendar_awareness_instances
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Allocation intents (via awareness ownership)
CREATE POLICY "Users can access allocation intents via awareness" ON allocation_intents
    FOR ALL TO authenticated USING (
        awareness_id IN (
            SELECT id FROM calendar_awareness_instances WHERE user_id = auth.uid()
        )
    );

-- Pending rebalances (via awareness ownership)
CREATE POLICY "Users can access pending rebalances via awareness" ON pending_rebalances
    FOR ALL TO authenticated USING (
        awareness_id IN (
            SELECT id FROM calendar_awareness_instances WHERE user_id = auth.uid()
        )
    );

-- Scheduled trades (via awareness ownership)
CREATE POLICY "Users can access scheduled trades via awareness" ON scheduled_trades
    FOR ALL TO authenticated USING (
        awareness_id IN (
            SELECT id FROM calendar_awareness_instances WHERE user_id = auth.uid()
        )
    );

-- Calendar alerts (via awareness ownership)
CREATE POLICY "Users can access alerts via awareness" ON calendar_alerts
    FOR ALL TO authenticated USING (
        awareness_id IN (
            SELECT id FROM calendar_awareness_instances WHERE user_id = auth.uid()
        )
    );

-- Market conflicts (via awareness ownership)
CREATE POLICY "Users can access conflicts via awareness" ON market_conflicts
    FOR ALL TO authenticated USING (
        awareness_id IN (
            SELECT id FROM calendar_awareness_instances WHERE user_id = auth.uid()
        )
    );

-- Monitoring status (via awareness ownership)
CREATE POLICY "Users can access monitoring via awareness" ON calendar_monitoring_status
    FOR ALL TO authenticated USING (
        awareness_id IN (
            SELECT id FROM calendar_awareness_instances WHERE user_id = auth.uid()
        )
    );

-- Audit log (users can view their own actions)
CREATE POLICY "Users can view own audit entries" ON calendar_audit_log
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- External data sources (admin only for modifications)
CREATE POLICY "All users can read data sources" ON external_data_sources
    FOR SELECT TO authenticated USING (true);

-- Notification integration (via awareness ownership)
CREATE POLICY "Users can access notifications via awareness" ON notification_center_integration
    FOR ALL TO authenticated USING (
        awareness_id IN (
            SELECT id FROM calendar_awareness_instances WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_trading_calendars_updated_at BEFORE UPDATE ON trading_calendars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_market_holidays_updated_at BEFORE UPDATE ON market_holidays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_special_sessions_updated_at BEFORE UPDATE ON special_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_rules_updated_at BEFORE UPDATE ON trading_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_awareness_instances_updated_at BEFORE UPDATE ON calendar_awareness_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_allocation_intents_updated_at BEFORE UPDATE ON allocation_intents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pending_rebalances_updated_at BEFORE UPDATE ON pending_rebalances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_trades_updated_at BEFORE UPDATE ON scheduled_trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_alerts_updated_at BEFORE UPDATE ON calendar_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_market_conflicts_updated_at BEFORE UPDATE ON market_conflicts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monitoring_status_updated_at BEFORE UPDATE ON calendar_monitoring_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_external_sources_updated_at BEFORE UPDATE ON external_data_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_integration_updated_at BEFORE UPDATE ON notification_center_integration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log_entry()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO calendar_audit_log (
        awareness_id,
        event_type,
        event_action,
        user_id,
        before_data,
        after_data,
        correlation_id
    ) VALUES (
        COALESCE(NEW.awareness_id, OLD.awareness_id),
        TG_TABLE_NAME || '_' || TG_OP,
        TG_OP || ' on ' || TG_TABLE_NAME,
        auth.uid(),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        uuid_generate_v4()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply audit triggers to key tables
CREATE TRIGGER audit_awareness_instances AFTER INSERT OR UPDATE OR DELETE ON calendar_awareness_instances FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();
CREATE TRIGGER audit_calendar_alerts AFTER INSERT OR UPDATE OR DELETE ON calendar_alerts FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();
CREATE TRIGGER audit_market_conflicts AFTER INSERT OR UPDATE OR DELETE ON market_conflicts FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();

-- Function to automatically update monitoring status
CREATE OR REPLACE FUNCTION update_monitoring_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update monitoring status when awareness is modified
    INSERT INTO calendar_monitoring_status (awareness_id, is_active, next_check)
    VALUES (NEW.id, NEW.enable_monitoring, 
            CASE WHEN NEW.enable_monitoring 
                 THEN NOW() + INTERVAL '1 hour' 
                 ELSE NULL END)
    ON CONFLICT (awareness_id) DO UPDATE SET
        is_active = NEW.enable_monitoring,
        next_check = CASE WHEN NEW.enable_monitoring 
                          THEN NOW() + INTERVAL '1 hour' 
                          ELSE NULL END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER maintain_monitoring_status AFTER INSERT OR UPDATE ON calendar_awareness_instances FOR EACH ROW EXECUTE FUNCTION update_monitoring_status();

-- =====================================================
-- INITIAL DATA FOR AU/NZ MARKETS
-- =====================================================

-- Insert default NZX calendar
INSERT INTO trading_calendars (
    market_code, market_name, country_code, region, timezone, currency_code,
    regular_market_open, regular_market_close, is_active, data_source
) VALUES (
    'NZX', 'New Zealand Exchange', 'NZ', 'Oceania', 'Pacific/Auckland', 'NZD',
    '10:00', '16:45', true, 'NZX_Official'
);

-- Insert default ASX calendar
INSERT INTO trading_calendars (
    market_code, market_name, country_code, region, timezone, currency_code,
    regular_market_open, regular_market_close, is_active, data_source
) VALUES (
    'ASX', 'Australian Securities Exchange', 'AU', 'Oceania', 'Australia/Sydney', 'AUD',
    '10:00', '16:00', true, 'ASX_Official'
);

-- Insert major US markets for reference
INSERT INTO trading_calendars (
    market_code, market_name, country_code, region, timezone, currency_code,
    regular_market_open, regular_market_close, pre_market_start, post_market_end,
    extended_hours_available, is_active, data_source
) VALUES 
    ('NYSE', 'New York Stock Exchange', 'US', 'North America', 'America/New_York', 'USD',
     '09:30', '16:00', '04:00', '20:00', true, true, 'NYSE_Official'),
    ('NASDAQ', 'NASDAQ Stock Market', 'US', 'North America', 'America/New_York', 'USD',
     '09:30', '16:00', '04:00', '20:00', true, true, 'NASDAQ_Official');

-- Insert common AU/NZ holidays for current year
INSERT INTO market_holidays (calendar_id, holiday_name, holiday_date, holiday_type, is_recurring, recurrence_pattern)
SELECT 
    tc.id,
    'New Year''s Day',
    DATE '2024-01-01',
    'national',
    true,
    '{"frequency": "yearly", "month": 1, "day": 1}'
FROM trading_calendars tc WHERE tc.market_code = 'NZX'

UNION ALL

SELECT 
    tc.id,
    'Australia Day',
    DATE '2024-01-26',
    'national',
    true,
    '{"frequency": "yearly", "month": 1, "day": 26}'
FROM trading_calendars tc WHERE tc.market_code = 'ASX'

UNION ALL

SELECT 
    tc.id,
    'Waitangi Day',
    DATE '2024-02-06',
    'national',
    true,
    '{"frequency": "yearly", "month": 2, "day": 6}'
FROM trading_calendars tc WHERE tc.market_code = 'NZX';

-- Create default external data sources
INSERT INTO external_data_sources (source_name, source_type, reliability_score, is_active)
VALUES 
    ('NZX_Official_API', 'official', 0.99, true),
    ('ASX_Official_API', 'official', 0.99, true),
    ('US_Markets_Feed', 'third_party', 0.95, true),
    ('Global_Calendar_Service', 'aggregated', 0.85, true);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active market awareness with summary statistics
CREATE VIEW active_calendar_awareness AS
SELECT 
    ca.id,
    ca.portfolio_id,
    ca.user_id,
    ca.monitored_markets,
    ca.status,
    ca.last_updated,
    
    -- Summary statistics
    COUNT(DISTINCT cal.id) as calendars_count,
    COUNT(DISTINCT alert.id) as alerts_count,
    COUNT(DISTINCT alert.id) FILTER (WHERE alert.severity IN ('high', 'critical')) as critical_alerts_count,
    COUNT(DISTINCT conflict.id) as conflicts_count,
    COUNT(DISTINCT conflict.id) FILTER (WHERE conflict.severity IN ('critical', 'blocking')) as critical_conflicts_count,
    
    -- Next scheduled items
    MIN(trade.scheduled_time) as next_scheduled_trade,
    MIN(rebal.scheduled_date) as next_scheduled_rebalance
    
FROM calendar_awareness_instances ca
LEFT JOIN allocation_intents ai ON ai.awareness_id = ca.id
LEFT JOIN trading_calendars cal ON cal.market_code = ANY(ca.monitored_markets)
LEFT JOIN calendar_alerts alert ON alert.awareness_id = ca.id AND alert.status = 'active'
LEFT JOIN market_conflicts conflict ON conflict.awareness_id = ca.id AND conflict.status = 'detected'
LEFT JOIN scheduled_trades trade ON trade.awareness_id = ca.id AND trade.scheduled_time > NOW()
LEFT JOIN pending_rebalances rebal ON rebal.awareness_id = ca.id AND rebal.status IN ('planned', 'pending')

WHERE ca.status = 'active'
GROUP BY ca.id, ca.portfolio_id, ca.user_id, ca.monitored_markets, ca.status, ca.last_updated;

-- View for upcoming market closures
CREATE VIEW upcoming_market_closures AS
SELECT 
    tc.market_code,
    tc.market_name,
    mh.holiday_name,
    mh.holiday_date,
    mh.holiday_type,
    mh.trading_status,
    
    -- Days until closure
    (mh.holiday_date - CURRENT_DATE) as days_until_closure,
    
    -- Affected awareness instances
    ARRAY_AGG(DISTINCT ca.id) FILTER (WHERE ca.id IS NOT NULL) as affected_awareness_ids,
    COUNT(DISTINCT ca.id) as affected_awareness_count
    
FROM trading_calendars tc
JOIN market_holidays mh ON mh.calendar_id = tc.id
LEFT JOIN calendar_awareness_instances ca ON tc.market_code = ANY(ca.monitored_markets) AND ca.status = 'active'

WHERE mh.holiday_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  AND tc.is_active = true
  
GROUP BY tc.market_code, tc.market_name, mh.holiday_name, mh.holiday_date, mh.holiday_type, mh.trading_status
ORDER BY mh.holiday_date;

-- COMMENT ON SCHEMA
COMMENT ON TABLE trading_calendars IS 'Master calendar data for all supported trading markets including NZX, ASX, and major global exchanges';
COMMENT ON TABLE calendar_awareness_instances IS 'User-specific calendar awareness configurations for monitoring market conflicts';
COMMENT ON TABLE calendar_alerts IS 'System-generated alerts for market closure conflicts and trading schedule issues';
COMMENT ON TABLE market_conflicts IS 'Detected conflicts between trading schedules and market closures with resolution options';
COMMENT ON TABLE notification_center_integration IS 'Integration bridge to Block 33 Notification Center for alert delivery';

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON calendar_awareness_instances TO authenticated;
GRANT INSERT, UPDATE, DELETE ON allocation_intents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON pending_rebalances TO authenticated;
GRANT INSERT, UPDATE, DELETE ON scheduled_trades TO authenticated;
GRANT INSERT, UPDATE ON calendar_alerts TO authenticated;
GRANT INSERT, UPDATE ON market_conflicts TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated; 