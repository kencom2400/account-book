import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ISecuritiesAPIClient,
  SecuritiesConnectionResult,
  SecuritiesAccountInfo,
  SecuritiesHoldingData,
  SecuritiesTransactionData,
  SecuritiesAPICredentials,
} from './securities-api.adapter.interface';
import { HoldingEntity } from '../../domain/entities/holding.entity';
import { SecurityTransactionEntity } from '../../domain/entities/security-transaction.entity';

/**
 * MockSecuritiesAPIAdapter
 * 証券会社APIのモック実装（開発・テスト用）
 */
@Injectable()
export class MockSecuritiesAPIAdapter implements ISecuritiesAPIClient {
  async testConnection(
    _credentials: SecuritiesAPICredentials,
  ): Promise<SecuritiesConnectionResult> {
    await this.simulateNetworkDelay();

    if (!_credentials.loginId || !_credentials.password) {
      return {
        success: false,
        error: 'Invalid credentials',
      };
    }

    return {
      success: true,
    };
  }

  async getAccountInfo(
    _credentials: SecuritiesAPICredentials,
  ): Promise<SecuritiesAccountInfo> {
    await this.simulateNetworkDelay();

    return {
      accountNumber: _credentials.accountNumber,
      accountType: 'specific',
      totalEvaluationAmount: 2850000,
      cashBalance: 150000,
    };
  }

  async getHoldings(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _credentials: SecuritiesAPICredentials,
  ): Promise<SecuritiesHoldingData[]> {
    await this.simulateNetworkDelay();

    // モックデータ
    return [
      {
        securityCode: '7203',
        securityName: 'トヨタ自動車',
        quantity: 100,
        averageAcquisitionPrice: 2500,
        currentPrice: 2800,
        securityType: 'stock',
        market: '東証プライム',
      },
      {
        securityCode: '6758',
        securityName: 'ソニーグループ',
        quantity: 50,
        averageAcquisitionPrice: 15000,
        currentPrice: 16000,
        securityType: 'stock',
        market: '東証プライム',
      },
      {
        securityCode: '1321',
        securityName: '日経225連動型上場投資信託',
        quantity: 10,
        averageAcquisitionPrice: 38000,
        currentPrice: 39500,
        securityType: 'etf',
        market: '東証',
      },
      {
        securityCode: '1306',
        securityName: 'TOPIX連動型上場投資信託',
        quantity: 20,
        averageAcquisitionPrice: 2200,
        currentPrice: 2300,
        securityType: 'etf',
        market: '東証',
      },
    ];
  }

  async getTransactions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _credentials: SecuritiesAPICredentials,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startDate: Date,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _endDate: Date,
  ): Promise<SecuritiesTransactionData[]> {
    await this.simulateNetworkDelay();

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 10);

    // モックデータ
    return [
      {
        id: `tx_${randomUUID()}`,
        securityCode: '7203',
        securityName: 'トヨタ自動車',
        transactionDate: lastMonth,
        transactionType: 'buy',
        quantity: 100,
        price: 2500,
        fee: 500,
        status: 'completed',
      },
      {
        id: `tx_${randomUUID()}`,
        securityCode: '6758',
        securityName: 'ソニーグループ',
        transactionDate: twoMonthsAgo,
        transactionType: 'buy',
        quantity: 50,
        price: 15000,
        fee: 750,
        status: 'completed',
      },
      {
        id: `tx_${randomUUID()}`,
        securityCode: '7203',
        securityName: 'トヨタ自動車',
        transactionDate: new Date(now.getFullYear(), now.getMonth(), 1),
        transactionType: 'dividend',
        quantity: 100,
        price: 25, // 配当単価
        fee: 0,
        status: 'completed',
      },
    ];
  }

  async getCurrentPrice(securityCode: string): Promise<number> {
    await this.simulateNetworkDelay();

    // モックとして固定価格を返す
    const prices: Record<string, number> = {
      '7203': 2800,
      '6758': 16000,
      '1321': 39500,
      '1306': 2300,
    };

    return prices[securityCode] || 1000;
  }

  mapToHoldingEntity(
    accountId: string,
    data: SecuritiesHoldingData,
  ): HoldingEntity {
    return new HoldingEntity(
      `hold_${randomUUID()}`,
      accountId,
      data.securityCode,
      data.securityName,
      data.quantity,
      data.averageAcquisitionPrice,
      data.currentPrice,
      data.securityType,
      data.market,
      new Date(),
    );
  }

  mapToTransactionEntity(
    accountId: string,
    data: SecuritiesTransactionData,
  ): SecurityTransactionEntity {
    const transactionDate =
      typeof data.transactionDate === 'string'
        ? new Date(data.transactionDate)
        : data.transactionDate;

    return new SecurityTransactionEntity(
      data.id,
      accountId,
      data.securityCode,
      data.securityName,
      transactionDate,
      data.transactionType,
      data.quantity,
      data.price,
      data.fee,
      data.status,
      new Date(),
    );
  }

  /**
   * ネットワーク遅延をシミュレート
   */
  private simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * 500 + 300; // 300-800ms
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
