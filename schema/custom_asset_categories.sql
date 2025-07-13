-- Block 73: Custom Asset Categories Schema

-- Asset categories with hierarchical structure
CREATE TABLE asset_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Category identification
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Hierarchy
    parent_category_id UUID REFERENCES asset_categories(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0 AND level <= 10),
    path TEXT NOT NULL, -- materialized path: "equity/tech/software"
    
    -- Category classification
    category_type VARCHAR(50) NOT NULL CHECK (category_type IN ('sector', 'geography', 'asset_class', 'market_cap', 'style', 'custom')),
    classification VARCHAR(20) NOT NULL CHECK (classification IN ('primary', 'secondary', 'tertiary')),
    
    -- Display properties
    color VARCHAR(7) NOT NULL, -- hex color code
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    
    -- Category properties
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    
    -- Risk and performance attributes
    risk_score DECIMAL(3,2) CHECK (risk_score >= 0 AND risk_score <= 1),
    volatility_estimate DECIMAL(8,4),
    expected_return DECIMAL(8,4),
    correlation_data JSONB DEFAULT '{}',
    
    -- Metadata
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name),
    UNIQUE(user_id, path)
);

-- Category assignment rules
CREATE TABLE asset_category_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    
    -- Rule definition
    rule_name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('automatic', 'manual', 'ai_suggested')),
    
    -- Rule conditions
    conditions JSONB NOT NULL DEFAULT '[]',
    operator VARCHAR(3) NOT NULL CHECK (operator IN ('AND', 'OR')),
    
    -- Rule execution
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
    confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
    
    -- Performance tracking
    applications_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    last_applied TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset category assignments
CREATE TABLE asset_category_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(20) NOT NULL,
    category_id UUID NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    
    -- Assignment details
    assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('automatic', 'manual', 'ai_suggested', 'inherited')),
    confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
    weight DECIMAL(5,2) DEFAULT 100.0 CHECK (weight > 0 AND weight <= 100),
    
    -- Assignment metadata
    assigned_by VARCHAR(50) NOT NULL, -- 'system' or user_id
    assignment_reason TEXT,
    rule_id UUID REFERENCES asset_category_rules(id) ON DELETE SET NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_validated BOOLEAN DEFAULT false,
    validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Performance tracking
    performance_score DECIMAL(5,2),
    last_reviewed TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, asset_symbol, category_id)
);

-- Category taxonomies
CREATE TABLE category_taxonomies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Taxonomy definition
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Taxonomy structure
    taxonomy_type VARCHAR(20) NOT NULL CHECK (taxonomy_type IN ('hierarchical', 'flat', 'multi_dimensional')),
    max_depth INTEGER DEFAULT 5 CHECK (max_depth >= 1 AND max_depth <= 10),
    allow_multiple_parents BOOLEAN DEFAULT false,
    
    -- Default settings
    default_category_type VARCHAR(50) DEFAULT 'custom',
    enforce_unique_names BOOLEAN DEFAULT true,
    
    -- Configuration
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Usage statistics
    categories_count INTEGER DEFAULT 0,
    assets_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Asset classification suggestions
CREATE TABLE asset_classification_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(20) NOT NULL,
    
    -- Suggestions data
    suggestions JSONB NOT NULL DEFAULT '[]',
    
    -- Analysis metadata
    analysis_type VARCHAR(20) NOT NULL CHECK (analysis_type IN ('rule_based', 'ml_model', 'similarity', 'market_data')),
    model_version VARCHAR(50),
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, asset_symbol, analysis_date)
);

-- Category performance metrics
CREATE TABLE category_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    
    -- Time period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Asset metrics
    total_assets INTEGER DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    avg_value DECIMAL(15,2) DEFAULT 0,
    
    -- Performance metrics
    total_return DECIMAL(8,4) DEFAULT 0,
    avg_return DECIMAL(8,4) DEFAULT 0,
    volatility DECIMAL(8,4) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0,
    max_drawdown DECIMAL(8,4) DEFAULT 0,
    
    -- Risk metrics
    beta DECIMAL(8,4) DEFAULT 0,
    alpha DECIMAL(8,4) DEFAULT 0,
    correlation_to_market DECIMAL(5,4) DEFAULT 0,
    
    -- Sector specific metrics
    sector_weight DECIMAL(5,2) DEFAULT 0,
    relative_performance DECIMAL(8,4) DEFAULT 0,
    
    -- Additional metrics
    metrics JSONB DEFAULT '{}',
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(category_id, period_start, period_end)
);

-- Category analytics
CREATE TABLE category_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    
    -- Usage analytics
    assignment_count INTEGER DEFAULT 0,
    auto_assignment_rate DECIMAL(5,2) DEFAULT 0,
    manual_override_rate DECIMAL(5,2) DEFAULT 0,
    validation_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Performance analytics
    avg_performance_score DECIMAL(5,2) DEFAULT 0,
    consistency_score DECIMAL(5,2) DEFAULT 0,
    prediction_accuracy DECIMAL(5,2) DEFAULT 0,
    
    -- Trend data
    trend_data JSONB DEFAULT '[]',
    
    -- Comparative analytics
    peer_comparison JSONB DEFAULT '[]',
    
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(category_id)
);

-- Category bulk operations
CREATE TABLE category_bulk_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Operation details
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('create', 'update', 'delete', 'assign', 'validate', 'import')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    
    -- Target data
    target_categories JSONB DEFAULT '[]',
    target_assets JSONB DEFAULT '[]',
    
    -- Operation parameters
    parameters JSONB DEFAULT '{}',
    
    -- Progress tracking
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    successful_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    
    -- Results
    results JSONB DEFAULT '[]',
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Category import templates
CREATE TABLE category_import_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template definition
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Template structure
    template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('csv', 'excel', 'json', 'api')),
    field_mappings JSONB NOT NULL DEFAULT '{}',
    required_fields JSONB DEFAULT '[]',
    optional_fields JSONB DEFAULT '[]',
    
    -- Import configuration
    duplicate_handling VARCHAR(20) DEFAULT 'skip' CHECK (duplicate_handling IN ('skip', 'update', 'merge')),
    validation_rules JSONB DEFAULT '[]',
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Category validation results
CREATE TABLE category_validation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    
    -- Validation checks
    checks JSONB NOT NULL DEFAULT '[]',
    
    -- Overall status
    overall_status VARCHAR(20) NOT NULL CHECK (overall_status IN ('valid', 'warning', 'invalid')),
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    
    -- Recommendations
    recommendations JSONB DEFAULT '[]',
    
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(category_id, validated_at)
);

-- Indexes for performance
CREATE INDEX idx_asset_categories_user_id ON asset_categories(user_id);
CREATE INDEX idx_asset_categories_parent_id ON asset_categories(parent_category_id);
CREATE INDEX idx_asset_categories_type ON asset_categories(category_type);
CREATE INDEX idx_asset_categories_path ON asset_categories USING GIN(to_tsvector('english', path));
CREATE INDEX idx_asset_categories_active ON asset_categories(is_active);

CREATE INDEX idx_asset_category_rules_category_id ON asset_category_rules(category_id);
CREATE INDEX idx_asset_category_rules_active ON asset_category_rules(is_active);
CREATE INDEX idx_asset_category_rules_type ON asset_category_rules(rule_type);

CREATE INDEX idx_asset_category_assignments_user_id ON asset_category_assignments(user_id);
CREATE INDEX idx_asset_category_assignments_asset_symbol ON asset_category_assignments(asset_symbol);
CREATE INDEX idx_asset_category_assignments_category_id ON asset_category_assignments(category_id);
CREATE INDEX idx_asset_category_assignments_type ON asset_category_assignments(assignment_type);
CREATE INDEX idx_asset_category_assignments_active ON asset_category_assignments(is_active);

CREATE INDEX idx_category_taxonomies_user_id ON category_taxonomies(user_id);
CREATE INDEX idx_category_taxonomies_type ON category_taxonomies(taxonomy_type);
CREATE INDEX idx_category_taxonomies_active ON category_taxonomies(is_active);

CREATE INDEX idx_asset_classification_suggestions_user_id ON asset_classification_suggestions(user_id);
CREATE INDEX idx_asset_classification_suggestions_asset_symbol ON asset_classification_suggestions(asset_symbol);
CREATE INDEX idx_asset_classification_suggestions_status ON asset_classification_suggestions(status);

CREATE INDEX idx_category_performance_metrics_category_id ON category_performance_metrics(category_id);
CREATE INDEX idx_category_performance_metrics_period ON category_performance_metrics(period_start, period_end);

CREATE INDEX idx_category_analytics_category_id ON category_analytics(category_id);

CREATE INDEX idx_category_bulk_operations_user_id ON category_bulk_operations(user_id);
CREATE INDEX idx_category_bulk_operations_status ON category_bulk_operations(status);
CREATE INDEX idx_category_bulk_operations_type ON category_bulk_operations(operation_type);

CREATE INDEX idx_category_import_templates_user_id ON category_import_templates(user_id);

CREATE INDEX idx_category_validation_results_category_id ON category_validation_results(category_id);
CREATE INDEX idx_category_validation_results_status ON category_validation_results(overall_status);

-- RLS Policies
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_category_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_taxonomies ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_classification_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_import_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_validation_results ENABLE ROW LEVEL SECURITY;

-- Users can manage their own categories and data
CREATE POLICY "Users can manage own categories" ON asset_categories
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own assignments" ON asset_category_assignments
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own taxonomies" ON category_taxonomies
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own suggestions" ON asset_classification_suggestions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own templates" ON category_import_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bulk operations" ON category_bulk_operations
    FOR ALL USING (auth.uid() = user_id);

-- Category-based access for rules, metrics, analytics, and validations
CREATE POLICY "Users can manage rules for their categories" ON asset_category_rules
    FOR ALL USING (
        category_id IN (
            SELECT id FROM asset_categories WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view metrics for their categories" ON category_performance_metrics
    FOR SELECT USING (
        category_id IN (
            SELECT id FROM asset_categories WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view analytics for their categories" ON category_analytics
    FOR SELECT USING (
        category_id IN (
            SELECT id FROM asset_categories WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view validations for their categories" ON category_validation_results
    FOR SELECT USING (
        category_id IN (
            SELECT id FROM asset_categories WHERE user_id = auth.uid()
        )
    );

-- Public access for system categories
CREATE POLICY "System categories are publicly viewable" ON asset_categories
    FOR SELECT USING (is_system = true AND is_active = true);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_asset_categories_updated_at BEFORE UPDATE ON asset_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_category_rules_updated_at BEFORE UPDATE ON asset_category_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_category_assignments_updated_at BEFORE UPDATE ON asset_category_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_category_taxonomies_updated_at BEFORE UPDATE ON category_taxonomies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_category_bulk_operations_updated_at BEFORE UPDATE ON category_bulk_operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_category_import_templates_updated_at BEFORE UPDATE ON category_import_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update category path
CREATE OR REPLACE FUNCTION update_category_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT := '';
BEGIN
    -- Get parent path if this category has a parent
    IF NEW.parent_category_id IS NOT NULL THEN
        SELECT path INTO parent_path
        FROM asset_categories
        WHERE id = NEW.parent_category_id;
        
        NEW.path := parent_path || '/' || NEW.name;
        NEW.level := (SELECT level FROM asset_categories WHERE id = NEW.parent_category_id) + 1;
    ELSE
        NEW.path := NEW.name;
        NEW.level := 0;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for path updates
CREATE TRIGGER update_category_path_trigger
    BEFORE INSERT OR UPDATE ON asset_categories
    FOR EACH ROW EXECUTE FUNCTION update_category_path();

-- Function to prevent circular references
CREATE OR REPLACE FUNCTION prevent_circular_reference()
RETURNS TRIGGER AS $$
DECLARE
    current_id UUID;
    visited_ids UUID[];
BEGIN
    -- Only check if parent_category_id is being set
    IF NEW.parent_category_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    current_id := NEW.parent_category_id;
    visited_ids := ARRAY[NEW.id];
    
    -- Walk up the hierarchy to check for circular reference
    WHILE current_id IS NOT NULL LOOP
        -- If we've seen this ID before, it's a circular reference
        IF current_id = ANY(visited_ids) THEN
            RAISE EXCEPTION 'Circular reference detected in category hierarchy';
        END IF;
        
        visited_ids := visited_ids || current_id;
        
        -- Get the parent of the current category
        SELECT parent_category_id INTO current_id
        FROM asset_categories
        WHERE id = current_id;
    END LOOP;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for circular reference prevention
CREATE TRIGGER prevent_circular_reference_trigger
    BEFORE INSERT OR UPDATE ON asset_categories
    FOR EACH ROW EXECUTE FUNCTION prevent_circular_reference();

-- Function to update taxonomy statistics
CREATE OR REPLACE FUNCTION update_taxonomy_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update categories_count for the taxonomy
    UPDATE category_taxonomies
    SET categories_count = (
        SELECT COUNT(*)
        FROM asset_categories
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    ),
    assets_count = (
        SELECT COUNT(DISTINCT asset_symbol)
        FROM asset_category_assignments
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    )
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers for taxonomy statistics
CREATE TRIGGER update_taxonomy_stats_on_category_change
    AFTER INSERT OR UPDATE OR DELETE ON asset_categories
    FOR EACH ROW EXECUTE FUNCTION update_taxonomy_stats();

CREATE TRIGGER update_taxonomy_stats_on_assignment_change
    AFTER INSERT OR UPDATE OR DELETE ON asset_category_assignments
    FOR EACH ROW EXECUTE FUNCTION update_taxonomy_stats(); 