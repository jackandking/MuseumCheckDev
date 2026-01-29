import { Page } from '@playwright/test';

/**
 * Listens for console errors and page errors while a test runs and exposes
 * an assertion helper that throws if any were captured.
 */
export function trackConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on('pageerror', error => {
    errors.push(`Uncaught exception: ${error.message}`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });

  return () => {
    if (errors.length > 0) {
      throw new Error(`Console errors detected on page:\n${errors.join('\n')}`);
    }
  };
}