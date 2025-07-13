-- Block 13: Manual Trade Journal - Database Schema
-- Comprehensive trade journaling and manual trade logging system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Journal Entries Table
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Entry Content
    title TEXT,
    content TEXT NOT NULL,
    entry_type TEXT DEFAULT 'general', -- 'general', 'trade', 'strategy', 'analysis', 'lesson'
    
    -- Associated Trade/Asset
    trade_id UUID,
    asset_symbol TEXT,
    
    -- Trade Context (if applicable)
    trade_type TEXT, -- 'buy', 'sell', 'hold'
    entry_price DECIMAL(18,8),
    exit_price DECIMAL(18,8),
    quantity DECIMAL(18,8),
    
    -- Analysis and Rationale
    strategy_used TEXT,
    reasoning TEXT,
    market_conditions TEXT,
    confidence_level INTEGER DEFAULT 5, -- 1-10 scale
    
    -- Outcome Tracking
    expected_outcome TEXT,
    actual_outcome TEXT,
    success_rating INTEGER, -- 1-10 scale
    lessons_learned TEXT,
    
    -- Categorization
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    mood TEXT, -- 'confident', 'uncertain', 'fearful', 'greedy', etc.
    market_phase TEXT, -- 'bull', 'bear', 'sideways', 'volatile'
    
    -- Attachments and References
    attachments JSONB DEFAULT '[]',
    references JSONB DEFAULT '[]',
    
    -- Privacy and Sharing
    is_public BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    
    -- Metadata
    entry_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manual Trade Logs Table
CREATE TABLE IF NOT EXISTS manual_trade_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
    
    -- Trade Details
    symbol TEXT NOT NULL,
    asset_name TEXT,
    trade_type TEXT NOT NULL, -- 'buy', 'sell'
    
    -- Execution Details
    entry_price DECIMAL(18,8) NOT NULL,
    quantity DECIMAL(18,8) NOT NULL,
    total_value DECIMAL(18,2) NOT NULL,
    
    -- Order Details
    order_type TEXT DEFAULT 'market', -- 'market', 'limit', 'stop'
    fees DECIMAL(18,2) DEFAULT 0,
    broker TEXT,
    account_type TEXT DEFAULT 'real', -- 'real', 'paper', 'demo'
    
    -- Risk Management
    target_price DECIMAL(18,8),
    stop_loss_price DECIMAL(18,8),
    risk_reward_ratio DECIMAL(5,2),
    position_size_percent DECIMAL(5,2),
    
    -- Strategy and Context
    strategy TEXT,
    time_horizon TEXT DEFAULT 'medium', -- 'short', 'medium', 'long'
    conviction_level INTEGER DEFAULT 5, -- 1-10 scale
    
    -- Market Context
    market_conditions TEXT,
    economic_events TEXT[] DEFAULT ARRAY[]::TEXT[],
    technical_indicators JSONB DEFAULT '{}',
    
    -- Performance Tracking
    current_price DECIMAL(18,8),
    unrealized_pnl DECIMAL(18,2) DEFAULT 0,
    unrealized_pnl_percent DECIMAL(5,2) DEFAULT 0,
    max_profit DECIMAL(18,2) DEFAULT 0,
    max_loss DECIMAL(18,2) DEFAULT 0,
    
    -- Exit Information (when closed)
    exit_price DECIMAL(18,8),
    exit_date DATE,
    exit_reason TEXT,
    realized_pnl DECIMAL(18,2),
    realized_pnl_percent DECIMAL(5,2),
    
    -- Status
    status TEXT DEFAULT 'open', -- 'open', 'closed', 'cancelled'
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    trade_date DATE DEFAULT CURRENT_DATE,
    execution_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade Analysis Table
CREATE TABLE IF NOT EXISTS trade_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_log_id UUID NOT NULL REFERENCES manual_trade_logs(id) ON DELETE CASCADE,
    
    -- Pre-Trade Analysis
    pre_trade_analysis TEXT,
    entry_criteria TEXT,
    risk_assessment TEXT,
    expected_duration TEXT,
    
    -- During Trade Analysis
    mid_trade_notes TEXT[] DEFAULT ARRAY[]::TEXT[],
    adjustment_reasons TEXT[] DEFAULT ARRAY[]::TEXT[],
    emotional_state TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Post-Trade Analysis
    post_trade_analysis TEXT,
    what_went_right TEXT,
    what_went_wrong TEXT,
    key_learnings TEXT,
    would_do_differently TEXT,
    
    -- Performance Analysis
    execution_quality INTEGER DEFAULT 5, -- 1-10 scale
    timing_quality INTEGER DEFAULT 5, -- 1-10 scale
    risk_management_quality INTEGER DEFAULT 5, -- 1-10 scale
    
    -- Emotional Analysis
    pre_trade_emotion TEXT,
    during_trade_emotion TEXT,
    post_trade_emotion TEXT,
    emotional_discipline_rating INTEGER DEFAULT 5, -- 1-10 scale
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal Templates Table
CREATE TABLE IF NOT EXISTS journal_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template Details
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT DEFAULT 'journal', -- 'journal', 'trade', 'analysis'
    
    -- Template Content
    content_template TEXT NOT NULL,
    required_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
    optional_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Usage
    usage_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    is_system_template BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Journal Statistics Table
CREATE TABLE IF NOT EXISTS journal_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Journal Stats
    total_entries INTEGER DEFAULT 0,
    trade_entries INTEGER DEFAULT 0,
    analysis_entries INTEGER DEFAULT 0,
    
    -- Trading Stats
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Performance Stats
    total_pnl DECIMAL(18,2) DEFAULT 0,
    average_win DECIMAL(18,2) DEFAULT 0,
    average_loss DECIMAL(18,2) DEFAULT 0,
    largest_win DECIMAL(18,2) DEFAULT 0,
    largest_loss DECIMAL(18,2) DEFAULT 0,
    
    -- Risk Stats
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(5,4) DEFAULT 0,
    profit_factor DECIMAL(5,2) DEFAULT 0,
    
    -- Behavioral Stats
    average_conviction_level DECIMAL(3,1) DEFAULT 0,
    emotional_discipline_score DECIMAL(3,1) DEFAULT 0,
    strategy_adherence_score DECIMAL(3,1) DEFAULT 0,
    
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, period_start, period_end)
);

-- RLS Policies
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_trade_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_statistics ENABLE ROW LEVEL SECURITY;

-- Journal entries policies
CREATE POLICY "Users can manage own journal entries" ON journal_entries
    FOR ALL USING (auth.uid() = user_id);

-- Manual trade logs policies
CREATE POLICY "Users can manage own trade logs" ON manual_trade_logs
    FOR ALL USING (auth.uid() = user_id);

-- Trade analysis policies
CREATE POLICY "Users can manage own trade analysis" ON trade_analysis
    FOR ALL USING (auth.uid() = user_id);

-- Journal templates policies
CREATE POLICY "Users can manage own templates" ON journal_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public templates" ON journal_templates
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Journal statistics policies
CREATE POLICY "Users can view own statistics" ON journal_statistics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statistics" ON journal_statistics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_entry_date ON journal_entries(entry_date DESC);
CREATE INDEX idx_journal_entries_entry_type ON journal_entries(entry_type);
CREATE INDEX idx_journal_entries_asset_symbol ON journal_entries(asset_symbol);
CREATE INDEX idx_journal_entries_tags ON journal_entries USING GIN(tags);

CREATE INDEX idx_manual_trade_logs_user_id ON manual_trade_logs(user_id);
CREATE INDEX idx_manual_trade_logs_symbol ON manual_trade_logs(symbol);
CREATE INDEX idx_manual_trade_logs_trade_date ON manual_trade_logs(trade_date DESC);
CREATE INDEX idx_manual_trade_logs_status ON manual_trade_logs(status);
CREATE INDEX idx_manual_trade_logs_strategy ON manual_trade_logs(strategy);

CREATE INDEX idx_trade_analysis_user_id ON trade_analysis(user_id);
CREATE INDEX idx_trade_analysis_trade_log_id ON trade_analysis(trade_log_id);

CREATE INDEX idx_journal_templates_user_id ON journal_templates(user_id);
CREATE INDEX idx_journal_templates_type ON journal_templates(template_type);
CREATE INDEX idx_journal_templates_public ON journal_templates(is_public);

CREATE INDEX idx_journal_statistics_user_id ON journal_statistics(user_id);
CREATE INDEX idx_journal_statistics_period ON journal_statistics(period_start, period_end);

-- Updated timestamp triggers
CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manual_trade_logs_updated_at
    BEFORE UPDATE ON manual_trade_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_analysis_updated_at
    BEFORE UPDATE ON trade_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_templates_updated_at
    BEFORE UPDATE ON journal_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for journal management
CREATE OR REPLACE FUNCTION create_journal_entry(
    p_user_id UUID,
    p_title TEXT,
    p_content TEXT,
    p_entry_type TEXT DEFAULT 'general',
    p_asset_symbol TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID AS $$
DECLARE
    entry_id UUID;
BEGIN
    INSERT INTO journal_entries (
        user_id, title, content, entry_type, asset_symbol, tags
    )
    VALUES (
        p_user_id, p_title, p_content, p_entry_type, p_asset_symbol, p_tags
    )
    RETURNING id INTO entry_id;
    
    RETURN entry_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_manual_trade(
    p_user_id UUID,
    p_symbol TEXT,
    p_trade_type TEXT,
    p_entry_price DECIMAL,
    p_quantity DECIMAL,
    p_strategy TEXT DEFAULT NULL,
    p_target_price DECIMAL DEFAULT NULL,
    p_stop_loss_price DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    trade_id UUID;
    total_value DECIMAL;
BEGIN
    total_value := p_entry_price * p_quantity;
    
    INSERT INTO manual_trade_logs (
        user_id, symbol, trade_type, entry_price, quantity, total_value,
        strategy, target_price, stop_loss_price
    )
    VALUES (
        p_user_id, p_symbol, p_trade_type, p_entry_price, p_quantity, total_value,
        p_strategy, p_target_price, p_stop_loss_price
    )
    RETURNING id INTO trade_id;
    
    RETURN trade_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION close_trade(
    p_trade_id UUID,
    p_exit_price DECIMAL,
    p_exit_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    trade_record RECORD;
    realized_pnl DECIMAL;
    realized_pnl_percent DECIMAL;
BEGIN
    -- Get trade details
    SELECT * INTO trade_record
    FROM manual_trade_logs
    WHERE id = p_trade_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate realized P&L
    IF trade_record.trade_type = 'buy' THEN
        realized_pnl := (p_exit_price - trade_record.entry_price) * trade_record.quantity;
    ELSE
        realized_pnl := (trade_record.entry_price - p_exit_price) * trade_record.quantity;
    END IF;
    
    realized_pnl_percent := (realized_pnl / trade_record.total_value) * 100;
    
    -- Update trade record
    UPDATE manual_trade_logs
    SET 
        exit_price = p_exit_price,
        exit_date = CURRENT_DATE,
        exit_reason = p_exit_reason,
        realized_pnl = realized_pnl,
        realized_pnl_percent = realized_pnl_percent,
        status = 'closed',
        updated_at = NOW()
    WHERE id = p_trade_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_trade_performance(
    p_trade_id UUID,
    p_current_price DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    trade_record RECORD;
    unrealized_pnl DECIMAL;
    unrealized_pnl_percent DECIMAL;
BEGIN
    -- Get trade details
    SELECT * INTO trade_record
    FROM manual_trade_logs
    WHERE id = p_trade_id AND status = 'open';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate unrealized P&L
    IF trade_record.trade_type = 'buy' THEN
        unrealized_pnl := (p_current_price - trade_record.entry_price) * trade_record.quantity;
    ELSE
        unrealized_pnl := (trade_record.entry_price - p_current_price) * trade_record.quantity;
    END IF;
    
    unrealized_pnl_percent := (unrealized_pnl / trade_record.total_value) * 100;
    
    -- Update trade record
    UPDATE manual_trade_logs
    SET 
        current_price = p_current_price,
        unrealized_pnl = unrealized_pnl,
        unrealized_pnl_percent = unrealized_pnl_percent,
        max_profit = GREATEST(max_profit, unrealized_pnl),
        max_loss = LEAST(max_loss, unrealized_pnl),
        updated_at = NOW()
    WHERE id = p_trade_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_journal_statistics(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS UUID AS $$
DECLARE
    stats_id UUID;
    entry_stats RECORD;
    trade_stats RECORD;
    performance_stats RECORD;
BEGIN
    -- Calculate journal entry statistics
    SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN entry_type = 'trade' THEN 1 END) as trade_entries,
        COUNT(CASE WHEN entry_type = 'analysis' THEN 1 END) as analysis_entries
    INTO entry_stats
    FROM journal_entries
    WHERE user_id = p_user_id 
    AND entry_date BETWEEN p_start_date AND p_end_date;
    
    -- Calculate trade statistics
    SELECT 
        COUNT(*) as total_trades,
        COUNT(CASE WHEN realized_pnl > 0 THEN 1 END) as winning_trades,
        COUNT(CASE WHEN realized_pnl < 0 THEN 1 END) as losing_trades,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(CASE WHEN realized_pnl > 0 THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100
            ELSE 0 
        END as win_rate
    INTO trade_stats
    FROM manual_trade_logs
    WHERE user_id = p_user_id 
    AND trade_date BETWEEN p_start_date AND p_end_date
    AND status = 'closed';
    
    -- Calculate performance statistics
    SELECT 
        COALESCE(SUM(realized_pnl), 0) as total_pnl,
        COALESCE(AVG(CASE WHEN realized_pnl > 0 THEN realized_pnl END), 0) as average_win,
        COALESCE(AVG(CASE WHEN realized_pnl < 0 THEN realized_pnl END), 0) as average_loss,
        COALESCE(MAX(realized_pnl), 0) as largest_win,
        COALESCE(MIN(realized_pnl), 0) as largest_loss
    INTO performance_stats
    FROM manual_trade_logs
    WHERE user_id = p_user_id 
    AND trade_date BETWEEN p_start_date AND p_end_date
    AND status = 'closed';
    
    -- Insert statistics
    INSERT INTO journal_statistics (
        user_id, period_start, period_end,
        total_entries, trade_entries, analysis_entries,
        total_trades, winning_trades, losing_trades, win_rate,
        total_pnl, average_win, average_loss, largest_win, largest_loss
    )
    VALUES (
        p_user_id, p_start_date, p_end_date,
        entry_stats.total_entries, entry_stats.trade_entries, entry_stats.analysis_entries,
        trade_stats.total_trades, trade_stats.winning_trades, trade_stats.losing_trades, trade_stats.win_rate,
        performance_stats.total_pnl, performance_stats.average_win, performance_stats.average_loss,
        performance_stats.largest_win, performance_stats.largest_loss
    )
    ON CONFLICT (user_id, period_start, period_end)
    DO UPDATE SET
        total_entries = EXCLUDED.total_entries,
        trade_entries = EXCLUDED.trade_entries,
        analysis_entries = EXCLUDED.analysis_entries,
        total_trades = EXCLUDED.total_trades,
        winning_trades = EXCLUDED.winning_trades,
        losing_trades = EXCLUDED.losing_trades,
        win_rate = EXCLUDED.win_rate,
        total_pnl = EXCLUDED.total_pnl,
        average_win = EXCLUDED.average_win,
        average_loss = EXCLUDED.average_loss,
        largest_win = EXCLUDED.largest_win,
        largest_loss = EXCLUDED.largest_loss,
        calculated_at = NOW()
    RETURNING id INTO stats_id;
    
    RETURN stats_id;
END;
$$ LANGUAGE plpgsql; 
-- Comprehensive trade journaling and manual trade logging system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Journal Entries Table
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Entry Content
    title TEXT,
    content TEXT NOT NULL,
    entry_type TEXT DEFAULT 'general', -- 'general', 'trade', 'strategy', 'analysis', 'lesson'
    
    -- Associated Trade/Asset
    trade_id UUID,
    asset_symbol TEXT,
    
    -- Trade Context (if applicable)
    trade_type TEXT, -- 'buy', 'sell', 'hold'
    entry_price DECIMAL(18,8),
    exit_price DECIMAL(18,8),
    quantity DECIMAL(18,8),
    
    -- Analysis and Rationale
    strategy_used TEXT,
    reasoning TEXT,
    market_conditions TEXT,
    confidence_level INTEGER DEFAULT 5, -- 1-10 scale
    
    -- Outcome Tracking
    expected_outcome TEXT,
    actual_outcome TEXT,
    success_rating INTEGER, -- 1-10 scale
    lessons_learned TEXT,
    
    -- Categorization
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    mood TEXT, -- 'confident', 'uncertain', 'fearful', 'greedy', etc.
    market_phase TEXT, -- 'bull', 'bear', 'sideways', 'volatile'
    
    -- Attachments and References
    attachments JSONB DEFAULT '[]',
    references JSONB DEFAULT '[]',
    
    -- Privacy and Sharing
    is_public BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    
    -- Metadata
    entry_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manual Trade Logs Table
CREATE TABLE IF NOT EXISTS manual_trade_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
    
    -- Trade Details
    symbol TEXT NOT NULL,
    asset_name TEXT,
    trade_type TEXT NOT NULL, -- 'buy', 'sell'
    
    -- Execution Details
    entry_price DECIMAL(18,8) NOT NULL,
    quantity DECIMAL(18,8) NOT NULL,
    total_value DECIMAL(18,2) NOT NULL,
    
    -- Order Details
    order_type TEXT DEFAULT 'market', -- 'market', 'limit', 'stop'
    fees DECIMAL(18,2) DEFAULT 0,
    broker TEXT,
    account_type TEXT DEFAULT 'real', -- 'real', 'paper', 'demo'
    
    -- Risk Management
    target_price DECIMAL(18,8),
    stop_loss_price DECIMAL(18,8),
    risk_reward_ratio DECIMAL(5,2),
    position_size_percent DECIMAL(5,2),
    
    -- Strategy and Context
    strategy TEXT,
    time_horizon TEXT DEFAULT 'medium', -- 'short', 'medium', 'long'
    conviction_level INTEGER DEFAULT 5, -- 1-10 scale
    
    -- Market Context
    market_conditions TEXT,
    economic_events TEXT[] DEFAULT ARRAY[]::TEXT[],
    technical_indicators JSONB DEFAULT '{}',
    
    -- Performance Tracking
    current_price DECIMAL(18,8),
    unrealized_pnl DECIMAL(18,2) DEFAULT 0,
    unrealized_pnl_percent DECIMAL(5,2) DEFAULT 0,
    max_profit DECIMAL(18,2) DEFAULT 0,
    max_loss DECIMAL(18,2) DEFAULT 0,
    
    -- Exit Information (when closed)
    exit_price DECIMAL(18,8),
    exit_date DATE,
    exit_reason TEXT,
    realized_pnl DECIMAL(18,2),
    realized_pnl_percent DECIMAL(5,2),
    
    -- Status
    status TEXT DEFAULT 'open', -- 'open', 'closed', 'cancelled'
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    trade_date DATE DEFAULT CURRENT_DATE,
    execution_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade Analysis Table
CREATE TABLE IF NOT EXISTS trade_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_log_id UUID NOT NULL REFERENCES manual_trade_logs(id) ON DELETE CASCADE,
    
    -- Pre-Trade Analysis
    pre_trade_analysis TEXT,
    entry_criteria TEXT,
    risk_assessment TEXT,
    expected_duration TEXT,
    
    -- During Trade Analysis
    mid_trade_notes TEXT[] DEFAULT ARRAY[]::TEXT[],
    adjustment_reasons TEXT[] DEFAULT ARRAY[]::TEXT[],
    emotional_state TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Post-Trade Analysis
    post_trade_analysis TEXT,
    what_went_right TEXT,
    what_went_wrong TEXT,
    key_learnings TEXT,
    would_do_differently TEXT,
    
    -- Performance Analysis
    execution_quality INTEGER DEFAULT 5, -- 1-10 scale
    timing_quality INTEGER DEFAULT 5, -- 1-10 scale
    risk_management_quality INTEGER DEFAULT 5, -- 1-10 scale
    
    -- Emotional Analysis
    pre_trade_emotion TEXT,
    during_trade_emotion TEXT,
    post_trade_emotion TEXT,
    emotional_discipline_rating INTEGER DEFAULT 5, -- 1-10 scale
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal Templates Table
CREATE TABLE IF NOT EXISTS journal_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template Details
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT DEFAULT 'journal', -- 'journal', 'trade', 'analysis'
    
    -- Template Content
    content_template TEXT NOT NULL,
    required_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
    optional_fields TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Usage
    usage_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    is_system_template BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Journal Statistics Table
CREATE TABLE IF NOT EXISTS journal_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Journal Stats
    total_entries INTEGER DEFAULT 0,
    trade_entries INTEGER DEFAULT 0,
    analysis_entries INTEGER DEFAULT 0,
    
    -- Trading Stats
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Performance Stats
    total_pnl DECIMAL(18,2) DEFAULT 0,
    average_win DECIMAL(18,2) DEFAULT 0,
    average_loss DECIMAL(18,2) DEFAULT 0,
    largest_win DECIMAL(18,2) DEFAULT 0,
    largest_loss DECIMAL(18,2) DEFAULT 0,
    
    -- Risk Stats
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(5,4) DEFAULT 0,
    profit_factor DECIMAL(5,2) DEFAULT 0,
    
    -- Behavioral Stats
    average_conviction_level DECIMAL(3,1) DEFAULT 0,
    emotional_discipline_score DECIMAL(3,1) DEFAULT 0,
    strategy_adherence_score DECIMAL(3,1) DEFAULT 0,
    
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, period_start, period_end)
);

-- RLS Policies
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_trade_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_statistics ENABLE ROW LEVEL SECURITY;

-- Journal entries policies
CREATE POLICY "Users can manage own journal entries" ON journal_entries
    FOR ALL USING (auth.uid() = user_id);

-- Manual trade logs policies
CREATE POLICY "Users can manage own trade logs" ON manual_trade_logs
    FOR ALL USING (auth.uid() = user_id);

-- Trade analysis policies
CREATE POLICY "Users can manage own trade analysis" ON trade_analysis
    FOR ALL USING (auth.uid() = user_id);

-- Journal templates policies
CREATE POLICY "Users can manage own templates" ON journal_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public templates" ON journal_templates
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Journal statistics policies
CREATE POLICY "Users can view own statistics" ON journal_statistics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statistics" ON journal_statistics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_entry_date ON journal_entries(entry_date DESC);
CREATE INDEX idx_journal_entries_entry_type ON journal_entries(entry_type);
CREATE INDEX idx_journal_entries_asset_symbol ON journal_entries(asset_symbol);
CREATE INDEX idx_journal_entries_tags ON journal_entries USING GIN(tags);

CREATE INDEX idx_manual_trade_logs_user_id ON manual_trade_logs(user_id);
CREATE INDEX idx_manual_trade_logs_symbol ON manual_trade_logs(symbol);
CREATE INDEX idx_manual_trade_logs_trade_date ON manual_trade_logs(trade_date DESC);
CREATE INDEX idx_manual_trade_logs_status ON manual_trade_logs(status);
CREATE INDEX idx_manual_trade_logs_strategy ON manual_trade_logs(strategy);

CREATE INDEX idx_trade_analysis_user_id ON trade_analysis(user_id);
CREATE INDEX idx_trade_analysis_trade_log_id ON trade_analysis(trade_log_id);

CREATE INDEX idx_journal_templates_user_id ON journal_templates(user_id);
CREATE INDEX idx_journal_templates_type ON journal_templates(template_type);
CREATE INDEX idx_journal_templates_public ON journal_templates(is_public);

CREATE INDEX idx_journal_statistics_user_id ON journal_statistics(user_id);
CREATE INDEX idx_journal_statistics_period ON journal_statistics(period_start, period_end);

-- Updated timestamp triggers
CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manual_trade_logs_updated_at
    BEFORE UPDATE ON manual_trade_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_analysis_updated_at
    BEFORE UPDATE ON trade_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_templates_updated_at
    BEFORE UPDATE ON journal_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for journal management
CREATE OR REPLACE FUNCTION create_journal_entry(
    p_user_id UUID,
    p_title TEXT,
    p_content TEXT,
    p_entry_type TEXT DEFAULT 'general',
    p_asset_symbol TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID AS $$
DECLARE
    entry_id UUID;
BEGIN
    INSERT INTO journal_entries (
        user_id, title, content, entry_type, asset_symbol, tags
    )
    VALUES (
        p_user_id, p_title, p_content, p_entry_type, p_asset_symbol, p_tags
    )
    RETURNING id INTO entry_id;
    
    RETURN entry_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_manual_trade(
    p_user_id UUID,
    p_symbol TEXT,
    p_trade_type TEXT,
    p_entry_price DECIMAL,
    p_quantity DECIMAL,
    p_strategy TEXT DEFAULT NULL,
    p_target_price DECIMAL DEFAULT NULL,
    p_stop_loss_price DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    trade_id UUID;
    total_value DECIMAL;
BEGIN
    total_value := p_entry_price * p_quantity;
    
    INSERT INTO manual_trade_logs (
        user_id, symbol, trade_type, entry_price, quantity, total_value,
        strategy, target_price, stop_loss_price
    )
    VALUES (
        p_user_id, p_symbol, p_trade_type, p_entry_price, p_quantity, total_value,
        p_strategy, p_target_price, p_stop_loss_price
    )
    RETURNING id INTO trade_id;
    
    RETURN trade_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION close_trade(
    p_trade_id UUID,
    p_exit_price DECIMAL,
    p_exit_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    trade_record RECORD;
    realized_pnl DECIMAL;
    realized_pnl_percent DECIMAL;
BEGIN
    -- Get trade details
    SELECT * INTO trade_record
    FROM manual_trade_logs
    WHERE id = p_trade_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate realized P&L
    IF trade_record.trade_type = 'buy' THEN
        realized_pnl := (p_exit_price - trade_record.entry_price) * trade_record.quantity;
    ELSE
        realized_pnl := (trade_record.entry_price - p_exit_price) * trade_record.quantity;
    END IF;
    
    realized_pnl_percent := (realized_pnl / trade_record.total_value) * 100;
    
    -- Update trade record
    UPDATE manual_trade_logs
    SET 
        exit_price = p_exit_price,
        exit_date = CURRENT_DATE,
        exit_reason = p_exit_reason,
        realized_pnl = realized_pnl,
        realized_pnl_percent = realized_pnl_percent,
        status = 'closed',
        updated_at = NOW()
    WHERE id = p_trade_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_trade_performance(
    p_trade_id UUID,
    p_current_price DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    trade_record RECORD;
    unrealized_pnl DECIMAL;
    unrealized_pnl_percent DECIMAL;
BEGIN
    -- Get trade details
    SELECT * INTO trade_record
    FROM manual_trade_logs
    WHERE id = p_trade_id AND status = 'open';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate unrealized P&L
    IF trade_record.trade_type = 'buy' THEN
        unrealized_pnl := (p_current_price - trade_record.entry_price) * trade_record.quantity;
    ELSE
        unrealized_pnl := (trade_record.entry_price - p_current_price) * trade_record.quantity;
    END IF;
    
    unrealized_pnl_percent := (unrealized_pnl / trade_record.total_value) * 100;
    
    -- Update trade record
    UPDATE manual_trade_logs
    SET 
        current_price = p_current_price,
        unrealized_pnl = unrealized_pnl,
        unrealized_pnl_percent = unrealized_pnl_percent,
        max_profit = GREATEST(max_profit, unrealized_pnl),
        max_loss = LEAST(max_loss, unrealized_pnl),
        updated_at = NOW()
    WHERE id = p_trade_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_journal_statistics(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS UUID AS $$
DECLARE
    stats_id UUID;
    entry_stats RECORD;
    trade_stats RECORD;
    performance_stats RECORD;
BEGIN
    -- Calculate journal entry statistics
    SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN entry_type = 'trade' THEN 1 END) as trade_entries,
        COUNT(CASE WHEN entry_type = 'analysis' THEN 1 END) as analysis_entries
    INTO entry_stats
    FROM journal_entries
    WHERE user_id = p_user_id 
    AND entry_date BETWEEN p_start_date AND p_end_date;
    
    -- Calculate trade statistics
    SELECT 
        COUNT(*) as total_trades,
        COUNT(CASE WHEN realized_pnl > 0 THEN 1 END) as winning_trades,
        COUNT(CASE WHEN realized_pnl < 0 THEN 1 END) as losing_trades,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(CASE WHEN realized_pnl > 0 THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100
            ELSE 0 
        END as win_rate
    INTO trade_stats
    FROM manual_trade_logs
    WHERE user_id = p_user_id 
    AND trade_date BETWEEN p_start_date AND p_end_date
    AND status = 'closed';
    
    -- Calculate performance statistics
    SELECT 
        COALESCE(SUM(realized_pnl), 0) as total_pnl,
        COALESCE(AVG(CASE WHEN realized_pnl > 0 THEN realized_pnl END), 0) as average_win,
        COALESCE(AVG(CASE WHEN realized_pnl < 0 THEN realized_pnl END), 0) as average_loss,
        COALESCE(MAX(realized_pnl), 0) as largest_win,
        COALESCE(MIN(realized_pnl), 0) as largest_loss
    INTO performance_stats
    FROM manual_trade_logs
    WHERE user_id = p_user_id 
    AND trade_date BETWEEN p_start_date AND p_end_date
    AND status = 'closed';
    
    -- Insert statistics
    INSERT INTO journal_statistics (
        user_id, period_start, period_end,
        total_entries, trade_entries, analysis_entries,
        total_trades, winning_trades, losing_trades, win_rate,
        total_pnl, average_win, average_loss, largest_win, largest_loss
    )
    VALUES (
        p_user_id, p_start_date, p_end_date,
        entry_stats.total_entries, entry_stats.trade_entries, entry_stats.analysis_entries,
        trade_stats.total_trades, trade_stats.winning_trades, trade_stats.losing_trades, trade_stats.win_rate,
        performance_stats.total_pnl, performance_stats.average_win, performance_stats.average_loss,
        performance_stats.largest_win, performance_stats.largest_loss
    )
    ON CONFLICT (user_id, period_start, period_end)
    DO UPDATE SET
        total_entries = EXCLUDED.total_entries,
        trade_entries = EXCLUDED.trade_entries,
        analysis_entries = EXCLUDED.analysis_entries,
        total_trades = EXCLUDED.total_trades,
        winning_trades = EXCLUDED.winning_trades,
        losing_trades = EXCLUDED.losing_trades,
        win_rate = EXCLUDED.win_rate,
        total_pnl = EXCLUDED.total_pnl,
        average_win = EXCLUDED.average_win,
        average_loss = EXCLUDED.average_loss,
        largest_win = EXCLUDED.largest_win,
        largest_loss = EXCLUDED.largest_loss,
        calculated_at = NOW()
    RETURNING id INTO stats_id;
    
    RETURN stats_id;
END;
$$ LANGUAGE plpgsql; 