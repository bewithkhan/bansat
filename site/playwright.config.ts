import { defineConfig, devices } from '@playwright/test';

// Tests run against the built site (npm run build first), served by `astro preview` at the same
// sub-path GitHub Pages uses.
const PORT = 4321;

export default defineConfig({
  testDir: 'tests',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx astro preview --host 127.0.0.1 --port ${PORT} --ignore-lock`,
    url: `http://127.0.0.1:${PORT}/bansat/`,
    reuseExistingServer: !process.env.CI,
  },
});
