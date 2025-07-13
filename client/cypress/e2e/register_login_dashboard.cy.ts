describe('User Registration to Dashboard Flow', () => {
  const testEmail = `user_${Date.now()}@example.com`;
  const testPassword = 'StrongTestPass!123';

  it('registers a new user and redirects to onboarding', () => {
    cy.visit('/register');

    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('input[name="confirmPassword"]').type(testPassword);

    cy.get('button[type="submit"]').click();

    // Should redirect to onboarding
    cy.url().should('include', '/onboarding');
    cy.contains('Welcome').should('exist');
  });

  it('completes onboarding and redirects to paper account setup', () => {
    // Simulate onboarding steps
    cy.get('button').contains('Next').click();
    cy.get('button').contains('Next').click();
    cy.get('button').contains('Finish').click();

    // Should redirect to /paper-trading/new
    cy.url().should('include', '/paper-trading/new');
    cy.contains('Create Paper Trading Account').should('be.visible');
  });

  it('creates paper trading account and lands on dashboard', () => {
    cy.get('input[name="initialBalance"]').clear().type('50000');
    cy.get('button').contains('Create').click();

    // Final redirect to /dashboard
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.contains('Your Portfolio').should('exist');
  });

  it('logs out and logs back in successfully', () => {
    // Logout if button exists
    cy.get('button').contains('Logout').click();

    // Confirm logout
    cy.url().should('include', '/login');

    // Log back in
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Should go straight to dashboard (state persisted)
    cy.url().should('include', '/dashboard');
    cy.contains('Your Portfolio').should('exist');
  });
});

