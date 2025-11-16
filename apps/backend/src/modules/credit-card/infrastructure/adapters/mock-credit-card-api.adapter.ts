import { Injectable } from '@nestjs/common';
import {
  ICreditCardAPIClient,
  ConnectionResult,
  CardInfo,
  APITransaction,
  APIPaymentInfo,
} from './credit-card-api.adapter.interface';
import { CreditCardTransactionEntity } from '../../domain/entities/credit-card-transaction.entity';
import { PaymentVO, PaymentStatus } from '../../domain/value-objects/payment.vo';
import { TransactionCategory } from '@account-book/types';

/**
 * MockCreditCardAPIAdapter
 * クレジットカードAPIのモック実装（開発・テスト用）
 */
@Injectable()
export class MockCreditCardAPIAdapter implements ICreditCardAPIClient {
  async testConnection(_credentials: {
    username: string;
    password: string;
  }): Promise<ConnectionResult> {
    // モックとして常に成功
    await this.simulateNetworkDelay();

    if (!_credentials.username || !_credentials.password) {
      return {
        success: false,
        error: 'Invalid credentials',
      };
    }

    return {
      success: true,
    };
  }

  async getCardInfo(): Promise<CardInfo> {
    await this.simulateNetworkDelay();

    return {
      cardNumber: '1234', // 下4桁
      creditLimit: 500000,
      currentBalance: 125000,
      availableCredit: 375000,
    };
  }

  async getTransactions(
    _credentials: unknown, // eslint-disable-line @typescript-eslint/no-unused-vars
    startDate: Date,
    endDate: Date,
  ): Promise<APITransaction[]> {
    await this.simulateNetworkDelay();

    // モックデータを生成
    const transactions: APITransaction[] = [];
    const daysDiff = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // サンプル取引を生成
    for (let i = 0; i < Math.min(daysDiff, 20); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i * Math.floor(daysDiff / 20));

      transactions.push({
        id: `tx_${Date.now()}_${i}`,
        date,
        postingDate: new Date(date.getTime() + 1000 * 60 * 60 * 24), // 翌日
        amount: Math.floor(Math.random() * 50000) + 1000,
        merchantName: this.getMockMerchantName(),
        merchantCategory: this.getMockMerchantCategory(),
        description: 'カード利用',
        isInstallment: Math.random() > 0.8,
        installmentCount: Math.random() > 0.8 ? 12 : undefined,
        installmentNumber: Math.random() > 0.8 ? 1 : undefined,
      });
    }

    return transactions;
  }

  async getPaymentInfo(): Promise<APIPaymentInfo> {
    await this.simulateNetworkDelay();

    const now = new Date();
    const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const closingDate = new Date(now.getFullYear(), now.getMonth(), 15);
    const paymentDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 10);

    return {
      billingMonth,
      closingDate,
      paymentDueDate,
      totalAmount: 125000,
      paidAmount: 0,
      status: 'unpaid',
    };
  }

  mapToTransactionEntity(
    creditCardId: string,
    apiTransaction: APITransaction,
  ): CreditCardTransactionEntity {
    return new CreditCardTransactionEntity(
      apiTransaction.id,
      creditCardId,
      apiTransaction.date,
      apiTransaction.postingDate,
      apiTransaction.amount,
      apiTransaction.merchantName,
      apiTransaction.merchantCategory,
      apiTransaction.description,
      this.mapToCategory(apiTransaction.merchantCategory),
      apiTransaction.isInstallment,
      apiTransaction.installmentCount || null,
      apiTransaction.installmentNumber || null,
      false, // 初期状態は未払い
      null,
      null,
      new Date(),
      new Date(),
    );
  }

  mapToPaymentVO(billingMonth: string, apiPaymentInfo: APIPaymentInfo): PaymentVO {
    const status = this.mapToPaymentStatus(apiPaymentInfo.status);
    const remainingAmount = apiPaymentInfo.totalAmount - apiPaymentInfo.paidAmount;

    return new PaymentVO(
      billingMonth,
      apiPaymentInfo.closingDate,
      apiPaymentInfo.paymentDueDate,
      apiPaymentInfo.totalAmount,
      apiPaymentInfo.paidAmount,
      remainingAmount,
      status,
    );
  }

  private mapToCategory(merchantCategory: string): TransactionCategory {
    // 簡易的なカテゴリマッピング
    const categoryMap: { [key: string]: TransactionCategory } = {
      'レストラン': TransactionCategory.EXPENSE,
      'スーパー': TransactionCategory.EXPENSE,
      'コンビニ': TransactionCategory.EXPENSE,
      '交通': TransactionCategory.EXPENSE,
      'その他': TransactionCategory.EXPENSE,
    };

    return categoryMap[merchantCategory] || TransactionCategory.EXPENSE;
  }

  private mapToPaymentStatus(status: string): PaymentStatus {
    const statusMap: { [key: string]: PaymentStatus } = {
      paid: PaymentStatus.PAID,
      unpaid: PaymentStatus.UNPAID,
      overdue: PaymentStatus.OVERDUE,
      pending: PaymentStatus.PENDING,
    };

    return statusMap[status] || PaymentStatus.UNPAID;
  }

  private getMockMerchantName(): string {
    const merchants = [
      'セブンイレブン',
      'ローソン',
      'ファミリーマート',
      'イオン',
      'ヨドバシカメラ',
      'Amazon',
      'スターバックス',
      '吉野家',
      'マクドナルド',
      'JR東日本',
    ];

    return merchants[Math.floor(Math.random() * merchants.length)];
  }

  private getMockMerchantCategory(): string {
    const categories = [
      'コンビニ',
      'スーパー',
      'レストラン',
      '交通',
      '家電',
      'その他',
    ];

    return categories[Math.floor(Math.random() * categories.length)];
  }

  private async simulateNetworkDelay(): Promise<void> {
    const delay = Math.floor(Math.random() * 500) + 200; // 200-700ms
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

