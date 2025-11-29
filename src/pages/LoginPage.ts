import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the login page.
 */
export class LoginPage extends BasePage {
  private readonly emailInput = this.page.getByLabel('Email');
  private readonly passwordInput = this.page.getByLabel('Password');
  private readonly signInButton = this.page.getByRole('button', { name: 'Sign in' });
  private readonly allowAllButton = this.page.getByRole('button', { name: 'Allow all' });
  private readonly okButton = this.page.getByRole('button', { name: 'OK', exact: true });

  constructor(page: Page) {
    super(page);
  }

  /**
   * Dismiss cookie/consent popup
   */
  async dismissPopup() {
    await expect(this.allowAllButton.or(this.okButton)).toBeVisible();

    if (await this.isVisible(this.allowAllButton)) {
      await this.allowAllButton.click();
      await expect(this.allowAllButton).not.toBeVisible();
    } else if (await this.isVisible(this.okButton)) {
      await this.okButton.click();
      await expect(this.okButton).not.toBeVisible();
    }
  }

  /**
   * Perform complete login flow
   */
  async login(email: string, password: string) {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.dismissPopup();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Check if login form is displayed
   */
  async isLoginFormVisible(): Promise<boolean> {
    return (await this.isVisible(this.emailInput)) && (await this.isVisible(this.passwordInput));
  }

  /**
   * Assert login form is visible
   */
  async expectLoginFormVisible() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }
}
