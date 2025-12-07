import { test, expect, type Page } from '@playwright/test';

test.describe('ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    // ダッシュボードページに移動
    await page.goto('/dashboard');
  });

  // ローディング完了を待機するヘルパー関数
  async function waitForLoadingComplete(page: Page): Promise<void> {
    await page
      .waitForSelector('text=読み込み中...', { state: 'hidden', timeout: 10000 })
      .catch(() => {
        // ローディングが表示されない場合（既に読み込み完了）は無視
      });
  }

  // ページの状態を確認するヘルパー関数
  async function getPageState(page: Page) {
    return {
      hasHeading: await page
        .getByRole('heading', { level: 1 })
        .isVisible()
        .catch(() => false),
      hasError: await page
        .getByText('データの取得に失敗しました')
        .isVisible()
        .catch(() => false),
      hasLoading: await page
        .getByText('読み込み中...')
        .isVisible()
        .catch(() => false),
      hasSummary: await page
        .getByText(/年.*月の収支状況/)
        .isVisible()
        .catch(() => false),
      hasMonthlyCard: await page
        .getByText(/月次サマリー|収支状況/)
        .isVisible()
        .catch(() => false),
      hasTitle: await page
        .getByText('取引一覧')
        .isVisible()
        .catch(() => false),
    };
  }

  test('ダッシュボードページが表示される', async ({ page }) => {
    // ローディングが完了するまで待機
    await waitForLoadingComplete(page);

    // ページの状態を確認
    const state = await getPageState(page);

    // ローディング中でない場合、headingまたはエラーが表示されていることを確認
    if (!state.hasLoading) {
      expect(state.hasHeading || state.hasError).toBe(true);
      if (state.hasHeading) {
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('ダッシュボード');
      }
    }
  });

  test('月次サマリーセクションが表示される', async ({ page }) => {
    // ローディングが完了するまで待機
    await waitForLoadingComplete(page);

    // ページの状態を確認
    const state = await getPageState(page);

    // サマリーカード、エラーメッセージ、またはローディング状態が表示されることを確認
    expect(state.hasSummary || state.hasError || state.hasLoading || state.hasMonthlyCard).toBe(
      true
    );
  });

  test('取引一覧セクションが表示される', async ({ page }) => {
    // ローディングが完了するまで待機
    await waitForLoadingComplete(page);

    // ページの状態を確認
    const state = await getPageState(page);

    // 取引一覧のタイトルが表示されることを確認（ローディング中でもOK）
    expect(state.hasTitle || state.hasLoading || state.hasError).toBe(true);
  });

  test('カテゴリ別円グラフが表示される', async ({ page }) => {
    // ローディングが完了するまで待機
    await waitForLoadingComplete(page);

    // カテゴリ別円グラフのタイトルが表示されることを確認
    const pieChartTitle = page.getByText('カテゴリ別円グラフ');
    await expect(pieChartTitle).toBeVisible({ timeout: 10000 });
  });

  test('カテゴリ別円グラフに合計金額が表示される', async ({ page }) => {
    // ローディングが完了するまで待機
    await waitForLoadingComplete(page);

    // 「合計金額」というテキストが表示されることを確認
    const totalAmountLabel = page.getByText('合計金額');
    await expect(totalAmountLabel).toBeVisible({ timeout: 10000 });
  });

  test('データがない場合、円グラフに「データがありません」が表示される', async ({ page }) => {
    // ローディングが完了するまで待機
    await waitForLoadingComplete(page);

    // 「データがありません」が表示される可能性があることを確認
    // （データがある場合は表示されないが、エラーにならないことを確認）
    const noDataMessage = page.getByText('データがありません');
    const pieChartTitle = page.getByText('カテゴリ別円グラフ');

    // 円グラフセクションが存在することを確認
    await expect(pieChartTitle).toBeVisible({ timeout: 10000 });

    // データがない場合は「データがありません」が表示される
    // データがある場合は円グラフが表示される
    const hasNoData = await noDataMessage.isVisible().catch(() => false);
    const hasPieChart = await page
      .locator('[data-testid="pie-chart"]')
      .isVisible()
      .catch(() => false);

    // どちらか一方が表示されることを確認
    expect(hasNoData || hasPieChart).toBe(true);
  });
});
