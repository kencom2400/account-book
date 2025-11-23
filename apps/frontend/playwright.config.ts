import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * テスト環境の設定（dev/test/e2e）
 * TEST_ENV環境変数で切り替え可能
 */
const TEST_ENV: string = process.env.TEST_ENV || 'e2e';

// 環境別ポート設定
const getPortConfig = (env: string): { backendPort: string; frontendPort: string } => {
  switch (env) {
    case 'dev':
      return {
        backendPort: process.env.BACKEND_PORT_DEV || '3001',
        frontendPort: process.env.FRONTEND_PORT_DEV || '3000',
      };
    case 'test':
      return {
        backendPort: process.env.BACKEND_PORT_TEST || '3011',
        frontendPort: process.env.FRONTEND_PORT_TEST || '3010',
      };
    case 'e2e':
      return {
        backendPort: process.env.BACKEND_PORT_E2E || '3021',
        frontendPort: process.env.FRONTEND_PORT_E2E || '3020',
      };
    default:
      return {
        backendPort: '3001',
        frontendPort: '3000',
      };
  }
};

const { backendPort, frontendPort } = getPortConfig(TEST_ENV);

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
    baseURL: process.env.BASE_URL || `http://localhost:${frontendPort}`,
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
      command: 'cd ../.. && pnpm --filter @account-book/backend dev',
      url: `http://localhost:${backendPort}/api/health/institutions`,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ENCRYPTION_KEY:
          process.env.ENCRYPTION_KEY || 'dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcy1mb3ItZTJlLXRlc3Q=',
        CRYPTO_SALT: process.env.CRYPTO_SALT || 'dGVzdC1zYWx0LTE2LWJ5dGVz',
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: backendPort,
      },
    },
    // フロントエンドサーバー
    {
      command: 'cd ../.. && pnpm --filter @account-book/frontend dev',
      url: `http://localhost:${frontendPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        // フロントエンドポートを環境別に設定
        PORT: frontendPort,
        // バックエンドAPIのURLも環境別に設定
        NEXT_PUBLIC_API_URL: `http://localhost:${backendPort}`,
      },
    },
  ],
});
