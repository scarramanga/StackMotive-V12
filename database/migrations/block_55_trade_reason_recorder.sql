-- Block 55: Trade Reason Recorder - Database Schema  
-- Comprehensive trade decision recording and audit system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Trade Reasons Table
CREATE TABLE IF NOT EXISTS trade_reasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Trade Identification
    trade_id UUID,
    symbol TEXT NOT NULL,
    asset_name TEXT,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell', 'hold', 'rebalance', 'tax_harvest', 'stop_loss', 'take_profit')),
    trade_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Trade Details
    quantity DECIMAL(18,8) NOT NULL DEFAULT 0,
    price_per_unit DECIMAL(18,8) NOT NULL DEFAULT 0,
    total_value DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    -- Decision Reasoning
    primary_reason TEXT NOT NULL,
    secondary_reasons TEXT[],
    decision_confidence INTEGER DEFAULT 5 CHECK (decision_confidence >= 1 AND decision_confidence <= 10),
    time_horizon TEXT DEFAULT 'medium' CHECK (time_horizon IN ('short', 'medium', 'long', 'indefinite')),
    
    -- Analysis Framework
    fundamental_factors TEXT[],
    technical_factors TEXT[],
    macro_factors TEXT[],
    sentiment_factors TEXT[],
    risk_factors TEXT[],
    
    -- Strategy Context
    strategy_id TEXT,
    strategy_name TEXT,
    allocation_target DECIMAL(5,2) DEFAULT 0,
    portfolio_impact TEXT,
    
    -- Decision Triggers
    trigger_type TEXT CHECK (trigger_type IN ('manual', 'automatic', 'alert', 'scheduled', 'emergency')),
    trigger_source TEXT,
    trigger_data JSONB DEFAULT '{}',
    
    -- Market Context
    market_conditions TEXT,
    market_volatility DECIMAL(5,2) DEFAULT 0,
    sector_performance DECIMAL(5,2) DEFAULT 0,
    relative_strength DECIMAL(5,2) DEFAULT 0,
    
    -- Risk Assessment
    risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'very_high')),
    expected_return DECIMAL(5,2) DEFAULT 0,
    stop_loss_level DECIMAL(5,2) DEFAULT 0,
    take_profit_level DECIMAL(5,2) DEFAULT 0,
    
    -- Tax Considerations
    tax_implications TEXT,
    wash_sale_risk BOOLEAN DEFAULT false,
    capital_gains_impact DECIMAL(18,2) DEFAULT 0,
    tax_loss_benefit DECIMAL(18,2) DEFAULT 0,
    
    -- AI/Agent Input
    ai_recommendation TEXT,
    ai_confidence DECIMAL(3,2) DEFAULT 0,
    agent_override BOOLEAN DEFAULT false,
    override_reason TEXT,
    
    -- Outcome Tracking
    trade_executed BOOLEAN DEFAULT false,
    execution_price DECIMAL(18,8),
    execution_timestamp TIMESTAMPTZ,
    execution_notes TEXT,
    
    -- Performance Review
    actual_return DECIMAL(5,2),
    holding_period INTEGER, -- days
    decision_quality_score DECIMAL(3,2), -- post-trade evaluation
    lessons_learned TEXT,
    
    -- Metadata
    recording_method TEXT DEFAULT 'manual' CHECK (recording_method IN ('manual', 'automatic', 'ai_assisted', 'voice', 'imported')),
    voice_transcription TEXT,
    additional_notes TEXT,
    tags TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CHECK (quantity >= 0),
    CHECK (price_per_unit >= 0),
    CHECK (total_value >= 0)
);

-- Decision Templates Table
CREATE TABLE IF NOT EXISTS decision_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template Details
    template_name TEXT NOT NULL,
    template_description TEXT,
    template_category TEXT CHECK (template_category IN ('buy', 'sell', 'hold', 'rebalance', 'risk_management', 'tax', 'custom')),
    
    -- Default Reasoning Framework
    default_primary_reasons TEXT[],
    default_factors_to_consider TEXT[],
    required_fields TEXT[],
    
    -- Template Logic
    template_rules JSONB DEFAULT '{}',
    auto_fill_logic JSONB DEFAULT '{}',
    
    -- Usage Statistics
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_system_template BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, template_name)
);

-- Reason Categories Table
CREATE TABLE IF NOT EXISTS reason_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Category Details
    category_name TEXT NOT NULL,
    category_type TEXT CHECK (category_type IN ('fundamental', 'technical', 'macro', 'sentiment', 'risk', 'tax', 'strategy', 'custom')),
    category_description TEXT,
    category_color TEXT DEFAULT '#3B82F6',
    
    -- Predefined Reasons
    standard_reasons TEXT[],
    
    -- Usage and Priority
    display_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, category_name)
);

-- Trade Outcome Reviews Table
CREATE TABLE IF NOT EXISTS trade_outcome_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_reason_id UUID NOT NULL REFERENCES trade_reasons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Review Details
    review_date TIMESTAMPTZ DEFAULT NOW(),
    review_type TEXT DEFAULT 'periodic' CHECK (review_type IN ('periodic', 'exit', 'milestone', 'emergency', 'manual')),
    
    -- Performance Analysis
    actual_return DECIMAL(5,2) NOT NULL,
    expected_vs_actual DECIMAL(5,2) DEFAULT 0,
    holding_period_days INTEGER NOT NULL,
    volatility_experienced DECIMAL(5,2) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    
    -- Decision Quality Assessment
    decision_accuracy_score INTEGER CHECK (decision_accuracy_score >= 1 AND decision_accuracy_score <= 10),
    timing_quality_score INTEGER CHECK (timing_quality_score >= 1 AND timing_quality_score <= 10),
    risk_management_score INTEGER CHECK (risk_management_score >= 1 AND risk_management_score <= 10),
    overall_decision_score INTEGER CHECK (overall_decision_score >= 1 AND overall_decision_score <= 10),
    
    -- Lessons and Insights
    what_went_right TEXT,
    what_went_wrong TEXT,
    key_learnings TEXT,
    future_improvements TEXT,
    
    -- Market Context at Review
    market_performance DECIMAL(5,2) DEFAULT 0,
    sector_performance DECIMAL(5,2) DEFAULT 0,
    benchmark_performance DECIMAL(5,2) DEFAULT 0,
    
    -- Updated Reasoning
    reasoning_still_valid BOOLEAN DEFAULT true,
    new_factors_discovered TEXT[],
    missed_factors TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE trade_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reason_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_outcome_reviews ENABLE ROW LEVEL SECURITY;

-- Trade reasons policies
CREATE POLICY "Users can manage own trade reasons" ON trade_reasons
    FOR ALL USING (auth.uid() = user_id);

-- Decision templates policies
CREATE POLICY "Users can manage own decision templates" ON decision_templates
    FOR ALL USING (auth.uid() = user_id);

-- Reason categories policies
CREATE POLICY "Users can manage own reason categories" ON reason_categories
    FOR ALL USING (auth.uid() = user_id);

-- Trade outcome reviews policies
CREATE POLICY "Users can manage own outcome reviews" ON trade_outcome_reviews
    FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_trade_reasons_user_id ON trade_reasons(user_id);
CREATE INDEX idx_trade_reasons_symbol ON trade_reasons(symbol);
CREATE INDEX idx_trade_reasons_timestamp ON trade_reasons(trade_timestamp DESC);
CREATE INDEX idx_trade_reasons_trade_type ON trade_reasons(trade_type);
CREATE INDEX idx_trade_reasons_executed ON trade_reasons(trade_executed);

CREATE INDEX idx_decision_templates_user_id ON decision_templates(user_id);
CREATE INDEX idx_decision_templates_category ON decision_templates(template_category);
CREATE INDEX idx_decision_templates_active ON decision_templates(user_id, is_active);

CREATE INDEX idx_reason_categories_user_id ON reason_categories(user_id);
CREATE INDEX idx_reason_categories_type ON reason_categories(category_type);
CREATE INDEX idx_reason_categories_active ON reason_categories(user_id, is_active);

CREATE INDEX idx_trade_reviews_trade_reason ON trade_outcome_reviews(trade_reason_id);
CREATE INDEX idx_trade_reviews_user_id ON trade_outcome_reviews(user_id);
CREATE INDEX idx_trade_reviews_date ON trade_outcome_reviews(review_date DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_trade_reasons_updated_at
    BEFORE UPDATE ON trade_reasons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decision_templates_updated_at
    BEFORE UPDATE ON decision_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reason_categories_updated_at
    BEFORE UPDATE ON reason_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for trade reason management
CREATE OR REPLACE FUNCTION create_default_reason_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO reason_categories (user_id, category_name, category_type, standard_reasons, category_color, display_order)
    VALUES 
        (p_user_id, 'Fundamental Analysis', 'fundamental', 
         ARRAY['Strong earnings growth', 'Undervalued P/E ratio', 'Dividend yield attractive', 'Strong balance sheet', 'Market leader position', 'Revenue growth acceleration', 'Margin expansion', 'Free cash flow generation'], 
         '#10B981', 1),
        (p_user_id, 'Technical Analysis', 'technical', 
         ARRAY['Breakout above resistance', 'Support level hold', 'Moving average crossover', 'Volume confirmation', 'RSI oversold/overbought', 'MACD signal', 'Chart pattern completion', 'Momentum indicators'], 
         '#3B82F6', 2),
        (p_user_id, 'Macro Economic', 'macro', 
         ARRAY['Interest rate environment', 'Currency movements', 'Commodity prices', 'Economic indicators', 'Central bank policy', 'Inflation outlook', 'GDP growth', 'Trade policy changes'], 
         '#8B5CF6', 3),
        (p_user_id, 'Market Sentiment', 'sentiment', 
         ARRAY['Analyst upgrades/downgrades', 'News flow positive/negative', 'Sector rotation', 'Institutional flow', 'Retail investor sentiment', 'Market fear/greed', 'Earnings surprises', 'Management guidance'], 
         '#F59E0B', 4),
        (p_user_id, 'Risk Management', 'risk', 
         ARRAY['Stop loss triggered', 'Position size limit', 'Correlation risk', 'Liquidity concerns', 'Volatility spike', 'Portfolio rebalancing', 'Diversification needs', 'Risk/reward assessment'], 
         '#EF4444', 5),
        (p_user_id, 'Tax Optimization', 'tax', 
         ARRAY['Tax loss harvesting', 'Capital gains management', 'Dividend imputation', 'Wash sale avoidance', 'Year-end planning', 'Offset gains/losses', 'Franking credits', 'PIE fund benefits'], 
         '#059669', 6),
        (p_user_id, 'Strategy Alignment', 'strategy', 
         ARRAY['Allocation rebalancing', 'Strategy rotation', 'Theme investment', 'Sector allocation', 'Geographic diversification', 'Asset class rotation', 'Factor exposure', 'ESG criteria'], 
         '#7C3AED', 7)
    ON CONFLICT (user_id, category_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_default_decision_templates(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO decision_templates (user_id, template_name, template_category, template_description, default_primary_reasons, required_fields)
    VALUES 
        (p_user_id, 'Growth Stock Purchase', 'buy', 'Template for buying growth stocks',
         ARRAY['Strong earnings growth', 'Revenue acceleration', 'Market expansion'],
         ARRAY['primary_reason', 'expected_return', 'time_horizon', 'risk_level']),
        (p_user_id, 'Value Stock Purchase', 'buy', 'Template for buying undervalued stocks',
         ARRAY['Undervalued P/E ratio', 'Strong balance sheet', 'Dividend yield'],
         ARRAY['primary_reason', 'fundamental_factors', 'expected_return']),
        (p_user_id, 'Risk Management Sale', 'sell', 'Template for risk-based selling',
         ARRAY['Stop loss triggered', 'Risk/reward deteriorated', 'Position size exceeded'],
         ARRAY['primary_reason', 'risk_factors', 'stop_loss_level']),
        (p_user_id, 'Tax Loss Harvest', 'sell', 'Template for tax loss harvesting',
         ARRAY['Tax loss harvesting', 'Offset capital gains', 'Year-end planning'],
         ARRAY['primary_reason', 'tax_implications', 'capital_gains_impact']),
        (p_user_id, 'Rebalancing Trade', 'rebalance', 'Template for portfolio rebalancing',
         ARRAY['Allocation drift', 'Strategy rebalancing', 'Risk management'],
         ARRAY['primary_reason', 'allocation_target', 'portfolio_impact'])
    ON CONFLICT (user_id, template_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_decision_quality_score(
    p_trade_reason_id UUID,
    p_actual_return DECIMAL,
    p_expected_return DECIMAL,
    p_holding_period INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    accuracy_score INTEGER;
    timing_score INTEGER;
    overall_score INTEGER;
BEGIN
    -- Calculate accuracy based on expected vs actual return
    IF p_expected_return > 0 THEN
        accuracy_score := CASE 
            WHEN p_actual_return >= p_expected_return * 1.2 THEN 10
            WHEN p_actual_return >= p_expected_return THEN 8
            WHEN p_actual_return >= p_expected_return * 0.5 THEN 6
            WHEN p_actual_return >= 0 THEN 4
            ELSE 2
        END;
    ELSE
        accuracy_score := CASE 
            WHEN p_actual_return <= p_expected_return * 1.2 THEN 10
            WHEN p_actual_return <= p_expected_return THEN 8
            WHEN p_actual_return <= p_expected_return * 0.5 THEN 6
            WHEN p_actual_return <= 0 THEN 4
            ELSE 2
        END;
    END IF;
    
    -- Calculate timing score based on holding period efficiency
    timing_score := CASE 
        WHEN p_holding_period <= 30 THEN 8
        WHEN p_holding_period <= 90 THEN 9
        WHEN p_holding_period <= 365 THEN 10
        WHEN p_holding_period <= 730 THEN 8
        ELSE 6
    END;
    
    -- Overall score (weighted average)
    overall_score := (accuracy_score * 0.7 + timing_score * 0.3)::INTEGER;
    
    RETURN GREATEST(1, LEAST(10, overall_score));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_create_trade_review(
    p_trade_reason_id UUID,
    p_actual_return DECIMAL,
    p_holding_period INTEGER
)
RETURNS UUID AS $$
DECLARE
    review_id UUID;
    trade_info RECORD;
    quality_score INTEGER;
BEGIN
    -- Get trade reason details
    SELECT user_id, expected_return, symbol, trade_type
    INTO trade_info
    FROM trade_reasons
    WHERE id = p_trade_reason_id;
    
    -- Calculate decision quality score
    quality_score := calculate_decision_quality_score(
        p_trade_reason_id, 
        p_actual_return, 
        trade_info.expected_return, 
        p_holding_period
    );
    
    -- Create review record
    INSERT INTO trade_outcome_reviews (
        trade_reason_id, user_id, actual_return, holding_period_days,
        decision_accuracy_score, overall_decision_score, review_type
    )
    VALUES (
        p_trade_reason_id, trade_info.user_id, p_actual_return, p_holding_period,
        quality_score, quality_score, 'automatic'
    )
    RETURNING id INTO review_id;
    
    RETURN review_id;
END;
$$ LANGUAGE plpgsql; 
-- Comprehensive trade decision recording and audit system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Trade Reasons Table
CREATE TABLE IF NOT EXISTS trade_reasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Trade Identification
    trade_id UUID,
    symbol TEXT NOT NULL,
    asset_name TEXT,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell', 'hold', 'rebalance', 'tax_harvest', 'stop_loss', 'take_profit')),
    trade_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Trade Details
    quantity DECIMAL(18,8) NOT NULL DEFAULT 0,
    price_per_unit DECIMAL(18,8) NOT NULL DEFAULT 0,
    total_value DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    -- Decision Reasoning
    primary_reason TEXT NOT NULL,
    secondary_reasons TEXT[],
    decision_confidence INTEGER DEFAULT 5 CHECK (decision_confidence >= 1 AND decision_confidence <= 10),
    time_horizon TEXT DEFAULT 'medium' CHECK (time_horizon IN ('short', 'medium', 'long', 'indefinite')),
    
    -- Analysis Framework
    fundamental_factors TEXT[],
    technical_factors TEXT[],
    macro_factors TEXT[],
    sentiment_factors TEXT[],
    risk_factors TEXT[],
    
    -- Strategy Context
    strategy_id TEXT,
    strategy_name TEXT,
    allocation_target DECIMAL(5,2) DEFAULT 0,
    portfolio_impact TEXT,
    
    -- Decision Triggers
    trigger_type TEXT CHECK (trigger_type IN ('manual', 'automatic', 'alert', 'scheduled', 'emergency')),
    trigger_source TEXT,
    trigger_data JSONB DEFAULT '{}',
    
    -- Market Context
    market_conditions TEXT,
    market_volatility DECIMAL(5,2) DEFAULT 0,
    sector_performance DECIMAL(5,2) DEFAULT 0,
    relative_strength DECIMAL(5,2) DEFAULT 0,
    
    -- Risk Assessment
    risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'very_high')),
    expected_return DECIMAL(5,2) DEFAULT 0,
    stop_loss_level DECIMAL(5,2) DEFAULT 0,
    take_profit_level DECIMAL(5,2) DEFAULT 0,
    
    -- Tax Considerations
    tax_implications TEXT,
    wash_sale_risk BOOLEAN DEFAULT false,
    capital_gains_impact DECIMAL(18,2) DEFAULT 0,
    tax_loss_benefit DECIMAL(18,2) DEFAULT 0,
    
    -- AI/Agent Input
    ai_recommendation TEXT,
    ai_confidence DECIMAL(3,2) DEFAULT 0,
    agent_override BOOLEAN DEFAULT false,
    override_reason TEXT,
    
    -- Outcome Tracking
    trade_executed BOOLEAN DEFAULT false,
    execution_price DECIMAL(18,8),
    execution_timestamp TIMESTAMPTZ,
    execution_notes TEXT,
    
    -- Performance Review
    actual_return DECIMAL(5,2),
    holding_period INTEGER, -- days
    decision_quality_score DECIMAL(3,2), -- post-trade evaluation
    lessons_learned TEXT,
    
    -- Metadata
    recording_method TEXT DEFAULT 'manual' CHECK (recording_method IN ('manual', 'automatic', 'ai_assisted', 'voice', 'imported')),
    voice_transcription TEXT,
    additional_notes TEXT,
    tags TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CHECK (quantity >= 0),
    CHECK (price_per_unit >= 0),
    CHECK (total_value >= 0)
);

-- Decision Templates Table
CREATE TABLE IF NOT EXISTS decision_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template Details
    template_name TEXT NOT NULL,
    template_description TEXT,
    template_category TEXT CHECK (template_category IN ('buy', 'sell', 'hold', 'rebalance', 'risk_management', 'tax', 'custom')),
    
    -- Default Reasoning Framework
    default_primary_reasons TEXT[],
    default_factors_to_consider TEXT[],
    required_fields TEXT[],
    
    -- Template Logic
    template_rules JSONB DEFAULT '{}',
    auto_fill_logic JSONB DEFAULT '{}',
    
    -- Usage Statistics
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_system_template BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, template_name)
);

-- Reason Categories Table
CREATE TABLE IF NOT EXISTS reason_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Category Details
    category_name TEXT NOT NULL,
    category_type TEXT CHECK (category_type IN ('fundamental', 'technical', 'macro', 'sentiment', 'risk', 'tax', 'strategy', 'custom')),
    category_description TEXT,
    category_color TEXT DEFAULT '#3B82F6',
    
    -- Predefined Reasons
    standard_reasons TEXT[],
    
    -- Usage and Priority
    display_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, category_name)
);

-- Trade Outcome Reviews Table
CREATE TABLE IF NOT EXISTS trade_outcome_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_reason_id UUID NOT NULL REFERENCES trade_reasons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Review Details
    review_date TIMESTAMPTZ DEFAULT NOW(),
    review_type TEXT DEFAULT 'periodic' CHECK (review_type IN ('periodic', 'exit', 'milestone', 'emergency', 'manual')),
    
    -- Performance Analysis
    actual_return DECIMAL(5,2) NOT NULL,
    expected_vs_actual DECIMAL(5,2) DEFAULT 0,
    holding_period_days INTEGER NOT NULL,
    volatility_experienced DECIMAL(5,2) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    
    -- Decision Quality Assessment
    decision_accuracy_score INTEGER CHECK (decision_accuracy_score >= 1 AND decision_accuracy_score <= 10),
    timing_quality_score INTEGER CHECK (timing_quality_score >= 1 AND timing_quality_score <= 10),
    risk_management_score INTEGER CHECK (risk_management_score >= 1 AND risk_management_score <= 10),
    overall_decision_score INTEGER CHECK (overall_decision_score >= 1 AND overall_decision_score <= 10),
    
    -- Lessons and Insights
    what_went_right TEXT,
    what_went_wrong TEXT,
    key_learnings TEXT,
    future_improvements TEXT,
    
    -- Market Context at Review
    market_performance DECIMAL(5,2) DEFAULT 0,
    sector_performance DECIMAL(5,2) DEFAULT 0,
    benchmark_performance DECIMAL(5,2) DEFAULT 0,
    
    -- Updated Reasoning
    reasoning_still_valid BOOLEAN DEFAULT true,
    new_factors_discovered TEXT[],
    missed_factors TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE trade_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reason_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_outcome_reviews ENABLE ROW LEVEL SECURITY;

-- Trade reasons policies
CREATE POLICY "Users can manage own trade reasons" ON trade_reasons
    FOR ALL USING (auth.uid() = user_id);

-- Decision templates policies
CREATE POLICY "Users can manage own decision templates" ON decision_templates
    FOR ALL USING (auth.uid() = user_id);

-- Reason categories policies
CREATE POLICY "Users can manage own reason categories" ON reason_categories
    FOR ALL USING (auth.uid() = user_id);

-- Trade outcome reviews policies
CREATE POLICY "Users can manage own outcome reviews" ON trade_outcome_reviews
    FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_trade_reasons_user_id ON trade_reasons(user_id);
CREATE INDEX idx_trade_reasons_symbol ON trade_reasons(symbol);
CREATE INDEX idx_trade_reasons_timestamp ON trade_reasons(trade_timestamp DESC);
CREATE INDEX idx_trade_reasons_trade_type ON trade_reasons(trade_type);
CREATE INDEX idx_trade_reasons_executed ON trade_reasons(trade_executed);

CREATE INDEX idx_decision_templates_user_id ON decision_templates(user_id);
CREATE INDEX idx_decision_templates_category ON decision_templates(template_category);
CREATE INDEX idx_decision_templates_active ON decision_templates(user_id, is_active);

CREATE INDEX idx_reason_categories_user_id ON reason_categories(user_id);
CREATE INDEX idx_reason_categories_type ON reason_categories(category_type);
CREATE INDEX idx_reason_categories_active ON reason_categories(user_id, is_active);

CREATE INDEX idx_trade_reviews_trade_reason ON trade_outcome_reviews(trade_reason_id);
CREATE INDEX idx_trade_reviews_user_id ON trade_outcome_reviews(user_id);
CREATE INDEX idx_trade_reviews_date ON trade_outcome_reviews(review_date DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_trade_reasons_updated_at
    BEFORE UPDATE ON trade_reasons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decision_templates_updated_at
    BEFORE UPDATE ON decision_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reason_categories_updated_at
    BEFORE UPDATE ON reason_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for trade reason management
CREATE OR REPLACE FUNCTION create_default_reason_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO reason_categories (user_id, category_name, category_type, standard_reasons, category_color, display_order)
    VALUES 
        (p_user_id, 'Fundamental Analysis', 'fundamental', 
         ARRAY['Strong earnings growth', 'Undervalued P/E ratio', 'Dividend yield attractive', 'Strong balance sheet', 'Market leader position', 'Revenue growth acceleration', 'Margin expansion', 'Free cash flow generation'], 
         '#10B981', 1),
        (p_user_id, 'Technical Analysis', 'technical', 
         ARRAY['Breakout above resistance', 'Support level hold', 'Moving average crossover', 'Volume confirmation', 'RSI oversold/overbought', 'MACD signal', 'Chart pattern completion', 'Momentum indicators'], 
         '#3B82F6', 2),
        (p_user_id, 'Macro Economic', 'macro', 
         ARRAY['Interest rate environment', 'Currency movements', 'Commodity prices', 'Economic indicators', 'Central bank policy', 'Inflation outlook', 'GDP growth', 'Trade policy changes'], 
         '#8B5CF6', 3),
        (p_user_id, 'Market Sentiment', 'sentiment', 
         ARRAY['Analyst upgrades/downgrades', 'News flow positive/negative', 'Sector rotation', 'Institutional flow', 'Retail investor sentiment', 'Market fear/greed', 'Earnings surprises', 'Management guidance'], 
         '#F59E0B', 4),
        (p_user_id, 'Risk Management', 'risk', 
         ARRAY['Stop loss triggered', 'Position size limit', 'Correlation risk', 'Liquidity concerns', 'Volatility spike', 'Portfolio rebalancing', 'Diversification needs', 'Risk/reward assessment'], 
         '#EF4444', 5),
        (p_user_id, 'Tax Optimization', 'tax', 
         ARRAY['Tax loss harvesting', 'Capital gains management', 'Dividend imputation', 'Wash sale avoidance', 'Year-end planning', 'Offset gains/losses', 'Franking credits', 'PIE fund benefits'], 
         '#059669', 6),
        (p_user_id, 'Strategy Alignment', 'strategy', 
         ARRAY['Allocation rebalancing', 'Strategy rotation', 'Theme investment', 'Sector allocation', 'Geographic diversification', 'Asset class rotation', 'Factor exposure', 'ESG criteria'], 
         '#7C3AED', 7)
    ON CONFLICT (user_id, category_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_default_decision_templates(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO decision_templates (user_id, template_name, template_category, template_description, default_primary_reasons, required_fields)
    VALUES 
        (p_user_id, 'Growth Stock Purchase', 'buy', 'Template for buying growth stocks',
         ARRAY['Strong earnings growth', 'Revenue acceleration', 'Market expansion'],
         ARRAY['primary_reason', 'expected_return', 'time_horizon', 'risk_level']),
        (p_user_id, 'Value Stock Purchase', 'buy', 'Template for buying undervalued stocks',
         ARRAY['Undervalued P/E ratio', 'Strong balance sheet', 'Dividend yield'],
         ARRAY['primary_reason', 'fundamental_factors', 'expected_return']),
        (p_user_id, 'Risk Management Sale', 'sell', 'Template for risk-based selling',
         ARRAY['Stop loss triggered', 'Risk/reward deteriorated', 'Position size exceeded'],
         ARRAY['primary_reason', 'risk_factors', 'stop_loss_level']),
        (p_user_id, 'Tax Loss Harvest', 'sell', 'Template for tax loss harvesting',
         ARRAY['Tax loss harvesting', 'Offset capital gains', 'Year-end planning'],
         ARRAY['primary_reason', 'tax_implications', 'capital_gains_impact']),
        (p_user_id, 'Rebalancing Trade', 'rebalance', 'Template for portfolio rebalancing',
         ARRAY['Allocation drift', 'Strategy rebalancing', 'Risk management'],
         ARRAY['primary_reason', 'allocation_target', 'portfolio_impact'])
    ON CONFLICT (user_id, template_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_decision_quality_score(
    p_trade_reason_id UUID,
    p_actual_return DECIMAL,
    p_expected_return DECIMAL,
    p_holding_period INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    accuracy_score INTEGER;
    timing_score INTEGER;
    overall_score INTEGER;
BEGIN
    -- Calculate accuracy based on expected vs actual return
    IF p_expected_return > 0 THEN
        accuracy_score := CASE 
            WHEN p_actual_return >= p_expected_return * 1.2 THEN 10
            WHEN p_actual_return >= p_expected_return THEN 8
            WHEN p_actual_return >= p_expected_return * 0.5 THEN 6
            WHEN p_actual_return >= 0 THEN 4
            ELSE 2
        END;
    ELSE
        accuracy_score := CASE 
            WHEN p_actual_return <= p_expected_return * 1.2 THEN 10
            WHEN p_actual_return <= p_expected_return THEN 8
            WHEN p_actual_return <= p_expected_return * 0.5 THEN 6
            WHEN p_actual_return <= 0 THEN 4
            ELSE 2
        END;
    END IF;
    
    -- Calculate timing score based on holding period efficiency
    timing_score := CASE 
        WHEN p_holding_period <= 30 THEN 8
        WHEN p_holding_period <= 90 THEN 9
        WHEN p_holding_period <= 365 THEN 10
        WHEN p_holding_period <= 730 THEN 8
        ELSE 6
    END;
    
    -- Overall score (weighted average)
    overall_score := (accuracy_score * 0.7 + timing_score * 0.3)::INTEGER;
    
    RETURN GREATEST(1, LEAST(10, overall_score));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_create_trade_review(
    p_trade_reason_id UUID,
    p_actual_return DECIMAL,
    p_holding_period INTEGER
)
RETURNS UUID AS $$
DECLARE
    review_id UUID;
    trade_info RECORD;
    quality_score INTEGER;
BEGIN
    -- Get trade reason details
    SELECT user_id, expected_return, symbol, trade_type
    INTO trade_info
    FROM trade_reasons
    WHERE id = p_trade_reason_id;
    
    -- Calculate decision quality score
    quality_score := calculate_decision_quality_score(
        p_trade_reason_id, 
        p_actual_return, 
        trade_info.expected_return, 
        p_holding_period
    );
    
    -- Create review record
    INSERT INTO trade_outcome_reviews (
        trade_reason_id, user_id, actual_return, holding_period_days,
        decision_accuracy_score, overall_decision_score, review_type
    )
    VALUES (
        p_trade_reason_id, trade_info.user_id, p_actual_return, p_holding_period,
        quality_score, quality_score, 'automatic'
    )
    RETURNING id INTO review_id;
    
    RETURN review_id;
END;
$$ LANGUAGE plpgsql; 