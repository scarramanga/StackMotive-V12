#!/usr/bin/env python3
"""
Database cleanup script to remove all users except development/testing accounts.
This prepares the database for UI/UX testers.
"""

import sys
import os
from sqlalchemy.orm import Session
from server.database import SessionLocal, engine
from server.models.user import User
from server.models.paper_trading import PaperTradingAccount, Trade

# List of emails to preserve (development/testing accounts)
PRESERVE_EMAILS = [
    'test@stackmotive.com',
    'demo@stackmotive.com', 
    'admin@stackmotive.com',
    'dev@stackmotive.com',
    'qa@stackmotive.com'
]

def cleanup_users():
    """Remove all users except those in the preserve list"""
    db = SessionLocal()
    
    try:
        # Get all users
        all_users = db.query(User).all()
        print(f"Found {len(all_users)} total users in database")
        
        # Show current users
        print("\nCurrent users:")
        for user in all_users:
            print(f"  ID: {user.id}, Email: {user.email}, Admin: {user.is_admin}, Onboarding: {user.has_completed_onboarding}")
        
        # Find users to delete
        users_to_delete = [user for user in all_users if user.email not in PRESERVE_EMAILS]
        users_to_keep = [user for user in all_users if user.email in PRESERVE_EMAILS]
        
        print(f"\nUsers to keep: {len(users_to_keep)}")
        for user in users_to_keep:
            print(f"  ✓ {user.email}")
            
        print(f"\nUsers to delete: {len(users_to_delete)}")
        for user in users_to_delete:
            print(f"  ✗ {user.email}")
        
        if not users_to_delete:
            print("\n✅ No users to delete. Database is already clean!")
            return
        
        # Confirm deletion
        if '--force' not in sys.argv:
            confirm = input(f"\n⚠️  Are you sure you want to delete {len(users_to_delete)} users? (yes/no): ")
            if confirm.lower() != 'yes':
                print("❌ Cleanup cancelled")
                return
        
        # Delete users and their related data
        deleted_count = 0
        for user in users_to_delete:
            try:
                # Delete related paper trading accounts and trades (CASCADE should handle this)
                print(f"🗑️  Deleting user: {user.email}")
                db.delete(user)
                deleted_count += 1
            except Exception as e:
                print(f"❌ Error deleting user {user.email}: {e}")
                db.rollback()
                continue
        
        # Commit all deletions
        db.commit()
        print(f"\n✅ Successfully deleted {deleted_count} users")
        
        # Show final state
        remaining_users = db.query(User).all()
        print(f"\n📊 Final state: {len(remaining_users)} users remaining")
        for user in remaining_users:
            print(f"  ✓ {user.email}")
            
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def create_test_users():
    """Create standard test users if they don't exist"""
    db = SessionLocal()
    
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        test_users = [
            {
                'email': 'test@stackmotive.com',
                'password': 'testpass123',
                'is_admin': False,
                'has_completed_onboarding': True,
                'preferred_currency': 'USD'
            },
            {
                'email': 'demo@stackmotive.com', 
                'password': 'demopass123',
                'is_admin': False,
                'has_completed_onboarding': False,
                'preferred_currency': 'NZD'
            },
            {
                'email': 'admin@stackmotive.com',
                'password': 'adminpass123',
                'is_admin': True,
                'has_completed_onboarding': True,
                'preferred_currency': 'USD'
            }
        ]
        
        created_count = 0
        for user_data in test_users:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == user_data['email']).first()
            if existing_user:
                print(f"✓ User {user_data['email']} already exists")
                continue
                
            # Create new user
            hashed_password = pwd_context.hash(user_data['password'])
            new_user = User(
                email=user_data['email'],
                hashed_password=hashed_password,
                is_admin=user_data['is_admin'],
                has_completed_onboarding=user_data['has_completed_onboarding'],
                preferred_currency=user_data['preferred_currency']
            )
            
            db.add(new_user)
            created_count += 1
            print(f"➕ Created user: {user_data['email']}")
        
        if created_count > 0:
            db.commit()
            print(f"\n✅ Created {created_count} new test users")
        else:
            print("\n✅ All test users already exist")
            
    except Exception as e:
        print(f"❌ Error creating test users: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def show_stats():
    """Show database statistics"""
    db = SessionLocal()
    
    try:
        user_count = db.query(User).count()
        admin_count = db.query(User).filter(User.is_admin == True).count()
        onboarded_count = db.query(User).filter(User.has_completed_onboarding == True).count()
        
        # Get paper trading stats
        account_count = db.query(PaperTradingAccount).count()
        trade_count = db.query(Trade).count()
        
        print("📊 Database Statistics:")
        print(f"  👥 Total Users: {user_count}")
        print(f"  🔑 Admin Users: {admin_count}")
        print(f"  ✅ Onboarded Users: {onboarded_count}")
        print(f"  💼 Paper Trading Accounts: {account_count}")
        print(f"  📈 Total Trades: {trade_count}")
        
    except Exception as e:
        print(f"❌ Error getting stats: {e}")
    finally:
        db.close()

def main():
    """Main function"""
    print("🧹 StackMotive Database User Cleanup")
    print("=====================================")
    
    if len(sys.argv) > 1:
        action = sys.argv[1]
        
        if action == 'stats':
            show_stats()
        elif action == 'create-test-users':
            create_test_users()
        elif action == 'cleanup':
            cleanup_users()
        elif action == 'full-reset':
            print("🔄 Full reset: cleanup + create test users")
            cleanup_users()
            create_test_users()
            show_stats()
        else:
            print("❌ Unknown action. Available actions:")
            print("  stats           - Show database statistics")
            print("  create-test-users - Create standard test users")
            print("  cleanup         - Remove all users except preserved ones")
            print("  full-reset      - Cleanup + create test users")
            print("\nAdd --force to skip confirmation prompts")
    else:
        print("Available actions:")
        print("  python cleanup_users.py stats")
        print("  python cleanup_users.py create-test-users")
        print("  python cleanup_users.py cleanup")
        print("  python cleanup_users.py full-reset")
        print("\nAdd --force to skip confirmation prompts")

if __name__ == "__main__":
    main() 