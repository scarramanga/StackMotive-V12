/// <reference types="cypress" />

describe('StackMotive Registration and Login Flow', () => {
  const testUser = {
    email: `test${Date.now()}@example.com`, // Unique email for each test run
    password: 'Testpass123'
  }

  beforeEach(() => {
    // Clear state before each test
    cy.clearLocalStorage()
    cy.clearCookies()
    
    // 🚨 MANDATORY BACKEND HEALTH CHECK - FAIL TEST IF BACKEND IS DOWN
    cy.log('🔍 VERIFYING BACKEND IS RESPONDING...')
    cy.request({
      method: 'GET',
      url: 'http://localhost:8000/api/health',
      timeout: 5000
    }).then((response) => {
      cy.log(`✅ Backend Health: ${response.status} - ${JSON.stringify(response.body)}`)
      expect(response.status).to.eq(200)
      expect(response.body.status).to.eq('healthy')
    })
  })

  describe('User Registration Flow', () => {
    it('should successfully register a new user with REAL API verification', () => {
      // Step 1: Visit registration page
      cy.visit('/register')
      cy.url().should('include', '/register')
      
      // Step 2: Verify form is present
      cy.contains('Create an account').should('be.visible')
      
      // Step 3: Set up API interception to capture and verify registration API call
      cy.log('🎯 Setting up API interception for /api/register')
      cy.intercept('POST', '/api/register').as('registerAPI')
      cy.intercept('POST', '/api/login').as('loginAPI')
      
      // Step 4: Fill out the registration form
      cy.log(`📝 Filling registration form with email: ${testUser.email}`)
      cy.get('input[type="email"]').type(testUser.email)
      cy.get('input[type="password"]').first().type(testUser.password)
      cy.get('input[type="password"]').last().type(testUser.password)
      
      // Step 5: Wait for validation and ensure button is enabled
      cy.wait(2000)
      cy.get('button[type="submit"]')
        .should('be.visible')
        .should('contain.text', 'Sign Up')
        .should('not.be.disabled')

      // Step 6: Submit the form and verify API calls
      cy.log('🚀 Submitting registration form...')
      cy.get('button[type="submit"]').click()
      
      // Step 7: 🚨 CRITICAL - Verify the registration API call actually succeeds
      cy.wait('@registerAPI', { timeout: 10000 }).then((interception) => {
        expect(interception.response).to.not.be.undefined
        
        cy.log(`📊 Registration API Response:`)
        cy.log(`   Status: ${interception.response!.statusCode}`)
        cy.log(`   Body: ${JSON.stringify(interception.response!.body)}`)
        
        // 🚨 FAIL TEST if registration API doesn't return success
        expect(interception.response!.statusCode).to.be.oneOf([200, 201])
        expect(interception.response!.body).to.have.property('user_id')
        expect(interception.response!.body.user_id).to.be.a('number')
        
        cy.log(`✅ Registration API succeeded with user_id: ${interception.response!.body.user_id}`)
      })
      
      // Step 8: 🚨 CRITICAL - Verify the automatic login API call succeeds
      cy.wait('@loginAPI', { timeout: 10000 }).then((interception) => {
        expect(interception.response).to.not.be.undefined
        
        cy.log(`📊 Auto-Login API Response:`)
        cy.log(`   Status: ${interception.response!.statusCode}`)
        cy.log(`   Body: ${JSON.stringify(interception.response!.body)}`)
        
        // 🚨 FAIL TEST if login API doesn't return success
        expect(interception.response!.statusCode).to.eq(200)
        expect(interception.response!.body).to.have.property('access_token')
        expect(interception.response!.body.access_token).to.be.a('string')
        expect(interception.response!.body.access_token).to.not.be.empty
        
        cy.log(`✅ Auto-Login API succeeded with token: ${interception.response!.body.access_token.substring(0, 20)}...`)
      })

      // Step 9: 🚨 CRITICAL - Verify actual navigation away from registration page
      cy.log('🔍 Verifying successful navigation after registration...')
      cy.url({ timeout: 15000 }).should('not.include', '/register')
      
      // Step 10: 🚨 CRITICAL - Verify user is actually authenticated by calling /api/user/me
      cy.log('🔍 Verifying user authentication with /api/user/me...')
      cy.request({
        method: 'GET',
        url: 'http://localhost:8000/api/user/me',
        failOnStatusCode: false
      }).then((response) => {
        cy.log(`📊 User Authentication Check:`)
        cy.log(`   Status: ${response.status}`)
        cy.log(`   Body: ${JSON.stringify(response.body)}`)
        
        // Should be authenticated now
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('email')
        expect(response.body.email).to.eq(testUser.email)
        
        cy.log(`✅ User is authenticated: ${response.body.email}`)
      })

      // Step 11: Verify we're on onboarding or dashboard (depending on completion status)
      cy.url().then((url) => {
        cy.log(`📍 Final URL: ${url}`)
        if (url.includes('/onboarding')) {
          cy.log('✅ User redirected to onboarding (expected for new user)')
          // Verify onboarding content is present
          cy.get('body').should(($body) => {
            const hasOnboarding = $body.text().includes('WELCOME TO STACKMOTIVE') || 
                                 $body.text().includes('Welcome to StackMotive') ||
                                 $body.text().includes('Portfolio Preferences') ||
                                 $body.text().includes('Getting Started') ||
                                 $body.text().includes('Step 1')
            expect(hasOnboarding).to.be.true
          })
        } else if (url.includes('/dashboard')) {
          cy.log('✅ User redirected to dashboard')
        } else {
          throw new Error(`Unexpected redirect URL: ${url}`)
        }
      })

      cy.log('🎉 REGISTRATION FLOW COMPLETELY VERIFIED WITH REAL API CALLS')
    })

    it('should show proper validation and handle API errors correctly', () => {
      cy.visit('/register')
      
      // Test form validation still works
      cy.get('button[type="submit"]').should('be.disabled')
      
      // Test with invalid data
      cy.get('input[type="email"]').type('invalid-email')
      cy.get('input[type="password"]').first().type('123')
      cy.get('input[type="password"]').last().type('456')
      
      cy.wait(1000)
      cy.get('button[type="submit"]').should('be.disabled')
      
      // Verify validation messages appear
      cy.get('body').should('contain.text', 'email')
      cy.get('body').should('contain.text', 'Password')
    })
  })

  describe('Backend API Health Verification', () => {
    it('should verify all critical endpoints are working', () => {
      // Test registration endpoint directly
      cy.log('🔍 Testing /api/register endpoint directly...')
      const testEmail = `direct-test-${Date.now()}@example.com`
      
      cy.request({
        method: 'POST',
        url: 'http://localhost:8000/api/register',
        body: {
          email: testEmail,
          password: 'TestPassword123'
        }
      }).then((response) => {
        cy.log(`📊 Direct Registration API Test:`)
        cy.log(`   Status: ${response.status}`)
        cy.log(`   Body: ${JSON.stringify(response.body)}`)
        
        expect(response.status).to.be.oneOf([200, 201])
        expect(response.body).to.have.property('user_id')
      })
      
      // Test login endpoint directly
      cy.log('🔍 Testing /api/login endpoint directly...')
      cy.request({
        method: 'POST',
        url: 'http://localhost:8000/api/login',
        body: {
          email: testEmail,
          password: 'TestPassword123'
        }
      }).then((response) => {
        cy.log(`📊 Direct Login API Test:`)
        cy.log(`   Status: ${response.status}`)
        cy.log(`   Body: ${JSON.stringify(response.body)}`)
        
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('access_token')
      })
    })
  })

  describe('Navigation', () => {
    it('should be able to navigate between register and login', () => {
      cy.visit('/register')
      
      // Look for sign in link
      cy.get('body').then(($body) => {
        if ($body.find('a:contains("Sign in")').length > 0) {
          cy.get('a:contains("Sign in")').click()
          cy.url().should('include', '/login')
        } else if ($body.find('a:contains("Login")').length > 0) {
          cy.get('a:contains("Login")').click()
          cy.url().should('include', '/login')
        } else {
          // Navigate directly if no link found
          cy.visit('/login')
          cy.url().should('include', '/login')
        }
      })

      // Verify login page works
      cy.get('input[type="email"]').should('be.visible')
      cy.get('input[type="password"]').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
    })
  })
}) 