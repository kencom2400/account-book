import { test, expect } from '@playwright/test';

test.describe('ホームページ', () => {
  test('ページが正常に表示される', async ({ page }) => {
    await page.goto('/');

    // タイトルの確認
    await expect(page).toHaveTitle(/Account Book/);

    // メインコンテンツの確認
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Account Book');
  });

  test('ナビゲーションが機能する', async ({ page }) => {
    await page.goto('/');

    // ダッシュボードへのリンクをクリック
    await page.getByRole('link', { name: 'ダッシュボードを開く' }).click();

    // URLが変わることを確認
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('機能説明セクションが表示される', async ({ page }) => {
    await page.goto('/');

    // 機能説明のカードが表示されることを確認（テキストが部分的に含まれていればOK）
    await expect(page.getByText(/収支の可視化|月次・年次での収支バランス/)).toBeVisible();
    await expect(page.getByText(/一元管理|複数の金融機関の資産を一箇所で管理/)).toBeVisible();
    await expect(page.getByText(/自動分類|取引を自動的にカテゴリ分類/)).toBeVisible();
  });
});

