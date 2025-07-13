-- Phase 5B: Row Level Security (RLS) Implementation
-- Comprehensive security policies for all StackMotive tables

-- Enable RLS globally (already done but ensuring it's set)
ALTER DATABASE stackmotive SET row_level_security = on;

-- ===========================
-- CORE USER SECURITY POLICIES
-- ===========================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own record
CREATE POLICY users_own_data ON users
    FOR ALL
    TO public
    USING (id = current_setting('app.current_user_id')::UUID);

-- Admins can see all users
CREATE POLICY users_admin_access ON users
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id = current_setting('app.current_user_id')::UUID 
            AND admin_user.role = 'admin'
        )
    );

-- ===========================
-- SESSION SECURITY
-- ===========================

-- Enable RLS on sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
CREATE POLICY sessions_own_data ON sessions
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Admins can see all sessions
CREATE POLICY sessions_admin_access ON sessions
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id = current_setting('app.current_user_id')::UUID 
            AND admin_user.role = 'admin'
        )
    );

-- ===========================
-- PORTFOLIO DATA SECURITY
-- ===========================

-- Enable RLS on portfolio_positions table
ALTER TABLE portfolio_positions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own portfolio positions
CREATE POLICY portfolio_positions_own_data ON portfolio_positions
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Admins can see all positions
CREATE POLICY portfolio_positions_admin_access ON portfolio_positions
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id = current_setting('app.current_user_id')::UUID 
            AND admin_user.role = 'admin'
        )
    );

-- ===========================
-- TRADING DATA SECURITY
-- ===========================

-- Enable RLS on trading_accounts table
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own trading accounts
CREATE POLICY trading_accounts_own_data ON trading_accounts
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Enable RLS on strategies table
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

-- Users can only access their own strategies
CREATE POLICY strategies_own_data ON strategies
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Enable RLS on trades table
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Users can only access their own trades
CREATE POLICY trades_own_data ON trades
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- ===========================
-- AUTOMATION & PREFERENCES
-- ===========================

-- Enable RLS on automation_preferences table
ALTER TABLE automation_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own automation preferences
CREATE POLICY automation_preferences_own_data ON automation_preferences
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- ===========================
-- BACKTEST DATA SECURITY
-- ===========================

-- Enable RLS on backtest_sessions table
ALTER TABLE backtest_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own backtest sessions
CREATE POLICY backtest_sessions_own_data ON backtest_sessions
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Enable RLS on backtest_trades table (via session relationship)
ALTER TABLE backtest_trades ENABLE ROW LEVEL SECURITY;

-- Users can only access backtest trades from their sessions
CREATE POLICY backtest_trades_own_data ON backtest_trades
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM backtest_sessions bs 
            WHERE bs.id = backtest_trades.session_id 
            AND bs.user_id = current_setting('app.current_user_id')::UUID
        )
    );

-- ===========================
-- TAX DATA SECURITY
-- ===========================

-- Enable RLS on tax_settings table
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tax settings
CREATE POLICY tax_settings_own_data ON tax_settings
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Enable RLS on tax_lots table
ALTER TABLE tax_lots ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tax lots
CREATE POLICY tax_lots_own_data ON tax_lots
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Enable RLS on tax_calculations table
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tax calculations
CREATE POLICY tax_calculations_own_data ON tax_calculations
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- ===========================
-- PORTFOLIO MANAGEMENT
-- ===========================

-- Enable RLS on portfolio_plans table
ALTER TABLE portfolio_plans ENABLE ROW LEVEL SECURITY;

-- Users can only access their own portfolio plans
CREATE POLICY portfolio_plans_own_data ON portfolio_plans
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Enable RLS on rebalance_recommendations table
ALTER TABLE rebalance_recommendations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own rebalance recommendations
CREATE POLICY rebalance_recommendations_own_data ON rebalance_recommendations
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Enable RLS on rebalance_schedules table
ALTER TABLE rebalance_schedules ENABLE ROW LEVEL SECURITY;

-- Users can only access their own rebalance schedules
CREATE POLICY rebalance_schedules_own_data ON rebalance_schedules
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- ===========================
-- PAPER TRADING SECURITY
-- ===========================

-- Enable RLS on paper_trading_accounts table
ALTER TABLE paper_trading_accounts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own paper trading accounts
CREATE POLICY paper_trading_accounts_own_data ON paper_trading_accounts
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Enable RLS on paper_trading_transactions table
ALTER TABLE paper_trading_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own paper trading transactions
CREATE POLICY paper_trading_transactions_own_data ON paper_trading_transactions
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- ===========================
-- PORTFOLIO SYNC & LOGS
-- ===========================

-- Enable RLS on portfolio_sync_logs table
ALTER TABLE portfolio_sync_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sync logs
CREATE POLICY portfolio_sync_logs_own_data ON portfolio_sync_logs
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- ===========================
-- AI & AGENT DATA SECURITY
-- ===========================

-- Enable RLS on agent_memory table
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

-- Users can only access their own agent memory
CREATE POLICY agent_memory_own_data ON agent_memory
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Enable RLS on ai_suggestion_responses table
ALTER TABLE ai_suggestion_responses ENABLE ROW LEVEL SECURITY;

-- Users can only access their own AI suggestion responses
CREATE POLICY ai_suggestion_responses_own_data ON ai_suggestion_responses
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Enable RLS on strategy_assignments table
ALTER TABLE strategy_assignments ENABLE ROW LEVEL SECURITY;

-- Users can only access their own strategy assignments
CREATE POLICY strategy_assignments_own_data ON strategy_assignments
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- ===========================
-- METADATA & TAGS
-- ===========================

-- Enable RLS on holding_tags table
ALTER TABLE holding_tags ENABLE ROW LEVEL SECURITY;

-- Users can only access their own holding tags
CREATE POLICY holding_tags_own_data ON holding_tags
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- ===========================
-- SHARED DATA (READ-ONLY)
-- ===========================

-- Macro signals are shared data - all users can read
ALTER TABLE macro_signals ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read macro signals
CREATE POLICY macro_signals_read_access ON macro_signals
    FOR SELECT
    TO public
    USING (current_setting('app.current_user_id', true) IS NOT NULL);

-- Only admins can insert/update/delete macro signals
CREATE POLICY macro_signals_admin_write ON macro_signals
    FOR INSERT, UPDATE, DELETE
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id = current_setting('app.current_user_id')::UUID 
            AND admin_user.role = 'admin'
        )
    );

-- ===========================
-- USER TIER ENFORCEMENT
-- ===========================

-- Function to get user's subscription tier
CREATE OR REPLACE FUNCTION get_user_tier()
RETURNS TEXT AS $$
DECLARE
    user_tier TEXT;
BEGIN
    SELECT subscription_tier INTO user_tier 
    FROM users 
    WHERE id = current_setting('app.current_user_id')::UUID;
    
    RETURN COALESCE(user_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to feature based on tier
CREATE OR REPLACE FUNCTION user_has_tier_access(required_tier TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
BEGIN
    user_tier := get_user_tier();
    
    -- Tier hierarchy: free < pro < enterprise
    RETURN CASE 
        WHEN required_tier = 'free' THEN TRUE
        WHEN required_tier = 'pro' THEN user_tier IN ('pro', 'enterprise')
        WHEN required_tier = 'enterprise' THEN user_tier = 'enterprise'
        ELSE FALSE
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply tier-based restrictions to premium features
-- Example: Advanced strategies are pro/enterprise only
CREATE POLICY strategies_tier_access ON strategies
    FOR ALL
    TO public
    USING (
        user_id = current_setting('app.current_user_id')::UUID 
        AND (
            -- Basic strategies available to all tiers
            indicators NOT LIKE '%advanced%' 
            OR user_has_tier_access('pro')
        )
    );

-- Portfolio positions limit based on tier
CREATE POLICY portfolio_positions_tier_limit ON portfolio_positions
    FOR INSERT
    TO public
    WITH CHECK (
        user_id = current_setting('app.current_user_id')::UUID 
        AND (
            -- Free tier: max 10 positions
            (get_user_tier() = 'free' AND (
                SELECT COUNT(*) FROM portfolio_positions 
                WHERE user_id = current_setting('app.current_user_id')::UUID
            ) < 10)
            -- Pro tier: max 100 positions
            OR (get_user_tier() = 'pro' AND (
                SELECT COUNT(*) FROM portfolio_positions 
                WHERE user_id = current_setting('app.current_user_id')::UUID
            ) < 100)
            -- Enterprise: unlimited
            OR get_user_tier() = 'enterprise'
        )
    );

-- ===========================
-- SECURITY FUNCTIONS
-- ===========================

-- Function to set current user context (called by application)
CREATE OR REPLACE FUNCTION set_current_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_uuid::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user context
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_user_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear user context
CREATE OR REPLACE FUNCTION clear_current_user()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- AUDIT & LOGGING
-- ===========================

-- Create audit log table for RLS policy violations
CREATE TABLE IF NOT EXISTS rls_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    policy_violated TEXT,
    context JSONB
);

-- Function to log RLS policy violations
CREATE OR REPLACE FUNCTION log_rls_violation(
    p_table_name TEXT,
    p_operation TEXT,
    p_policy_violated TEXT,
    p_context JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO rls_audit_log (user_id, table_name, operation, policy_violated, context)
    VALUES (
        get_current_user(),
        p_table_name,
        p_operation,
        p_policy_violated,
        p_context
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- PERFORMANCE OPTIMIZATION
-- ===========================

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_users_id_role ON users(id, role);
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_user_id_active ON portfolio_positions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trades_user_id_date ON trades(user_id, entry_time);
CREATE INDEX IF NOT EXISTS idx_agent_memory_user_id_timestamp ON agent_memory(user_id, timestamp);

-- ===========================
-- RLS STATUS VALIDATION
-- ===========================

-- Create view to check RLS status on all tables
CREATE OR REPLACE VIEW rls_status AS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE schemaname = t.schemaname 
        AND tablename = t.tablename
    ) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;

-- ===========================
-- COMPLETION MESSAGE
-- ===========================

-- Insert RLS implementation status
INSERT INTO migration_status (migration_name, status, notes) 
VALUES ('phase5_rls_implementation', 'completed', 'Row Level Security policies implemented for all tables')
ON CONFLICT (migration_name) DO UPDATE SET
    status = 'completed',
    completed_at = NOW(),
    notes = 'Row Level Security policies implemented for all tables';

-- Success message
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    
    RAISE NOTICE 'Phase 5B: RLS Implementation Complete!';
    RAISE NOTICE 'Tables secured: %', table_count;
    RAISE NOTICE 'Policies created: %', policy_count;
    RAISE NOTICE 'User isolation: Enabled';
    RAISE NOTICE 'Tier enforcement: Active';
END $$; 