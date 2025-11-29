import { test } from '@playwright/test';
import { SideMenuComponent } from '../src/pages';
import { generateMenuTestCases } from '../src/menu-data';
import {
  createSharedSession,
  initSharedSession,
  closeSharedSession,
  verifyPageScreenshot,
} from '../src/utils';

const TEST_CASES = generateMenuTestCases();
const session = createSharedSession();
let sideMenu: SideMenuComponent;

test.describe('Smoke Tests - Main Menu Navigation', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ browser }, testInfo) => {
    await initSharedSession(session, browser, testInfo);
    sideMenu = new SideMenuComponent(session.page);
  });

  test.afterAll(async () => {
    await closeSharedSession(session);
  });

  for (const testCase of TEST_CASES) {
    test(`should navigate to ${testCase.testName}`, async ({}, testInfo) => {
      await sideMenu.navigateTo(testCase.menuNames, testCase.subItemNames);
      await verifyPageScreenshot(session.page, testInfo);
    });
  }
});
