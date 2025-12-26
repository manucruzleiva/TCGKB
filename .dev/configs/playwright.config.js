import { defineConfig, devices } from '@playwright/test';

// Environment-based URL configuration
const baseURLs = {
  local: 'http://localhost:5176',
  staging: 'https://staging.tcgkb.app',
  production: 'https://tcgkb.app',
};

const testEnv = process.env.TEST_ENV || 'staging';
const baseURL = baseURLs[testEnv] || baseURLs.local;
const isRemote = testEnv !== 'local';

export default defineConfig({
  testDir: '../tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],  // Real-time progress in terminal
    ['allure-playwright', { outputFolder: 'allure-results' }],
    ['html', { outputFolder: 'playwright-report' }]
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Only start local server when testing locally
  ...(isRemote ? {} : {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:5176',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  }),
});
