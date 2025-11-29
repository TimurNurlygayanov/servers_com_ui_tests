import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

// Viewport type constants
const VIEWPORT_BREAKPOINTS = {
  MOBILE: 768,
  DESKTOP_SMALL: 1200,
} as const;

type ViewportType = 'mobile' | 'desktop-small' | 'desktop-large';

/**
 * Component object for the side menu navigation.
 */
export class SideMenuComponent extends BasePage {
  // Locators
  private readonly dashboardLink = this.page.getByText('Dashboard', { exact: true });
  private readonly mobileMenuButton = this.page
    .locator('button')
    .filter({ has: this.page.locator('svg') })
    .first();

  constructor(page: Page) {
    super(page);
  }

  /**
   * Detect current viewport type based on page width
   */
  getViewportType(): ViewportType {
    const width = this.page.viewportSize()?.width ?? 1920;
    if (width < VIEWPORT_BREAKPOINTS.MOBILE) return 'mobile';
    if (width < VIEWPORT_BREAKPOINTS.DESKTOP_SMALL) return 'desktop-small';
    return 'desktop-large';
  }

  /**
   * Open mobile menu (hamburger menu)
   */
  async openMobileMenu() {
    if (await this.isVisible(this.mobileMenuButton)) {
      await this.mobileMenuButton.click();
    }
  }

  /**
   * Find menu item by name(s), handling different viewport layouts
   */
  private async findMenuItem(names: string[], viewportType: ViewportType): Promise<Locator> {
    // Desktop-small: menu items are icons with hidden text
    if (viewportType === 'desktop-small') {
      for (const name of names) {
        const menuItem = this.page.locator(`li:has(span:text-is("${name}"))`).first();
        if (await this.isVisible(menuItem)) {
          return menuItem;
        }
      }
      // Fallback: partial match
      for (const name of names) {
        const menuItem = this.page.locator(`li:has(span:text("${name}"))`).first();
        if (await this.isVisible(menuItem)) {
          return menuItem;
        }
      }
      return this.page.locator(`li:has(span:text("${names[0]}"))`).first();
    }

    // Mobile and desktop-large: find by visible text
    for (const name of names) {
      const textElement = this.page.getByText(name, { exact: true }).first();
      if (await this.isVisible(textElement)) {
        return textElement;
      }

      const linkElement = this.page.getByRole('link', { name, exact: true }).first();
      if (await this.isVisible(linkElement)) {
        return linkElement;
      }
    }

    // Fallback: partial match
    for (const name of names) {
      const textFallback = this.page.getByText(name).first();
      if (await this.isVisible(textFallback)) {
        return textFallback;
      }
    }

    const firstName = names[0] ?? '';
    return this.page.getByText(firstName).first();
  }

  /**
   * Navigate to a menu item (with optional submenu)
   */
  async navigateTo(menuNames: string[], subItemNames?: string[]) {
    const viewportType = this.getViewportType();

    if (viewportType === 'mobile') {
      await this.navigateMobile(menuNames, subItemNames);
    } else if (viewportType === 'desktop-small') {
      await this.navigateDesktopSmall(menuNames, subItemNames);
    } else {
      await this.navigateDesktopLarge(menuNames, subItemNames);
    }

    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Mobile navigation logic
   */
  private async navigateMobile(menuNames: string[], subItemNames?: string[]) {
    await this.openMobileMenu();
    const firstMenuName = menuNames[0] ?? '';

    if (subItemNames && subItemNames.length > 0) {
      const firstSubItemName = subItemNames[0] ?? '';
      const menuItemLi = this.page.locator(`li:has(> span:has-text("${firstMenuName}"))`).first();
      let subMenuLink = menuItemLi
        .locator('ul')
        .getByText(firstSubItemName, { exact: true })
        .first();

      if (!(await this.isVisible(subMenuLink))) {
        const menuLink = await this.findMenuItem(menuNames, 'mobile');
        await this.scrollIntoView(menuLink);
        await menuLink.click();
        subMenuLink = menuItemLi.locator('ul').getByText(firstSubItemName, { exact: true }).first();
      }

      await this.scrollIntoView(subMenuLink);
      await subMenuLink.click();
    } else {
      const menuLink = await this.findMenuItem(menuNames, 'mobile');
      await this.scrollIntoView(menuLink);
      await menuLink.click();
    }
  }

  /**
   * Desktop-small navigation logic (icon-only sidebar)
   */
  private async navigateDesktopSmall(menuNames: string[], subItemNames?: string[]) {
    const menuItemLocator = await this.findMenuItem(menuNames, 'desktop-small');
    await menuItemLocator.hover();

    if (subItemNames && subItemNames.length > 0) {
      const firstSubItemName = subItemNames[0] ?? '';
      const subMenuLink = menuItemLocator
        .locator('ul')
        .getByText(firstSubItemName, { exact: true })
        .first();

      if (!(await this.isVisible(subMenuLink))) {
        await menuItemLocator.click();
      }

      await subMenuLink.hover().catch(() => {});
      await subMenuLink.click();

      // Hover over Dashboard to close menu
      await this.dashboardLink.hover();
    } else {
      await menuItemLocator.click();
    }
  }

  /**
   * Desktop-large navigation logic (full sidebar)
   */
  private async navigateDesktopLarge(menuNames: string[], subItemNames?: string[]) {
    if (subItemNames && subItemNames.length > 0) {
      const firstSubItemName = subItemNames[0] ?? '';
      const menuItemLocator = await this.findMenuItem(menuNames, 'desktop-large');
      let subMenuLink = menuItemLocator
        .locator('ul')
        .getByText(firstSubItemName, { exact: true })
        .first();

      if (!(await this.isVisible(subMenuLink))) {
        await this.scrollIntoView(menuItemLocator);
        await menuItemLocator.click();
        subMenuLink = menuItemLocator
          .locator('ul')
          .getByText(firstSubItemName, { exact: true })
          .first();
      }

      await this.scrollIntoView(subMenuLink);
      await subMenuLink.click();
    } else {
      const menuItemLocator = await this.findMenuItem(menuNames, 'desktop-large');
      await this.scrollIntoView(menuItemLocator);
      await menuItemLocator.click();
    }
  }
}
