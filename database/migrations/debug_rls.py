#!/usr/bin/env python3
"""
Debug RLS Implementation
Step-by-step debugging of RLS policies
"""

import psycopg2
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def debug_rls():
    """Debug RLS step by step"""
    conn = psycopg2.connect(
        host='localhost',
        port='5432',
        database='stackmotive', 
        user='stackmotive',
        password='stackmotive123'
    )
    
    cursor = conn.cursor()
    
    logger.info("=== RLS Debug Session ===")
    
    # 1. Check if RLS is enabled on portfolio_positions
    cursor.execute("""
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE tablename = 'portfolio_positions'
    """)
    result = cursor.fetchone()
    logger.info(f"Portfolio positions RLS enabled: {result}")
    
    # 2. Check policies on portfolio_positions
    cursor.execute("""
        SELECT policyname, cmd, qual
        FROM pg_policies 
        WHERE tablename = 'portfolio_positions'
    """)
    policies = cursor.fetchall()
    logger.info(f"Portfolio positions policies: {policies}")
    
    # 3. Get a test user ID
    cursor.execute("SELECT id, username FROM users WHERE username = 'testuser' LIMIT 1")
    user_result = cursor.fetchone()
    if user_result:
        test_user_id = user_result[0]
        test_username = user_result[1]
        logger.info(f"Test user: {test_username} ({test_user_id})")
    else:
        logger.error("No test user found")
        return
    
    # 4. Test setting user context
    try:
        cursor.execute("SELECT set_current_user(%s)", (test_user_id,))
        conn.commit()
        logger.info("✅ Set user context successfully")
    except Exception as e:
        logger.error(f"❌ Failed to set user context: {e}")
        return
    
    # 5. Verify user context
    try:
        cursor.execute("SELECT get_current_user()")
        current_user = cursor.fetchone()[0]
        logger.info(f"Current user context: {current_user}")
        
        if str(current_user) == str(test_user_id):
            logger.info("✅ User context verified")
        else:
            logger.error(f"❌ User context mismatch: expected {test_user_id}, got {current_user}")
    except Exception as e:
        logger.error(f"❌ Failed to get user context: {e}")
    
    # 6. Test raw setting access
    try:
        cursor.execute("SELECT current_setting('app.current_user_id', true)")
        raw_setting = cursor.fetchone()[0]
        logger.info(f"Raw setting value: {raw_setting}")
    except Exception as e:
        logger.error(f"❌ Failed to get raw setting: {e}")
    
    # 7. Count total portfolio positions without RLS context
    cursor.execute("SELECT set_config('row_security', 'off', false)")
    cursor.execute("SELECT COUNT(*) FROM portfolio_positions")
    total_positions = cursor.fetchone()[0]
    logger.info(f"Total positions (no RLS): {total_positions}")
    
    # 8. Re-enable RLS and test with context
    cursor.execute("SELECT set_config('row_security', 'on', false)")
    cursor.execute("SELECT set_current_user(%s)", (test_user_id,))
    conn.commit()
    
    cursor.execute("SELECT COUNT(*) FROM portfolio_positions")
    visible_positions = cursor.fetchone()[0]
    logger.info(f"Visible positions (with RLS): {visible_positions}")
    
    # 9. Show which positions are visible
    cursor.execute("SELECT symbol, user_id FROM portfolio_positions")
    positions = cursor.fetchall()
    logger.info(f"Visible positions details: {positions}")
    
    # 10. Test policy condition manually
    cursor.execute("""
        SELECT symbol, user_id, 
               (user_id = current_setting('app.current_user_id')::UUID) as should_be_visible
        FROM portfolio_positions
    """)
    policy_test = cursor.fetchall()
    logger.info(f"Policy test results: {policy_test}")
    
    conn.close()

if __name__ == "__main__":
    debug_rls() 