import { CreditCardEntity } from '../entities/credit-card.entity';
import { CreditCardTransactionEntity } from '../entities/credit-card-transaction.entity';
import { PaymentVO } from '../value-objects/payment.vo';

/**
 * CreditCard Repository Interface
 * クレジットカード情報の永続化を抽象化
 */
export interface ICreditCardRepository {
  /**
   * クレジットカードを保存
   */
  save(creditCard: CreditCardEntity): Promise<CreditCardEntity>;

  /**
   * IDでクレジットカードを取得
   */
  findById(id: string): Promise<CreditCardEntity | null>;

  /**
   * 全てのクレジットカードを取得
   */
  findAll(): Promise<CreditCardEntity[]>;

  /**
   * 接続済みのクレジットカードを取得
   */
  findConnected(): Promise<CreditCardEntity[]>;

  /**
   * 発行会社でクレジットカードを検索
   */
  findByIssuer(issuer: string): Promise<CreditCardEntity[]>;

  /**
   * クレジットカードを削除
   */
  delete(id: string): Promise<void>;

  /**
   * クレジットカードが存在するかチェック
   */
  exists(id: string): Promise<boolean>;
}

/**
 * CreditCardTransaction Repository Interface
 * クレジットカード取引情報の永続化を抽象化
 */
export interface ICreditCardTransactionRepository {
  /**
   * 取引を保存
   */
  save(
    transaction: CreditCardTransactionEntity,
  ): Promise<CreditCardTransactionEntity>;

  /**
   * 複数の取引を一括保存
   */
  saveMany(
    transactions: CreditCardTransactionEntity[],
  ): Promise<CreditCardTransactionEntity[]>;

  /**
   * IDで取引を取得
   */
  findById(id: string): Promise<CreditCardTransactionEntity | null>;

  /**
   * クレジットカードIDで取引を取得
   */
  findByCreditCardId(
    creditCardId: string,
  ): Promise<CreditCardTransactionEntity[]>;

  /**
   * クレジットカードIDと期間で取引を取得
   */
  findByCreditCardIdAndDateRange(
    creditCardId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CreditCardTransactionEntity[]>;

  /**
   * 未払いの取引を取得
   */
  findUnpaid(creditCardId: string): Promise<CreditCardTransactionEntity[]>;

  /**
   * 月別の取引を取得
   */
  findByMonth(
    creditCardId: string,
    year: number,
    month: number,
  ): Promise<CreditCardTransactionEntity[]>;

  /**
   * 取引を削除
   */
  delete(id: string): Promise<void>;

  /**
   * 取引が存在するかチェック
   */
  exists(id: string): Promise<boolean>;
}

/**
 * Payment Repository Interface
 * 支払い情報の永続化を抽象化
 */
export interface IPaymentRepository {
  /**
   * 支払い情報を保存
   */
  save(creditCardId: string, payment: PaymentVO): Promise<PaymentVO>;

  /**
   * クレジットカードIDと請求月で支払い情報を取得
   */
  findByCreditCardIdAndMonth(
    creditCardId: string,
    billingMonth: string,
  ): Promise<PaymentVO | null>;

  /**
   * クレジットカードIDで全ての支払い情報を取得
   */
  findByCreditCardId(creditCardId: string): Promise<PaymentVO[]>;

  /**
   * 未払いの支払い情報を取得
   */
  findUnpaid(creditCardId: string): Promise<PaymentVO[]>;

  /**
   * 期限切れの支払い情報を取得
   */
  findOverdue(creditCardId: string): Promise<PaymentVO[]>;

  /**
   * 支払い情報を削除
   */
  delete(creditCardId: string, billingMonth: string): Promise<void>;
}

