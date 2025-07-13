-- Block 53: Vault Category Allocator - Database Schema
-- Asset categorization and allocation management system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Vault Categories Table
CREATE TABLE IF NOT EXISTS vault_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Category Details
    category_name TEXT NOT NULL,
    category_code TEXT NOT NULL,
    category_type TEXT NOT NULL CHECK (category_type IN ('asset_class', 'sector', 'geography', 'strategy', 'risk_level', 'custom')),
    category_description TEXT,
    category_color TEXT DEFAULT '#3B82F6',
    category_icon TEXT,
    
    -- Allocation Rules
    target_allocation_percent DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (target_allocation_percent >= 0 AND target_allocation_percent <= 100),
    min_allocation_percent DECIMAL(5,2) DEFAULT 0 CHECK (min_allocation_percent >= 0 AND min_allocation_percent <= 100),
    max_allocation_percent DECIMAL(5,2) DEFAULT 100 CHECK (max_allocation_percent >= 0 AND max_allocation_percent <= 100),
    
    -- Rebalancing Rules
    rebalance_threshold DECIMAL(5,2) DEFAULT 5.0,
    rebalance_frequency TEXT DEFAULT 'monthly' CHECK (rebalance_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'manual')),
    auto_rebalance_enabled BOOLEAN DEFAULT true,
    
    -- Risk Management
    risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'very_high')),
    max_single_position_percent DECIMAL(5,2) DEFAULT 10.0,
    volatility_limit DECIMAL(5,2) DEFAULT 25.0,
    
    -- Tax Optimization
    tax_efficiency_priority INTEGER DEFAULT 5 CHECK (tax_efficiency_priority >= 1 AND tax_efficiency_priority <= 10),
    tax_loss_harvesting_enabled BOOLEAN DEFAULT true,
    
    -- Active/Inactive
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, category_code),
    CHECK (min_allocation_percent <= max_allocation_percent),
    CHECK (target_allocation_percent >= min_allocation_percent),
    CHECK (target_allocation_percent <= max_allocation_percent)
);

-- Asset Category Assignments Table
CREATE TABLE IF NOT EXISTS asset_category_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES vault_categories(id) ON DELETE CASCADE,
    
    -- Asset Details
    symbol TEXT NOT NULL,
    asset_name TEXT,
    asset_class TEXT,
    sector TEXT,
    market TEXT DEFAULT 'NZX',
    
    -- Assignment Rules
    assignment_type TEXT DEFAULT 'manual' CHECK (assignment_type IN ('manual', 'automatic', 'rule_based')),
    assignment_rule TEXT, -- JSON or text description of rule
    assignment_confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (assignment_confidence >= 0 AND assignment_confidence <= 1.0),
    
    -- Allocation Details
    target_weight_in_category DECIMAL(5,2) DEFAULT 0,
    actual_weight_in_category DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_reviewed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, category_id, symbol)
);

-- Category Allocation History Table
CREATE TABLE IF NOT EXISTS category_allocation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES vault_categories(id) ON DELETE CASCADE,
    
    -- Allocation Snapshot
    snapshot_date TIMESTAMPTZ DEFAULT NOW(),
    target_allocation DECIMAL(5,2) NOT NULL,
    actual_allocation DECIMAL(5,2) NOT NULL,
    allocation_drift DECIMAL(5,2) DEFAULT 0,
    
    -- Portfolio Context
    total_portfolio_value DECIMAL(18,2) DEFAULT 0,
    category_value DECIMAL(18,2) DEFAULT 0,
    asset_count INTEGER DEFAULT 0,
    
    -- Performance Metrics
    category_return_1d DECIMAL(5,2) DEFAULT 0,
    category_return_7d DECIMAL(5,2) DEFAULT 0,
    category_return_30d DECIMAL(5,2) DEFAULT 0,
    category_return_ytd DECIMAL(5,2) DEFAULT 0,
    
    -- Rebalancing Actions
    rebalance_required BOOLEAN DEFAULT false,
    rebalance_amount DECIMAL(18,2) DEFAULT 0,
    rebalance_direction TEXT CHECK (rebalance_direction IN ('buy', 'sell', 'none')),
    
    -- Metadata
    snapshot_type TEXT DEFAULT 'scheduled' CHECK (snapshot_type IN ('scheduled', 'manual', 'triggered', 'rebalance')),
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category Performance Metrics Table
CREATE TABLE IF NOT EXISTS category_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES vault_categories(id) ON DELETE CASCADE,
    
    -- Time Period
    measurement_date TIMESTAMPTZ DEFAULT NOW(),
    measurement_period TEXT DEFAULT '30d' CHECK (measurement_period IN ('7d', '30d', '90d', '1y', 'ytd', 'all')),
    
    -- Return Metrics
    total_return DECIMAL(5,2) DEFAULT 0,
    annualized_return DECIMAL(5,2) DEFAULT 0,
    benchmark_return DECIMAL(5,2) DEFAULT 0,
    alpha DECIMAL(5,2) DEFAULT 0,
    
    -- Risk Metrics
    volatility DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(5,4) DEFAULT 0,
    sortino_ratio DECIMAL(5,4) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    beta DECIMAL(5,4) DEFAULT 0,
    
    -- Allocation Metrics
    avg_allocation DECIMAL(5,2) DEFAULT 0,
    allocation_volatility DECIMAL(5,2) DEFAULT 0,
    rebalance_frequency INTEGER DEFAULT 0,
    
    -- Tax Metrics
    tax_efficiency_score DECIMAL(5,2) DEFAULT 0,
    tax_loss_harvested DECIMAL(18,2) DEFAULT 0,
    
    -- Metadata
    calculation_method TEXT DEFAULT 'standard',
    data_points INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, category_id, measurement_period, measurement_date)
);

-- RLS Policies
ALTER TABLE vault_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_allocation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Vault categories policies
CREATE POLICY "Users can manage own vault categories" ON vault_categories
    FOR ALL USING (auth.uid() = user_id);

-- Asset category assignments policies
CREATE POLICY "Users can manage own asset assignments" ON asset_category_assignments
    FOR ALL USING (auth.uid() = user_id);

-- Category allocation history policies
CREATE POLICY "Users can view own allocation history" ON category_allocation_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own allocation history" ON category_allocation_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Category performance metrics policies
CREATE POLICY "Users can view own performance metrics" ON category_performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance metrics" ON category_performance_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_vault_categories_user_id ON vault_categories(user_id);
CREATE INDEX idx_vault_categories_active ON vault_categories(user_id, is_active);
CREATE INDEX idx_vault_categories_type ON vault_categories(category_type);

CREATE INDEX idx_asset_assignments_user_id ON asset_category_assignments(user_id);
CREATE INDEX idx_asset_assignments_category ON asset_category_assignments(category_id);
CREATE INDEX idx_asset_assignments_symbol ON asset_category_assignments(symbol);
CREATE INDEX idx_asset_assignments_active ON asset_category_assignments(user_id, is_active);

CREATE INDEX idx_allocation_history_user_id ON category_allocation_history(user_id);
CREATE INDEX idx_allocation_history_category ON category_allocation_history(category_id);
CREATE INDEX idx_allocation_history_date ON category_allocation_history(snapshot_date DESC);

CREATE INDEX idx_performance_metrics_user_id ON category_performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_category ON category_performance_metrics(category_id);
CREATE INDEX idx_performance_metrics_period ON category_performance_metrics(measurement_period);
CREATE INDEX idx_performance_metrics_date ON category_performance_metrics(measurement_date DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_vault_categories_updated_at
    BEFORE UPDATE ON vault_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_assignments_updated_at
    BEFORE UPDATE ON asset_category_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for category management
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Create default asset class categories
    INSERT INTO vault_categories (user_id, category_name, category_code, category_type, target_allocation_percent, category_color)
    VALUES 
        (p_user_id, 'NZ Equities', 'NZ_EQUITIES', 'asset_class', 40.0, '#00A651'),
        (p_user_id, 'AU Equities', 'AU_EQUITIES', 'asset_class', 30.0, '#FFB81C'),
        (p_user_id, 'International Equities', 'INTL_EQUITIES', 'asset_class', 20.0, '#0066CC'),
        (p_user_id, 'Bonds & Fixed Income', 'BONDS', 'asset_class', 8.0, '#800080'),
        (p_user_id, 'Cash & Cash Equivalents', 'CASH', 'asset_class', 2.0, '#808080')
    ON CONFLICT (user_id, category_code) DO NOTHING;
    
    -- Create default sector categories
    INSERT INTO vault_categories (user_id, category_name, category_code, category_type, target_allocation_percent, category_color)
    VALUES 
        (p_user_id, 'Technology', 'TECH', 'sector', 15.0, '#FF6B35'),
        (p_user_id, 'Healthcare', 'HEALTH', 'sector', 12.0, '#00B4D8'),
        (p_user_id, 'Financial Services', 'FINANCE', 'sector', 18.0, '#8B5CF6'),
        (p_user_id, 'Consumer Discretionary', 'CONSUMER', 'sector', 10.0, '#F59E0B'),
        (p_user_id, 'Utilities', 'UTILITIES', 'sector', 8.0, '#10B981')
    ON CONFLICT (user_id, category_code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_allocation_drift(p_user_id UUID, p_category_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    target_alloc DECIMAL;
    actual_alloc DECIMAL;
    drift DECIMAL;
BEGIN
    -- Get target allocation
    SELECT target_allocation_percent INTO target_alloc
    FROM vault_categories
    WHERE id = p_category_id AND user_id = p_user_id;
    
    -- Calculate actual allocation (simplified - would need portfolio data)
    -- This is a placeholder calculation
    actual_alloc := target_alloc + (RANDOM() - 0.5) * 10; -- Simulate some drift
    
    drift := actual_alloc - target_alloc;
    
    RETURN drift;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_assign_asset_to_category(
    p_user_id UUID,
    p_symbol TEXT,
    p_asset_class TEXT,
    p_sector TEXT
)
RETURNS UUID AS $$
DECLARE
    category_id UUID;
    assignment_id UUID;
BEGIN
    -- Find best matching category based on asset class and sector
    SELECT id INTO category_id
    FROM vault_categories
    WHERE user_id = p_user_id
    AND is_active = true
    AND (
        (category_type = 'asset_class' AND UPPER(category_name) LIKE '%' || UPPER(p_asset_class) || '%') OR
        (category_type = 'sector' AND UPPER(category_name) LIKE '%' || UPPER(p_sector) || '%')
    )
    ORDER BY 
        CASE 
            WHEN category_type = 'asset_class' THEN 1
            WHEN category_type = 'sector' THEN 2
            ELSE 3
        END
    LIMIT 1;
    
    IF category_id IS NOT NULL THEN
        -- Create assignment
        INSERT INTO asset_category_assignments (
            user_id, category_id, symbol, asset_class, sector, 
            assignment_type, assignment_confidence
        )
        VALUES (
            p_user_id, category_id, p_symbol, p_asset_class, p_sector,
            'automatic', 0.8
        )
        RETURNING id INTO assignment_id;
    END IF;
    
    RETURN assignment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_category_allocation_snapshot(
    p_user_id UUID,
    p_category_id UUID,
    p_target_allocation DECIMAL,
    p_actual_allocation DECIMAL,
    p_portfolio_value DECIMAL,
    p_snapshot_type TEXT DEFAULT 'scheduled'
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
    drift DECIMAL;
    rebalance_needed BOOLEAN;
    rebalance_amt DECIMAL;
    rebalance_dir TEXT;
BEGIN
    drift := p_actual_allocation - p_target_allocation;
    
    -- Determine if rebalancing is needed
    SELECT rebalance_threshold INTO rebalance_needed
    FROM vault_categories
    WHERE id = p_category_id AND ABS(drift) > rebalance_threshold;
    
    rebalance_needed := COALESCE(rebalance_needed, false);
    
    -- Calculate rebalance amount and direction
    IF rebalance_needed THEN
        rebalance_amt := ABS(drift) * p_portfolio_value / 100;
        rebalance_dir := CASE WHEN drift > 0 THEN 'sell' ELSE 'buy' END;
    ELSE
        rebalance_amt := 0;
        rebalance_dir := 'none';
    END IF;
    
    -- Log the snapshot
    INSERT INTO category_allocation_history (
        user_id, category_id, target_allocation, actual_allocation, 
        allocation_drift, total_portfolio_value, category_value,
        rebalance_required, rebalance_amount, rebalance_direction, snapshot_type
    )
    VALUES (
        p_user_id, p_category_id, p_target_allocation, p_actual_allocation,
        drift, p_portfolio_value, p_actual_allocation * p_portfolio_value / 100,
        rebalance_needed, rebalance_amt, rebalance_dir, p_snapshot_type
    )
    RETURNING id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql; 
-- Asset categorization and allocation management system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Vault Categories Table
CREATE TABLE IF NOT EXISTS vault_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Category Details
    category_name TEXT NOT NULL,
    category_code TEXT NOT NULL,
    category_type TEXT NOT NULL CHECK (category_type IN ('asset_class', 'sector', 'geography', 'strategy', 'risk_level', 'custom')),
    category_description TEXT,
    category_color TEXT DEFAULT '#3B82F6',
    category_icon TEXT,
    
    -- Allocation Rules
    target_allocation_percent DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (target_allocation_percent >= 0 AND target_allocation_percent <= 100),
    min_allocation_percent DECIMAL(5,2) DEFAULT 0 CHECK (min_allocation_percent >= 0 AND min_allocation_percent <= 100),
    max_allocation_percent DECIMAL(5,2) DEFAULT 100 CHECK (max_allocation_percent >= 0 AND max_allocation_percent <= 100),
    
    -- Rebalancing Rules
    rebalance_threshold DECIMAL(5,2) DEFAULT 5.0,
    rebalance_frequency TEXT DEFAULT 'monthly' CHECK (rebalance_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'manual')),
    auto_rebalance_enabled BOOLEAN DEFAULT true,
    
    -- Risk Management
    risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'very_high')),
    max_single_position_percent DECIMAL(5,2) DEFAULT 10.0,
    volatility_limit DECIMAL(5,2) DEFAULT 25.0,
    
    -- Tax Optimization
    tax_efficiency_priority INTEGER DEFAULT 5 CHECK (tax_efficiency_priority >= 1 AND tax_efficiency_priority <= 10),
    tax_loss_harvesting_enabled BOOLEAN DEFAULT true,
    
    -- Active/Inactive
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, category_code),
    CHECK (min_allocation_percent <= max_allocation_percent),
    CHECK (target_allocation_percent >= min_allocation_percent),
    CHECK (target_allocation_percent <= max_allocation_percent)
);

-- Asset Category Assignments Table
CREATE TABLE IF NOT EXISTS asset_category_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES vault_categories(id) ON DELETE CASCADE,
    
    -- Asset Details
    symbol TEXT NOT NULL,
    asset_name TEXT,
    asset_class TEXT,
    sector TEXT,
    market TEXT DEFAULT 'NZX',
    
    -- Assignment Rules
    assignment_type TEXT DEFAULT 'manual' CHECK (assignment_type IN ('manual', 'automatic', 'rule_based')),
    assignment_rule TEXT, -- JSON or text description of rule
    assignment_confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (assignment_confidence >= 0 AND assignment_confidence <= 1.0),
    
    -- Allocation Details
    target_weight_in_category DECIMAL(5,2) DEFAULT 0,
    actual_weight_in_category DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_reviewed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, category_id, symbol)
);

-- Category Allocation History Table
CREATE TABLE IF NOT EXISTS category_allocation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES vault_categories(id) ON DELETE CASCADE,
    
    -- Allocation Snapshot
    snapshot_date TIMESTAMPTZ DEFAULT NOW(),
    target_allocation DECIMAL(5,2) NOT NULL,
    actual_allocation DECIMAL(5,2) NOT NULL,
    allocation_drift DECIMAL(5,2) DEFAULT 0,
    
    -- Portfolio Context
    total_portfolio_value DECIMAL(18,2) DEFAULT 0,
    category_value DECIMAL(18,2) DEFAULT 0,
    asset_count INTEGER DEFAULT 0,
    
    -- Performance Metrics
    category_return_1d DECIMAL(5,2) DEFAULT 0,
    category_return_7d DECIMAL(5,2) DEFAULT 0,
    category_return_30d DECIMAL(5,2) DEFAULT 0,
    category_return_ytd DECIMAL(5,2) DEFAULT 0,
    
    -- Rebalancing Actions
    rebalance_required BOOLEAN DEFAULT false,
    rebalance_amount DECIMAL(18,2) DEFAULT 0,
    rebalance_direction TEXT CHECK (rebalance_direction IN ('buy', 'sell', 'none')),
    
    -- Metadata
    snapshot_type TEXT DEFAULT 'scheduled' CHECK (snapshot_type IN ('scheduled', 'manual', 'triggered', 'rebalance')),
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category Performance Metrics Table
CREATE TABLE IF NOT EXISTS category_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES vault_categories(id) ON DELETE CASCADE,
    
    -- Time Period
    measurement_date TIMESTAMPTZ DEFAULT NOW(),
    measurement_period TEXT DEFAULT '30d' CHECK (measurement_period IN ('7d', '30d', '90d', '1y', 'ytd', 'all')),
    
    -- Return Metrics
    total_return DECIMAL(5,2) DEFAULT 0,
    annualized_return DECIMAL(5,2) DEFAULT 0,
    benchmark_return DECIMAL(5,2) DEFAULT 0,
    alpha DECIMAL(5,2) DEFAULT 0,
    
    -- Risk Metrics
    volatility DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(5,4) DEFAULT 0,
    sortino_ratio DECIMAL(5,4) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    beta DECIMAL(5,4) DEFAULT 0,
    
    -- Allocation Metrics
    avg_allocation DECIMAL(5,2) DEFAULT 0,
    allocation_volatility DECIMAL(5,2) DEFAULT 0,
    rebalance_frequency INTEGER DEFAULT 0,
    
    -- Tax Metrics
    tax_efficiency_score DECIMAL(5,2) DEFAULT 0,
    tax_loss_harvested DECIMAL(18,2) DEFAULT 0,
    
    -- Metadata
    calculation_method TEXT DEFAULT 'standard',
    data_points INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, category_id, measurement_period, measurement_date)
);

-- RLS Policies
ALTER TABLE vault_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_allocation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Vault categories policies
CREATE POLICY "Users can manage own vault categories" ON vault_categories
    FOR ALL USING (auth.uid() = user_id);

-- Asset category assignments policies
CREATE POLICY "Users can manage own asset assignments" ON asset_category_assignments
    FOR ALL USING (auth.uid() = user_id);

-- Category allocation history policies
CREATE POLICY "Users can view own allocation history" ON category_allocation_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own allocation history" ON category_allocation_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Category performance metrics policies
CREATE POLICY "Users can view own performance metrics" ON category_performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance metrics" ON category_performance_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_vault_categories_user_id ON vault_categories(user_id);
CREATE INDEX idx_vault_categories_active ON vault_categories(user_id, is_active);
CREATE INDEX idx_vault_categories_type ON vault_categories(category_type);

CREATE INDEX idx_asset_assignments_user_id ON asset_category_assignments(user_id);
CREATE INDEX idx_asset_assignments_category ON asset_category_assignments(category_id);
CREATE INDEX idx_asset_assignments_symbol ON asset_category_assignments(symbol);
CREATE INDEX idx_asset_assignments_active ON asset_category_assignments(user_id, is_active);

CREATE INDEX idx_allocation_history_user_id ON category_allocation_history(user_id);
CREATE INDEX idx_allocation_history_category ON category_allocation_history(category_id);
CREATE INDEX idx_allocation_history_date ON category_allocation_history(snapshot_date DESC);

CREATE INDEX idx_performance_metrics_user_id ON category_performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_category ON category_performance_metrics(category_id);
CREATE INDEX idx_performance_metrics_period ON category_performance_metrics(measurement_period);
CREATE INDEX idx_performance_metrics_date ON category_performance_metrics(measurement_date DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_vault_categories_updated_at
    BEFORE UPDATE ON vault_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_assignments_updated_at
    BEFORE UPDATE ON asset_category_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for category management
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Create default asset class categories
    INSERT INTO vault_categories (user_id, category_name, category_code, category_type, target_allocation_percent, category_color)
    VALUES 
        (p_user_id, 'NZ Equities', 'NZ_EQUITIES', 'asset_class', 40.0, '#00A651'),
        (p_user_id, 'AU Equities', 'AU_EQUITIES', 'asset_class', 30.0, '#FFB81C'),
        (p_user_id, 'International Equities', 'INTL_EQUITIES', 'asset_class', 20.0, '#0066CC'),
        (p_user_id, 'Bonds & Fixed Income', 'BONDS', 'asset_class', 8.0, '#800080'),
        (p_user_id, 'Cash & Cash Equivalents', 'CASH', 'asset_class', 2.0, '#808080')
    ON CONFLICT (user_id, category_code) DO NOTHING;
    
    -- Create default sector categories
    INSERT INTO vault_categories (user_id, category_name, category_code, category_type, target_allocation_percent, category_color)
    VALUES 
        (p_user_id, 'Technology', 'TECH', 'sector', 15.0, '#FF6B35'),
        (p_user_id, 'Healthcare', 'HEALTH', 'sector', 12.0, '#00B4D8'),
        (p_user_id, 'Financial Services', 'FINANCE', 'sector', 18.0, '#8B5CF6'),
        (p_user_id, 'Consumer Discretionary', 'CONSUMER', 'sector', 10.0, '#F59E0B'),
        (p_user_id, 'Utilities', 'UTILITIES', 'sector', 8.0, '#10B981')
    ON CONFLICT (user_id, category_code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_allocation_drift(p_user_id UUID, p_category_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    target_alloc DECIMAL;
    actual_alloc DECIMAL;
    drift DECIMAL;
BEGIN
    -- Get target allocation
    SELECT target_allocation_percent INTO target_alloc
    FROM vault_categories
    WHERE id = p_category_id AND user_id = p_user_id;
    
    -- Calculate actual allocation (simplified - would need portfolio data)
    -- This is a placeholder calculation
    actual_alloc := target_alloc + (RANDOM() - 0.5) * 10; -- Simulate some drift
    
    drift := actual_alloc - target_alloc;
    
    RETURN drift;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_assign_asset_to_category(
    p_user_id UUID,
    p_symbol TEXT,
    p_asset_class TEXT,
    p_sector TEXT
)
RETURNS UUID AS $$
DECLARE
    category_id UUID;
    assignment_id UUID;
BEGIN
    -- Find best matching category based on asset class and sector
    SELECT id INTO category_id
    FROM vault_categories
    WHERE user_id = p_user_id
    AND is_active = true
    AND (
        (category_type = 'asset_class' AND UPPER(category_name) LIKE '%' || UPPER(p_asset_class) || '%') OR
        (category_type = 'sector' AND UPPER(category_name) LIKE '%' || UPPER(p_sector) || '%')
    )
    ORDER BY 
        CASE 
            WHEN category_type = 'asset_class' THEN 1
            WHEN category_type = 'sector' THEN 2
            ELSE 3
        END
    LIMIT 1;
    
    IF category_id IS NOT NULL THEN
        -- Create assignment
        INSERT INTO asset_category_assignments (
            user_id, category_id, symbol, asset_class, sector, 
            assignment_type, assignment_confidence
        )
        VALUES (
            p_user_id, category_id, p_symbol, p_asset_class, p_sector,
            'automatic', 0.8
        )
        RETURNING id INTO assignment_id;
    END IF;
    
    RETURN assignment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_category_allocation_snapshot(
    p_user_id UUID,
    p_category_id UUID,
    p_target_allocation DECIMAL,
    p_actual_allocation DECIMAL,
    p_portfolio_value DECIMAL,
    p_snapshot_type TEXT DEFAULT 'scheduled'
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
    drift DECIMAL;
    rebalance_needed BOOLEAN;
    rebalance_amt DECIMAL;
    rebalance_dir TEXT;
BEGIN
    drift := p_actual_allocation - p_target_allocation;
    
    -- Determine if rebalancing is needed
    SELECT rebalance_threshold INTO rebalance_needed
    FROM vault_categories
    WHERE id = p_category_id AND ABS(drift) > rebalance_threshold;
    
    rebalance_needed := COALESCE(rebalance_needed, false);
    
    -- Calculate rebalance amount and direction
    IF rebalance_needed THEN
        rebalance_amt := ABS(drift) * p_portfolio_value / 100;
        rebalance_dir := CASE WHEN drift > 0 THEN 'sell' ELSE 'buy' END;
    ELSE
        rebalance_amt := 0;
        rebalance_dir := 'none';
    END IF;
    
    -- Log the snapshot
    INSERT INTO category_allocation_history (
        user_id, category_id, target_allocation, actual_allocation, 
        allocation_drift, total_portfolio_value, category_value,
        rebalance_required, rebalance_amount, rebalance_direction, snapshot_type
    )
    VALUES (
        p_user_id, p_category_id, p_target_allocation, p_actual_allocation,
        drift, p_portfolio_value, p_actual_allocation * p_portfolio_value / 100,
        rebalance_needed, rebalance_amt, rebalance_dir, p_snapshot_type
    )
    RETURNING id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql; 