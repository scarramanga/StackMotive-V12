import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EVIDENCE_DIR = join(__dirname, '../../docs/qa/evidence/phase15/journeys');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';

mkdirSync(EVIDENCE_DIR, { recursive: true });

async function registerUser() {
  console.log('Registering test user...');
  const response = await fetch(`${BACKEND_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'e2e@stackmotive.test',
      password: 'Passw0rd!',
      username: 'e2e_test_user'
    })
  });
  
  if (!response.ok) {
    const existingLogin = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'e2e@stackmotive.test',
        password: 'Passw0rd!'
      })
    });
    
    if (existingLogin.ok) {
      const data = await existingLogin.json();
      console.log('User already exists, logged in successfully');
      return data.access_token;
    }
    throw new Error('Failed to register or login user');
  }
  
  const data = await response.json();
  console.log('User registered successfully');
  return data.access_token;
}

async function captureJourney7(page, token) {
  console.log('\n=== Journey 7: Portfolio Deep-Dive ===');
  
  await page.goto(FRONTEND_URL);
  await page.evaluate((token) => {
    localStorage.setItem('auth_token', token);
  }, token);
  
  await page.goto(`${FRONTEND_URL}/portfolio`);
  
  try {
    await page.waitForSelector('#root:has(div[data-testid="dashboard"])', { timeout: 15000 });
    console.log('Dashboard testid found');
  } catch {
    console.log('Dashboard testid not found, waiting for React content to render...');
    try {
      await page.waitForSelector('#root:has(div:not([class*="loading"]))', { timeout: 20000 });
      console.log('React content rendered');
    } catch {
      console.log('Fallback: waiting 20s for page to fully load...');
      await page.waitForTimeout(20000);
    }
  }
  
  const apiResponse = await fetch(`${BACKEND_URL}/api/portfolio/holdings`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const apiData = await apiResponse.json();
  writeFileSync(
    join(EVIDENCE_DIR, 'journey7_portfolio_api.json'),
    JSON.stringify(apiData, null, 2)
  );
  
  await page.screenshot({
    path: join(EVIDENCE_DIR, 'journey7_portfolio.png'),
    fullPage: false
  });
  
  console.log('✓ Journey 7 evidence captured');
}

async function captureJourney8(page, token) {
  console.log('\n=== Journey 8: Reports/Tax/Exports ===');
  
  await page.goto(`${FRONTEND_URL}/reports`);
  
  try {
    await page.waitForSelector('#root:has(div[data-testid="dashboard"])', { timeout: 15000 });
    console.log('Dashboard testid found');
  } catch {
    console.log('Dashboard testid not found, waiting for React content to render...');
    try {
      await page.waitForSelector('#root:has(div:not([class*="loading"]))', { timeout: 20000 });
      console.log('React content rendered');
    } catch {
      console.log('Fallback: waiting 20s for page to fully load...');
      await page.waitForTimeout(20000);
    }
  }
  
  try {
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Generate")').first();
    if (await exportButton.isVisible({ timeout: 5000 })) {
      await exportButton.click();
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    console.log('Export button not found, capturing current state');
  }
  
  const apiResponse = await fetch(`${BACKEND_URL}/api/reports/export`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ format: 'csv', report_type: 'tax' })
  });
  
  let logContent = `Export API Response:\nStatus: ${apiResponse.status}\n`;
  if (apiResponse.ok) {
    const responseData = await apiResponse.json();
    logContent += `Response: ${JSON.stringify(responseData, null, 2)}\n`;
  } else {
    logContent += `Error: ${await apiResponse.text()}\n`;
  }
  
  writeFileSync(
    join(EVIDENCE_DIR, 'journey8_reports_api.log'),
    logContent
  );
  
  await page.screenshot({
    path: join(EVIDENCE_DIR, 'journey8_reports.png'),
    fullPage: false
  });
  
  console.log('✓ Journey 8 evidence captured');
}

async function captureJourney9(page, token) {
  console.log('\n=== Journey 9: Proactive Notifications ===');
  
  let wsTrace = 'WebSocket Trace:\n';
  wsTrace += `Timestamp: ${new Date().toISOString()}\n\n`;
  
  page.on('websocket', ws => {
    wsTrace += `[WS Connected] ${ws.url()}\n`;
    ws.on('framesent', frame => {
      wsTrace += `[SENT] ${frame.payload}\n`;
    });
    ws.on('framereceived', frame => {
      wsTrace += `[RECV] ${frame.payload}\n`;
    });
  });
  
  await page.goto(`${FRONTEND_URL}/dashboard`);
  
  try {
    await page.waitForSelector('#root:has(div[data-testid="dashboard"])', { timeout: 15000 });
    console.log('Dashboard testid found');
  } catch {
    console.log('Dashboard testid not found, waiting for React content to render...');
    try {
      await page.waitForSelector('#root:has(div:not([class*="loading"]))', { timeout: 20000 });
      console.log('React content rendered');
    } catch {
      console.log('Fallback: waiting 20s for page to fully load...');
      await page.waitForTimeout(20000);
    }
  }
  
  try {
    const notifResponse = await fetch(`${BACKEND_URL}/api/notifications/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'price_alert',
        message: 'Test notification for evidence capture'
      })
    });
    
    if (notifResponse.ok) {
      await page.waitForTimeout(2000);
      wsTrace += '\n[Test notification triggered successfully]\n';
    }
  } catch (e) {
    wsTrace += `\n[Note: Could not trigger test notification - ${e.message}]\n`;
  }
  
  writeFileSync(
    join(EVIDENCE_DIR, 'journey9_notifications_ws.txt'),
    wsTrace
  );
  
  await page.screenshot({
    path: join(EVIDENCE_DIR, 'journey9_notifications.png'),
    fullPage: false
  });
  
  console.log('✓ Journey 9 evidence captured');
}

async function main() {
  console.log('Starting E2E evidence capture...');
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  try {
    const token = await registerUser();
    
    await captureJourney7(page, token);
    await captureJourney8(page, token);
    await captureJourney9(page, token);
    
    console.log('\n✅ All evidence captured successfully!');
    console.log(`Evidence saved to: ${EVIDENCE_DIR}`);
  } catch (error) {
    console.error('Error during evidence capture:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
