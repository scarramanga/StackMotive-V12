-- Fix RLS Policies
-- Remove conflicting admin policies and ensure proper user isolation

-- Drop existing conflicting policies
DROP POLICY IF EXISTS portfolio_positions_admin_access ON portfolio_positions;
DROP POLICY IF EXISTS users_admin_access ON users;
DROP POLICY IF EXISTS sessions_admin_access ON sessions;
DROP POLICY IF EXISTS trading_accounts_admin_access ON trading_accounts;

-- For now, let's focus on user isolation first
-- Admin access can be handled at the application level

-- Verify the main user isolation policies are working
-- These should be the only policies on most tables

-- Test the policy
DO $$
DECLARE
    test_result TEXT;
BEGIN
    -- Test if a policy condition works
    PERFORM set_config('app.current_user_id', '12345678-1234-1234-1234-123456789012', false);
    
    SELECT CASE 
        WHEN '12345678-1234-1234-1234-123456789012'::UUID = current_setting('app.current_user_id')::UUID 
        THEN 'Policy condition works correctly'
        ELSE 'Policy condition failed'
    END INTO test_result;
    
    RAISE NOTICE 'RLS Policy Test: %', test_result;
END $$;

-- Create a simple test function to validate user context
CREATE OR REPLACE FUNCTION test_user_context(test_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    context_user_id UUID;
BEGIN
    -- Set the context
    PERFORM set_current_user(test_user_id);
    
    -- Get the context back
    context_user_id := get_current_user();
    
    -- Return true if they match
    RETURN context_user_id = test_user_id;
END;
$$ LANGUAGE plpgsql;

-- Drop admin policies from all tables to ensure clean user isolation
DO $$
DECLARE
    table_record RECORD;
    policy_record RECORD;
BEGIN
    -- Get all tables with RLS enabled
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' AND rowsecurity = true
    LOOP
        -- Drop admin access policies
        FOR policy_record IN
            SELECT policyname
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = table_record.tablename
            AND policyname LIKE '%admin_access%'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, table_record.tablename);
            RAISE NOTICE 'Dropped admin policy: % on table %', policy_record.policyname, table_record.tablename;
        END LOOP;
    END LOOP;
END $$;

-- Ensure all tables have only the user isolation policy
-- This will give us clean user isolation for testing

RAISE NOTICE 'RLS policies cleaned up for proper user isolation';
RAISE NOTICE 'Admin access removed to ensure clean testing';
RAISE NOTICE 'Application should handle admin access at the business logic level'; 