-- Block 53: Vault Category Allocator Schema

-- Vault definitions
CREATE TABLE vaults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    vault_type VARCHAR(50) NOT NULL CHECK (vault_type IN ('diversified', 'sector', 'geographic', 'strategy', 'risk_based', 'custom')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived', 'pending')),
    
    -- Total vault value and currency
    total_value DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Configuration
    auto_rebalance BOOLEAN DEFAULT false,
    rebalance_threshold DECIMAL(5,2) DEFAULT 5.0,
    rebalance_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (rebalance_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'manually')),
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset categories for allocation
CREATE TABLE asset_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    category_type VARCHAR(50) NOT NULL CHECK (category_type IN ('asset_class', 'sector', 'geography', 'market_cap', 'style', 'custom')),
    parent_category_id UUID REFERENCES asset_categories(id) ON DELETE CASCADE,
    
    -- Category configuration
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    color VARCHAR(7), -- hex color code
    
    -- Risk metrics
    risk_score DECIMAL(3,2) CHECK (risk_score >= 0 AND risk_score <= 1),
    volatility_estimate DECIMAL(5,2),
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Allocation strategies for each vault
CREATE TABLE vault_allocation_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    strategy_type VARCHAR(50) NOT NULL CHECK (strategy_type IN ('equal_weight', 'market_cap', 'risk_parity', 'momentum', 'value', 'custom')),
    is_active BOOLEAN DEFAULT true,
    
    -- Strategy parameters
    parameters JSONB NOT NULL DEFAULT '{}',
    constraints JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Category allocations within vaults
CREATE TABLE vault_category_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    strategy_id UUID REFERENCES vault_allocation_strategies(id) ON DELETE SET NULL,
    
    -- Target allocation
    target_percentage DECIMAL(5,2) NOT NULL CHECK (target_percentage >= 0 AND target_percentage <= 100),
    min_percentage DECIMAL(5,2) DEFAULT 0 CHECK (min_percentage >= 0),
    max_percentage DECIMAL(5,2) DEFAULT 100 CHECK (max_percentage <= 100),
    
    -- Current allocation
    current_percentage DECIMAL(5,2) DEFAULT 0,
    current_value DECIMAL(15,2) DEFAULT 0,
    
    -- Rebalancing settings
    rebalance_priority INTEGER DEFAULT 1,
    tolerance_threshold DECIMAL(5,2) DEFAULT 2.0,
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'target_only')),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(vault_id, category_id),
    CHECK (min_percentage <= target_percentage),
    CHECK (target_percentage <= max_percentage)
);

-- Asset assignments to categories
CREATE TABLE asset_category_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(20) NOT NULL,
    category_id UUID NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    
    -- Assignment weight (for assets in multiple categories)
    weight DECIMAL(5,2) DEFAULT 100.0 CHECK (weight > 0 AND weight <= 100),
    
    -- Assignment metadata
    assigned_by VARCHAR(50) DEFAULT 'manual' CHECK (assigned_by IN ('manual', 'automatic', 'ai_suggested')),
    confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, asset_symbol, category_id)
);

-- Rebalancing history and audit trail
CREATE TABLE vault_rebalancing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    
    rebalance_type VARCHAR(50) NOT NULL CHECK (rebalance_type IN ('automatic', 'manual', 'scheduled', 'threshold_triggered')),
    trigger_reason TEXT,
    
    -- Pre-rebalance snapshot
    pre_rebalance_allocations JSONB NOT NULL,
    pre_rebalance_value DECIMAL(15,2),
    
    -- Post-rebalance snapshot
    post_rebalance_allocations JSONB NOT NULL,
    post_rebalance_value DECIMAL(15,2),
    
    -- Rebalance details
    trades_executed JSONB DEFAULT '[]',
    total_trades INTEGER DEFAULT 0,
    total_fees DECIMAL(10,2) DEFAULT 0,
    
    -- Status and timing
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allocation performance tracking
CREATE TABLE allocation_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    category_id UUID REFERENCES asset_categories(id) ON DELETE CASCADE,
    
    -- Performance period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Performance metrics
    starting_value DECIMAL(15,2) NOT NULL,
    ending_value DECIMAL(15,2) NOT NULL,
    return_amount DECIMAL(15,2) NOT NULL,
    return_percentage DECIMAL(8,4) NOT NULL,
    
    -- Benchmark comparison
    benchmark_return DECIMAL(8,4),
    excess_return DECIMAL(8,4),
    
    -- Risk metrics
    volatility DECIMAL(8,4),
    sharpe_ratio DECIMAL(8,4),
    max_drawdown DECIMAL(8,4),
    
    -- Additional metrics
    metrics JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(vault_id, category_id, period_start, period_end)
);

-- Indexes for performance
CREATE INDEX idx_vaults_user_id ON vaults(user_id);
CREATE INDEX idx_vaults_status ON vaults(status);
CREATE INDEX idx_asset_categories_user_id ON asset_categories(user_id);
CREATE INDEX idx_asset_categories_type ON asset_categories(category_type);
CREATE INDEX idx_vault_allocation_strategies_vault_id ON vault_allocation_strategies(vault_id);
CREATE INDEX idx_vault_category_allocations_vault_id ON vault_category_allocations(vault_id);
CREATE INDEX idx_vault_category_allocations_category_id ON vault_category_allocations(category_id);
CREATE INDEX idx_asset_category_assignments_user_id ON asset_category_assignments(user_id);
CREATE INDEX idx_asset_category_assignments_symbol ON asset_category_assignments(asset_symbol);
CREATE INDEX idx_vault_rebalancing_history_vault_id ON vault_rebalancing_history(vault_id);
CREATE INDEX idx_vault_rebalancing_history_status ON vault_rebalancing_history(status);
CREATE INDEX idx_allocation_performance_vault_id ON allocation_performance(vault_id);
CREATE INDEX idx_allocation_performance_period ON allocation_performance(period_start, period_end);

-- RLS Policies
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_allocation_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_category_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_rebalancing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_performance ENABLE ROW LEVEL SECURITY;

-- Users can manage their own vaults and categories
CREATE POLICY "Users can manage own vaults" ON vaults
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own categories" ON asset_categories
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own assignments" ON asset_category_assignments
    FOR ALL USING (auth.uid() = user_id);

-- Vault-based access for strategies and allocations
CREATE POLICY "Users can manage vault strategies" ON vault_allocation_strategies
    FOR ALL USING (
        vault_id IN (
            SELECT id FROM vaults WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage vault allocations" ON vault_category_allocations
    FOR ALL USING (
        vault_id IN (
            SELECT id FROM vaults WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view vault history" ON vault_rebalancing_history
    FOR SELECT USING (
        vault_id IN (
            SELECT id FROM vaults WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view vault performance" ON allocation_performance
    FOR SELECT USING (
        vault_id IN (
            SELECT id FROM vaults WHERE user_id = auth.uid()
        )
    );

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_vaults_updated_at BEFORE UPDATE ON vaults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_categories_updated_at BEFORE UPDATE ON asset_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vault_allocation_strategies_updated_at BEFORE UPDATE ON vault_allocation_strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vault_category_allocations_updated_at BEFORE UPDATE ON vault_category_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_category_assignments_updated_at BEFORE UPDATE ON asset_category_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vault_rebalancing_history_updated_at BEFORE UPDATE ON vault_rebalancing_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate allocation percentages
CREATE OR REPLACE FUNCTION validate_vault_allocations()
RETURNS TRIGGER AS $$
DECLARE
    total_percentage DECIMAL(5,2);
BEGIN
    SELECT COALESCE(SUM(target_percentage), 0) INTO total_percentage
    FROM vault_category_allocations
    WHERE vault_id = NEW.vault_id AND status = 'active';
    
    IF total_percentage > 100 THEN
        RAISE EXCEPTION 'Total allocation percentage cannot exceed 100%%. Current total: %', total_percentage;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for allocation validation
CREATE TRIGGER validate_vault_allocations_trigger
    BEFORE INSERT OR UPDATE ON vault_category_allocations
    FOR EACH ROW EXECUTE FUNCTION validate_vault_allocations(); 