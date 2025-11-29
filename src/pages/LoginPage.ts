import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the login page.
 */
export class LoginPage extends BasePage {
  // Locators
  private readonly emailInput = this.page.getByLabel('Email');
  private readonly passwordInput = this.page.getByLabel('Password');
  private readonly signInButton = this.page.getByRole('button', { name: 'Sign in' });
  private readonly allowAllButton = this.page.getByRole('button', { name: 'Allow all' });
  private readonly okButton = this.page.getByRole('button', { name: 'OK', exact: true });

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async navigate() {
    await this.goto('/');
  }

  /**
   * Dismiss cookie/consent popup if present
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
   * Fill in email field
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Fill in password field
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * Click sign in button
   */
  async clickSignIn() {
    await this.signInButton.click();
  }

  /**
   * Perform complete login flow
   */
  async login(email: string, password: string) {
    await this.navigate();
    await this.dismissPopup();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
    await this.waitForLoad();
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
