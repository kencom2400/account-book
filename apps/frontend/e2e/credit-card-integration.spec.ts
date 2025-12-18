/**
 * FR-002: クレジットカードとの連携 E2Eテスト
 *
 * このテストは、クレジットカードとの連携機能のE2Eテストを実装します。
 * 機能要件: docs/functional-requirements/FR-001-007_data-acquisition.md
 */

import { test, expect } from '@playwright/test';

test.describe('クレジットカードとの連携 (FR-002)', () => {
  // テスト用の定数
  const TEST_CARD_NUMBER = '4111111111111111'; // Luhnアルゴリズムで有効なテストカード番号
  const TEST_CARD_HOLDER_NAME = 'TARO YAMADA';
  const TEST_EXPIRY_DATE = '2025-12-31';
  const TEST_USERNAME = 'test@example.com';
  const TEST_PASSWORD = 'password123';
  const TEST_API_KEY = 'test-api-key-12345';

  // 各テストのタイムアウトを60秒に設定
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // カード会社一覧のAPIレスポンスを待機するPromiseを作成（page.gotoの前に作成）
    // エンドポイントは/api/api/credit-cards/companies/supported（@Controller('api/credit-cards') + setGlobalPrefix('api')）
    const responsePromise = page.waitForResponse(
      (response) =>
        (response.url().includes('/api/api/credit-cards/companies/supported') ||
          response.url().includes('/credit-cards/companies/supported')) &&
        response.status() === 200,
      { timeout: 30000 }
    );

    // クレジットカード追加ページに移動
    await page.goto('/credit-cards/add');

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('domcontentloaded');

    // ステップ1（カード会社選択画面）が表示されることを確認
    await expect(page.getByText('1. カード会社選択')).toBeVisible({ timeout: 10000 });

    // APIレスポンスを待機
    const response = await responsePromise;
    const responseBody = await response.json();

    // APIレスポンスが成功していることを確認
    expect(responseBody.success).toBe(true);
    expect(responseBody.data).toBeInstanceOf(Array);
    expect(responseBody.data.length).toBeGreaterThan(0);

    // ローディングスピナーが消えるまで待機（または検索ボックスが表示されるまで待機）
    // エラーが発生した場合は、エラーメッセージが表示される可能性があるため、検索ボックスまたはエラーメッセージのいずれかを待機
    const searchBox = page.getByPlaceholder('カード会社名またはコードで検索');
    const errorMessage = page.getByText(/カード会社一覧の取得に失敗しました|エラー/);
    const loadingSpinner = page.locator('.animate-spin');

    // ローディングスピナーが消えるまで待機
    await expect(loadingSpinner)
      .not.toBeVisible({ timeout: 10000 })
      .catch(() => {
        // ローディングスピナーが消えない場合は、検索ボックスまたはエラーメッセージを待機
      });

    // 検索ボックスまたはエラーメッセージのいずれかが表示されるまで待機
    await Promise.race([
      expect(searchBox).toBeVisible({ timeout: 10000 }),
      expect(errorMessage).toBeVisible({ timeout: 10000 }),
    ]).catch(async (error) => {
      // どちらも表示されない場合は、ページの状態を確認
      const hasError = await errorMessage.isVisible().catch(() => false);
      const hasSearchBox = await searchBox.isVisible().catch(() => false);
      if (hasError) {
        throw new Error('カード会社一覧の取得に失敗しました');
      }
      if (!hasSearchBox) {
        throw new Error('検索ボックスが表示されませんでした');
      }
      throw error;
    });
  });

  test('クレジットカード追加ページが表示される', async ({ page }) => {
    // タイトルを確認
    await expect(page.getByRole('heading', { level: 1 })).toContainText('クレジットカードを追加');

    // 説明文を確認
    await expect(
      page.getByText('クレジットカードを連携して、自動で利用明細を取得します')
    ).toBeVisible();

    // ステップインジケーターを確認
    await expect(page.getByText('1. カード会社選択')).toBeVisible();
    await expect(page.getByText('2. 認証情報入力')).toBeVisible();
    await expect(page.getByText('3. 接続テスト')).toBeVisible();
  });

  test('カード会社選択画面が表示される', async ({ page }) => {
    // 直接APIを呼び出してレスポンスの内容を確認
    // エンドポイントは/api/api/credit-cards/companies/supported（@Controller('api/credit-cards') + setGlobalPrefix('api')）
    const apiBaseUrl = 'http://localhost:3021';
    const apiResponse = await page.request.get(
      `${apiBaseUrl}/api/api/credit-cards/companies/supported`
    );

    // APIレスポンスの内容を確認
    expect(apiResponse.status()).toBe(200);
    const apiResponseBody = await apiResponse.json();
    expect(apiResponseBody).toHaveProperty('success', true);
    expect(apiResponseBody).toHaveProperty('data');
    expect(apiResponseBody).toHaveProperty('count');
    expect(Array.isArray(apiResponseBody.data)).toBe(true);
    expect(apiResponseBody.data.length).toBeGreaterThan(0);

    // 期待されるカード会社が含まれているか確認
    const companyNames = apiResponseBody.data.map((c: { name: string }) => c.name);
    expect(companyNames).toContain('三井住友カード');
    expect(companyNames).toContain('JCB');

    // 検索ボックスが表示されることを確認
    await expect(page.getByPlaceholder('カード会社名またはコードで検索')).toBeVisible();

    // カテゴリタブが表示されることを確認
    await expect(page.getByRole('button', { name: 'すべて' })).toBeVisible();
    await expect(page.getByRole('button', { name: '大手カード' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '銀行系' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '流通系' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'ネット系' }).first()).toBeVisible();

    // APIレスポンスのデータに基づいて、カード会社ボタンが表示されることを確認
    // レスポンスに含まれる最初のカード会社が表示されているか確認
    const firstCompany = apiResponseBody.data[0];
    await expect(page.getByRole('button', { name: new RegExp(firstCompany.name) })).toBeVisible({
      timeout: 5000,
    });

    // 三井住友カードが表示されることを確認
    await expect(page.getByRole('button', { name: /三井住友カード/ })).toBeVisible();
  });

  test('カード会社検索が機能する', async ({ page }) => {
    // 検索ボックスに入力（デバウンス処理があるため、入力後にAPIレスポンスを待機）
    const searchInput = page.getByPlaceholder('カード会社名またはコードで検索');

    // 検索APIレスポンスを待機するPromiseを作成（入力の前に作成）
    // デバウンス処理（500ms）があるため、タイムアウトを長めに設定
    // URLエンコードされた検索キーワードも考慮
    const searchResponsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return (
          (url.includes('/api/api/credit-cards/companies/supported') ||
            url.includes('/credit-cards/companies/supported')) &&
          (url.includes('searchTerm=三井住友') ||
            url.includes('searchTerm=%E4%B8%89%E4%BA%95%E4%BD%8F%E5%8F%8B')) &&
          response.status() === 200
        );
      },
      { timeout: 20000 }
    );

    // 検索ボックスに入力
    await searchInput.fill('三井住友');

    // 検索APIレスポンスを待機して内容を確認
    const searchResponse = await searchResponsePromise;
    const searchBody = await searchResponse.json();
    expect(searchBody.data.length).toBeGreaterThan(0);
    expect(searchBody.data.some((c: { name: string }) => c.name.includes('三井住友'))).toBe(true);

    // 検索結果がUIに反映されることを確認
    await expect(page.locator('button:has-text("三井住友")').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('カテゴリフィルターが機能する', async ({ page }) => {
    // 大手カードタブが表示されるまで待機
    const majorCardTab = page.getByRole('button', { name: '大手カード' }).first();
    await expect(majorCardTab).toBeVisible({ timeout: 5000 });

    // カテゴリフィルターAPIレスポンスを待機するPromiseを作成（クリックの前に作成）
    const filterResponsePromise = page.waitForResponse(
      (response) =>
        (response.url().includes('/api/api/credit-cards/companies/supported') ||
          response.url().includes('/credit-cards/companies/supported')) &&
        response.url().includes('category=major') &&
        response.status() === 200,
      { timeout: 15000 }
    );

    // 大手カードタブをクリック
    await majorCardTab.click();

    // カテゴリフィルターAPIレスポンスを待機して内容を確認
    const filterResponse = await filterResponsePromise;
    const filterBody = await filterResponse.json();
    expect(filterBody.data.length).toBeGreaterThan(0);
    // すべてのカード会社が大手カードカテゴリであることを確認
    expect(filterBody.data.every((c: { category: string }) => c.category === 'major')).toBe(true);

    // フィルター結果が更新されるまで待機し、大手カードタブがアクティブになることを確認
    await expect(majorCardTab).toHaveClass(/border-blue-600|text-blue-600/);
  });

  test('カード会社を選択して認証情報入力画面に遷移する', async ({ page }) => {
    // 最初のカード会社ボタンをクリック（beforeEachで既に待機済み）
    const firstCardCompanyButton = page
      .locator('button')
      .filter({ hasText: /コード:/ })
      .first();
    await firstCardCompanyButton.click();

    // 認証情報入力画面に遷移することを確認
    await expect(page.getByText('2. 認証情報入力')).toBeVisible();

    // 接続先カード会社セクションが表示されることを確認
    await expect(page.getByText('接続先カード会社')).toBeVisible();

    // 認証情報入力フォームが表示されることを確認
    await expect(page.getByLabel(/カード番号/)).toBeVisible();
    await expect(page.getByLabel(/カード名義/)).toBeVisible();
    await expect(page.getByLabel(/有効期限/)).toBeVisible();
  });

  test('認証情報入力フォームが表示される', async ({ page }) => {
    // 最初のカード会社を選択（beforeEachで既に待機済み）
    await page
      .locator('button')
      .filter({ hasText: /コード:/ })
      .first()
      .click();

    // 各入力フィールドが表示されることを確認
    await expect(page.getByLabel(/カード番号/)).toBeVisible();
    await expect(page.getByLabel(/カード名義/)).toBeVisible();
    await expect(page.getByLabel(/有効期限/)).toBeVisible();
    await expect(page.getByLabel(/ログインID/)).toBeVisible();
    await expect(page.getByLabel(/パスワード/)).toBeVisible();
    await expect(page.getByLabel(/引落日/)).toBeVisible();
    await expect(page.getByLabel(/締め日/)).toBeVisible();
    await expect(page.getByLabel(/API認証キー/)).toBeVisible();

    // 接続テストボタンが表示されることを確認
    await expect(page.getByRole('button', { name: '接続テスト' })).toBeVisible();

    // カード会社を変更ボタンが表示されることを確認
    await expect(page.getByRole('button', { name: /カード会社を変更/ })).toBeVisible();
  });

  test('バリデーションエラーが表示される（カード番号が不正）', async ({ page }) => {
    // 最初のカード会社を選択（beforeEachで既に待機済み）
    await page
      .locator('button')
      .filter({ hasText: /コード:/ })
      .first()
      .click();

    // 認証情報入力画面に遷移することを確認
    await expect(page.getByText('2. 認証情報入力')).toBeVisible();

    // 不正なカード番号を入力（15桁）
    await page.getByLabel(/カード番号/).fill('123456789012345');

    // 接続テストボタンをクリック
    await page.getByRole('button', { name: '接続テスト' }).click();

    // バリデーションエラーが表示されることを確認
    await expect(page.getByText('カード番号は16桁の数字で入力してください')).toBeVisible();
  });

  test('バリデーションエラーが表示される（ログインIDが不正）', async ({ page }) => {
    // 最初のカード会社を選択（beforeEachで既に待機済み）
    await page
      .locator('button')
      .filter({ hasText: /コード:/ })
      .first()
      .click();

    // 認証情報入力画面に遷移することを確認
    await expect(page.getByText('2. 認証情報入力')).toBeVisible();

    // 必須項目を入力（ログインID以外）
    await page.getByLabel(/カード番号/).fill(TEST_CARD_NUMBER);
    await page.getByLabel(/カード名義/).fill(TEST_CARD_HOLDER_NAME);
    await page.getByLabel(/有効期限/).fill(TEST_EXPIRY_DATE);
    await page.getByLabel(/パスワード/).fill(TEST_PASSWORD);

    // 不正なログインIDを入力（メールアドレス形式ではない）
    const usernameInput = page.getByLabel(/ログインID/);
    await usernameInput.fill('invalid-email');

    // HTML5のemail型のバリデーションを回避するため、type属性を変更（オプション）
    // または、接続テストボタンをクリックしてJavaScriptのバリデーションを確認

    // 接続テストボタンをクリック
    // バリデーションエラーが表示されるため、APIリクエストは送信されない
    await page.getByRole('button', { name: '接続テスト' }).click();

    // バリデーションエラーが表示されることを確認
    // パスワードのバリデーションテストと同じ方法で確認
    // エラーメッセージは<p>タグで表示される
    await expect(
      page.getByText('ログインIDは有効なメールアドレス形式で入力してください')
    ).toBeVisible({ timeout: 10000 });
  });

  test('バリデーションエラーが表示される（パスワードが短い）', async ({ page }) => {
    // 最初のカード会社を選択（beforeEachで既に待機済み）
    await page
      .locator('button')
      .filter({ hasText: /コード:/ })
      .first()
      .click();

    // 認証情報入力画面に遷移することを確認
    await expect(page.getByText('2. 認証情報入力')).toBeVisible();

    // 短いパスワードを入力（7文字）
    await page.getByLabel(/パスワード/).fill('short');

    // 接続テストボタンをクリック
    await page.getByRole('button', { name: '接続テスト' }).click();

    // バリデーションエラーが表示されることを確認
    await expect(page.getByText('パスワードは8文字以上で入力してください')).toBeVisible();
  });

  test('接続テストが実行される（正常系）', async ({ page }) => {
    // 最初のカード会社を選択（beforeEachで既に待機済み）
    await page
      .locator('button')
      .filter({ hasText: /コード:/ })
      .first()
      .click();

    // 認証情報入力画面に遷移することを確認
    await expect(page.getByText('2. 認証情報入力')).toBeVisible();

    // 認証情報を入力
    await page.getByLabel(/カード番号/).fill(TEST_CARD_NUMBER);
    await page.getByLabel(/カード名義/).fill(TEST_CARD_HOLDER_NAME);
    await page.getByLabel(/有効期限/).fill(TEST_EXPIRY_DATE);
    await page.getByLabel(/ログインID/).fill(TEST_USERNAME);
    await page.getByLabel(/パスワード/).fill(TEST_PASSWORD);
    await page.getByLabel(/API認証キー/).fill(TEST_API_KEY);

    // 接続テストAPIリクエストを待機
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/credit-cards/test-connection') &&
        response.request().method() === 'POST',
      { timeout: 10000 }
    );

    // 接続テストボタンをクリック
    await page.getByRole('button', { name: '接続テスト' }).click();

    // APIレスポンスを待機
    await responsePromise;

    // 接続テスト結果画面に遷移することを確認
    await expect(page.getByText('3. 接続テスト')).toBeVisible();
  });

  test('接続テストが実行される（異常系）', async ({ page }) => {
    // 最初のカード会社を選択（beforeEachで既に待機済み）
    await page
      .locator('button')
      .filter({ hasText: /コード:/ })
      .first()
      .click();

    // 認証情報入力画面に遷移することを確認
    await expect(page.getByText('2. 認証情報入力')).toBeVisible();

    // 有効なカード番号を入力（Luhnアルゴリズムで有効）
    // 接続テスト自体は失敗するが、バリデーションは通過する
    await page.getByLabel(/カード番号/).fill(TEST_CARD_NUMBER);
    await page.getByLabel(/カード名義/).fill(TEST_CARD_HOLDER_NAME);
    await page.getByLabel(/有効期限/).fill(TEST_EXPIRY_DATE);
    // 不正な認証情報を入力（存在しないユーザー名/パスワード）
    await page.getByLabel(/ログインID/).fill('invalid-user@example.com');
    await page.getByLabel(/パスワード/).fill('invalid-password');

    // 接続テストAPIリクエストを待機するPromiseを作成（クリックの前に作成）
    // エンドポイントは/api/api/credit-cards/test-connection（@Controller('api/credit-cards') + setGlobalPrefix('api')）
    const responsePromise = page.waitForResponse(
      (response) =>
        (response.url().includes('/api/api/credit-cards/test-connection') ||
          response.url().includes('/credit-cards/test-connection')) &&
        response.request().method() === 'POST',
      { timeout: 30000 }
    );

    // 接続テストボタンをクリック
    await page.getByRole('button', { name: '接続テスト' }).click();

    // APIレスポンスを待機（エラーレスポンスも含む）
    const response = await responsePromise;
    const responseBody = await response.json();

    // 接続テスト結果画面に遷移することを確認
    await expect(page.getByText('3. 接続テスト')).toBeVisible({ timeout: 10000 });

    // 接続失敗時のエラーメッセージが表示されることを確認
    // レスポンスが失敗していることを確認
    expect(responseBody.success).toBe(false);
    await expect(
      page.getByText(/接続に失敗しました|接続テストに失敗しました|エラー/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('カード会社を変更ボタンが機能する', async ({ page }) => {
    // 最初のカード会社を選択（beforeEachで既に待機済み）
    await page
      .locator('button')
      .filter({ hasText: /コード:/ })
      .first()
      .click();

    // 認証情報入力画面に遷移することを確認
    await expect(page.getByText('2. 認証情報入力')).toBeVisible();

    // カード会社を変更ボタンをクリック
    await page.getByRole('button', { name: /カード会社を変更/ }).click();

    // カード会社選択画面に戻ることを確認
    await expect(page.getByText('1. カード会社選択')).toBeVisible();
    await expect(page.getByPlaceholder('カード会社名またはコードで検索')).toBeVisible();
  });

  test('パスワードの表示/非表示切替が機能する', async ({ page }) => {
    // 最初のカード会社を選択（beforeEachで既に待機済み）
    await page
      .locator('button')
      .filter({ hasText: /コード:/ })
      .first()
      .click();

    // 認証情報入力画面に遷移することを確認
    await expect(page.getByText('2. 認証情報入力')).toBeVisible();

    // パスワード入力フィールドを取得
    const passwordInput = page.getByLabel(/パスワード/);

    // 初期状態では非表示（type="password"）であることを確認
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // 表示ボタンをクリック
    await page.getByRole('button', { name: '表示' }).click();

    // 表示状態（type="text"）になることを確認
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // 非表示ボタンをクリック
    await page.getByRole('button', { name: '非表示' }).click();

    // 非表示状態（type="password"）に戻ることを確認
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('戻るボタンが機能する', async ({ page }) => {
    // 戻るボタンをクリック
    await page.getByRole('button', { name: '戻る' }).click();

    // 前のページに戻ることを確認（URLが変更される）
    await expect(page).not.toHaveURL('/credit-cards/add');
  });
});
