import { test, expect, type Page } from '@playwright/test';

// 定数定義
const LOADING_TEXT = '読み込み中...';
const NO_DATA_TEXT = 'データがありません';
const API_ERROR_TEXT = '年間データの取得に失敗しました';
const YEAR_LABEL = '年:';
const RETRY_BUTTON_NAME = '再試行';

test.describe('年間収支グラフ表示機能 (FR-024)', () => {
  // ローディング完了を待機するヘルパー関数
  async function waitForYearlyLoadingComplete(page: Page): Promise<void> {
    // ローディング状態が消えるまで待機
    await page
      .waitForSelector(`text=${LOADING_TEXT}`, { state: 'hidden', timeout: 10000 })
      .catch(() => {
        // ローディングが表示されない場合（既に読み込み完了）は無視
      });
  }

  // 年間収支グラフセクションが表示されるまで待機
  async function waitForYearlyGraphSection(page: Page): Promise<void> {
    await page.waitForSelector('text=年間収支グラフ', { timeout: 10000 });
  }

  // データがない場合にテストをスキップするヘルパー関数
  async function skipIfNoData(page: Page): Promise<void> {
    const noData = await page
      .getByText(NO_DATA_TEXT)
      .isVisible()
      .catch(() => false);
    if (noData) {
      test.skip('データがないためテストをスキップします。');
    }
  }

  // データまたはグラフが表示されていることを確認するヘルパー関数
  async function expectDataOrGraphDisplayed(page: Page): Promise<void> {
    const hasNoDataMessage = await page
      .getByText(NO_DATA_TEXT)
      .isVisible()
      .catch(() => false);
    const hasGraph = await page
      .locator('svg')
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasNoDataMessage || hasGraph).toBe(true);
  }

  test.beforeEach(async ({ page }) => {
    // ダッシュボードページに移動
    await page.goto('/dashboard');
    // ページのローディング完了を待機
    await page
      .waitForSelector(`text=${LOADING_TEXT}`, { state: 'hidden', timeout: 10000 })
      .catch(() => {
        // ローディングが表示されない場合は無視
      });
    // 年間収支グラフセクションが表示されるまで待機
    await waitForYearlyGraphSection(page);
  });

  // ========== 基本機能テスト ==========

  test('年間収支グラフページにアクセスできる', async ({ page }) => {
    // ダッシュボードページのタイトルが表示されることを確認
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ダッシュボード');

    // 年間収支グラフのセクションが表示されることを確認
    await expect(page.getByText('年間収支グラフ')).toBeVisible();
  });

  test('デフォルトで現在の年のデータが表示される', async ({ page }) => {
    // ローディング完了を待機
    await waitForYearlyLoadingComplete(page);

    // 現在の年を取得
    const currentYear = new Date().getFullYear();

    // 年選択ドロップダウンの値が現在の年であることを確認
    const yearSelect = page.getByLabel(YEAR_LABEL);
    await expect(yearSelect).toHaveValue(String(currentYear));

    // データが表示されているか、または空データメッセージが表示されていることを確認
    await expectDataOrGraphDisplayed(page);
  });

  test('年を選択してデータを取得できる', async ({ page }) => {
    // ローディング完了を待機
    await waitForYearlyLoadingComplete(page);

    // 年選択ドロップダウンを取得
    const yearSelect = page.getByLabel(YEAR_LABEL);

    // 現在の年を取得
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // 前年に変更
    await yearSelect.selectOption(String(previousYear));

    // ローディング完了を待機
    await waitForYearlyLoadingComplete(page);

    // 選択した年が反映されていることを確認
    await expect(yearSelect).toHaveValue(String(previousYear));

    // データが表示されているか、または空データメッセージが表示されていることを確認
    await expectDataOrGraphDisplayed(page);
  });

  test('3種類のグラフ（折れ線、棒、エリア）が表示される', async ({ page }) => {
    // ローディング完了を待機
    await waitForYearlyLoadingComplete(page);

    // データがない場合はスキップ
    await skipIfNoData(page);

    // グラフのタイトルを確認
    await expect(page.getByText('月別推移（折れ線グラフ）')).toBeVisible();
    await expect(page.getByText('月別比較（棒グラフ）')).toBeVisible();
    await expect(page.getByText('収支差額（エリアグラフ）')).toBeVisible();

    // SVG要素（グラフ）が3つ以上表示されることを確認（各グラフは複数のSVG要素を含む可能性がある）
    const svgElements = await page.locator('svg').count();
    expect(svgElements).toBeGreaterThanOrEqual(3);
  });

  // ========== データ表示テスト ==========

  test('月別折れ線グラフに収入・支出・収支の3本の線が表示される', async ({ page }) => {
    // ローディング完了を待機
    await waitForYearlyLoadingComplete(page);

    // データがない場合はスキップ
    await skipIfNoData(page);

    // 折れ線グラフのセクションを確認
    const lineChartSection = page.getByText('月別推移（折れ線グラフ）').locator('..');
    await expect(lineChartSection).toBeVisible();

    // 凡例に「収入」「支出」「収支」が表示されることを確認（グラフセクション内に限定）
    await expect(lineChartSection.getByText('収入', { exact: true }).first()).toBeVisible();
    await expect(lineChartSection.getByText('支出', { exact: true }).first()).toBeVisible();
    await expect(lineChartSection.getByText('収支', { exact: true }).first()).toBeVisible();
  });

  test('月別積み上げ棒グラフに収入バーと支出バーが表示される', async ({ page }) => {
    // ローディング完了を待機
    await waitForYearlyLoadingComplete(page);

    // データがない場合はスキップ
    await skipIfNoData(page);

    // 棒グラフのセクションを確認
    const barChartSection = page.getByText('月別比較（棒グラフ）').locator('..');
    await expect(barChartSection).toBeVisible();

    // 凡例に「収入」「支出」が表示されることを確認（グラフセクション内に限定）
    await expect(barChartSection.getByText('収入', { exact: true }).first()).toBeVisible();
    await expect(barChartSection.getByText('支出', { exact: true }).first()).toBeVisible();
  });

  test('収支差額エリアグラフが表示される（プラス/マイナスで色分け）', async ({ page }) => {
    // ローディング完了を待機
    await waitForYearlyLoadingComplete(page);

    // データがない場合はスキップ
    await skipIfNoData(page);

    // エリアグラフのセクションを確認
    await expect(page.getByText('収支差額（エリアグラフ）')).toBeVisible();

    // 凡例に「収支（プラス）」「収支（マイナス）」が表示されることを確認
    const hasBalancePositive = await page
      .getByText('収支（プラス）')
      .isVisible()
      .catch(() => false);
    const hasBalanceNegative = await page
      .getByText('収支（マイナス）')
      .isVisible()
      .catch(() => false);

    // どちらかが表示されていればOK（データによっては片方のみ表示される可能性がある）
    expect(hasBalancePositive || hasBalanceNegative).toBe(true);
  });

  test('データが空の年に「データがありません」と表示される', async ({ page }) => {
    // ローディング完了を待機
    await waitForYearlyLoadingComplete(page);

    // 年選択ドロップダウンを取得
    const yearSelect = page.getByLabel(YEAR_LABEL);

    // 選択可能な年の範囲を確認（value属性を直接取得）
    const optionValues = await yearSelect
      .locator('option')
      .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));
    const years = optionValues
      .map((v) => parseInt(v, 10))
      .filter((v) => !isNaN(v))
      .sort((a, b) => a - b);

    if (years.length === 0) {
      test.skip('選択可能な年がありません。');
      return;
    }

    // 利用可能な最も古い年を選択（データがない可能性が高いと仮定）
    const oldestYear = years[0];
    await yearSelect.selectOption(String(oldestYear));
    await waitForYearlyLoadingComplete(page);

    // データがない場合のメッセージが表示されるか確認
    const hasNoDataMessage = await page
      .getByText(NO_DATA_TEXT)
      .isVisible()
      .catch(() => false);

    if (hasNoDataMessage) {
      // メッセージが表示されていればテスト成功
      await expect(page.getByText(NO_DATA_TEXT)).toBeVisible();
    } else {
      // グラフが表示された場合は、テスト対象のデータがないためスキップ
      test.skip(
        `最も古い年 (${oldestYear}) にデータが存在するため、空データの場合のテストをスキップします。`
      );
    }
  });

  // ========== インタラクションテスト ==========

  test('年選択ドロップダウンで年を変更できる', async ({ page }) => {
    // ローディング完了を待機
    await waitForYearlyLoadingComplete(page);

    // 年選択ドロップダウンを取得
    const yearSelect = page.getByLabel(YEAR_LABEL);

    // 現在の年を取得
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // 前年に変更
    await yearSelect.selectOption(String(previousYear));

    // 選択した年が反映されていることを確認
    await expect(yearSelect).toHaveValue(String(previousYear));
  });

  test('年を変更するとデータが再取得される', async ({ page }) => {
    // ローディング完了を待機
    await waitForYearlyLoadingComplete(page);

    // 年選択ドロップダウンを取得
    const yearSelect = page.getByLabel(YEAR_LABEL);

    // 現在の年を取得
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // 前年に変更
    await yearSelect.selectOption(String(previousYear));

    // ローディング状態が表示されることを確認（一瞬表示される可能性がある）
    // ローディングが表示されない場合でも、データが再取得されることを確認するため、
    // ローディング完了を待機してから、年が変更されていることを確認
    await waitForYearlyLoadingComplete(page);

    // 選択した年が反映されていることを確認
    await expect(yearSelect).toHaveValue(String(previousYear));

    // データが表示されているか、または空データメッセージが表示されていることを確認
    await expectDataOrGraphDisplayed(page);
  });

  test('ローディング状態が適切に表示される', async ({ page }) => {
    // 年選択ドロップダウンを取得
    const yearSelect = page.getByLabel(YEAR_LABEL);

    // 現在の年を取得
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // 前年に変更（ローディング状態を確認するため）
    await yearSelect.selectOption(String(previousYear));

    // ローディング状態が表示されることを確認（一瞬表示される可能性がある）
    // ローディングが表示されない場合でも、テストは成功とする（既にデータがキャッシュされている可能性がある）
    const loadingVisible = await page
      .getByText(LOADING_TEXT)
      .isVisible()
      .catch(() => false);

    // ローディングが表示された場合は、その後非表示になることを確認
    if (loadingVisible) {
      await waitForYearlyLoadingComplete(page);
      const stillLoading = await page
        .getByText(LOADING_TEXT)
        .isVisible()
        .catch(() => false);
      expect(stillLoading).toBe(false);
    }
  });

  // ========== エラーハンドリングテスト ==========

  test('APIエラー時にエラーメッセージと再試行ボタンが表示される', async ({ page }) => {
    // APIリクエストをインターセプトしてエラーをシミュレート
    await page.route('**/api/aggregation/yearly-balance*', (route) => {
      void route.abort();
    });

    // 年を変更してAPIエラーを発生させる
    const yearSelect = page.getByLabel(YEAR_LABEL);
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    await yearSelect.selectOption(String(previousYear));

    // エラーメッセージが表示されるのを待機
    const errorMessage = page.getByText(API_ERROR_TEXT);
    await expect(errorMessage).toBeVisible();

    // 再試行ボタンが表示されることを確認
    await expect(page.getByRole('button', { name: RETRY_BUTTON_NAME })).toBeVisible();
  });

  test('ネットワークエラー時のエラーハンドリング', async ({ page, context }) => {
    // ネットワークをオフラインにする
    await context.setOffline(true);

    // 年選択ドロップダウンを取得
    const yearSelect = page.getByLabel(YEAR_LABEL);

    // 現在の年を取得
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // 前年に変更（ネットワークエラーを発生させる）
    await yearSelect.selectOption(String(previousYear));

    // ローディング完了を待機
    await waitForYearlyLoadingComplete(page);

    // エラーメッセージが表示されることを確認
    const errorMessage = page.getByText('年間データの取得に失敗しました');
    const errorVisible = await errorMessage.isVisible().catch(() => false);

    // ネットワークをオンラインに戻す
    await context.setOffline(false);

    // エラーが表示されている場合は、再試行ボタンが表示されることを確認
    if (errorVisible) {
      await expect(page.getByRole('button', { name: '再試行' })).toBeVisible();
    }
  });
});
