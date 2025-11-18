import { CreditCardTransactionEntity } from '../../domain/entities/credit-card-transaction.entity';
import { PaymentVO } from '../../domain/value-objects/payment.vo';
import type { IFinancialApiClient } from '../../../health/domain/adapters/api-client.interface';

/**
 * クレジットカードAPI接続結果
 */
export interface ConnectionResult {
  success: boolean;
  error?: string;
}

/**
 * カード情報
 */
export interface CardInfo {
  cardNumber: string; // 下4桁
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
}

/**
 * API取引データ
 */
export interface APITransaction {
  id: string;
  date: Date;
  postingDate: Date;
  amount: number;
  merchantName: string;
  merchantCategory: string;
  description: string;
  isInstallment: boolean;
  installmentCount?: number;
  installmentNumber?: number;
}

/**
 * API支払い情報
 */
export interface APIPaymentInfo {
  billingMonth: string;
  closingDate: Date;
  paymentDueDate: Date;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

/**
 * CreditCardAPIClient Interface
 * クレジットカードAPIとの通信を抽象化
 */
export interface ICreditCardAPIClient extends IFinancialApiClient {
  /**
   * API接続テスト
   */
  testConnection(
    credentials: Record<string, unknown>,
  ): Promise<ConnectionResult>;

  /**
   * カード情報を取得
   */
  getCardInfo(credentials: Record<string, unknown>): Promise<CardInfo>;

  /**
   * 取引履歴を取得
   */
  getTransactions(
    credentials: Record<string, unknown>,
    startDate: Date,
    endDate: Date,
  ): Promise<APITransaction[]>;

  /**
   * 支払い情報を取得
   */
  getPaymentInfo(credentials: Record<string, unknown>): Promise<APIPaymentInfo>;

  /**
   * API取引データをエンティティにマッピング
   */
  mapToTransactionEntity(
    creditCardId: string,
    apiTransaction: APITransaction,
  ): CreditCardTransactionEntity;

  /**
   * API支払い情報をValueObjectにマッピング
   */
  mapToPaymentVO(
    billingMonth: string,
    apiPaymentInfo: APIPaymentInfo,
  ): PaymentVO;
}
