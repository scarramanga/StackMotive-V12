# StackMotive Test Users Reference

## 🧪 **Test User Accounts for UI/UX Testing**

The database has been cleaned and prepared with fresh test accounts for UI/UX testing.

### **Available Test Accounts**

#### 1. **Standard Test User** ✅ *Onboarding Completed*
- **Email:** `test@stackmotive.com`
- **Password:** `testpass123`
- **Role:** Regular User
- **Status:** Has completed onboarding
- **Currency:** USD
- **Use Case:** Testing the full user experience post-onboarding

#### 2. **Demo User** 🎯 *New User Experience*
- **Email:** `demo@stackmotive.com`
- **Password:** `demopass123`
- **Role:** Regular User
- **Status:** Has NOT completed onboarding
- **Currency:** NZD
- **Use Case:** Testing the complete onboarding flow from scratch

#### 3. **Admin User** 👑 *Administrative Access*
- **Email:** `admin@stackmotive.com`
- **Password:** `adminpass123`
- **Role:** Administrator
- **Status:** Has completed onboarding
- **Currency:** USD
- **Use Case:** Testing admin features and system management

---

### **Database State Summary**
- **Total Users:** 3 (all test accounts)
- **Admin Users:** 1
- **Onboarded Users:** 2
- **Paper Trading Accounts:** 0 (fresh start)
- **Total Trades:** 0 (clean slate)

---

### **Testing Scenarios**

#### **🚀 New User Registration & Onboarding**
1. Register a new account via the registration form
2. Test email uniqueness validation
3. Complete the 5-step onboarding process
4. Verify all form validations and localStorage persistence

#### **🔐 Existing User Login**
1. Login with `test@stackmotive.com` (completed onboarding)
2. Should go directly to dashboard
3. Test trading features and portfolio management

#### **📚 Onboarding Flow Testing**
1. Login with `demo@stackmotive.com` (incomplete onboarding)
2. Should be redirected to onboarding
3. Test all onboarding steps, edit functionality, and completion

#### **⚙️ Admin Features**
1. Login with `admin@stackmotive.com`
2. Test administrative functions
3. Verify admin-only features and permissions

---

### **🔄 Database Reset Commands**

If you need to reset the database during testing:

```bash
# Show current stats
python cleanup_users.py stats

# Clean all users except preserved ones
python cleanup_users.py cleanup

# Create fresh test users
python cleanup_users.py create-test-users

# Full reset (cleanup + create users)
python cleanup_users.py full-reset
```

---

### **📋 Testing Checklist**

#### Registration & Authentication
- [ ] Email uniqueness validation
- [ ] Password strength indicator
- [ ] Form validation messages
- [ ] Auto-login after registration

#### Onboarding Flow
- [ ] Step 1: Welcome
- [ ] Step 2: Portfolio preferences (trading experience, risk tolerance, etc.)
- [ ] Step 3: Personal information (name auto-population, phone validation)
- [ ] Step 4: Tax information
- [ ] Step 5: Summary with edit links
- [ ] Progress persistence across page refreshes
- [ ] Edit functionality from summary

#### Trading Features
- [ ] Ticker symbol validation
- [ ] Order confirmation modal
- [ ] Balance checking
- [ ] Empty state handling

#### Analytics
- [ ] Empty state for no trades
- [ ] Portfolio performance charts
- [ ] Export functionality

#### General UX
- [ ] Responsive design
- [ ] Dark/light mode
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states

---

### **🆘 Support**

If you encounter any issues during testing:
1. Check the browser console for errors
2. Verify you're using the correct test credentials
3. Reset the database if needed using the commands above
4. Report any bugs with detailed reproduction steps

**Last Updated:** `date +%Y-%m-%d`
**Database Status:** Ready for UI/UX Testing ✅ 