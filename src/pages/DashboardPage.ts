import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the dashboard page.
 */
export class DashboardPage extends BasePage {
  private readonly dashboardText = this.page.getByText('Dashboard');
  private readonly topUpButton = this.page.getByRole('button', { name: 'Top up' });
  private readonly userMenuButton = this.page.locator(
    "//div[.//span[contains(text(), 'Dashboard')]]//button[contains(., '@')]"
  );
  private readonly logoutButton = this.page.getByText('Logout', { exact: true });
  private readonly okButton = this.page.getByRole('button', { name: 'OK', exact: true });

  constructor(page: Page) {
    super(page);
  }

  /**
   * Wait for dashboard to fully load
   */
  async waitForDashboardLoad(timeout: number = 60000) {
    await expect(this.topUpButton).toBeVisible({ timeout });
  }

  /**
   * Perform logout (dismisses NPS survey if present)
   */
  async logout() {
    // Dismiss NPS survey if present
    if (await this.isVisible(this.okButton)) {
      await this.okButton.click();
      await expect(this.okButton).not.toBeVisible();
    }

    await expect(this.userMenuButton).toBeVisible();
    await this.userMenuButton.click();
    await this.logoutButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Check if dashboard is displayed
   */
  async isDashboardVisible(): Promise<boolean> {
    return this.isVisible(this.dashboardText);
  }

  /**
   * Assert dashboard is visible
   */
  async expectDashboardVisible() {
    await expect(this.dashboardText).toBeVisible();
  }

  /**
   * Assert URL contains dashboard
   */
  async expectDashboardUrl() {
    await expect(this.page).toHaveURL(/.*dashboard.*/);
  }
}
