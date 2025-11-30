import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the Contact Info (detail) page.
 *
 * This page displays the details of a single subscription contact after
 * clicking on a contact name in the subscriptions table. It provides
 * navigation to the edit form.
 *
 * **Navigation flow:**
 * AccountSettingsPage (subscriptions table) → ContactInfoPage → NewContactPage (edit mode)
 *
 * @example
 * await accountSettings.openSubscription('John Doe');
 * await contactInfo.clickEdit();
 * await contactForm.fillAndSubmit(updatedData);
 */
export class ContactInfoPage extends BasePage {
  private readonly editButton = this.page.getByRole('button', { name: 'Edit' });

  constructor(page: Page) {
    super(page);
  }

  /**
   * Clicks the Edit button to navigate to the contact edit form.
   *
   * After clicking, you'll be on the NewContactPage in edit mode,
   * where the "Save" button (not "Create") will be shown.
   *
   * @example
   * await accountSettings.openSubscription('John Doe');
   * await contactInfo.clickEdit();
   * await contactForm.fillAndSubmit(newData); // Uses "Save" button
   */
  async clickEdit() {
    await this.editButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
