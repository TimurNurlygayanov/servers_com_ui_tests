import { test, Page } from '@playwright/test';
import {
  LoginPage,
  DashboardPage,
  SideMenuComponent,
  AccountSettingsPage,
  NewContactPage,
  ContactInfoPage,
  generateTestContactData,
} from '../src/pages';
import { getCredentials } from '../src/utils';

let sideMenu: SideMenuComponent;
let accountSettings: AccountSettingsPage;
let contactForm: NewContactPage;
let contactInfo: ContactInfoPage;

async function login(page: Page) {
  const { username, password } = getCredentials();
  await new LoginPage(page).login(username, password);
  await new DashboardPage(page).waitForDashboardLoad();

  sideMenu = new SideMenuComponent(page);
  accountSettings = new AccountSettingsPage(page);
  contactForm = new NewContactPage(page);
  contactInfo = new ContactInfoPage(page);
}

async function goToAccountSettings() {
  await sideMenu.navigateTo(['Account Settings']);
}

async function refreshAccountSettings() {
  await goToAccountSettings();
  await accountSettings.reloadPage();
}

test.describe('Account Settings - Subscriptions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should create and delete a subscription', async () => {
    const data = generateTestContactData();
    const fullName = accountSettings.getFullName(data);

    // Create
    await goToAccountSettings();
    await accountSettings.clickCreate();
    await contactForm.fillAndSubmit(data);

    // Verify created
    await goToAccountSettings();
    await accountSettings.findAndVerifyExists(data.firstName, fullName);

    // Delete
    await accountSettings.deleteSubscription(fullName);

    // Verify deleted
    await refreshAccountSettings();
    await accountSettings.findAndVerifyNotExists(data.firstName);
  });

  test('should edit and delete a subscription', async () => {
    const initialData = generateTestContactData();
    const updatedData = generateTestContactData();
    const initialName = accountSettings.getFullName(initialData);
    const updatedName = accountSettings.getFullName(updatedData);

    // Create
    await goToAccountSettings();
    await accountSettings.clickCreate();
    await contactForm.fillAndSubmit(initialData);

    // Edit
    await goToAccountSettings();
    await accountSettings.openSubscription(initialName);
    await contactInfo.clickEdit();
    await contactForm.fillAndSubmit(updatedData);

    // Verify edited
    await refreshAccountSettings();
    await accountSettings.findAndVerifyNotExists(initialData.firstName);
    await accountSettings.findAndVerifyExists(updatedData.firstName, updatedName);

    // Delete
    await accountSettings.deleteSubscription(updatedName);

    // Verify deleted
    await refreshAccountSettings();
    await accountSettings.findAndVerifyNotExists(updatedData.firstName);
  });
});
