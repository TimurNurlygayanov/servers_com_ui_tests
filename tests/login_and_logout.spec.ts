import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from '../src/pages';
import { getCredentials } from '../src/utils';

test.describe('Authentication', () => {
  test('should login successfully and see dashboard', async ({ page }) => {
    const { username, password } = getCredentials();
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.login(username, password);

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

    await newPage.goto('/', { waitUntil: 'domcontentloaded' });
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
