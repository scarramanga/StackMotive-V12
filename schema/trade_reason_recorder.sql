-- Block 55: Trade Reason Recorder Schema

-- Trade reason categories
CREATE TABLE trade_reason_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    category_type VARCHAR(50) NOT NULL CHECK (category_type IN ('fundamental', 'technical', 'macro', 'sentiment', 'risk', 'strategic', 'custom')),
    parent_category_id UUID REFERENCES trade_reason_categories(id) ON DELETE CASCADE,
    
    -- Display settings
    color VARCHAR(7), -- hex color code
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Trade reason templates
CREATE TABLE trade_reason_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('entry', 'exit', 'position_size', 'stop_loss', 'take_profit', 'hold', 'general')),
    category_id UUID REFERENCES trade_reason_categories(id) ON DELETE SET NULL,
    
    -- Template structure
    template_content TEXT NOT NULL,
    required_fields JSONB DEFAULT '[]',
    optional_fields JSONB DEFAULT '[]',
    
    -- Usage settings
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Trade records with reasons
CREATE TABLE trade_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Trade identification
    trade_id VARCHAR(100), -- external trade ID if applicable
    symbol VARCHAR(20) NOT NULL,
    trade_type VARCHAR(20) NOT NULL CHECK (trade_type IN ('buy', 'sell', 'short', 'cover')),
    
    -- Trade details
    quantity DECIMAL(15,8) NOT NULL,
    price DECIMAL(15,8) NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    fees DECIMAL(10,2) DEFAULT 0,
    
    -- Timing
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    planned_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'executed' CHECK (status IN ('planned', 'executed', 'cancelled', 'failed')),
    
    -- Broker information
    broker VARCHAR(50),
    account_id VARCHAR(100),
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade reason records
CREATE TABLE trade_reason_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_id UUID NOT NULL REFERENCES trade_records(id) ON DELETE CASCADE,
    
    -- Reason classification
    category_id UUID REFERENCES trade_reason_categories(id) ON DELETE SET NULL,
    template_id UUID REFERENCES trade_reason_templates(id) ON DELETE SET NULL,
    
    -- Reason details
    reason_type VARCHAR(50) NOT NULL CHECK (reason_type IN ('primary', 'secondary', 'risk_factor', 'timing', 'exit_strategy')),
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),
    
    -- Reason content
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- Supporting data
    supporting_data JSONB DEFAULT '{}',
    charts_attachments JSONB DEFAULT '[]',
    external_references JSONB DEFAULT '[]',
    
    -- Analysis
    pre_trade_analysis TEXT,
    expected_outcome TEXT,
    risk_assessment TEXT,
    
    -- Post-trade review
    post_trade_review TEXT,
    outcome_analysis TEXT,
    lessons_learned TEXT,
    
    -- Performance tracking
    predicted_return DECIMAL(8,4),
    actual_return DECIMAL(8,4),
    prediction_accuracy DECIMAL(5,2),
    
    -- Status
    is_validated BOOLEAN DEFAULT false,
    validated_at TIMESTAMP WITH TIME ZONE,
    validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reason performance tracking
CREATE TABLE reason_performance_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES trade_reason_categories(id) ON DELETE CASCADE,
    
    -- Performance period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Trade counts
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    
    -- Performance metrics
    total_return DECIMAL(15,2) DEFAULT 0,
    avg_return DECIMAL(8,4) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Risk metrics
    max_drawdown DECIMAL(8,4) DEFAULT 0,
    avg_holding_period INTEGER DEFAULT 0, -- in days
    
    -- Confidence correlation
    avg_confidence DECIMAL(3,1) DEFAULT 0,
    confidence_accuracy DECIMAL(5,2) DEFAULT 0,
    
    -- Additional metrics
    metrics JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, category_id, period_start, period_end)
);

-- Trade reason analysis
CREATE TABLE trade_reason_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Analysis configuration
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('pattern_recognition', 'sentiment_analysis', 'performance_correlation', 'risk_assessment', 'custom')),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Analysis parameters
    parameters JSONB NOT NULL DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    
    -- Results
    results JSONB DEFAULT '{}',
    insights JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade reason tags
CREATE TABLE trade_reason_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Tag settings
    color VARCHAR(7), -- hex color code
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Trade reason record tags (many-to-many)
CREATE TABLE trade_reason_record_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reason_record_id UUID NOT NULL REFERENCES trade_reason_records(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES trade_reason_tags(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(reason_record_id, tag_id)
);

-- Trade reason audit trail
CREATE TABLE trade_reason_audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason_record_id UUID REFERENCES trade_reason_records(id) ON DELETE CASCADE,
    
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'validated', 'reviewed', 'tagged')),
    details TEXT,
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    
    -- Context information
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_trade_reason_categories_user_id ON trade_reason_categories(user_id);
CREATE INDEX idx_trade_reason_templates_user_id ON trade_reason_templates(user_id);
CREATE INDEX idx_trade_reason_templates_category_id ON trade_reason_templates(category_id);
CREATE INDEX idx_trade_records_user_id ON trade_records(user_id);
CREATE INDEX idx_trade_records_symbol ON trade_records(symbol);
CREATE INDEX idx_trade_records_executed_at ON trade_records(executed_at);
CREATE INDEX idx_trade_reason_records_user_id ON trade_reason_records(user_id);
CREATE INDEX idx_trade_reason_records_trade_id ON trade_reason_records(trade_id);
CREATE INDEX idx_trade_reason_records_category_id ON trade_reason_records(category_id);
CREATE INDEX idx_reason_performance_tracking_user_id ON reason_performance_tracking(user_id);
CREATE INDEX idx_reason_performance_tracking_period ON reason_performance_tracking(period_start, period_end);
CREATE INDEX idx_trade_reason_analysis_user_id ON trade_reason_analysis(user_id);
CREATE INDEX idx_trade_reason_tags_user_id ON trade_reason_tags(user_id);
CREATE INDEX idx_trade_reason_record_tags_reason_record_id ON trade_reason_record_tags(reason_record_id);
CREATE INDEX idx_trade_reason_audit_trail_user_id ON trade_reason_audit_trail(user_id);
CREATE INDEX idx_trade_reason_audit_trail_reason_record_id ON trade_reason_audit_trail(reason_record_id);

-- RLS Policies
ALTER TABLE trade_reason_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_reason_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_reason_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reason_performance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_reason_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_reason_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_reason_record_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_reason_audit_trail ENABLE ROW LEVEL SECURITY;

-- Users can manage their own data
CREATE POLICY "Users can manage own categories" ON trade_reason_categories
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own templates" ON trade_reason_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trades" ON trade_records
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reason records" ON trade_reason_records
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own performance tracking" ON reason_performance_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own analysis" ON trade_reason_analysis
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tags" ON trade_reason_tags
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own record tags" ON trade_reason_record_tags
    FOR ALL USING (
        reason_record_id IN (
            SELECT id FROM trade_reason_records WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own audit trail" ON trade_reason_audit_trail
    FOR SELECT USING (auth.uid() = user_id);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_trade_reason_categories_updated_at BEFORE UPDATE ON trade_reason_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_reason_templates_updated_at BEFORE UPDATE ON trade_reason_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_records_updated_at BEFORE UPDATE ON trade_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_reason_records_updated_at BEFORE UPDATE ON trade_reason_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_reason_analysis_updated_at BEFORE UPDATE ON trade_reason_analysis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update template usage count
CREATE OR REPLACE FUNCTION update_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.template_id IS NOT NULL THEN
        UPDATE trade_reason_templates 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.template_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for template usage tracking
CREATE TRIGGER update_template_usage_count_trigger
    AFTER INSERT ON trade_reason_records
    FOR EACH ROW EXECUTE FUNCTION update_template_usage_count();

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE trade_reason_tags 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE trade_reason_tags 
        SET usage_count = usage_count - 1 
        WHERE id = OLD.tag_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger for tag usage tracking
CREATE TRIGGER update_tag_usage_count_trigger
    AFTER INSERT OR DELETE ON trade_reason_record_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count(); 