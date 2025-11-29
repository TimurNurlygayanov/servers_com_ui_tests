// Menu structure with items and their sub-items
interface SubItem {
  desktop: string;
  mobile?: string;
}

interface MenuItem {
  name: string;
  mobileName?: string;
  subItems?: SubItem[];
}

export const MENU_ITEMS: MenuItem[] = [
  {
    name: 'Dedicated Servers',
    subItems: [{ desktop: 'Manage' }, { desktop: 'Order' }],
  },
  {
    name: 'Cloud Servers',
    subItems: [
      { desktop: 'Create & Manage', mobile: 'Create & Manage' },
      { desktop: 'Snapshots & Backups', mobile: 'Snapshots' },
      { desktop: 'Images' },
      { desktop: 'Volumes' },
    ],
  },
  {
    name: 'Cloud Storage',
  },
  {
    name: 'Kubernetes',
  },
  {
    name: 'Load Balancers',
  },
  {
    name: 'Firewalls',
  },
  {
    name: 'Networks',
    subItems: [
      { desktop: 'Direct Connect' },
      { desktop: 'L2 Segments' },
      { desktop: 'DNS' },
      { desktop: 'VPN access' },
    ],
  },
  {
    name: 'Private Racks',
  },
  {
    name: 'Monitoring',
    subItems: [{ desktop: 'Healthchecks' }, { desktop: 'Notifications' }],
  },
  {
    name: 'SSL certificates',
    mobileName: 'SSL',
  },
  {
    name: 'Account settings',
    mobileName: 'Account',
  },
  {
    name: 'Identity and Access',
    mobileName: 'Identity',
    subItems: [{ desktop: 'SSH & GPG keys' }, { desktop: 'API tokens' }],
  },
  {
    name: 'Billing',
    subItems: [
      { desktop: 'Orders' },
      { desktop: 'Invoices' },
      { desktop: 'Group invoices' },
      { desktop: 'Account statement' },
      { desktop: 'Payment details' },
      { desktop: 'Top up balance' },
    ],
  },
  {
    name: 'Reports',
    subItems: [{ desktop: 'Cloud Servers' }, { desktop: 'Cloud Storage' }],
  },
  {
    name: 'Requests',
  },
];

export interface MenuTestCase {
  menuNames: string[];
  subItemNames?: string[];
  testName: string;
  isLastSubItem?: boolean;
}

export function generateMenuTestCases(): MenuTestCase[] {
  const testCases: MenuTestCase[] = [];

  for (const menuItem of MENU_ITEMS) {
    const menuNames = [menuItem.name];
    if (menuItem.mobileName) {
      menuNames.push(menuItem.mobileName);
    }

    if (menuItem.subItems && menuItem.subItems.length > 0) {
      const subItems = menuItem.subItems;
      for (let i = 0; i < subItems.length; i++) {
        const subItem = subItems[i];
        if (!subItem) continue;
        const subItemNames = [subItem.desktop];
        if (subItem.mobile) {
          subItemNames.push(subItem.mobile);
        }

        testCases.push({
          menuNames,
          subItemNames,
          testName: `${menuItem.name} > ${subItem.desktop}`,
          isLastSubItem: i === subItems.length - 1,
        });
      }
    } else {
      testCases.push({
        menuNames,
        testName: menuItem.name,
      });
    }
  }

  return testCases;
}
