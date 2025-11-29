import { expect, Page, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Credentials loaded from environment
export let username: string;
export let password: string;

// Initialize credentials - call this in test.beforeAll
export function initCredentials() {
  username = process.env.QA_USER!;
  password = process.env.QA_PASS!;

  if (!username || !password) {
    throw new Error('QA_USER and QA_PASS environment variables must be set');
  }
}

// Helper function to dismiss initial popup on login page - either "Allow all" or "OK"
export async function dismissLoginPopup(page: Page) {
  const allowAllButton = page.getByRole('button', { name: 'Allow all' });
  const okButton = page.getByRole('button', { name: 'OK', exact: true });

  // Wait for either button to appear
  await expect(allowAllButton.or(okButton)).toBeVisible();

  // Click whichever is visible
  if (await allowAllButton.isVisible().catch(() => false)) {
    await allowAllButton.click();
    await expect(allowAllButton).not.toBeVisible();
  } else if (await okButton.isVisible().catch(() => false)) {
    await okButton.click();
    await expect(okButton).not.toBeVisible();
  }
}

// Helper function to dismiss NPS survey if present
export async function dismissNpsSurvey(page: Page) {
  const okButton = page.getByRole('button', { name: 'OK', exact: true });
  if (await okButton.isVisible().catch(() => false)) {
    await okButton.click();
    await expect(okButton).not.toBeVisible();
  }
}

// Helper function to open user menu by clicking on username
export async function openUserMenu(page: Page) {
  // Click on the user profile button (contains @ symbol, located near Dashboard)
  const userMenuButton = page.locator(
    "//div[.//span[contains(text(), 'Dashboard')]]//button[contains(., '@')]"
  );
  await expect(userMenuButton).toBeVisible();
  await userMenuButton.click();
}

// Helper function to perform login
export async function login(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Dismiss initial popup (either "Allow all" or "OK")
  await dismissLoginPopup(page);

  await page.getByLabel('Email').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.waitForLoadState('domcontentloaded');
  // Wait for "Top up" button to consider page fully loaded (with extended timeout - only for login)
  await expect(page.getByRole('button', { name: 'Top up' })).toBeVisible({ timeout: 60000 });
}

// Helper to detect viewport type
export function getViewportType(page: Page): 'mobile' | 'desktop-small' | 'desktop-large' {
  const width = page.viewportSize()?.width || 1920;
  if (width < 768) return 'mobile';
  if (width < 1200) return 'desktop-small';
  return 'desktop-large';
}

// Helper to open mobile menu
export async function openMobileMenu(page: Page) {
  const menuButton = page
    .locator('button')
    .filter({ has: page.locator('svg') })
    .first();
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
  }
}

// Helper to find element by trying multiple name variants
export async function findMenuElement(
  page: Page,
  names: string[],
  viewportType?: 'mobile' | 'desktop-small' | 'desktop-large',
  isSubItem?: boolean
) {
  // In desktop-small mode, main menu items are icons with hidden text
  // Find the <li> containing the hidden text span and return it
  if (viewportType === 'desktop-small' && !isSubItem) {
    for (const name of names) {
      // Find <li> that contains a span with the menu text (text is hidden but exists in DOM)
      const menuItem = page.locator(`li:has(span:text-is("${name}"))`).first();
      if (await menuItem.isVisible().catch(() => false)) {
        return menuItem;
      }
    }
    // Fallback: try partial match
    for (const name of names) {
      const menuItem = page.locator(`li:has(span:text("${name}"))`).first();
      if (await menuItem.isVisible().catch(() => false)) {
        return menuItem;
      }
    }
    return page.locator(`li:has(span:text("${names[0]}"))`).first();
  }

  // For mobile and desktop-large, try text first
  for (const name of names) {
    const textElement = page.getByText(name, { exact: true }).first();
    if (await textElement.isVisible().catch(() => false)) {
      return textElement;
    }
    // Try link with accessible name
    const linkElement = page.getByRole('link', { name, exact: true }).first();
    if (await linkElement.isVisible().catch(() => false)) {
      return linkElement;
    }
    // Try alt text and return parent link
    const imgElement = page.getByAltText(name, { exact: true }).first();
    if (await imgElement.isVisible().catch(() => false)) {
      const parentLink = imgElement.locator('xpath=ancestor::a[1]');
      if ((await parentLink.count()) > 0) {
        return parentLink;
      }
      return imgElement;
    }
  }
  // Fallback: try partial match
  for (const name of names) {
    const textFallback = page.getByText(name).first();
    if (await textFallback.isVisible().catch(() => false)) {
      return textFallback;
    }
    const linkFallback = page.getByRole('link', { name }).first();
    if (await linkFallback.isVisible().catch(() => false)) {
      return linkFallback;
    }
  }
  const firstName = names[0] ?? '';
  return page.getByText(firstName).first();
}

// Helper to navigate to menu item based on viewport
export async function navigateToMenuItem(page: Page, menuNames: string[], subItemNames?: string[]) {
  const viewportType = getViewportType(page);

  if (viewportType === 'mobile') {
    await openMobileMenu(page);

    if (subItemNames && subItemNames.length > 0) {
      const firstMenuName = menuNames[0] ?? '';
      const firstSubItemName = subItemNames[0] ?? '';
      // Find the parent <li> that contains the menu text
      const menuItemLi = page.locator(`li:has(> span:has-text("${firstMenuName}"))`).first();
      // Search for subitem within the menu item's dropdown (ul inside the li)
      let subMenuLink = menuItemLi
        .locator('ul')
        .getByText(firstSubItemName, { exact: true })
        .first();
      const isSubMenuVisible = await subMenuLink.isVisible().catch(() => false);

      if (!isSubMenuVisible) {
        // Submenu not visible, click parent menu to expand
        const menuLink = await findMenuElement(page, menuNames, viewportType);
        await menuLink.scrollIntoViewIfNeeded().catch(() => {});
        await menuLink.click();
        // Re-find the element after click
        subMenuLink = menuItemLi.locator('ul').getByText(firstSubItemName, { exact: true }).first();
      }
      // Now submenu should be visible, scroll and click
      await subMenuLink.scrollIntoViewIfNeeded().catch(() => {});
      await subMenuLink.click();
    } else {
      const menuLink = await findMenuElement(page, menuNames, viewportType);
      await menuLink.scrollIntoViewIfNeeded().catch(() => {});
      await menuLink.click();
    }
  } else if (viewportType === 'desktop-small') {
    const menuItemLocator = await findMenuElement(page, menuNames, viewportType, false);
    await menuItemLocator.hover();

    if (subItemNames && subItemNames.length > 0) {
      const firstSubItemName = subItemNames[0] ?? '';
      // Search for subitem within the menu item's dropdown (ul inside the li)
      const subMenuLink = menuItemLocator
        .locator('ul')
        .getByText(firstSubItemName, { exact: true })
        .first();

      // Workaround for tricky JS that opens menu on mouse over sometimes:
      const isSubMenuVisible = await subMenuLink.isVisible().catch(() => false);
      if (!isSubMenuVisible) {
        await menuItemLocator.click();
      }

      await subMenuLink.hover().catch(() => {});
      await subMenuLink.click();
      // Hover over Dashboard to close any open menu
      await page.getByText('Dashboard', { exact: true }).hover();
    } else {
      await menuItemLocator.click();
    }
  } else {
    if (subItemNames && subItemNames.length > 0) {
      const firstSubItemName = subItemNames[0] ?? '';
      const menuItemLocator = await findMenuElement(page, menuNames, viewportType);
      // Search for subitem within the menu item's dropdown (ul inside the li)
      let subMenuLink = menuItemLocator
        .locator('ul')
        .getByText(firstSubItemName, { exact: true })
        .first();
      const isSubMenuVisible = await subMenuLink.isVisible().catch(() => false);

      if (!isSubMenuVisible) {
        // Submenu not visible, click parent menu to expand
        await menuItemLocator.scrollIntoViewIfNeeded().catch(() => {});
        await menuItemLocator.click();
        // Re-find the element after click
        subMenuLink = menuItemLocator
          .locator('ul')
          .getByText(firstSubItemName, { exact: true })
          .first();
      }
      // Scroll submenu into view and click (this waits for element to exist)
      await subMenuLink.scrollIntoViewIfNeeded().catch(() => {});
      await subMenuLink.click();
    } else {
      const menuItemLocator = await findMenuElement(page, menuNames, viewportType);
      await menuItemLocator.scrollIntoViewIfNeeded().catch(() => {});
      await menuItemLocator.click();
    }
  }

  await page.waitForLoadState();
}

// Screenshot verification with baseline wait
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
