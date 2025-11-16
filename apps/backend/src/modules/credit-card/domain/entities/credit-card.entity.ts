import { InstitutionType } from '@account-book/types';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

/**
 * CreditCardエンティティ
 * クレジットカード情報を表すドメインエンティティ
 */
export class CreditCardEntity {
  constructor(
    public readonly id: string,
    public readonly cardName: string,
    public readonly cardNumber: string, // 下4桁のみ保存
    public readonly cardHolderName: string,
    public readonly expiryDate: Date,
    public readonly credentials: EncryptedCredentials,
    public readonly isConnected: boolean,
    public readonly lastSyncedAt: Date | null,
    public readonly paymentDay: number, // 引き落とし日（1-31）
    public readonly closingDay: number, // 締め日（1-31）
    public readonly creditLimit: number, // 利用限度額
    public readonly currentBalance: number, // 現在の利用残高
    public readonly issuer: string, // カード発行会社
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id) {
      throw new Error('CreditCard ID is required');
    }

    if (!this.cardName) {
      throw new Error('Card name is required');
    }

    if (!this.cardNumber || this.cardNumber.length !== 4) {
      throw new Error('Card number must be last 4 digits');
    }

    if (!this.cardHolderName) {
      throw new Error('Card holder name is required');
    }

    if (!this.expiryDate) {
      throw new Error('Expiry date is required');
    }

    if (this.paymentDay < 1 || this.paymentDay > 31) {
      throw new Error('Payment day must be between 1 and 31');
    }

    if (this.closingDay < 1 || this.closingDay > 31) {
      throw new Error('Closing day must be between 1 and 31');
    }

    if (this.creditLimit < 0) {
      throw new Error('Credit limit must be positive');
    }

    if (this.currentBalance < 0) {
      throw new Error('Current balance must be positive');
    }

    if (this.currentBalance > this.creditLimit) {
      throw new Error('Current balance cannot exceed credit limit');
    }

    if (!this.issuer) {
      throw new Error('Issuer is required');
    }

    if (!this.credentials) {
      throw new Error('Credentials are required');
    }
  }

  /**
   * カードが有効期限切れかどうか
   */
  isExpired(): boolean {
    return this.expiryDate < new Date();
  }

  /**
   * 利用可能残高を計算
   */
  getAvailableCredit(): number {
    return this.creditLimit - this.currentBalance;
  }

  /**
   * 利用率を計算（パーセンテージ）
   */
  getUtilizationRate(): number {
    if (this.creditLimit === 0) return 0;
    return (this.currentBalance / this.creditLimit) * 100;
  }

  /**
   * 接続状態を更新する
   */
  updateConnectionStatus(isConnected: boolean): CreditCardEntity {
    return new CreditCardEntity(
      this.id,
      this.cardName,
      this.cardNumber,
      this.cardHolderName,
      this.expiryDate,
      this.credentials,
      isConnected,
      this.lastSyncedAt,
      this.paymentDay,
      this.closingDay,
      this.creditLimit,
      this.currentBalance,
      this.issuer,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 最終同期日時を更新する
   */
  updateLastSyncedAt(date: Date): CreditCardEntity {
    return new CreditCardEntity(
      this.id,
      this.cardName,
      this.cardNumber,
      this.cardHolderName,
      this.expiryDate,
      this.credentials,
      this.isConnected,
      date,
      this.paymentDay,
      this.closingDay,
      this.creditLimit,
      this.currentBalance,
      this.issuer,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 現在残高を更新する
   */
  updateBalance(newBalance: number): CreditCardEntity {
    if (newBalance < 0) {
      throw new Error('Balance must be positive');
    }

    if (newBalance > this.creditLimit) {
      throw new Error('Balance cannot exceed credit limit');
    }

    return new CreditCardEntity(
      this.id,
      this.cardName,
      this.cardNumber,
      this.cardHolderName,
      this.expiryDate,
      this.credentials,
      this.isConnected,
      this.lastSyncedAt,
      this.paymentDay,
      this.closingDay,
      this.creditLimit,
      newBalance,
      this.issuer,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 認証情報を更新する
   */
  updateCredentials(credentials: EncryptedCredentials): CreditCardEntity {
    return new CreditCardEntity(
      this.id,
      this.cardName,
      this.cardNumber,
      this.cardHolderName,
      this.expiryDate,
      credentials,
      this.isConnected,
      this.lastSyncedAt,
      this.paymentDay,
      this.closingDay,
      this.creditLimit,
      this.currentBalance,
      this.issuer,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * InstitutionTypeを返す
   */
  getType(): InstitutionType {
    return InstitutionType.CREDIT_CARD;
  }

  /**
   * プレーンオブジェクトに変換
   */
  toJSON(): any {
    return {
      id: this.id,
      cardName: this.cardName,
      cardNumber: this.cardNumber,
      cardHolderName: this.cardHolderName,
      expiryDate: this.expiryDate,
      credentials: this.credentials.toJSON(),
      isConnected: this.isConnected,
      lastSyncedAt: this.lastSyncedAt,
      paymentDay: this.paymentDay,
      closingDay: this.closingDay,
      creditLimit: this.creditLimit,
      currentBalance: this.currentBalance,
      availableCredit: this.getAvailableCredit(),
      utilizationRate: this.getUtilizationRate(),
      issuer: this.issuer,
      isExpired: this.isExpired(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

