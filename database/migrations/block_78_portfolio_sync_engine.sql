-- Block 78: Portfolio Sync Engine - Database Migration
-- Real-time Portfolio Synchronization with External Brokers

-- Main portfolio sync engines table
CREATE TABLE portfolio_sync_engines (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    
    -- Engine identification
    engine_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuration
    sync_config JSON NOT NULL,
    
    -- Sync status
    sync_status JSON NOT NULL,
    last_sync_attempt TIMESTAMP NULL,
    last_successful_sync TIMESTAMP NULL,
    
    -- Conflict resolution
    conflict_resolution JSON NOT NULL,
    
    -- Error handling
    error_handling JSON NOT NULL,
    
    -- Performance metrics
    performance_metrics JSON NOT NULL,
    
    -- Scheduling
    sync_schedule JSON NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_engine_name (engine_name),
    INDEX idx_is_active (is_active),
    INDEX idx_last_sync_attempt (last_sync_attempt),
    INDEX idx_last_successful_sync (last_successful_sync),
    INDEX idx_created_at (created_at)
);

-- Broker connections table
CREATE TABLE broker_connections (
    id VARCHAR(255) PRIMARY KEY,
    engine_id VARCHAR(255) NOT NULL,
    
    -- Broker identification
    broker_name VARCHAR(255) NOT NULL,
    broker_type VARCHAR(50) NOT NULL CHECK (broker_type IN (
        'full_service', 'discount', 'robo_advisor', 'crypto_exchange', 'bank_broker',
        'selfwealth', 'commsec', 'nabtrade', 'westpac', 'anz', 'asb_securities',
        'kiwibank', 'sharesight', 'stake', 'tiger', 'interactive_brokers'
    )),
    
    -- Connection details
    connection_config JSON NOT NULL,
    connection_status VARCHAR(20) NOT NULL DEFAULT 'disconnected' CHECK (connection_status IN (
        'connected', 'disconnected', 'connecting', 'error', 'rate_limited', 'maintenance', 'suspended'
    )),
    
    -- Authentication
    auth_config JSON NOT NULL,
    
    -- API configuration
    api_config JSON NOT NULL,
    
    -- Sync settings
    sync_settings JSON NOT NULL,
    
    -- Performance metrics
    connection_metrics JSON NOT NULL,
    
    -- AU/NZ specific
    jurisdiction VARCHAR(2) NOT NULL CHECK (jurisdiction IN ('AU', 'NZ')),
    regulatory_compliance JSON NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_connected TIMESTAMP NULL,
    last_data_received TIMESTAMP NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (engine_id) REFERENCES portfolio_sync_engines(id) ON DELETE CASCADE,
    INDEX idx_engine_id (engine_id),
    INDEX idx_broker_name (broker_name),
    INDEX idx_broker_type (broker_type),
    INDEX idx_connection_status (connection_status),
    INDEX idx_jurisdiction (jurisdiction),
    INDEX idx_is_active (is_active),
    INDEX idx_last_connected (last_connected)
);

-- Sync operations table
CREATE TABLE sync_operations (
    id VARCHAR(255) PRIMARY KEY,
    engine_id VARCHAR(255) NOT NULL,
    
    -- Operation details
    operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN (
        'full_sync', 'incremental_sync', 'delta_sync', 'reconciliation', 'validation', 'cleanup'
    )),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    estimated_completion TIMESTAMP NULL,
    
    -- Brokers involved
    broker_ids JSON NOT NULL,
    
    -- Data types
    data_types JSON NOT NULL,
    
    -- Progress tracking
    total_records INT DEFAULT 0,
    processed_records INT DEFAULT 0,
    failed_records INT DEFAULT 0,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'paused', 'cancelled'
    )),
    current_step VARCHAR(255),
    
    -- Results
    sync_summary JSON,
    
    -- Configuration
    sync_config JSON NOT NULL,
    
    -- Error information
    error_details JSON,
    
    -- Metadata
    triggered_by VARCHAR(20) NOT NULL CHECK (triggered_by IN (
        'manual', 'scheduled', 'real_time', 'event_based', 'api_call'
    )),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (engine_id) REFERENCES portfolio_sync_engines(id) ON DELETE CASCADE,
    INDEX idx_engine_id (engine_id),
    INDEX idx_operation_type (operation_type),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time),
    INDEX idx_triggered_by (triggered_by),
    INDEX idx_created_at (created_at)
);

-- Sync records table (historical sync data)
CREATE TABLE sync_records (
    id VARCHAR(255) PRIMARY KEY,
    engine_id VARCHAR(255) NOT NULL,
    sync_id VARCHAR(255) NOT NULL,
    
    -- Sync details
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration INT NOT NULL, -- seconds
    
    -- Configuration
    sync_mode VARCHAR(20) NOT NULL CHECK (sync_mode IN ('manual', 'automatic', 'scheduled', 'real_time')),
    brokers_involved JSON NOT NULL,
    data_types_involved JSON NOT NULL,
    
    -- Results
    status VARCHAR(20) NOT NULL CHECK (status IN (
        'completed', 'failed', 'partial', 'cancelled'
    )),
    records_processed INT DEFAULT 0,
    records_successful INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    
    -- Performance metrics
    avg_processing_time DECIMAL(10, 3) NOT NULL, -- milliseconds per record
    data_volume DECIMAL(10, 3) NOT NULL, -- MB
    
    -- Issues
    issues_count INT DEFAULT 0,
    critical_issues_count INT DEFAULT 0,
    
    -- Trigger information
    triggered_by VARCHAR(20) NOT NULL CHECK (triggered_by IN (
        'manual', 'scheduled', 'real_time', 'event_based', 'api_call'
    )),
    triggered_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NOT NULL,
    
    -- Additional data
    sync_details JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (engine_id) REFERENCES portfolio_sync_engines(id) ON DELETE CASCADE,
    INDEX idx_engine_id (engine_id),
    INDEX idx_sync_id (sync_id),
    INDEX idx_start_time (start_time),
    INDEX idx_status (status),
    INDEX idx_sync_mode (sync_mode),
    INDEX idx_triggered_by (triggered_by)
);

-- Sync issues table
CREATE TABLE sync_issues (
    id VARCHAR(255) PRIMARY KEY,
    engine_id VARCHAR(255) NOT NULL,
    operation_id VARCHAR(255),
    
    -- Issue identification
    issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN (
        'connection_error', 'authentication_error', 'api_error', 'data_validation_error',
        'rate_limit_exceeded', 'timeout', 'data_conflict', 'mapping_error', 'compliance_violation'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    
    -- Issue details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    broker_id VARCHAR(255),
    data_type VARCHAR(50),
    
    -- Occurrence tracking
    first_occurrence TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_occurrence TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    occurrence_count INT DEFAULT 1,
    
    -- Resolution
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
    resolution_steps JSON,
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(255),
    
    -- Impact assessment
    impact_level VARCHAR(20) NOT NULL CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
    affected_records INT DEFAULT 0,
    
    -- Additional context
    context_data JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (engine_id) REFERENCES portfolio_sync_engines(id) ON DELETE CASCADE,
    FOREIGN KEY (operation_id) REFERENCES sync_operations(id) ON DELETE SET NULL,
    INDEX idx_engine_id (engine_id),
    INDEX idx_operation_id (operation_id),
    INDEX idx_issue_type (issue_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_first_occurrence (first_occurrence),
    INDEX idx_impact_level (impact_level)
);

-- Sync conflicts table
CREATE TABLE sync_conflicts (
    id VARCHAR(255) PRIMARY KEY,
    engine_id VARCHAR(255) NOT NULL,
    operation_id VARCHAR(255),
    
    -- Conflict identification
    conflict_id VARCHAR(255) NOT NULL UNIQUE,
    broker_id VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    
    -- Conflict details
    field_name VARCHAR(255) NOT NULL,
    internal_value JSON NOT NULL,
    broker_value JSON NOT NULL,
    
    -- Metadata
    record_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Resolution
    suggested_resolution VARCHAR(50) CHECK (suggested_resolution IN (
        'broker_wins', 'internal_wins', 'merge', 'manual_review', 'timestamp_based', 'value_based'
    )),
    confidence INT CHECK (confidence >= 0 AND confidence <= 100),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'resolved', 'escalated', 'ignored'
    )),
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(255),
    resolution_method VARCHAR(50),
    
    -- Additional context
    conflict_context JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (engine_id) REFERENCES portfolio_sync_engines(id) ON DELETE CASCADE,
    FOREIGN KEY (operation_id) REFERENCES sync_operations(id) ON DELETE SET NULL,
    FOREIGN KEY (broker_id) REFERENCES broker_connections(id) ON DELETE CASCADE,
    INDEX idx_engine_id (engine_id),
    INDEX idx_operation_id (operation_id),
    INDEX idx_broker_id (broker_id),
    INDEX idx_conflict_id (conflict_id),
    INDEX idx_data_type (data_type),
    INDEX idx_status (status),
    INDEX idx_timestamp (timestamp)
);

-- API endpoints table (for broker configurations)
CREATE TABLE api_endpoints (
    id VARCHAR(255) PRIMARY KEY,
    broker_id VARCHAR(255) NOT NULL,
    
    -- Endpoint details
    endpoint_name VARCHAR(255) NOT NULL,
    endpoint_path VARCHAR(500) NOT NULL,
    http_method VARCHAR(10) NOT NULL CHECK (http_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    description TEXT,
    
    -- Parameters
    required_params JSON,
    optional_params JSON,
    
    -- Headers
    required_headers JSON,
    custom_headers JSON,
    
    -- Response configuration
    response_fields JSON,
    
    -- Rate limiting
    rate_limit_tier VARCHAR(50),
    requests_per_second INT,
    requests_per_minute INT,
    requests_per_hour INT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_tested TIMESTAMP NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (broker_id) REFERENCES broker_connections(id) ON DELETE CASCADE,
    INDEX idx_broker_id (broker_id),
    INDEX idx_endpoint_name (endpoint_name),
    INDEX idx_http_method (http_method),
    INDEX idx_is_active (is_active)
);

-- Field mappings table (for data transformation)
CREATE TABLE field_mappings (
    id VARCHAR(255) PRIMARY KEY,
    broker_id VARCHAR(255) NOT NULL,
    
    -- Mapping details
    internal_field VARCHAR(255) NOT NULL,
    broker_field VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'date', 'array', 'object')),
    
    -- Transformation
    transformation_type VARCHAR(50) CHECK (transformation_type IN (
        'format_date', 'convert_currency', 'normalize_text', 'map_values', 
        'calculate_field', 'split_field', 'combine_fields'
    )),
    transformation_config JSON,
    
    -- Validation
    is_required BOOLEAN DEFAULT FALSE,
    validation_rules JSON,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (broker_id) REFERENCES broker_connections(id) ON DELETE CASCADE,
    INDEX idx_broker_id (broker_id),
    INDEX idx_internal_field (internal_field),
    INDEX idx_broker_field (broker_field),
    INDEX idx_data_type (data_type),
    INDEX idx_is_active (is_active)
);

-- Error mappings table (for error handling)
CREATE TABLE error_mappings (
    id VARCHAR(255) PRIMARY KEY,
    broker_id VARCHAR(255) NOT NULL,
    
    -- Error identification
    broker_error_code VARCHAR(100) NOT NULL,
    broker_error_message TEXT,
    
    -- Internal mapping
    internal_error_code VARCHAR(100) NOT NULL,
    internal_error_message TEXT NOT NULL,
    
    -- Error classification
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    error_type VARCHAR(50) NOT NULL,
    
    -- Handling
    is_retryable BOOLEAN DEFAULT FALSE,
    retry_strategy VARCHAR(50),
    
    -- Additional context
    error_context JSON,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (broker_id) REFERENCES broker_connections(id) ON DELETE CASCADE,
    INDEX idx_broker_id (broker_id),
    INDEX idx_broker_error_code (broker_error_code),
    INDEX idx_internal_error_code (internal_error_code),
    INDEX idx_severity (severity),
    INDEX idx_is_retryable (is_retryable)
);

-- Performance metrics table (detailed performance tracking)
CREATE TABLE sync_performance_metrics (
    id VARCHAR(255) PRIMARY KEY,
    engine_id VARCHAR(255) NOT NULL,
    operation_id VARCHAR(255),
    
    -- Timing
    measurement_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Throughput metrics
    records_per_second DECIMAL(10, 3) NOT NULL,
    bytes_per_second DECIMAL(12, 3) NOT NULL,
    
    -- Latency metrics
    avg_response_time DECIMAL(10, 3) NOT NULL, -- milliseconds
    p95_response_time DECIMAL(10, 3) NOT NULL,
    p99_response_time DECIMAL(10, 3) NOT NULL,
    
    -- Resource usage
    cpu_usage DECIMAL(5, 2) NOT NULL, -- percentage
    memory_usage DECIMAL(10, 3) NOT NULL, -- MB
    network_usage DECIMAL(10, 3) NOT NULL, -- KB/s
    
    -- Quality metrics
    data_quality_score DECIMAL(5, 2) NOT NULL, -- 0-100
    validation_pass_rate DECIMAL(5, 2) NOT NULL, -- percentage
    
    -- Reliability metrics
    sync_success_rate DECIMAL(5, 2) NOT NULL, -- percentage
    connection_stability DECIMAL(5, 2) NOT NULL, -- percentage
    
    -- Error metrics
    error_rate DECIMAL(5, 2) NOT NULL, -- percentage
    
    -- Additional metrics
    additional_metrics JSON,
    
    FOREIGN KEY (engine_id) REFERENCES portfolio_sync_engines(id) ON DELETE CASCADE,
    FOREIGN KEY (operation_id) REFERENCES sync_operations(id) ON DELETE CASCADE,
    INDEX idx_engine_id (engine_id),
    INDEX idx_operation_id (operation_id),
    INDEX idx_measurement_time (measurement_time)
);

-- Broker compliance requirements table (AU/NZ specific)
CREATE TABLE broker_compliance_requirements (
    id VARCHAR(255) PRIMARY KEY,
    broker_id VARCHAR(255) NOT NULL,
    
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
        'compliant', 'non_compliant', 'under_review', 'not_applicable'
    )),
    
    -- Dates
    effective_date DATE NOT NULL,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_review_date DATE,
    
    -- Documentation
    documentation_required BOOLEAN DEFAULT FALSE,
    documentation_provided BOOLEAN DEFAULT FALSE,
    
    -- Audit trail
    audit_frequency VARCHAR(20) CHECK (audit_frequency IN ('monthly', 'quarterly', 'annually')),
    last_audit_date DATE,
    next_audit_date DATE,
    
    -- Additional details
    compliance_details JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (broker_id) REFERENCES broker_connections(id) ON DELETE CASCADE,
    INDEX idx_broker_id (broker_id),
    INDEX idx_requirement_id (requirement_id),
    INDEX idx_jurisdiction (jurisdiction),
    INDEX idx_compliance_status (compliance_status),
    INDEX idx_effective_date (effective_date),
    INDEX idx_last_checked (last_checked)
);

-- Sync schedules table (detailed scheduling)
CREATE TABLE sync_schedules (
    id VARCHAR(255) PRIMARY KEY,
    engine_id VARCHAR(255) NOT NULL,
    
    -- Schedule identification
    schedule_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Schedule configuration
    is_enabled BOOLEAN DEFAULT TRUE,
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('cron', 'interval', 'fixed_time', 'market_based', 'event_driven')),
    
    -- Timing configuration
    cron_expression VARCHAR(100),
    interval_minutes INT,
    
    -- Recurrence pattern
    recurrence_pattern JSON NOT NULL,
    
    -- Execution window
    execution_window JSON NOT NULL,
    
    -- Conditions
    execution_conditions JSON,
    
    -- Schedule status
    next_execution TIMESTAMP,
    last_execution TIMESTAMP,
    execution_count INT DEFAULT 0,
    
    -- Timezone
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Market alignment
    align_with_market_hours BOOLEAN DEFAULT FALSE,
    markets JSON,
    
    -- Blackout periods
    blackout_periods JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (engine_id) REFERENCES portfolio_sync_engines(id) ON DELETE CASCADE,
    INDEX idx_engine_id (engine_id),
    INDEX idx_schedule_name (schedule_name),
    INDEX idx_is_enabled (is_enabled),
    INDEX idx_schedule_type (schedule_type),
    INDEX idx_next_execution (next_execution),
    INDEX idx_last_execution (last_execution)
);

-- Create views for easier querying
CREATE VIEW sync_engine_summary AS
SELECT 
    pse.id,
    pse.user_id,
    pse.engine_name,
    pse.is_active,
    pse.last_sync_attempt,
    pse.last_successful_sync,
    COUNT(DISTINCT bc.id) as connected_brokers,
    COUNT(DISTINCT CASE WHEN bc.connection_status = 'connected' THEN bc.id END) as active_brokers,
    COUNT(DISTINCT so.id) as total_operations,
    COUNT(DISTINCT CASE WHEN so.status = 'completed' THEN so.id END) as successful_operations,
    COUNT(DISTINCT si.id) as active_issues,
    COUNT(DISTINCT CASE WHEN si.severity = 'critical' THEN si.id END) as critical_issues
FROM portfolio_sync_engines pse
LEFT JOIN broker_connections bc ON pse.id = bc.engine_id
LEFT JOIN sync_operations so ON pse.id = so.engine_id
LEFT JOIN sync_issues si ON pse.id = si.engine_id AND si.status = 'open'
GROUP BY pse.id, pse.user_id, pse.engine_name, pse.is_active, pse.last_sync_attempt, pse.last_successful_sync;

CREATE VIEW active_sync_operations AS
SELECT 
    so.*,
    pse.engine_name,
    pse.user_id
FROM sync_operations so
JOIN portfolio_sync_engines pse ON so.engine_id = pse.id
WHERE so.status IN ('pending', 'running', 'paused')
ORDER BY so.start_time DESC;

CREATE VIEW broker_connection_status AS
SELECT 
    bc.*,
    pse.engine_name,
    pse.user_id,
    COUNT(DISTINCT si.id) as issue_count,
    COUNT(DISTINCT CASE WHEN si.severity = 'critical' THEN si.id END) as critical_issue_count
FROM broker_connections bc
JOIN portfolio_sync_engines pse ON bc.engine_id = pse.id
LEFT JOIN sync_issues si ON bc.id = si.broker_id AND si.status = 'open'
GROUP BY bc.id, bc.engine_id, bc.broker_name, bc.broker_type, bc.connection_status, bc.is_active, bc.last_connected, bc.jurisdiction, pse.engine_name, pse.user_id;

-- Add indexes for performance optimization
CREATE INDEX idx_sync_records_composite ON sync_records(engine_id, status, start_time);
CREATE INDEX idx_sync_issues_composite ON sync_issues(engine_id, status, severity);
CREATE INDEX idx_sync_conflicts_composite ON sync_conflicts(engine_id, status, timestamp);
CREATE INDEX idx_performance_metrics_time ON sync_performance_metrics(engine_id, measurement_time);

-- Add triggers for automatic updates
DELIMITER //

CREATE TRIGGER update_sync_engine_timestamp
BEFORE UPDATE ON portfolio_sync_engines
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_broker_connection_timestamp
BEFORE UPDATE ON broker_connections
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_sync_operation_timestamp
BEFORE UPDATE ON sync_operations
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_last_sync_on_completion
AFTER UPDATE ON sync_operations
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE portfolio_sync_engines 
        SET last_successful_sync = NEW.end_time, updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.engine_id;
    END IF;
    
    IF NEW.status IN ('failed', 'cancelled') AND OLD.status NOT IN ('failed', 'cancelled') THEN
        UPDATE portfolio_sync_engines 
        SET last_sync_attempt = NEW.end_time, updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.engine_id;
    END IF;
END//

DELIMITER ;

-- Insert default broker types and configurations
INSERT INTO api_endpoints (id, broker_id, endpoint_name, endpoint_path, http_method, description, rate_limit_tier, requests_per_second, requests_per_minute, requests_per_hour) VALUES
('endpoint_default_holdings', 'TEMPLATE', 'Holdings', '/api/v1/holdings', 'GET', 'Retrieve current portfolio holdings', 'standard', 2, 60, 1000),
('endpoint_default_transactions', 'TEMPLATE', 'Transactions', '/api/v1/transactions', 'GET', 'Retrieve transaction history', 'standard', 1, 30, 500),
('endpoint_default_balances', 'TEMPLATE', 'Account Balances', '/api/v1/accounts/balances', 'GET', 'Retrieve account balances', 'high', 5, 120, 2000),
('endpoint_default_dividends', 'TEMPLATE', 'Dividends', '/api/v1/dividends', 'GET', 'Retrieve dividend payments', 'standard', 1, 20, 300),
('endpoint_default_orders', 'TEMPLATE', 'Orders', '/api/v1/orders', 'GET', 'Retrieve order status', 'high', 3, 100, 1500);

-- Add comments for documentation
ALTER TABLE portfolio_sync_engines COMMENT = 'Main portfolio synchronization engines';
ALTER TABLE broker_connections COMMENT = 'External broker connection configurations';
ALTER TABLE sync_operations COMMENT = 'Active and historical sync operations';
ALTER TABLE sync_records COMMENT = 'Historical sync performance and results';
ALTER TABLE sync_issues COMMENT = 'Sync issues and error tracking';
ALTER TABLE sync_conflicts COMMENT = 'Data conflicts requiring resolution';
ALTER TABLE field_mappings COMMENT = 'Data field transformation mappings';
ALTER TABLE error_mappings COMMENT = 'Broker error code mappings';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio_sync_engines TO 'stackmotive_app'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON broker_connections TO 'stackmotive_app'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON sync_operations TO 'stackmotive_app'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON sync_records TO 'stackmotive_app'@'%';

-- Portfolio Sync Engine Migration Complete
-- Block 78: Real-time portfolio synchronization with external brokers
-- Supports: AU/NZ broker integration, conflict resolution, performance monitoring, compliance tracking 