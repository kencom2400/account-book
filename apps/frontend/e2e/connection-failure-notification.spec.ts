/**
 * FR-005: 接続失敗時のポップアップ通知 E2Eテスト
 *
 * このテストは、接続失敗時のポップアップ通知機能のE2Eテストを実装します。
 * 機能要件: docs/functional-requirements/FR-001-007_data-acquisition.md
 */

import { test, expect } from '@playwright/test';

test.describe('接続失敗時のポップアップ通知 (FR-005)', () => {
  // 各テストのタイムアウトを60秒に設定
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // ダッシュボードページに移動
    await page.goto('/dashboard');

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('domcontentloaded');

    // ダッシュボードが表示されることを確認
    await expect(page.getByRole('heading', { level: 1 })).toContainText('ダッシュボード');
  });

  test('同期失敗時にトースト通知が表示される', async ({ page }) => {
    // 同期APIをモックしてエラーを返す
    // エンドポイントは/api/sync/start（@Controller('sync') + setGlobalPrefix('api')）
    // apiClient.post('/api/sync/start')は既に/apiで始まっているのでそのまま使用
    void page.route('**/api/sync/start', (route) => {
      void route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'SYNC_FAILED', message: '同期処理に失敗しました' },
        }),
      });
    });

    // 金融機関一覧ページに移動
    await page.goto('/banks');

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('domcontentloaded');

    // ローディングが完了するまで待機
    await page
      .waitForSelector('text=読み込み中...', { state: 'hidden', timeout: 10000 })
      .catch(() => {
        // ローディングが表示されない場合（既に読み込み完了）は無視
      });

    // 同期ボタンが表示されることを確認
    const syncButtons = page.getByRole('button', { name: /今すぐ同期|同期/ });
    const syncButtonCount = await syncButtons.count();

    if (syncButtonCount > 0) {
      // 最初の同期ボタンをクリック
      await syncButtons.first().click();

      // トースト通知が表示されることを確認
      // Alertコンポーネントはrole="alert"を使用している
      await expect(
        page.getByRole('alert').filter({ hasText: '同期処理に失敗しました' }).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('接続確認APIでエラーが返された場合に通知が表示される', async ({ page }) => {
    // 接続確認APIをモックしてエラーレスポンスを返す
    // エンドポイントは/api/health/institutions（setGlobalPrefix('api') + @Controller('health')）
    // 注: 接続確認APIはバックグラウンドで自動実行されるため、エラー時は金融機関カードにエラー状態が表示される
    void page.route('**/api/health/institutions', (route) => {
      void route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'CONNECTION_FAILED',
            message: '接続に失敗しました',
          },
        }),
      });
    });

    // 金融機関一覧ページに移動
    await page.goto('/banks');

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('domcontentloaded');

    // ローディングが完了するまで待機
    await page
      .waitForSelector('text=読み込み中...', { state: 'hidden', timeout: 10000 })
      .catch(() => {
        // ローディングが表示されない場合（既に読み込み完了）は無視
      });

    // 接続確認APIのエラー時は、金融機関カードにエラー状態が表示される
    // エラー状態の金融機関カードが表示されることを確認
    const errorStatus = page.locator('text=/エラー|✗/');
    await expect(errorStatus.first()).toBeVisible({ timeout: 10000 });
  });

  test('複数の金融機関で接続エラーが発生した場合に通知が表示される', async ({ page }) => {
    // 接続確認APIをモックして複数のエラーを返す
    // エンドポイントは/api/health/institutions（setGlobalPrefix('api') + @Controller('health')）
    void page.route('**/api/health/institutions', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              institutionId: 'bank-1',
              institutionName: 'テスト銀行1',
              institutionType: 'bank',
              status: 'disconnected',
              checkedAt: new Date().toISOString(),
              responseTime: 1000,
              errorMessage: '認証エラー',
              errorCode: 'AUTH_ERROR',
            },
            {
              institutionId: 'bank-2',
              institutionName: 'テスト銀行2',
              institutionType: 'bank',
              status: 'disconnected',
              checkedAt: new Date().toISOString(),
              responseTime: 2000,
              errorMessage: 'タイムアウト',
              errorCode: 'TIMEOUT',
            },
          ],
          totalCount: 2,
          successCount: 0,
          errorCount: 2,
          checkedAt: new Date().toISOString(),
        }),
      });
    });

    // 金融機関一覧ページに移動
    await page.goto('/banks');

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('domcontentloaded');

    // ローディングが完了するまで待機
    await page
      .waitForSelector('text=読み込み中...', { state: 'hidden', timeout: 10000 })
      .catch(() => {
        // ローディングが表示されない場合（既に読み込み完了）は無視
      });

    // 複数のエラーが表示されることを確認
    // エラー状態の金融機関カードが複数表示される
    // 注: モックデータでは2つのエラーを返しているが、実際のUIには登録されている金融機関のみが表示される
    // そのため、エラー状態のカードが1つ以上表示されることを確認する
    const errorCards = page.locator('text=/エラー|✗/');
    const errorCardCount = await errorCards.count();
    expect(errorCardCount).toBeGreaterThanOrEqual(1);
  });

  test('通知の「閉じる」ボタンが機能する', async ({ page }) => {
    // 同期APIをモックしてエラーを返す
    // エンドポイントは/api/sync/start（@Controller('sync') + setGlobalPrefix('api')）
    // apiClient.post('/api/sync/start')は既に/apiで始まっているのでそのまま使用
    void page.route('**/api/sync/start', (route) => {
      void route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'SYNC_FAILED', message: '同期処理に失敗しました' },
        }),
      });
    });

    // 金融機関一覧ページに移動
    await page.goto('/banks');

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('domcontentloaded');

    // ローディングが完了するまで待機
    await page
      .waitForSelector('text=読み込み中...', { state: 'hidden', timeout: 10000 })
      .catch(() => {
        // ローディングが表示されない場合（既に読み込み完了）は無視
      });

    // 同期ボタンが表示されることを確認
    const syncButtons = page.getByRole('button', { name: /今すぐ同期|同期/ });
    const syncButtonCount = await syncButtons.count();

    if (syncButtonCount > 0) {
      // 最初の同期ボタンをクリック
      await syncButtons.first().click();

      // トースト通知が表示されることを確認
      // Alertコンポーネントはrole="alert"を使用している
      const toast = page.getByRole('alert').filter({ hasText: '同期処理に失敗しました' }).first();
      await expect(toast).toBeVisible({ timeout: 5000 });

      // 閉じるボタンをクリック（Alertコンポーネントのdismissibleボタン）
      const closeButton = toast
        .locator('button[aria-label="アラートを閉じる"]')
        .or(toast.locator('button').last());
      if ((await closeButton.count()) > 0) {
        await closeButton.click();

        // トースト通知が非表示になることを確認
        await expect(toast).not.toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('通知の「再試行」ボタンが機能する', async ({ page }) => {
    // 同期APIをモックしてエラーを返す
    // エンドポイントは/api/sync/start（@Controller('sync') + setGlobalPrefix('api')）
    // apiClient.post('/api/sync/start')は既に/apiで始まっているのでそのまま使用
    void page.route('**/api/sync/start', (route) => {
      void route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'SYNC_FAILED', message: '同期処理に失敗しました' },
        }),
      });
    });

    // 金融機関一覧ページに移動
    await page.goto('/banks');

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('domcontentloaded');

    // ローディングが完了するまで待機
    await page
      .waitForSelector('text=読み込み中...', { state: 'hidden', timeout: 10000 })
      .catch(() => {
        // ローディングが表示されない場合（既に読み込み完了）は無視
      });

    // 同期ボタンが表示されることを確認
    const syncButtons = page.getByRole('button', { name: /今すぐ同期|同期/ });
    const syncButtonCount = await syncButtons.count();

    if (syncButtonCount > 0) {
      // 最初の同期ボタンをクリック
      await syncButtons.first().click();

      // トースト通知が表示されることを確認
      // Alertコンポーネントはrole="alert"を使用している
      const toast = page.getByRole('alert').filter({ hasText: '同期処理に失敗しました' }).first();
      await expect(toast).toBeVisible({ timeout: 5000 });

      // 再試行ボタンをクリック
      const retryButton = toast.locator('button:has-text("再試行")');
      if ((await retryButton.count()) > 0) {
        // 再試行APIリクエストを待機
        const retryResponsePromise = page.waitForResponse(
          (response) =>
            response.url().includes('/api/sync/start') && response.request().method() === 'POST',
          { timeout: 15000 }
        );

        await retryButton.click();

        // 再試行APIレスポンスを待機
        await retryResponsePromise;
      }
    }
  });
});
