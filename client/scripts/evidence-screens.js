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
  let consoleErrors = [];
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
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
  
  // Step 1: Set auth token and navigate to dashboard
  console.log('Step 1: Setting auth token and navigating to dashboard...');
  await page.goto(FRONTEND_URL);
  await page.evaluate((token) => {
    localStorage.setItem('stackmotive_access_token', token);
  }, token);
  await page.goto(`${FRONTEND_URL}/dashboard`);
  wsTrace += '[Navigation] Loaded /dashboard with auth token\n';
  
  // Step 2: Wait for app-ready flag (providers mounted, theme hydrated)
  console.log('Step 2: Waiting for app-ready flag...');
  try {
    await page.waitForFunction(() => {
      return window.__SM_APP_READY__ === true;
    }, { timeout: 20000 });
    console.log('App ready flag detected');
    wsTrace += '[App Ready] Providers and theme hydrated\n';
  } catch (e) {
    console.log('Warning: App ready flag not detected, continuing anyway');
    wsTrace += '[App Ready] Timeout (continuing)\n';
  }
  
  // Step 3: Verify theme is applied (check for light/dark class or background color)
  console.log('Step 3: Verifying theme application...');
  try {
    const themeApplied = await page.evaluate(() => {
      const html = document.documentElement;
      const hasThemeClass = html.classList.contains('light') || html.classList.contains('dark');
      const bgColor = window.getComputedStyle(document.body).backgroundColor;
      return { hasThemeClass, bgColor };
    });
    console.log(`Theme status: class=${themeApplied.hasThemeClass}, bg=${themeApplied.bgColor}`);
    wsTrace += `[Theme] Applied (bg: ${themeApplied.bgColor})\n`;
  } catch (e) {
    console.log('Could not verify theme');
    wsTrace += '[Theme] Verification skipped\n';
  }
  
  // Step 4: Wait for Socket.IO connection
  console.log('Step 4: Waiting for Socket.IO connection...');
  
  // Check if socket is trying to connect
  const socketStatus = await page.evaluate(() => {
    return {
      flagExists: typeof window.__SM_SOCKET_CONNECTED__ !== 'undefined',
      flagValue: window.__SM_SOCKET_CONNECTED__,
      hasAuth: !!localStorage.getItem('stackmotive_access_token'),
      url: window.location.href
    };
  });
  console.log('Socket status check:', socketStatus);
  wsTrace += `[Socket Pre-check] Flag exists: ${socketStatus.flagExists}, Value: ${socketStatus.flagValue}, Has auth: ${socketStatus.hasAuth}\n`;
  
  try {
    await page.waitForFunction(() => {
      return window.__SM_SOCKET_CONNECTED__ === true;
    }, { timeout: 20000 });
    console.log('Socket.IO connected successfully');
    wsTrace += '[Socket Connection] ✓ Established\n';
  } catch (e) {
    console.log('Warning: Socket.IO connection flag not detected within 20s');
    wsTrace += '[Socket Connection] ✗ Timeout (20s)\n';
    
    // Final check
    const finalStatus = await page.evaluate(() => {
      return {
        flag: window.__SM_SOCKET_CONNECTED__,
        appReady: window.__SM_APP_READY__
      };
    });
    wsTrace += `[Socket Final State] Connected: ${finalStatus.flag}, App ready: ${finalStatus.appReady}\n`;
  }
  
  // Step 5: Trigger notification via backend endpoint (may fail if user lacks operator tier)
  console.log('Step 5: Attempting to trigger test notification...');
  let toastVisible = false;
  try {
    const notifResponse = await fetch(`${BACKEND_URL}/api/notifications/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Journey 9 E2E test notification'
      })
    });
    
    if (notifResponse.ok) {
      console.log('Notification API responded OK');
      wsTrace += '[Notification API] POST /api/notifications/test → 200 OK\n';
      
      // Step 6: Wait for toast to appear
      console.log('Step 6: Waiting for notification toast...');
      try {
        await page.waitForSelector('[data-testid="notification-toast"]', { 
          timeout: 5000, 
          state: 'visible' 
        });
        console.log('Toast visible in DOM');
        wsTrace += '[Toast] ✓ Visible (data-testid="notification-toast")\n';
        toastVisible = true;
        await page.waitForTimeout(1000); // Pause for visual confirmation
      } catch (e) {
        console.log('Toast element not visible within 5s');
        wsTrace += '[Toast] ✗ Not visible (timeout)\n';
      }
    } else {
      const statusText = notifResponse.statusText || notifResponse.status;
      console.log(`Notification API failed: ${notifResponse.status}`);
      wsTrace += `[Notification API] POST failed → ${notifResponse.status} ${statusText}\n`;
      wsTrace += '[Note] Endpoint requires operator tier; test user may lack permission\n';
    }
  } catch (e) {
    console.log(`Notification trigger error: ${e.message}`);
    wsTrace += `[Notification API] Error: ${e.message}\n`;
  }
  
  // Step 7: Final readiness check before screenshot
  console.log('Step 7: Final readiness check...');
  try {
    await page.waitForSelector('#root', { state: 'visible', timeout: 5000 });
    console.log('Root element visible');
  } catch (e) {
    console.log('Root element check failed');
  }
  
  // Add console errors if any
  if (consoleErrors.length > 0) {
    wsTrace += '\n[Console Errors]\n';
    consoleErrors.slice(0, 10).forEach(err => {
      wsTrace += `  - ${err.substring(0, 200)}\n`;
    });
  }
  
  // Summary
  wsTrace += `\n[Summary]\n`;
  wsTrace += `Frames Exchanged: ${sawFrames ? 'YES' : 'NO'}\n`;
  wsTrace += `Socket.IO Active: ${sawFrames ? 'YES' : 'NO'}\n`;
  wsTrace += `Toast Visible: ${toastVisible ? 'YES' : 'NO'}\n`;
  
  writeFileSync(
    join(EVIDENCE_DIR, 'journey9_notifications_ws.txt'),
    wsTrace
  );
  
  // Capture screenshot showing dashboard with theme and (ideally) toast
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
