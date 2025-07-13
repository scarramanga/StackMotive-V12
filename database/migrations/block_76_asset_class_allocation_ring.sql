-- Block 76: Asset Class Allocation Ring - Database Schema
-- Smart Asset Class Allocation Ring with AU/NZ Tax Integration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types for asset allocation system
CREATE TYPE asset_class_type AS ENUM (
    'equities', 'bonds', 'etfs', 'managed_funds', 'property', 
    'crypto', 'commodities', 'cash', 'alternatives', 'other'
);

CREATE TYPE geographic_region AS ENUM (
    'AU', 'NZ', 'US', 'UK', 'ASIA', 'EUROPE', 'EMERGING', 'GLOBAL', 'OTHER'
);

CREATE TYPE ring_view_type AS ENUM (
    'simple', 'detailed', 'tax_aware', 'performance', 'risk', 'geographic', 'custom'
);

CREATE TYPE ring_color_scheme AS ENUM (
    'default', 'vibrant', 'muted', 'professional', 'tax_aware', 'performance', 'custom'
);

CREATE TYPE strategy_type AS ENUM (
    'conservative', 'moderate', 'aggressive', 'income_focused', 
    'growth_focused', 'tax_efficient', 'custom'
);

CREATE TYPE risk_tolerance AS ENUM ('very_low', 'low', 'moderate', 'high', 'very_high');
CREATE TYPE time_horizon AS ENUM ('short', 'medium', 'long', 'very_long');

CREATE TYPE suggestion_type AS ENUM (
    'drift_correction', 'tax_optimization', 'performance_improvement', 
    'risk_reduction', 'constraint_compliance', 'opportunity_based'
);

CREATE TYPE suggestion_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE compliance_status AS ENUM ('compliant', 'minor_issues', 'major_issues', 'non_compliant');

-- Asset Class Allocation Rings table
CREATE TABLE asset_class_allocation_rings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Ring identification
    ring_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Portfolio reference
    portfolio_id VARCHAR(255) NOT NULL,
    portfolio_value DECIMAL(15,2) NOT NULL CHECK (portfolio_value >= 0),
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('AUD', 'NZD', 'USD')),
    
    -- Ring configuration
    ring_config JSONB DEFAULT '{}',
    current_view ring_view_type DEFAULT 'simple',
    
    -- Status flags
    rebalancing_needed BOOLEAN DEFAULT FALSE,
    
    -- Tax insights summary
    overall_tax_efficiency DECIMAL(5,2) DEFAULT 0 CHECK (overall_tax_efficiency >= 0 AND overall_tax_efficiency <= 100),
    tax_drag_estimate DECIMAL(5,2) DEFAULT 0,
    
    -- Performance summary
    total_return DECIMAL(8,2) DEFAULT 0,
    annualized_return DECIMAL(8,2) DEFAULT 0,
    volatility DECIMAL(8,2) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0,
    
    -- Compliance status
    compliance_status compliance_status DEFAULT 'compliant',
    last_compliance_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset Class Allocations table
CREATE TABLE asset_class_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ring_id UUID NOT NULL REFERENCES asset_class_allocation_rings(id) ON DELETE CASCADE,
    
    -- Asset class details
    asset_class asset_class_type NOT NULL,
    asset_class_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Current allocation
    current_value DECIMAL(15,2) NOT NULL CHECK (current_value >= 0),
    current_percentage DECIMAL(5,2) NOT NULL CHECK (current_percentage >= 0 AND current_percentage <= 100),
    target_percentage DECIMAL(5,2) NOT NULL CHECK (target_percentage >= 0 AND target_percentage <= 100),
    variance DECIMAL(5,2) NOT NULL DEFAULT 0, -- Difference from target
    
    -- Geographic breakdown (stored as JSONB for flexibility)
    geographic_breakdown JSONB DEFAULT '[]',
    
    -- Tax characteristics
    tax_efficiency_score DECIMAL(5,2) DEFAULT 0 CHECK (tax_efficiency_score >= 0 AND tax_efficiency_score <= 100),
    dividend_yield DECIMAL(5,2) DEFAULT 0,
    franking_credit_yield DECIMAL(5,2) DEFAULT 0, -- AU only
    expected_turnover DECIMAL(5,2) DEFAULT 0,
    
    -- AU/NZ specific fields
    franking_level VARCHAR(20), -- 'none', 'partial', 'full' for AU
    cgt_discount_percentage DECIMAL(5,2) DEFAULT 0, -- AU: % of holdings >12 months
    investor_status_applicable BOOLEAN DEFAULT FALSE, -- NZ: investor vs trader
    fif_applicable BOOLEAN DEFAULT FALSE, -- NZ: FIF obligations
    
    -- Performance metrics
    one_year_return DECIMAL(8,2) DEFAULT 0,
    three_year_return DECIMAL(8,2) DEFAULT 0,
    asset_volatility DECIMAL(8,2) DEFAULT 0,
    contribution_to_return DECIMAL(8,4) DEFAULT 0,
    contribution_to_risk DECIMAL(8,4) DEFAULT 0,
    
    -- Holdings summary
    holdings_count INTEGER DEFAULT 0 CHECK (holdings_count >= 0),
    top_holdings JSONB DEFAULT '[]', -- Array of top holdings
    
    -- Ring visualization
    ring_segment JSONB DEFAULT '{}', -- Segment geometry and styling
    
    -- Metadata
    last_rebalanced TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Target Allocations table
CREATE TABLE target_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ring_id UUID NOT NULL REFERENCES asset_class_allocation_rings(id) ON DELETE CASCADE,
    
    -- Target details
    target_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Strategy information
    strategy_type strategy_type NOT NULL,
    strategy_name VARCHAR(255) NOT NULL,
    risk_tolerance risk_tolerance NOT NULL,
    time_horizon time_horizon NOT NULL,
    investment_goals TEXT[], -- Array of goals
    
    -- Tax optimization settings (JSONB for flexibility)
    tax_optimization JSONB DEFAULT '{}',
    
    -- Benchmark information
    benchmark_portfolio JSONB DEFAULT '{}',
    
    -- Performance expectations
    expected_return DECIMAL(8,2) DEFAULT 0,
    expected_volatility DECIMAL(8,2) DEFAULT 0,
    expected_tax_drag DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset Class Targets table (junction table for target allocations)
CREATE TABLE asset_class_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_allocation_id UUID NOT NULL REFERENCES target_allocations(id) ON DELETE CASCADE,
    
    -- Target details
    asset_class asset_class_type NOT NULL,
    target_percentage DECIMAL(5,2) NOT NULL CHECK (target_percentage >= 0 AND target_percentage <= 100),
    min_percentage DECIMAL(5,2) CHECK (min_percentage >= 0 AND min_percentage <= 100),
    max_percentage DECIMAL(5,2) CHECK (max_percentage >= 0 AND max_percentage <= 100),
    
    -- Rebalancing settings
    rebalance_threshold DECIMAL(5,2) DEFAULT 5 CHECK (rebalance_threshold >= 0),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    
    -- Constraints
    CONSTRAINT valid_percentage_ranges CHECK (
        min_percentage IS NULL OR max_percentage IS NULL OR min_percentage <= max_percentage
    ),
    CONSTRAINT valid_target_in_range CHECK (
        (min_percentage IS NULL OR target_percentage >= min_percentage) AND
        (max_percentage IS NULL OR target_percentage <= max_percentage)
    )
);

-- Allocation Constraints table
CREATE TABLE allocation_constraints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ring_id UUID NOT NULL REFERENCES asset_class_allocation_rings(id) ON DELETE CASCADE,
    
    -- Constraint details
    constraint_name VARCHAR(255) NOT NULL,
    constraint_type VARCHAR(50) NOT NULL, -- 'asset_class_limit', 'geographic_limit', etc.
    description TEXT,
    
    -- Constraint parameters
    asset_class asset_class_type,
    geography geographic_region,
    min_value DECIMAL(5,2),
    max_value DECIMAL(5,2),
    absolute_limit DECIMAL(15,2),
    
    -- Tax constraints (JSONB for flexibility)
    tax_constraints JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rebalancing Suggestions table
CREATE TABLE rebalancing_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ring_id UUID NOT NULL REFERENCES asset_class_allocation_rings(id) ON DELETE CASCADE,
    
    -- Suggestion details
    suggestion_type suggestion_type NOT NULL,
    priority suggestion_priority NOT NULL,
    description TEXT NOT NULL,
    
    -- Proposed changes (stored as JSONB)
    proposed_changes JSONB DEFAULT '[]',
    
    -- Expected impact
    expected_return_change DECIMAL(8,4) DEFAULT 0,
    risk_change DECIMAL(8,4) DEFAULT 0,
    estimated_cost DECIMAL(10,2) DEFAULT 0,
    tax_impact DECIMAL(10,2) DEFAULT 0,
    
    -- Tax implications (JSONB for detailed tax calculations)
    tax_implications JSONB DEFAULT '{}',
    
    -- Implementation
    implementation_steps JSONB DEFAULT '[]',
    estimated_timeframe VARCHAR(100),
    
    -- Timing
    suggested_timing TIMESTAMP WITH TIME ZONE,
    urgency VARCHAR(20) DEFAULT 'moderate' CHECK (urgency IN ('immediate', 'soon', 'moderate', 'when_convenient')),
    
    -- Status
    is_accepted BOOLEAN DEFAULT FALSE,
    is_implemented BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allocation Performance History table
CREATE TABLE allocation_performance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ring_id UUID NOT NULL REFERENCES asset_class_allocation_rings(id) ON DELETE CASCADE,
    
    -- Performance period
    measurement_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('1M', '3M', '6M', '1Y', '3Y', '5Y', 'ITD')),
    
    -- Performance metrics
    total_return DECIMAL(8,2) NOT NULL,
    benchmark_return DECIMAL(8,2),
    excess_return DECIMAL(8,2),
    volatility DECIMAL(8,2) NOT NULL,
    sharpe_ratio DECIMAL(8,4),
    max_drawdown DECIMAL(8,2),
    
    -- Risk metrics
    systematic_risk DECIMAL(8,2),
    idiosyncratic_risk DECIMAL(8,2),
    
    -- Tax-adjusted performance
    pre_tax_return DECIMAL(8,2) NOT NULL,
    after_tax_return DECIMAL(8,2) NOT NULL,
    tax_drag DECIMAL(5,2) NOT NULL,
    tax_efficiency_ratio DECIMAL(8,4),
    
    -- Attribution (JSONB for asset class breakdown)
    performance_attribution JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique measurement per ring/date/period
    UNIQUE(ring_id, measurement_date, period_type)
);

-- Allocation Drift History table
CREATE TABLE allocation_drift_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ring_id UUID NOT NULL REFERENCES asset_class_allocation_rings(id) ON DELETE CASCADE,
    
    -- Drift measurement
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_drift DECIMAL(8,2) NOT NULL CHECK (total_drift >= 0), -- Sum of absolute variances
    max_drift DECIMAL(8,2) NOT NULL CHECK (max_drift >= 0), -- Largest single variance
    
    -- Asset class specific drift (JSONB array)
    asset_class_drifts JSONB DEFAULT '[]',
    
    -- Drift causes (JSONB array)
    drift_causes JSONB DEFAULT '[]',
    
    -- Actions taken (JSONB array)
    actions_taken JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax Insights History table
CREATE TABLE tax_insights_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ring_id UUID NOT NULL REFERENCES asset_class_allocation_rings(id) ON DELETE CASCADE,
    
    -- Insight date
    insight_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Overall tax efficiency
    overall_tax_efficiency DECIMAL(5,2) NOT NULL CHECK (overall_tax_efficiency >= 0 AND overall_tax_efficiency <= 100),
    tax_drag_estimate DECIMAL(5,2) NOT NULL,
    
    -- AU specific insights (NULL for non-AU portfolios)
    total_franking_yield DECIMAL(5,2),
    franking_concentration DECIMAL(5,2),
    cgt_discount_eligible_percentage DECIMAL(5,2),
    potential_cgt_liability DECIMAL(15,2),
    
    -- NZ specific insights (NULL for non-NZ portfolios)
    fif_threshold_utilization DECIMAL(5,2),
    fif_liability_estimate DECIMAL(15,2),
    cgt_exempt_percentage DECIMAL(5,2),
    investor_status_risk VARCHAR(20),
    
    -- Tax recommendations (JSONB array)
    tax_recommendations JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ring Configuration History table (for tracking changes)
CREATE TABLE ring_configuration_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ring_id UUID NOT NULL REFERENCES asset_class_allocation_rings(id) ON DELETE CASCADE,
    
    -- Configuration change
    change_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_type VARCHAR(50) NOT NULL, -- 'visual_config', 'view_change', 'layer_toggle', etc.
    
    -- Configuration data
    old_config JSONB,
    new_config JSONB,
    
    -- Change description
    description TEXT,
    
    -- User who made the change
    changed_by UUID REFERENCES auth.users(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_asset_class_allocation_rings_user_id ON asset_class_allocation_rings(user_id);
CREATE INDEX idx_asset_class_allocation_rings_portfolio_id ON asset_class_allocation_rings(portfolio_id);
CREATE INDEX idx_asset_class_allocation_rings_currency ON asset_class_allocation_rings(currency);
CREATE INDEX idx_asset_class_allocation_rings_compliance_status ON asset_class_allocation_rings(compliance_status);
CREATE INDEX idx_asset_class_allocation_rings_last_updated ON asset_class_allocation_rings(last_updated);

CREATE INDEX idx_asset_class_allocations_ring_id ON asset_class_allocations(ring_id);
CREATE INDEX idx_asset_class_allocations_asset_class ON asset_class_allocations(asset_class);
CREATE INDEX idx_asset_class_allocations_variance ON asset_class_allocations(variance);

CREATE INDEX idx_target_allocations_ring_id ON target_allocations(ring_id);
CREATE INDEX idx_target_allocations_is_active ON target_allocations(is_active);
CREATE INDEX idx_target_allocations_strategy_type ON target_allocations(strategy_type);

CREATE INDEX idx_asset_class_targets_target_allocation_id ON asset_class_targets(target_allocation_id);
CREATE INDEX idx_asset_class_targets_asset_class ON asset_class_targets(asset_class);

CREATE INDEX idx_allocation_constraints_ring_id ON allocation_constraints(ring_id);
CREATE INDEX idx_allocation_constraints_is_active ON allocation_constraints(is_active);
CREATE INDEX idx_allocation_constraints_constraint_type ON allocation_constraints(constraint_type);

CREATE INDEX idx_rebalancing_suggestions_ring_id ON rebalancing_suggestions(ring_id);
CREATE INDEX idx_rebalancing_suggestions_priority ON rebalancing_suggestions(priority);
CREATE INDEX idx_rebalancing_suggestions_is_accepted ON rebalancing_suggestions(is_accepted);
CREATE INDEX idx_rebalancing_suggestions_created_at ON rebalancing_suggestions(created_at);

CREATE INDEX idx_allocation_performance_history_ring_id ON allocation_performance_history(ring_id);
CREATE INDEX idx_allocation_performance_history_measurement_date ON allocation_performance_history(measurement_date);
CREATE INDEX idx_allocation_performance_history_period_type ON allocation_performance_history(period_type);

CREATE INDEX idx_allocation_drift_history_ring_id ON allocation_drift_history(ring_id);
CREATE INDEX idx_allocation_drift_history_measurement_date ON allocation_drift_history(measurement_date);
CREATE INDEX idx_allocation_drift_history_total_drift ON allocation_drift_history(total_drift);

CREATE INDEX idx_tax_insights_history_ring_id ON tax_insights_history(ring_id);
CREATE INDEX idx_tax_insights_history_insight_date ON tax_insights_history(insight_date);

CREATE INDEX idx_ring_configuration_history_ring_id ON ring_configuration_history(ring_id);
CREATE INDEX idx_ring_configuration_history_change_date ON ring_configuration_history(change_date);
CREATE INDEX idx_ring_configuration_history_change_type ON ring_configuration_history(change_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_asset_class_allocation_rings_updated_at
    BEFORE UPDATE ON asset_class_allocation_rings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_target_allocations_last_modified
    BEFORE UPDATE ON target_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Validation functions
CREATE OR REPLACE FUNCTION validate_allocation_percentages(ring_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_percentage DECIMAL(5,2);
BEGIN
    -- Calculate total current percentages for the ring
    SELECT COALESCE(SUM(current_percentage), 0) INTO total_percentage
    FROM asset_class_allocations
    WHERE asset_class_allocations.ring_id = validate_allocation_percentages.ring_id;
    
    -- Allow for small rounding errors (within 1%)
    RETURN total_percentage BETWEEN 99.0 AND 101.0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_target_percentages(target_allocation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_percentage DECIMAL(5,2);
BEGIN
    -- Calculate total target percentages for the target allocation
    SELECT COALESCE(SUM(target_percentage), 0) INTO total_percentage
    FROM asset_class_targets
    WHERE asset_class_targets.target_allocation_id = validate_target_percentages.target_allocation_id;
    
    -- Target percentages should sum to 100%
    RETURN total_percentage BETWEEN 99.0 AND 101.0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_allocation_variance(ring_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Update variance for each asset class in the ring
    UPDATE asset_class_allocations aca
    SET variance = aca.current_percentage - aca.target_percentage
    WHERE aca.ring_id = calculate_allocation_variance.ring_id;
    
    -- Update rebalancing_needed flag on the ring
    UPDATE asset_class_allocation_rings
    SET rebalancing_needed = (
        SELECT CASE 
            WHEN COUNT(*) > 0 THEN TRUE 
            ELSE FALSE 
        END
        FROM asset_class_allocations
        WHERE asset_class_allocations.ring_id = calculate_allocation_variance.ring_id
        AND ABS(variance) > 5.0 -- 5% threshold
    )
    WHERE id = calculate_allocation_variance.ring_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE asset_class_allocation_rings ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_class_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_class_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE rebalancing_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_drift_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_insights_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ring_configuration_history ENABLE ROW LEVEL SECURITY;

-- Asset Class Allocation Rings policies
CREATE POLICY "Users can view own rings" ON asset_class_allocation_rings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rings" ON asset_class_allocation_rings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rings" ON asset_class_allocation_rings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rings" ON asset_class_allocation_rings
    FOR DELETE USING (auth.uid() = user_id);

-- Asset Class Allocations policies
CREATE POLICY "Users can access allocations for own rings" ON asset_class_allocations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM asset_class_allocation_rings
            WHERE id = asset_class_allocations.ring_id
            AND user_id = auth.uid()
        )
    );

-- Target Allocations policies
CREATE POLICY "Users can access target allocations for own rings" ON target_allocations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM asset_class_allocation_rings
            WHERE id = target_allocations.ring_id
            AND user_id = auth.uid()
        )
    );

-- Asset Class Targets policies
CREATE POLICY "Users can access targets for own allocations" ON asset_class_targets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM target_allocations ta
            JOIN asset_class_allocation_rings r ON ta.ring_id = r.id
            WHERE ta.id = asset_class_targets.target_allocation_id
            AND r.user_id = auth.uid()
        )
    );

-- Allocation Constraints policies
CREATE POLICY "Users can access constraints for own rings" ON allocation_constraints
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM asset_class_allocation_rings
            WHERE id = allocation_constraints.ring_id
            AND user_id = auth.uid()
        )
    );

-- Rebalancing Suggestions policies
CREATE POLICY "Users can access suggestions for own rings" ON rebalancing_suggestions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM asset_class_allocation_rings
            WHERE id = rebalancing_suggestions.ring_id
            AND user_id = auth.uid()
        )
    );

-- Performance History policies
CREATE POLICY "Users can access performance for own rings" ON allocation_performance_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM asset_class_allocation_rings
            WHERE id = allocation_performance_history.ring_id
            AND user_id = auth.uid()
        )
    );

-- Drift History policies
CREATE POLICY "Users can access drift history for own rings" ON allocation_drift_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM asset_class_allocation_rings
            WHERE id = allocation_drift_history.ring_id
            AND user_id = auth.uid()
        )
    );

-- Tax Insights History policies
CREATE POLICY "Users can access tax insights for own rings" ON tax_insights_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM asset_class_allocation_rings
            WHERE id = tax_insights_history.ring_id
            AND user_id = auth.uid()
        )
    );

-- Ring Configuration History policies
CREATE POLICY "Users can access config history for own rings" ON ring_configuration_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM asset_class_allocation_rings
            WHERE id = ring_configuration_history.ring_id
            AND user_id = auth.uid()
        )
    );

-- Create helpful views
CREATE VIEW ring_summary AS
SELECT 
    r.id,
    r.ring_name,
    r.portfolio_value,
    r.currency,
    r.overall_tax_efficiency,
    r.total_return,
    r.compliance_status,
    r.rebalancing_needed,
    COUNT(aca.id) as asset_class_count,
    SUM(CASE WHEN ABS(aca.variance) > 5 THEN 1 ELSE 0 END) as classes_needing_rebalance,
    AVG(aca.tax_efficiency_score) as avg_tax_efficiency,
    SUM(CASE WHEN aca.franking_credit_yield > 0 THEN aca.current_value ELSE 0 END) as franking_eligible_value
FROM asset_class_allocation_rings r
LEFT JOIN asset_class_allocations aca ON r.id = aca.ring_id
GROUP BY r.id, r.ring_name, r.portfolio_value, r.currency, r.overall_tax_efficiency, r.total_return, r.compliance_status, r.rebalancing_needed;

CREATE VIEW asset_class_performance AS
SELECT 
    r.id as ring_id,
    r.ring_name,
    aca.asset_class,
    aca.asset_class_name,
    aca.current_percentage,
    aca.target_percentage,
    aca.variance,
    aca.one_year_return,
    aca.tax_efficiency_score,
    CASE 
        WHEN r.currency = 'AUD' AND aca.franking_credit_yield > 0 THEN 'AU_FRANKING'
        WHEN r.currency = 'NZD' AND aca.fif_applicable THEN 'NZ_FIF'
        WHEN aca.investor_status_applicable THEN 'NZ_INVESTOR'
        ELSE 'STANDARD'
    END as tax_treatment_category
FROM asset_class_allocation_rings r
JOIN asset_class_allocations aca ON r.id = aca.ring_id;

CREATE VIEW rebalancing_priorities AS
SELECT 
    rs.ring_id,
    r.ring_name,
    rs.suggestion_type,
    rs.priority,
    rs.description,
    rs.estimated_cost,
    rs.tax_impact,
    rs.suggested_timing,
    rs.is_accepted
FROM rebalancing_suggestions rs
JOIN asset_class_allocation_rings r ON rs.ring_id = r.id
WHERE rs.is_implemented = FALSE
ORDER BY 
    CASE rs.priority 
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    rs.created_at;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE asset_class_allocation_rings IS 'Main table for asset class allocation rings with portfolio visualization';
COMMENT ON TABLE asset_class_allocations IS 'Individual asset class allocations within each ring';
COMMENT ON TABLE target_allocations IS 'Target allocation strategies and settings';
COMMENT ON TABLE rebalancing_suggestions IS 'AI-generated rebalancing suggestions with tax optimization';
COMMENT ON TABLE allocation_performance_history IS 'Historical performance tracking for allocations';
COMMENT ON TABLE tax_insights_history IS 'AU/NZ specific tax insights and optimization tracking';

-- Insert some sample data for testing
INSERT INTO asset_class_allocation_rings (
    id,
    user_id,
    ring_name,
    description,
    portfolio_id,
    portfolio_value,
    currency,
    overall_tax_efficiency,
    total_return,
    compliance_status
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'Conservative Growth Portfolio',
    'Balanced allocation with AU focus and franking benefits',
    'portfolio_001',
    250000.00,
    'AUD',
    78.50,
    8.25,
    'compliant'
);

-- Insert corresponding asset class allocations
INSERT INTO asset_class_allocations (
    ring_id,
    asset_class,
    asset_class_name,
    current_value,
    current_percentage,
    target_percentage,
    variance,
    tax_efficiency_score,
    dividend_yield,
    franking_credit_yield,
    franking_level,
    cgt_discount_percentage,
    one_year_return
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'equities',
    'Australian Equities',
    150000.00,
    60.00,
    55.00,
    5.00,
    85.00,
    4.20,
    1.80,
    'full',
    75.00,
    9.50
),
(
    '00000000-0000-0000-0000-000000000001',
    'bonds',
    'Government Bonds',
    62500.00,
    25.00,
    30.00,
    -5.00,
    70.00,
    3.50,
    0.00,
    'none',
    0.00,
    3.20
),
(
    '00000000-0000-0000-0000-000000000001',
    'crypto',
    'Cryptocurrency',
    25000.00,
    10.00,
    10.00,
    0.00,
    40.00,
    0.00,
    0.00,
    'none',
    0.00,
    25.80
),
(
    '00000000-0000-0000-0000-000000000001',
    'cash',
    'Cash & Equivalents',
    12500.00,
    5.00,
    5.00,
    0.00,
    95.00,
    0.00,
    0.00,
    'none',
    0.00,
    2.50
); 