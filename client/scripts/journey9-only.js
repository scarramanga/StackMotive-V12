import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EVIDENCE_DIR = join(__dirname, '../../docs/qa/evidence/phase16/journeys');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';

mkdirSync(EVIDENCE_DIR, { recursive: true });

async function registerOrLoginUser() {
  console.log('Attempting to register/login test user...');
  
  const registerResponse = await fetch(`${BACKEND_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'e2e@stackmotive.test',
      password: 'Passw0rd!',
      username: 'e2e_test_user'
    })
  });
  
  if (registerResponse.ok) {
    const data = await registerResponse.json();
    console.log('User registered successfully');
    return data.access_token;
  }
  
  const loginResponse = await fetch(`${BACKEND_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'e2e@stackmotive.test',
      password: 'Passw0rd!'
    })
  });
  
  if (loginResponse.ok) {
    const data = await loginResponse.json();
    console.log('User logged in successfully');
    return data.access_token;
  }
  
  throw new Error('Failed to register or login user');
}

async function captureJourney9(page, token) {
  console.log('\n=== Journey 9: Proactive Notifications (Phase 16.1) ===');
  
  let wsTrace = 'WebSocket Trace:\n';
  wsTrace += `Timestamp: ${new Date().toISOString()}\n\n`;
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Notifications') || text.includes('Socket') || text.includes('socket')) {
      wsTrace += `[Console ${msg.type()}] ${text}\n`;
    }
  });
  
  page.on('websocket', ws => {
    wsTrace += `[WS Connected] ${ws.url()}\n`;
    ws.on('framesent', frame => {
      wsTrace += `[SENT] ${frame.payload}\n`;
    });
    ws.on('framereceived', frame => {
      wsTrace += `[RECV] ${frame.payload}\n`;
    });
    ws.on('close', () => {
      wsTrace += `[WS Closed]\n`;
    });
  });
  
  await page.goto(FRONTEND_URL);
  await page.evaluate((token) => {
    localStorage.setItem('stackmotive_access_token', token);
  }, token);
  
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
  
  await page.waitForTimeout(2000);
  wsTrace += '\n[Waiting 2s for Socket.IO connection...]\n';
  
  try {
    console.log('Triggering test notification...');
    const notifResponse = await page.evaluate(async (token) => {
      const response = await fetch('/api/notify/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Test Alert',
          body: 'Phase16 evidence'
        })
      });
      return {
        ok: response.ok,
        status: response.status,
        data: await response.json().catch(() => ({ error: 'Failed to parse JSON' }))
      };
    }, token);
    
    if (notifResponse.ok) {
      console.log('Test notification triggered:', notifResponse.data);
      wsTrace += `\n[Test notification triggered: ${JSON.stringify(notifResponse.data)}]\n`;
      
      console.log('Waiting for notification toast...');
      try {
        await page.waitForSelector('[data-testid="notification-toast"]', { timeout: 15000 });
        console.log('✓ Notification toast appeared!');
        wsTrace += '[Toast element detected in DOM]\n';
        
        await page.waitForTimeout(1000);
      } catch (e) {
        console.warn('Warning: Toast did not appear within 15s:', e.message);
        wsTrace += `[Warning: Toast not detected - ${e.message}]\n`;
      }
    } else {
      console.error('Failed to trigger notification:', notifResponse.status, notifResponse.data);
      wsTrace += `\n[Error triggering notification: ${notifResponse.status} - ${JSON.stringify(notifResponse.data)}]\n`;
    }
  } catch (e) {
    console.error('Error triggering test notification:', e);
    wsTrace += `\n[Error: ${e.message}]\n`;
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
  console.log('Starting Journey 9 E2E evidence capture (Phase 16.1)...');
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  try {
    const token = await registerOrLoginUser();
    
    await captureJourney9(page, token);
    
    console.log('\n✅ Journey 9 evidence captured successfully!');
    console.log(`Evidence saved to: ${EVIDENCE_DIR}`);
  } catch (error) {
    console.error('Error during Journey 9 evidence capture:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
