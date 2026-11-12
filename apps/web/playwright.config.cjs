const { defineConfig } = require('@playwright/test');
const path = require('node:path');
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.resolve(__dirname, '../../.local/browsers');
module.exports = defineConfig({ testDir: './test', testMatch: '*.spec.cjs', workers: 1,
  outputDir: '../../.local/playwright-results', reporter: 'list',
  use: { baseURL: process.env.CALENDAR_URL ?? 'http://localhost:8080', headless: true, viewport: { width: 1440, height: 900 }, locale: 'es-PE', timezoneId: 'America/Lima', trace: 'retain-on-failure' } });
