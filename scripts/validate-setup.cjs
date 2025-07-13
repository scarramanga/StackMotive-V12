#!/usr/bin/env node

/**
 * StackMotive Environment Validation Script
 * Validates the complete environment setup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${timestamp} - ${message}`);
}

function checkFileExists(filePath, required = true) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log('green', `✓ Found: ${filePath}`);
    return true;
  } else {
    log(required ? 'red' : 'yellow', `${required ? '✗' : '⚠'} ${required ? 'Missing' : 'Optional'}: ${filePath}`);
    return false;
  }
}

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    log('red', `Error loading ${filePath}: ${error.message}`);
    return {};
  }
}

function validateEnvironmentConfig() {
  log('blue', 'Validating environment configuration...');
  
  const envFile = '.env';
  if (!checkFileExists(envFile)) {
    return false;
  }
  
  const env = loadEnvFile(envFile);
  const requiredVars = [
    'NODE_ENV',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY'
  ];
  
  let valid = true;
  
  requiredVars.forEach(varName => {
    if (!env[varName]) {
      log('red', `✗ Missing required environment variable: ${varName}`);
      valid = false;
    } else if (env[varName].includes('CHANGE_ME')) {
      log('yellow', `⚠ Environment variable needs update: ${varName}`);
    } else {
      log('green', `✓ Environment variable set: ${varName}`);
    }
  });
  
  return valid;
}

function checkDependencies() {
  log('blue', 'Checking dependencies...');
  
  const dependencies = [
    { name: 'Node.js', command: 'node --version', required: true },
    { name: 'npm', command: 'npm --version', required: true },
    { name: 'Python', command: 'python3 --version', required: true },
    { name: 'PostgreSQL', command: 'psql --version', required: false },
    { name: 'Docker', command: 'docker --version', required: false },
    { name: 'Docker Compose', command: 'docker-compose --version', required: false }
  ];
  
  let allRequired = true;
  
  dependencies.forEach(dep => {
    try {
      const version = execSync(dep.command, { encoding: 'utf8', stdio: 'pipe' }).trim();
      log('green', `✓ ${dep.name}: ${version}`);
    } catch (error) {
      if (dep.required) {
        log('red', `✗ Missing required dependency: ${dep.name}`);
        allRequired = false;
      } else {
        log('yellow', `⚠ Optional dependency not found: ${dep.name}`);
      }
    }
  });
  
  return allRequired;
}

function checkDirectoryStructure() {
  log('blue', 'Checking directory structure...');
  
  const requiredDirs = [
    'config',
    'scripts',
    'server',
    'client',
    'database'
  ];
  
  const optionalDirs = [
    'logs',
    'uploads',
    'backups',
    'cache',
    'tmp'
  ];
  
  let valid = true;
  
  requiredDirs.forEach(dir => {
    if (!checkFileExists(dir, true)) {
      valid = false;
    }
  });
  
  optionalDirs.forEach(dir => {
    checkFileExists(dir, false);
  });
  
  return valid;
}

function checkConfigFiles() {
  log('blue', 'Checking configuration files...');
  
  const configFiles = [
    { path: 'config/environments.ts', required: true },
    { path: 'config/env.development.template', required: true },
    { path: 'config/env.staging.template', required: true },
    { path: 'config/env.production.template', required: true },
    { path: 'Dockerfile', required: true },
    { path: 'docker-compose.yml', required: true },
    { path: 'docker-compose.production.yml', required: true },
    { path: 'package.json', required: true },
    { path: 'server/requirements.txt', required: false }
  ];
  
  let valid = true;
  
  configFiles.forEach(file => {
    if (!checkFileExists(file.path, file.required) && file.required) {
      valid = false;
    }
  });
  
  return valid;
}

function testDatabaseConnection() {
  log('blue', 'Testing database connection...');
  
  const env = loadEnvFile('.env');
  const dbHost = env.DB_HOST || 'localhost';
  const dbPort = env.DB_PORT || '5432';
  
  try {
    execSync(`pg_isready -h ${dbHost} -p ${dbPort}`, { stdio: 'pipe' });
    log('green', '✓ Database connection successful');
    return true;
  } catch (error) {
    log('yellow', '⚠ Database connection failed (this is normal if PostgreSQL is not running)');
    return false;
  }
}

function validateStripeConfig() {
  log('blue', 'Validating Stripe configuration...');
  
  const env = loadEnvFile('.env');
  let valid = true;
  
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PUBLISHABLE_KEY) {
    log('red', '✗ Stripe API keys not configured');
    valid = false;
  } else if (env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    log('green', '✓ Stripe test environment configured');
  } else if (env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
    log('yellow', '⚠ Stripe LIVE environment configured - be careful!');
  } else {
    log('red', '✗ Invalid Stripe secret key format');
    valid = false;
  }
  
  return valid;
}

function generateSetupReport() {
  log('blue', 'Generating setup report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      environmentConfig: validateEnvironmentConfig(),
      dependencies: checkDependencies(),
      directoryStructure: checkDirectoryStructure(),
      configFiles: checkConfigFiles(),
      databaseConnection: testDatabaseConnection(),
      stripeConfig: validateStripeConfig()
    }
  };
  
  const reportPath = 'setup-validation-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log('green', `✓ Setup report saved to: ${reportPath}`);
  
  return report;
}

function main() {
  console.log('\n🚀 StackMotive Environment Validation\n');
  console.log('=' * 50);
  
  const report = generateSetupReport();
  
  console.log('\n' + '=' * 50);
  console.log('📊 VALIDATION SUMMARY');
  console.log('=' * 50);
  
  const checks = report.checks;
  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  Object.entries(checks).forEach(([check, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${check}`);
  });
  
  console.log('\n📊 Score: ' + passedChecks + '/' + totalChecks + ' checks passed');
  
  if (passedChecks === totalChecks) {
    log('green', '🎉 All checks passed! Your environment is ready.');
    console.log('\n📋 Next steps:');
    console.log('  1. Start PostgreSQL: brew services start postgresql@14');
    console.log('  2. Run migrations: npm run migrate');
    console.log('  3. Start development server: npm run dev');
    console.log('  4. Start with Docker: docker-compose up');
  } else {
    log('yellow', '⚠️ Some checks failed. Review the output above.');
    console.log('\n📋 Recommended actions:');
    if (!checks.dependencies) {
      console.log('  1. Install missing dependencies');
    }
    if (!checks.environmentConfig) {
      console.log('  2. Update environment variables in .env');
    }
    if (!checks.databaseConnection) {
      console.log('  3. Start PostgreSQL database');
    }
  }
  
  console.log('\n💡 For help, run: ./scripts/setup-environment.sh --help');
  
  process.exit(passedChecks === totalChecks ? 0 : 1);
}

if (require.main === module) {
  main();
} 