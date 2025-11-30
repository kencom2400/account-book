/**
 * Playwright Global Setup
 *
 * すべてのE2Eテスト実行前に一度だけ実行されます。
 * テストデータの投入などの準備処理を行います。
 */

import { seedE2ETestData } from './helpers/test-data';

async function globalSetup(): Promise<void> {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('   🚀 E2E Global Setup');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    // バックエンドサーバーの起動を待つ
    // E2E環境のデフォルトポートは3021
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3021';

    // test-data.tsに環境変数を設定
    process.env.NEXT_PUBLIC_API_URL = API_BASE_URL;

    console.log(`📡 API Base URL: ${API_BASE_URL}`);
    const maxRetries = 30;
    const retryInterval = 1000; // 1秒

    console.log(`⏳ Waiting for backend server at ${API_BASE_URL}...`);

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health/institutions`);
        if (response.ok) {
          console.log('✅ Backend server is ready!');
          break;
        }
      } catch (_error) {
        if (i === maxRetries - 1) {
          throw new Error(`Backend server not available after ${maxRetries} retries`);
        }
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
    }

    // テストデータを投入
    await seedE2ETestData();

    console.log('\n✅ Global setup completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;
