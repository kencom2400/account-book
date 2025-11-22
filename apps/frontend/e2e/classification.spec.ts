import { test, expect } from '@playwright/test';

/**
 * FR-008: カテゴリ自動分類機能のE2Eテスト
 */
test.describe('カテゴリ自動分類機能', () => {
  test.beforeEach(async ({ page }) => {
    // 分類ページに移動
    await page.goto('/classification');
  });

  test('ページが正しく表示される', async ({ page }) => {
    // タイトルの確認
    await expect(
      page.getByRole('heading', { name: 'カテゴリ自動分類（FR-008）' }),
    ).toBeVisible();

    // 入力フォームの確認
    await expect(page.getByLabel('金額')).toBeVisible();
    await expect(page.getByLabel('説明')).toBeVisible();

    // ボタンの確認
    await expect(
      page.getByRole('button', { name: 'カテゴリを自動分類' }),
    ).toBeVisible();
  });

  test('収入取引を正しく分類できる', async ({ page }) => {
    // 入力
    await page.getByLabel('金額').fill('300000');
    await page.getByLabel('説明').fill('給与振込');

    // 分類ボタンをクリック
    await page.getByRole('button', { name: 'カテゴリを自動分類' }).click();

    // 結果が表示されるまで待機
    await expect(page.getByText('分類結果')).toBeVisible();

    // 収入カテゴリが表示される
    await expect(page.getByText('収入')).toBeVisible();

    // 信頼度が表示される
    await expect(page.getByText(/信頼度/)).toBeVisible();
  });

  test('支出取引を正しく分類できる', async ({ page }) => {
    // 入力
    await page.getByLabel('金額').fill('-1500');
    await page.getByLabel('説明').fill('スターバックス コーヒー');

    // 分類ボタンをクリック
    await page.getByRole('button', { name: 'カテゴリを自動分類' }).click();

    // 結果が表示されるまで待機
    await expect(page.getByText('分類結果')).toBeVisible();

    // 支出カテゴリが表示される
    await expect(page.getByText('支出')).toBeVisible();
  });

  test('振替取引を正しく分類できる', async ({ page }) => {
    // 入力
    await page.getByLabel('金額').fill('-50000');
    await page.getByLabel('説明').fill('カード引落');

    // 分類ボタンをクリック
    await page.getByRole('button', { name: 'カテゴリを自動分類' }).click();

    // 結果が表示されるまで待機
    await expect(page.getByText('分類結果')).toBeVisible();

    // 振替カテゴリが表示される
    await expect(page.getByText('振替')).toBeVisible();
  });

  test('返済取引を正しく分類できる', async ({ page }) => {
    // 入力
    await page.getByLabel('金額').fill('-100000');
    await page.getByLabel('説明').fill('住宅ローン返済');

    // 分類ボタンをクリック
    await page.getByRole('button', { name: 'カテゴリを自動分類' }).click();

    // 結果が表示されるまで待機
    await expect(page.getByText('分類結果')).toBeVisible();

    // 返済カテゴリが表示される
    await expect(page.getByText('返済')).toBeVisible();
  });

  test('投資取引を正しく分類できる', async ({ page }) => {
    // 入力
    await page.getByLabel('金額').fill('-50000');
    await page.getByLabel('説明').fill('株式購入');

    // 分類ボタンをクリック
    await page.getByRole('button', { name: 'カテゴリを自動分類' }).click();

    // 結果が表示されるまで待機
    await expect(page.getByText('分類結果')).toBeVisible();

    // 投資カテゴリが表示される
    await expect(page.getByText('投資')).toBeVisible();
  });

  test('必須項目が未入力の場合はエラーが表示される', async ({ page }) => {
    // 何も入力せずに分類ボタンをクリック
    await page.getByRole('button', { name: 'カテゴリを自動分類' }).click();

    // エラーメッセージが表示される
    await expect(
      page.getByText('金額と説明を入力してください'),
    ).toBeVisible();
  });

  test('分類理由が表示される', async ({ page }) => {
    // 入力
    await page.getByLabel('金額').fill('300000');
    await page.getByLabel('説明').fill('給与振込');

    // 分類ボタンをクリック
    await page.getByRole('button', { name: 'カテゴリを自動分類' }).click();

    // 結果が表示されるまで待機
    await expect(page.getByText('分類結果')).toBeVisible();

    // 分類理由が表示される
    await expect(page.getByText('分類理由:')).toBeVisible();
  });

  test('使用例が表示される', async ({ page }) => {
    // 使用例セクションが表示される
    await expect(page.getByText('使用例')).toBeVisible();
    await expect(
      page.getByText('金額: -1500, 説明: "スターバックス" → 支出'),
    ).toBeVisible();
  });
});

