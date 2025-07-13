-- Block 17: Performance Analytics Panel - Database Schema
-- Comprehensive performance analytics and metrics tracking system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Portfolio Performance History Table
CREATE TABLE IF NOT EXISTS portfolio_performance_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Time tracking
    date DATE NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Portfolio values
    total_value DECIMAL(15,2) NOT NULL,
    equity_value DECIMAL(15,2) DEFAULT 0,
    crypto_value DECIMAL(15,2) DEFAULT 0,
    cash_value DECIMAL(15,2) DEFAULT 0,
    debt_value DECIMAL(15,2) DEFAULT 0,
    
    -- Daily changes
    daily_change DECIMAL(15,2) DEFAULT 0,
    daily_change_pct DECIMAL(8,4) DEFAULT 0,
    
    -- Cumulative performance
    total_return DECIMAL(8,4) DEFAULT 0, -- Total return as decimal (0.1 = 10%)
    annualized_return DECIMAL(8,4) DEFAULT 0,
    
    -- Risk metrics
    volatility DECIMAL(8,4) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0,
    sortino_ratio DECIMAL(8,4) DEFAULT 0,
    max_drawdown DECIMAL(8,4) DEFAULT 0,
    
    -- Beta and alpha
    beta DECIMAL(8,4) DEFAULT 0,
    alpha DECIMAL(8,4) DEFAULT 0,
    
    -- Benchmark comparison
    benchmark_value DECIMAL(15,2),
    benchmark_return DECIMAL(8,4),
    excess_return DECIMAL(8,4),
    tracking_error DECIMAL(8,4),
    information_ratio DECIMAL(8,4),
    
    -- Asset allocation
    allocation_data JSONB DEFAULT '{}',
    sector_allocation JSONB DEFAULT '{}',
    geographic_allocation JSONB DEFAULT '{}',
    
    -- Additional metrics
    value_at_risk DECIMAL(8,4) DEFAULT 0, -- 95% VaR
    conditional_var DECIMAL(8,4) DEFAULT 0, -- Expected shortfall
    
    -- Metadata
    data_source TEXT DEFAULT 'system',
    calculation_method TEXT DEFAULT 'standard',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- Trading Performance Metrics Table
CREATE TABLE IF NOT EXISTS trading_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type TEXT DEFAULT 'daily' CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    
    -- Trading statistics
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
    
    -- P&L metrics
    total_pnl DECIMAL(15,2) DEFAULT 0,
    realized_pnl DECIMAL(15,2) DEFAULT 0,
    unrealized_pnl DECIMAL(15,2) DEFAULT 0,
    
    -- Win/Loss analysis
    average_win DECIMAL(15,2) DEFAULT 0,
    average_loss DECIMAL(15,2) DEFAULT 0,
    largest_win DECIMAL(15,2) DEFAULT 0,
    largest_loss DECIMAL(15,2) DEFAULT 0,
    profit_factor DECIMAL(8,4) DEFAULT 0, -- Gross profit / Gross loss
    
    -- Risk metrics
    maximum_drawdown DECIMAL(8,4) DEFAULT 0,
    maximum_runup DECIMAL(8,4) DEFAULT 0,
    calmar_ratio DECIMAL(8,4) DEFAULT 0,
    
    -- Efficiency metrics
    average_trade_duration DECIMAL(8,2) DEFAULT 0, -- Days
    trade_frequency DECIMAL(8,2) DEFAULT 0, -- Trades per day
    capital_utilization DECIMAL(5,2) DEFAULT 0, -- Percentage
    
    -- Asset class breakdown
    equity_trades INTEGER DEFAULT 0,
    crypto_trades INTEGER DEFAULT 0,
    options_trades INTEGER DEFAULT 0,
    futures_trades INTEGER DEFAULT 0,
    
    -- Strategy performance
    strategy_breakdown JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, period_start, period_end, period_type)
);

-- Risk Analytics Table
CREATE TABLE IF NOT EXISTS risk_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Time reference
    analysis_date DATE DEFAULT CURRENT_DATE,
    
    -- Portfolio risk measures
    portfolio_variance DECIMAL(12,8) DEFAULT 0,
    portfolio_volatility DECIMAL(8,4) DEFAULT 0,
    portfolio_beta DECIMAL(8,4) DEFAULT 0,
    
    -- Value at Risk (VaR)
    var_1day_95 DECIMAL(8,4) DEFAULT 0,
    var_1day_99 DECIMAL(8,4) DEFAULT 0,
    var_5day_95 DECIMAL(8,4) DEFAULT 0,
    var_30day_95 DECIMAL(8,4) DEFAULT 0,
    
    -- Expected Shortfall (Conditional VaR)
    cvar_1day_95 DECIMAL(8,4) DEFAULT 0,
    cvar_1day_99 DECIMAL(8,4) DEFAULT 0,
    
    -- Stress testing
    stress_test_scenarios JSONB DEFAULT '[]',
    
    -- Correlation matrix
    correlation_matrix JSONB DEFAULT '{}',
    
    -- Concentration risk
    largest_position_pct DECIMAL(5,2) DEFAULT 0,
    top_5_positions_pct DECIMAL(5,2) DEFAULT 0,
    top_10_positions_pct DECIMAL(5,2) DEFAULT 0,
    herfindahl_index DECIMAL(8,4) DEFAULT 0, -- Concentration measure
    
    -- Sector/Geographic exposure
    sector_concentrations JSONB DEFAULT '{}',
    geographic_concentrations JSONB DEFAULT '{}',
    currency_exposures JSONB DEFAULT '{}',
    
    -- Risk-adjusted returns
    risk_adjusted_return DECIMAL(8,4) DEFAULT 0,
    excess_return_volatility DECIMAL(8,4) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, analysis_date)
);

-- Performance Attribution Table
CREATE TABLE IF NOT EXISTS performance_attribution (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Attribution period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Total return breakdown
    total_return DECIMAL(8,4) NOT NULL,
    asset_allocation_effect DECIMAL(8,4) DEFAULT 0,
    stock_selection_effect DECIMAL(8,4) DEFAULT 0,
    interaction_effect DECIMAL(8,4) DEFAULT 0,
    
    -- Sector attribution
    sector_attribution JSONB DEFAULT '{}',
    
    -- Asset class attribution
    equity_contribution DECIMAL(8,4) DEFAULT 0,
    crypto_contribution DECIMAL(8,4) DEFAULT 0,
    cash_contribution DECIMAL(8,4) DEFAULT 0,
    
    -- Individual asset contributions
    top_contributors JSONB DEFAULT '[]',
    worst_contributors JSONB DEFAULT '[]',
    
    -- Factor attribution
    factor_exposures JSONB DEFAULT '{}',
    factor_returns JSONB DEFAULT '{}',
    
    -- Currency attribution (for international portfolios)
    currency_effect DECIMAL(8,4) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, period_start, period_end)
);

-- Benchmark Comparison Table
CREATE TABLE IF NOT EXISTS benchmark_comparisons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Benchmark info
    benchmark_name TEXT NOT NULL,
    benchmark_symbol TEXT NOT NULL,
    benchmark_type TEXT DEFAULT 'index' CHECK (benchmark_type IN ('index', 'etf', 'custom')),
    
    -- Time period
    comparison_date DATE NOT NULL,
    
    -- Performance comparison
    portfolio_return DECIMAL(8,4) NOT NULL,
    benchmark_return DECIMAL(8,4) NOT NULL,
    excess_return DECIMAL(8,4) NOT NULL,
    
    -- Risk comparison
    portfolio_volatility DECIMAL(8,4) DEFAULT 0,
    benchmark_volatility DECIMAL(8,4) DEFAULT 0,
    tracking_error DECIMAL(8,4) DEFAULT 0,
    
    -- Risk-adjusted metrics
    portfolio_sharpe DECIMAL(8,4) DEFAULT 0,
    benchmark_sharpe DECIMAL(8,4) DEFAULT 0,
    information_ratio DECIMAL(8,4) DEFAULT 0,
    
    -- Up/Down capture
    up_capture_ratio DECIMAL(8,4) DEFAULT 0,
    down_capture_ratio DECIMAL(8,4) DEFAULT 0,
    
    -- Correlation
    correlation DECIMAL(8,4) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, benchmark_symbol, comparison_date)
);

-- Performance Analytics Settings Table
CREATE TABLE IF NOT EXISTS performance_analytics_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Calculation preferences
    risk_free_rate DECIMAL(6,4) DEFAULT 0.02, -- 2% default
    benchmark_symbol TEXT DEFAULT 'SPY',
    calculation_frequency TEXT DEFAULT 'daily' CHECK (calculation_frequency IN ('daily', 'weekly', 'monthly')),
    
    -- Display preferences
    default_timeframe TEXT DEFAULT '1y',
    show_benchmark BOOLEAN DEFAULT true,
    show_drawdown BOOLEAN DEFAULT true,
    show_rolling_metrics BOOLEAN DEFAULT false,
    
    -- Alert thresholds
    drawdown_alert_threshold DECIMAL(5,2) DEFAULT 10.0, -- Alert at 10% drawdown
    volatility_alert_threshold DECIMAL(5,2) DEFAULT 25.0, -- Alert at 25% volatility
    
    -- Reporting preferences
    include_unrealized_pnl BOOLEAN DEFAULT true,
    consolidate_currency BOOLEAN DEFAULT true,
    base_currency TEXT DEFAULT 'USD',
    
    -- Advanced settings
    var_confidence_level DECIMAL(4,2) DEFAULT 95.0,
    holding_period_var INTEGER DEFAULT 1, -- Days
    monte_carlo_simulations INTEGER DEFAULT 10000,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Performance Reports Table
CREATE TABLE IF NOT EXISTS performance_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Report metadata
    report_name TEXT NOT NULL,
    report_type TEXT DEFAULT 'standard' CHECK (report_type IN ('standard', 'risk', 'attribution', 'benchmark')),
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    
    -- Report data
    report_data JSONB NOT NULL,
    
    -- Report settings
    include_charts BOOLEAN DEFAULT true,
    include_raw_data BOOLEAN DEFAULT false,
    format TEXT DEFAULT 'pdf' CHECK (format IN ('pdf', 'html', 'json', 'csv')),
    
    -- Generation info
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by TEXT DEFAULT 'system',
    
    -- Access control
    is_shared BOOLEAN DEFAULT false,
    shared_with JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE portfolio_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analytics_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reports ENABLE ROW LEVEL SECURITY;

-- Users can only access their own performance data
CREATE POLICY "Users can manage own portfolio performance" ON portfolio_performance_history
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trading metrics" ON trading_performance_metrics
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own risk analytics" ON risk_analytics
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own performance attribution" ON performance_attribution
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own benchmark comparisons" ON benchmark_comparisons
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own analytics settings" ON performance_analytics_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own performance reports" ON performance_reports
    FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_portfolio_performance_history_user_date ON portfolio_performance_history(user_id, date DESC);
CREATE INDEX idx_portfolio_performance_history_timestamp ON portfolio_performance_history(timestamp DESC);

CREATE INDEX idx_trading_performance_metrics_user_period ON trading_performance_metrics(user_id, period_start DESC, period_end DESC);
CREATE INDEX idx_trading_performance_metrics_period_type ON trading_performance_metrics(period_type, period_start DESC);

CREATE INDEX idx_risk_analytics_user_date ON risk_analytics(user_id, analysis_date DESC);

CREATE INDEX idx_performance_attribution_user_period ON performance_attribution(user_id, period_start DESC, period_end DESC);

CREATE INDEX idx_benchmark_comparisons_user_symbol_date ON benchmark_comparisons(user_id, benchmark_symbol, comparison_date DESC);

CREATE INDEX idx_performance_analytics_settings_user ON performance_analytics_settings(user_id);

CREATE INDEX idx_performance_reports_user_type ON performance_reports(user_id, report_type, generated_at DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_trading_performance_metrics_updated_at
    BEFORE UPDATE ON trading_performance_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_analytics_settings_updated_at
    BEFORE UPDATE ON performance_analytics_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Performance calculation functions
CREATE OR REPLACE FUNCTION calculate_portfolio_performance(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_return DECIMAL(8,4),
    annualized_return DECIMAL(8,4),
    volatility DECIMAL(8,4),
    sharpe_ratio DECIMAL(8,4),
    max_drawdown DECIMAL(8,4),
    win_rate DECIMAL(5,2)
) AS $$
DECLARE
    performance_data RECORD;
    daily_returns DECIMAL(8,4)[];
    risk_free_rate DECIMAL(6,4) := 0.02;
    trading_days INTEGER;
    avg_return DECIMAL(8,4);
    return_variance DECIMAL(12,8);
    return_volatility DECIMAL(8,4);
    max_dd DECIMAL(8,4) := 0;
    running_max DECIMAL(15,2);
    current_dd DECIMAL(8,4);
BEGIN
    -- Get user's risk-free rate setting
    SELECT COALESCE(pas.risk_free_rate, 0.02) INTO risk_free_rate
    FROM performance_analytics_settings pas
    WHERE pas.user_id = p_user_id;
    
    -- Calculate basic performance metrics
    SELECT 
        COALESCE(
            (pph_end.total_value / pph_start.total_value) - 1, 
            0
        ) as total_ret,
        COUNT(*) as trading_days_count
    INTO performance_data
    FROM portfolio_performance_history pph_start
    CROSS JOIN portfolio_performance_history pph_end
    WHERE pph_start.user_id = p_user_id 
    AND pph_start.date = p_start_date
    AND pph_end.user_id = p_user_id 
    AND pph_end.date = p_end_date;
    
    trading_days := COALESCE(performance_data.trading_days_count, 1);
    
    -- Calculate annualized return
    IF trading_days > 0 THEN
        total_return := COALESCE(performance_data.total_ret, 0);
        annualized_return := POWER(1 + total_return, 365.0 / trading_days) - 1;
    ELSE
        total_return := 0;
        annualized_return := 0;
    END IF;
    
    -- Get daily returns for volatility calculation
    SELECT array_agg(daily_change_pct ORDER BY date)
    INTO daily_returns
    FROM portfolio_performance_history
    WHERE user_id = p_user_id
    AND date BETWEEN p_start_date AND p_end_date
    AND daily_change_pct IS NOT NULL;
    
    -- Calculate volatility
    IF array_length(daily_returns, 1) > 1 THEN
        SELECT AVG(value) INTO avg_return
        FROM unnest(daily_returns) as value;
        
        SELECT AVG(POWER(value - avg_return, 2)) INTO return_variance
        FROM unnest(daily_returns) as value;
        
        return_volatility := SQRT(return_variance) * SQRT(252); -- Annualized
        volatility := return_volatility;
        
        -- Calculate Sharpe ratio
        IF return_volatility > 0 THEN
            sharpe_ratio := (annualized_return - risk_free_rate) / return_volatility;
        ELSE
            sharpe_ratio := 0;
        END IF;
    ELSE
        volatility := 0;
        sharpe_ratio := 0;
    END IF;
    
    -- Calculate maximum drawdown
    running_max := 0;
    max_dd := 0;
    
    FOR performance_data IN
        SELECT total_value, date
        FROM portfolio_performance_history
        WHERE user_id = p_user_id
        AND date BETWEEN p_start_date AND p_end_date
        ORDER BY date
    LOOP
        running_max := GREATEST(running_max, performance_data.total_value);
        
        IF running_max > 0 THEN
            current_dd := (running_max - performance_data.total_value) / running_max;
            max_dd := GREATEST(max_dd, current_dd);
        END IF;
    END LOOP;
    
    max_drawdown := max_dd;
    
    -- Calculate win rate from trading metrics
    SELECT COALESCE(
        CASE 
            WHEN SUM(total_trades) > 0 THEN 
                SUM(winning_trades) * 100.0 / SUM(total_trades)
            ELSE 0 
        END, 
        0
    ) INTO win_rate
    FROM trading_performance_metrics
    WHERE user_id = p_user_id
    AND period_start >= p_start_date
    AND period_end <= p_end_date;
    
    RETURN QUERY SELECT 
        total_return,
        annualized_return,
        volatility,
        sharpe_ratio,
        max_drawdown,
        win_rate;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_portfolio_performance(
    p_user_id UUID,
    p_date DATE,
    p_total_value DECIMAL(15,2),
    p_equity_value DECIMAL(15,2) DEFAULT NULL,
    p_crypto_value DECIMAL(15,2) DEFAULT NULL,
    p_cash_value DECIMAL(15,2) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    prev_value DECIMAL(15,2);
    daily_change_val DECIMAL(15,2);
    daily_change_pct_val DECIMAL(8,4);
BEGIN
    -- Get previous day's value
    SELECT total_value INTO prev_value
    FROM portfolio_performance_history
    WHERE user_id = p_user_id
    AND date < p_date
    ORDER BY date DESC
    LIMIT 1;
    
    -- Calculate daily change
    IF prev_value IS NOT NULL AND prev_value > 0 THEN
        daily_change_val := p_total_value - prev_value;
        daily_change_pct_val := daily_change_val / prev_value;
    ELSE
        daily_change_val := 0;
        daily_change_pct_val := 0;
    END IF;
    
    -- Insert or update performance record
    INSERT INTO portfolio_performance_history (
        user_id, date, total_value, equity_value, crypto_value, cash_value,
        daily_change, daily_change_pct
    )
    VALUES (
        p_user_id, p_date, p_total_value, p_equity_value, p_crypto_value, p_cash_value,
        daily_change_val, daily_change_pct_val
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        total_value = EXCLUDED.total_value,
        equity_value = EXCLUDED.equity_value,
        crypto_value = EXCLUDED.crypto_value,
        cash_value = EXCLUDED.cash_value,
        daily_change = EXCLUDED.daily_change,
        daily_change_pct = EXCLUDED.daily_change_pct,
        timestamp = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_performance_report(
    p_user_id UUID,
    p_report_type TEXT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS UUID AS $$
DECLARE
    report_id UUID;
    report_data JSONB;
    performance_metrics RECORD;
    trading_metrics RECORD;
    risk_metrics RECORD;
BEGIN
    -- Calculate performance metrics
    SELECT * INTO performance_metrics
    FROM calculate_portfolio_performance(p_user_id, p_start_date, p_end_date);
    
    -- Get trading metrics
    SELECT 
        SUM(total_trades) as total_trades,
        SUM(winning_trades) as winning_trades,
        SUM(losing_trades) as losing_trades,
        AVG(win_rate) as avg_win_rate,
        SUM(total_pnl) as total_pnl
    INTO trading_metrics
    FROM trading_performance_metrics
    WHERE user_id = p_user_id
    AND period_start >= p_start_date
    AND period_end <= p_end_date;
    
    -- Get latest risk metrics
    SELECT * INTO risk_metrics
    FROM risk_analytics
    WHERE user_id = p_user_id
    AND analysis_date <= p_end_date
    ORDER BY analysis_date DESC
    LIMIT 1;
    
    -- Build report data
    report_data := jsonb_build_object(
        'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'performance', jsonb_build_object(
            'total_return', performance_metrics.total_return,
            'annualized_return', performance_metrics.annualized_return,
            'volatility', performance_metrics.volatility,
            'sharpe_ratio', performance_metrics.sharpe_ratio,
            'max_drawdown', performance_metrics.max_drawdown
        ),
        'trading', jsonb_build_object(
            'total_trades', COALESCE(trading_metrics.total_trades, 0),
            'win_rate', COALESCE(trading_metrics.avg_win_rate, 0),
            'total_pnl', COALESCE(trading_metrics.total_pnl, 0)
        ),
        'risk', jsonb_build_object(
            'var_95', COALESCE(risk_metrics.var_1day_95, 0),
            'portfolio_beta', COALESCE(risk_metrics.portfolio_beta, 0)
        ),
        'generated_at', NOW()
    );
    
    -- Create report record
    INSERT INTO performance_reports (
        user_id, report_name, report_type,
        report_period_start, report_period_end,
        report_data
    )
    VALUES (
        p_user_id,
        p_report_type || ' Report ' || p_start_date || ' to ' || p_end_date,
        p_report_type,
        p_start_date,
        p_end_date,
        report_data
    )
    RETURNING id INTO report_id;
    
    RETURN report_id;
END;
$$ LANGUAGE plpgsql; 
-- Comprehensive performance analytics and metrics tracking system

-- Enable RLS
ALTER DATABASE postgres SET row_level_security = on;

-- Portfolio Performance History Table
CREATE TABLE IF NOT EXISTS portfolio_performance_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Time tracking
    date DATE NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Portfolio values
    total_value DECIMAL(15,2) NOT NULL,
    equity_value DECIMAL(15,2) DEFAULT 0,
    crypto_value DECIMAL(15,2) DEFAULT 0,
    cash_value DECIMAL(15,2) DEFAULT 0,
    debt_value DECIMAL(15,2) DEFAULT 0,
    
    -- Daily changes
    daily_change DECIMAL(15,2) DEFAULT 0,
    daily_change_pct DECIMAL(8,4) DEFAULT 0,
    
    -- Cumulative performance
    total_return DECIMAL(8,4) DEFAULT 0, -- Total return as decimal (0.1 = 10%)
    annualized_return DECIMAL(8,4) DEFAULT 0,
    
    -- Risk metrics
    volatility DECIMAL(8,4) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0,
    sortino_ratio DECIMAL(8,4) DEFAULT 0,
    max_drawdown DECIMAL(8,4) DEFAULT 0,
    
    -- Beta and alpha
    beta DECIMAL(8,4) DEFAULT 0,
    alpha DECIMAL(8,4) DEFAULT 0,
    
    -- Benchmark comparison
    benchmark_value DECIMAL(15,2),
    benchmark_return DECIMAL(8,4),
    excess_return DECIMAL(8,4),
    tracking_error DECIMAL(8,4),
    information_ratio DECIMAL(8,4),
    
    -- Asset allocation
    allocation_data JSONB DEFAULT '{}',
    sector_allocation JSONB DEFAULT '{}',
    geographic_allocation JSONB DEFAULT '{}',
    
    -- Additional metrics
    value_at_risk DECIMAL(8,4) DEFAULT 0, -- 95% VaR
    conditional_var DECIMAL(8,4) DEFAULT 0, -- Expected shortfall
    
    -- Metadata
    data_source TEXT DEFAULT 'system',
    calculation_method TEXT DEFAULT 'standard',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- Trading Performance Metrics Table
CREATE TABLE IF NOT EXISTS trading_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type TEXT DEFAULT 'daily' CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    
    -- Trading statistics
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
    
    -- P&L metrics
    total_pnl DECIMAL(15,2) DEFAULT 0,
    realized_pnl DECIMAL(15,2) DEFAULT 0,
    unrealized_pnl DECIMAL(15,2) DEFAULT 0,
    
    -- Win/Loss analysis
    average_win DECIMAL(15,2) DEFAULT 0,
    average_loss DECIMAL(15,2) DEFAULT 0,
    largest_win DECIMAL(15,2) DEFAULT 0,
    largest_loss DECIMAL(15,2) DEFAULT 0,
    profit_factor DECIMAL(8,4) DEFAULT 0, -- Gross profit / Gross loss
    
    -- Risk metrics
    maximum_drawdown DECIMAL(8,4) DEFAULT 0,
    maximum_runup DECIMAL(8,4) DEFAULT 0,
    calmar_ratio DECIMAL(8,4) DEFAULT 0,
    
    -- Efficiency metrics
    average_trade_duration DECIMAL(8,2) DEFAULT 0, -- Days
    trade_frequency DECIMAL(8,2) DEFAULT 0, -- Trades per day
    capital_utilization DECIMAL(5,2) DEFAULT 0, -- Percentage
    
    -- Asset class breakdown
    equity_trades INTEGER DEFAULT 0,
    crypto_trades INTEGER DEFAULT 0,
    options_trades INTEGER DEFAULT 0,
    futures_trades INTEGER DEFAULT 0,
    
    -- Strategy performance
    strategy_breakdown JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, period_start, period_end, period_type)
);

-- Risk Analytics Table
CREATE TABLE IF NOT EXISTS risk_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Time reference
    analysis_date DATE DEFAULT CURRENT_DATE,
    
    -- Portfolio risk measures
    portfolio_variance DECIMAL(12,8) DEFAULT 0,
    portfolio_volatility DECIMAL(8,4) DEFAULT 0,
    portfolio_beta DECIMAL(8,4) DEFAULT 0,
    
    -- Value at Risk (VaR)
    var_1day_95 DECIMAL(8,4) DEFAULT 0,
    var_1day_99 DECIMAL(8,4) DEFAULT 0,
    var_5day_95 DECIMAL(8,4) DEFAULT 0,
    var_30day_95 DECIMAL(8,4) DEFAULT 0,
    
    -- Expected Shortfall (Conditional VaR)
    cvar_1day_95 DECIMAL(8,4) DEFAULT 0,
    cvar_1day_99 DECIMAL(8,4) DEFAULT 0,
    
    -- Stress testing
    stress_test_scenarios JSONB DEFAULT '[]',
    
    -- Correlation matrix
    correlation_matrix JSONB DEFAULT '{}',
    
    -- Concentration risk
    largest_position_pct DECIMAL(5,2) DEFAULT 0,
    top_5_positions_pct DECIMAL(5,2) DEFAULT 0,
    top_10_positions_pct DECIMAL(5,2) DEFAULT 0,
    herfindahl_index DECIMAL(8,4) DEFAULT 0, -- Concentration measure
    
    -- Sector/Geographic exposure
    sector_concentrations JSONB DEFAULT '{}',
    geographic_concentrations JSONB DEFAULT '{}',
    currency_exposures JSONB DEFAULT '{}',
    
    -- Risk-adjusted returns
    risk_adjusted_return DECIMAL(8,4) DEFAULT 0,
    excess_return_volatility DECIMAL(8,4) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, analysis_date)
);

-- Performance Attribution Table
CREATE TABLE IF NOT EXISTS performance_attribution (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Attribution period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Total return breakdown
    total_return DECIMAL(8,4) NOT NULL,
    asset_allocation_effect DECIMAL(8,4) DEFAULT 0,
    stock_selection_effect DECIMAL(8,4) DEFAULT 0,
    interaction_effect DECIMAL(8,4) DEFAULT 0,
    
    -- Sector attribution
    sector_attribution JSONB DEFAULT '{}',
    
    -- Asset class attribution
    equity_contribution DECIMAL(8,4) DEFAULT 0,
    crypto_contribution DECIMAL(8,4) DEFAULT 0,
    cash_contribution DECIMAL(8,4) DEFAULT 0,
    
    -- Individual asset contributions
    top_contributors JSONB DEFAULT '[]',
    worst_contributors JSONB DEFAULT '[]',
    
    -- Factor attribution
    factor_exposures JSONB DEFAULT '{}',
    factor_returns JSONB DEFAULT '{}',
    
    -- Currency attribution (for international portfolios)
    currency_effect DECIMAL(8,4) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, period_start, period_end)
);

-- Benchmark Comparison Table
CREATE TABLE IF NOT EXISTS benchmark_comparisons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Benchmark info
    benchmark_name TEXT NOT NULL,
    benchmark_symbol TEXT NOT NULL,
    benchmark_type TEXT DEFAULT 'index' CHECK (benchmark_type IN ('index', 'etf', 'custom')),
    
    -- Time period
    comparison_date DATE NOT NULL,
    
    -- Performance comparison
    portfolio_return DECIMAL(8,4) NOT NULL,
    benchmark_return DECIMAL(8,4) NOT NULL,
    excess_return DECIMAL(8,4) NOT NULL,
    
    -- Risk comparison
    portfolio_volatility DECIMAL(8,4) DEFAULT 0,
    benchmark_volatility DECIMAL(8,4) DEFAULT 0,
    tracking_error DECIMAL(8,4) DEFAULT 0,
    
    -- Risk-adjusted metrics
    portfolio_sharpe DECIMAL(8,4) DEFAULT 0,
    benchmark_sharpe DECIMAL(8,4) DEFAULT 0,
    information_ratio DECIMAL(8,4) DEFAULT 0,
    
    -- Up/Down capture
    up_capture_ratio DECIMAL(8,4) DEFAULT 0,
    down_capture_ratio DECIMAL(8,4) DEFAULT 0,
    
    -- Correlation
    correlation DECIMAL(8,4) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, benchmark_symbol, comparison_date)
);

-- Performance Analytics Settings Table
CREATE TABLE IF NOT EXISTS performance_analytics_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Calculation preferences
    risk_free_rate DECIMAL(6,4) DEFAULT 0.02, -- 2% default
    benchmark_symbol TEXT DEFAULT 'SPY',
    calculation_frequency TEXT DEFAULT 'daily' CHECK (calculation_frequency IN ('daily', 'weekly', 'monthly')),
    
    -- Display preferences
    default_timeframe TEXT DEFAULT '1y',
    show_benchmark BOOLEAN DEFAULT true,
    show_drawdown BOOLEAN DEFAULT true,
    show_rolling_metrics BOOLEAN DEFAULT false,
    
    -- Alert thresholds
    drawdown_alert_threshold DECIMAL(5,2) DEFAULT 10.0, -- Alert at 10% drawdown
    volatility_alert_threshold DECIMAL(5,2) DEFAULT 25.0, -- Alert at 25% volatility
    
    -- Reporting preferences
    include_unrealized_pnl BOOLEAN DEFAULT true,
    consolidate_currency BOOLEAN DEFAULT true,
    base_currency TEXT DEFAULT 'USD',
    
    -- Advanced settings
    var_confidence_level DECIMAL(4,2) DEFAULT 95.0,
    holding_period_var INTEGER DEFAULT 1, -- Days
    monte_carlo_simulations INTEGER DEFAULT 10000,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Performance Reports Table
CREATE TABLE IF NOT EXISTS performance_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Report metadata
    report_name TEXT NOT NULL,
    report_type TEXT DEFAULT 'standard' CHECK (report_type IN ('standard', 'risk', 'attribution', 'benchmark')),
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    
    -- Report data
    report_data JSONB NOT NULL,
    
    -- Report settings
    include_charts BOOLEAN DEFAULT true,
    include_raw_data BOOLEAN DEFAULT false,
    format TEXT DEFAULT 'pdf' CHECK (format IN ('pdf', 'html', 'json', 'csv')),
    
    -- Generation info
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by TEXT DEFAULT 'system',
    
    -- Access control
    is_shared BOOLEAN DEFAULT false,
    shared_with JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE portfolio_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analytics_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reports ENABLE ROW LEVEL SECURITY;

-- Users can only access their own performance data
CREATE POLICY "Users can manage own portfolio performance" ON portfolio_performance_history
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trading metrics" ON trading_performance_metrics
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own risk analytics" ON risk_analytics
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own performance attribution" ON performance_attribution
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own benchmark comparisons" ON benchmark_comparisons
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own analytics settings" ON performance_analytics_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own performance reports" ON performance_reports
    FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_portfolio_performance_history_user_date ON portfolio_performance_history(user_id, date DESC);
CREATE INDEX idx_portfolio_performance_history_timestamp ON portfolio_performance_history(timestamp DESC);

CREATE INDEX idx_trading_performance_metrics_user_period ON trading_performance_metrics(user_id, period_start DESC, period_end DESC);
CREATE INDEX idx_trading_performance_metrics_period_type ON trading_performance_metrics(period_type, period_start DESC);

CREATE INDEX idx_risk_analytics_user_date ON risk_analytics(user_id, analysis_date DESC);

CREATE INDEX idx_performance_attribution_user_period ON performance_attribution(user_id, period_start DESC, period_end DESC);

CREATE INDEX idx_benchmark_comparisons_user_symbol_date ON benchmark_comparisons(user_id, benchmark_symbol, comparison_date DESC);

CREATE INDEX idx_performance_analytics_settings_user ON performance_analytics_settings(user_id);

CREATE INDEX idx_performance_reports_user_type ON performance_reports(user_id, report_type, generated_at DESC);

-- Updated timestamp triggers
CREATE TRIGGER update_trading_performance_metrics_updated_at
    BEFORE UPDATE ON trading_performance_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_analytics_settings_updated_at
    BEFORE UPDATE ON performance_analytics_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Performance calculation functions
CREATE OR REPLACE FUNCTION calculate_portfolio_performance(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_return DECIMAL(8,4),
    annualized_return DECIMAL(8,4),
    volatility DECIMAL(8,4),
    sharpe_ratio DECIMAL(8,4),
    max_drawdown DECIMAL(8,4),
    win_rate DECIMAL(5,2)
) AS $$
DECLARE
    performance_data RECORD;
    daily_returns DECIMAL(8,4)[];
    risk_free_rate DECIMAL(6,4) := 0.02;
    trading_days INTEGER;
    avg_return DECIMAL(8,4);
    return_variance DECIMAL(12,8);
    return_volatility DECIMAL(8,4);
    max_dd DECIMAL(8,4) := 0;
    running_max DECIMAL(15,2);
    current_dd DECIMAL(8,4);
BEGIN
    -- Get user's risk-free rate setting
    SELECT COALESCE(pas.risk_free_rate, 0.02) INTO risk_free_rate
    FROM performance_analytics_settings pas
    WHERE pas.user_id = p_user_id;
    
    -- Calculate basic performance metrics
    SELECT 
        COALESCE(
            (pph_end.total_value / pph_start.total_value) - 1, 
            0
        ) as total_ret,
        COUNT(*) as trading_days_count
    INTO performance_data
    FROM portfolio_performance_history pph_start
    CROSS JOIN portfolio_performance_history pph_end
    WHERE pph_start.user_id = p_user_id 
    AND pph_start.date = p_start_date
    AND pph_end.user_id = p_user_id 
    AND pph_end.date = p_end_date;
    
    trading_days := COALESCE(performance_data.trading_days_count, 1);
    
    -- Calculate annualized return
    IF trading_days > 0 THEN
        total_return := COALESCE(performance_data.total_ret, 0);
        annualized_return := POWER(1 + total_return, 365.0 / trading_days) - 1;
    ELSE
        total_return := 0;
        annualized_return := 0;
    END IF;
    
    -- Get daily returns for volatility calculation
    SELECT array_agg(daily_change_pct ORDER BY date)
    INTO daily_returns
    FROM portfolio_performance_history
    WHERE user_id = p_user_id
    AND date BETWEEN p_start_date AND p_end_date
    AND daily_change_pct IS NOT NULL;
    
    -- Calculate volatility
    IF array_length(daily_returns, 1) > 1 THEN
        SELECT AVG(value) INTO avg_return
        FROM unnest(daily_returns) as value;
        
        SELECT AVG(POWER(value - avg_return, 2)) INTO return_variance
        FROM unnest(daily_returns) as value;
        
        return_volatility := SQRT(return_variance) * SQRT(252); -- Annualized
        volatility := return_volatility;
        
        -- Calculate Sharpe ratio
        IF return_volatility > 0 THEN
            sharpe_ratio := (annualized_return - risk_free_rate) / return_volatility;
        ELSE
            sharpe_ratio := 0;
        END IF;
    ELSE
        volatility := 0;
        sharpe_ratio := 0;
    END IF;
    
    -- Calculate maximum drawdown
    running_max := 0;
    max_dd := 0;
    
    FOR performance_data IN
        SELECT total_value, date
        FROM portfolio_performance_history
        WHERE user_id = p_user_id
        AND date BETWEEN p_start_date AND p_end_date
        ORDER BY date
    LOOP
        running_max := GREATEST(running_max, performance_data.total_value);
        
        IF running_max > 0 THEN
            current_dd := (running_max - performance_data.total_value) / running_max;
            max_dd := GREATEST(max_dd, current_dd);
        END IF;
    END LOOP;
    
    max_drawdown := max_dd;
    
    -- Calculate win rate from trading metrics
    SELECT COALESCE(
        CASE 
            WHEN SUM(total_trades) > 0 THEN 
                SUM(winning_trades) * 100.0 / SUM(total_trades)
            ELSE 0 
        END, 
        0
    ) INTO win_rate
    FROM trading_performance_metrics
    WHERE user_id = p_user_id
    AND period_start >= p_start_date
    AND period_end <= p_end_date;
    
    RETURN QUERY SELECT 
        total_return,
        annualized_return,
        volatility,
        sharpe_ratio,
        max_drawdown,
        win_rate;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_portfolio_performance(
    p_user_id UUID,
    p_date DATE,
    p_total_value DECIMAL(15,2),
    p_equity_value DECIMAL(15,2) DEFAULT NULL,
    p_crypto_value DECIMAL(15,2) DEFAULT NULL,
    p_cash_value DECIMAL(15,2) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    prev_value DECIMAL(15,2);
    daily_change_val DECIMAL(15,2);
    daily_change_pct_val DECIMAL(8,4);
BEGIN
    -- Get previous day's value
    SELECT total_value INTO prev_value
    FROM portfolio_performance_history
    WHERE user_id = p_user_id
    AND date < p_date
    ORDER BY date DESC
    LIMIT 1;
    
    -- Calculate daily change
    IF prev_value IS NOT NULL AND prev_value > 0 THEN
        daily_change_val := p_total_value - prev_value;
        daily_change_pct_val := daily_change_val / prev_value;
    ELSE
        daily_change_val := 0;
        daily_change_pct_val := 0;
    END IF;
    
    -- Insert or update performance record
    INSERT INTO portfolio_performance_history (
        user_id, date, total_value, equity_value, crypto_value, cash_value,
        daily_change, daily_change_pct
    )
    VALUES (
        p_user_id, p_date, p_total_value, p_equity_value, p_crypto_value, p_cash_value,
        daily_change_val, daily_change_pct_val
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        total_value = EXCLUDED.total_value,
        equity_value = EXCLUDED.equity_value,
        crypto_value = EXCLUDED.crypto_value,
        cash_value = EXCLUDED.cash_value,
        daily_change = EXCLUDED.daily_change,
        daily_change_pct = EXCLUDED.daily_change_pct,
        timestamp = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_performance_report(
    p_user_id UUID,
    p_report_type TEXT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS UUID AS $$
DECLARE
    report_id UUID;
    report_data JSONB;
    performance_metrics RECORD;
    trading_metrics RECORD;
    risk_metrics RECORD;
BEGIN
    -- Calculate performance metrics
    SELECT * INTO performance_metrics
    FROM calculate_portfolio_performance(p_user_id, p_start_date, p_end_date);
    
    -- Get trading metrics
    SELECT 
        SUM(total_trades) as total_trades,
        SUM(winning_trades) as winning_trades,
        SUM(losing_trades) as losing_trades,
        AVG(win_rate) as avg_win_rate,
        SUM(total_pnl) as total_pnl
    INTO trading_metrics
    FROM trading_performance_metrics
    WHERE user_id = p_user_id
    AND period_start >= p_start_date
    AND period_end <= p_end_date;
    
    -- Get latest risk metrics
    SELECT * INTO risk_metrics
    FROM risk_analytics
    WHERE user_id = p_user_id
    AND analysis_date <= p_end_date
    ORDER BY analysis_date DESC
    LIMIT 1;
    
    -- Build report data
    report_data := jsonb_build_object(
        'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'performance', jsonb_build_object(
            'total_return', performance_metrics.total_return,
            'annualized_return', performance_metrics.annualized_return,
            'volatility', performance_metrics.volatility,
            'sharpe_ratio', performance_metrics.sharpe_ratio,
            'max_drawdown', performance_metrics.max_drawdown
        ),
        'trading', jsonb_build_object(
            'total_trades', COALESCE(trading_metrics.total_trades, 0),
            'win_rate', COALESCE(trading_metrics.avg_win_rate, 0),
            'total_pnl', COALESCE(trading_metrics.total_pnl, 0)
        ),
        'risk', jsonb_build_object(
            'var_95', COALESCE(risk_metrics.var_1day_95, 0),
            'portfolio_beta', COALESCE(risk_metrics.portfolio_beta, 0)
        ),
        'generated_at', NOW()
    );
    
    -- Create report record
    INSERT INTO performance_reports (
        user_id, report_name, report_type,
        report_period_start, report_period_end,
        report_data
    )
    VALUES (
        p_user_id,
        p_report_type || ' Report ' || p_start_date || ' to ' || p_end_date,
        p_report_type,
        p_start_date,
        p_end_date,
        report_data
    )
    RETURNING id INTO report_id;
    
    RETURN report_id;
END;
$$ LANGUAGE plpgsql; 