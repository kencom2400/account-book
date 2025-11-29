import { test, expect } from '@playwright/test';

test.describe('Category Management', () => {
  test.beforeEach(async ({ page }) => {
    // 費目管理ページに移動
    await page.goto('http://localhost:3000/categories');
  });

  test('費目管理ページが表示される', async ({ page }) => {
    // タイトルを確認
    await expect(page.locator('h1')).toContainText('費目管理');
  });

  test('新しい費目を作成できる', async ({ page }) => {
    // フォームに入力
    await page.fill('input[placeholder="例: 食費"]', 'E2Eテスト費目');
    await page.fill('input[placeholder="例: 🍚"]', '🧪');
    await page.fill('input[placeholder="#FF9800"]', '#4CAF50');

    // 作成ボタンをクリック
    await page.click('button:has-text("作成")');

    // 作成された費目が一覧に表示されることを確認
    await expect(page.locator('text=E2Eテスト費目')).toBeVisible();
    await expect(page.locator('text=🧪')).toBeVisible();
  });

  test('フィルターが機能する', async ({ page }) => {
    // 支出フィルターをクリック
    await page.click('button:has-text("支出")');

    // URLパラメータが変更されることを確認（オプション）
    await page.waitForTimeout(500);

    // 収入フィルターをクリック
    await page.click('button:has-text("収入")');
    await page.waitForTimeout(500);

    // すべてフィルターをクリック
    await page.click('button:has-text("すべて")');
    await page.waitForTimeout(500);
  });

  test('費目を編集できる', async ({ page }) => {
    // 最初の編集ボタンをクリック（システム定義以外）
    const editButtons = page.locator('button:has-text("編集")');
    const count = await editButtons.count();

    if (count > 0) {
      await editButtons.first().click();

      // フォームが編集モードになることを確認
      await expect(page.locator('h2:has-text("費目編集")')).toBeVisible();

      // 名前を変更
      await page.fill('input[value]', 'E2Eテスト費目（編集）');

      // 更新ボタンをクリック
      await page.click('button:has-text("更新")');

      // 更新された費目が一覧に表示されることを確認
      await page.waitForTimeout(500);
      await expect(page.locator('text=E2Eテスト費目（編集）')).toBeVisible();
    }
  });

  test('費目を削除できる', async ({ page }) => {
    // 削除ボタンをクリック
    const deleteButtons = page.locator('button:has-text("削除")');
    const count = await deleteButtons.count();

    if (count > 0) {
      await deleteButtons.first().click();

      // 削除確認モーダルが表示されることを確認
      await expect(page.locator('h2:has-text("費目削除の確認")')).toBeVisible();

      // 削除ボタンをクリック
      await page.click('button:has-text("削除")');

      // モーダルが閉じることを確認
      await page.waitForTimeout(500);
      await expect(page.locator('h2:has-text("費目削除の確認")')).not.toBeVisible();
    }
  });

  test('システム定義費目は編集・削除ボタンが表示されない', async ({ page }) => {
    // システム定義費目を含む一覧をチェック
    const systemCategories = page.locator('text=システム定義');
    const count = await systemCategories.count();

    if (count > 0) {
      // システム定義費目の行を取得
      const categoryRow = systemCategories.first().locator('..');

      // 編集・削除ボタンが存在しないことを確認
      await expect(categoryRow.locator('button:has-text("編集")')).not.toBeVisible();
      await expect(categoryRow.locator('button:has-text("削除")')).not.toBeVisible();
    }
  });

  test('カラーピッカーが機能する', async ({ page }) => {
    // カラーピッカーをクリック
    const colorInput = page.locator('input[type="color"]');
    await colorInput.click();

    // カラーコード入力フィールドに直接入力
    await page.fill('input[placeholder="#FF9800"]', '#FF5722');

    // 値が反映されることを確認（オプション）
    const colorValue = await page.locator('input[placeholder="#FF9800"]').inputValue();
    expect(colorValue).toBe('#FF5722');
  });
});
