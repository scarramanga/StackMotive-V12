-- Block 81: Integration Manager - Database Migration
-- External API Integrations and Data Feed Management

-- Main integration managers table
CREATE TABLE integration_managers (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    
    -- Manager identification
    manager_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuration
    integration_config JSON NOT NULL,
    
    -- Status and monitoring
    manager_status JSON NOT NULL,
    last_health_check TIMESTAMP NULL,
    
    -- Performance metrics
    performance_metrics JSON NOT NULL,
    
    -- Error handling
    error_handling JSON NOT NULL,
    
    -- Security settings
    security_config JSON NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_manager_name (manager_name),
    INDEX idx_is_active (is_active),
    INDEX idx_last_health_check (last_health_check)
);

-- Integrations table
CREATE TABLE integrations (
    id VARCHAR(255) PRIMARY KEY,
    manager_id VARCHAR(255) NOT NULL,
    
    -- Integration identification
    integration_name VARCHAR(255) NOT NULL,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN (
        'broker_api', 'market_data', 'news_feed', 'economic_data', 'tax_service',
        'bank_api', 'crypto_exchange', 'data_vendor', 'social_sentiment', 
        'webhook', 'file_import', 'database', 'custom'
    )),
    provider VARCHAR(50) NOT NULL CHECK (provider IN (
        'commsec', 'nabtrade', 'westpac', 'anz', 'asb_securities', 'sharesight',
        'yahoo_finance', 'alpha_vantage', 'iex_cloud', 'quandl', 'reuters', 'bloomberg',
        'ato_business_portal', 'ird_services', 'rba_data', 'rbnz_data', 'asx_data', 'nzx_data', 'custom'
    )),
    
    -- Configuration
    config JSON NOT NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'inactive' CHECK (status IN (
        'active', 'inactive', 'connecting', 'disconnected', 'error', 'maintenance', 'rate_limited', 'suspended'
    )),
    is_enabled BOOLEAN DEFAULT TRUE,
    
    -- Data flow
    data_flow JSON NOT NULL,
    
    -- Monitoring
    monitoring_config JSON NOT NULL,
    
    -- Security
    security_settings JSON NOT NULL,
    
    -- Performance
    performance_metrics JSON NOT NULL,
    
    -- AU/NZ specific
    jurisdiction VARCHAR(2) CHECK (jurisdiction IN ('AU', 'NZ')),
    compliance_settings JSON,
    
    -- Metadata
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (manager_id) REFERENCES integration_managers(id) ON DELETE CASCADE,
    INDEX idx_manager_id (manager_id),
    INDEX idx_integration_name (integration_name),
    INDEX idx_integration_type (integration_type),
    INDEX idx_provider (provider),
    INDEX idx_status (status),
    INDEX idx_jurisdiction (jurisdiction),
    INDEX idx_is_enabled (is_enabled)
);

-- Connection information table
CREATE TABLE integration_connections (
    id VARCHAR(255) PRIMARY KEY,
    integration_id VARCHAR(255) NOT NULL,
    
    -- Connection details
    connection_id VARCHAR(255) NOT NULL,
    connection_url VARCHAR(500) NOT NULL,
    
    -- Connection status
    is_connected BOOLEAN DEFAULT FALSE,
    last_connected TIMESTAMP NULL,
    last_disconnected TIMESTAMP NULL,
    
    -- Connection metrics
    connection_count INT DEFAULT 0,
    total_uptime INT DEFAULT 0, -- seconds
    
    -- Health status
    health_status VARCHAR(20) NOT NULL DEFAULT 'unknown' CHECK (health_status IN (
        'healthy', 'degraded', 'unhealthy', 'unknown'
    )),
    last_health_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Network info
    ip_address VARCHAR(45),
    region VARCHAR(100),
    
    -- SSL/TLS info
    ssl_info JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
    INDEX idx_integration_id (integration_id),
    INDEX idx_connection_id (connection_id),
    INDEX idx_health_status (health_status),
    INDEX idx_is_connected (is_connected),
    INDEX idx_last_connected (last_connected)
);

-- Health check logs table
CREATE TABLE integration_health_logs (
    id VARCHAR(255) PRIMARY KEY,
    integration_id VARCHAR(255) NOT NULL,
    
    -- Health check details
    check_type VARCHAR(50) NOT NULL CHECK (check_type IN (
        'connectivity', 'authentication', 'health_endpoint', 'data_flow', 'full_check'
    )),
    check_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Results
    status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'failed', 'warning')),
    health_score INT CHECK (health_score >= 0 AND health_score <= 100),
    response_time INT, -- milliseconds
    
    -- Details
    check_details JSON,
    error_message TEXT,
    recommendations JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
    INDEX idx_integration_id (integration_id),
    INDEX idx_check_type (check_type),
    INDEX idx_check_time (check_time),
    INDEX idx_status (status)
);

-- Integration alerts table
CREATE TABLE integration_alerts (
    id VARCHAR(255) PRIMARY KEY,
    integration_id VARCHAR(255) NOT NULL,
    manager_id VARCHAR(255) NOT NULL,
    
    -- Alert identification
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'connection_failed', 'high_error_rate', 'slow_response', 'data_quality_issue',
        'rate_limit_exceeded', 'authentication_failed', 'health_check_failed', 'configuration_error'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    
    -- Alert details
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    description TEXT,
    
    -- Timing
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'snoozed')),
    
    -- Actions
    recommended_actions JSON,
    
    -- Context
    context_data JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES integration_managers(id) ON DELETE CASCADE,
    INDEX idx_integration_id (integration_id),
    INDEX idx_manager_id (manager_id),
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_triggered_at (triggered_at)
);

-- Activity logs table
CREATE TABLE integration_activity_logs (
    id VARCHAR(255) PRIMARY KEY,
    manager_id VARCHAR(255) NOT NULL,
    integration_id VARCHAR(255),
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'integration_connected', 'integration_disconnected', 'sync_completed', 'sync_failed',
        'alert_triggered', 'configuration_changed', 'health_check_failed', 'rate_limit_exceeded'
    )),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Activity description
    description TEXT NOT NULL,
    details JSON,
    
    -- Severity
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('debug', 'info', 'warn', 'error', 'fatal')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (manager_id) REFERENCES integration_managers(id) ON DELETE CASCADE,
    FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE SET NULL,
    INDEX idx_manager_id (manager_id),
    INDEX idx_integration_id (integration_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_timestamp (timestamp),
    INDEX idx_severity (severity)
);

-- API endpoints table
CREATE TABLE integration_endpoints (
    id VARCHAR(255) PRIMARY KEY,
    integration_id VARCHAR(255) NOT NULL,
    
    -- Endpoint details
    endpoint_name VARCHAR(255) NOT NULL,
    endpoint_path VARCHAR(500) NOT NULL,
    http_method VARCHAR(10) NOT NULL CHECK (http_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    description TEXT,
    
    -- Parameters
    required_params JSON,
    optional_params JSON,
    
    -- Headers
    custom_headers JSON,
    
    -- Response format
    response_format VARCHAR(20) NOT NULL CHECK (response_format IN ('json', 'xml', 'csv', 'text', 'binary')),
    
    -- Rate limiting
    rate_limit_tier VARCHAR(50),
    
    -- Caching
    cacheable BOOLEAN DEFAULT FALSE,
    cache_expiry INT, -- seconds
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
    INDEX idx_integration_id (integration_id),
    INDEX idx_endpoint_name (endpoint_name),
    INDEX idx_http_method (http_method),
    INDEX idx_is_active (is_active)
);

-- Data transformations table
CREATE TABLE integration_transformations (
    id VARCHAR(255) PRIMARY KEY,
    integration_id VARCHAR(255) NOT NULL,
    
    -- Transformation details
    transformation_name VARCHAR(255) NOT NULL,
    transformation_type VARCHAR(50) NOT NULL CHECK (transformation_type IN (
        'format_date', 'convert_currency', 'normalize_text', 'calculate_value',
        'lookup_value', 'split_field', 'combine_fields', 'regex_extract'
    )),
    
    -- Source and target
    source_field VARCHAR(255) NOT NULL,
    target_field VARCHAR(255) NOT NULL,
    
    -- Configuration
    transformation_config JSON NOT NULL,
    
    -- Validation
    is_required BOOLEAN DEFAULT FALSE,
    validation_rules JSON,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
    INDEX idx_integration_id (integration_id),
    INDEX idx_transformation_name (transformation_name),
    INDEX idx_transformation_type (transformation_type),
    INDEX idx_source_field (source_field),
    INDEX idx_is_active (is_active)
);

-- Performance metrics table
CREATE TABLE integration_performance_metrics (
    id VARCHAR(255) PRIMARY KEY,
    integration_id VARCHAR(255) NOT NULL,
    
    -- Timing
    measurement_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance metrics
    average_response_time DECIMAL(10, 3) NOT NULL, -- milliseconds
    p95_response_time DECIMAL(10, 3) NOT NULL,
    p99_response_time DECIMAL(10, 3) NOT NULL,
    
    -- Reliability metrics
    success_rate DECIMAL(5, 2) NOT NULL, -- percentage
    error_rate DECIMAL(5, 2) NOT NULL, -- percentage
    uptime_percentage DECIMAL(5, 2) NOT NULL,
    
    -- Throughput metrics
    requests_per_second DECIMAL(10, 3) NOT NULL,
    requests_per_hour DECIMAL(10, 3) NOT NULL,
    data_volume_per_hour DECIMAL(12, 3) NOT NULL, -- MB
    
    -- Quality metrics
    data_quality_score DECIMAL(5, 2) NOT NULL, -- 0-100
    validation_pass_rate DECIMAL(5, 2) NOT NULL, -- percentage
    
    -- Counts
    total_requests INT DEFAULT 0,
    total_data_processed DECIMAL(12, 3) DEFAULT 0, -- MB
    total_errors INT DEFAULT 0,
    
    -- Additional metrics
    additional_metrics JSON,
    
    FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
    INDEX idx_integration_id (integration_id),
    INDEX idx_measurement_time (measurement_time)
);

-- Compliance requirements table (AU/NZ specific)
CREATE TABLE integration_compliance_requirements (
    id VARCHAR(255) PRIMARY KEY,
    integration_id VARCHAR(255) NOT NULL,
    
    -- Requirement details
    requirement_id VARCHAR(100) NOT NULL,
    requirement_name VARCHAR(255) NOT NULL,
    jurisdiction VARCHAR(2) NOT NULL CHECK (jurisdiction IN ('AU', 'NZ')),
    regulatory_body VARCHAR(255) NOT NULL,
    
    -- Requirement description
    description TEXT NOT NULL,
    requirement_type VARCHAR(50) NOT NULL,
    
    -- Compliance status
    is_active BOOLEAN DEFAULT TRUE,
    compliance_status VARCHAR(20) NOT NULL DEFAULT 'compliant' CHECK (compliance_status IN (
        'compliant', 'non_compliant', 'partial', 'under_review'
    )),
    
    -- Dates
    effective_date DATE NOT NULL,
    last_assessment TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_review_date DATE,
    
    -- Documentation
    documentation_required BOOLEAN DEFAULT FALSE,
    documentation_provided BOOLEAN DEFAULT FALSE,
    
    -- Additional details
    compliance_details JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
    INDEX idx_integration_id (integration_id),
    INDEX idx_requirement_id (requirement_id),
    INDEX idx_jurisdiction (jurisdiction),
    INDEX idx_compliance_status (compliance_status),
    INDEX idx_effective_date (effective_date)
);

-- Create views for easier querying
CREATE VIEW integration_manager_summary AS
SELECT 
    im.id,
    im.user_id,
    im.manager_name,
    im.is_active,
    im.last_health_check,
    COUNT(DISTINCT i.id) as total_integrations,
    COUNT(DISTINCT CASE WHEN i.is_enabled = TRUE THEN i.id END) as active_integrations,
    COUNT(DISTINCT CASE WHEN ic.health_status = 'healthy' THEN i.id END) as healthy_integrations,
    COUNT(DISTINCT ia.id) as active_alerts,
    COUNT(DISTINCT CASE WHEN ia.severity = 'critical' THEN ia.id END) as critical_alerts
FROM integration_managers im
LEFT JOIN integrations i ON im.id = i.manager_id
LEFT JOIN integration_connections ic ON i.id = ic.integration_id
LEFT JOIN integration_alerts ia ON i.id = ia.integration_id AND ia.status = 'active'
GROUP BY im.id, im.user_id, im.manager_name, im.is_active, im.last_health_check;

CREATE VIEW active_integration_alerts AS
SELECT 
    ia.*,
    i.integration_name,
    i.provider,
    im.manager_name,
    im.user_id
FROM integration_alerts ia
JOIN integrations i ON ia.integration_id = i.id
JOIN integration_managers im ON ia.manager_id = im.id
WHERE ia.status = 'active'
ORDER BY ia.triggered_at DESC;

CREATE VIEW integration_health_status AS
SELECT 
    i.id as integration_id,
    i.integration_name,
    i.provider,
    i.status,
    ic.health_status,
    ic.last_health_check,
    ic.is_connected,
    ic.last_connected,
    pm.success_rate,
    pm.average_response_time,
    im.manager_name,
    im.user_id
FROM integrations i
JOIN integration_managers im ON i.manager_id = im.id
LEFT JOIN integration_connections ic ON i.id = ic.integration_id
LEFT JOIN (
    SELECT 
        integration_id,
        success_rate,
        average_response_time,
        ROW_NUMBER() OVER (PARTITION BY integration_id ORDER BY measurement_time DESC) as rn
    FROM integration_performance_metrics
) pm ON i.id = pm.integration_id AND pm.rn = 1;

-- Add indexes for performance optimization
CREATE INDEX idx_health_logs_composite ON integration_health_logs(integration_id, check_time, status);
CREATE INDEX idx_alerts_composite ON integration_alerts(integration_id, status, severity);
CREATE INDEX idx_activity_composite ON integration_activity_logs(manager_id, timestamp, severity);
CREATE INDEX idx_performance_time ON integration_performance_metrics(integration_id, measurement_time);

-- Add triggers for automatic updates
DELIMITER //

CREATE TRIGGER update_integration_manager_timestamp
BEFORE UPDATE ON integration_managers
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_integration_timestamp
BEFORE UPDATE ON integrations
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_connection_timestamp
BEFORE UPDATE ON integration_connections
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_alert_timestamp
BEFORE UPDATE ON integration_alerts
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

DELIMITER ;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON integration_managers TO 'stackmotive_app'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON integrations TO 'stackmotive_app'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON integration_connections TO 'stackmotive_app'@'%';

-- Integration Manager Migration Complete
-- Block 81: External API integrations and data feed management
-- Supports: Health monitoring, performance tracking, AU/NZ compliance, alert management 