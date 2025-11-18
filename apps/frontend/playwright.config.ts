import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: process.env.CI
    ? [
        // CI環境ではchromiumのみ実行
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        // ローカル環境ではchromiumのみ実行（他のブラウザは必要に応じてインストール）
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        // Firefox、WebKit、モバイルブラウザは未インストールの可能性があるためスキップ
        // 必要に応じて `pnpm exec playwright install firefox webkit` を実行
      ],
  webServer: [
    // バックエンドサーバー
    {
      command: 'cd ../backend && pnpm dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcy1mb3ItZTJlLXRlc3Q=',
        CRYPTO_SALT: process.env.CRYPTO_SALT || 'dGVzdC1zYWx0LTE2LWJ5dGVz',
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: '3001',
      },
    },
    // フロントエンドサーバー
    {
      command: 'pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});

