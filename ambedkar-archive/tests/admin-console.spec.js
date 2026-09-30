const { test, expect } = require('@playwright/test');

const ADMIN_URL = 'http://localhost:5000/admin.html';
const PUBLIC_URL = 'http://localhost:5000/index.html';

test.describe('Admin Console — 20-Point Production Hardening & Security Suite', () => {

  // TEST 1: Unauthenticated Admin access
  test('TEST 1: Admin page loads with valid institutional branding', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    const title = await page.title();
    expect(title).toContain('Institutional Administration Console');
    await expect(page.locator('.admin-masthead')).toBeVisible();
  });

  // TEST 2: Unauthenticated access blocked
  test('TEST 2: Unauthenticated user cannot access protected Admin functionality', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    await expect(page.locator('#admin-auth-gate')).toBeVisible();
    await expect(page.locator('#admin-main-portal')).toBeHidden();
  });

  // TEST 3: Real Admin authentication works
  test('TEST 3: Real Admin authentication works and opens portal', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    await page.fill('#gate-email', 'admin@ambedkar-archive.in');
    await page.fill('#gate-password', 'Admin@1234');
    await page.click('#gate-login-btn');

    await expect(page.locator('#admin-main-portal')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#admin-auth-gate')).toBeHidden();
    await expect(page.locator('#masthead-operator-role')).toHaveText('ADMIN');
  });

  // TEST 4: Normal visitor cannot access Admin API (403 Forbidden)
  test('TEST 4: Normal visitor cannot access Admin API (403 Forbidden)', async ({ request }) => {
    const visitorLogin = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'visitor@ambedkar-archive.in',
        password: 'Visitor@1234'
      }
    });
    const loginJson = await visitorLogin.json();
    expect(loginJson.success).toBeTruthy();
    const token = loginJson.token;

    const adminCall = await request.get('http://localhost:5000/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(adminCall.status()).toBe(403);
    const body = await adminCall.json();
    expect(body.success).toBeFalsy();
  });

  // TEST 5: Demo/test user cannot access Admin API
  test('TEST 5: Demo user cannot access Admin API (403 Forbidden)', async ({ request }) => {
    const demoLogin = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'researcher@ambedkar-archive.in',
        password: 'Research@1234'
      }
    });
    const demoJson = await demoLogin.json();
    const demoToken = demoJson.token;

    const adminCall = await request.get('http://localhost:5000/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${demoToken}` }
    });
    expect(adminCall.status()).toBe(403);
  });

  // TEST 6: Invalid credentials display error message
  test('TEST 6: Invalid credentials display error message without granting access', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    await page.fill('#gate-email', 'admin@ambedkar-archive.in');
    await page.fill('#gate-password', 'WrongPassword@9999');
    await page.click('#gate-login-btn');

    await expect(page.locator('#gate-error')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#admin-main-portal')).toBeHidden();
    await expect(page.locator('#admin-auth-gate')).toBeVisible();
  });

  // TEST 7: Expired or invalid token forces re-authentication gate
  test('TEST 7: Expired or forged token forces re-authentication gate', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    // Inject invalid forged token
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'forged.invalid.token.signature');
      localStorage.setItem('token', 'forged.invalid.token.signature');
    });
    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.locator('#admin-auth-gate')).toBeVisible();
    await expect(page.locator('#admin-main-portal')).toBeHidden();
  });

  // TEST 8: Page refresh preserves authenticated Admin session
  test('TEST 8: Page refresh preserves authenticated Admin session', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    await page.fill('#gate-email', 'admin@ambedkar-archive.in');
    await page.fill('#gate-password', 'Admin@1234');
    await page.click('#gate-login-btn');
    await expect(page.locator('#admin-main-portal')).toBeVisible({ timeout: 10000 });

    // Reload page
    await page.reload({ waitUntil: 'networkidle' });

    // Should remain logged in without re-showing the gate
    await expect(page.locator('#admin-main-portal')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#admin-auth-gate')).toBeHidden();
  });

  // TEST 9: Logout clears session tokens and restores auth gate
  test('TEST 9: Logout clears session tokens and restores auth gate', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    await page.fill('#gate-email', 'admin@ambedkar-archive.in');
    await page.fill('#gate-password', 'Admin@1234');
    await page.click('#gate-login-btn');
    await expect(page.locator('#admin-main-portal')).toBeVisible({ timeout: 10000 });

    // Click masthead logout
    await page.click('#btn-masthead-logout');

    // Tokens must be wiped
    const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(authToken).toBeNull();
    expect(token).toBeNull();

    await expect(page.locator('#admin-auth-gate')).toBeVisible({ timeout: 10000 });
  });

  // TEST 10: Admin dashboard real data
  test('TEST 10: Admin dashboard renders real data without fake or mock values', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    await page.fill('#gate-email', 'admin@ambedkar-archive.in');
    await page.fill('#gate-password', 'Admin@1234');
    await page.click('#gate-login-btn');
    await expect(page.locator('#admin-main-portal')).toBeVisible({ timeout: 15000 });

    const totalUsers = await page.locator('#stat-total-users').textContent();
    const activeUsers = await page.locator('#stat-active-users').textContent();
    const archiveAssets = await page.locator('#stat-archive-assets').textContent();
    const securityEvents = await page.locator('#stat-security-events').textContent();

    expect(totalUsers).not.toBe('undefined');
    expect(totalUsers).not.toBe('NaN');
    expect(parseInt(totalUsers, 10)).toBeGreaterThanOrEqual(1);

    expect(activeUsers).not.toBe('undefined');
    expect(archiveAssets).not.toBe('undefined');
    expect(securityEvents).not.toBe('undefined');
  });

  // TEST 11: No fake metrics
  test('TEST 11: Zero fake metrics or hardcoded staff counts on Admin console', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    await page.fill('#gate-email', 'admin@ambedkar-archive.in');
    await page.fill('#gate-password', 'Admin@1234');
    await page.click('#gate-login-btn');
    await expect(page.locator('#admin-main-portal')).toBeVisible({ timeout: 15000 });

    const demoCallout = page.locator('text=Institutional Demo Accounts:');
    await expect(demoCallout).toHaveCount(0);

    const activeResearchers = page.locator('#stat-active-researchers');
    await expect(activeResearchers).toHaveCount(0);

    const staffVerified = page.locator('#stat-staff-verified');
    await expect(staffVerified).toHaveCount(0);
  });

  // TEST 12: Curated Hub absent from Admin
  test('TEST 12: Curated Hub floating dock is strictly absent from Admin', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    const dock = page.locator('#global-floating-dock, .floating-dock, aside[aria-label="Curated exploration hubs"]');
    await expect(dock).toHaveCount(0);
  });

  // TEST 13: Curated Hub present publicly
  test('TEST 13: Public Curated Hub remains fully functional on public pages', async ({ page }) => {
    await page.goto(PUBLIC_URL, { waitUntil: 'networkidle' });
    const dock = page.locator('#global-floating-dock, .floating-dock, aside[aria-label="Curated exploration hubs"]').first();
    await expect(dock).toBeAttached();
  });

  // TEST 14: All 5 Admin sections
  test('TEST 14: Sidebar contains exactly 5 primary sections with subtabs', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    await page.fill('#gate-email', 'admin@ambedkar-archive.in');
    await page.fill('#gate-password', 'Admin@1234');
    await page.click('#gate-login-btn');
    await expect(page.locator('#admin-main-portal')).toBeVisible({ timeout: 15000 });

    const navItems = page.locator('.admin-nav-item');
    await expect(navItems).toHaveCount(5);

    // Verify labels
    const texts = await navItems.allTextContents();
    const joined = texts.join(' ');
    expect(joined).toContain('Overview');
    expect(joined).toContain('Users');
    expect(joined).toContain('Archive');
    expect(joined).toContain('Security');
    expect(joined).toContain('System');
  });

  // TEST 15: Sidebar scrolling
  test('TEST 15: Sidebar has vertical scroll styling (overflow-y: auto)', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    await page.fill('#gate-email', 'admin@ambedkar-archive.in');
    await page.fill('#gate-password', 'Admin@1234');
    await page.click('#gate-login-btn');
    await expect(page.locator('#admin-main-portal')).toBeVisible({ timeout: 15000 });

    const sidebar = page.locator('.admin-nav-sidebar');
    const overflowY = await sidebar.evaluate(el => window.getComputedStyle(el).overflowY);
    expect(['auto', 'scroll']).toContain(overflowY);
  });

  // TEST 16: Mobile 390x844
  test('TEST 16: Mobile viewport (390x844) has zero horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBeFalsy();
  });

  // TEST 17: Desktop viewport
  test('TEST 17: Desktop viewport (1440x900) layout integrity and responsive panels', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    await page.fill('#gate-email', 'admin@ambedkar-archive.in');
    await page.fill('#gate-password', 'Admin@1234');
    await page.click('#gate-login-btn');
    await expect(page.locator('#admin-main-portal')).toBeVisible({ timeout: 15000 });

    const sidebarVisible = await page.locator('.admin-nav-sidebar').isVisible();
    expect(sidebarVisible).toBeTruthy();
  });

  // TEST 18: No CSP violations (Strict CSP script-src-attr none)
  test('TEST 18: Strict CSP enforced on Admin with zero CSP violations', async ({ page }) => {
    const cspViolations = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Content Security Policy') || text.includes('violates') || text.includes('script-src')) {
        cspViolations.push(text);
      }
    });

    const response = await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    const cspHeader = response.headers()['content-security-policy'] || '';
    expect(cspHeader).toContain("script-src-attr 'none'");

    await page.fill('#gate-email', 'admin@ambedkar-archive.in');
    await page.fill('#gate-password', 'Admin@1234');
    await page.click('#gate-login-btn');
    await expect(page.locator('#admin-main-portal')).toBeVisible({ timeout: 15000 });

    // Click through buttons to ensure no inline attribute handlers fire CSP errors
    await page.click('#btn-refresh-overview');
    await page.waitForTimeout(300);

    expect(cspViolations).toEqual([]);
  });

  // TEST 19: No console errors
  test('TEST 19: Zero console errors during complete 5-section admin navigation', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    await page.fill('#gate-email', 'admin@ambedkar-archive.in');
    await page.fill('#gate-password', 'Admin@1234');
    await page.click('#gate-login-btn');
    await expect(page.locator('#admin-main-portal')).toBeVisible({ timeout: 15000 });

    await page.click('#tab-users-btn');
    await page.waitForTimeout(400);
    await page.click('#tab-archive-btn');
    await page.waitForTimeout(400);
    await page.click('#tab-security-btn');
    await page.waitForTimeout(400);
    await page.click('#tab-system-btn');
    await page.waitForTimeout(400);
    await page.click('#tab-overview-btn');
    await page.waitForTimeout(400);

    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon'));
    expect(criticalErrors).toEqual([]);
  });

  // TEST 20: No unexpected failed API requests
  test('TEST 20: Zero unexpected failed API requests during authenticated session', async ({ page }) => {
    const failedRequests = [];
    page.on('requestfailed', req => {
      failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
    });

    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    await page.fill('#gate-email', 'admin@ambedkar-archive.in');
    await page.fill('#gate-password', 'Admin@1234');
    await page.click('#gate-login-btn');
    await expect(page.locator('#admin-main-portal')).toBeVisible({ timeout: 15000 });

    const failedAdminCalls = failedRequests.filter(r => r.includes('/api/admin'));
    expect(failedAdminCalls).toEqual([]);
  });

});
