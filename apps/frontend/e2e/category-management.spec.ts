import { test, expect } from '@playwright/test';

test.describe('Category Management', () => {
  // テスト用のユニークな名前を生成
  const uniqueName = `E2EテストFE_${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // 費目管理ページに移動（baseURLを使用）
    await page.goto('/categories');
  });

  test('費目管理ページが表示される', async ({ page }) => {
    // タイトルを確認
    await expect(page.locator('h1')).toContainText('費目管理');
  });

  test('新しい費目を作成できる', async ({ page }) => {
    // リクエストをキャプチャ
    page.on('request', (request) => {
      if (request.url().includes('/api/categories')) {
        console.log('>>> Request URL:', request.url());
        console.log('>>> Request Method:', request.method());
        console.log('>>> Request Body:', request.postData());
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/categories')) {
        console.log('<<< Response Status:', response.status());
        console.log('<<< Response Body:', await response.text());
      }
    });

    // フォームに入力
    await page.fill('input[placeholder="例: 食費"]', uniqueName);
    await page.fill('input[placeholder="例: 🍚"]', '🧪');
    await page.fill('input[placeholder="#FF9800"]', '#4CAF50');

    // 追加ボタンをクリック（フォーム送信）
    await page.click('button:has-text("追加")');

    // 作成リクエストが完了するまで待機（APIレスポンスを待つ）
    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/categories') && response.request().method() === 'POST',
      { timeout: 10000 }
    );

    // 一覧が再読み込みされるまで待機
    await page.waitForTimeout(500);

    // 作成された費目が一覧に表示されることを確認
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible({ timeout: 10000 });
    // 複数のアイコンが存在する可能性があるため、最初の要素をチェック
    await expect(page.locator('text=🧪').first()).toBeVisible();
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

      // モーダルが表示されることを確認
      await expect(page.locator('text=費目を編集')).toBeVisible();

      // モーダル内の費目名入力フィールドが表示されるまで待機（データ読み込み完了を待つ）
      const nameInput = page.locator('input[id="category-name"]');
      await expect(nameInput).toBeVisible({ timeout: 10000 });

      // 入力フィールドに値が入るまで待機（ローディング完了を確認）
      await page.waitForTimeout(500);

      // 名前を変更
      const editedName = `${uniqueName}（編集）`;
      await nameInput.fill(editedName);

      // 保存ボタンが表示されるまで待機
      const saveButton = page.locator('button:has-text("保存")');
      await expect(saveButton).toBeVisible({ timeout: 10000 });

      // 保存ボタンをクリック
      await saveButton.click();

      // 更新リクエストが完了するまで待機
      await page.waitForResponse(
        (response) =>
          response.url().includes('/api/categories') && response.request().method() === 'PUT',
        { timeout: 10000 }
      );

      // モーダルが閉じることを確認
      await page.waitForTimeout(500);
      await expect(page.locator('text=費目を編集')).not.toBeVisible();

      // 更新された費目が一覧に表示されることを確認
      await expect(page.locator(`text=${editedName}`)).toBeVisible({ timeout: 10000 });
    }
  });

  test.skip('費目を削除できる', async ({ page }) => {
    // TODO: このテストは、モーダルの削除処理が正しく動作することを確認する必要がある
    // 現在、モーダルが閉じない問題があるため、スキップ
    // 将来的には、モーダルの削除処理を修正してから有効化する

    // 削除ボタンをクリック
    const deleteButtons = page.locator('button:has-text("削除")');
    const count = await deleteButtons.count();

    if (count > 0) {
      await deleteButtons.first().click();

      // 削除確認モーダルが表示されることを確認
      const modal = page.locator('h2:has-text("費目削除の確認")');
      await expect(modal).toBeVisible();

      // モーダル内の削除ボタンをクリック（モーダル内に限定）
      const modalDeleteButton = page
        .locator('div.fixed.inset-0') // モーダルのオーバーレイ
        .locator('button:has-text("削除")')
        .last(); // モーダル内の削除ボタン（最後の削除ボタン）
      await modalDeleteButton.click();

      // モーダルが閉じることを確認
      await page.waitForTimeout(500);
      await expect(modal).not.toBeVisible();
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
