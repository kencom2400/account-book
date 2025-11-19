import { test, expect } from '@playwright/test';

test.describe('エラー通知機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/banks/add');
  });

  test('接続失敗時にトースト通知が表示される', async ({ page }) => {
    // 銀行選択（モックデータを使用する想定）
    await page.click('text=銀行を選択');
    await page.click('text=テスト銀行');

    // 認証情報を入力
    await page.fill('input[placeholder="例: 001"]', '001');
    await page.fill('input[placeholder="例: 1234567"]', '1234567');

    // 接続テストを実行（失敗させる）
    await page.click('button:has-text("接続テスト")');

    // トースト通知が表示されるまで待機
    const toast = page.locator('[role="alert"]');
    await expect(toast).toBeVisible({ timeout: 10000 });

    // エラーメッセージが含まれていることを確認
    await expect(toast).toContainText('エラー');
  });

  test('トースト通知が5秒後に自動的に閉じる', async ({ page }) => {
    // 銀行選択
    await page.click('text=銀行を選択');
    await page.click('text=テスト銀行');

    // 認証情報を入力
    await page.fill('input[placeholder="例: 001"]', '001');
    await page.fill('input[placeholder="例: 1234567"]', '1234567');

    // 接続テストを実行
    await page.click('button:has-text("接続テスト")');

    // トースト通知が表示されることを確認
    const toast = page.locator('[role="alert"]');
    await expect(toast).toBeVisible({ timeout: 10000 });

    // 5秒待機してトーストが消えることを確認
    await page.waitForTimeout(6000);
    await expect(toast).not.toBeVisible();
  });

  test('詳細ボタンをクリックするとモーダルが開く', async ({ page }) => {
    // 銀行選択
    await page.click('text=銀行を選択');
    await page.click('text=テスト銀行');

    // 認証情報を入力
    await page.fill('input[placeholder="例: 001"]', '001');
    await page.fill('input[placeholder="例: 1234567"]', '1234567');

    // 接続テストを実行
    await page.click('button:has-text("接続テスト")');

    // トースト通知が表示されるまで待機
    const toast = page.locator('[role="alert"]');
    await expect(toast).toBeVisible({ timeout: 10000 });

    // 詳細ボタンをクリック
    await page.click('text=詳細を表示');

    // モーダルが開くことを確認
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // モーダルのタイトルを確認
    await expect(modal).toContainText('エラー');
  });

  test('モーダルの閉じるボタンが機能する', async ({ page }) => {
    // 銀行選択
    await page.click('text=銀行を選択');
    await page.click('text=テスト銀行');

    // 認証情報を入力
    await page.fill('input[placeholder="例: 001"]', '001');
    await page.fill('input[placeholder="例: 1234567"]', '1234567');

    // 接続テストを実行
    await page.click('button:has-text("接続テスト")');

    // 詳細ボタンをクリックしてモーダルを開く
    await page.click('text=詳細を表示');

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 閉じるボタンをクリック
    await page.click('button:has-text("閉じる")');

    // モーダルが閉じることを確認
    await expect(modal).not.toBeVisible();
  });

  test('重複通知が防止される', async ({ page }) => {
    // 銀行選択
    await page.click('text=銀行を選択');
    await page.click('text=テスト銀行');

    // 認証情報を入力
    await page.fill('input[placeholder="例: 001"]', '001');
    await page.fill('input[placeholder="例: 1234567"]', '1234567');

    // 接続テストを2回実行
    await page.click('button:has-text("接続テスト")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("接続テスト")');

    // トースト通知が1つだけ表示されることを確認
    const toasts = page.locator('[role="alert"]');
    const count = await toasts.count();
    expect(count).toBe(1);
  });
});

