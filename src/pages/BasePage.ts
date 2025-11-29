import { Page } from '@playwright/test';

/**
 * Base page class that all page objects extend.
 * Contains common functionality shared across all pages.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Navigate to a specific URL path
   */
  async goto(path: string = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Wait for page to finish loading
   */
  async waitForLoad() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get current page URL
   */
  getUrl(): string {
    return this.page.url();
  }

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

  /**
   * Wait for loading indicators to disappear
   */
  async waitForLoadingToComplete() {
    const loader = this.page.locator('.preloader').or(this.page.locator('.progressbar'));
    await loader.waitFor({ state: 'visible' }).catch(() => {});
    await loader.waitFor({ state: 'hidden' }).catch(() => {});
    await this.waitForLoad();
  }
}
