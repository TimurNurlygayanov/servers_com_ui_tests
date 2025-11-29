import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from '../src/pages';

// Load credentials from environment
const getCredentials = () => {
  const username = process.env.QA_USER;
  const password = process.env.QA_PASS;

  if (!username || !password) {
    throw new Error('QA_USER and QA_PASS environment variables must be set');
  }

  return { username, password };
};

test.describe('Authentication', () => {
  test('should login successfully and see dashboard', async ({ page }) => {
    const { username, password } = getCredentials();
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.navigate();
    await loginPage.dismissPopup();
    await loginPage.fillEmail(username);
    await loginPage.fillPassword(password);
    await loginPage.clickSignIn();

    await dashboardPage.expectDashboardUrl();
    await dashboardPage.expectDashboardVisible();
  });

  test('should remember user session after browser restart', async ({ browser }) => {
    const { username, password } = getCredentials();

    // First session - login and save state
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.login(username, password);
    await dashboardPage.waitForDashboardLoad();

    const storageState = await context.storageState();
    await context.close();

    // Second session - restore state and verify
    const newContext = await browser.newContext({ storageState });
    const newPage = await newContext.newPage();
    const newLoginPage = new LoginPage(newPage);
    const newDashboardPage = new DashboardPage(newPage);

    await newLoginPage.goto('/');
    await newDashboardPage.expectDashboardVisible();
    expect(await newLoginPage.isLoginFormVisible()).toBe(false);

    await newContext.close();
  });

  test('should logout successfully and not see dashboard', async ({ page }) => {
    const { username, password } = getCredentials();
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Login
    await loginPage.login(username, password);
    await dashboardPage.waitForDashboardLoad();
    const postLoginUrl = page.url();

    // Logout
    await dashboardPage.logout();

    // Verify logged out
    await loginPage.expectLoginFormVisible();

    // Try to access protected page
    await page.goto(postLoginUrl, { waitUntil: 'domcontentloaded' });
    await loginPage.expectLoginFormVisible();
    expect(await dashboardPage.isDashboardVisible()).toBe(false);
  });
});
