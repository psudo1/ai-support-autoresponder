import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should display dashboard page', async ({ page }) => {
    await page.goto('/');
    
    // Check if we're redirected to login or see dashboard
    const url = page.url();
    expect(url).toMatch(/\/(login|dashboard)/);
  });

  test('should show ticket statistics', async ({ page }) => {
    // Uses authenticated state from auth.setup.ts
    await page.goto('/dashboard');
    
    // Wait for dashboard to load - check for Dashboard heading
    await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 15000 });
    
    // Wait for stats section to be present
    // Stats are in a grid div with multiple stat cards
    await page.waitForSelector('div.grid', { timeout: 15000 });
    
    // Find the stats grid section (main content area, not sidebar)
    const mainContent = page.locator('main, [role="main"]').first();
    const statsSection = mainContent.locator('div.grid').first();
    await expect(statsSection).toBeVisible({ timeout: 5000 });
    
    // Verify stats text is visible within the stats section
    // Use .first() to handle multiple matches (sidebar vs stats)
    await expect(statsSection.locator('text=/Total Tickets/i').first()).toBeVisible({ timeout: 5000 });
    await expect(statsSection.locator('text=/New Tickets/i').first()).toBeVisible({ timeout: 5000 });
    await expect(statsSection.locator('text=/Resolved/i').first()).toBeVisible({ timeout: 5000 });
    await expect(statsSection.locator('text=/Knowledge Base/i').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Ticket Management', () => {
  test('should navigate to tickets page', async ({ page }) => {
    // Uses authenticated state from auth.setup.ts
    await page.goto('/dashboard/tickets');
    
    // Check if tickets page loads
    const url = page.url();
    expect(url).toMatch(/\/tickets/);
    
    // Verify page content
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should create a new ticket', async ({ page }) => {
    // Uses authenticated state from auth.setup.ts
    await page.goto('/dashboard/tickets/new');
    
    // Wait for form to be visible
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Wait for inputs to be ready
    await page.waitForSelector('input[placeholder*="subject" i], input[placeholder*="ticket subject" i]', { timeout: 5000 });
    
    // Fill in ticket form using placeholder text
    // Form uses controlled inputs, so we use placeholder-based selectors
    const subjectInput = page.getByPlaceholder(/enter ticket subject/i);
    await subjectInput.waitFor({ state: 'visible', timeout: 5000 });
    await subjectInput.fill('E2E Test Ticket');
    
    const messageInput = page.getByPlaceholder(/enter the customer's message/i);
    await messageInput.waitFor({ state: 'visible', timeout: 5000 });
    await messageInput.fill('This is an automated test ticket created by E2E tests');
    
    const emailInput = page.getByPlaceholder(/customer@example.com/i);
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill('e2e-test@example.com');
    
    // Optionally fill in customer name
    const customerNameInput = page.getByPlaceholder(/customer name/i);
    if (await customerNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await customerNameInput.fill('E2E Test Customer');
    }
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /create ticket/i });
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    await submitButton.click();
    
    // Wait for redirect to ticket detail page
    await page.waitForURL(/\/tickets\/[^\/]+$/, { timeout: 15000 });
    
    // Verify ticket was created (check URL)
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/\/tickets\/[^\/]+$/);
    
    // Verify ticket details are displayed
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Knowledge Base', () => {
  test('should navigate to knowledge base', async ({ page }) => {
    // Uses authenticated state from auth.setup.ts
    await page.goto('/dashboard/knowledge-base');
    
    // Check if knowledge base page loads
    const url = page.url();
    expect(url).toMatch(/\/knowledge-base/);
    
    // Verify page content
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should search knowledge base', async ({ page }) => {
    // Uses authenticated state from auth.setup.ts
    await page.goto('/dashboard/knowledge-base');
    
    // Wait for page to load
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    
    // Find search input and enter query
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('test query');
      await page.keyboard.press('Enter');
      
      // Wait for results or no results message
      await page.waitForTimeout(2000);
    } else {
      // If no search input, just verify page loaded
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
    }
  });
});

test.describe('Authentication', () => {
  test('should redirect to login when not authenticated', async ({ browser }) => {
    // Create a new context without authentication (no storageState)
    const context = await browser.newContext({
      storageState: undefined,
    });
    const page = await context.newPage();
    
    try {
      await page.goto('/dashboard');
      
      // Should redirect to login - wait for URL change
      await page.waitForURL(/\/login/, { timeout: 15000 });
      const url = page.url();
      expect(url).toMatch(/\/login/);
    } finally {
      await context.close();
    }
  });

  test('should show login form', async ({ browser }) => {
    // Create a new context without authentication to test login form
    const context = await browser.newContext({
      storageState: undefined,
    });
    const page = await context.newPage();
    
    try {
      await page.goto('/auth/login');
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      // Wait for login form to load - check for form or email input
      await page.waitForSelector('form, input[type="email"], input[name="email"], input[id="email"]', { timeout: 15000 });
      
      // Check for login form elements - try multiple selectors
      const emailInput = page.locator('input[type="email"], input[name="email"], input[id="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"], input[id="password"]').first();
      
      await expect(emailInput).toBeVisible({ timeout: 10000 });
      await expect(passwordInput).toBeVisible({ timeout: 10000 });
    } finally {
      await context.close();
    }
  });
});

