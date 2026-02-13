import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Ressoa AI E2E tests
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // Maximum time one test can run (60s for full flows with API calls)
  timeout: 60 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:5176',

    // Screenshot and trace on failure
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',

    // Browser viewport
    viewport: { width: 1280, height: 720 },
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web server configuration (start frontend dev server)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5176',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
