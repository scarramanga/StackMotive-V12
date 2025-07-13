#!/usr/bin/env python3
"""
Comprehensive RLS Test
Step-by-step RLS validation with detailed debugging
"""

import psycopg2
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def comprehensive_rls_test():
    """Comprehensive RLS test with debugging"""
    conn = psycopg2.connect(
        host='localhost',
        port='5432',
        database='stackmotive',
        user='stackmotive',
        password='stackmotive123'
    )
    
    cursor = conn.cursor()
    
    logger.info("🚀 Comprehensive RLS Test")
    logger.info("=" * 50)
    
    try:
        # Step 1: Clean up any existing test data
        logger.info("Step 1: Cleaning up existing test data...")
        cursor.execute("DELETE FROM portfolio_positions WHERE symbol LIKE 'RLS%'")
        cursor.execute("DELETE FROM users WHERE email LIKE '%@rlstest.com'")
        conn.commit()
        
        # Step 2: Create test users
        logger.info("Step 2: Creating test users...")
        alice_id = str(uuid.uuid4())
        bob_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO users (id, username, email, password_hash, subscription_tier, role)
            VALUES (%s, 'alice_rls', 'alice@rlstest.com', 'hash', 'free', 'user')
        """, (alice_id,))
        
        cursor.execute("""
            INSERT INTO users (id, username, email, password_hash, subscription_tier, role)
            VALUES (%s, 'bob_rls', 'bob@rlstest.com', 'hash', 'pro', 'user')
        """, (bob_id,))
        
        conn.commit()
        logger.info(f"✅ Created Alice: {alice_id}")
        logger.info(f"✅ Created Bob: {bob_id}")
        
        # Step 3: Verify users exist
        cursor.execute("SELECT id, username FROM users WHERE email LIKE '%@rlstest.com'")
        users = cursor.fetchall()
        logger.info(f"✅ Users in database: {users}")
        
        # Step 4: Create portfolio positions WITHOUT user context (as system)
        logger.info("Step 4: Creating portfolio positions...")
        
        # Temporarily disable RLS to insert data
        cursor.execute("SET row_security = off")
        
        alice_pos_id = str(uuid.uuid4())
        bob_pos_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO portfolio_positions 
            (id, user_id, symbol, name, quantity, avg_price, asset_class, account, sync_source)
            VALUES (%s, %s, 'RLSALICE', 'Alice RLS Test', 100, 50.0, 'equity', 'test', 'test')
        """, (alice_pos_id, alice_id))
        
        cursor.execute("""
            INSERT INTO portfolio_positions 
            (id, user_id, symbol, name, quantity, avg_price, asset_class, account, sync_source)
            VALUES (%s, %s, 'RLSBOB', 'Bob RLS Test', 200, 75.0, 'equity', 'test', 'test')
        """, (bob_pos_id, bob_id))
        
        conn.commit()
        logger.info(f"✅ Created Alice's position: {alice_pos_id}")
        logger.info(f"✅ Created Bob's position: {bob_pos_id}")
        
        # Step 5: Verify positions exist (without RLS)
        cursor.execute("SELECT symbol, user_id FROM portfolio_positions WHERE symbol LIKE 'RLS%'")
        all_positions = cursor.fetchall()
        logger.info(f"✅ All positions (no RLS): {all_positions}")
        
        # Step 6: Re-enable RLS
        logger.info("Step 6: Re-enabling RLS...")
        cursor.execute("SET row_security = on")
        
        # Step 7: Test Alice's view
        logger.info("Step 7: Testing Alice's view...")
        
        # Set Alice's context
        cursor.execute("SELECT set_current_user(%s)", (alice_id,))
        conn.commit()
        
        # Verify context is set
        cursor.execute("SELECT get_current_user()")
        current_user = cursor.fetchone()[0]
        logger.info(f"Current user context: {current_user}")
        
        if str(current_user) == alice_id:
            logger.info("✅ Alice's context set correctly")
        else:
            logger.error(f"❌ Context issue: expected {alice_id}, got {current_user}")
        
        # Query Alice's view
        cursor.execute("SELECT symbol, user_id FROM portfolio_positions WHERE symbol LIKE 'RLS%'")
        alice_view = cursor.fetchall()
        logger.info(f"Alice sees: {alice_view}")
        
        # Step 8: Test Bob's view
        logger.info("Step 8: Testing Bob's view...")
        
        # Set Bob's context
        cursor.execute("SELECT set_current_user(%s)", (bob_id,))
        conn.commit()
        
        # Verify context
        cursor.execute("SELECT get_current_user()")
        current_user = cursor.fetchone()[0]
        logger.info(f"Current user context: {current_user}")
        
        # Query Bob's view
        cursor.execute("SELECT symbol, user_id FROM portfolio_positions WHERE symbol LIKE 'RLS%'")
        bob_view = cursor.fetchall()
        logger.info(f"Bob sees: {bob_view}")
        
        # Step 9: Analyze results
        logger.info("Step 9: Analyzing results...")
        
        alice_sees_own = any(pos[0] == 'RLSALICE' for pos in alice_view)
        alice_sees_bob = any(pos[0] == 'RLSBOB' for pos in alice_view)
        bob_sees_own = any(pos[0] == 'RLSBOB' for pos in bob_view)
        bob_sees_alice = any(pos[0] == 'RLSALICE' for pos in bob_view)
        
        logger.info(f"Alice sees own data: {alice_sees_own}")
        logger.info(f"Alice sees Bob's data: {alice_sees_bob}")
        logger.info(f"Bob sees own data: {bob_sees_own}")
        logger.info(f"Bob sees Alice's data: {bob_sees_alice}")
        
        # Step 10: Test without user context
        logger.info("Step 10: Testing without user context...")
        cursor.execute("SELECT clear_current_user()")
        conn.commit()
        
        cursor.execute("SELECT symbol, user_id FROM portfolio_positions WHERE symbol LIKE 'RLS%'")
        no_context_view = cursor.fetchall()
        logger.info(f"No context view: {no_context_view}")
        
        # Step 11: Final verdict
        logger.info("=" * 50)
        
        if alice_sees_own and not alice_sees_bob and bob_sees_own and not bob_sees_alice:
            logger.info("🎉 RLS WORKING PERFECTLY!")
            logger.info("✅ User isolation is functioning correctly")
            success = True
        elif len(alice_view) == 0 and len(bob_view) == 0:
            logger.warning("⚠️ RLS TOO RESTRICTIVE: Users cannot see their own data")
            logger.info("This suggests a policy issue - users should see their own data")
            success = False
        elif alice_sees_bob or bob_sees_alice:
            logger.error("❌ RLS ISOLATION FAILED: Users can see each other's data")
            success = False
        else:
            logger.warning("⚠️ UNEXPECTED RLS BEHAVIOR")
            success = False
        
        # Cleanup
        cursor.execute("SET row_security = off")
        cursor.execute("DELETE FROM portfolio_positions WHERE symbol LIKE 'RLS%'")
        cursor.execute("DELETE FROM users WHERE email LIKE '%@rlstest.com'")
        conn.commit()
        logger.info("✅ Test data cleaned up")
        
        return success
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def main():
    success = comprehensive_rls_test()
    
    if success:
        print("\n🎉 Comprehensive RLS Test: PASSED")
        print("✅ Row Level Security is working correctly!")
    else:
        print("\n❌ Comprehensive RLS Test: FAILED")
        print("⚠️ RLS needs attention")
        
    return success

if __name__ == "__main__":
    main() 