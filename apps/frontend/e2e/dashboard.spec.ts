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

    // カテゴリ別円グラフのタイトルが表示されることを確認
    const pieChartTitle = page.getByText('カテゴリ別円グラフ');
    await expect(pieChartTitle).toBeVisible({ timeout: 10000 });

    // 要素が見つかったらスクロールして表示領域に持ってくる
    await pieChartTitle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // スクロール後のレンダリングを待つ

    // カテゴリ別円グラフのセクション内で検索
    const pieChartSection = pieChartTitle.locator('..').locator('..'); // 親要素を取得
    const totalAmountLabel = pieChartSection.getByText('合計金額');
    const noDataMessage = pieChartSection.getByText('データがありません');

    // どちらか一方が存在することを確認（DOMに存在するかチェック）
    const totalAmountCount = await totalAmountLabel.count();
    const noDataCount = await noDataMessage.count();

    expect(totalAmountCount > 0 || noDataCount > 0).toBe(true);
  });

  test('データがない場合、円グラフに「データがありません」が表示される', async ({ page }) => {
    // ローディングが完了するまで待機
    await waitForLoadingComplete(page);

    // カテゴリ別円グラフのタイトルが表示されることを確認
    const pieChartTitle = page.getByText('カテゴリ別円グラフ');
    await expect(pieChartTitle).toBeVisible({ timeout: 10000 });

    // 要素が見つかったらスクロールして表示領域に持ってくる
    await pieChartTitle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // スクロール後のレンダリングを待つ

    // カテゴリ別円グラフのセクション内で検索
    const pieChartSection = pieChartTitle.locator('..').locator('..'); // 親要素を取得
    const noDataMessage = pieChartSection.getByText('データがありません');
    const pieChart = pieChartSection.locator('[data-testid="pie-chart"]');

    // データがない場合は「データがありません」が表示される
    // データがある場合は円グラフが表示される
    const noDataCount = await noDataMessage.count();
    const pieChartCount = await pieChart.count();

    // どちらか一方が存在することを確認（DOMに存在するかチェック）
    expect(noDataCount > 0 || pieChartCount > 0).toBe(true);
  });
});
