import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  snapshotDir: './screenshots',
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{testName}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : parseInt(process.env.WORKERS || '1', 10),
  reporter: 'html',
  timeout: 1200000,
  expect: {
    timeout: 30000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
    },
  },
  use: {
    baseURL: 'https://portal.servers.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on',
    actionTimeout: 20000,
    navigationTimeout: 60000,
    launchOptions: {
      slowMo: 100, // 0.1 second delay after each interaction
    },
    proxy: process.env.PROXY_SERVER
      ? {
          server: process.env.PROXY_SERVER,
          username: process.env.PROXY_USER,
          password: process.env.PROXY_PASS,
        }
      : undefined,
  },
  projects: [
    {
      name: 'desktop-large',
      use: {
        browserName: 'chromium',
        viewport: { width: 1400, height: 800 },
      },
    },
    {
      name: 'desktop-small',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 800, height: 700 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices[process.env.MOBILE_DEVICE || 'iPhone 15 Pro Max'],
      },
    },
  ],
});
