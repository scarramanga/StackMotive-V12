import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5174',
    supportFile: 'client/cypress/support/e2e.ts',
    specPattern: 'client/cypress/e2e/**/*.cy.ts'
  }
}); 