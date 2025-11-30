import { Page } from '@playwright/test';

/**
 * Base page class providing common functionality for all page objects.
 *
 * All page objects should extend this class to inherit shared utilities
 * for element interaction, visibility checks, and page navigation.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Checks if an element is currently visible on the page.
   *
   * This is a non-throwing alternative to Playwright's default visibility checks.
   * Useful when you need to conditionally perform actions based on element presence
   * without failing the test.
   *
   * @param locator - The Playwright locator to check
   * @returns Promise resolving to true if visible, false otherwise (including on errors)
   */
  protected async isVisible(locator: ReturnType<Page['locator']>): Promise<boolean> {
    return locator.isVisible().catch(() => false);
  }

  /**
   * Scrolls an element into the viewport if it's not already visible.
   *
   * This is essential for elements in long lists or tables that may be outside
   * the current viewport. Many UI interactions (especially hover and click)
   * will fail silently or target wrong elements if the element isn't in view.
   *
   * @param locator - The Playwright locator to scroll into view
   *
   * @example
   * // Always scroll before interacting with table rows
   * await this.scrollIntoView(row);
   * await row.click();
   */
  protected async scrollIntoView(locator: ReturnType<Page['locator']>) {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
  }

  /**
   * Performs a hard page refresh (equivalent to Ctrl+F5).
   *
   * **Why this is needed:** This SPA doesn't automatically refresh data after
   * CRUD operations. After creating, editing, or deleting items, navigating
   * to the same page won't show updated data - you must explicitly reload.
   *
   * **Important:** Do NOT use 'networkidle' waitUntil option - it never resolves
   * in this application due to persistent connections.
   *
   * @example
   * await accountSettings.deleteSubscription(name);
   * await accountSettings.reloadPage(); // Required to see deletion reflected
   */
  async reloadPage() {
    await this.page.reload({ waitUntil: 'load' });
    await this.page.waitForLoadState('domcontentloaded');
  }
}
