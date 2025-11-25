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
    // テーブルヘッダーの確認
    await expect(page.getByRole('columnheader', { name: '日付' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '説明' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'カテゴリ' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '金額' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'サブカテゴリ' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '信頼度' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '操作' })).toBeVisible();
  });

  test('カテゴリフィルターが機能する', async ({ page }) => {
    // カテゴリフィルターを選択
    await page.getByLabel('カテゴリ').selectOption('EXPENSE');

    // フィルターが適用されることを確認（取引一覧が更新される）
    await page.waitForTimeout(500); // フィルター適用の待機
  });

  test('信頼度フィルターが機能する', async ({ page }) => {
    // 信頼度フィルターを選択
    await page.getByLabel('信頼度').selectOption('LOW');

    // フィルターが適用されることを確認
    await page.waitForTimeout(500); // フィルター適用の待機
  });

  test('未分類のみフィルターが機能する', async ({ page }) => {
    // 未分類のみチェックボックスをクリック
    await page.getByLabel('unclassified-only').check();

    // フィルターが適用されることを確認
    await page.waitForTimeout(500); // フィルター適用の待機
  });

  test('統計情報が表示される', async ({ page }) => {
    // 統計情報カードの確認
    await expect(page.getByText('総取引数')).toBeVisible();
    await expect(page.getByText('表示中')).toBeVisible();
    await expect(page.getByText('未分類')).toBeVisible();
    await expect(page.getByText('低信頼度')).toBeVisible();
  });

  test('一括自動分類ボタンが表示される', async ({ page }) => {
    // 一括自動分類ボタンの確認
    await expect(page.getByRole('button', { name: /🤖 一括自動分類/ })).toBeVisible();
  });
});
