Simple WebUI Tests for servers.com
---

Playwright-based UI test automation using TypeScript and Page Object Model pattern.

# Setup

1. Install Node.js (v18 or higher)

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install
```

4. Create `.env` file with credentials:
```
QA_USER=your-email@example.com
QA_PASS=your-password

# Optional proxy settings
PROXY_SERVER=proxy.example.com:8080
PROXY_USER=proxy-username
PROXY_PASS=proxy-password
```

5. (Optional) Unpack reference screenshots:

If you have the password (same as `QA_PASS`), you can extract pre-made reference screenshots:
```bash
# Mac/Linux:
./scripts/unpack-screenshots.sh

# Windows (PowerShell):
powershell -ExecutionPolicy Bypass -File scripts/unpack-screenshots.ps1

# Or manually with any zip tool:
unzip -P <password> screenshots.zip
```

If you don't have the password, create your own reference screenshots (see "How To Run" section).

# How To Run

Run all UI tests in a desktop browser (good for debugging and demo):
```bash
npx playwright test --project=desktop-large --headed
```

Run all tests with mobile device simulation:
```bash
MOBILE_DEVICE="iPhone 14" npx playwright test --project=mobile --headed
```

Run only login and logout tests:
```bash
npx playwright test login_and_logout
```

Run smoke tests for side menu in a small browser window:
```bash
npx playwright test smoke_menu --project=desktop-small
```

View test report:
```bash
npx playwright show-report
```

Update reference screenshots:
```bash
npx playwright test --update-snapshots --project=desktop-large
```

# Project Structure

```
tests/
  login_and_logout.spec.ts   - Authentication tests
  smoke_menu.spec.ts         - Side menu navigation tests
src/
  pages/                     - Page Object Model classes
    BasePage.ts              - Base class with common utilities
    LoginPage.ts             - Login page interactions
    DashboardPage.ts         - Dashboard page interactions
    SideMenuComponent.ts     - Side menu navigation component
    index.ts                 - Barrel export
  utils.ts                   - Shared helper functions
  menu-data.ts               - Menu structure definition
scripts/
  pack-screenshots.sh        - Pack screenshots into encrypted archive
  unpack-screenshots.sh      - Unpack screenshots from archive
playwright.config.ts         - Playwright configuration
tsconfig.json                - TypeScript configuration
eslint.config.mjs            - ESLint configuration
.prettierrc                  - Prettier configuration
.env                         - Credentials (not committed)
screenshots.zip              - Encrypted reference screenshots
```

# Development

Run linting:
```bash
npm run lint
```

Format code:
```bash
npm run format
```

Type check:
```bash
npm run typecheck
```

# Limitations

The test suite covers the scenarios requested in the assessment task:
- Login / Logout (including browser session persistence)
- Smoke tests for side menu (with screenshot verification)

Tests cannot run in parallel because the server detects concurrent sessions as suspicious activity and returns 403 errors. My IP got banned during development, so I run tests via proxy. There is still a limitation on concurrent active sessions.

To work around this, side menu tests share a single authenticated session to speed up execution.

# Found Bugs

Several issues were found while creating automated tests:

1. **Performance**: WebUI is slow - login takes 10+ seconds for a simple empty test account. Page navigation takes several seconds even on repeat visits. Running the test suite consumes 100MB+ of traffic, indicating room for optimization.

2. **Responsive design**: WebUI is not properly adapted for mobile and small desktop screens. UI elements overflow their containers and extend outside the viewport.

3. **Duplicate headers**: Many pages have redundant headers. Consider removing large headers on pages with only one content block.

4. **JS errors**: Multiple JavaScript errors appear during test execution, mostly related to external service integrations.

5. **Menu overflow**: The "Reports" menu item becomes inaccessible on desktop when all other expandable menu items are open (menu has a height limit that hides overflow items).

6. **Inconsistent naming**: Sub-menu items use inconsistent capitalization - "Cloud Servers" vs "Cloud storage". Also, "Healthchecks" is written without a space - is this intentional?
