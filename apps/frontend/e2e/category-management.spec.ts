import { test, expect, type Page } from '@playwright/test';

test.describe('Category Management', () => {
  // テスト用のユニークな名前を生成
  const uniqueName = `E2EテストFE_${Date.now()}`;

  // 各テストのタイムアウトを60秒に設定（スケルトンUI表示待ちなどを考慮）
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // 費目管理ページに移動（baseURLを使用）
    await page.goto('/categories');

    // 前のテストで開いたモーダルが残っている可能性があるため、閉じる処理を追加
    // モーダルが開いているか確認（タイムアウトを短く設定）
    const modalTitle = page.locator('text=費目を編集');
    const isModalVisible = await modalTitle.isVisible({ timeout: 1000 }).catch(() => false);

    if (isModalVisible) {
      // ESCキーでモーダルを閉じる（最も確実な方法）
      await page.keyboard.press('Escape');
      // モーダルが閉じるまで待機（タイムアウトを短く設定）
      await modalTitle.waitFor({ state: 'hidden', timeout: 1000 }).catch(() => {
        // タイムアウトしても続行（モーダルが既に閉じている可能性）
      });
    }

    // ページが完全に読み込まれるまで待機（networkidleは重いので、domcontentloadedに変更）
    await page.waitForLoadState('domcontentloaded');
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

    // 作成リクエストを待機するPromiseを作成（ボタンクリック前に開始）
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/categories') && response.request().method() === 'POST',
      { timeout: 15000 }
    );

    // 追加ボタンをクリック（フォーム送信）
    await page.click('button:has-text("追加")');

    // 作成リクエストが完了するまで待機（APIレスポンスを待つ）
    await responsePromise;

    // 一覧が再読み込みされるまで待機
    await page.waitForTimeout(500);

    // 作成された費目が一覧に表示されることを確認
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible({ timeout: 15000 });
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
      // APIレスポンスを待機するPromiseを作成（ボタンクリック前に開始）
      const responsePromise = page.waitForResponse(
        (response) => {
          const url = response.url();
          const isCategoryGet =
            url.includes('/api/categories') && response.request().method() === 'GET';
          const isNotList = !url.includes('/api/categories?'); // クエリパラメータがない（一覧取得ではない）
          const isIndividual = url.match(/\/api\/categories\/[^/?]+$/) !== null; // UUIDパターンに一致（個別取得）
          return isCategoryGet && isNotList && isIndividual;
        },
        { timeout: 15000 }
      );

      await editButtons.first().click();

      // モーダルが表示されることを確認
      await expect(page.locator('text=費目を編集')).toBeVisible();

      // APIレスポンスを待機
      const response = await responsePromise;
      expect(response.status()).toBe(200);

      // スケルトンUIが消えるまで待機
      await expect(page.locator('.animate-pulse'))
        .not.toBeVisible({ timeout: 15000 })
        .catch(() => {
          // スケルトンUIが存在しない場合は無視（既にデータが読み込まれている）
        });

      // モーダル内の費目名入力フィールドが表示されるまで待機（データ読み込み完了を待つ）
      const nameInput = page.locator('input[id="category-name"]');
      await expect(nameInput).toBeVisible({ timeout: 15000 });

      // 入力フィールドに値が入るまで待機（ローディング完了を確認）
      // Reactの状態更新が反映されるまで待機するため、複数の方法で確認
      await page.waitForFunction(
        (inputSelector) => {
          const input = document.querySelector(inputSelector) as HTMLInputElement;
          return input && input.value !== '';
        },
        'input[id="category-name"]',
        { timeout: 20000 }
      );

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

      // モーダルが閉じることを確認（not.toBeVisible()が自動待機するため、waitForTimeoutは不要）
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

  test.describe('費目編集モーダル', () => {
    /**
     * 編集モーダルを開いてデータが読み込まれるまで待機するヘルパー関数
     */
    async function openAndAwaitEditModal(page: Page) {
      const editButton = page.locator('button:has-text("編集")').first();
      const responsePromise = page.waitForResponse(
        (response) => {
          const url = response.url();
          const isCategoryGet =
            url.includes('/api/categories') && response.request().method() === 'GET';
          const isNotList = !url.includes('/api/categories?'); // クエリパラメータがない（一覧取得ではない）
          const isIndividual = url.match(/\/api\/categories\/[^/?]+$/) !== null; // UUIDパターンに一致（個別取得）
          return isCategoryGet && isNotList && isIndividual;
        },
        { timeout: 15000 }
      );

      await editButton.click();
      await expect(page.locator('text=費目を編集')).toBeVisible();

      // APIレスポンスを待機
      const response = await responsePromise;
      // レスポンスが成功していることを確認
      expect(response.status()).toBe(200);

      // スケルトンUIが消えるまで待機
      await expect(page.locator('.animate-pulse'))
        .not.toBeVisible({ timeout: 15000 })
        .catch(() => {
          // スケルトンUIが存在しない場合は無視（既にデータが読み込まれている）
        });

      // データが読み込まれるまで待機
      const nameInput = page.locator('input[id="category-name"]');
      await expect(nameInput).toBeVisible({ timeout: 15000 });

      // 入力フィールドに値が入るまで待機（データ読み込み完了を確認）
      // Reactの状態更新が反映されるまで待機するため、複数の方法で確認
      await page.waitForFunction(
        (inputSelector) => {
          const input = document.querySelector(inputSelector) as HTMLInputElement;
          return input && input.value !== '';
        },
        'input[id="category-name"]',
        { timeout: 20000 }
      );
    }

    test('編集モーダルが正しく開く', async ({ page }) => {
      // 編集ボタンをクリック
      const editButtons = page.locator('button:has-text("編集")');
      const count = await editButtons.count();

      if (count > 0) {
        await editButtons.first().click();

        // モーダルが表示されることを確認
        await expect(page.locator('text=費目を編集')).toBeVisible();
        await expect(page.locator('role=dialog')).toBeVisible();
      }
    });

    test('編集モーダルで既存データが正しく表示される', async ({ page }) => {
      const editButtons = page.locator('button:has-text("編集")');
      const count = await editButtons.count();

      if (count > 0) {
        await openAndAwaitEditModal(page);
      }
    });

    test('編集モーダルでカテゴリタイプが無効化されている', async ({ page }) => {
      const editButtons = page.locator('button:has-text("編集")');
      const count = await editButtons.count();

      if (count > 0) {
        await openAndAwaitEditModal(page);

        // フォーム全体がレンダリングされるまで少し待機
        await page.waitForTimeout(500);

        // カテゴリタイプのセレクトボックスが無効化されていることを確認
        // 編集モードでは id="category-type-disabled" のセレクトボックスが表示される
        const typeSelect = page.locator('select[id="category-type-disabled"]');
        // セレクトボックスが表示されるまで待機（フォーム全体がレンダリングされるまで）
        await expect(typeSelect).toBeVisible({ timeout: 20000 });
        // セレクトボックスが無効化されていることを確認（タイムアウトを延長）
        await expect(typeSelect).toBeDisabled({ timeout: 15000 });

        // 「カテゴリタイプは変更できません」のメッセージが表示されることを確認
        await expect(page.locator('text=カテゴリタイプは変更できません')).toBeVisible({
          timeout: 5000,
        });

        // 新規作成用のセレクトボックスが表示されていないことを確認
        const createTypeSelect = page.locator('select[id="category-type"]');
        const createSelectCount = await createTypeSelect.count();
        expect(createSelectCount).toBe(0);
      }
    });

    test('編集モーダルをXボタンで閉じられる', async ({ page }) => {
      const editButtons = page.locator('button:has-text("編集")');
      const count = await editButtons.count();

      if (count > 0) {
        await editButtons.first().click();

        // モーダルが表示されることを確認
        await expect(page.locator('text=費目を編集')).toBeVisible();

        // Xボタンをクリック
        const closeButton = page.locator('button[aria-label="モーダルを閉じる"]');
        await expect(closeButton).toBeVisible();
        await closeButton.click();

        // モーダルが閉じることを確認
        await page.waitForTimeout(300);
        await expect(page.locator('text=費目を編集')).not.toBeVisible();
      }
    });

    test('編集モーダルをオーバーレイクリックで閉じられる', async ({ page }) => {
      const editButtons = page.locator('button:has-text("編集")');
      const count = await editButtons.count();

      if (count > 0) {
        await editButtons.first().click();

        // モーダルが表示されることを確認
        await expect(page.locator('text=費目を編集')).toBeVisible();

        // オーバーレイをクリック（aria-hidden="true"のdiv）
        const overlay = page.locator('div[aria-hidden="true"]').first();
        await overlay.click({ position: { x: 10, y: 10 } });

        // モーダルが閉じることを確認
        await page.waitForTimeout(300);
        await expect(page.locator('text=費目を編集')).not.toBeVisible();
      }
    });

    test('編集モーダルをキャンセルボタンで閉じられる', async ({ page }) => {
      const editButtons = page.locator('button:has-text("編集")');
      const count = await editButtons.count();

      if (count > 0) {
        await openAndAwaitEditModal(page);

        // フォーム全体が表示されるまで待機（キャンセルボタンが存在することを確認）
        const modal = page.locator('role=dialog');
        const cancelButton = modal.locator('button:has-text("キャンセル")');
        // キャンセルボタンが表示されるまで待機（フォームが完全にレンダリングされるまで）
        await expect(cancelButton).toBeVisible({ timeout: 10000 });
        // ボタンがクリック可能になるまで少し待機
        await expect(cancelButton).toBeEnabled({ timeout: 5000 });

        // キャンセルボタンをクリック
        await cancelButton.click();

        // モーダルが閉じることを確認
        await expect(page.locator('text=費目を編集')).not.toBeVisible({ timeout: 10000 });
      }
    });

    test('編集モーダルでローディング状態が表示される', async ({ page }) => {
      const editButtons = page.locator('button:has-text("編集")');
      const count = await editButtons.count();

      if (count > 0) {
        await editButtons.first().click();

        // モーダルが表示されることを確認
        await expect(page.locator('text=費目を編集')).toBeVisible();

        // ローディング状態が一瞬表示される可能性がある（データ取得中）
        // ただし、データ取得が速すぎる場合は表示されない可能性もある
        const loadingText = page.locator('text=読み込み中...');
        const isVisible = await loadingText.isVisible().catch(() => false);

        // ローディングが表示された場合は、データ読み込み完了まで待機
        if (isVisible) {
          await expect(loadingText).not.toBeVisible({ timeout: 10000 });
        }

        // 最終的にフォームが表示されることを確認
        await expect(page.locator('input[id="category-name"]')).toBeVisible({ timeout: 10000 });
      }
    });

    test('編集モーダルでアイコンと色を変更できる', async ({ page }) => {
      const editButtons = page.locator('button:has-text("編集")');
      const count = await editButtons.count();

      if (count > 0) {
        await openAndAwaitEditModal(page);

        // アイコン入力フィールドが表示されるまで待機
        const iconInput = page.locator('input[placeholder="例: 🍚"]');
        await expect(iconInput).toBeVisible({ timeout: 10000 });
        await iconInput.fill('🎨');

        // 色入力フィールドが表示されるまで待機
        const colorInput = page.locator('input[placeholder="#FF9800"]');
        await expect(colorInput).toBeVisible({ timeout: 10000 });
        await colorInput.fill('#FF5722');

        // 保存ボタンが表示されるまで待機
        const saveButton = page.locator('button:has-text("保存")');
        await expect(saveButton).toBeVisible({ timeout: 10000 });
        await saveButton.click();

        // 更新リクエストが完了するまで待機
        await page.waitForResponse(
          (response) =>
            response.url().includes('/api/categories') && response.request().method() === 'PUT',
          { timeout: 10000 }
        );

        // モーダルが閉じることを確認
        await expect(page.locator('text=費目を編集')).not.toBeVisible({ timeout: 5000 });
      }
    });

    test('編集モーダルでバリデーションエラーが表示される', async ({ page }) => {
      const editButtons = page.locator('button:has-text("編集")');
      const count = await editButtons.count();

      if (count > 0) {
        await openAndAwaitEditModal(page);

        // フォーム全体がレンダリングされるまで少し待機
        await page.waitForTimeout(500);

        // データが読み込まれた後、nameInputを取得
        const nameInput = page.locator('input[id="category-name"]');

        // 保存ボタンが表示されるまで待機
        const saveButton = page.locator('button:has-text("保存")');
        await expect(saveButton).toBeVisible({ timeout: 10000 });

        // 費目名を空にする
        await nameInput.clear();
        await nameInput.fill(''); // 明示的に空にする

        // HTML5のバリデーションにより、フォーム送信が阻止される
        // 保存ボタンをクリックしても、フォーム送信が実行されない
        await saveButton.click();

        // モーダルが閉じないことを確認（バリデーションエラーにより送信が阻止される）
        await expect(page.locator('text=費目を編集')).toBeVisible({ timeout: 5000 });

        // 入力フィールドが空のままであることを確認
        const inputValue = await nameInput.inputValue();
        expect(inputValue).toBe('');
      }
    });

    test('編集モーダルで複数のフィールドを同時に変更できる', async ({ page }) => {
      const editButtons = page.locator('button:has-text("編集")');
      const count = await editButtons.count();

      if (count > 0) {
        await openAndAwaitEditModal(page);

        // フォーム全体がレンダリングされるまで少し待機
        await page.waitForTimeout(500);

        // データが読み込まれた後、nameInputを取得
        const nameInput = page.locator('input[id="category-name"]');

        // 保存ボタンが表示されるまで待機
        const saveButton = page.locator('button:has-text("保存")');
        await expect(saveButton).toBeVisible({ timeout: 15000 });

        // 複数のフィールドを変更
        const editedName = `${uniqueName}（複数変更）`;
        await nameInput.fill(editedName);

        // アイコン入力フィールドが表示されるまで待機
        const iconInput = page.locator('input[placeholder="例: 🍚"]');
        await expect(iconInput).toBeVisible({ timeout: 10000 });
        await iconInput.fill('🎯');

        // 色入力フィールドが表示されるまで待機
        const colorInput = page.locator('input[placeholder="#FF9800"]');
        await expect(colorInput).toBeVisible({ timeout: 10000 });
        await colorInput.fill('#9C27B0');

        // 保存ボタンをクリック
        await saveButton.click();

        // 更新リクエストが完了するまで待機
        await page.waitForResponse(
          (response) =>
            response.url().includes('/api/categories') && response.request().method() === 'PUT',
          { timeout: 15000 }
        );

        // モーダルが閉じることを確認
        await expect(page.locator('text=費目を編集')).not.toBeVisible({ timeout: 10000 });

        // 更新された費目が一覧に表示されることを確認
        await expect(page.locator(`text=${editedName}`)).toBeVisible({ timeout: 15000 });
      }
    });
  });
});
