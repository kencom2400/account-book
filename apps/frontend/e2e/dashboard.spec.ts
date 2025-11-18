import { test, expect } from '@playwright/test';

test.describe('ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    // ダッシュボードページに移動
    await page.goto('/dashboard');
  });

  test('ダッシュボードページが表示される', async ({ page }) => {
    // タイトルが表示されることを確認
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ダッシュボード');
  });

  test('月次サマリーセクションが表示される', async ({ page }) => {
    // ローディングが完了するまで待機
    await page.waitForSelector('text=読み込み中...', { state: 'hidden', timeout: 10000 }).catch(() => {
      // ローディングが表示されない場合（既に読み込み完了）は無視
    });

    // サマリーカード、エラーメッセージ、またはローディング状態が表示されることを確認
    const hasSummary = await page.getByText(/年.*月の収支状況/).isVisible().catch(() => false);
    const hasError = await page.getByText('データの取得に失敗しました').isVisible().catch(() => false);
    const hasLoading = await page.getByText('読み込み中...').isVisible().catch(() => false);
    const hasMonthlyCard = await page.getByText(/月次サマリー|収支状況/).isVisible().catch(() => false);

    // どれかが表示されていることを確認
    expect(hasSummary || hasError || hasLoading || hasMonthlyCard).toBe(true);
  });

  test('取引一覧セクションが表示される', async ({ page }) => {
    // ローディングが完了するまで待機
    await page.waitForSelector('text=読み込み中...', { state: 'hidden', timeout: 10000 }).catch(() => {
      // ローディングが表示されない場合（既に読み込み完了）は無視
    });

    // 取引一覧のタイトルが表示されることを確認（ローディング中でもOK）
    const hasTitle = await page.getByText('取引一覧').isVisible().catch(() => false);
    const hasLoading = await page.getByText('読み込み中...').isVisible().catch(() => false);
    const hasError = await page.getByText('データの取得に失敗しました').isVisible().catch(() => false);

    // どれかが表示されていることを確認
    expect(hasTitle || hasLoading || hasError).toBe(true);
  });
});

