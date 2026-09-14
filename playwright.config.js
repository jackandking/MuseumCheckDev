// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Detect which Playwright browsers are actually downloaded in the local cache.
// This lets the suite run immediately on a machine without downloading browsers:
// if bundled Chromium is missing we fall back to the locally installed Google
// Chrome (channel: 'chrome'). Running `npx playwright install` later makes the
// real bundled browsers (and firefox/webkit projects) light up automatically.
function browserInstalled(name) {
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  if (!fs.existsSync(cache)) return false;
  try {
    return fs.readdirSync(cache).some((d) => d.startsWith(name + '-'));
  } catch (e) {
    return false;
  }
}

const projects = [];

if (browserInstalled('chromium')) {
  projects.push({ name: 'chromium', use: { ...devices['Desktop Chrome'] } });
} else {
  // No bundled Chromium -> reuse the system Google Chrome (zero download).
  projects.push({
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], channel: 'chrome' },
  });
}

if (browserInstalled('firefox')) {
  projects.push({ name: 'firefox', use: { ...devices['Desktop Firefox'] } });
}

if (browserInstalled('webkit')) {
  projects.push({ name: 'webkit', use: { ...devices['Desktop Safari'] } });
}

module.exports = defineConfig({
  testDir: 'e2e',
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  use: {
    headless: true,
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
  },
  projects,
  webServer: {
    command: 'python3 -m http.server 8000',
    port: 8000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
