-- Block 77: Risk Exposure Meter - Database Migration
-- Comprehensive Risk Analytics with AU/NZ Market Integration

-- Main risk exposure meters table
CREATE TABLE risk_exposure_meters (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    portfolio_id VARCHAR(255) NOT NULL,
    
    -- Meter identification
    meter_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Portfolio reference
    portfolio_value DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('AUD', 'NZD', 'USD')),
    
    -- Overall risk assessment
    overall_risk_level VARCHAR(20) NOT NULL CHECK (overall_risk_level IN ('very_low', 'low', 'moderate', 'high', 'very_high', 'extreme')),
    risk_score DECIMAL(5, 2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    
    -- Configuration
    meter_config JSON NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_risk_level (overall_risk_level),
    INDEX idx_last_calculated (last_calculated),
    INDEX idx_created_at (created_at)
);

-- Portfolio risk metrics table
CREATE TABLE portfolio_risk_metrics (
    id VARCHAR(255) PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    
    -- Volatility metrics
    portfolio_volatility DECIMAL(8, 6) NOT NULL,
    volatility_1m DECIMAL(8, 6) NOT NULL,
    volatility_3m DECIMAL(8, 6) NOT NULL,
    volatility_1y DECIMAL(8, 6) NOT NULL,
    
    -- Value at Risk (VaR)
    var_1day_95 DECIMAL(15, 2) NOT NULL,
    var_1day_99 DECIMAL(15, 2) NOT NULL,
    var_1week_95 DECIMAL(15, 2) NOT NULL,
    var_1month_95 DECIMAL(15, 2) NOT NULL,
    
    -- Expected Shortfall (CVaR)
    cvar_1day_95 DECIMAL(15, 2) NOT NULL,
    cvar_1day_99 DECIMAL(15, 2) NOT NULL,
    
    -- Drawdown metrics
    max_drawdown DECIMAL(8, 4) NOT NULL,
    current_drawdown DECIMAL(8, 4) NOT NULL,
    average_drawdown DECIMAL(8, 4) NOT NULL,
    drawdown_duration INT NOT NULL,
    
    -- Beta and correlation
    market_beta DECIMAL(8, 6) NOT NULL,
    benchmark_correlation DECIMAL(8, 6) NOT NULL,
    
    -- Sharpe ratios
    sharpe_ratio DECIMAL(8, 6) NOT NULL,
    information_ratio DECIMAL(8, 6) NOT NULL,
    calmar_ratio DECIMAL(8, 6) NOT NULL,
    sortino_ratio DECIMAL(8, 6) NOT NULL,
    
    -- Risk-adjusted returns
    treynor_ratio DECIMAL(8, 6) NOT NULL,
    jensen_alpha DECIMAL(8, 6) NOT NULL,
    
    -- Tail risk measures
    skewness DECIMAL(8, 6) NOT NULL,
    kurtosis DECIMAL(8, 6) NOT NULL,
    tail_risk DECIMAL(8, 6) NOT NULL,
    
    -- Liquidity risk
    liquidity_score DECIMAL(5, 2) NOT NULL CHECK (liquidity_score >= 0 AND liquidity_score <= 100),
    liquidity_risk DECIMAL(8, 6) NOT NULL,
    
    -- Currency risk
    currency_risk DECIMAL(8, 6) NOT NULL,
    
    -- Calculation metadata
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculation_duration_ms INT DEFAULT 0,
    
    FOREIGN KEY (meter_id) REFERENCES risk_exposure_meters(id) ON DELETE CASCADE,
    INDEX idx_meter_id (meter_id),
    INDEX idx_calculated_at (calculated_at)
);

-- Risk contributions table
CREATE TABLE risk_contributions (
    id VARCHAR(255) PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    
    -- Contributor identification
    contributor_type VARCHAR(50) NOT NULL CHECK (contributor_type IN ('asset_class', 'individual_holding', 'sector', 'geography', 'currency', 'factor')),
    contributor_id VARCHAR(255) NOT NULL,
    contributor_name VARCHAR(255) NOT NULL,
    
    -- Risk contribution metrics
    volatility_contribution DECIMAL(8, 6) NOT NULL,
    var_contribution DECIMAL(15, 2) NOT NULL,
    marginal_var DECIMAL(15, 2) NOT NULL,
    component_var DECIMAL(15, 2) NOT NULL,
    
    -- Percentage contributions
    percentage_of_risk DECIMAL(8, 4) NOT NULL,
    percentage_of_portfolio DECIMAL(8, 4) NOT NULL,
    
    -- Risk efficiency
    risk_efficiency DECIMAL(8, 6) NOT NULL,
    diversification_benefit DECIMAL(8, 6) NOT NULL,
    
    -- Correlation impact
    correlation_with_portfolio DECIMAL(8, 6) NOT NULL,
    average_correlation DECIMAL(8, 6) NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meter_id) REFERENCES risk_exposure_meters(id) ON DELETE CASCADE,
    INDEX idx_meter_id (meter_id),
    INDEX idx_contributor_type (contributor_type),
    INDEX idx_contributor_id (contributor_id)
);

-- Concentration risks table
CREATE TABLE concentration_risks (
    id VARCHAR(255) PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    
    -- Risk identification
    concentration_type VARCHAR(50) NOT NULL CHECK (concentration_type IN ('single_asset', 'asset_class', 'sector', 'geography', 'currency', 'issuer', 'counterparty')),
    concentration_name VARCHAR(255) NOT NULL,
    
    -- Concentration metrics
    concentration_index DECIMAL(8, 6) NOT NULL,
    top_n_concentration DECIMAL(8, 4) NOT NULL,
    max_single_weight DECIMAL(8, 4) NOT NULL,
    
    -- Risk assessment
    concentration_risk_level VARCHAR(20) NOT NULL CHECK (concentration_risk_level IN ('very_low', 'low', 'moderate', 'high', 'very_high', 'extreme')),
    diversification_score DECIMAL(5, 2) NOT NULL CHECK (diversification_score >= 0 AND diversification_score <= 100),
    
    -- Threshold analysis
    is_over_concentrated BOOLEAN DEFAULT FALSE,
    threshold_breached JSON,
    
    -- Impact analysis
    potential_loss DECIMAL(15, 2) NOT NULL,
    liquidation_risk DECIMAL(8, 6) NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meter_id) REFERENCES risk_exposure_meters(id) ON DELETE CASCADE,
    INDEX idx_meter_id (meter_id),
    INDEX idx_concentration_type (concentration_type),
    INDEX idx_risk_level (concentration_risk_level)
);

-- AU/NZ specific risk factors table
CREATE TABLE aunz_risk_factors (
    id VARCHAR(255) PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    
    -- Currency risks
    aud_exposure DECIMAL(8, 4) NOT NULL,
    nzd_exposure DECIMAL(8, 4) NOT NULL,
    foreign_currency_risk DECIMAL(8, 6) NOT NULL,
    
    -- Sector concentration (AU/NZ specific)
    mining_exposure DECIMAL(8, 4) NOT NULL,
    banking_exposure DECIMAL(8, 4) NOT NULL,
    dairy_exposure DECIMAL(8, 4) NOT NULL,
    
    -- Market-specific risks
    asx_risk JSON,
    nzx_risk JSON,
    
    -- Commodity exposure
    commodity_risk JSON NOT NULL,
    
    -- Interest rate sensitivity
    interest_rate_sensitivity JSON NOT NULL,
    
    -- Liquidity considerations
    market_liquidity_risk DECIMAL(8, 6) NOT NULL,
    cross_listing_risk DECIMAL(8, 6) NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meter_id) REFERENCES risk_exposure_meters(id) ON DELETE CASCADE,
    INDEX idx_meter_id (meter_id),
    INDEX idx_mining_exposure (mining_exposure),
    INDEX idx_banking_exposure (banking_exposure)
);

-- Tax risks table
CREATE TABLE tax_risks (
    id VARCHAR(255) PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    
    -- Risk identification
    risk_type VARCHAR(50) NOT NULL CHECK (risk_type IN ('franking_credit_changes', 'cgt_rule_changes', 'fif_threshold_changes', 'investor_trader_reclassification', 'withholding_tax_changes', 'super_rule_changes', 'kiwisaver_changes')),
    jurisdiction VARCHAR(2) NOT NULL CHECK (jurisdiction IN ('AU', 'NZ')),
    
    -- Risk details
    description TEXT NOT NULL,
    potential_impact DECIMAL(15, 2) NOT NULL,
    probability VARCHAR(10) NOT NULL CHECK (probability IN ('low', 'medium', 'high')),
    
    -- Specific risk details
    legislative_risk TEXT,
    compliance_risk TEXT,
    optimization_risk TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meter_id) REFERENCES risk_exposure_meters(id) ON DELETE CASCADE,
    INDEX idx_meter_id (meter_id),
    INDEX idx_risk_type (risk_type),
    INDEX idx_jurisdiction (jurisdiction)
);

-- Regulatory risks table
CREATE TABLE regulatory_risks (
    id VARCHAR(255) PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    
    -- Risk identification
    risk_type VARCHAR(50) NOT NULL CHECK (risk_type IN ('banking_regulation', 'investment_regulation', 'market_structure_changes', 'prudential_requirements', 'consumer_protection', 'environmental_regulation')),
    jurisdiction VARCHAR(2) NOT NULL CHECK (jurisdiction IN ('AU', 'NZ')),
    
    -- Risk details
    description TEXT NOT NULL,
    potential_impact DECIMAL(15, 2) NOT NULL,
    timeframe VARCHAR(100) NOT NULL,
    
    -- Risk mitigation
    mitigation_strategies JSON,
    monitoring_required BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meter_id) REFERENCES risk_exposure_meters(id) ON DELETE CASCADE,
    INDEX idx_meter_id (meter_id),
    INDEX idx_risk_type (risk_type),
    INDEX idx_jurisdiction (jurisdiction)
);

-- Stress test scenarios table
CREATE TABLE stress_test_scenarios (
    id VARCHAR(255) PRIMARY KEY,
    scenario_name VARCHAR(255) NOT NULL,
    scenario_type VARCHAR(50) NOT NULL CHECK (scenario_type IN ('market_crash', 'interest_rate_shock', 'currency_crisis', 'commodity_shock', 'black_swan', 'historical_replay', 'regulatory_shock', 'liquidity_crisis', 'inflation_shock', 'custom')),
    
    -- Scenario description
    description TEXT NOT NULL,
    historical_basis TEXT,
    
    -- Market shocks
    market_shocks JSON NOT NULL,
    
    -- Economic assumptions
    economic_assumptions JSON NOT NULL,
    
    -- Duration and probability
    scenario_duration INT NOT NULL,
    probability VARCHAR(10) NOT NULL CHECK (probability IN ('low', 'medium', 'high', 'extreme')),
    
    -- AU/NZ specific factors
    aunz_factors JSON,
    
    -- Configuration
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_scenario_name (scenario_name),
    INDEX idx_scenario_type (scenario_type),
    INDEX idx_probability (probability),
    INDEX idx_is_active (is_active)
);

-- Stress test results table
CREATE TABLE stress_test_results (
    id VARCHAR(255) PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    scenario_id VARCHAR(255) NOT NULL,
    
    -- Test identification
    test_name VARCHAR(255) NOT NULL,
    
    -- Test results
    portfolio_impact DECIMAL(15, 2) NOT NULL,
    percentage_impact DECIMAL(8, 4) NOT NULL,
    
    -- Recovery metrics
    time_to_recover INT NOT NULL,
    max_drawdown_in_scenario DECIMAL(8, 4) NOT NULL,
    
    -- Component impacts
    asset_class_impacts JSON NOT NULL,
    
    -- Risk metrics under stress
    stressed_var DECIMAL(15, 2) NOT NULL,
    stressed_volatility DECIMAL(8, 6) NOT NULL,
    stressed_correlations JSON NOT NULL,
    
    -- Liquidity impact
    liquidity_stress DECIMAL(8, 6) NOT NULL,
    
    -- Test metadata
    test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    test_duration INT NOT NULL,
    calculation_duration_ms INT DEFAULT 0,
    
    FOREIGN KEY (meter_id) REFERENCES risk_exposure_meters(id) ON DELETE CASCADE,
    FOREIGN KEY (scenario_id) REFERENCES stress_test_scenarios(id) ON DELETE CASCADE,
    INDEX idx_meter_id (meter_id),
    INDEX idx_scenario_id (scenario_id),
    INDEX idx_test_date (test_date),
    INDEX idx_portfolio_impact (portfolio_impact)
);

-- Risk alerts table
CREATE TABLE risk_alerts (
    id VARCHAR(255) PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    
    -- Alert identification
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('var_breach', 'volatility_spike', 'concentration_limit', 'drawdown_threshold', 'correlation_breakdown', 'liquidity_stress', 'stress_test_failure', 'regulatory_breach', 'currency_exposure', 'custom_threshold')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    
    -- Alert details
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    description TEXT,
    
    -- Risk data
    current_value DECIMAL(15, 8) NOT NULL,
    threshold_value DECIMAL(15, 8) NOT NULL,
    variance DECIMAL(15, 8) NOT NULL,
    
    -- Alert timing
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    
    -- Actions
    recommended_actions JSON,
    auto_actions JSON,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'snoozed')),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Escalation
    escalation_level INT DEFAULT 0,
    escalation_triggered BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meter_id) REFERENCES risk_exposure_meters(id) ON DELETE CASCADE,
    INDEX idx_meter_id (meter_id),
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_triggered_at (triggered_at),
    INDEX idx_priority (priority)
);

-- Risk thresholds table
CREATE TABLE risk_thresholds (
    id VARCHAR(255) PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    
    -- Threshold identification
    threshold_name VARCHAR(255) NOT NULL,
    threshold_type VARCHAR(50) NOT NULL CHECK (threshold_type IN ('portfolio_var', 'asset_concentration', 'sector_concentration', 'currency_exposure', 'volatility_limit', 'drawdown_limit', 'leverage_limit', 'liquidity_minimum', 'stress_test_minimum')),
    
    -- Threshold levels
    warning_level DECIMAL(15, 8) NOT NULL,
    limit_level DECIMAL(15, 8) NOT NULL,
    breach_level DECIMAL(15, 8) NOT NULL,
    
    -- Threshold configuration
    measurement_period VARCHAR(10) NOT NULL,
    calculation_method VARCHAR(255) NOT NULL,
    
    -- Actions
    warning_actions JSON,
    limit_actions JSON,
    breach_actions JSON,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Compliance
    is_regulatory BOOLEAN DEFAULT FALSE,
    regulatory_reference TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meter_id) REFERENCES risk_exposure_meters(id) ON DELETE CASCADE,
    INDEX idx_meter_id (meter_id),
    INDEX idx_threshold_type (threshold_type),
    INDEX idx_is_active (is_active),
    INDEX idx_is_regulatory (is_regulatory)
);

-- Risk compliance status table
CREATE TABLE risk_compliance_status (
    id VARCHAR(255) PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    
    -- Overall status
    overall_status VARCHAR(20) NOT NULL CHECK (overall_status IN ('compliant', 'warning', 'violation', 'breach')),
    last_assessment TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Specific compliance areas
    var_compliance JSON NOT NULL,
    concentration_compliance JSON NOT NULL,
    liquidity_compliance JSON NOT NULL,
    stress_test_compliance JSON NOT NULL,
    
    -- Regulatory compliance
    regulatory_compliance JSON,
    
    -- Reporting
    last_report TIMESTAMP,
    next_report_due TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meter_id) REFERENCES risk_exposure_meters(id) ON DELETE CASCADE,
    INDEX idx_meter_id (meter_id),
    INDEX idx_overall_status (overall_status),
    INDEX idx_last_assessment (last_assessment)
);

-- Compliance violations table
CREATE TABLE compliance_violations (
    id VARCHAR(255) PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    
    -- Violation identification
    violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN ('var_breach', 'concentration_limit', 'liquidity_minimum', 'regulatory_limit', 'custom_threshold')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'major', 'critical', 'severe')),
    
    -- Violation details
    description TEXT NOT NULL,
    threshold_value DECIMAL(15, 8) NOT NULL,
    actual_value DECIMAL(15, 8) NOT NULL,
    exceedance_amount DECIMAL(15, 8) NOT NULL,
    
    -- Timing
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    duration_hours INT,
    
    -- Actions
    actions_required JSON,
    actions_taken JSON,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolving', 'resolved')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meter_id) REFERENCES risk_exposure_meters(id) ON DELETE CASCADE,
    INDEX idx_meter_id (meter_id),
    INDEX idx_violation_type (violation_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_detected_at (detected_at)
);

-- Risk trends table
CREATE TABLE risk_trends (
    id VARCHAR(255) PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    
    -- Trend identification
    metric_name VARCHAR(255) NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('portfolio_volatility', 'var_95', 'max_drawdown', 'correlation_average', 'concentration_index', 'liquidity_score', 'stress_test_score')),
    
    -- Trend data
    trend_direction VARCHAR(20) NOT NULL CHECK (trend_direction IN ('increasing', 'decreasing', 'stable', 'volatile')),
    trend_strength DECIMAL(5, 4) NOT NULL CHECK (trend_strength >= 0 AND trend_strength <= 1),
    trend_duration INT NOT NULL,
    
    -- Trend analysis
    volatility_of_risk DECIMAL(8, 6) NOT NULL,
    predictability DECIMAL(5, 4) NOT NULL CHECK (predictability >= 0 AND predictability <= 1),
    
    -- Forecasting
    short_term_forecast JSON NOT NULL,
    medium_term_forecast JSON NOT NULL,
    
    -- Significance
    is_significant BOOLEAN DEFAULT FALSE,
    confidence_level DECIMAL(5, 4) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meter_id) REFERENCES risk_exposure_meters(id) ON DELETE CASCADE,
    INDEX idx_meter_id (meter_id),
    INDEX idx_metric_type (metric_type),
    INDEX idx_trend_direction (trend_direction),
    INDEX idx_is_significant (is_significant)
);

-- Risk data points table (for trend analysis)
CREATE TABLE risk_data_points (
    id VARCHAR(255) PRIMARY KEY,
    trend_id VARCHAR(255) NOT NULL,
    
    -- Data point
    date TIMESTAMP NOT NULL,
    value DECIMAL(15, 8) NOT NULL,
    
    -- Context
    market_condition VARCHAR(20) CHECK (market_condition IN ('bull', 'bear', 'sideways', 'volatile', 'crisis')),
    significant_event TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trend_id) REFERENCES risk_trends(id) ON DELETE CASCADE,
    INDEX idx_trend_id (trend_id),
    INDEX idx_date (date),
    INDEX idx_value (value)
);

-- Risk adjusted metrics table
CREATE TABLE risk_adjusted_metrics (
    id VARCHAR(255) PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    
    -- Sharpe family
    sharpe_ratio DECIMAL(8, 6) NOT NULL,
    information_ratio DECIMAL(8, 6) NOT NULL,
    calmar_ratio DECIMAL(8, 6) NOT NULL,
    sortino_ratio DECIMAL(8, 6) NOT NULL,
    
    -- Alpha and beta
    alpha DECIMAL(8, 6) NOT NULL,
    beta DECIMAL(8, 6) NOT NULL,
    treynor_ratio DECIMAL(8, 6) NOT NULL,
    jensen_alpha DECIMAL(8, 6) NOT NULL,
    
    -- Maximum drawdown adjusted
    mar_ratio DECIMAL(8, 6) NOT NULL,
    sterling_ratio DECIMAL(8, 6) NOT NULL,
    burke_ratio DECIMAL(8, 6) NOT NULL,
    
    -- VaR adjusted
    var_ratio DECIMAL(8, 6) NOT NULL,
    cvar_ratio DECIMAL(8, 6) NOT NULL,
    
    -- Omega ratio
    omega_ratio DECIMAL(8, 6) NOT NULL,
    
    -- Upside/downside analysis
    upside_capture DECIMAL(8, 4) NOT NULL,
    downside_capture DECIMAL(8, 4) NOT NULL,
    capture_ratio DECIMAL(8, 6) NOT NULL,
    
    -- Tail risk adjusted
    tail_ratio DECIMAL(8, 6) NOT NULL,
    
    -- AU/NZ specific
    aunz_adjusted_return DECIMAL(8, 6),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meter_id) REFERENCES risk_exposure_meters(id) ON DELETE CASCADE,
    INDEX idx_meter_id (meter_id),
    INDEX idx_sharpe_ratio (sharpe_ratio),
    INDEX idx_calmar_ratio (calmar_ratio)
);

-- Tax adjusted risk metrics table
CREATE TABLE tax_adjusted_risk_metrics (
    id VARCHAR(255) PRIMARY KEY,
    risk_adjusted_metrics_id VARCHAR(255) NOT NULL,
    
    -- Tax adjusted metrics
    after_tax_sharpe DECIMAL(8, 6) NOT NULL,
    after_tax_alpha DECIMAL(8, 6) NOT NULL,
    tax_risk_adjustment DECIMAL(8, 6) NOT NULL,
    
    -- AU specific
    franking_adjusted_return DECIMAL(8, 6),
    
    -- NZ specific
    fif_adjusted_return DECIMAL(8, 6),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (risk_adjusted_metrics_id) REFERENCES risk_adjusted_metrics(id) ON DELETE CASCADE,
    INDEX idx_risk_adjusted_metrics_id (risk_adjusted_metrics_id)
);

-- Currency exposure table
CREATE TABLE currency_exposures (
    id VARCHAR(255) PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    
    -- Currency details
    currency VARCHAR(3) NOT NULL,
    exposure DECIMAL(8, 4) NOT NULL,
    hedged DECIMAL(8, 4) NOT NULL,
    unhedged DECIMAL(8, 4) NOT NULL,
    
    -- Currency risk metrics
    currency_volatility DECIMAL(8, 6) NOT NULL,
    currency_beta DECIMAL(8, 6) NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meter_id) REFERENCES risk_exposure_meters(id) ON DELETE CASCADE,
    INDEX idx_meter_id (meter_id),
    INDEX idx_currency (currency),
    INDEX idx_exposure (exposure)
);

-- Insert default stress test scenarios
INSERT INTO stress_test_scenarios (id, scenario_name, scenario_type, description, historical_basis, market_shocks, economic_assumptions, scenario_duration, probability, aunz_factors, is_active, is_default) VALUES
('scenario_market_crash_2008', 'Global Financial Crisis Replay', 'market_crash', '2008-style global financial crisis with major market downturn', 'Based on 2008 GFC market movements', 
 JSON_ARRAY(
   JSON_OBJECT('marketIndex', 'ASX200', 'shockType', 'percentage', 'shockValue', -45, 'volatilityMultiplier', 2.5),
   JSON_OBJECT('marketIndex', 'NZX50', 'shockType', 'percentage', 'shockValue', -42, 'volatilityMultiplier', 2.3),
   JSON_OBJECT('marketIndex', 'SPX', 'shockType', 'percentage', 'shockValue', -50, 'volatilityMultiplier', 2.8)
 ),
 JSON_ARRAY(
   JSON_OBJECT('factor', 'cash_rate', 'baselineValue', 4.5, 'stressedValue', 0.25, 'unit', 'percent'),
   JSON_OBJECT('factor', 'unemployment_rate', 'baselineValue', 4.0, 'stressedValue', 8.5, 'unit', 'percent'),
   JSON_OBJECT('factor', 'credit_spreads', 'baselineValue', 1.5, 'stressedValue', 5.0, 'unit', 'percent')
 ),
 180, 'low',
 JSON_OBJECT('miningCommodityShock', -60, 'bankingStress', 3.5, 'housingMarketShock', -25, 'auNzSpreadShock', 2.5),
 TRUE, TRUE),

('scenario_interest_rate_shock', 'Interest Rate Shock', 'interest_rate_shock', 'Rapid interest rate increases by central banks', 'Based on historical rate hiking cycles', 
 JSON_ARRAY(
   JSON_OBJECT('marketIndex', 'BONDS_AU', 'shockType', 'percentage', 'shockValue', -15, 'volatilityMultiplier', 1.8),
   JSON_OBJECT('marketIndex', 'BONDS_NZ', 'shockType', 'percentage', 'shockValue', -12, 'volatilityMultiplier', 1.6)
 ),
 JSON_ARRAY(
   JSON_OBJECT('factor', 'cash_rate', 'baselineValue', 4.5, 'stressedValue', 8.0, 'unit', 'percent'),
   JSON_OBJECT('factor', 'inflation_rate', 'baselineValue', 3.0, 'stressedValue', 6.5, 'unit', 'percent')
 ),
 90, 'medium',
 JSON_OBJECT('rbaNzrbSensitivity', 1.2, 'housingMarketShock', -15, 'auNzSpreadShock', 1.0),
 TRUE, TRUE),

('scenario_commodity_shock', 'Commodity Price Collapse', 'commodity_shock', 'Major decline in commodity prices affecting AU/NZ markets', 'Based on 2015-2016 commodity downturn', 
 JSON_ARRAY(
   JSON_OBJECT('marketIndex', 'COMMODITIES', 'shockType', 'percentage', 'shockValue', -45, 'volatilityMultiplier', 2.2)
 ),
 JSON_ARRAY(
   JSON_OBJECT('factor', 'commodity_prices', 'baselineValue', 100, 'stressedValue', 55, 'unit', 'index'),
   JSON_OBJECT('factor', 'exchange_rates', 'baselineValue', 0.70, 'stressedValue', 0.60, 'unit', 'AUD/USD')
 ),
 120, 'medium',
 JSON_OBJECT('miningCommodityShock', -50, 'dairyPriceShock', -35, 'economicDependencyRisk', 0.8),
 TRUE, TRUE),

('scenario_currency_crisis', 'AU/NZ Currency Crisis', 'currency_crisis', 'Significant depreciation of AUD and NZD', 'Based on Asian Financial Crisis currency impacts', 
 JSON_ARRAY(
   JSON_OBJECT('marketIndex', 'AUDUSD', 'shockType', 'percentage', 'shockValue', -30, 'volatilityMultiplier', 3.0),
   JSON_OBJECT('marketIndex', 'NZDUSD', 'shockType', 'percentage', 'shockValue', -35, 'volatilityMultiplier', 3.2)
 ),
 JSON_ARRAY(
   JSON_OBJECT('factor', 'exchange_rates', 'baselineValue', 0.70, 'stressedValue', 0.49, 'unit', 'AUD/USD'),
   JSON_OBJECT('factor', 'inflation_rate', 'baselineValue', 3.0, 'stressedValue', 5.5, 'unit', 'percent')
 ),
 150, 'low',
 JSON_OBJECT('foreignCurrencyRisk', 0.45, 'transTasmanTradeImpact', -0.25, 'touristFlowImpact', -0.4),
 TRUE, TRUE);

-- Create views for easier querying
CREATE VIEW risk_meter_summary AS
SELECT 
    rem.id,
    rem.user_id,
    rem.meter_name,
    rem.portfolio_value,
    rem.currency,
    rem.overall_risk_level,
    rem.risk_score,
    rem.last_calculated,
    COUNT(DISTINCT ra.id) as active_alerts,
    COUNT(DISTINCT cv.id) as active_violations,
    prm.portfolio_volatility,
    prm.var_1day_95,
    prm.sharpe_ratio,
    prm.max_drawdown,
    rcs.overall_status as compliance_status
FROM risk_exposure_meters rem
LEFT JOIN risk_alerts ra ON rem.id = ra.meter_id AND ra.status = 'active'
LEFT JOIN compliance_violations cv ON rem.id = cv.meter_id AND cv.status = 'active'
LEFT JOIN portfolio_risk_metrics prm ON rem.id = prm.meter_id
LEFT JOIN risk_compliance_status rcs ON rem.id = rcs.meter_id
WHERE rem.is_active = TRUE
GROUP BY rem.id, rem.user_id, rem.meter_name, rem.portfolio_value, rem.currency, rem.overall_risk_level, rem.risk_score, rem.last_calculated, prm.portfolio_volatility, prm.var_1day_95, prm.sharpe_ratio, prm.max_drawdown, rcs.overall_status;

CREATE VIEW active_risk_alerts AS
SELECT 
    ra.*,
    rem.meter_name,
    rem.user_id,
    rem.currency,
    rem.portfolio_value
FROM risk_alerts ra
JOIN risk_exposure_meters rem ON ra.meter_id = rem.id
WHERE ra.status = 'active'
AND rem.is_active = TRUE
ORDER BY ra.severity DESC, ra.priority DESC, ra.triggered_at DESC;

CREATE VIEW risk_compliance_summary AS
SELECT 
    rem.id as meter_id,
    rem.meter_name,
    rem.user_id,
    rcs.overall_status,
    rcs.last_assessment,
    COUNT(DISTINCT cv.id) as violation_count,
    COUNT(DISTINCT CASE WHEN cv.severity = 'critical' THEN cv.id END) as critical_violations,
    COUNT(DISTINCT CASE WHEN cv.severity = 'severe' THEN cv.id END) as severe_violations
FROM risk_exposure_meters rem
LEFT JOIN risk_compliance_status rcs ON rem.id = rcs.meter_id
LEFT JOIN compliance_violations cv ON rem.id = cv.meter_id AND cv.status = 'active'
WHERE rem.is_active = TRUE
GROUP BY rem.id, rem.meter_name, rem.user_id, rcs.overall_status, rcs.last_assessment;

-- Add indexes for performance optimization
CREATE INDEX idx_risk_alerts_meter_status ON risk_alerts(meter_id, status);
CREATE INDEX idx_risk_alerts_severity_priority ON risk_alerts(severity, priority);
CREATE INDEX idx_compliance_violations_meter_status ON compliance_violations(meter_id, status);
CREATE INDEX idx_stress_test_results_meter_date ON stress_test_results(meter_id, test_date);
CREATE INDEX idx_risk_trends_meter_metric ON risk_trends(meter_id, metric_type);
CREATE INDEX idx_currency_exposures_meter_currency ON currency_exposures(meter_id, currency);

-- Add triggers for automatic updates
DELIMITER //

CREATE TRIGGER update_risk_exposure_meter_timestamp
BEFORE UPDATE ON risk_exposure_meters
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

CREATE TRIGGER update_portfolio_risk_metrics_meter_timestamp
AFTER INSERT ON portfolio_risk_metrics
FOR EACH ROW
BEGIN
    UPDATE risk_exposure_meters 
    SET last_calculated = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.meter_id;
END//

CREATE TRIGGER update_compliance_status_on_violation
AFTER INSERT ON compliance_violations
FOR EACH ROW
BEGIN
    UPDATE risk_compliance_status 
    SET overall_status = CASE 
        WHEN NEW.severity IN ('critical', 'severe') THEN 'breach'
        WHEN NEW.severity = 'major' THEN 'violation'
        ELSE 'warning'
    END,
    last_assessment = CURRENT_TIMESTAMP
    WHERE meter_id = NEW.meter_id;
END//

DELIMITER ;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON risk_exposure_meters TO 'stackmotive_app'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio_risk_metrics TO 'stackmotive_app'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON risk_alerts TO 'stackmotive_app'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON stress_test_results TO 'stackmotive_app'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON risk_compliance_status TO 'stackmotive_app'@'%';

-- Add comments for documentation
ALTER TABLE risk_exposure_meters COMMENT = 'Main risk exposure meters for portfolio risk monitoring';
ALTER TABLE portfolio_risk_metrics COMMENT = 'Historical portfolio risk metrics and calculations';
ALTER TABLE risk_alerts COMMENT = 'Risk alerts and notifications for threshold breaches';
ALTER TABLE stress_test_results COMMENT = 'Results from portfolio stress testing scenarios';
ALTER TABLE risk_compliance_status COMMENT = 'Compliance status tracking for risk management';
ALTER TABLE stress_test_scenarios COMMENT = 'Predefined and custom stress test scenarios';

-- Risk Exposure Meter Migration Complete
-- Block 77: Comprehensive risk analytics with AU/NZ market integration
-- Supports: Risk metrics, stress testing, alerts, compliance, AU/NZ specific risks 