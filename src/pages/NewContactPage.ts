import { Page, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { BasePage } from './BasePage';

/**
 * Data structure representing a contact/subscription form fields.
 *
 * Required fields: firstName, lastName
 * All other fields are optional and will be filled only if provided.
 */
export interface ContactData {
  firstName: string;
  middleName?: string;
  lastName: string;
  nickname?: string;
  comments?: string;
  jobRoles?: ('Technical' | 'Billing' | 'Abuse' | 'Emergency')[];
  company?: string;
  jobTitle?: string;
  jobRole?: string;
  phoneNumber?: string;
  email?: string;
  secondaryEmail?: string;
}

/**
 * Generates randomized test data for creating a new contact.
 *
 * Uses faker.js to create realistic-looking data for all contact fields.
 * Each call generates unique data, making tests independent.
 *
 * **Important notes:**
 * - `phoneNumber` uses `style: 'international'` format to avoid "x" extensions
 *   that would be rejected by the form validation
 * - `nickname` is truncated to 4 characters to fit field constraints
 * - `jobRoles` randomly selects 1-2 roles from the available options
 *
 * @returns ContactData object with all fields populated
 *
 * @example
 * const data = generateTestContactData();
 * await contactForm.fillAndSubmit(data);
 * const fullName = `${data.firstName} ${data.lastName}`;
 */
export function generateTestContactData(): ContactData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const allRoles: ('Technical' | 'Billing' | 'Abuse' | 'Emergency')[] = [
    'Technical',
    'Billing',
    'Abuse',
    'Emergency',
  ];

  return {
    firstName,
    lastName,
    middleName: faker.person.middleName(),
    nickname: faker.person.firstName().slice(0, 4),
    comments: faker.lorem.sentence(),
    jobRoles: faker.helpers.arrayElements(allRoles, faker.number.int({ min: 1, max: 2 })),
    company: faker.company.name(),
    jobTitle: faker.person.jobTitle(),
    jobRole: faker.person.jobType(),
    // IMPORTANT: Use 'international' style to avoid "x" extensions that fail validation
    phoneNumber: faker.phone.number({ style: 'international' }),
    email: faker.internet.email({ firstName, lastName }),
    secondaryEmail: faker.internet.email({ firstName, lastName, provider: 'backup.example.com' }),
  };
}

/**
 * Page object for the New Contact / Edit Contact form.
 *
 * This form is used for both creating new contacts and editing existing ones.
 * The only difference is the submit button text ("Create" vs "Save").
 *
 * **Usage pattern:**
 * - For creating: Navigate to form via AccountSettingsPage.clickCreate()
 * - For editing: Navigate via AccountSettingsPage.openSubscription() + ContactInfoPage.clickEdit()
 *
 * @example
 * // Creating a new contact
 * await accountSettings.clickCreate();
 * await contactForm.fillAndSubmit(generateTestContactData());
 *
 * // Editing an existing contact
 * await accountSettings.openSubscription('John Doe');
 * await contactInfo.clickEdit();
 * await contactForm.fillAndSubmit(newData);
 */
export class NewContactPage extends BasePage {
  // Personal info fields
  private readonly firstNameInput = this.page.getByLabel('First name');
  private readonly middleNameInput = this.page.getByLabel('Middle name');
  private readonly lastNameInput = this.page.getByLabel('Last name');
  private readonly nicknameInput = this.page.getByLabel('Nickname');
  private readonly commentsTextarea = this.page.getByPlaceholder('Enter comments');

  // Job role checkboxes (can select multiple)
  private readonly technicalCheckbox = this.page.getByLabel('Technical');
  private readonly billingCheckbox = this.page.getByLabel('Billing');
  private readonly abuseCheckbox = this.page.getByLabel('Abuse');
  private readonly emergencyCheckbox = this.page.getByLabel('Emergency');

  // Company info fields
  private readonly companyInput = this.page.getByLabel('Company');
  private readonly jobTitleInput = this.page.getByLabel('Job title');
  // Using name attribute as this field doesn't have a proper label
  private readonly jobRoleInput = this.page.locator('input[name="tokens.role"]');

  // Contact info fields - using name attributes as labels are not unique
  private readonly phoneNumberInput = this.page.locator('input[name="phone_number"]');
  private readonly emailInput = this.page.locator('input[name="email"]');
  private readonly secondaryEmailInput = this.page.locator('input[name="email2"]');

  // Submit buttons - "Create" for new, "Save" for edit mode
  private readonly createButton = this.page.getByRole('button', { name: 'Create' });
  private readonly saveButton = this.page.getByRole('button', { name: 'Save' });
  // Success indicator - shown after successful form submission
  private readonly contactInfoHeading = this.page.getByRole('heading', { name: 'Contact info' });

  constructor(page: Page) {
    super(page);
  }

  /**
   * Asserts that the contact form is visible and ready for input.
   *
   * Use this to verify navigation to the form was successful before filling.
   */
  async expectFormVisible() {
    await expect(this.firstNameInput).toBeVisible();
    await expect(this.lastNameInput).toBeVisible();
  }

  /**
   * Fills the contact form with the provided data.
   *
   * Only fills fields that have values in the data object.
   * Required fields (firstName, lastName) are always filled.
   *
   * **Note:** This method does not submit the form. Call submit() or
   * fillAndSubmit() to complete the operation.
   *
   * @param data - Contact data to fill into the form
   */
  async fillForm(data: ContactData) {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);

    if (data.middleName) await this.middleNameInput.fill(data.middleName);
    if (data.nickname) await this.nicknameInput.fill(data.nickname);
    if (data.comments) await this.commentsTextarea.fill(data.comments);

    if (data.jobRoles) {
      const checkboxMap = {
        Technical: this.technicalCheckbox,
        Billing: this.billingCheckbox,
        Abuse: this.abuseCheckbox,
        Emergency: this.emergencyCheckbox,
      };
      for (const role of data.jobRoles) {
        await checkboxMap[role].check();
      }
    }

    if (data.company) await this.companyInput.fill(data.company);
    if (data.jobTitle) await this.jobTitleInput.fill(data.jobTitle);
    if (data.jobRole) await this.jobRoleInput.fill(data.jobRole);
    if (data.phoneNumber) await this.phoneNumberInput.fill(data.phoneNumber);
    if (data.email) await this.emailInput.fill(data.email);
    if (data.secondaryEmail) await this.secondaryEmailInput.fill(data.secondaryEmail);
  }

  /**
   * Clicks the submit button (Create or Save depending on form mode).
   *
   * Uses `.or()` to handle both new contact ("Create" button) and
   * edit contact ("Save" button) modes with a single locator.
   */
  async submit() {
    const submitButton = this.createButton.or(this.saveButton);
    await submitButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Waits for the success indicator after form submission.
   *
   * The "Contact info" heading appears on the contact detail page,
   * which is shown after successful create/save operations.
   */
  async waitForSuccess() {
    await this.contactInfoHeading.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Convenience method that fills the form, submits it, and waits for success.
   *
   * This is the recommended method for most test scenarios as it handles
   * the complete create/edit flow in one call.
   *
   * @param data - Contact data to fill and submit
   *
   * @example
   * const data = generateTestContactData();
   * await contactForm.fillAndSubmit(data);
   * // Form is now submitted and we're on the contact detail page
   */
  async fillAndSubmit(data: ContactData) {
    await this.fillForm(data);
    await this.submit();
    await this.waitForSuccess();
  }
}
