import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

const studentId = process.env.STUDENT_ID ?? 'UNSET';
// One HTML report per browser run: reports/<browser>/ (set by scripts/run-all.sh)
const reportDir = process.env.REPORT_DIR ?? 'reports/all';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  reporter: [
    ['list'],
    ['html', {
      outputFolder: reportDir,
      open: 'never',
      // "Run by: {StudentID}" must be visible in every report
      title: `Run by: ${studentId} | ${new Date().toISOString()}`,
    }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    locale: 'en-US', // toLocaleString() output must be the same in every browser
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
