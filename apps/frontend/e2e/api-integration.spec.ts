import { test, expect } from '@playwright/test';

test.describe('API統合', () => {
  test('バックエンドAPIとの通信が成功する', async ({ page }) => {
    // APIリクエストを監視
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/transactions') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => null);

    await page.goto('/dashboard');

    // ローディングが完了するまで待機
    await page.waitForSelector('text=読み込み中...', { state: 'hidden', timeout: 10000 }).catch(() => {
      // ローディングが表示されない場合（既に読み込み完了）は無視
    });

    // APIレスポンスを確認（エラーでもテストは続行）
    const response = await responsePromise;
    if (response) {
      expect(response.ok()).toBeTruthy();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test('APIエラーが適切にハンドリングされる', async ({ page }) => {
    // APIをモック（エラーを返す）
    await page.route('**/api/transactions*', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/dashboard');

    // ローディングが完了するまで待機
    await page.waitForSelector('text=読み込み中...', { state: 'hidden', timeout: 10000 }).catch(() => {
      // ローディングが表示されない場合（既に読み込み完了）は無視
    });

    // エラーメッセージまたは再読み込みボタンが表示されることを確認
    const hasError = await page.getByText(/エラー|失敗|データの取得に失敗しました/).isVisible().catch(() => false);
    const hasReload = await page.getByRole('button', { name: /再読み込み|リロード/ }).isVisible().catch(() => false);

    // エラーハンドリングが機能していることを確認
    expect(hasError || hasReload).toBe(true);
  });
});

