import { defineConfig, devices } from '@playwright/test';

// The fixture pages stand in for your app. In a real project, set baseURL to your staging or
// production URL and ALLOWED_HOSTS to your own domains (BLUEPRINT 9.9 and 14.2, T4).
const PORT = 4173;

export default defineConfig({
  testDir: 'tests/privacy',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `node --disable-warning=ExperimentalWarning tests/privacy/serve-fixtures.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
