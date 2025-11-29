import { test, expect, Page, BrowserContext, TestInfo } from '@playwright/test';
import { LoginPage, DashboardPage, SideMenuComponent } from '../src/pages';
import { generateMenuTestCases } from '../src/menu-data';
import * as fs from 'fs';
import * as path from 'path';

const TEST_CASES = generateMenuTestCases();

// Load credentials from environment
const getCredentials = () => {
  const username = process.env.QA_USER;
  const password = process.env.QA_PASS;

  if (!username || !password) {
    throw new Error('QA_USER and QA_PASS environment variables must be set');
  }

  return { username, password };
};

// Screenshot verification helper
async function verifyPageScreenshot(page: Page, testInfo: TestInfo) {
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

// Shared state across tests
let sharedContext: BrowserContext;
let sharedPage: Page;
let sideMenu: SideMenuComponent;
let isInitialized = false;

test.describe('Smoke Tests - Main Menu Navigation', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ browser }, testInfo) => {
    if (!isInitialized) {
      const { username, password } = getCredentials();
      const projectUse = testInfo.project.use;

      sharedContext = await browser.newContext({
        viewport: projectUse.viewport,
        userAgent: projectUse.userAgent,
        deviceScaleFactor: projectUse.deviceScaleFactor,
        isMobile: projectUse.isMobile,
        hasTouch: projectUse.hasTouch,
      });

      sharedPage = await sharedContext.newPage();

      // Login using page objects
      const loginPage = new LoginPage(sharedPage);
      const dashboardPage = new DashboardPage(sharedPage);

      await loginPage.login(username, password);
      await dashboardPage.waitForDashboardLoad();

      // Initialize side menu component
      sideMenu = new SideMenuComponent(sharedPage);
      isInitialized = true;
    }
  });

  test.afterAll(async () => {
    if (isInitialized) {
      await sharedPage.close();
      await sharedContext.close();
      isInitialized = false;
    }
  });

  for (const testCase of TEST_CASES) {
    test(`should navigate to ${testCase.testName}`, async (_, testInfo) => {
      await sideMenu.navigateTo(testCase.menuNames, testCase.subItemNames);
      await verifyPageScreenshot(sharedPage, testInfo);
    });
  }
});
