# 🧪 Cypress End-to-End Testing Guide for StackMotive

## 📋 Prerequisites

1. **Both servers must be running:**
   - Backend: `http://localhost:8000` (FastAPI server)
   - Frontend: `http://localhost:5173` (Vite dev server)

2. **Start the application:**
   ```bash
   npm run dev
   ```

## 🚀 Running Cypress Tests

### Option 1: Interactive Mode (Recommended for Development)
```bash
npm run test:e2e:open
# or
npm run cypress:open
```

This opens the Cypress Test Runner where you can:
- See tests run in real-time
- Debug failures step by step
- Inspect elements during test execution

### Option 2: Headless Mode (CI/Automated Testing)
```bash
npm run test:e2e
# or
npm run cypress:run
```

This runs all tests in the terminal without opening a browser window.

## 📁 Test Structure

```
client/cypress/
├── e2e/
│   └── registration.cy.ts     # Main registration and login flow tests
├── fixtures/
│   └── testUsers.json         # Test user data
├── support/
│   ├── commands.ts            # Custom Cypress commands
│   └── e2e.ts                 # Global configuration and setup
└── screenshots/               # Auto-generated on test failures
└── videos/                    # Auto-generated test recordings
```

## 🧪 Test Coverage

### ✅ Core Tests Included

1. **Registration Flow:**
   - Valid user registration
   - Auto-login after registration
   - Redirect to onboarding
   - Form validation errors

2. **Login Flow:**
   - Login with registered credentials
   - Logout functionality
   - Navigation handling

3. **UI Enhancements:**
   - Password strength indicator
   - Email uniqueness checking
   - Real-time form validation

### 🎯 Test User Details

**Primary Test User:**
- Email: `testuser+cypress@stackmotive.com`
- Password: `Testpass123`

This user is automatically created during tests and should be cleaned up afterward.

## 🔧 Configuration

### Cypress Configuration (`cypress.config.js`)
- **Base URL:** `http://localhost:5173`
- **API URL:** `http://localhost:8000`
- **Viewport:** 1280x720
- **Video:** Disabled (enable for debugging)
- **Screenshots:** Auto-generated on failures

### Environment Variables
Access in tests with `Cypress.env('API_URL')`

## 🐛 Debugging Tips

### 1. Test Failures
- Screenshots are automatically saved in `client/cypress/screenshots/`
- Check browser console in Cypress Test Runner
- Use `cy.pause()` to stop execution at specific points

### 2. Server Issues
Ensure both servers are running:
```bash
# Check frontend
curl http://localhost:5173

# Check backend
curl http://localhost:8000/api/user/me
```

### 3. Database State
Tests attempt to clean up test users, but manual cleanup may be needed:
```bash
# Connect to database and delete test users if needed
cd server
./venv/bin/python -c "
from database import get_db
from models.user import User
db = next(get_db())
test_user = db.query(User).filter(User.email == 'testuser+cypress@stackmotive.com').first()
if test_user:
    db.delete(test_user)
    db.commit()
    print('Test user cleaned up')
"
```

## 📊 Test Results

### Expected Results
- ✅ Registration with valid data → Success
- ✅ Auto-login after registration → Success  
- ✅ Redirect to onboarding → Success
- ✅ Form validation → Error messages shown
- ✅ Login with registered credentials → Success

### Common Issues
1. **Registration fails:** Check if email uniqueness validation is working
2. **Auto-login fails:** Verify auth context integration
3. **Navigation issues:** Check routing configuration
4. **Timeout errors:** Increase timeout values in test if server is slow

## 🔄 Continuous Integration

For CI/CD pipelines, use:
```bash
# Start servers in background
npm run dev &

# Wait for servers to be ready
npx wait-on http://localhost:5173 http://localhost:8000

# Run tests
npm run test:e2e

# Kill background processes
pkill -f "uvicorn\|vite"
```

## 🛠️ Customization

### Adding New Tests
1. Create new test files in `client/cypress/e2e/`
2. Follow the naming convention: `*.cy.ts`
3. Import custom commands from `support/commands.ts`

### Custom Commands
Extend `client/cypress/support/commands.ts` with app-specific commands:
```typescript
Cypress.Commands.add('loginAsTestUser', () => {
  cy.visit('/login')
  cy.get('input[type="email"]').type('test@stackmotive.com')
  cy.get('input[type="password"]').type('testpass123')
  cy.get('button[type="submit"]').click()
})
```

## 📝 Notes

- Tests are designed to be **non-destructive** to existing code
- Tests use realistic user interactions and timing
- Email uniqueness and password strength features are tested
- Tests include both positive and negative scenarios
- Cleanup functions help maintain test isolation

---

**Happy Testing! 🎉** 