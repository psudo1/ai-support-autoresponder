import { chromium, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    await page.goto('http://localhost:3000/auth/login');
    
    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'kevinyxl123@gmail.com');
    await page.fill('input[type="password"]', 'Kevin Liu');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for successful login - should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    // Verify we're logged in by checking for dashboard content
    // Use a more specific selector to avoid multiple h1 elements
    const dashboardHeading = page.getByRole('heading', { name: 'Dashboard' });
    await expect(dashboardHeading).toBeVisible({ timeout: 5000 });
    
    // Save authenticated state
    await page.context().storageState({ path: authFile });
  } catch (error) {
    console.error('Authentication setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;

