import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
const useChromium = isCI || process.env.PLAYWRIGHT_BROWSER === 'chromium';

export default defineConfig({
  testDir: './e2e',
  timeout: 45 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    useChromium
      ? {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        }
      : {
          name: 'msedge',
          use: { ...devices['Desktop Chrome'], channel: 'msedge' },
        },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173',
    port: 5173,
    reuseExistingServer: !isCI,
    timeout: 60 * 1000,
  },
});
