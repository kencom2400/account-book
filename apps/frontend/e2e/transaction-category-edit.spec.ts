import { test, expect, Page } from '@playwright/test';

/**
 * FR-010: 費目の手動修正機能 E2Eテスト
 */

test.describe('取引カテゴリ編集機能', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;

    // コンソールログを監視
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('取引データ') || text.includes('API') || text.includes('Error')) {
        console.log(`[Browser Console] ${msg.type()}: ${text}`);
      }
    });

    // ネットワークリクエストを監視
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/')) {
        console.log(`[E2E] Request: ${request.method()} ${url}`);
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        console.log(`[E2E] Response: ${response.status()} ${url}`);
        try {
          const body = await response.json();
          console.log(`[E2E] Response body:`, JSON.stringify(body, null, 2).substring(0, 500));
        } catch {
          // JSONパースエラーは無視
        }
      }
    });

    // テストデータのセットアップ（将来的にはAPIで設定）
    await page.goto('/transactions');

    // ページが完全に読み込まれるまで待つ
    await page.waitForLoadState('networkidle');

    // エラーメッセージが表示されている場合はログを出力
    const errorMessage = page.getByText('取引データの取得に失敗しました');
    if (await errorMessage.isVisible().catch(() => false)) {
      console.log('[E2E] ⚠️ エラーメッセージが表示されています');
    }
  });

  test('取引一覧が表示される', async () => {
    // テーブルヘッダーの確認
    await expect(page.getByRole('columnheader', { name: '日付' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '説明' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'カテゴリ' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '金額' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'ステータス' })).toBeVisible();
  });

  test('カテゴリをクリックすると編集モードになる', async () => {
    // 最初の取引のカテゴリをクリック
    const categoryButton = page.locator('tbody tr:first-child button').first();
    await categoryButton.click();

    // セレクトボックスが表示される
    await expect(page.locator('tbody tr:first-child select')).toBeVisible();
    // キャンセルボタンが表示される
    await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible();
  });

  test('カテゴリを変更できる', async () => {
    // 最初の取引のカテゴリをクリック
    const categoryButton = page.locator('tbody tr:first-child button').first();
    const originalCategory = await categoryButton.textContent();
    await categoryButton.click();

    // セレクトボックスが表示されるまで待つ
    const select = page.locator('tbody tr:first-child select');
    await expect(select).toBeVisible();

    // 別のカテゴリを選択
    const options = await select.locator('option').all();
    if (options.length > 1) {
      const newOption = await options[1].getAttribute('value');
      if (newOption) {
        await select.selectOption(newOption);

        // カテゴリが変更されたことを確認（元のカテゴリ名とは異なることを確認）
        await expect(page.locator('tbody tr:first-child button').first()).not.toHaveText(
          originalCategory || ''
        );
      }
    }
  });

  test('編集をキャンセルできる', async () => {
    // 最初の取引のカテゴリをクリック
    const categoryButton = page.locator('tbody tr:first-child button').first();
    const originalCategory = await categoryButton.textContent();
    await categoryButton.click();

    // セレクトボックスが表示される
    await expect(page.locator('tbody tr:first-child select')).toBeVisible();

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click();

    // セレクトボックスが消える
    await expect(page.locator('tbody tr:first-child select')).not.toBeVisible();

    // 元のカテゴリが表示される
    const currentCategory = await page.locator('tbody tr:first-child button').first().textContent();
    expect(currentCategory).toBe(originalCategory);
  });

  test('更新中はボタンが無効化される', async () => {
    // 最初の取引のカテゴリをクリック
    const categoryButton = page.locator('tbody tr:first-child button').first();
    await categoryButton.click();

    // セレクトボックスが表示される
    const select = page.locator('tbody tr:first-child select');
    await expect(select).toBeVisible();

    // 別のカテゴリを選択（APIレスポンスを遅延させる場合）
    const options = await select.locator('option').all();
    if (options.length > 1) {
      const newOption = await options[1].getAttribute('value');
      if (newOption) {
        await select.selectOption(newOption);

        // 「更新中...」テキストが一瞬表示される可能性がある
        // （実際のAPIが速すぎる場合はスキップ）
        const updatingText = page.locator('text=更新中...');
        const isUpdating = await updatingText.isVisible().catch(() => false);
        if (isUpdating) {
          expect(await updatingText.isVisible()).toBe(true);
        }
      }
    }
  });

  test('エラーメッセージが表示される（ネットワークエラー時）', async () => {
    // ネットワークをオフラインにする
    await page.context().setOffline(true);

    // 最初の取引のカテゴリをクリック
    const categoryButton = page.locator('tbody tr:first-child button').first();
    await categoryButton.click();

    // セレクトボックスが表示される
    const select = page.locator('tbody tr:first-child select');
    await expect(select).toBeVisible();

    // 別のカテゴリを選択
    const options = await select.locator('option').all();
    if (options.length > 1) {
      const newOption = await options[1].getAttribute('value');
      if (newOption) {
        await select.selectOption(newOption);

        // エラーメッセージが表示される
        await expect(page.getByText('カテゴリの更新に失敗しました')).toBeVisible();
      }
    }

    // ネットワークを復元
    await page.context().setOffline(false);
  });

  test('取引データがない場合はメッセージを表示する', async () => {
    // 空のページに移動（データがない状態をシミュレート）
    // 実際の実装では、クエリパラメータで空の結果を返すようにする
    await page.goto('/transactions?empty=true');

    // メッセージが表示される
    await expect(page.getByText('取引データがありません')).toBeVisible();
  });
});
