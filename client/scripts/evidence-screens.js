import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EVIDENCE_DIR = join(__dirname, '../../docs/qa/evidence/phase16/journeys');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

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
    await page.waitForSelector('#root:has(div[data-testid="portfolio"])', { timeout: 15000 });
    console.log('Portfolio testid found');
  } catch {
    console.log('Portfolio testid not found, waiting for React content to render...');
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
    await page.waitForSelector('#root:has(div[data-testid="reports"])', { timeout: 15000 });
    console.log('Reports testid found');
  } catch {
    console.log('Reports testid not found, waiting for React content to render...');
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
  console.log('\n=== Journey 9: Proactive Notifications (Socket.IO) ===');
  
  let wsTrace = 'Journey 9 - Socket.IO WebSocket Trace\n';
  wsTrace += `Timestamp: ${new Date().toISOString()}\n`;
  wsTrace += `Protocol: Socket.IO (socket.io-client)\n\n`;
  
  let sawFrames = false;
  page.on('websocket', ws => {
    wsTrace += `[WebSocket URL] ${ws.url()}\n`;
    wsTrace += `[Expected] HTTP 101 Switching Protocols (handled by Socket.IO)\n\n`;
    ws.on('framesent', frame => {
      sawFrames = true;
      wsTrace += `[SENT] ${frame.payload.substring(0, 100)}...\n`;
    });
    ws.on('framereceived', frame => {
      sawFrames = true;
      wsTrace += `[RECV] ${frame.payload.substring(0, 100)}...\n`;
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
  
  // Wait for Socket.IO connection to establish
  console.log('Waiting for Socket.IO connection...');
  try {
    await page.waitForFunction(() => {
      return window.__SM_SOCKET_CONNECTED__ === true;
    }, { timeout: 15000 });
    console.log('Socket.IO connected successfully');
    wsTrace += '[Socket Connection] Established before notification trigger\n';
  } catch (e) {
    console.log('Warning: Socket.IO connection flag not detected within 15s');
    wsTrace += '[Socket Connection] Timeout waiting for connection flag\n';
  }
  
  // Trigger notification via backend endpoint
  try {
    console.log('Triggering test notification...');
    const notifResponse = await fetch(`${BACKEND_URL}/api/notifications/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'price_alert',
        message: 'Test notification for Journey 9 evidence'
      })
    });
    
    if (notifResponse.ok) {
      console.log('Notification endpoint responded OK, waiting for toast...');
      wsTrace += '[Notification API] POST /api/notifications/test → 200 OK\n';
      
      // Wait for notification toast to appear
      try {
        await page.waitForSelector('[data-testid="notification-toast"]', { timeout: 5000, state: 'attached' });
        console.log('Toast element detected');
        wsTrace += '[Toast] Notification toast appeared\n';
        await page.waitForTimeout(1000); // Brief pause for screenshot
      } catch (e) {
        console.log('Toast element not found in DOM');
        wsTrace += '[Toast] Element not detected (may be ephemeral)\n';
      }
    } else {
      wsTrace += `[Notification API] POST failed with status ${notifResponse.status}\n`;
    }
  } catch (e) {
    wsTrace += `\n[Error] Could not trigger test notification: ${e.message}\n`;
  }
  
  wsTrace += `\n[Frames Exchanged] ${sawFrames ? 'YES' : 'NO'}\n`;
  wsTrace += `[Status] Socket.IO connection ${sawFrames ? 'active' : 'not detected'}\n`;
  
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
