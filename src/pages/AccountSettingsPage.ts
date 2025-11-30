import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ContactData } from './NewContactPage';

/**
 * Page object for the Account Settings page, specifically the Subscriptions widget.
 *
 * This widget displays a table of subscription contacts with search, create,
 * edit, and delete functionality. All locators are scoped to the Subscriptions
 * widget region to avoid conflicts with other widgets on the page.
 *
 * @example
 * const accountSettings = new AccountSettingsPage(page);
 * await accountSettings.clickCreate();
 * await accountSettings.findAndVerifyExists('John', 'John Doe');
 * await accountSettings.deleteSubscription('John Doe');
 */
export class AccountSettingsPage extends BasePage {
  // All locators scoped to subscriptions widget to avoid matching elements in other widgets
  private readonly subscriptionsWidget = this.page
    .getByRole('region')
    .filter({ has: this.page.getByRole('heading', { name: 'Subscriptions' }) });

  private readonly createButton = this.subscriptionsWidget.getByRole('button', { name: 'Create' });
  // Using .first() because multiple searchboxes exist on the page; we want the one in subscriptions widget
  private readonly searchInput = this.subscriptionsWidget
    .getByRole('searchbox', { name: 'Search' })
    .first();
  private readonly noSubscriptionsFound =
    this.subscriptionsWidget.getByText('No subscriptions found');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Waits for the Subscriptions widget to be fully loaded and interactive.
   *
   * Call this after navigation or page reload to ensure the widget is ready
   * before performing any actions.
   */
  async waitForPageReady() {
    await this.createButton.waitFor({ state: 'visible' });
    await this.searchInput.waitFor({ state: 'visible' });
  }

  /**
   * Reloads the page and waits for the Subscriptions widget to be ready.
   *
   * **Important:** This override ensures we wait for widget-specific elements
   * after reload, not just generic page load events.
   *
   * @see BasePage.reloadPage for why reload is necessary after CRUD operations
   */
  async reloadPage() {
    await super.reloadPage();
    await this.waitForPageReady();
  }

  /**
   * Clicks the "Create" button to open the new contact form.
   *
   * Waits for page DOM to be ready after click before returning.
   */
  async clickCreate() {
    await this.createButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Filters the subscriptions table by entering a search term.
   *
   * The search is performed on the client side and filters results immediately.
   * Use first name only for searching - full name may not match due to how
   * the search algorithm works.
   *
   * @param term - Search term (typically first name)
   */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /**
   * Searches for a subscription and verifies it exists in the results.
   *
   * This is the preferred way to verify a contact was created/updated because:
   * 1. The subscriptions list may be long and the contact might not be visible
   * 2. Search narrows down results making verification reliable
   *
   * @param searchTerm - Term to search by (use first name only)
   * @param expectedFullName - The full name that should appear as a link in results
   * @throws Will timeout if the subscription is not found
   *
   * @example
   * await accountSettings.findAndVerifyExists('John', 'John Doe');
   */
  async findAndVerifyExists(searchTerm: string, expectedFullName: string) {
    await this.search(searchTerm);
    const link = this.subscriptionsWidget.getByRole('link', { name: expectedFullName });
    await link.waitFor({ state: 'visible' });
  }

  /**
   * Searches for a subscription and verifies it does NOT exist.
   *
   * Waits for the "No subscriptions found" message to confirm the search
   * returned no results.
   *
   * @param searchTerm - Term to search by (use first name only)
   * @throws Will timeout if subscriptions ARE found (opposite of expected)
   *
   * @example
   * await accountSettings.deleteSubscription('John Doe');
   * await accountSettings.reloadPage();
   * await accountSettings.findAndVerifyNotExists('John');
   */
  async findAndVerifyNotExists(searchTerm: string) {
    await this.search(searchTerm);
    await this.noSubscriptionsFound.waitFor({ state: 'visible' });
  }

  /**
   * Opens a subscription's detail page by clicking its name link.
   *
   * Scrolls the row into view first to ensure the click targets the correct element.
   *
   * @param fullName - The full name of the subscription to open (e.g., "John Doe")
   */
  async openSubscription(fullName: string) {
    const row = this.subscriptionsWidget
      .locator('tr')
      .filter({ has: this.page.getByRole('link', { name: fullName }) });
    await this.scrollIntoView(row);
    await row.getByRole('link', { name: fullName }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Deletes a subscription by clicking its trash icon and confirming the dialog.
   *
   * **Hacks applied:**
   * 1. `scrollIntoView` - Required because rows may be outside viewport in long lists
   * 2. `hover()` before click - The delete button only becomes reliably clickable after hover
   * 3. `dialog[open]` selector - Targets the native HTML dialog element when open
   * 4. `waitForTimeout(500)` - **Critical hack:** The confirmation dialog's JS event
   *    handlers take time to attach after the dialog becomes visible. Without this
   *    delay, clicking the Delete button results in a 405 "Method Not Allowed" error
   *    because the form submits before the JS handler can intercept it.
   *
   * @param fullName - The full name of the subscription to delete (e.g., "John Doe")
   *
   * @example
   * await accountSettings.deleteSubscription('John Doe');
   * await accountSettings.reloadPage(); // Required to see deletion reflected
   */
  async deleteSubscription(fullName: string) {
    const row = this.subscriptionsWidget
      .locator('tr')
      .filter({ has: this.page.getByRole('link', { name: fullName }) });
    await this.scrollIntoView(row);

    // Delete button identified by trash icon SVG ID
    const deleteBtn = row.locator('button:has(*[id="Icon/Trash"])');
    await deleteBtn.hover();
    await deleteBtn.click();

    // Confirm deletion in the modal dialog
    const dialog = this.page.locator('dialog[open]');
    await dialog.waitFor({ state: 'visible' });
    const confirmBtn = dialog.locator('button[type="submit"]', { hasText: 'Delete' });
    await confirmBtn.waitFor({ state: 'visible' });
    // HACK: Wait for JS event handlers to attach to the dialog form
    await this.page.waitForTimeout(500);
    await confirmBtn.hover();
    await confirmBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Constructs the full display name from contact data.
   *
   * The application displays contacts as "FirstName LastName" in the table.
   * Use this to build the expected name for verification and deletion.
   *
   * @param data - Contact data object containing firstName and lastName
   * @returns Full name string (e.g., "John Doe")
   */
  getFullName(data: ContactData): string {
    return `${data.firstName} ${data.lastName}`;
  }
}
