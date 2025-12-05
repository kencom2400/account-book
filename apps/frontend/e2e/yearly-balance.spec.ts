import { test, expect } from '@playwright/test';

// E2E環境のAPIベースURLを取得（環境変数から、デフォルトは3021）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3021';

test.describe('年間収支推移表示機能 (FR-020)', () => {
  test.beforeEach(async () => {
    // テストデータの準備（必要に応じて）
    // ここでは既存のデータを使用する前提
  });

  test('年間収支推移APIが正常に動作すること', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/aggregation/yearly-balance?year=2024`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.year).toBe(2024);
    expect(data.data.months).toHaveLength(12);
    expect(data.data.annual).toBeDefined();
    expect(data.data.trend).toBeDefined();
    expect(data.data.highlights).toBeDefined();
  });

  test('年間収支推移APIが空データを返すこと（データがない場合）', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/aggregation/yearly-balance?year=1900`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.year).toBe(1900);
    expect(data.data.months).toHaveLength(12);
    // すべての月が空データであることを確認
    for (const month of data.data.months) {
      expect(month.income.total).toBe(0);
      expect(month.expense.total).toBe(0);
      expect(month.balance).toBe(0);
    }
    expect(data.data.annual.totalIncome).toBe(0);
    expect(data.data.annual.totalExpense).toBe(0);
    expect(data.data.annual.totalBalance).toBe(0);
  });

  test('年間収支推移APIがバリデーションエラーを返すこと（無効な年）', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/aggregation/yearly-balance?year=1800`);

    expect(response.status()).toBe(400);
  });

  test('年間収支推移APIがバリデーションエラーを返すこと（年が未指定）', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/aggregation/yearly-balance`);

    expect(response.status()).toBe(400);
  });

  test('年間収支推移APIのレスポンス構造が正しいこと', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/aggregation/yearly-balance?year=2024`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.data.months[0]).toHaveProperty('month');
    expect(data.data.months[0]).toHaveProperty('income');
    expect(data.data.months[0]).toHaveProperty('expense');
    expect(data.data.months[0]).toHaveProperty('balance');
    expect(data.data.months[0]).toHaveProperty('savingsRate');
    expect(data.data.months[0]).not.toHaveProperty('comparison'); // 年間集計ではcomparisonフィールドは不要

    expect(data.data.annual).toHaveProperty('totalIncome');
    expect(data.data.annual).toHaveProperty('totalExpense');
    expect(data.data.annual).toHaveProperty('totalBalance');
    expect(data.data.annual).toHaveProperty('averageIncome');
    expect(data.data.annual).toHaveProperty('averageExpense');
    expect(data.data.annual).toHaveProperty('savingsRate');

    expect(data.data.trend).toHaveProperty('incomeProgression');
    expect(data.data.trend).toHaveProperty('expenseProgression');
    expect(data.data.trend).toHaveProperty('balanceProgression');
    expect(data.data.trend.incomeProgression).toHaveProperty('direction');
    expect(data.data.trend.incomeProgression).toHaveProperty('changeRate');
    expect(data.data.trend.incomeProgression).toHaveProperty('standardDeviation');

    expect(data.data.highlights).toHaveProperty('maxIncomeMonth');
    expect(data.data.highlights).toHaveProperty('maxExpenseMonth');
    expect(data.data.highlights).toHaveProperty('bestBalanceMonth');
    expect(data.data.highlights).toHaveProperty('worstBalanceMonth');
  });
});
