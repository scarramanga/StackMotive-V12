-- Block 96: AI Agent Config Panel - Database Migration
-- AI Agent Configuration Management and Control Panel Tables

-- AI Agent Config Panels - Main panel configuration table
CREATE TABLE ai_agent_config_panels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    panel_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuration
    panel_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    access_control JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_ai_config_panels_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Agent Configurations - Core agent configuration table
CREATE TABLE agent_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panel_id UUID NOT NULL,
    agent_id VARCHAR(100) NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    agent_type VARCHAR(100) NOT NULL,
    
    -- Core configuration
    core_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    strategy_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    risk_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    behavior_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    performance_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    notification_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    monitoring_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    compliance_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'inactive',
    is_enabled BOOLEAN DEFAULT true,
    
    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_agent_configs_panel FOREIGN KEY (panel_id) REFERENCES ai_agent_config_panels(id) ON DELETE CASCADE,
    CONSTRAINT unique_agent_per_panel UNIQUE (panel_id, agent_id),
    CONSTRAINT check_agent_status CHECK (status IN ('active', 'inactive', 'paused', 'error', 'maintenance', 'testing', 'deploying'))
);

-- Agent Configuration History - Version tracking
CREATE TABLE agent_configuration_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID NOT NULL,
    version INTEGER NOT NULL,
    
    -- Configuration snapshot
    config_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Change metadata
    change_type VARCHAR(50) NOT NULL,
    change_description TEXT,
    changed_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_config_history_agent FOREIGN KEY (agent_config_id) REFERENCES agent_configurations(id) ON DELETE CASCADE,
    CONSTRAINT check_change_type CHECK (change_type IN ('create', 'update', 'deploy', 'undeploy', 'clone', 'import'))
);

-- Agent Validation Results - Validation tracking
CREATE TABLE agent_validation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID NOT NULL,
    
    -- Validation metadata
    validation_type VARCHAR(100) NOT NULL,
    validation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Results
    is_valid BOOLEAN NOT NULL,
    validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    validation_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Additional data
    validation_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_validation_results_agent FOREIGN KEY (agent_config_id) REFERENCES agent_configurations(id) ON DELETE CASCADE
);

-- Agent Test Results - Testing and backtesting results
CREATE TABLE agent_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID NOT NULL,
    
    -- Test metadata
    test_type VARCHAR(100) NOT NULL,
    test_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Results
    test_success BOOLEAN NOT NULL,
    test_duration_ms INTEGER NOT NULL DEFAULT 0,
    test_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Performance metrics (for backtests)
    performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    test_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    test_completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_test_results_agent FOREIGN KEY (agent_config_id) REFERENCES agent_configurations(id) ON DELETE CASCADE,
    CONSTRAINT check_test_type CHECK (test_type IN ('configuration', 'connectivity', 'strategy', 'risk', 'backtest', 'paper_trade', 'integration'))
);

-- Agent Deployments - Deployment tracking
CREATE TABLE agent_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID NOT NULL,
    deployment_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Deployment metadata
    deployment_type VARCHAR(100) NOT NULL,
    deployment_environment VARCHAR(100) NOT NULL,
    deployment_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status
    deployment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    deployment_message TEXT,
    
    -- Resource allocation
    allocated_resources JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Performance tracking
    performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_health_check TIMESTAMP WITH TIME ZONE,
    undeployed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT fk_deployments_agent FOREIGN KEY (agent_config_id) REFERENCES agent_configurations(id) ON DELETE CASCADE,
    CONSTRAINT check_deployment_status CHECK (deployment_status IN ('pending', 'deploying', 'active', 'inactive', 'error', 'stopping', 'stopped')),
    CONSTRAINT check_deployment_environment CHECK (deployment_environment IN ('development', 'testing', 'staging', 'production'))
);

-- Agent Monitoring Metrics - Performance and health monitoring
CREATE TABLE agent_monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL,
    
    -- Metric metadata
    metric_type VARCHAR(100) NOT NULL,
    metric_category VARCHAR(100) NOT NULL,
    
    -- Metric values
    metric_value DECIMAL(20,8),
    metric_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Thresholds and alerts
    threshold_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    alert_triggered BOOLEAN DEFAULT false,
    
    -- Timestamps
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_monitoring_metrics_deployment FOREIGN KEY (deployment_id) REFERENCES agent_deployments(id) ON DELETE CASCADE,
    CONSTRAINT check_metric_category CHECK (metric_category IN ('performance', 'risk', 'execution', 'connectivity', 'resource'))
);

-- Agent Notifications - Notification and alert tracking
CREATE TABLE agent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID NOT NULL,
    deployment_id UUID,
    
    -- Notification metadata
    notification_type VARCHAR(100) NOT NULL,
    notification_channel VARCHAR(100) NOT NULL,
    urgency_level VARCHAR(50) NOT NULL DEFAULT 'medium',
    
    -- Content
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    notification_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Delivery tracking
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    delivery_attempts INTEGER DEFAULT 0,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Response tracking
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_notifications_agent FOREIGN KEY (agent_config_id) REFERENCES agent_configurations(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_deployment FOREIGN KEY (deployment_id) REFERENCES agent_deployments(id) ON DELETE SET NULL,
    CONSTRAINT check_urgency_level CHECK (urgency_level IN ('low', 'medium', 'high', 'critical', 'emergency')),
    CONSTRAINT check_delivery_status CHECK (delivery_status IN ('pending', 'sending', 'delivered', 'failed', 'cancelled'))
);

-- Agent Data Sources - External data source configurations
CREATE TABLE agent_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    
    -- Connection configuration
    connection_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status and health
    status VARCHAR(50) NOT NULL DEFAULT 'inactive',
    is_enabled BOOLEAN DEFAULT true,
    health_status VARCHAR(50) NOT NULL DEFAULT 'unknown',
    
    -- Performance metrics
    performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Quality metrics
    data_quality_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_health_check TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT fk_data_sources_agent FOREIGN KEY (agent_config_id) REFERENCES agent_configurations(id) ON DELETE CASCADE,
    CONSTRAINT unique_source_per_agent UNIQUE (agent_config_id, source_id),
    CONSTRAINT check_data_source_status CHECK (status IN ('active', 'inactive', 'error', 'maintenance')),
    CONSTRAINT check_health_status CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown'))
);

-- Agent Integrations - External system integrations
CREATE TABLE agent_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID NOT NULL,
    integration_id VARCHAR(100) NOT NULL,
    integration_name VARCHAR(255) NOT NULL,
    integration_type VARCHAR(100) NOT NULL,
    
    -- Configuration
    integration_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'inactive',
    is_enabled BOOLEAN DEFAULT true,
    
    -- Connection info
    connection_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_connection_test TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT fk_integrations_agent FOREIGN KEY (agent_config_id) REFERENCES agent_configurations(id) ON DELETE CASCADE,
    CONSTRAINT unique_integration_per_agent UNIQUE (agent_config_id, integration_id),
    CONSTRAINT check_integration_status CHECK (status IN ('active', 'inactive', 'error', 'testing'))
);

-- Agent Compliance Framework - Regulatory compliance tracking
CREATE TABLE agent_compliance_framework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID NOT NULL,
    regulatory_framework VARCHAR(50) NOT NULL,
    
    -- Compliance requirements
    compliance_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    audit_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
    record_keeping_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    reporting_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Risk disclosure
    risk_disclosure_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Client categorization
    client_categorization JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Best execution
    best_execution_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Market conduct
    market_conduct_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Compliance status
    compliance_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    last_compliance_check TIMESTAMP WITH TIME ZONE,
    next_compliance_check TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_compliance_framework_agent FOREIGN KEY (agent_config_id) REFERENCES agent_configurations(id) ON DELETE CASCADE,
    CONSTRAINT check_regulatory_framework CHECK (regulatory_framework IN ('ASIC', 'FMA', 'MAS', 'CFTC', 'SEC', 'ESMA', 'custom')),
    CONSTRAINT check_compliance_status CHECK (compliance_status IN ('compliant', 'non_compliant', 'pending', 'under_review'))
);

-- Agent Audit Log - Comprehensive audit trail
CREATE TABLE agent_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID NOT NULL,
    deployment_id UUID,
    
    -- Audit metadata
    audit_type VARCHAR(100) NOT NULL,
    audit_category VARCHAR(100) NOT NULL,
    
    -- Action details
    action VARCHAR(255) NOT NULL,
    action_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Actor information
    actor_type VARCHAR(50) NOT NULL,
    actor_id UUID,
    actor_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Context
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Results
    result VARCHAR(50) NOT NULL,
    result_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_audit_log_agent FOREIGN KEY (agent_config_id) REFERENCES agent_configurations(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_log_deployment FOREIGN KEY (deployment_id) REFERENCES agent_deployments(id) ON DELETE SET NULL,
    CONSTRAINT check_audit_category CHECK (audit_category IN ('configuration', 'deployment', 'execution', 'compliance', 'security', 'performance')),
    CONSTRAINT check_actor_type CHECK (actor_type IN ('user', 'system', 'agent', 'external')),
    CONSTRAINT check_result CHECK (result IN ('success', 'failure', 'warning', 'info'))
);

-- Agent Performance Reports - Scheduled performance reporting
CREATE TABLE agent_performance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID NOT NULL,
    deployment_id UUID,
    
    -- Report metadata
    report_type VARCHAR(100) NOT NULL,
    report_period VARCHAR(50) NOT NULL,
    report_date DATE NOT NULL,
    
    -- Performance data
    performance_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    benchmark_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Summary metrics
    summary_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Risk metrics
    risk_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Recommendations
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Status
    report_status VARCHAR(50) NOT NULL DEFAULT 'generated',
    
    -- Timestamps
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_performance_reports_agent FOREIGN KEY (agent_config_id) REFERENCES agent_configurations(id) ON DELETE CASCADE,
    CONSTRAINT fk_performance_reports_deployment FOREIGN KEY (deployment_id) REFERENCES agent_deployments(id) ON DELETE SET NULL,
    CONSTRAINT check_report_type CHECK (report_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'ad_hoc')),
    CONSTRAINT check_report_status CHECK (report_status IN ('generated', 'reviewed', 'approved', 'archived'))
);

-- Agent Templates - Configuration templates
CREATE TABLE agent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    agent_type VARCHAR(100) NOT NULL,
    
    -- Template configuration
    template_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Metadata
    description TEXT,
    category VARCHAR(100),
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    
    -- Ownership
    created_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT unique_template_name UNIQUE (template_name)
);

-- Create indexes for performance
CREATE INDEX idx_ai_config_panels_user_id ON ai_agent_config_panels(user_id);
CREATE INDEX idx_ai_config_panels_active ON ai_agent_config_panels(is_active);
CREATE INDEX idx_ai_config_panels_updated ON ai_agent_config_panels(updated_at);

CREATE INDEX idx_agent_configs_panel_id ON agent_configurations(panel_id);
CREATE INDEX idx_agent_configs_status ON agent_configurations(status);
CREATE INDEX idx_agent_configs_type ON agent_configurations(agent_type);
CREATE INDEX idx_agent_configs_enabled ON agent_configurations(is_enabled);

CREATE INDEX idx_config_history_agent ON agent_configuration_history(agent_config_id);
CREATE INDEX idx_config_history_version ON agent_configuration_history(version);
CREATE INDEX idx_config_history_type ON agent_configuration_history(change_type);

CREATE INDEX idx_validation_results_agent ON agent_validation_results(agent_config_id);
CREATE INDEX idx_validation_results_timestamp ON agent_validation_results(validation_timestamp);
CREATE INDEX idx_validation_results_valid ON agent_validation_results(is_valid);

CREATE INDEX idx_test_results_agent ON agent_test_results(agent_config_id);
CREATE INDEX idx_test_results_type ON agent_test_results(test_type);
CREATE INDEX idx_test_results_success ON agent_test_results(test_success);
CREATE INDEX idx_test_results_started ON agent_test_results(test_started_at);

CREATE INDEX idx_deployments_agent ON agent_deployments(agent_config_id);
CREATE INDEX idx_deployments_status ON agent_deployments(deployment_status);
CREATE INDEX idx_deployments_environment ON agent_deployments(deployment_environment);
CREATE INDEX idx_deployments_deployed ON agent_deployments(deployed_at);

CREATE INDEX idx_monitoring_metrics_deployment ON agent_monitoring_metrics(deployment_id);
CREATE INDEX idx_monitoring_metrics_type ON agent_monitoring_metrics(metric_type);
CREATE INDEX idx_monitoring_metrics_recorded ON agent_monitoring_metrics(recorded_at);

CREATE INDEX idx_notifications_agent ON agent_notifications(agent_config_id);
CREATE INDEX idx_notifications_deployment ON agent_notifications(deployment_id);
CREATE INDEX idx_notifications_urgency ON agent_notifications(urgency_level);
CREATE INDEX idx_notifications_status ON agent_notifications(delivery_status);
CREATE INDEX idx_notifications_acknowledged ON agent_notifications(acknowledged);

CREATE INDEX idx_data_sources_agent ON agent_data_sources(agent_config_id);
CREATE INDEX idx_data_sources_type ON agent_data_sources(source_type);
CREATE INDEX idx_data_sources_status ON agent_data_sources(status);
CREATE INDEX idx_data_sources_health ON agent_data_sources(health_status);

CREATE INDEX idx_integrations_agent ON agent_integrations(agent_config_id);
CREATE INDEX idx_integrations_type ON agent_integrations(integration_type);
CREATE INDEX idx_integrations_status ON agent_integrations(status);

CREATE INDEX idx_compliance_framework_agent ON agent_compliance_framework(agent_config_id);
CREATE INDEX idx_compliance_framework_regulatory ON agent_compliance_framework(regulatory_framework);
CREATE INDEX idx_compliance_framework_status ON agent_compliance_framework(compliance_status);

CREATE INDEX idx_audit_log_agent ON agent_audit_log(agent_config_id);
CREATE INDEX idx_audit_log_deployment ON agent_audit_log(deployment_id);
CREATE INDEX idx_audit_log_type ON agent_audit_log(audit_type);
CREATE INDEX idx_audit_log_timestamp ON agent_audit_log(timestamp);

CREATE INDEX idx_performance_reports_agent ON agent_performance_reports(agent_config_id);
CREATE INDEX idx_performance_reports_type ON agent_performance_reports(report_type);
CREATE INDEX idx_performance_reports_date ON agent_performance_reports(report_date);

CREATE INDEX idx_agent_templates_type ON agent_templates(template_type);
CREATE INDEX idx_agent_templates_category ON agent_templates(category);
CREATE INDEX idx_agent_templates_active ON agent_templates(is_active);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_ai_panel_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_panel_timestamp
    BEFORE UPDATE ON ai_agent_config_panels
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_panel_timestamp();

CREATE OR REPLACE FUNCTION update_agent_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.last_modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_config_timestamp
    BEFORE UPDATE ON agent_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_config_timestamp();

CREATE OR REPLACE FUNCTION update_data_source_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_data_source_timestamp
    BEFORE UPDATE ON agent_data_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_data_source_timestamp();

CREATE OR REPLACE FUNCTION update_integration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_integration_timestamp
    BEFORE UPDATE ON agent_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_integration_timestamp();

CREATE OR REPLACE FUNCTION update_compliance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_compliance_timestamp
    BEFORE UPDATE ON agent_compliance_framework
    FOR EACH ROW
    EXECUTE FUNCTION update_compliance_timestamp();

CREATE OR REPLACE FUNCTION update_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_template_timestamp
    BEFORE UPDATE ON agent_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_template_timestamp();

-- Create views for common queries
CREATE VIEW agent_config_summary AS
SELECT 
    ac.id,
    ac.panel_id,
    p.panel_name,
    ac.agent_name,
    ac.agent_type,
    ac.status,
    ac.is_enabled,
    ac.version,
    ac.created_at,
    ac.updated_at,
    COUNT(DISTINCT ads.id) as data_source_count,
    COUNT(DISTINCT ai.id) as integration_count,
    COUNT(DISTINCT ad.id) as deployment_count,
    COALESCE(ad_latest.deployment_status, 'not_deployed') as latest_deployment_status
FROM agent_configurations ac
JOIN ai_agent_config_panels p ON ac.panel_id = p.id
LEFT JOIN agent_data_sources ads ON ac.id = ads.agent_config_id AND ads.is_enabled = true
LEFT JOIN agent_integrations ai ON ac.id = ai.agent_config_id AND ai.is_enabled = true
LEFT JOIN agent_deployments ad ON ac.id = ad.agent_config_id
LEFT JOIN LATERAL (
    SELECT deployment_status
    FROM agent_deployments
    WHERE agent_config_id = ac.id
    ORDER BY deployed_at DESC
    LIMIT 1
) ad_latest ON true
GROUP BY ac.id, ac.panel_id, p.panel_name, ac.agent_name, ac.agent_type, 
         ac.status, ac.is_enabled, ac.version, ac.created_at, ac.updated_at,
         ad_latest.deployment_status;

CREATE VIEW agent_performance_summary AS
SELECT 
    ac.id as agent_config_id,
    ac.agent_name,
    ac.agent_type,
    ac.status,
    COUNT(DISTINCT apr.id) as report_count,
    AVG(CASE WHEN tr.test_success THEN 1.0 ELSE 0.0 END) as test_success_rate,
    COUNT(DISTINCT CASE WHEN tr.test_success = true THEN tr.id END) as successful_tests,
    COUNT(DISTINCT tr.id) as total_tests,
    MAX(tr.test_completed_at) as last_test_date,
    COUNT(DISTINCT ad.id) as deployment_count,
    MAX(ad.deployed_at) as last_deployment_date
FROM agent_configurations ac
LEFT JOIN agent_performance_reports apr ON ac.id = apr.agent_config_id
LEFT JOIN agent_test_results tr ON ac.id = tr.agent_config_id
LEFT JOIN agent_deployments ad ON ac.id = ad.agent_config_id
WHERE ac.is_enabled = true
GROUP BY ac.id, ac.agent_name, ac.agent_type, ac.status;

CREATE VIEW agent_compliance_status AS
SELECT 
    ac.id as agent_config_id,
    ac.agent_name,
    ac.agent_type,
    acf.regulatory_framework,
    acf.compliance_status,
    acf.last_compliance_check,
    acf.next_compliance_check,
    COUNT(DISTINCT aal.id) as audit_log_count,
    MAX(aal.timestamp) as last_audit_entry
FROM agent_configurations ac
LEFT JOIN agent_compliance_framework acf ON ac.id = acf.agent_config_id
LEFT JOIN agent_audit_log aal ON ac.id = aal.agent_config_id
GROUP BY ac.id, ac.agent_name, ac.agent_type, acf.regulatory_framework,
         acf.compliance_status, acf.last_compliance_check, acf.next_compliance_check;

-- Insert sample data for testing
INSERT INTO ai_agent_config_panels (user_id, panel_name, description, panel_settings, is_active)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Trading Strategy Hub', 'Main configuration panel for automated trading strategies', 
     '{"layoutSettings": {"layoutType": "grid"}, "themeSettings": {"themeType": "professional"}}'::jsonb, true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Risk Management Center', 'Centralized risk management and monitoring panel', 
     '{"layoutSettings": {"layoutType": "tabs"}, "themeSettings": {"themeType": "minimal"}}'::jsonb, true);

-- Insert sample agent templates
INSERT INTO agent_templates (template_name, template_type, agent_type, template_config, description, category, tags, is_active, is_public)
VALUES 
    ('Momentum Trading Strategy', 'trading', 'trading', 
     '{"strategyType": "momentum", "executionMode": "semi_automatic", "riskLimits": {"maxPositionSize": 0.1}}'::jsonb,
     'Template for momentum-based trading strategies', 'trading', '["momentum", "trading", "equities"]'::jsonb, true, true),
    ('Risk Monitor Agent', 'monitoring', 'risk_management', 
     '{"monitoringScope": ["portfolio", "positions"], "alertThresholds": {"maxDrawdown": 0.05}}'::jsonb,
     'Template for portfolio risk monitoring', 'risk', '["risk", "monitoring", "portfolio"]'::jsonb, true, true);

-- Comment on tables and columns
COMMENT ON TABLE ai_agent_config_panels IS 'Main configuration panels for AI agent management';
COMMENT ON TABLE agent_configurations IS 'Individual AI agent configurations with all settings';
COMMENT ON TABLE agent_configuration_history IS 'Version tracking and change history for agent configurations';
COMMENT ON TABLE agent_validation_results IS 'Results of configuration validation checks';
COMMENT ON TABLE agent_test_results IS 'Results of agent testing including backtests and connectivity tests';
COMMENT ON TABLE agent_deployments IS 'Active deployments and deployment history';
COMMENT ON TABLE agent_monitoring_metrics IS 'Real-time performance and health monitoring metrics';
COMMENT ON TABLE agent_notifications IS 'Notification and alert management';
COMMENT ON TABLE agent_data_sources IS 'External data source configurations and health';
COMMENT ON TABLE agent_integrations IS 'External system integrations';
COMMENT ON TABLE agent_compliance_framework IS 'Regulatory compliance tracking and requirements';
COMMENT ON TABLE agent_audit_log IS 'Comprehensive audit trail for all agent activities';
COMMENT ON TABLE agent_performance_reports IS 'Scheduled performance reporting and analysis';
COMMENT ON TABLE agent_templates IS 'Reusable configuration templates';

COMMENT ON COLUMN agent_configurations.core_config IS 'JSON configuration for core agent settings including execution, market scope, and trading parameters';
COMMENT ON COLUMN agent_configurations.strategy_params IS 'JSON configuration for strategy-specific parameters and indicators';
COMMENT ON COLUMN agent_configurations.risk_config IS 'JSON configuration for risk limits, stop losses, and risk management';
COMMENT ON COLUMN agent_configurations.compliance_config IS 'JSON configuration for regulatory compliance settings';
COMMENT ON COLUMN agent_deployments.deployment_environment IS 'Deployment environment: development, testing, staging, or production';
COMMENT ON COLUMN agent_compliance_framework.regulatory_framework IS 'Regulatory framework: ASIC (Australia), FMA (New Zealand), etc.'; 