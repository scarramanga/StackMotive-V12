-- Block 97: Portfolio Exposure Breakdown - Database Migration
-- Portfolio Analysis, Risk Exposure, and Diversification Tracking Tables

-- Portfolio Exposure Breakdowns - Main configuration table
CREATE TABLE portfolio_exposure_breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    portfolio_id UUID NOT NULL,
    breakdown_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuration
    analysis_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    alert_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_exposure_breakdowns_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Exposure Analysis Results - Core analysis data
CREATE TABLE exposure_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breakdown_id UUID NOT NULL,
    
    -- Analysis metadata
    analysis_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_value DECIMAL(20,2) NOT NULL,
    total_positions INTEGER NOT NULL,
    
    -- Quality metrics
    quality_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Concentration metrics
    concentration_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Overall analysis data
    analysis_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_exposure_analysis_breakdown FOREIGN KEY (breakdown_id) REFERENCES portfolio_exposure_breakdowns(id) ON DELETE CASCADE
);

-- Sector Exposure Breakdown - Sector-wise exposure analysis
CREATE TABLE sector_exposure_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL,
    
    -- Sector identification
    sector_id VARCHAR(100) NOT NULL,
    sector_name VARCHAR(255) NOT NULL,
    classification VARCHAR(100) NOT NULL,
    
    -- Allocation metrics
    allocation DECIMAL(8,6) NOT NULL CHECK (allocation >= 0 AND allocation <= 1),
    market_value DECIMAL(20,2) NOT NULL,
    position_count INTEGER NOT NULL,
    average_weight DECIMAL(8,6) NOT NULL,
    
    -- Risk metrics
    risk_contribution DECIMAL(8,6) NOT NULL,
    volatility DECIMAL(8,6),
    beta DECIMAL(8,4),
    correlation DECIMAL(8,6),
    
    -- Performance metrics
    performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Benchmark comparison
    benchmark_allocation DECIMAL(8,6),
    active_weight DECIMAL(8,6),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_sector_exposure_analysis FOREIGN KEY (analysis_id) REFERENCES exposure_analysis_results(id) ON DELETE CASCADE
);

-- Geographic Exposure Breakdown - Geographic exposure analysis
CREATE TABLE geographic_exposure_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL,
    
    -- Geographic identification
    country_id VARCHAR(10) NOT NULL,
    country_name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    
    -- Allocation metrics
    allocation DECIMAL(8,6) NOT NULL CHECK (allocation >= 0 AND allocation <= 1),
    market_value DECIMAL(20,2) NOT NULL,
    position_count INTEGER NOT NULL,
    
    -- Currency exposure
    currency_exposure DECIMAL(8,6) NOT NULL,
    currency_code VARCHAR(10) NOT NULL,
    
    -- Risk metrics
    risk_contribution DECIMAL(8,6) NOT NULL,
    sovereign_risk DECIMAL(8,6),
    political_risk DECIMAL(8,6),
    
    -- Performance metrics
    performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Market characteristics
    market_classification VARCHAR(50), -- developed, emerging, frontier
    liquidity_score DECIMAL(4,3),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_geographic_exposure_analysis FOREIGN KEY (analysis_id) REFERENCES exposure_analysis_results(id) ON DELETE CASCADE
);

-- Asset Class Exposure Breakdown - Asset class allocation analysis
CREATE TABLE asset_class_exposure_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL,
    
    -- Asset class identification
    asset_class_id VARCHAR(100) NOT NULL,
    asset_class_name VARCHAR(255) NOT NULL,
    
    -- Allocation metrics
    allocation DECIMAL(8,6) NOT NULL CHECK (allocation >= 0 AND allocation <= 1),
    market_value DECIMAL(20,2) NOT NULL,
    position_count INTEGER NOT NULL,
    
    -- Liquidity metrics
    liquidity_score DECIMAL(4,3),
    liquidity_tier INTEGER,
    
    -- Risk metrics
    risk_contribution DECIMAL(8,6) NOT NULL,
    volatility DECIMAL(8,6),
    
    -- Strategic allocation comparison
    target_allocation DECIMAL(8,6),
    allocation_drift DECIMAL(8,6),
    
    -- Performance metrics
    performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_asset_class_exposure_analysis FOREIGN KEY (analysis_id) REFERENCES exposure_analysis_results(id) ON DELETE CASCADE
);

-- Market Cap Exposure Breakdown - Market capitalization analysis
CREATE TABLE market_cap_exposure_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL,
    
    -- Market cap identification
    market_cap_id VARCHAR(100) NOT NULL,
    market_cap_range VARCHAR(255) NOT NULL,
    
    -- Allocation metrics
    allocation DECIMAL(8,6) NOT NULL CHECK (allocation >= 0 AND allocation <= 1),
    market_value DECIMAL(20,2) NOT NULL,
    position_count INTEGER NOT NULL,
    average_market_cap DECIMAL(20,2),
    
    -- Risk metrics
    risk_contribution DECIMAL(8,6) NOT NULL,
    volatility DECIMAL(8,6),
    beta DECIMAL(8,4),
    
    -- Style characteristics
    growth_score DECIMAL(4,3),
    value_score DECIMAL(4,3),
    quality_score DECIMAL(4,3),
    momentum_score DECIMAL(4,3),
    
    -- Performance metrics
    performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_market_cap_exposure_analysis FOREIGN KEY (analysis_id) REFERENCES exposure_analysis_results(id) ON DELETE CASCADE
);

-- Currency Exposure Breakdown - Currency exposure and hedging analysis
CREATE TABLE currency_exposure_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL,
    
    -- Currency identification
    currency_code VARCHAR(10) NOT NULL,
    currency_name VARCHAR(100) NOT NULL,
    
    -- Exposure metrics
    allocation DECIMAL(8,6) NOT NULL CHECK (allocation >= 0 AND allocation <= 1),
    market_value DECIMAL(20,2) NOT NULL,
    hedged_amount DECIMAL(20,2) NOT NULL DEFAULT 0,
    unhedged_amount DECIMAL(20,2) NOT NULL DEFAULT 0,
    hedge_ratio DECIMAL(8,6) NOT NULL DEFAULT 0,
    
    -- FX risk metrics
    fx_risk DECIMAL(8,6),
    fx_volatility DECIMAL(8,6),
    fx_beta DECIMAL(8,4),
    
    -- Performance metrics
    performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Hedging details
    hedging_instruments JSONB NOT NULL DEFAULT '[]'::jsonb,
    hedging_cost DECIMAL(8,6),
    hedging_effectiveness DECIMAL(8,6),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_currency_exposure_analysis FOREIGN KEY (analysis_id) REFERENCES exposure_analysis_results(id) ON DELETE CASCADE
);

-- Risk Metrics - Portfolio risk analysis
CREATE TABLE portfolio_risk_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breakdown_id UUID NOT NULL,
    analysis_id UUID NOT NULL,
    
    -- VaR metrics
    var_95 DECIMAL(8,6) NOT NULL,
    var_99 DECIMAL(8,6) NOT NULL,
    var_99_9 DECIMAL(8,6) NOT NULL,
    expected_shortfall_95 DECIMAL(8,6) NOT NULL,
    expected_shortfall_99 DECIMAL(8,6) NOT NULL,
    
    -- Portfolio metrics
    portfolio_beta DECIMAL(8,4) NOT NULL,
    portfolio_volatility DECIMAL(8,6) NOT NULL,
    tracking_error DECIMAL(8,6) NOT NULL,
    information_ratio DECIMAL(8,4),
    sharpe_ratio DECIMAL(8,4),
    
    -- Downside risk
    downside_deviation DECIMAL(8,6),
    sortino_ratio DECIMAL(8,4),
    max_drawdown DECIMAL(8,6),
    
    -- Risk methodology
    calculation_method VARCHAR(100) NOT NULL,
    confidence_level DECIMAL(4,3) NOT NULL,
    time_horizon INTEGER NOT NULL,
    
    -- Risk factor exposures
    risk_factor_exposures JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_risk_metrics_breakdown FOREIGN KEY (breakdown_id) REFERENCES portfolio_exposure_breakdowns(id) ON DELETE CASCADE,
    CONSTRAINT fk_risk_metrics_analysis FOREIGN KEY (analysis_id) REFERENCES exposure_analysis_results(id) ON DELETE CASCADE
);

-- Risk Contributions - Individual position risk contributions
CREATE TABLE risk_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_metrics_id UUID NOT NULL,
    
    -- Asset identification
    asset_id VARCHAR(100) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50),
    
    -- Position metrics
    weight DECIMAL(8,6) NOT NULL,
    market_value DECIMAL(20,2) NOT NULL,
    
    -- Risk contributions
    risk_contribution DECIMAL(8,6) NOT NULL,
    marginal_risk DECIMAL(8,6) NOT NULL,
    component_risk DECIMAL(8,6) NOT NULL,
    marginal_var DECIMAL(8,6),
    
    -- Asset risk characteristics
    asset_volatility DECIMAL(8,6),
    asset_beta DECIMAL(8,4),
    correlation_to_portfolio DECIMAL(8,6),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_risk_contributions_metrics FOREIGN KEY (risk_metrics_id) REFERENCES portfolio_risk_metrics(id) ON DELETE CASCADE
);

-- Diversification Analysis - Portfolio diversification metrics
CREATE TABLE diversification_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breakdown_id UUID NOT NULL,
    analysis_id UUID NOT NULL,
    
    -- Core diversification metrics
    diversification_ratio DECIMAL(8,6) NOT NULL,
    effective_number_positions DECIMAL(8,2) NOT NULL,
    concentration_ratio DECIMAL(8,6) NOT NULL,
    herfindal_index DECIMAL(8,6) NOT NULL,
    
    -- Correlation metrics
    average_correlation DECIMAL(8,6) NOT NULL,
    min_correlation DECIMAL(8,6),
    max_correlation DECIMAL(8,6),
    
    -- Dimension-specific scores
    sector_diversification_score DECIMAL(4,3),
    geographic_diversification_score DECIMAL(4,3),
    asset_class_diversification_score DECIMAL(4,3),
    
    -- Efficiency metrics
    diversification_efficiency DECIMAL(4,3),
    
    -- Optimization suggestions
    optimization_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
    improvement_opportunities JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_diversification_breakdown FOREIGN KEY (breakdown_id) REFERENCES portfolio_exposure_breakdowns(id) ON DELETE CASCADE,
    CONSTRAINT fk_diversification_analysis FOREIGN KEY (analysis_id) REFERENCES exposure_analysis_results(id) ON DELETE CASCADE
);

-- Concentration Analysis - Position and sector concentration tracking
CREATE TABLE concentration_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breakdown_id UUID NOT NULL,
    analysis_id UUID NOT NULL,
    
    -- Concentration indices
    herfindal_index DECIMAL(8,6) NOT NULL,
    gini_coefficient DECIMAL(8,6) NOT NULL,
    concentration_index DECIMAL(8,6) NOT NULL,
    
    -- Top holdings metrics
    max_single_position DECIMAL(8,6) NOT NULL,
    top_5_concentration DECIMAL(8,6) NOT NULL,
    top_10_concentration DECIMAL(8,6) NOT NULL,
    
    -- Dimension-specific concentration
    sector_concentration JSONB NOT NULL DEFAULT '{}'::jsonb,
    geographic_concentration JSONB NOT NULL DEFAULT '{}'::jsonb,
    asset_class_concentration JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Risk concentration
    risk_concentration_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Concentration trends
    concentration_trend DECIMAL(8,6),
    trend_direction VARCHAR(20),
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_concentration_breakdown FOREIGN KEY (breakdown_id) REFERENCES portfolio_exposure_breakdowns(id) ON DELETE CASCADE,
    CONSTRAINT fk_concentration_analysis FOREIGN KEY (analysis_id) REFERENCES exposure_analysis_results(id) ON DELETE CASCADE
);

-- Stress Test Results - Scenario analysis results
CREATE TABLE stress_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breakdown_id UUID NOT NULL,
    
    -- Scenario identification
    scenario_id VARCHAR(100) NOT NULL,
    scenario_name VARCHAR(255) NOT NULL,
    scenario_type VARCHAR(100) NOT NULL,
    scenario_description TEXT,
    
    -- Test parameters
    test_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Results
    portfolio_impact DECIMAL(8,6) NOT NULL,
    absolute_impact DECIMAL(20,2) NOT NULL,
    
    -- Position impacts
    position_impacts JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Risk metric changes
    risk_metric_changes JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Test metadata
    test_methodology VARCHAR(100) NOT NULL,
    confidence_level DECIMAL(4,3),
    
    -- Timestamps
    test_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_stress_test_breakdown FOREIGN KEY (breakdown_id) REFERENCES portfolio_exposure_breakdowns(id) ON DELETE CASCADE
);

-- Correlation Matrix - Asset correlation tracking
CREATE TABLE correlation_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breakdown_id UUID NOT NULL,
    analysis_id UUID NOT NULL,
    
    -- Calculation parameters
    calculation_method VARCHAR(50) NOT NULL,
    time_window INTEGER NOT NULL, -- days
    min_observations INTEGER NOT NULL,
    
    -- Matrix metadata
    asset_count INTEGER NOT NULL,
    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Correlation data
    correlation_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    asset_list JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Summary statistics
    average_correlation DECIMAL(8,6) NOT NULL,
    min_correlation DECIMAL(8,6) NOT NULL,
    max_correlation DECIMAL(8,6) NOT NULL,
    correlation_volatility DECIMAL(8,6),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_correlation_breakdown FOREIGN KEY (breakdown_id) REFERENCES portfolio_exposure_breakdowns(id) ON DELETE CASCADE,
    CONSTRAINT fk_correlation_analysis FOREIGN KEY (analysis_id) REFERENCES exposure_analysis_results(id) ON DELETE CASCADE
);

-- Portfolio Optimization Results - Optimization analysis results
CREATE TABLE portfolio_optimization_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breakdown_id UUID NOT NULL,
    
    -- Optimization parameters
    optimization_method VARCHAR(100) NOT NULL,
    objective_function VARCHAR(100) NOT NULL,
    constraints JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Results
    expected_return DECIMAL(8,6) NOT NULL,
    expected_risk DECIMAL(8,6) NOT NULL,
    sharpe_ratio DECIMAL(8,4) NOT NULL,
    tracking_error DECIMAL(8,6),
    turnover DECIMAL(8,6),
    
    -- Optimized weights
    optimized_weights JSONB NOT NULL DEFAULT '[]'::jsonb,
    weight_changes JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Improvement metrics
    risk_reduction DECIMAL(8,6),
    return_improvement DECIMAL(8,6),
    sharpe_improvement DECIMAL(8,4),
    diversification_improvement DECIMAL(8,6),
    
    -- Implementation details
    implementation_cost DECIMAL(8,6),
    implementation_timeline VARCHAR(100),
    
    -- Timestamps
    optimization_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_optimization_breakdown FOREIGN KEY (breakdown_id) REFERENCES portfolio_exposure_breakdowns(id) ON DELETE CASCADE
);

-- Exposure Alerts - Alert tracking and history
CREATE TABLE exposure_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breakdown_id UUID NOT NULL,
    
    -- Alert identification
    alert_type VARCHAR(100) NOT NULL,
    alert_name VARCHAR(255) NOT NULL,
    alert_severity VARCHAR(50) NOT NULL,
    
    -- Alert conditions
    metric_name VARCHAR(100) NOT NULL,
    threshold_value DECIMAL(20,8) NOT NULL,
    current_value DECIMAL(20,8) NOT NULL,
    condition_type VARCHAR(20) NOT NULL, -- above, below, equals
    
    -- Alert details
    alert_message TEXT NOT NULL,
    recommendation TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID,
    
    -- Resolution
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Timestamps
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_exposure_alerts_breakdown FOREIGN KEY (breakdown_id) REFERENCES portfolio_exposure_breakdowns(id) ON DELETE CASCADE,
    CONSTRAINT check_alert_severity CHECK (alert_severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT check_condition_type CHECK (condition_type IN ('above', 'below', 'equals'))
);

-- Compliance Analysis - Regulatory compliance tracking
CREATE TABLE exposure_compliance_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breakdown_id UUID NOT NULL,
    
    -- Regulatory framework
    regulatory_framework VARCHAR(50) NOT NULL,
    jurisdiction VARCHAR(10) NOT NULL,
    
    -- Compliance status
    overall_compliance_status VARCHAR(50) NOT NULL,
    last_compliance_check TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    next_compliance_check TIMESTAMP WITH TIME ZONE,
    
    -- Investment limits
    investment_limits JSONB NOT NULL DEFAULT '[]'::jsonb,
    concentration_limits JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Violations
    compliance_violations JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- ESG compliance
    esg_compliance JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Audit trail
    audit_trail JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT fk_compliance_breakdown FOREIGN KEY (breakdown_id) REFERENCES portfolio_exposure_breakdowns(id) ON DELETE CASCADE,
    CONSTRAINT check_regulatory_framework CHECK (regulatory_framework IN ('ASIC', 'FMA', 'MAS', 'CFTC', 'SEC', 'ESMA', 'custom')),
    CONSTRAINT check_jurisdiction CHECK (jurisdiction IN ('AU', 'NZ', 'BOTH')),
    CONSTRAINT check_compliance_status CHECK (overall_compliance_status IN ('compliant', 'non_compliant', 'warning', 'under_review'))
);

-- Analysis Reports - Generated report tracking
CREATE TABLE exposure_analysis_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breakdown_id UUID NOT NULL,
    
    -- Report identification
    report_id VARCHAR(100) NOT NULL UNIQUE,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    
    -- Report content
    report_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    report_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    charts JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Report metadata
    generated_by UUID,
    report_format VARCHAR(50) NOT NULL,
    report_size_kb INTEGER,
    
    -- Status
    report_status VARCHAR(50) NOT NULL DEFAULT 'generated',
    
    -- Access tracking
    download_count INTEGER DEFAULT 0,
    last_downloaded TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT fk_reports_breakdown FOREIGN KEY (breakdown_id) REFERENCES portfolio_exposure_breakdowns(id) ON DELETE CASCADE,
    CONSTRAINT check_report_type CHECK (report_type IN ('summary', 'detailed', 'executive', 'regulatory', 'risk', 'performance')),
    CONSTRAINT check_report_status CHECK (report_status IN ('generated', 'processing', 'completed', 'error', 'expired'))
);

-- Create indexes for performance
CREATE INDEX idx_exposure_breakdowns_user_id ON portfolio_exposure_breakdowns(user_id);
CREATE INDEX idx_exposure_breakdowns_portfolio_id ON portfolio_exposure_breakdowns(portfolio_id);
CREATE INDEX idx_exposure_breakdowns_active ON portfolio_exposure_breakdowns(is_active);
CREATE INDEX idx_exposure_breakdowns_analyzed ON portfolio_exposure_breakdowns(last_analyzed);

CREATE INDEX idx_exposure_analysis_breakdown ON exposure_analysis_results(breakdown_id);
CREATE INDEX idx_exposure_analysis_timestamp ON exposure_analysis_results(analysis_timestamp);
CREATE INDEX idx_exposure_analysis_value ON exposure_analysis_results(total_value);

CREATE INDEX idx_sector_exposure_analysis ON sector_exposure_breakdown(analysis_id);
CREATE INDEX idx_sector_exposure_sector ON sector_exposure_breakdown(sector_id);
CREATE INDEX idx_sector_exposure_allocation ON sector_exposure_breakdown(allocation);

CREATE INDEX idx_geographic_exposure_analysis ON geographic_exposure_breakdown(analysis_id);
CREATE INDEX idx_geographic_exposure_country ON geographic_exposure_breakdown(country_id);
CREATE INDEX idx_geographic_exposure_region ON geographic_exposure_breakdown(region);

CREATE INDEX idx_asset_class_exposure_analysis ON asset_class_exposure_breakdown(analysis_id);
CREATE INDEX idx_asset_class_exposure_class ON asset_class_exposure_breakdown(asset_class_id);

CREATE INDEX idx_market_cap_exposure_analysis ON market_cap_exposure_breakdown(analysis_id);
CREATE INDEX idx_market_cap_exposure_range ON market_cap_exposure_breakdown(market_cap_id);

CREATE INDEX idx_currency_exposure_analysis ON currency_exposure_breakdown(analysis_id);
CREATE INDEX idx_currency_exposure_code ON currency_exposure_breakdown(currency_code);

CREATE INDEX idx_risk_metrics_breakdown ON portfolio_risk_metrics(breakdown_id);
CREATE INDEX idx_risk_metrics_analysis ON portfolio_risk_metrics(analysis_id);
CREATE INDEX idx_risk_metrics_calculated ON portfolio_risk_metrics(calculated_at);

CREATE INDEX idx_risk_contributions_metrics ON risk_contributions(risk_metrics_id);
CREATE INDEX idx_risk_contributions_asset ON risk_contributions(asset_id);

CREATE INDEX idx_diversification_breakdown ON diversification_analysis(breakdown_id);
CREATE INDEX idx_diversification_calculated ON diversification_analysis(calculated_at);
CREATE INDEX idx_diversification_ratio ON diversification_analysis(diversification_ratio);

CREATE INDEX idx_concentration_breakdown ON concentration_analysis(breakdown_id);
CREATE INDEX idx_concentration_calculated ON concentration_analysis(calculated_at);

CREATE INDEX idx_stress_test_breakdown ON stress_test_results(breakdown_id);
CREATE INDEX idx_stress_test_scenario ON stress_test_results(scenario_id);
CREATE INDEX idx_stress_test_date ON stress_test_results(test_date);

CREATE INDEX idx_correlation_breakdown ON correlation_matrix(breakdown_id);
CREATE INDEX idx_correlation_date ON correlation_matrix(calculation_date);

CREATE INDEX idx_optimization_breakdown ON portfolio_optimization_results(breakdown_id);
CREATE INDEX idx_optimization_date ON portfolio_optimization_results(optimization_date);

CREATE INDEX idx_exposure_alerts_breakdown ON exposure_alerts(breakdown_id);
CREATE INDEX idx_exposure_alerts_triggered ON exposure_alerts(triggered_at);
CREATE INDEX idx_exposure_alerts_severity ON exposure_alerts(alert_severity);
CREATE INDEX idx_exposure_alerts_active ON exposure_alerts(is_active);

CREATE INDEX idx_compliance_breakdown ON exposure_compliance_analysis(breakdown_id);
CREATE INDEX idx_compliance_framework ON exposure_compliance_analysis(regulatory_framework);
CREATE INDEX idx_compliance_status ON exposure_compliance_analysis(overall_compliance_status);

CREATE INDEX idx_reports_breakdown ON exposure_analysis_reports(breakdown_id);
CREATE INDEX idx_reports_type ON exposure_analysis_reports(report_type);
CREATE INDEX idx_reports_generated ON exposure_analysis_reports(generated_at);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_exposure_breakdown_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_exposure_breakdown_timestamp
    BEFORE UPDATE ON portfolio_exposure_breakdowns
    FOR EACH ROW
    EXECUTE FUNCTION update_exposure_breakdown_timestamp();

CREATE OR REPLACE FUNCTION update_compliance_analysis_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_compliance_analysis_timestamp
    BEFORE UPDATE ON exposure_compliance_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_compliance_analysis_timestamp();

-- Create views for common queries
CREATE VIEW exposure_breakdown_summary AS
SELECT 
    peb.id,
    peb.user_id,
    peb.portfolio_id,
    peb.breakdown_name,
    peb.description,
    peb.is_active,
    peb.created_at,
    peb.last_analyzed,
    COUNT(DISTINCT ear.id) as analysis_count,
    COALESCE(ear_latest.total_value, 0) as latest_portfolio_value,
    COALESCE(ear_latest.total_positions, 0) as latest_position_count,
    COALESCE(da_latest.diversification_ratio, 0) as latest_diversification_ratio,
    COALESCE(ca_latest.concentration_index, 0) as latest_concentration_index
FROM portfolio_exposure_breakdowns peb
LEFT JOIN exposure_analysis_results ear ON peb.id = ear.breakdown_id
LEFT JOIN LATERAL (
    SELECT total_value, total_positions
    FROM exposure_analysis_results
    WHERE breakdown_id = peb.id
    ORDER BY analysis_timestamp DESC
    LIMIT 1
) ear_latest ON true
LEFT JOIN LATERAL (
    SELECT diversification_ratio
    FROM diversification_analysis
    WHERE breakdown_id = peb.id
    ORDER BY calculated_at DESC
    LIMIT 1
) da_latest ON true
LEFT JOIN LATERAL (
    SELECT concentration_index
    FROM concentration_analysis
    WHERE breakdown_id = peb.id
    ORDER BY calculated_at DESC
    LIMIT 1
) ca_latest ON true
GROUP BY peb.id, peb.user_id, peb.portfolio_id, peb.breakdown_name, 
         peb.description, peb.is_active, peb.created_at, peb.last_analyzed,
         ear_latest.total_value, ear_latest.total_positions,
         da_latest.diversification_ratio, ca_latest.concentration_index;

CREATE VIEW portfolio_risk_summary AS
SELECT 
    peb.id as breakdown_id,
    peb.breakdown_name,
    peb.portfolio_id,
    prm.var_95,
    prm.var_99,
    prm.portfolio_beta,
    prm.portfolio_volatility,
    prm.sharpe_ratio,
    prm.max_drawdown,
    da.diversification_ratio,
    ca.concentration_index,
    prm.calculated_at as risk_calculated_at
FROM portfolio_exposure_breakdowns peb
LEFT JOIN portfolio_risk_metrics prm ON peb.id = prm.breakdown_id
LEFT JOIN diversification_analysis da ON peb.id = da.breakdown_id
LEFT JOIN concentration_analysis ca ON peb.id = ca.breakdown_id
WHERE peb.is_active = true
  AND prm.calculated_at = (
    SELECT MAX(calculated_at) 
    FROM portfolio_risk_metrics 
    WHERE breakdown_id = peb.id
  );

CREATE VIEW exposure_alert_summary AS
SELECT 
    peb.id as breakdown_id,
    peb.breakdown_name,
    COUNT(ea.id) as total_alerts,
    SUM(CASE WHEN ea.is_active = true THEN 1 ELSE 0 END) as active_alerts,
    SUM(CASE WHEN ea.alert_severity = 'critical' AND ea.is_active = true THEN 1 ELSE 0 END) as critical_alerts,
    SUM(CASE WHEN ea.acknowledged = false AND ea.is_active = true THEN 1 ELSE 0 END) as unacknowledged_alerts,
    MAX(ea.triggered_at) as last_alert_time
FROM portfolio_exposure_breakdowns peb
LEFT JOIN exposure_alerts ea ON peb.id = ea.breakdown_id
WHERE peb.is_active = true
GROUP BY peb.id, peb.breakdown_name;

-- Insert sample data for testing
INSERT INTO portfolio_exposure_breakdowns (user_id, portfolio_id, breakdown_name, description, analysis_config, is_active)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'portfolio_001', 'Primary Portfolio Analysis', 'Comprehensive exposure analysis for primary investment portfolio', 
     '{"updateFrequency": "daily", "analysisTypes": ["exposure", "risk", "diversification"], "jurisdiction": "AU"}'::jsonb, true),
    ('550e8400-e29b-41d4-a716-446655440001', 'portfolio_002', 'Conservative Portfolio Breakdown', 'Risk-focused analysis for conservative investment strategy', 
     '{"updateFrequency": "weekly", "analysisTypes": ["risk", "concentration"], "jurisdiction": "NZ"}'::jsonb, true);

-- Comment on tables and columns
COMMENT ON TABLE portfolio_exposure_breakdowns IS 'Main configuration table for portfolio exposure analysis';
COMMENT ON TABLE exposure_analysis_results IS 'Core portfolio analysis results with quality metrics';
COMMENT ON TABLE sector_exposure_breakdown IS 'Sector-wise portfolio exposure and allocation analysis';
COMMENT ON TABLE geographic_exposure_breakdown IS 'Geographic exposure and currency risk analysis';
COMMENT ON TABLE asset_class_exposure_breakdown IS 'Asset class allocation and liquidity analysis';
COMMENT ON TABLE market_cap_exposure_breakdown IS 'Market capitalization and style factor analysis';
COMMENT ON TABLE currency_exposure_breakdown IS 'Currency exposure and hedging effectiveness analysis';
COMMENT ON TABLE portfolio_risk_metrics IS 'Comprehensive portfolio risk metrics including VaR and volatility';
COMMENT ON TABLE risk_contributions IS 'Individual position risk contributions and marginal risk';
COMMENT ON TABLE diversification_analysis IS 'Portfolio diversification metrics and optimization suggestions';
COMMENT ON TABLE concentration_analysis IS 'Position and sector concentration analysis';
COMMENT ON TABLE stress_test_results IS 'Scenario analysis and stress testing results';
COMMENT ON TABLE correlation_matrix IS 'Asset correlation matrices and relationship analysis';
COMMENT ON TABLE portfolio_optimization_results IS 'Portfolio optimization recommendations and expected improvements';
COMMENT ON TABLE exposure_alerts IS 'Real-time alerts for exposure limit breaches and risk thresholds';
COMMENT ON TABLE exposure_compliance_analysis IS 'Regulatory compliance tracking for AU/NZ requirements';
COMMENT ON TABLE exposure_analysis_reports IS 'Generated analysis reports and documentation';

COMMENT ON COLUMN portfolio_exposure_breakdowns.analysis_config IS 'JSON configuration for analysis parameters, update frequency, and scope';
COMMENT ON COLUMN exposure_analysis_results.quality_scores IS 'Data quality metrics including completeness, accuracy, and timeliness';
COMMENT ON COLUMN sector_exposure_breakdown.allocation IS 'Sector allocation as percentage of total portfolio (0-1)';
COMMENT ON COLUMN geographic_exposure_breakdown.sovereign_risk IS 'Country-specific sovereign risk assessment';
COMMENT ON COLUMN portfolio_risk_metrics.var_95 IS '95% confidence Value at Risk over specified time horizon';
COMMENT ON COLUMN diversification_analysis.diversification_ratio IS 'Portfolio diversification ratio (0-1, higher is better)';
COMMENT ON COLUMN exposure_compliance_analysis.regulatory_framework IS 'Applicable regulatory framework: ASIC (Australia), FMA (New Zealand), etc.'; 