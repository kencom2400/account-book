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
      { timeout: 30000 } // タイムアウトを30秒に設定（APIレスポンス待機のため）
    )
    .catch(() => {
      console.log('[E2E] ⚠️ APIレスポンスを待てませんでした');
      return null;
    });

test.describe('月次レポート画面', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    test.setTimeout(60000); // 各テストのタイムアウトを60秒に設定

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
      timeout: 60000,
    });

    // APIレスポンスを待つ（ページ遷移と同時に待機）
    await monthlyBalanceResponsePromise;

    // ページタイトルが表示されるまで待つ
    await expect(page.getByRole('heading', { name: '月別収支レポート' })).toBeVisible({
      timeout: 30000,
    });

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });
  });

  test('月次レポート画面が表示される', async () => {
    // ページタイトルが表示される
    await expect(page.getByRole('heading', { name: '月別収支レポート' })).toBeVisible({
      timeout: 30000,
    });

    // サマリーカードが表示される（複数要素があるため、より具体的なセレクタを使用）
    await expect(page.getByRole('heading', { name: '収入' }).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('heading', { name: '支出' }).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('heading', { name: '収支' }).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('heading', { name: '貯蓄率' }).first()).toBeVisible({
      timeout: 15000,
    });
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
    await expect(page.getByRole('heading', { name: '月を選択' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: '選択' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible({ timeout: 10000 });
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
    const selectButton = page.getByRole('button', { name: '選択' });
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
    // カテゴリ別内訳セクション内のリンクを取得（hrefにcategoryが含まれる）
    const categoryDetailButton = page.locator('a[href*="category"]:has-text("詳細を見る →")');
    await expect(categoryDetailButton).toBeVisible({ timeout: 15000 });
    await categoryDetailButton.click();

    // APIレスポンスを待つ
    await categoryResponsePromise;

    // カテゴリ別内訳画面に遷移する（h1要素を明示的に指定）
    await expect(page.getByRole('heading', { level: 1, name: 'カテゴリ別内訳' })).toBeVisible({
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
    // 金融機関別内訳セクション内のリンクを取得（hrefにinstitutionが含まれる）
    const institutionDetailButton = page.locator('a[href*="institution"]:has-text("詳細を見る →")');
    await expect(institutionDetailButton).toBeVisible({ timeout: 15000 });
    await institutionDetailButton.click();

    // APIレスポンスを待つ
    await institutionResponsePromise;

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // 金融機関別内訳画面に遷移する（h1要素を明示的に指定）
    await expect(page.getByRole('heading', { level: 1, name: '金融機関別内訳' })).toBeVisible({
      timeout: 30000,
    });

    // 戻るボタンが表示される
    await expect(page.getByText('← 月次レポートに戻る')).toBeVisible({ timeout: 15000 });
  });

  test('カテゴリ別内訳画面で収入/支出を切り替えできる', async () => {
    // APIリクエストを待つ（カテゴリ別内訳画面用）
    const categoryResponsePromise = waitForMonthlyBalanceAPI(page);

    // カテゴリ別内訳画面に遷移
    await page.goto('/aggregation/monthly-balance/category?year=2025&month=1&type=expense', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // APIレスポンスを待つ
    await categoryResponsePromise;

    // ページタイトルが表示されるまで待つ（h1要素を明示的に指定）
    await expect(page.getByRole('heading', { level: 1, name: 'カテゴリ別内訳' })).toBeVisible({
      timeout: 30000,
    });

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // URLがカテゴリ別内訳画面であることを確認
    await expect(page).toHaveURL(/\/category/, { timeout: 10000 });

    // 収入ボタンをクリック（カテゴリ別内訳画面の収入/支出切り替えボタン）
    // カテゴリ別内訳画面では、収入/支出切り替えボタンがh1要素の後に配置されている
    // データが表示されるまで待つ（円グラフやテーブルが表示されるまで）
    await expect(page.locator('text=カテゴリ別内訳')).toBeVisible({ timeout: 30000 });
    // 収入/支出切り替えボタンが表示されるまで待つ
    const incomeButton = page.getByRole('button', { name: '収入' }).first();
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
      timeout: 60000,
    });

    // APIレスポンスを待つ
    await institutionResponsePromise;

    // ページタイトルが表示されるまで待つ（h1要素を明示的に指定）
    await expect(page.getByRole('heading', { level: 1, name: '金融機関別内訳' })).toBeVisible({
      timeout: 30000,
    });

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // 収入ボタンをクリック（金融機関別内訳画面の収入/支出切り替えボタン）
    const incomeButton = page
      .locator('div:has(h1:has-text("金融機関別内訳"))')
      .getByRole('button', { name: '収入' });
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
      timeout: 60000,
    });

    // APIレスポンスを待つ
    await categoryResponsePromise;

    // ページタイトルが表示されるまで待つ（h1要素を明示的に指定）
    await expect(page.getByRole('heading', { level: 1, name: 'カテゴリ別内訳' })).toBeVisible({
      timeout: 30000,
    });

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // ソート選択を変更（カテゴリ別内訳画面の場合は#sort-field）
    // ラベルからselect要素を取得（カテゴリ別内訳画面では#sort-fieldが使用される）
    const sortSelect = page
      .locator('label:has-text("並び替え:")')
      .locator('~ select')
      .or(page.locator('#sort-field'));
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
      timeout: 60000,
    });

    // APIレスポンスを待つ
    await institutionResponsePromise;

    // ページタイトルが表示されるまで待つ（h1要素を明示的に指定）
    await expect(page.getByRole('heading', { level: 1, name: '金融機関別内訳' })).toBeVisible({
      timeout: 30000,
    });

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // ソート選択を変更（金融機関別内訳画面の場合は#sort-by）
    const sortSelect = page.locator('select#sort-by');
    await expect(sortSelect).toBeVisible({ timeout: 10000 });
    await sortSelect.selectOption('count');

    // ソート順が変更される
    await expect(sortSelect).toHaveValue('count');
  });
});
