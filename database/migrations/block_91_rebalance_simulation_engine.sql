-- Block 91: Rebalance Simulation Engine - Database Migration
-- Portfolio Rebalancing Simulation and What-If Analysis

-- Main rebalance simulation engines table
CREATE TABLE rebalance_simulation_engines (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    
    -- Engine identification
    engine_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuration
    simulation_config JSON NOT NULL,
    
    -- Status
    engine_status JSON NOT NULL,
    
    -- Performance metrics
    performance_metrics JSON NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_engine_name (engine_name),
    INDEX idx_is_active (is_active)
);

-- Rebalance simulations table
CREATE TABLE rebalance_simulations (
    id VARCHAR(255) PRIMARY KEY,
    engine_id VARCHAR(255) NOT NULL,
    
    -- Simulation identification
    simulation_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Current portfolio snapshot
    current_portfolio JSON NOT NULL,
    
    -- Target allocation
    target_allocation JSON NOT NULL,
    
    -- Simulation parameters
    simulation_params JSON NOT NULL,
    
    -- Results
    simulation_results JSON,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'cancelled'
    )),
    
    -- Execution info
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    duration INT NULL, -- milliseconds
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (engine_id) REFERENCES rebalance_simulation_engines(id) ON DELETE CASCADE,
    INDEX idx_engine_id (engine_id),
    INDEX idx_simulation_name (simulation_name),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time)
);

-- Portfolio snapshots table
CREATE TABLE portfolio_snapshots (
    id VARCHAR(255) PRIMARY KEY,
    portfolio_id VARCHAR(255) NOT NULL,
    simulation_id VARCHAR(255),
    
    -- Snapshot details
    snapshot_date TIMESTAMP NOT NULL,
    snapshot_type VARCHAR(50) NOT NULL CHECK (snapshot_type IN (
        'current', 'target', 'simulated', 'optimized'
    )),
    
    -- Portfolio metrics
    total_value DECIMAL(15, 2) NOT NULL,
    cash_balance DECIMAL(15, 2) DEFAULT 0,
    
    -- Performance data
    performance_data JSON,
    
    -- Risk metrics
    risk_metrics JSON,
    
    -- Allocation data
    allocation_data JSON,
    
    -- Holdings data
    holdings_data JSON NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (simulation_id) REFERENCES rebalance_simulations(id) ON DELETE CASCADE,
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_simulation_id (simulation_id),
    INDEX idx_snapshot_date (snapshot_date),
    INDEX idx_snapshot_type (snapshot_type)
);

-- Holding snapshots table
CREATE TABLE holding_snapshots (
    id VARCHAR(255) PRIMARY KEY,
    portfolio_snapshot_id VARCHAR(255) NOT NULL,
    
    -- Holding identification
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    asset_class VARCHAR(50) NOT NULL CHECK (asset_class IN (
        'equity', 'bond', 'cash', 'commodity', 'real_estate', 'alternative', 'crypto'
    )),
    sector VARCHAR(100),
    
    -- Position details
    quantity DECIMAL(15, 6) NOT NULL,
    price DECIMAL(15, 4) NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    weight DECIMAL(5, 4) NOT NULL, -- Percentage as decimal
    
    -- Performance metrics
    day_change DECIMAL(15, 2) DEFAULT 0,
    day_change_percent DECIMAL(8, 4) DEFAULT 0,
    total_return DECIMAL(15, 2) DEFAULT 0,
    total_return_percent DECIMAL(8, 4) DEFAULT 0,
    
    -- Risk metrics
    volatility DECIMAL(8, 4),
    beta DECIMAL(8, 4),
    
    -- Tax info
    cost_basis DECIMAL(15, 2),
    unrealized_gain DECIMAL(15, 2),
    unrealized_gain_percent DECIMAL(8, 4),
    holding_period INT, -- days
    
    -- AU/NZ specific
    jurisdiction VARCHAR(2) CHECK (jurisdiction IN ('AU', 'NZ')),
    franked_dividend_yield DECIMAL(8, 4), -- AU only
    imputation_credits DECIMAL(15, 2), -- AU only
    
    -- Liquidity
    liquidity_score DECIMAL(3, 2) CHECK (liquidity_score >= 0 AND liquidity_score <= 1),
    average_volume BIGINT,
    
    -- Metadata
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (portfolio_snapshot_id) REFERENCES portfolio_snapshots(id) ON DELETE CASCADE,
    INDEX idx_portfolio_snapshot_id (portfolio_snapshot_id),
    INDEX idx_symbol (symbol),
    INDEX idx_asset_class (asset_class),
    INDEX idx_sector (sector),
    INDEX idx_jurisdiction (jurisdiction)
);

-- Target allocations table
CREATE TABLE target_allocations (
    id VARCHAR(255) PRIMARY KEY,
    allocation_name VARCHAR(255) NOT NULL,
    
    -- Asset class targets
    asset_class_targets JSON NOT NULL,
    
    -- Sector targets
    sector_targets JSON,
    
    -- Geographic targets
    geographic_targets JSON,
    
    -- Individual holding targets
    holding_targets JSON,
    
    -- Constraints
    constraints JSON,
    
    -- Rebalancing rules
    rebalance_rules JSON NOT NULL,
    
    -- Usage tracking
    usage_count INT DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_allocation_name (allocation_name),
    INDEX idx_is_default (is_default)
);

-- Rebalance actions table
CREATE TABLE rebalance_actions (
    id VARCHAR(255) PRIMARY KEY,
    simulation_id VARCHAR(255) NOT NULL,
    
    -- Action details
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('buy', 'sell')),
    
    -- Quantities
    current_quantity DECIMAL(15, 6) NOT NULL,
    target_quantity DECIMAL(15, 6) NOT NULL,
    change_quantity DECIMAL(15, 6) NOT NULL,
    change_percent DECIMAL(8, 4) NOT NULL,
    
    -- Values
    current_value DECIMAL(15, 2) NOT NULL,
    target_value DECIMAL(15, 2) NOT NULL,
    change_value DECIMAL(15, 2) NOT NULL,
    
    -- Weights
    current_weight DECIMAL(5, 4) NOT NULL,
    target_weight DECIMAL(5, 4) NOT NULL,
    change_weight DECIMAL(5, 4) NOT NULL,
    
    -- Costs
    transaction_cost DECIMAL(15, 2) NOT NULL,
    market_impact DECIMAL(15, 2) NOT NULL,
    
    -- Tax implications
    tax_implications JSON,
    
    -- Timing
    suggested_execution_date DATE,
    execution_priority VARCHAR(10) CHECK (execution_priority IN ('high', 'medium', 'low')),
    
    -- Rationale
    rationale TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (simulation_id) REFERENCES rebalance_simulations(id) ON DELETE CASCADE,
    INDEX idx_simulation_id (simulation_id),
    INDEX idx_symbol (symbol),
    INDEX idx_action (action),
    INDEX idx_execution_priority (execution_priority)
);

-- Rebalance templates table
CREATE TABLE rebalance_templates (
    id VARCHAR(255) PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    
    -- Template configuration
    target_allocation_id VARCHAR(255),
    
    -- Default parameters
    default_parameters JSON NOT NULL,
    
    -- Constraints
    constraints JSON,
    
    -- Template metadata
    category VARCHAR(100),
    risk_level VARCHAR(50) CHECK (risk_level IN ('conservative', 'moderate', 'aggressive', 'custom')),
    
    -- Usage tracking
    usage_count INT DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_custom BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (target_allocation_id) REFERENCES target_allocations(id) ON DELETE SET NULL,
    INDEX idx_template_name (template_name),
    INDEX idx_category (category),
    INDEX idx_risk_level (risk_level),
    INDEX idx_is_default (is_default),
    INDEX idx_is_active (is_active)
);

-- Simulation results summary table
CREATE TABLE simulation_results_summary (
    id VARCHAR(255) PRIMARY KEY,
    simulation_id VARCHAR(255) NOT NULL,
    
    -- Summary metrics
    total_value DECIMAL(15, 2) NOT NULL,
    total_cost DECIMAL(15, 2) NOT NULL,
    total_tax DECIMAL(15, 2) NOT NULL,
    net_benefit DECIMAL(15, 2) NOT NULL,
    
    -- Performance metrics
    expected_return DECIMAL(8, 4) NOT NULL,
    expected_risk DECIMAL(8, 4) NOT NULL,
    sharpe_ratio DECIMAL(8, 4) NOT NULL,
    
    -- Efficiency metrics
    rebalance_efficiency DECIMAL(3, 2) NOT NULL,
    cost_efficiency DECIMAL(3, 2) NOT NULL,
    
    -- Action counts
    total_actions INT NOT NULL,
    buy_actions INT NOT NULL,
    sell_actions INT NOT NULL,
    
    -- Recommendation metrics
    recommendation_score DECIMAL(5, 2) NOT NULL,
    implementation_complexity VARCHAR(10) CHECK (implementation_complexity IN ('low', 'medium', 'high')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (simulation_id) REFERENCES rebalance_simulations(id) ON DELETE CASCADE,
    INDEX idx_simulation_id (simulation_id),
    INDEX idx_recommendation_score (recommendation_score),
    INDEX idx_implementation_complexity (implementation_complexity)
);

-- Performance analysis table
CREATE TABLE performance_analysis (
    id VARCHAR(255) PRIMARY KEY,
    simulation_id VARCHAR(255) NOT NULL,
    
    -- Expected metrics
    expected_return DECIMAL(8, 4) NOT NULL,
    expected_volatility DECIMAL(8, 4) NOT NULL,
    sharpe_ratio DECIMAL(8, 4) NOT NULL,
    
    -- Tracking metrics
    tracking_error DECIMAL(8, 4),
    information_ratio DECIMAL(8, 4),
    
    -- Risk metrics
    value_at_risk DECIMAL(8, 4),
    conditional_var DECIMAL(8, 4),
    max_drawdown DECIMAL(8, 4),
    
    -- Efficiency metrics
    rebalance_efficiency DECIMAL(3, 2),
    cost_efficiency DECIMAL(3, 2),
    
    -- Before/after comparison
    before_rebalance JSON,
    after_rebalance JSON,
    improvement JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (simulation_id) REFERENCES rebalance_simulations(id) ON DELETE CASCADE,
    INDEX idx_simulation_id (simulation_id)
);

-- Risk analysis table
CREATE TABLE risk_analysis (
    id VARCHAR(255) PRIMARY KEY,
    simulation_id VARCHAR(255) NOT NULL,
    
    -- Portfolio risk
    portfolio_risk JSON NOT NULL,
    
    -- Concentration risk
    concentration_risk JSON,
    
    -- Correlation analysis
    correlation_analysis JSON,
    
    -- Risk attribution
    risk_attribution JSON,
    
    -- Stress test results
    stress_test_results JSON,
    
    -- Risk budget
    risk_budget JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (simulation_id) REFERENCES rebalance_simulations(id) ON DELETE CASCADE,
    INDEX idx_simulation_id (simulation_id)
);

-- Cost analysis table
CREATE TABLE cost_analysis (
    id VARCHAR(255) PRIMARY KEY,
    simulation_id VARCHAR(255) NOT NULL,
    
    -- Transaction costs
    total_transaction_costs DECIMAL(15, 2) NOT NULL,
    
    -- Cost breakdown
    cost_breakdown JSON NOT NULL,
    
    -- Market impact
    market_impact DECIMAL(15, 2),
    
    -- Opportunity costs
    opportunity_costs DECIMAL(15, 2),
    
    -- Efficiency metrics
    cost_efficiency DECIMAL(3, 2),
    
    -- Break-even analysis
    break_even_analysis JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (simulation_id) REFERENCES rebalance_simulations(id) ON DELETE CASCADE,
    INDEX idx_simulation_id (simulation_id)
);

-- Tax analysis table
CREATE TABLE tax_analysis (
    id VARCHAR(255) PRIMARY KEY,
    simulation_id VARCHAR(255) NOT NULL,
    
    -- Tax liability
    total_tax_liability DECIMAL(15, 2) NOT NULL,
    
    -- Tax breakdown
    tax_breakdown JSON NOT NULL,
    
    -- After-tax returns
    after_tax_returns JSON,
    
    -- Tax optimization
    tax_optimization JSON,
    
    -- Jurisdiction specific
    jurisdiction_specific JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (simulation_id) REFERENCES rebalance_simulations(id) ON DELETE CASCADE,
    INDEX idx_simulation_id (simulation_id)
);

-- Scenario results table
CREATE TABLE scenario_results (
    id VARCHAR(255) PRIMARY KEY,
    simulation_id VARCHAR(255) NOT NULL,
    
    -- Scenario details
    scenario_id VARCHAR(255) NOT NULL,
    scenario_name VARCHAR(255) NOT NULL,
    
    -- Market conditions
    market_conditions JSON NOT NULL,
    
    -- Results
    performance_result JSON,
    risk_result JSON,
    
    -- Probability and impact
    probability DECIMAL(3, 2) CHECK (probability >= 0 AND probability <= 1),
    impact VARCHAR(10) CHECK (impact IN ('low', 'medium', 'high')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (simulation_id) REFERENCES rebalance_simulations(id) ON DELETE CASCADE,
    INDEX idx_simulation_id (simulation_id),
    INDEX idx_scenario_id (scenario_id),
    INDEX idx_impact (impact)
);

-- Recommendations table
CREATE TABLE rebalance_recommendations (
    id VARCHAR(255) PRIMARY KEY,
    simulation_id VARCHAR(255) NOT NULL,
    
    -- Recommendation details
    recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN (
        'allocation', 'timing', 'cost_optimization', 'tax_optimization', 'risk_management'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT NOT NULL,
    
    -- Impact
    expected_impact JSON,
    
    -- Implementation
    implementation_steps JSON,
    
    -- Priority and timing
    priority VARCHAR(10) CHECK (priority IN ('high', 'medium', 'low')),
    timeframe VARCHAR(100),
    
    -- Confidence
    confidence DECIMAL(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'implemented', 'dismissed')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (simulation_id) REFERENCES rebalance_simulations(id) ON DELETE CASCADE,
    INDEX idx_simulation_id (simulation_id),
    INDEX idx_recommendation_type (recommendation_type),
    INDEX idx_priority (priority),
    INDEX idx_status (status)
);

-- Market assumptions table
CREATE TABLE market_assumptions (
    id VARCHAR(255) PRIMARY KEY,
    simulation_id VARCHAR(255) NOT NULL,
    
    -- Return assumptions
    expected_returns JSON NOT NULL,
    
    -- Risk assumptions
    volatilities JSON NOT NULL,
    correlations JSON NOT NULL,
    
    -- Market conditions
    market_regime VARCHAR(20) CHECK (market_regime IN ('bull', 'bear', 'neutral')),
    
    -- Economic assumptions
    inflation_rate DECIMAL(6, 4),
    interest_rates JSON,
    
    -- Metadata
    assumption_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (simulation_id) REFERENCES rebalance_simulations(id) ON DELETE CASCADE,
    INDEX idx_simulation_id (simulation_id),
    INDEX idx_market_regime (market_regime)
);

-- Optimization constraints table
CREATE TABLE optimization_constraints (
    id VARCHAR(255) PRIMARY KEY,
    simulation_id VARCHAR(255) NOT NULL,
    
    -- Position constraints
    min_position_size DECIMAL(15, 2),
    max_position_size DECIMAL(15, 2),
    
    -- Turnover constraints
    max_turnover DECIMAL(3, 2),
    
    -- Cash constraints
    min_cash_balance DECIMAL(15, 2),
    max_cash_balance DECIMAL(15, 2),
    
    -- Sector constraints
    sector_constraints JSON,
    
    -- ESG constraints
    esg_constraints JSON,
    
    -- Custom constraints
    custom_constraints JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (simulation_id) REFERENCES rebalance_simulations(id) ON DELETE CASCADE,
    INDEX idx_simulation_id (simulation_id)
);

-- Create views for easier querying
CREATE VIEW simulation_summary AS
SELECT 
    rs.id,
    rs.simulation_name,
    rs.status,
    rs.start_time,
    rs.end_time,
    rs.duration,
    rse.engine_name,
    rse.user_id,
    srs.recommendation_score,
    srs.implementation_complexity,
    srs.net_benefit,
    pa.sharpe_ratio,
    ca.total_transaction_costs,
    ta.total_tax_liability
FROM rebalance_simulations rs
JOIN rebalance_simulation_engines rse ON rs.engine_id = rse.id
LEFT JOIN simulation_results_summary srs ON rs.id = srs.simulation_id
LEFT JOIN performance_analysis pa ON rs.id = pa.simulation_id
LEFT JOIN cost_analysis ca ON rs.id = ca.simulation_id
LEFT JOIN tax_analysis ta ON rs.id = ta.simulation_id;

CREATE VIEW engine_performance AS
SELECT 
    rse.id,
    rse.engine_name,
    rse.user_id,
    COUNT(rs.id) as total_simulations,
    COUNT(CASE WHEN rs.status = 'completed' THEN 1 END) as completed_simulations,
    COUNT(CASE WHEN rs.status = 'failed' THEN 1 END) as failed_simulations,
    AVG(CASE WHEN rs.status = 'completed' THEN srs.recommendation_score END) as avg_recommendation_score,
    AVG(CASE WHEN rs.status = 'completed' THEN rs.duration END) as avg_duration
FROM rebalance_simulation_engines rse
LEFT JOIN rebalance_simulations rs ON rse.id = rs.engine_id
LEFT JOIN simulation_results_summary srs ON rs.id = srs.simulation_id
GROUP BY rse.id, rse.engine_name, rse.user_id;

CREATE VIEW portfolio_allocation_analysis AS
SELECT 
    ps.id,
    ps.portfolio_id,
    ps.snapshot_date,
    ps.total_value,
    COUNT(hs.id) as holding_count,
    SUM(CASE WHEN hs.asset_class = 'equity' THEN hs.value ELSE 0 END) / ps.total_value * 100 as equity_allocation,
    SUM(CASE WHEN hs.asset_class = 'bond' THEN hs.value ELSE 0 END) / ps.total_value * 100 as bond_allocation,
    SUM(CASE WHEN hs.asset_class = 'cash' THEN hs.value ELSE 0 END) / ps.total_value * 100 as cash_allocation,
    AVG(hs.liquidity_score) as avg_liquidity_score
FROM portfolio_snapshots ps
LEFT JOIN holding_snapshots hs ON ps.id = hs.portfolio_snapshot_id
GROUP BY ps.id, ps.portfolio_id, ps.snapshot_date, ps.total_value;

-- Add indexes for performance optimization
CREATE INDEX idx_rebalance_actions_composite ON rebalance_actions(simulation_id, action, execution_priority);
CREATE INDEX idx_holding_snapshots_composite ON holding_snapshots(portfolio_snapshot_id, asset_class, weight);
CREATE INDEX idx_simulations_composite ON rebalance_simulations(engine_id, status, start_time);
CREATE INDEX idx_recommendations_composite ON rebalance_recommendations(simulation_id, priority, status);

-- Add triggers for automatic updates
DELIMITER //

CREATE TRIGGER update_engine_timestamp
BEFORE UPDATE ON rebalance_simulation_engines
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_simulation_timestamp
BEFORE UPDATE ON rebalance_simulations
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_template_timestamp
BEFORE UPDATE ON rebalance_templates
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_recommendation_timestamp
BEFORE UPDATE ON rebalance_recommendations
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

DELIMITER ;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON rebalance_simulation_engines TO 'stackmotive_app'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON rebalance_simulations TO 'stackmotive_app'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio_snapshots TO 'stackmotive_app'@'%';

-- Rebalance Simulation Engine Migration Complete
-- Block 91: Portfolio rebalancing simulation and what-if analysis
-- Supports: Multi-scenario analysis, cost optimization, tax-aware rebalancing, AU/NZ compliance 