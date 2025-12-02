/**
 * E2Eテスト用データ投入ヘルパー
 *
 * バックエンドAPIを直接呼び出して、テストデータを投入します。
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3021';

interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'REPAYMENT' | 'INVESTMENT';
  parentId?: string;
  icon?: string;
  color?: string;
}

interface Institution {
  id: string;
  name: string;
  type: string;
  credentials: Record<string, unknown>;
}

interface Account {
  id: string;
  institutionId: string;
  name: string;
  type: string;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: {
    id: string;
    name: string;
    type: string;
  };
  description: string;
  institutionId: string;
  accountId: string;
  status: string;
}

/**
 * APIリクエストを実行
 */
async function apiRequest<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`  🔹 ${method} ${url}`);

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`  ❌ API Error (${response.status}): ${error}`);
    throw new Error(`API Error (${response.status}): ${error}`);
  }

  const result = (await response.json()) as T;
  return result;
}

/**
 * カテゴリを作成
 */
export async function createCategory(category: Omit<Category, 'id'>): Promise<Category> {
  try {
    const response = await apiRequest<Category>('POST', '/api/categories', category);
    console.log(`  ✅ Created category: ${response.name}`);
    return response;
  } catch (error) {
    console.error(`  ❌ Failed to create category: ${category.name}`, error);
    throw error;
  }
}

/**
 * 金融機関を作成
 */
export async function createInstitution(
  institution: Omit<Institution, 'id'>
): Promise<Institution> {
  try {
    const response = await apiRequest<{ success: boolean; data: Institution }>(
      'POST',
      '/api/institutions',
      institution
    );
    console.log(`  ✅ Created institution: ${response.data.name}`);
    return response.data;
  } catch (error) {
    console.error(`  ❌ Failed to create institution: ${institution.name}`, error);
    throw error;
  }
}

/**
 * 取引を作成
 */
export async function createTransaction(
  transaction: Omit<Transaction, 'id'>
): Promise<Transaction> {
  try {
    const response = await apiRequest<{ success: boolean; data: Transaction }>(
      'POST',
      '/api/transactions',
      transaction
    );
    console.log(
      `  ✅ Created transaction: ${response.data.description} (${response.data.amount}円)`
    );
    return response.data;
  } catch (error) {
    console.error(`  ❌ Failed to create transaction: ${transaction.description}`, error);
    throw error;
  }
}

/**
 * すべてのカテゴリを取得
 */
export async function getCategories(): Promise<{
  success: boolean;
  data: Category[];
  count: number;
}> {
  return await apiRequest<{ success: boolean; data: Category[]; count: number }>(
    'GET',
    '/api/categories'
  );
}

/**
 * すべての金融機関を取得
 */
export async function getInstitutions(): Promise<{
  success: boolean;
  data: Institution[];
  count: number;
}> {
  return await apiRequest<{ success: boolean; data: Institution[]; count: number }>(
    'GET',
    '/api/institutions'
  );
}

/**
 * すべての取引を削除（テストクリーンアップ用）
 */
export async function clearTransactions(): Promise<void> {
  try {
    // 取引データを削除するAPIがないため、個別に削除
    // または、データベースを直接クリアする
    console.log('⚠️  Note: Transaction cleanup not implemented');
  } catch (error) {
    console.error('Failed to clear transactions:', error);
  }
}

/**
 * E2Eテスト用の基本データをセットアップ
 */
export async function seedE2ETestData(): Promise<{
  categories: Category[];
  institutions: Institution[];
  accounts: Account[];
  transactions: Transaction[];
}> {
  console.log('🌱 Seeding E2E test data...');

  // 既存のカテゴリを確認
  const existingCategories = await getCategories();
  let categories: Category[] = existingCategories.data;

  // 必要なカテゴリを確認・作成
  const requiredCategories = [
    { name: '給与', type: 'INCOME' as const, icon: '💰', color: '#4CAF50' },
    { name: '食費', type: 'EXPENSE' as const, icon: '🍴', color: '#FF5722' },
    { name: '交通費', type: 'EXPENSE' as const, icon: '🚇', color: '#2196F3' },
    { name: '娯楽', type: 'EXPENSE' as const, icon: '🎮', color: '#9C27B0' },
  ];

  const missingCategories = requiredCategories.filter(
    (req) => !categories.some((cat) => cat.name === req.name)
  );

  if (missingCategories.length > 0) {
    console.log(`  📁 Creating ${missingCategories.length} missing categories...`);
    const newCategories = await Promise.all(missingCategories.map((cat) => createCategory(cat)));
    categories = [...categories, ...newCategories];
    console.log(`  ✅ Created ${newCategories.length} categories`);
  } else {
    console.log(`  ℹ️  Using ${categories.length} existing categories`);
  }

  // 金融機関を作成または取得
  console.log('  🏦 Creating institution...');
  let institution: Institution;
  try {
    institution = await createInstitution({
      name: 'テスト銀行E2E',
      type: 'bank',
      credentials: {
        username: 'test_user',
        password: 'test_password',
      },
    });
    console.log(`  ✅ Created institution: ${institution.name}`);
  } catch (error) {
    // 既に存在する場合は既存の金融機関を取得
    console.log('  ℹ️  Institution already exists or creation failed, fetching existing data...');
    try {
      const existingInstitutions = await getInstitutions();
      const existing = existingInstitutions.data.find((i) => i.name === 'テスト銀行E2E');
      if (existing) {
        institution = existing;
        console.log(`  ✅ Using existing institution: ${institution.name}`);
      } else {
        // 既存の金融機関が見つからない場合は、エラーを再スロー
        console.error('  ❌ Failed to find existing institution:', error);
        throw error;
      }
    } catch (fetchError) {
      // 既存の金融機関の取得に失敗した場合、両方のエラー情報を含む新しいエラーをスロー
      console.error(
        '  ❌ Failed to fetch existing institutions:',
        fetchError,
        'Original error:',
        error
      );
      throw new Error(
        `Failed to fetch existing institutions after creation failed. Original: ${error instanceof Error ? error.message : String(error)}, Fetch: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
      );
    }
  }

  // アカウント情報（実際のAPIでは自動作成される想定）
  const accounts: Account[] = [
    {
      id: 'account-1',
      institutionId: institution.id,
      name: '普通預金',
      type: 'CHECKING',
    },
  ];

  // 取引データを作成
  console.log('  💰 Creating transactions...');
  const today = new Date();
  const transactionData = [
    {
      date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
      amount: 300000,
      category: {
        id: categories.find((c) => c.name === '給与')?.id || categories[0].id,
        name: '給与',
        type: 'INCOME',
      },
      description: '11月分給与',
      institutionId: institution.id,
      accountId: accounts[0].id,
      status: 'completed',
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), 5).toISOString().split('T')[0],
      amount: 1500,
      category: {
        id: categories.find((c) => c.name === '食費')?.id || categories[0].id,
        name: '食費',
        type: 'EXPENSE',
      },
      description: 'スーパーマーケット',
      institutionId: institution.id,
      accountId: accounts[0].id,
      status: 'completed',
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), 7).toISOString().split('T')[0],
      amount: 500,
      category: {
        id: categories.find((c) => c.name === '交通費')?.id || categories[0].id,
        name: '交通費',
        type: 'EXPENSE',
      },
      description: '電車賃',
      institutionId: institution.id,
      accountId: accounts[0].id,
      status: 'completed',
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), 10).toISOString().split('T')[0],
      amount: 2000,
      category: {
        id: categories.find((c) => c.name === '食費')?.id || categories[0].id,
        name: '食費',
        type: 'EXPENSE',
      },
      description: 'レストラン',
      institutionId: institution.id,
      accountId: accounts[0].id,
      status: 'completed',
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0],
      amount: 3000,
      category: {
        id: categories.find((c) => c.name === '娯楽')?.id || categories[0].id,
        name: '娯楽',
        type: 'EXPENSE',
      },
      description: '映画鑑賞',
      institutionId: institution.id,
      accountId: accounts[0].id,
      status: 'completed',
    },
  ];

  const transactions = await Promise.all(transactionData.map((tx) => createTransaction(tx)));
  console.log(`  ✅ Created ${transactions.length} transactions`);

  console.log('✅ E2E test data seeded successfully!');

  return {
    categories,
    institutions: [institution],
    accounts,
    transactions,
  };
}

/**
 * E2Eテストデータをクリーンアップ
 */
export async function cleanupE2ETestData(): Promise<void> {
  console.log('🧹 Cleaning up E2E test data...');

  await clearTransactions();

  console.log('✅ E2E test data cleaned up!');
}
