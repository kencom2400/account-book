import { InstitutionType } from '@account-book/types';
import { AccountEntity } from './account.entity';
import { EncryptedCredentials } from '../value-objects/encrypted-credentials.vo';

/**
 * Institutionエンティティ
 * 金融機関情報を表すドメインエンティティ
 */
export class InstitutionEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: InstitutionType,
    public readonly credentials: EncryptedCredentials,
    public readonly isConnected: boolean,
    public readonly lastSyncedAt: Date | null,
    public readonly accounts: AccountEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id) {
      throw new Error('Institution ID is required');
    }

    if (!this.name) {
      throw new Error('Institution name is required');
    }

    if (!this.type) {
      throw new Error('Institution type is required');
    }

    if (!this.credentials) {
      throw new Error('Institution credentials are required');
    }
  }

  /**
   * 銀行かどうか
   */
  isBank(): boolean {
    return this.type === InstitutionType.BANK;
  }

  /**
   * クレジットカードかどうか
   */
  isCreditCard(): boolean {
    return this.type === InstitutionType.CREDIT_CARD;
  }

  /**
   * 証券会社かどうか
   */
  isSecurities(): boolean {
    return this.type === InstitutionType.SECURITIES;
  }

  /**
   * 接続状態を更新する
   */
  updateConnectionStatus(isConnected: boolean): InstitutionEntity {
    return new InstitutionEntity(
      this.id,
      this.name,
      this.type,
      this.credentials,
      isConnected,
      this.lastSyncedAt,
      this.accounts,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 最終同期日時を更新する
   */
  updateLastSyncedAt(date: Date): InstitutionEntity {
    return new InstitutionEntity(
      this.id,
      this.name,
      this.type,
      this.credentials,
      this.isConnected,
      date,
      this.accounts,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 認証情報を更新する
   */
  updateCredentials(credentials: EncryptedCredentials): InstitutionEntity {
    return new InstitutionEntity(
      this.id,
      this.name,
      this.type,
      credentials,
      this.isConnected,
      this.lastSyncedAt,
      this.accounts,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 口座を追加する
   */
  addAccount(account: AccountEntity): InstitutionEntity {
    const newAccounts = [...this.accounts, account];
    return new InstitutionEntity(
      this.id,
      this.name,
      this.type,
      this.credentials,
      this.isConnected,
      this.lastSyncedAt,
      newAccounts,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 口座を更新する
   */
  updateAccount(accountId: string, updatedAccount: AccountEntity): InstitutionEntity {
    const newAccounts = this.accounts.map((account) =>
      account.id === accountId ? updatedAccount : account,
    );
    return new InstitutionEntity(
      this.id,
      this.name,
      this.type,
      this.credentials,
      this.isConnected,
      this.lastSyncedAt,
      newAccounts,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 口座を削除する
   */
  removeAccount(accountId: string): InstitutionEntity {
    const newAccounts = this.accounts.filter(
      (account) => account.id !== accountId,
    );
    return new InstitutionEntity(
      this.id,
      this.name,
      this.type,
      this.credentials,
      this.isConnected,
      this.lastSyncedAt,
      newAccounts,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * プレーンオブジェクトに変換
   */
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      credentials: this.credentials.toJSON(),
      isConnected: this.isConnected,
      lastSyncedAt: this.lastSyncedAt,
      accounts: this.accounts.map((account) => account.toJSON()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

