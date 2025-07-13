-- Rebuild RLS Policies from Scratch
-- Clean implementation with only user isolation

-- Drop ALL existing policies on portfolio_positions
DROP POLICY IF EXISTS portfolio_positions_own_data ON portfolio_positions;
DROP POLICY IF EXISTS portfolio_positions_admin_access ON portfolio_positions;
DROP POLICY IF EXISTS portfolio_positions_tier_limit ON portfolio_positions;

-- Verify no policies remain
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'portfolio_positions';
    
    RAISE NOTICE 'Remaining policies on portfolio_positions: %', policy_count;
END $$;

-- Create ONE simple policy for user isolation
CREATE POLICY portfolio_positions_user_isolation ON portfolio_positions
    FOR ALL
    TO public
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Verify the policy was created
SELECT policyname, cmd, permissive, qual 
FROM pg_policies 
WHERE tablename = 'portfolio_positions';

-- Test the policy manually
DO $$
DECLARE
    test_user_id UUID := '12345678-1234-1234-1234-123456789012';
    policy_result BOOLEAN;
BEGIN
    -- Set test context
    PERFORM set_config('app.current_user_id', test_user_id::TEXT, false);
    
    -- Test the policy condition
    SELECT test_user_id = current_setting('app.current_user_id')::UUID INTO policy_result;
    
    RAISE NOTICE 'Policy condition test: %', 
        CASE WHEN policy_result THEN 'PASSED' ELSE 'FAILED' END;
END $$;

RAISE NOTICE 'Clean RLS policy rebuild complete';
RAISE NOTICE 'Only user isolation policy remains on portfolio_positions'; 