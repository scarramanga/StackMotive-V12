// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to clean up test user from database
       * @example cy.cleanupTestUser('testuser+cypress@stackmotive.com')
       */
      cleanupTestUser(email: string): Chainable<void>
      
      /**
       * Custom command to wait for element to be visible and stable
       * @example cy.waitForStableElement('[data-testid="submit-button"]')
       */
      waitForStableElement(selector: string): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('cleanupTestUser', (email: string) => {
  // This command would clean up test users after tests
  // For now, we'll just log the cleanup attempt
  cy.log(`Cleanup test user: ${email}`)
  
  // In a real implementation, you might call an API endpoint to clean up test data
  // cy.request({
  //   method: 'DELETE',
  //   url: `${Cypress.env('API_URL')}/api/test/cleanup-user`,
  //   body: { email },
  //   failOnStatusCode: false
  // })
})

Cypress.Commands.add('waitForStableElement', (selector: string) => {
  return cy.get(selector)
    .should('be.visible')
    .and('not.be.disabled')
    .wait(500) // Small wait to ensure element is stable
})

// Export to make TypeScript happy
export {} 