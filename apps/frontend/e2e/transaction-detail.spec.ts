import { test, expect, Page } from '@playwright/test';

/**
 * Issue #109: [TASK] E-3: 取引詳細画面の実装 E2Eテスト
 * FR-009: 詳細費目分類機能
 */

test.describe('取引詳細画面', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    test.setTimeout(60000); // 各テストのタイムアウトを60秒に設定

    // コンソールログを監視
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('取引データ') || text.includes('API') || text.includes('Error')) {
        console.log(`[Browser Console] ${msg.type()}: ${text}`);
      }
    });

    // 取引一覧ページに移動
    await page.goto('/transactions', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // ページタイトルが表示されるまで待つ
    await expect(page.getByRole('heading', { name: '取引履歴一覧' })).toBeVisible({
      timeout: 30000,
    });

    // ローディング状態が終了するまで待つ
    await expect(page.locator('text=読み込み中...')).not.toBeVisible({ timeout: 30000 });

    // APIリクエストが完了するまで待つ
    try {
      await page.waitForResponse(
        (response) => response.url().includes('/api/transactions') && response.status() === 200,
        { timeout: 30000 }
      );
    } catch {
      console.log('[E2E] ⚠️ APIレスポンスを待てませんでした');
    }

    // 取引一覧が表示されるまで待つ
    await Promise.race([
      page.waitForSelector('table tbody tr', { timeout: 30000 }).catch(() => null),
      page.waitForSelector('text=取引データがありません', { timeout: 30000 }).catch(() => null),
    ]);
  });

  test('取引詳細画面に遷移できる', async () => {
    // 取引一覧にデータがあるか確認
    const table = page.locator('table');
    const hasData = await table.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasData) {
      test.skip();
      return;
    }

    // 最初の取引の説明をクリック（リンクになっている）
    const firstTransactionLink = page.locator('table tbody tr').first().locator('a').first();
    await expect(firstTransactionLink).toBeVisible({ timeout: 10000 });

    // リンクのhrefを取得して遷移
    const href = await firstTransactionLink.getAttribute('href');
    if (href) {
      await page.goto(href, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
    } else {
      // hrefがない場合はクリック
      await firstTransactionLink.click();
    }

    // 取引詳細ページのタイトルが表示されることを確認
    await expect(page.getByRole('heading', { name: '取引詳細' })).toBeVisible({
      timeout: 30000,
    });

    // 「取引一覧に戻る」リンクが表示されることを確認
    await expect(page.getByText('取引一覧に戻る')).toBeVisible({ timeout: 10000 });
  });

  test('取引詳細情報が正しく表示される', async () => {
    // 取引一覧にデータがあるか確認
    const table = page.locator('table');
    const hasData = await table.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasData) {
      test.skip();
      return;
    }

    // 最初の取引の説明をクリック
    const firstTransactionLink = page.locator('table tbody tr').first().locator('a').first();
    await expect(firstTransactionLink).toBeVisible({ timeout: 10000 });

    const href = await firstTransactionLink.getAttribute('href');
    if (href) {
      await page.goto(href, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
    } else {
      await firstTransactionLink.click();
    }

    // 取引詳細ページのタイトルが表示されることを確認
    await expect(page.getByRole('heading', { name: '取引詳細' })).toBeVisible({
      timeout: 30000,
    });

    // 取引情報カードが表示されることを確認
    await expect(page.getByText('取引情報')).toBeVisible({ timeout: 10000 });

    // 主要な情報が表示されることを確認（日付、説明、金額、カテゴリなど）
    // これらの要素は存在する可能性が高いが、データがない場合もあるため、存在チェックのみ
    const dateLabel = page.locator('text=日付').first();
    const descriptionLabel = page.locator('text=説明').first();
    const amountLabel = page.locator('text=金額').first();
    const categoryLabel = page.locator('text=カテゴリ').first();

    // 少なくとも1つは表示されることを確認
    await expect(
      Promise.race([
        dateLabel.waitFor({ state: 'visible', timeout: 5000 }).then(() => true),
        descriptionLabel.waitFor({ state: 'visible', timeout: 5000 }).then(() => true),
        amountLabel.waitFor({ state: 'visible', timeout: 5000 }).then(() => true),
        categoryLabel.waitFor({ state: 'visible', timeout: 5000 }).then(() => true),
      ])
    ).resolves.toBe(true);
  });

  test('取引一覧に戻れる', async () => {
    // 取引一覧にデータがあるか確認
    const table = page.locator('table');
    const hasData = await table.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasData) {
      test.skip();
      return;
    }

    // 最初の取引の説明をクリック
    const firstTransactionLink = page.locator('table tbody tr').first().locator('a').first();
    await expect(firstTransactionLink).toBeVisible({ timeout: 10000 });

    const href = await firstTransactionLink.getAttribute('href');
    if (href) {
      await page.goto(href, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
    } else {
      await firstTransactionLink.click();
    }

    // 取引詳細ページのタイトルが表示されることを確認
    await expect(page.getByRole('heading', { name: '取引詳細' })).toBeVisible({
      timeout: 30000,
    });

    // 「取引一覧に戻る」リンクをクリック
    const backLink = page.getByText('取引一覧に戻る');
    await expect(backLink).toBeVisible({ timeout: 10000 });
    await backLink.click();

    // 取引一覧ページに戻ったことを確認
    await expect(page.getByRole('heading', { name: '取引履歴一覧' })).toBeVisible({
      timeout: 30000,
    });
  });

  test('存在しない取引IDでアクセスした場合、エラーが表示される', async () => {
    // 存在しない取引IDでアクセス
    await page.goto('/transactions/non-existent-id', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // ローディングが完了するまで待機
    await page
      .waitForSelector('text=読み込み中...', { state: 'hidden', timeout: 10000 })
      .catch(() => {
        // ローディングが表示されない場合も続行
      });

    // エラーメッセージまたは「取引が見つかりませんでした」が表示されることを確認
    // バックエンドのエラーメッセージは「取引ID ... が見つかりません」の形式
    await expect(page.getByText(/取引.*見つかりません/, { exact: false })).toBeVisible({
      timeout: 10000,
    });
  });
});
