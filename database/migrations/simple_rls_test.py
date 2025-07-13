#!/usr/bin/env python3
"""
Simple RLS Validation Test
Basic test to validate RLS is working
"""

import psycopg2
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def simple_rls_test():
    """Simple RLS validation"""
    conn = psycopg2.connect(
        host='localhost',
        port='5432',
        database='stackmotive',
        user='stackmotive',
        password='stackmotive123'
    )
    
    cursor = conn.cursor()
    
    logger.info("🚀 Simple RLS Validation Test")
    logger.info("=" * 40)
    
    try:
        # 1. Create two test users
        alice_id = str(uuid.uuid4())
        bob_id = str(uuid.uuid4())
        
        # Clean up first
        cursor.execute("DELETE FROM users WHERE email IN ('alice@rls.com', 'bob@rls.com')")
        cursor.execute("DELETE FROM portfolio_positions WHERE symbol IN ('ALICETEST', 'BOBTEST')")
        conn.commit()
        
        # Create users
        cursor.execute("""
            INSERT INTO users (id, username, email, password_hash, subscription_tier, role)
            VALUES (%s, 'alice', 'alice@rls.com', 'hash', 'free', 'user')
        """, (alice_id,))
        
        cursor.execute("""
            INSERT INTO users (id, username, email, password_hash, subscription_tier, role)
            VALUES (%s, 'bob', 'bob@rls.com', 'hash', 'pro', 'user')
        """, (bob_id,))
        
        conn.commit()
        logger.info("✅ Created Alice and Bob test users")
        
        # 2. Create portfolio positions for each user
        alice_pos_id = str(uuid.uuid4())
        bob_pos_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO portfolio_positions 
            (id, user_id, symbol, name, quantity, avg_price, asset_class, account, sync_source)
            VALUES (%s, %s, 'ALICETEST', 'Alice Stock', 100, 50.0, 'equity', 'test', 'test')
        """, (alice_pos_id, alice_id))
        
        cursor.execute("""
            INSERT INTO portfolio_positions 
            (id, user_id, symbol, name, quantity, avg_price, asset_class, account, sync_source)
            VALUES (%s, %s, 'BOBTEST', 'Bob Stock', 200, 75.0, 'equity', 'test', 'test')
        """, (bob_pos_id, bob_id))
        
        conn.commit()
        logger.info("✅ Created portfolio positions for both users")
        
        # 3. Test Alice's view (should only see her own position)
        cursor.execute("SELECT set_current_user(%s)", (alice_id,))
        conn.commit()
        
        cursor.execute("SELECT symbol, user_id FROM portfolio_positions WHERE symbol IN ('ALICETEST', 'BOBTEST')")
        alice_view = cursor.fetchall()
        
        alice_own = [pos for pos in alice_view if pos[0] == 'ALICETEST']
        alice_sees_bob = [pos for pos in alice_view if pos[0] == 'BOBTEST']
        
        logger.info(f"Alice sees: {alice_view}")
        
        if len(alice_own) == 1 and len(alice_sees_bob) == 0:
            logger.info("✅ Alice: Perfect isolation (sees only own data)")
            alice_test = True
        else:
            logger.error("❌ Alice: Isolation failed")
            alice_test = False
        
        # 4. Test Bob's view (should only see his own position)
        cursor.execute("SELECT set_current_user(%s)", (bob_id,))
        conn.commit()
        
        cursor.execute("SELECT symbol, user_id FROM portfolio_positions WHERE symbol IN ('ALICETEST', 'BOBTEST')")
        bob_view = cursor.fetchall()
        
        bob_own = [pos for pos in bob_view if pos[0] == 'BOBTEST']
        bob_sees_alice = [pos for pos in bob_view if pos[0] == 'ALICETEST']
        
        logger.info(f"Bob sees: {bob_view}")
        
        if len(bob_own) == 1 and len(bob_sees_alice) == 0:
            logger.info("✅ Bob: Perfect isolation (sees only own data)")
            bob_test = True
        else:
            logger.error("❌ Bob: Isolation failed")
            bob_test = False
        
        # 5. Test without RLS context (admin view)
        cursor.execute("SELECT clear_current_user()")
        conn.commit()
        
        # This should show all positions
        cursor.execute("SELECT symbol FROM portfolio_positions WHERE symbol IN ('ALICETEST', 'BOBTEST')")
        no_context_view = cursor.fetchall()
        
        logger.info(f"No context view: {no_context_view}")
        
        # 6. Summary
        if alice_test and bob_test:
            logger.info("=" * 40)
            logger.info("🎉 RLS VALIDATION: PASSED")
            logger.info("✅ User isolation is working correctly!")
            success = True
        else:
            logger.info("=" * 40)
            logger.info("❌ RLS VALIDATION: FAILED") 
            logger.info("⚠️ User isolation needs fixing")
            success = False
        
        # 7. Cleanup
        cursor.execute("DELETE FROM users WHERE email IN ('alice@rls.com', 'bob@rls.com')")
        cursor.execute("DELETE FROM portfolio_positions WHERE symbol IN ('ALICETEST', 'BOBTEST')")
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
    success = simple_rls_test()
    
    if success:
        print("\n🎉 Simple RLS Test: PASSED")
        print("✅ Row Level Security is working!")
    else:
        print("\n❌ Simple RLS Test: FAILED")
        print("⚠️ RLS needs attention")

if __name__ == "__main__":
    main() 