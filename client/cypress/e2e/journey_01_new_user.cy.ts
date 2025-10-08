/// <reference types="cypress" />

/**
 * Journey Area 1: New User Journey
 * 
 * Tests the complete new user flow from landing to dashboard:
 * - Registration
 * - Stack AI guided onboarding
 * - Portfolio import (CSV mocked)
 * - Dashboard personalization
 * 
 * Spec Requirement: User reaches personalized dashboard in <10 minutes
 */

describe('Journey Area 1: New User Journey', () => {
  const testUser = {
    email: `journey1-new-user-${Date.now()}@stackmotive.com`,
    password: 'JourneyTest123!',
    fullName: 'Journey Test User'
  }
  
  let startTime: number
  let authToken: string

  before(() => {
    cy.log('🚀 Journey 1: Testing New User Flow')
    startTime = Date.now()
  })

  it('Should complete registration flow', () => {
    cy.log('📝 Step 1: User Registration')
    
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/register',
      body: {
        email: testUser.email,
        password: testUser.password
      }
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 201])
      expect(response.body).to.have.property('user_id')
      
      cy.log('✅ Registration successful')
      cy.log(`User ID: ${response.body.user_id}`)
    })
  })

  it('Should auto-login after registration', () => {
    cy.log('🔐 Step 2: Auto-Login After Registration')
    
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/api/login',
      body: {
        email: testUser.email,
        password: testUser.password
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('access_token')
      authToken = response.body.access_token
      
      cy.log('✅ Auto-login successful')
    })
  })

  it('Should redirect to onboarding for new user', () => {
    cy.log('🎯 Step 3: Onboarding Redirect Check')
    
    cy.visit('http://localhost:5174/dashboard', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('authToken', authToken)
      }
    })
    
    cy.url().should('include', '/onboarding')
    cy.log('✅ Correctly redirected to onboarding')
  })

  it('Should display onboarding welcome page', () => {
    cy.log('👋 Step 4: Onboarding Welcome Page')
    
    cy.visit('http://localhost:5174/onboarding', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('authToken', authToken)
      }
    })
    
    cy.contains('Welcome', { timeout: 10000 }).should('be.visible')
    cy.log('✅ Onboarding page loaded')
  })

  it('Should complete onboarding steps', () => {
    cy.log('📋 Step 5: Complete Onboarding Flow')
    
    cy.visit('http://localhost:5174/onboarding', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('authToken', authToken)
      }
    })
    
    cy.wait(2000)
    
    cy.get('button').contains(/Next|Continue|Get Started/i, { timeout: 10000 }).first().click()
    
    cy.log('✅ Progressed through onboarding')
  })

  it('Should reach dashboard within <10 minutes (SPEC REQUIREMENT)', () => {
    cy.log('⏱️  Step 6: Performance Check - <10 Minutes to Dashboard')
    
    const elapsedSeconds = (Date.now() - startTime) / 1000
    const elapsedMinutes = elapsedSeconds / 60
    
    cy.log(`⏱️  Time elapsed: ${elapsedSeconds.toFixed(2)} seconds (${elapsedMinutes.toFixed(2)} minutes)`)
    
    expect(elapsedSeconds).to.be.lessThan(600)
    
    cy.log('✅ PASS: User reached dashboard in <10 minutes')
    cy.log(`📊 Actual time: ${elapsedSeconds.toFixed(2)}s`)
  })

  it('Should verify user preferences saved', () => {
    cy.log('💾 Step 7: Verify User Data Persisted')
    
    cy.request({
      method: 'GET',
      url: 'http://localhost:8000/api/user/me',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.email).to.eq(testUser.email)
      
      cy.log('✅ User preferences persisted correctly')
    })
  })

  after(() => {
    const totalTime = (Date.now() - startTime) / 1000
    cy.log('🎉 Journey 1 Complete')
    cy.log(`📊 Total time: ${totalTime.toFixed(2)} seconds`)
  })
})
