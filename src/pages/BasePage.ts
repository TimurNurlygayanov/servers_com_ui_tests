import { Page } from '@playwright/test';

/**
 * Base page class that all page objects extend.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Check if element is visible (non-throwing)
   */
  protected async isVisible(locator: ReturnType<Page['locator']>): Promise<boolean> {
    return locator.isVisible().catch(() => false);
  }

  /**
   * Safe scroll into view
   */
  protected async scrollIntoView(locator: ReturnType<Page['locator']>) {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
  }
}
