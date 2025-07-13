-- Block 58: Auto-Trim Toggle Schema

-- Auto-trim configurations
CREATE TABLE auto_trim_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Configuration details
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Configuration status
    is_active BOOLEAN DEFAULT true,
    is_global BOOLEAN DEFAULT false,
    
    -- Trim strategy
    trim_strategy VARCHAR(50) NOT NULL CHECK (trim_strategy IN ('percentage', 'fixed_amount', 'profit_target', 'time_based', 'volatility_based', 'trailing_stop')),
    
    -- Trigger conditions
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    
    -- Trim parameters
    trim_percentage DECIMAL(5,2) CHECK (trim_percentage > 0 AND trim_percentage <= 100),
    trim_amount DECIMAL(15,2) CHECK (trim_amount > 0),
    max_trim_count INTEGER DEFAULT 0, -- 0 = unlimited
    
    -- Timing settings
    min_hold_period INTEGER DEFAULT 0, -- in minutes
    max_hold_period INTEGER DEFAULT 0, -- in minutes, 0 = unlimited
    
    -- Risk management
    stop_loss_percentage DECIMAL(5,2),
    take_profit_percentage DECIMAL(5,2),
    
    -- Advanced settings
    volatility_threshold DECIMAL(8,4),
    volume_threshold INTEGER,
    
    -- Asset filters
    asset_filters JSONB DEFAULT '{}',
    
    -- Schedule settings
    schedule_enabled BOOLEAN DEFAULT false,
    schedule_config JSONB,
    
    -- Performance tracking
    usage_count INTEGER DEFAULT 0,
    total_profit DECIMAL(15,2) DEFAULT 0,
    total_loss DECIMAL(15,2) DEFAULT 0,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Asset-specific trim settings
CREATE TABLE asset_trim_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    configuration_id UUID NOT NULL REFERENCES auto_trim_configurations(id) ON DELETE CASCADE,
    
    -- Asset identification
    asset_symbol VARCHAR(20) NOT NULL,
    asset_type VARCHAR(50) DEFAULT 'stock' CHECK (asset_type IN ('stock', 'etf', 'crypto', 'forex', 'commodity', 'bond')),
    
    -- Override settings
    override_global BOOLEAN DEFAULT false,
    
    -- Asset-specific parameters
    custom_trim_percentage DECIMAL(5,2),
    custom_trigger_conditions JSONB,
    
    -- Asset-specific risk settings
    position_size_limit DECIMAL(15,2),
    max_position_percentage DECIMAL(5,2),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Performance tracking
    trim_count INTEGER DEFAULT 0,
    total_trimmed_amount DECIMAL(15,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, configuration_id, asset_symbol)
);

-- Trim execution log
CREATE TABLE trim_execution_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    configuration_id UUID NOT NULL REFERENCES auto_trim_configurations(id) ON DELETE CASCADE,
    asset_setting_id UUID REFERENCES asset_trim_settings(id) ON DELETE SET NULL,
    
    -- Execution details
    asset_symbol VARCHAR(20) NOT NULL,
    execution_type VARCHAR(50) NOT NULL CHECK (execution_type IN ('automatic', 'manual', 'scheduled', 'forced')),
    
    -- Position details before trim
    original_position_size DECIMAL(15,8) NOT NULL,
    original_position_value DECIMAL(15,2) NOT NULL,
    original_avg_price DECIMAL(15,8) NOT NULL,
    
    -- Trim execution
    trim_percentage DECIMAL(5,2) NOT NULL,
    trim_amount DECIMAL(15,8) NOT NULL,
    trim_value DECIMAL(15,2) NOT NULL,
    execution_price DECIMAL(15,8) NOT NULL,
    
    -- Position details after trim
    remaining_position_size DECIMAL(15,8) NOT NULL,
    remaining_position_value DECIMAL(15,2) NOT NULL,
    
    -- Financial impact
    realized_profit_loss DECIMAL(15,2) NOT NULL,
    fees_paid DECIMAL(10,2) DEFAULT 0,
    
    -- Execution context
    trigger_reason TEXT,
    market_conditions JSONB DEFAULT '{}',
    
    -- Execution status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'cancelled')),
    execution_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Broker details
    broker_order_id VARCHAR(100),
    broker_execution_id VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trim performance analytics
CREATE TABLE trim_performance_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    configuration_id UUID NOT NULL REFERENCES auto_trim_configurations(id) ON DELETE CASCADE,
    
    -- Analysis period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Execution statistics
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    
    -- Financial performance
    total_profit DECIMAL(15,2) DEFAULT 0,
    total_loss DECIMAL(15,2) DEFAULT 0,
    net_profit_loss DECIMAL(15,2) DEFAULT 0,
    
    -- Position metrics
    avg_trim_percentage DECIMAL(5,2) DEFAULT 0,
    total_volume_trimmed DECIMAL(15,2) DEFAULT 0,
    
    -- Timing metrics
    avg_execution_time INTEGER DEFAULT 0, -- in seconds
    avg_hold_time_before_trim INTEGER DEFAULT 0, -- in minutes
    
    -- Risk metrics
    max_single_loss DECIMAL(15,2) DEFAULT 0,
    max_single_gain DECIMAL(15,2) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Market correlation
    market_correlation DECIMAL(5,4),
    volatility_correlation DECIMAL(5,4),
    
    -- Additional metrics
    metrics JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, configuration_id, period_start, period_end)
);

-- Trim rule violations
CREATE TABLE trim_rule_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    configuration_id UUID NOT NULL REFERENCES auto_trim_configurations(id) ON DELETE CASCADE,
    
    -- Violation details
    violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN ('min_hold_period', 'max_trim_count', 'insufficient_volume', 'market_hours', 'position_size', 'risk_limit')),
    description TEXT NOT NULL,
    
    -- Context
    asset_symbol VARCHAR(20) NOT NULL,
    attempted_trim_percentage DECIMAL(5,2),
    attempted_trim_amount DECIMAL(15,8),
    
    -- Violation data
    violation_data JSONB DEFAULT '{}',
    
    -- Resolution
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_action VARCHAR(50),
    resolution_notes TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trim backtesting results
CREATE TABLE trim_backtesting_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    configuration_id UUID NOT NULL REFERENCES auto_trim_configurations(id) ON DELETE CASCADE,
    
    -- Backtest configuration
    backtest_name VARCHAR(100) NOT NULL,
    backtest_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    backtest_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Test parameters
    initial_capital DECIMAL(15,2) NOT NULL,
    assets_tested JSONB NOT NULL DEFAULT '[]',
    
    -- Results
    final_capital DECIMAL(15,2) NOT NULL,
    total_return DECIMAL(8,4) NOT NULL,
    annualized_return DECIMAL(8,4) NOT NULL,
    
    -- Performance metrics
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Risk metrics
    max_drawdown DECIMAL(8,4) DEFAULT 0,
    volatility DECIMAL(8,4) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0,
    
    -- Benchmark comparison
    benchmark_return DECIMAL(8,4),
    excess_return DECIMAL(8,4),
    
    -- Detailed results
    trade_log JSONB DEFAULT '[]',
    daily_returns JSONB DEFAULT '[]',
    
    -- Backtest metadata
    backtest_status VARCHAR(20) DEFAULT 'completed' CHECK (backtest_status IN ('running', 'completed', 'failed')),
    computation_time INTEGER, -- in seconds
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trim notifications
CREATE TABLE trim_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    configuration_id UUID REFERENCES auto_trim_configurations(id) ON DELETE CASCADE,
    
    -- Notification details
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('execution_success', 'execution_failure', 'rule_violation', 'performance_alert', 'system_alert')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Severity and priority
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    
    -- Delivery settings
    delivery_channels JSONB DEFAULT '["in_app"]',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'dismissed')),
    
    -- Delivery tracking
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    
    -- Context data
    context_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_auto_trim_configurations_user_id ON auto_trim_configurations(user_id);
CREATE INDEX idx_auto_trim_configurations_is_active ON auto_trim_configurations(is_active);
CREATE INDEX idx_asset_trim_settings_user_id ON asset_trim_settings(user_id);
CREATE INDEX idx_asset_trim_settings_configuration_id ON asset_trim_settings(configuration_id);
CREATE INDEX idx_asset_trim_settings_asset_symbol ON asset_trim_settings(asset_symbol);
CREATE INDEX idx_trim_execution_log_user_id ON trim_execution_log(user_id);
CREATE INDEX idx_trim_execution_log_configuration_id ON trim_execution_log(configuration_id);
CREATE INDEX idx_trim_execution_log_asset_symbol ON trim_execution_log(asset_symbol);
CREATE INDEX idx_trim_execution_log_execution_time ON trim_execution_log(execution_time);
CREATE INDEX idx_trim_performance_analytics_user_id ON trim_performance_analytics(user_id);
CREATE INDEX idx_trim_performance_analytics_configuration_id ON trim_performance_analytics(configuration_id);
CREATE INDEX idx_trim_performance_analytics_period ON trim_performance_analytics(period_start, period_end);
CREATE INDEX idx_trim_rule_violations_user_id ON trim_rule_violations(user_id);
CREATE INDEX idx_trim_rule_violations_configuration_id ON trim_rule_violations(configuration_id);
CREATE INDEX idx_trim_rule_violations_status ON trim_rule_violations(status);
CREATE INDEX idx_trim_backtesting_results_user_id ON trim_backtesting_results(user_id);
CREATE INDEX idx_trim_backtesting_results_configuration_id ON trim_backtesting_results(configuration_id);
CREATE INDEX idx_trim_notifications_user_id ON trim_notifications(user_id);
CREATE INDEX idx_trim_notifications_status ON trim_notifications(status);
CREATE INDEX idx_trim_notifications_created_at ON trim_notifications(created_at);

-- RLS Policies
ALTER TABLE auto_trim_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_trim_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trim_execution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE trim_performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trim_rule_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trim_backtesting_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE trim_notifications ENABLE ROW LEVEL SECURITY;

-- Users can manage their own data
CREATE POLICY "Users can manage own configurations" ON auto_trim_configurations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own asset settings" ON asset_trim_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own execution log" ON trim_execution_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own performance analytics" ON trim_performance_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own rule violations" ON trim_rule_violations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own backtesting results" ON trim_backtesting_results
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notifications" ON trim_notifications
    FOR ALL USING (auth.uid() = user_id);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_auto_trim_configurations_updated_at BEFORE UPDATE ON auto_trim_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_trim_settings_updated_at BEFORE UPDATE ON asset_trim_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trim_execution_log_updated_at BEFORE UPDATE ON trim_execution_log FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trim_rule_violations_updated_at BEFORE UPDATE ON trim_rule_violations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trim_backtesting_results_updated_at BEFORE UPDATE ON trim_backtesting_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trim_notifications_updated_at BEFORE UPDATE ON trim_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update configuration performance metrics
CREATE OR REPLACE FUNCTION update_configuration_performance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'executed' THEN
        UPDATE auto_trim_configurations 
        SET 
            usage_count = usage_count + 1,
            total_profit = total_profit + CASE WHEN NEW.realized_profit_loss > 0 THEN NEW.realized_profit_loss ELSE 0 END,
            total_loss = total_loss + CASE WHEN NEW.realized_profit_loss < 0 THEN ABS(NEW.realized_profit_loss) ELSE 0 END
        WHERE id = NEW.configuration_id;
        
        UPDATE asset_trim_settings 
        SET 
            trim_count = trim_count + 1,
            total_trimmed_amount = total_trimmed_amount + NEW.trim_value
        WHERE id = NEW.asset_setting_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for performance updates
CREATE TRIGGER update_configuration_performance_trigger
    AFTER INSERT OR UPDATE ON trim_execution_log
    FOR EACH ROW EXECUTE FUNCTION update_configuration_performance();

-- Function to validate trim parameters
CREATE OR REPLACE FUNCTION validate_trim_parameters()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate trim percentage
    IF NEW.trim_percentage IS NOT NULL AND (NEW.trim_percentage <= 0 OR NEW.trim_percentage > 100) THEN
        RAISE EXCEPTION 'Trim percentage must be between 0 and 100';
    END IF;
    
    -- Validate trim amount
    IF NEW.trim_amount IS NOT NULL AND NEW.trim_amount <= 0 THEN
        RAISE EXCEPTION 'Trim amount must be positive';
    END IF;
    
    -- Validate hold periods
    IF NEW.min_hold_period IS NOT NULL AND NEW.max_hold_period IS NOT NULL 
       AND NEW.min_hold_period > NEW.max_hold_period THEN
        RAISE EXCEPTION 'Minimum hold period cannot be greater than maximum hold period';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for parameter validation
CREATE TRIGGER validate_trim_parameters_trigger
    BEFORE INSERT OR UPDATE ON auto_trim_configurations
    FOR EACH ROW EXECUTE FUNCTION validate_trim_parameters(); 