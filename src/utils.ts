import { expect, Page, TestInfo, Browser, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage, DashboardPage } from './pages';

/**
 * Get credentials from environment variables
 */
export function getCredentials() {
  const username = process.env.QA_USER;
  const password = process.env.QA_PASS;

  if (!username || !password) {
    throw new Error('QA_USER and QA_PASS environment variables must be set');
  }

  return { username, password };
}

/**
 * Shared session state for tests that need to reuse authenticated context
 */
export interface SharedSession {
  context: BrowserContext;
  page: Page;
  isInitialized: boolean;
}

/**
 * Create empty shared session state
 */
export function createSharedSession(): SharedSession {
  return {
    context: null as unknown as BrowserContext,
    page: null as unknown as Page,
    isInitialized: false,
  };
}

/**
 * Initialize shared session with authentication if not already initialized.
 * Call this in test.beforeEach to reuse a single authenticated session across tests.
 */
export async function initSharedSession(
  session: SharedSession,
  browser: Browser,
  testInfo: TestInfo
): Promise<void> {
  if (session.isInitialized) {
    return;
  }

  const { username, password } = getCredentials();
  const projectUse = testInfo.project.use;

  session.context = await browser.newContext({
    viewport: projectUse.viewport,
    userAgent: projectUse.userAgent,
    deviceScaleFactor: projectUse.deviceScaleFactor,
    isMobile: projectUse.isMobile,
    hasTouch: projectUse.hasTouch,
  });

  session.page = await session.context.newPage();

  const loginPage = new LoginPage(session.page);
  const dashboardPage = new DashboardPage(session.page);

  await loginPage.login(username, password);
  await dashboardPage.waitForDashboardLoad();

  session.isInitialized = true;
}

/**
 * Close shared session. Call this in test.afterAll.
 */
export async function closeSharedSession(session: SharedSession): Promise<void> {
  if (session.isInitialized) {
    await session.page.close();
    await session.context.close();
    session.isInitialized = false;
  }
}

/**
 * Screenshot verification with baseline wait
 */
export async function verifyPageScreenshot(page: Page, testInfo: TestInfo) {
  const baselineWaitMs = parseInt(process.env.BASELINE_WAIT_MS || '5000', 10);

  // Wait for loading indicators to disappear
  const loader = page.locator('.preloader').or(page.locator('.progressbar'));
  await loader.waitFor({ state: 'visible' }).catch(() => {});
  await loader.waitFor({ state: 'hidden' }).catch(() => {});

  await page.waitForLoadState();

  // Check if baseline screenshot exists, wait extra time if creating new one
  const snapshotPath = path.join(
    'screenshots',
    testInfo.project.name,
    `${testInfo.titlePath.join('-')}.png`
  );
  if (!fs.existsSync(snapshotPath)) {
    await page.waitForTimeout(baselineWaitMs);
  }

  await expect(page).toHaveScreenshot();
}
