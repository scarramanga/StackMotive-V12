#!/bin/bash

# 🔍 StackMotive Integration Test Setup Validator
# Quick check to ensure all test infrastructure is properly configured

echo "🔍 StackMotive Integration Test Setup Validator"
echo "==============================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success_count=0
total_checks=10

check_item() {
    local description=$1
    local command=$2
    echo -n "Checking $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        ((success_count++))
    else
        echo -e "${RED}❌${NC}"
    fi
}

echo -e "${BLUE}🔧 Test Infrastructure Validation${NC}"
echo ""

# 1. Check if Cypress is installed
check_item "Cypress installation" "npx cypress --version"

# 2. Check if Jest is configured
check_item "Jest configuration" "test -f jest.config.js"

# 3. Check if test files exist
check_item "MVP integration test file" "test -f client/cypress/e2e/mvp_integration_test_suite.cy.ts"

# 4. Check if test matrix exists
check_item "Integration test matrix" "test -f tests/integration_test_matrix.json"

# 5. Check if critical journey tests exist
check_item "Critical journey test documentation" "test -f tests/critical_user_journey_tests.md"

# 6. Check backend test directory
check_item "Backend test directory" "test -d tests/"

# 7. Check if Python pytest is available
check_item "Python pytest installation" "python -m pytest --version"

# 8. Check if test database schema exists
check_item "Test database schemas" "ls database/migrations/*.sql | head -1"

# 9. Check if Cypress fixtures exist
check_item "Cypress test fixtures" "test -f client/cypress/fixtures/testUsers.json"

# 10. Check if backend health endpoint is available (if servers are running)
check_item "Backend health endpoint (if running)" "curl -s http://localhost:8000/api/health"

echo ""
echo -e "${BLUE}📊 Validation Summary${NC}"
echo "======================"
echo -e "Checks passed: ${GREEN}$success_count${NC}/${total_checks}"

if [ $success_count -eq $total_checks ]; then
    echo -e "${GREEN}🎉 All checks passed! Integration test framework is ready.${NC}"
    echo ""
    echo -e "${BLUE}🚀 Ready to run integration tests:${NC}"
    echo "1. Start servers: npm run dev"
    echo "2. Run full test suite: ./scripts/run-integration-tests.sh"
    echo "3. Run specific tests: npx cypress run --spec 'client/cypress/e2e/mvp_integration_test_suite.cy.ts'"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please address the missing components.${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Setup commands:${NC}"
    echo "npm install cypress --save-dev"
    echo "npm install jest --save-dev"
    echo "pip install pytest"
    exit 1
fi 