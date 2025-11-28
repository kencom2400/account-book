import { test, expect } from '@playwright/test';

/**
 * FR-009 Phase 7: フロントエンドパフォーマンステスト
 *
 * パフォーマンス目標:
 * - サブカテゴリ一覧表示: 100ms以内
 * - 階層構造の展開: 50ms以内
 * - 検索フィルタリング: 100ms以内
 *
 * NOTE: このテストは将来実装のために作成されました。
 * 現在はCI環境でタイムアウトするため、一時的にスキップしています。
 */
test.describe.skip('サブカテゴリ分類フロントエンドパフォーマンステスト（将来実装予定）', () => {
  test.beforeEach(async ({ page }) => {
    // 取引分類ページに移動
    await page.goto('/classification');
  });

  test('ページ初期表示が500ms以内に完了する', async ({ page }) => {
    const start = Date.now();

    // ページの主要要素が表示されるまで待機
    await expect(page.getByRole('heading', { name: '取引分類（サブカテゴリ）' })).toBeVisible();
    await expect(page.getByLabel('カテゴリ')).toBeVisible();

    const duration = Date.now() - start;

    console.log(`[PERF] ページ初期表示: ${duration}ms`);
    expect(duration).toBeLessThan(500);
  });

  test('サブカテゴリ一覧の取得が100ms以内に完了する', async ({ page }) => {
    // ネットワークリクエストを監視
    let apiDuration = 0;
    page.on('response', async (response) => {
      if (response.url().includes('/api/subcategories') && response.request().method() === 'GET') {
        const timing = response.timing();
        apiDuration = timing.responseEnd;
      }
    });

    // カテゴリフィルターを操作してAPIを呼び出し
    await page.getByLabel('カテゴリ').selectOption('EXPENSE');

    // API呼び出しが完了するまで待機
    await page.waitForResponse(
      (response) => response.url().includes('/api/subcategories') && response.status() === 200
    );

    console.log(`[PERF] サブカテゴリ一覧取得API: ${apiDuration}ms`);

    // APIレスポンスが100ms以内であることを確認
    expect(apiDuration).toBeLessThan(100);
  });

  test('取引一覧の表示が200ms以内に完了する', async ({ page }) => {
    const start = Date.now();

    // 取引一覧のローディングが完了するまで待機
    await expect(page.getByRole('table')).toBeVisible();

    // 少なくとも1件の取引が表示されることを確認
    const rows = page.getByRole('row');
    await expect(rows.first()).toBeVisible();

    const duration = Date.now() - start;

    console.log(`[PERF] 取引一覧表示: ${duration}ms`);
    expect(duration).toBeLessThan(200);
  });

  test('階層構造の展開が50ms以内に完了する', async ({ page }) => {
    // 親カテゴリを探す（展開可能なもの）
    const expandButton = page.getByRole('button', { name: /展開|expand/i }).first();

    const start = Date.now();

    // 展開ボタンをクリック
    await expandButton.click();

    // 子カテゴリが表示されるまで待機
    await page.waitForSelector('[data-testid="subcategory-child"]', { timeout: 100 });

    const duration = Date.now() - start;

    console.log(`[PERF] 階層構造展開: ${duration}ms`);
    expect(duration).toBeLessThan(50);
  });

  test('検索フィルタリングが100ms以内に完了する', async ({ page }) => {
    // 検索入力欄を探す
    const searchInput = page.getByPlaceholder(/検索|search/i);

    const start = Date.now();

    // 検索キーワードを入力
    await searchInput.fill('食費');

    // フィルタリング結果が表示されるまで待機
    await page.waitForTimeout(50); // debounceを考慮

    const duration = Date.now() - start;

    console.log(`[PERF] 検索フィルタリング: ${duration}ms`);
    expect(duration).toBeLessThan(100);

    // 検索結果が表示されることを確認
    const searchResults = page.locator('[data-testid="search-result"]');
    await expect(searchResults.first()).toBeVisible({ timeout: 50 });
  });

  test('カテゴリ選択が30ms以内に完了する', async ({ page }) => {
    // 取引の1件目を選択
    const firstTransaction = page.getByRole('row').nth(1);

    // サブカテゴリ選択ドロップダウンを開く
    const selectButton = firstTransaction.getByRole('button', { name: /サブカテゴリを選択/ });

    const start = Date.now();

    await selectButton.click();

    // ドロップダウンが開くまで待機
    await page.waitForSelector('[role="listbox"]', { timeout: 50 });

    const duration = Date.now() - start;

    console.log(`[PERF] カテゴリ選択UI: ${duration}ms`);
    expect(duration).toBeLessThan(30);
  });

  test('サブカテゴリ保存が200ms以内に完了する', async ({ page }) => {
    // 取引の1件目を選択
    const firstTransaction = page.getByRole('row').nth(1);

    // サブカテゴリを選択
    const selectButton = firstTransaction.getByRole('button', { name: /サブカテゴリを選択/ });
    await selectButton.click();

    const firstOption = page.getByRole('option').first();
    await firstOption.click();

    const start = Date.now();

    // 保存ボタンをクリック
    const saveButton = firstTransaction.getByRole('button', { name: /保存|save/i });
    await saveButton.click();

    // 保存完了を待機（APIレスポンス）
    await page.waitForResponse(
      (response) => response.url().includes('/api/transactions') && response.status() === 200
    );

    const duration = Date.now() - start;

    console.log(`[PERF] サブカテゴリ保存: ${duration}ms`);
    expect(duration).toBeLessThan(200);
  });

  test('大量データ（100件）の表示が1秒以内に完了する', async ({ page, context }) => {
    // 大量データのモックレスポンスを設定
    await context.route('**/api/transactions*', async (route) => {
      const transactions = Array.from({ length: 100 }, (_, i) => ({
        id: `tx_${i}`,
        description: `取引${i}`,
        amount: -1000 - i,
        transactionDate: '2025-11-24T10:00:00.000Z',
        categoryType: 'EXPENSE',
        subcategoryId: null,
        classificationConfidence: 0,
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: transactions,
          total: 100,
        }),
      });
    });

    // ページをリロード
    await page.reload();

    const start = Date.now();

    // 100件の取引が表示されるまで待機
    await expect(page.getByRole('row')).toHaveCount(101, { timeout: 1000 }); // ヘッダー + 100件

    const duration = Date.now() - start;

    console.log(`[PERF] 100件表示: ${duration}ms`);
    expect(duration).toBeLessThan(1000);
  });

  test('仮想スクロール（Virtual Scroll）のパフォーマンス', async ({ page }) => {
    // 大量データを表示した状態でスクロール
    const start = Date.now();

    // ページを下にスクロール
    await page.mouse.wheel(0, 5000);

    // スクロール後の表示が更新されるまで待機
    await page.waitForTimeout(100);

    const duration = Date.now() - start;

    console.log(`[PERF] 仮想スクロール: ${duration}ms`);
    expect(duration).toBeLessThan(200);

    // スクロール後も正しく表示されることを確認
    const visibleRows = page.getByRole('row').filter({ hasText: /取引/ });
    await expect(visibleRows.first()).toBeVisible();
  });
});

test.describe.skip('カテゴリ自動分類フロントエンドパフォーマンステスト（将来実装予定）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/category-classifier');
  });

  test('自動分類の実行が200ms以内に完了する', async ({ page }) => {
    // 入力フォームに値を設定
    await page.getByLabel('金額').fill('500');
    await page.getByLabel('説明').fill('スターバックス');

    const start = Date.now();

    // 分類ボタンをクリック
    await page.getByRole('button', { name: 'カテゴリを自動分類' }).click();

    // APIレスポンスを待機
    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/subcategories/classify') && response.status() === 200
    );

    // 結果が表示されるまで待機
    await expect(page.getByText('分類結果')).toBeVisible();

    const duration = Date.now() - start;

    console.log(`[PERF] 自動分類実行: ${duration}ms`);
    expect(duration).toBeLessThan(200);
  });

  test('分類結果の表示が50ms以内に完了する', async ({ page }) => {
    // 事前に分類を実行
    await page.getByLabel('金額').fill('500');
    await page.getByLabel('説明').fill('スターバックス');
    await page.getByRole('button', { name: 'カテゴリを自動分類' }).click();
    await expect(page.getByText('分類結果')).toBeVisible();

    const start = Date.now();

    // 分類結果の詳細が表示されるまで待機
    await expect(page.getByText(/信頼度/)).toBeVisible();
    await expect(page.getByText(/サブカテゴリ/)).toBeVisible();

    const duration = Date.now() - start;

    console.log(`[PERF] 分類結果表示: ${duration}ms`);
    expect(duration).toBeLessThan(50);
  });

  test('連続分類（10回）が2秒以内に完了する', async ({ page }) => {
    const transactions = [
      { amount: '500', description: 'スターバックス' },
      { amount: '800', description: 'セブンイレブン' },
      { amount: '220', description: 'JR東日本' },
      { amount: '1200', description: 'ユニクロ' },
      { amount: '3000', description: 'ヨドバシカメラ' },
      { amount: '450', description: 'ドトールコーヒー' },
      { amount: '600', description: 'ファミリーマート' },
      { amount: '180', description: 'バス' },
      { amount: '5000', description: 'ビックカメラ' },
      { amount: '350', description: 'タリーズコーヒー' },
    ];

    const start = Date.now();

    for (const tx of transactions) {
      await page.getByLabel('金額').fill(tx.amount);
      await page.getByLabel('説明').fill(tx.description);
      await page.getByRole('button', { name: 'カテゴリを自動分類' }).click();
      await page.waitForResponse(
        (response) =>
          response.url().includes('/api/subcategories/classify') && response.status() === 200
      );
      await expect(page.getByText('分類結果')).toBeVisible();
    }

    const duration = Date.now() - start;

    console.log(`[PERF] 連続分類（10回）: ${duration}ms`);
    expect(duration).toBeLessThan(2000);
  });
});
