-- Block 94: Trust Score Badge - Database Migration
-- Trust Score Metrics and Badge Visualization

-- Main trust score badges table
CREATE TABLE trust_score_badges (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    
    -- Badge identification
    badge_type VARCHAR(50) NOT NULL CHECK (badge_type IN (
        'portfolio', 'asset', 'strategy', 'manager', 'fund', 'advisor', 'platform'
    )),
    entity_id VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
        'portfolio', 'security', 'strategy', 'fund_manager', 'investment_fund', 'robo_advisor', 'trading_platform'
    )),
    
    -- Badge configuration
    badge_config JSON NOT NULL,
    
    -- Display settings
    display_settings JSON NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_badge_type (badge_type),
    INDEX idx_entity_id (entity_id),
    INDEX idx_entity_type (entity_type),
    INDEX idx_is_active (is_active),
    INDEX idx_last_calculated (last_calculated)
);

-- Trust scores table
CREATE TABLE trust_scores (
    id VARCHAR(255) PRIMARY KEY,
    badge_id VARCHAR(255) NOT NULL,
    
    -- Overall score
    overall_score DECIMAL(5, 2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    score_grade VARCHAR(2) NOT NULL CHECK (score_grade IN (
        'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'
    )),
    
    -- Confidence metrics
    confidence_metrics JSON NOT NULL,
    
    -- Performance metrics
    performance_metrics JSON NOT NULL,
    
    -- Risk assessment
    risk_assessment JSON NOT NULL,
    
    -- Consistency metrics
    consistency_metrics JSON NOT NULL,
    
    -- Transparency metrics
    transparency_metrics JSON NOT NULL,
    
    -- Market validation
    market_validation JSON NOT NULL,
    
    -- Time-based metrics
    time_based_metrics JSON NOT NULL,
    
    -- Calculation metadata
    calculation_info JSON NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (badge_id) REFERENCES trust_score_badges(id) ON DELETE CASCADE,
    INDEX idx_badge_id (badge_id),
    INDEX idx_overall_score (overall_score),
    INDEX idx_score_grade (score_grade)
);

-- Component scores table
CREATE TABLE component_scores (
    id VARCHAR(255) PRIMARY KEY,
    trust_score_id VARCHAR(255) NOT NULL,
    
    -- Component identification
    component_id VARCHAR(100) NOT NULL,
    component_name VARCHAR(255) NOT NULL,
    component_type VARCHAR(50) NOT NULL CHECK (component_type IN (
        'performance', 'risk', 'consistency', 'transparency', 'market_validation', 'fees', 'service_quality'
    )),
    
    -- Score details
    score DECIMAL(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
    weight DECIMAL(3, 2) NOT NULL CHECK (weight >= 0 AND weight <= 1),
    contribution DECIMAL(5, 2) NOT NULL,
    
    -- Quality indicators
    data_quality DECIMAL(5, 2) NOT NULL,
    calculation_quality DECIMAL(5, 2) NOT NULL,
    validation_quality DECIMAL(5, 2) NOT NULL,
    overall_quality DECIMAL(5, 2) NOT NULL,
    
    -- Calculation details
    calculation_method VARCHAR(100) NOT NULL,
    data_points INT NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Historical comparison
    one_month_ago DECIMAL(5, 2),
    three_months_ago DECIMAL(5, 2),
    one_year_ago DECIMAL(5, 2),
    all_time_high DECIMAL(5, 2),
    all_time_low DECIMAL(5, 2),
    
    -- Sub-components data
    sub_components JSON,
    
    -- Trend data
    trend_direction VARCHAR(20) CHECK (trend_direction IN ('improving', 'stable', 'declining')),
    trend_strength DECIMAL(3, 2),
    trend_duration INT,
    projected_score DECIMAL(5, 2),
    trend_confidence DECIMAL(3, 2),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_score_id) REFERENCES trust_scores(id) ON DELETE CASCADE,
    INDEX idx_trust_score_id (trust_score_id),
    INDEX idx_component_id (component_id),
    INDEX idx_component_type (component_type),
    INDEX idx_score (score),
    INDEX idx_trend_direction (trend_direction)
);

-- Trust score history table
CREATE TABLE trust_score_history (
    id VARCHAR(255) PRIMARY KEY,
    badge_id VARCHAR(255) NOT NULL,
    
    -- Score snapshot
    score DECIMAL(5, 2) NOT NULL,
    grade VARCHAR(2) NOT NULL,
    
    -- Component breakdown
    component_breakdown JSON NOT NULL,
    
    -- Metadata
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_as_of_date TIMESTAMP NOT NULL,
    calculation_version VARCHAR(50) NOT NULL,
    
    -- Changes from previous
    absolute_change DECIMAL(5, 2),
    percentage_change DECIMAL(8, 4),
    change_direction VARCHAR(20) CHECK (change_direction IN ('up', 'down', 'stable')),
    significant_change BOOLEAN DEFAULT FALSE,
    
    -- Quality indicators
    quality_score DECIMAL(5, 2) NOT NULL,
    confidence DECIMAL(5, 2) NOT NULL,
    
    -- Contextual events
    contextual_events JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (badge_id) REFERENCES trust_score_badges(id) ON DELETE CASCADE,
    INDEX idx_badge_id (badge_id),
    INDEX idx_calculation_date (calculation_date),
    INDEX idx_score (score),
    INDEX idx_grade (grade),
    INDEX idx_change_direction (change_direction)
);

-- Data sources table
CREATE TABLE trust_score_data_sources (
    id VARCHAR(255) PRIMARY KEY,
    source_id VARCHAR(100) NOT NULL UNIQUE,
    
    -- Source details
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN (
        'internal', 'external', 'market_data', 'regulatory'
    )),
    
    -- Reliability metrics
    reliability DECIMAL(5, 2) NOT NULL CHECK (reliability >= 0 AND reliability <= 100),
    
    -- Connection info
    endpoint_url VARCHAR(500),
    api_version VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_source_id (source_id),
    INDEX idx_source_type (source_type),
    INDEX idx_reliability (reliability),
    INDEX idx_is_active (is_active)
);

-- Score insights table
CREATE TABLE score_insights (
    id VARCHAR(255) PRIMARY KEY,
    badge_id VARCHAR(255) NOT NULL,
    
    -- Insight details
    insight_type VARCHAR(20) NOT NULL CHECK (insight_type IN ('positive', 'negative', 'neutral')),
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Impact assessment
    impact DECIMAL(5, 2) NOT NULL,
    actionable BOOLEAN DEFAULT FALSE,
    recommendation TEXT,
    
    -- Validity
    confidence DECIMAL(3, 2) NOT NULL,
    valid_until TIMESTAMP,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (badge_id) REFERENCES trust_score_badges(id) ON DELETE CASCADE,
    INDEX idx_badge_id (badge_id),
    INDEX idx_insight_type (insight_type),
    INDEX idx_category (category),
    INDEX idx_impact (impact),
    INDEX idx_status (status)
);

-- Score comparisons table
CREATE TABLE score_comparisons (
    id VARCHAR(255) PRIMARY KEY,
    
    -- Comparison details
    badge_id_1 VARCHAR(255) NOT NULL,
    badge_id_2 VARCHAR(255) NOT NULL,
    
    -- Comparison results
    score_difference DECIMAL(5, 2) NOT NULL,
    component_comparison JSON NOT NULL,
    relative_strengths JSON,
    analysis TEXT,
    
    -- Metadata
    comparison_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (badge_id_1) REFERENCES trust_score_badges(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id_2) REFERENCES trust_score_badges(id) ON DELETE CASCADE,
    INDEX idx_badge_1 (badge_id_1),
    INDEX idx_badge_2 (badge_id_2),
    INDEX idx_comparison_date (comparison_date)
);

-- Performance metrics table
CREATE TABLE performance_metrics (
    id VARCHAR(255) PRIMARY KEY,
    trust_score_id VARCHAR(255) NOT NULL,
    
    -- Return metrics
    total_return DECIMAL(8, 4),
    annualized_return DECIMAL(8, 4),
    volatility_adjusted_return DECIMAL(8, 4),
    consistent_performance DECIMAL(5, 2),
    outperformance_frequency DECIMAL(5, 2),
    
    -- Risk-adjusted metrics
    sharpe_ratio DECIMAL(8, 4),
    sortino_ratio DECIMAL(8, 4),
    calmar_ratio DECIMAL(8, 4),
    treynor_ratio DECIMAL(8, 4),
    information_ratio DECIMAL(8, 4),
    jensen_alpha DECIMAL(8, 4),
    
    -- Benchmark comparison
    benchmark_name VARCHAR(255),
    outperformance DECIMAL(8, 4),
    tracking_error DECIMAL(8, 4),
    up_capture_ratio DECIMAL(8, 4),
    down_capture_ratio DECIMAL(8, 4),
    beta DECIMAL(8, 4),
    
    -- Drawdown analysis
    max_drawdown DECIMAL(8, 4),
    average_drawdown DECIMAL(8, 4),
    recovery_time INT,
    drawdown_frequency INT,
    current_drawdown DECIMAL(8, 4),
    
    -- Performance attribution
    asset_allocation DECIMAL(8, 4),
    security_selection DECIMAL(8, 4),
    timing_effect DECIMAL(8, 4),
    currency_effect DECIMAL(8, 4),
    interaction_effect DECIMAL(8, 4),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_score_id) REFERENCES trust_scores(id) ON DELETE CASCADE,
    INDEX idx_trust_score_id (trust_score_id),
    INDEX idx_sharpe_ratio (sharpe_ratio),
    INDEX idx_max_drawdown (max_drawdown)
);

-- Risk assessment table
CREATE TABLE risk_assessments (
    id VARCHAR(255) PRIMARY KEY,
    trust_score_id VARCHAR(255) NOT NULL,
    
    -- Overall risk metrics
    overall_risk_score DECIMAL(5, 2) NOT NULL,
    risk_grade VARCHAR(20) NOT NULL CHECK (risk_grade IN ('Very Low', 'Low', 'Moderate', 'High', 'Very High')),
    
    -- Risk components
    market_risk DECIMAL(5, 2),
    credit_risk DECIMAL(5, 2),
    liquidity_risk DECIMAL(5, 2),
    concentration_risk DECIMAL(5, 2),
    operational_risk DECIMAL(5, 2),
    
    -- Volatility metrics
    total_volatility DECIMAL(8, 4),
    systematic_risk DECIMAL(8, 4),
    specific_risk DECIMAL(8, 4),
    downside_volatility DECIMAL(8, 4),
    
    -- Tail risk
    var_95 DECIMAL(8, 4),
    var_99 DECIMAL(8, 4),
    cvar_95 DECIMAL(8, 4),
    cvar_99 DECIMAL(8, 4),
    tail_ratio DECIMAL(8, 4),
    
    -- Risk-adjusted scores
    volatility_adjusted DECIMAL(5, 2),
    downside_risk_adjusted DECIMAL(5, 2),
    tail_risk_adjusted DECIMAL(5, 2),
    stress_test_adjusted DECIMAL(5, 2),
    
    -- Stress test results
    stress_test_results JSON,
    
    -- Risk management score
    risk_management_score DECIMAL(5, 2),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_score_id) REFERENCES trust_scores(id) ON DELETE CASCADE,
    INDEX idx_trust_score_id (trust_score_id),
    INDEX idx_overall_risk_score (overall_risk_score),
    INDEX idx_risk_grade (risk_grade)
);

-- Consistency metrics table
CREATE TABLE consistency_metrics (
    id VARCHAR(255) PRIMARY KEY,
    trust_score_id VARCHAR(255) NOT NULL,
    
    -- Performance consistency
    performance_consistency DECIMAL(5, 2) NOT NULL,
    strategy_consistency DECIMAL(5, 2),
    risk_consistency DECIMAL(5, 2),
    
    -- Time-based consistency
    monthly_consistency DECIMAL(5, 2),
    quarterly_consistency DECIMAL(5, 2),
    yearly_consistency DECIMAL(5, 2),
    
    -- Pattern analysis
    trend_consistency DECIMAL(5, 2),
    cyclical_consistency DECIMAL(5, 2),
    seasonal_consistency DECIMAL(5, 2),
    
    -- Deviation metrics
    standard_deviation DECIMAL(8, 4),
    mean_absolute_deviation DECIMAL(8, 4),
    relative_deviation DECIMAL(8, 4),
    
    -- Predictability metrics
    forecast_accuracy DECIMAL(5, 2),
    pattern_recognition DECIMAL(5, 2),
    behavior_predictability DECIMAL(5, 2),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trust_score_id) REFERENCES trust_scores(id) ON DELETE CASCADE,
    INDEX idx_trust_score_id (trust_score_id),
    INDEX idx_performance_consistency (performance_consistency)
);

-- Calculation queue table
CREATE TABLE trust_score_calculation_queue (
    id VARCHAR(255) PRIMARY KEY,
    badge_id VARCHAR(255) NOT NULL,
    
    -- Queue details
    priority INT DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled'
    )),
    
    -- Timing
    queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Progress tracking
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    current_step VARCHAR(255),
    
    -- Error handling
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (badge_id) REFERENCES trust_score_badges(id) ON DELETE CASCADE,
    INDEX idx_badge_id (badge_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_queued_at (queued_at)
);

-- Create views for easier querying
CREATE VIEW trust_score_summary AS
SELECT 
    tsb.id,
    tsb.user_id,
    tsb.badge_type,
    tsb.entity_id,
    tsb.entity_type,
    ts.overall_score,
    ts.score_grade,
    tsb.last_calculated,
    tsb.is_active
FROM trust_score_badges tsb
LEFT JOIN trust_scores ts ON tsb.id = ts.badge_id
WHERE tsb.is_active = TRUE;

CREATE VIEW latest_score_history AS
SELECT 
    tsh.*,
    ROW_NUMBER() OVER (PARTITION BY tsh.badge_id ORDER BY tsh.calculation_date DESC) as rn
FROM trust_score_history tsh;

CREATE VIEW component_score_breakdown AS
SELECT 
    cs.*,
    ts.badge_id,
    ts.overall_score,
    ts.score_grade
FROM component_scores cs
JOIN trust_scores ts ON cs.trust_score_id = ts.id;

CREATE VIEW active_insights AS
SELECT 
    si.*,
    tsb.badge_type,
    tsb.entity_id,
    tsb.entity_type
FROM score_insights si
JOIN trust_score_badges tsb ON si.badge_id = tsb.id
WHERE si.status = 'active' 
AND (si.valid_until IS NULL OR si.valid_until > NOW())
ORDER BY si.impact DESC, si.created_at DESC;

-- Add indexes for performance optimization
CREATE INDEX idx_score_history_composite ON trust_score_history(badge_id, calculation_date, score);
CREATE INDEX idx_component_scores_composite ON component_scores(trust_score_id, component_type, score);
CREATE INDEX idx_insights_composite ON score_insights(badge_id, insight_type, status);
CREATE INDEX idx_queue_composite ON trust_score_calculation_queue(status, priority, queued_at);

-- Add triggers for automatic updates
DELIMITER //

CREATE TRIGGER update_badge_timestamp
BEFORE UPDATE ON trust_score_badges
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_insight_timestamp
BEFORE UPDATE ON score_insights
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_queue_timestamp
BEFORE UPDATE ON trust_score_calculation_queue
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

DELIMITER ;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON trust_score_badges TO 'stackmotive_app'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON trust_scores TO 'stackmotive_app'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON component_scores TO 'stackmotive_app'@'%';

-- Trust Score Badge Migration Complete
-- Block 94: Trust score metrics and badge visualization
-- Supports: Multi-component scoring, historical tracking, performance analysis, AU/NZ compliance 