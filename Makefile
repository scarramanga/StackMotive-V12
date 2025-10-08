# StackMotive V12 - Test Automation

.PHONY: test-journey test-journey-verbose test-journey-ci help

help:
	@echo "StackMotive V12 Test Suite"
	@echo "  make test-journey          Run complete user journey E2E tests"
	@echo "  make test-journey-verbose  Run with verbose output"
	@echo "  make test-journey-ci       Run in CI mode (headless, with coverage)"

test-journey:
	@echo "🚀 Running StackMotive V12 User Journey E2E Tests..."
	@echo "📋 Testing 11 journey areas from spec..."
	@echo ""
	@echo ">>> Running Server-side E2E Tests..."
	cd server && pytest tests/e2e/ -v --maxfail=1
	@echo ""
	@echo ">>> Running Client-side Journey Tests..."
	cd client && npm run cypress:run -- --spec "cypress/e2e/journey_*.cy.ts"
	@echo ""
	@echo "✅ Journey tests complete"

test-journey-verbose:
	@echo "🔍 Running journey tests with verbose output..."
	cd server && pytest tests/e2e/ -vv -s
	cd client && npm run cypress:open

test-journey-ci:
	@echo "🔍 Running in CI mode with coverage..."
	cd server && pytest tests/e2e/ -v --cov=server --cov-report=html --cov-report=term
	cd client && npm run cypress:run -- --spec "cypress/e2e/journey_*.cy.ts" --browser chrome --headless
	@echo "📊 Coverage report generated at server/htmlcov/index.html"
