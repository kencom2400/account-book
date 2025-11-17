/**
 * Accountエンティティ
 * 金融機関の口座情報を表すドメインエンティティ
 */
export class AccountEntity {
  constructor(
    public readonly id: string,
    public readonly institutionId: string,
    public readonly accountNumber: string,
    public readonly accountName: string,
    public readonly balance: number,
    public readonly currency: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id) {
      throw new Error('Account ID is required');
    }

    if (!this.institutionId) {
      throw new Error('Institution ID is required');
    }

    if (!this.accountNumber) {
      throw new Error('Account number is required');
    }

    if (!this.accountName) {
      throw new Error('Account name is required');
    }

    if (this.balance === undefined || this.balance === null) {
      throw new Error('Account balance is required');
    }

    if (!this.currency) {
      throw new Error('Currency is required');
    }
  }

  /**
   * 残高を更新する
   */
  updateBalance(balance: number): AccountEntity {
    return new AccountEntity(
      this.id,
      this.institutionId,
      this.accountNumber,
      this.accountName,
      balance,
      this.currency,
    );
  }

  /**
   * 残高がプラスかどうか
   */
  hasPositiveBalance(): boolean {
    return this.balance > 0;
  }

  /**
   * 残高がマイナスかどうか
   */
  hasNegativeBalance(): boolean {
    return this.balance < 0;
  }

  /**
   * プレーンオブジェクトに変換
   */
  toJSON(): any {
    return {
      id: this.id,
      institutionId: this.institutionId,
      accountNumber: this.accountNumber,
      accountName: this.accountName,
      balance: this.balance,
      currency: this.currency,
    };
  }
}
