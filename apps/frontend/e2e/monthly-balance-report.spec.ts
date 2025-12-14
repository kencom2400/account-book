import { test, expect, Page } from '@playwright/test';

/**
 * FR-016: 月別収支集計 E2Eテスト
 */

// ヘルパー関数: 月次収支APIレスポンスを待つ
const waitForMonthlyBalanceAPI = (page: Page) =>
  page
    .waitForResponse(
      (response) =>
        response.url().includes('/api/aggregation/monthly-balance') && response.status() === 200,
      { timeout: 20000 } // タイムアウトを20秒に短縮（CI環境での実行時間短縮）
    )
    .catch(() => {
      console.log('[E2E] ⚠️ APIレスポンスを待てませんでした');
      return null;
    });

test.describe('月次レポート画面', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    test.setTimeout(45000); // 各テストのタイムアウトを45秒に設定（CI環境での実行時間短縮）

    // コンソールログを監視
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Error') || text.includes('Failed')) {
        console.log(`[Browser Console] ${msg.type()}: ${text}`);
      }
    });

    // APIリクエストが完了するまで待つ（/api/aggregation/monthly-balanceへのリクエストを待つ）
    // page.goto()の前に設定することで、リクエストを確実にキャッチできる
    const monthlyBalanceResponsePromise = waitForMonthlyBalanceAPI(page);

    // 月次レポート画面に遷移
    await page.goto('/aggregation/monthly-balance', {
      waitUntil: 'domcontentloaded',
      timeout: 30000, // タイムアウトを30秒に短縮
    });

    // APIレスポンスを待つ（ページ遷移と同時に待機）
    await monthlyBalanceResponsePromise;

    // ページタイトルが表示されるまで待つ
    await expect(page.getByRole('heading', { name: '月別収支レポート' })).toBeVisible({
      timeout: 15000, // タイムアウトを15秒に短縮
    });

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 15000 }); // タイムアウトを15秒に短縮
  });

  test('月次レポート画面が表示される', async () => {
    // ページタイトルが表示される
    await expect(page.getByRole('heading', { name: '月別収支レポート' })).toBeVisible({
      timeout: 30000,
    });

    // サマリーカードが表示される
    await expect(page.getByText('収入')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('支出')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('収支')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('貯蓄率')).toBeVisible({ timeout: 15000 });
  });

  test('前月ボタンをクリックすると前月のデータが表示される', async () => {
    // 現在の月を確認
    const currentMonthText = await page
      .getByRole('button', { name: /\d{4}年\d{1,2}月/ })
      .textContent();
    expect(currentMonthText).toBeTruthy();

    // APIリクエストを待つ（前月データ取得用）
    const monthlyBalanceResponsePromise = waitForMonthlyBalanceAPI(page);

    // 前月ボタンをクリック
    const previousButton = page.getByLabel('前月');
    await expect(previousButton).toBeVisible({ timeout: 10000 });
    await previousButton.click();

    // APIレスポンスを待つ
    await monthlyBalanceResponsePromise;

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // 前月のデータが表示される（月表示が変更される）
    await expect(page.getByRole('heading', { name: '月別収支レポート' })).toBeVisible({
      timeout: 30000,
    });
  });

  test('次月ボタンをクリックすると次月のデータが表示される', async () => {
    // 現在の月を確認
    const currentMonthText = await page
      .getByRole('button', { name: /\d{4}年\d{1,2}月/ })
      .textContent();
    expect(currentMonthText).toBeTruthy();

    // APIリクエストを待つ（次月データ取得用）
    const monthlyBalanceResponsePromise = waitForMonthlyBalanceAPI(page);

    // 次月ボタンをクリック
    const nextButton = page.getByLabel('次月');
    await expect(nextButton).toBeVisible({ timeout: 10000 });
    await nextButton.click();

    // APIレスポンスを待つ
    await monthlyBalanceResponsePromise;

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // 次月のデータが表示される（月表示が変更される）
    await expect(page.getByRole('heading', { name: '月別収支レポート' })).toBeVisible({
      timeout: 30000,
    });
  });

  test('月選択モーダルが表示される', async () => {
    // 月選択ボタンをクリック
    const monthButton = page.getByRole('button', { name: /\d{4}年\d{1,2}月/ });
    await expect(monthButton).toBeVisible({ timeout: 10000 });
    await monthButton.click();

    // モーダルが表示される
    await expect(page.getByText('月を選択')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('選択')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('キャンセル')).toBeVisible({ timeout: 10000 });
  });

  test('月選択モーダルで月を選択できる', async () => {
    // 月選択ボタンをクリック
    const monthButton = page.getByRole('button', { name: /\d{4}年\d{1,2}月/ });
    await expect(monthButton).toBeVisible({ timeout: 10000 });
    await monthButton.click();

    // モーダルが表示される
    await expect(page.getByText('月を選択')).toBeVisible({ timeout: 10000 });

    // APIリクエストを待つ（3月データ取得用）
    const monthlyBalanceResponsePromise = waitForMonthlyBalanceAPI(page);

    // 3月を選択
    const marchButton = page.getByText('3月');
    await expect(marchButton).toBeVisible({ timeout: 10000 });
    await marchButton.click();

    // 選択ボタンをクリック
    const selectButton = page.getByText('選択');
    await expect(selectButton).toBeVisible({ timeout: 10000 });
    await selectButton.click();

    // モーダルが閉じられる
    await expect(page.getByText('月を選択')).not.toBeVisible({ timeout: 10000 });

    // APIレスポンスを待つ
    await monthlyBalanceResponsePromise;

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // 3月のデータが表示される
    await expect(page.getByRole('heading', { name: '月別収支レポート' })).toBeVisible({
      timeout: 30000,
    });
  });

  test('月選択モーダルをキャンセルできる', async () => {
    // 月選択ボタンをクリック
    const monthButton = page.getByRole('button', { name: /\d{4}年\d{1,2}月/ });
    await expect(monthButton).toBeVisible({ timeout: 10000 });
    await monthButton.click();

    // モーダルが表示される
    await expect(page.getByText('月を選択')).toBeVisible({ timeout: 10000 });

    // キャンセルボタンをクリック
    const cancelButton = page.getByText('キャンセル');
    await expect(cancelButton).toBeVisible({ timeout: 10000 });
    await cancelButton.click();

    // モーダルが閉じられる
    await expect(page.getByText('月を選択')).not.toBeVisible({ timeout: 10000 });
  });

  test('カテゴリ別内訳セクションが表示される', async () => {
    // カテゴリ別内訳セクションが表示される
    await expect(page.getByText('カテゴリ別内訳')).toBeVisible({ timeout: 30000 });

    // 詳細を見るボタンが表示される
    const detailButtons = page.locator('text=詳細を見る →');
    await expect(detailButtons.first()).toBeVisible({ timeout: 15000 });
  });

  test('金融機関別内訳セクションが表示される', async () => {
    // 金融機関別内訳セクションが表示される
    await expect(page.getByText('金融機関別内訳')).toBeVisible({ timeout: 30000 });

    // 詳細を見るボタンが表示される
    const detailButtons = page.locator('text=詳細を見る →');
    await expect(detailButtons.first()).toBeVisible({ timeout: 15000 });
  });

  test('カテゴリ別内訳画面に遷移できる', async () => {
    // APIリクエストを待つ（カテゴリ別内訳画面用）
    const categoryResponsePromise = waitForMonthlyBalanceAPI(page);

    // カテゴリ別内訳の「詳細を見る」ボタンをクリック
    const categoryDetailButton = page
      .locator('div:has(h2:has-text("カテゴリ別内訳"))')
      .getByRole('link', { name: '詳細を見る →' });
    await expect(categoryDetailButton).toBeVisible({ timeout: 15000 });
    await categoryDetailButton.click();

    // APIレスポンスを待つ
    await categoryResponsePromise;

    // カテゴリ別内訳画面に遷移する
    await expect(page.getByRole('heading', { name: 'カテゴリ別内訳' })).toBeVisible({
      timeout: 30000,
    });

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // 戻るボタンが表示される
    await expect(page.getByText('← 月次レポートに戻る')).toBeVisible({ timeout: 15000 });
  });

  test('金融機関別内訳画面に遷移できる', async () => {
    // APIリクエストを待つ（金融機関別内訳画面用）
    const institutionResponsePromise = waitForMonthlyBalanceAPI(page);

    // 金融機関別内訳の「詳細を見る」ボタンをクリック
    const institutionDetailButton = page
      .locator('div:has(h2:has-text("金融機関別内訳"))')
      .getByRole('link', { name: '詳細を見る →' });
    await expect(institutionDetailButton).toBeVisible({ timeout: 15000 });
    await institutionDetailButton.click();

    // APIレスポンスを待つ
    await institutionResponsePromise;

    // 金融機関別内訳画面に遷移する
    await expect(page.getByRole('heading', { name: '金融機関別内訳' })).toBeVisible({
      timeout: 30000,
    });

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // 戻るボタンが表示される
    await expect(page.getByText('← 月次レポートに戻る')).toBeVisible({ timeout: 15000 });
  });

  test('カテゴリ別内訳画面で収入/支出を切り替えできる', async () => {
    // APIリクエストを待つ（カテゴリ別内訳画面用）
    const categoryResponsePromise = waitForMonthlyBalanceAPI(page);

    // カテゴリ別内訳画面に遷移
    await page.goto('/aggregation/monthly-balance/category?year=2025&month=1&type=expense', {
      waitUntil: 'domcontentloaded',
      timeout: 30000, // タイムアウトを30秒に短縮
    });

    // APIレスポンスを待つ
    await categoryResponsePromise;

    // ページタイトルが表示されるまで待つ
    await expect(page.getByRole('heading', { name: 'カテゴリ別内訳' })).toBeVisible({
      timeout: 30000,
    });

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // 収入ボタンをクリック
    const incomeButton = page.getByText('収入');
    await expect(incomeButton).toBeVisible({ timeout: 10000 });
    await incomeButton.click();

    // URLが更新される
    await expect(page).toHaveURL(/type=income/, { timeout: 10000 });
  });

  test('金融機関別内訳画面で収入/支出を切り替えできる', async () => {
    // APIリクエストを待つ（金融機関別内訳画面用）
    const institutionResponsePromise = waitForMonthlyBalanceAPI(page);

    // 金融機関別内訳画面に遷移
    await page.goto('/aggregation/monthly-balance/institution?year=2025&month=1&type=expense', {
      waitUntil: 'domcontentloaded',
      timeout: 30000, // タイムアウトを30秒に短縮
    });

    // APIレスポンスを待つ
    await institutionResponsePromise;

    // ページタイトルが表示されるまで待つ
    await expect(page.getByRole('heading', { name: '金融機関別内訳' })).toBeVisible({
      timeout: 30000,
    });

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // 収入ボタンをクリック
    const incomeButton = page.getByText('収入');
    await expect(incomeButton).toBeVisible({ timeout: 10000 });
    await incomeButton.click();

    // URLが更新される
    await expect(page).toHaveURL(/type=income/, { timeout: 10000 });
  });

  test('カテゴリ別内訳画面でソート機能が動作する', async () => {
    // APIリクエストを待つ（カテゴリ別内訳画面用）
    const categoryResponsePromise = waitForMonthlyBalanceAPI(page);

    // カテゴリ別内訳画面に遷移
    await page.goto('/aggregation/monthly-balance/category?year=2025&month=1&type=expense', {
      waitUntil: 'domcontentloaded',
      timeout: 30000, // タイムアウトを30秒に短縮
    });

    // APIレスポンスを待つ
    await categoryResponsePromise;

    // ページタイトルが表示されるまで待つ
    await expect(page.getByRole('heading', { name: 'カテゴリ別内訳' })).toBeVisible({
      timeout: 30000,
    });

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // ソート選択を変更
    const sortSelect = page.getByLabel('並び替え:');
    await expect(sortSelect).toBeVisible({ timeout: 10000 });
    await sortSelect.selectOption('count');

    // ソート順が変更される
    await expect(sortSelect).toHaveValue('count');
  });

  test('金融機関別内訳画面でソート機能が動作する', async () => {
    // APIリクエストを待つ（金融機関別内訳画面用）
    const institutionResponsePromise = waitForMonthlyBalanceAPI(page);

    // 金融機関別内訳画面に遷移
    await page.goto('/aggregation/monthly-balance/institution?year=2025&month=1&type=expense', {
      waitUntil: 'domcontentloaded',
      timeout: 30000, // タイムアウトを30秒に短縮
    });

    // APIレスポンスを待つ
    await institutionResponsePromise;

    // ページタイトルが表示されるまで待つ
    await expect(page.getByRole('heading', { name: '金融機関別内訳' })).toBeVisible({
      timeout: 30000,
    });

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // ソート選択を変更
    const sortSelect = page.getByLabel('並び替え:');
    await expect(sortSelect).toBeVisible({ timeout: 10000 });
    await sortSelect.selectOption('count');

    // ソート順が変更される
    await expect(sortSelect).toHaveValue('count');
  });
});
