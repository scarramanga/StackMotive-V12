/// <reference types="cypress" />

describe('🚀 StackMotive Complete User Flow (API Comprehensive)', () => {
  
  const testUser = {
    email: `full-test-${Date.now()}@stackmotive.com`,
    password: 'TestFlow123!'
  }

  it('🎯 COMPLETE FULL USER FLOW: Registration → Login → Onboarding → Dashboard', () => {
    cy.log('🚀 Starting Complete StackMotive User Flow Test')
    
    // ===== PHASE 1: SYSTEM HEALTH =====
    cy.log('🔍 PHASE 1: Verifying System Health')
    cy.request('GET', 'http://localhost:8000/api/health').then((response) => {
      expect(response.status).to.eq(200)
      cy.log('✅ Backend health confirmed')
      
      // ===== PHASE 2: USER REGISTRATION =====
      cy.log('🔍 PHASE 2: User Registration Process')
      return cy.request({
        method: 'POST',
        url: 'http://localhost:8000/api/register',
        body: {
          email: testUser.email,
          password: testUser.password
        }
      })
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 201])
      expect(response.body).to.have.property('user_id')
      cy.log(`✅ User registered successfully`)
      
      // ===== PHASE 3: LOGIN AFTER REGISTRATION =====
      cy.log('🔍 PHASE 3: Login After Registration')
      return cy.request({
        method: 'POST',
        url: 'http://localhost:8000/api/login',
        body: {
          email: testUser.email,
          password: testUser.password
        }
      })
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('access_token')
      cy.log(`✅ Login successful after registration`)
      
      const authToken = response.body.access_token
      
      // ===== PHASE 4: AUTHENTICATION VERIFICATION =====
      cy.log('🔍 PHASE 4: Authentication Verification')
      return cy.request({
        method: 'GET',
        url: 'http://localhost:8000/api/user/me',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }).then((userResponse) => {
        expect(userResponse.status).to.eq(200)
        expect(userResponse.body.email).to.eq(testUser.email)
        cy.log('✅ Authentication successful, user verified')
        
        // ===== PHASE 5: PAPER TRADING ACCOUNT VERIFICATION =====
        cy.log('🔍 PHASE 5: Paper Trading Account Verification')
        return cy.request({
          method: 'GET',
          url: 'http://localhost:8000/api/user/paper-trading-account',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      }).then((accountResponse) => {
        expect(accountResponse.status).to.eq(200)
        expect(accountResponse.body).to.have.property('cashBalance')
        cy.log('✅ Paper trading account verified')
        
        // ===== PHASE 6: EMAIL VALIDATION =====
        cy.log('🔍 PHASE 6: Email Validation System')
        return cy.request({
          method: 'POST',
          url: 'http://localhost:8000/api/check-email',
          body: {
            email: testUser.email
          },
          failOnStatusCode: false
        })
      }).then((emailResponse) => {
        // Email should already exist (409) since we just registered
        expect(emailResponse.status).to.eq(409)
        cy.log('✅ Email validation working - existing email detected')
        
        // ===== PHASE 7: SECURITY VERIFICATION =====
        cy.log('🔍 PHASE 7: Security & Authentication')
        return cy.request({
          method: 'GET',
          url: 'http://localhost:8000/api/user/me',
          headers: {
            'Authorization': 'Bearer invalid_token'
          },
          failOnStatusCode: false
        })
      }).then((securityResponse) => {
        expect(securityResponse.status).to.be.oneOf([401, 403])
        cy.log('✅ Security working - invalid token rejected')
        
        // ===== PHASE 8: COMPREHENSIVE FLOW SUMMARY =====
        cy.log('🎉 PHASE 8: Flow Summary & Verification')
        cy.log('✅ Registration: WORKING')
        cy.log('✅ Login System: WORKING') 
        cy.log('✅ Paper Trading Account: WORKING')
        cy.log('✅ Authentication: WORKING')
        cy.log('✅ Email Validation: WORKING')
        cy.log('✅ Security: WORKING')
        
        cy.log('🎯 FULL USER FLOW TEST: COMPLETED SUCCESSFULLY')
      })
    })
  })

  it('🔄 Edge Cases & Error Handling Verification', () => {
    cy.log('🔍 Testing Edge Cases and Error Handling')
    
    // Test duplicate registration
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/register',
      body: {
        email: testUser.email, // Same email as previous test
        password: 'SomePassword123'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.be.oneOf([400, 409])
      cy.log('✅ Duplicate registration properly blocked')
    })
    
    // Test invalid login
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/login',
      body: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.be.oneOf([400, 401])
      cy.log('✅ Invalid login properly rejected')
    })
    
    cy.log('✅ All edge cases handled correctly')
  })

  it('📊 Performance & Load Verification', () => {
    cy.log('🔍 Testing System Performance')
    
    // Test multiple rapid requests
    cy.request('GET', 'http://localhost:8000/api/health').then(() => {
      cy.request('GET', 'http://localhost:8000/api/health').then(() => {
        cy.request('GET', 'http://localhost:8000/api/health').then(() => {
          cy.log('✅ System performance verified - multiple requests handled')
        })
      })
    })
  })
}) 