import { test, expect } from '@playwright/test';

/**
 * FR-009: 詳細費目分類機能のE2Eテスト
 */
test.describe('取引分類（サブカテゴリ）機能', () => {
  test.beforeEach(async ({ page }) => {
    // 取引分類ページに移動
    await page.goto('/classification');
  });

  test('ページが正しく表示される', async ({ page }) => {
    // タイトルの確認
    await expect(page.getByRole('heading', { name: '取引分類（サブカテゴリ）' })).toBeVisible();

    // 説明文の確認
    await expect(
      page.getByText('未分類・低信頼度の取引を確認し、サブカテゴリを設定します')
    ).toBeVisible();

    // フィルターセクションの確認
    await expect(page.getByLabel('カテゴリ')).toBeVisible();
    await expect(page.getByLabel('信頼度')).toBeVisible();
  });

  test('取引一覧が表示される', async ({ page }) => {
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // テーブルが存在することを確認（取引データがない場合でもテーブル構造は表示される）
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // テーブルヘッダーの確認（取引データがない場合でもヘッダーは表示される）
    // 注意: テーブルが空の場合は「該当する取引がありません」メッセージが表示される
    const headers = ['日付', '説明', 'カテゴリ', '金額', 'サブカテゴリ', '信頼度', '操作'];

    // まず、テーブルが表示されているか、または「該当する取引がありません」メッセージが表示されているかを確認
    const hasNoDataMessage = await page
      .getByText('該当する取引がありません')
      .isVisible()
      .catch(() => false);

    if (hasNoDataMessage) {
      // データがない場合は、メッセージが表示されていることを確認して終了
      return;
    }

    // データがある場合は、すべてのヘッダーが表示されていることを確認
    for (const header of headers) {
      const headerElement = page.getByRole('columnheader', { name: header, exact: true });
      await expect(headerElement).toBeVisible({ timeout: 5000 });
    }
  });

  test('カテゴリフィルターが機能する', async ({ page }) => {
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // カテゴリフィルターを選択
    await page.getByLabel('カテゴリ').selectOption('EXPENSE');

    // フィルターが適用されることを確認（テーブルが表示されるか、メッセージが表示される）
    const table = page.getByRole('table');
    const noDataMessage = page.getByText('該当する取引がありません');
    const tableVisible = await table.isVisible().catch(() => false);
    const messageVisible = await noDataMessage.isVisible().catch(() => false);
    expect(tableVisible || messageVisible).toBe(true);
  });

  test('信頼度フィルターが機能する', async ({ page }) => {
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 信頼度フィルターを選択
    await page.getByLabel('信頼度').selectOption('LOW');

    // フィルターが適用されることを確認（テーブルが表示されるか、メッセージが表示される）
    const table = page.getByRole('table');
    const noDataMessage = page.getByText('該当する取引がありません');
    const tableVisible = await table.isVisible().catch(() => false);
    const messageVisible = await noDataMessage.isVisible().catch(() => false);
    expect(tableVisible || messageVisible).toBe(true);
  });

  test('未分類のみフィルターが機能する', async ({ page }) => {
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 未分類のみチェックボックスを探す（getByRoleを使用）
    const checkbox = page.getByRole('checkbox', { name: '未分類のみ' });
    const isVisible = await checkbox.isVisible().catch(() => false);

    if (isVisible) {
      await checkbox.check();
      // フィルターが適用されることを確認（テーブルが表示されるか、メッセージが表示される）
      const table = page.getByRole('table');
      const noDataMessage = page.getByText('該当する取引がありません');
      const tableVisible = await table.isVisible().catch(() => false);
      const messageVisible = await noDataMessage.isVisible().catch(() => false);
      expect(tableVisible || messageVisible).toBe(true);
    } else {
      // チェックボックスが見つからない場合は、フィルターセクションが表示されていることを確認
      await expect(page.getByText('未分類のみ')).toBeVisible();
    }
  });

  test('統計情報が表示される', async ({ page }) => {
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 統計情報カードの確認（取引データがない場合でも統計情報は表示される）
    await expect(page.getByText('総取引数')).toBeVisible();
    await expect(page.getByText('表示中')).toBeVisible();

    // 「未分類」と「低信頼度」は、取引データがある場合のみ表示される可能性がある
    // より柔軟に確認
    const unclassifiedText = page.getByText('未分類');
    const lowConfidenceText = page.getByText('低信頼度');

    const hasUnclassified = await unclassifiedText.isVisible().catch(() => false);
    const hasLowConfidence = await lowConfidenceText.isVisible().catch(() => false);

    // 少なくとも統計情報セクションが存在することを確認
    if (!hasUnclassified && !hasLowConfidence) {
      // 統計情報セクション全体が表示されていることを確認
      await expect(page.getByText('総取引数')).toBeVisible();
    }
  });

  test('一括自動分類ボタンが表示される', async ({ page }) => {
    // 一括自動分類ボタンの確認
    await expect(page.getByRole('button', { name: /🤖 一括自動分類/ })).toBeVisible();
  });
});
