/**
 * 照合エラー
 */
export class ReconciliationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ReconciliationError';
  }
}

/**
 * カード請求データが見つからないエラー
 */
export class CardSummaryNotFoundError extends ReconciliationError {
  constructor(cardId: string, billingMonth: string) {
    super('カード請求データが見つかりません', 'RC001', {
      cardId,
      billingMonth,
    });
    this.name = 'CardSummaryNotFoundError';
  }
}

/**
 * 外部サービスへの接続失敗エラー
 */
export class BankTransactionNotFoundError extends ReconciliationError {
  constructor(cardId: string, billingMonth: string) {
    super('外部サービスへの接続に失敗しました', 'RC002', {
      cardId,
      billingMonth,
    });
    this.name = 'BankTransactionNotFoundError';
  }
}

/**
 * 引落予定日が未来エラー
 */
export class InvalidPaymentDateError extends ReconciliationError {
  constructor(paymentDate: Date, currentDate: Date) {
    super('引落予定日が未来です。引落日到来後に再実行してください', 'RC003', {
      paymentDate,
      currentDate,
    });
    this.name = 'InvalidPaymentDateError';
  }
}

/**
 * 複数の候補取引が存在エラー
 */
export class MultipleCandidateError extends ReconciliationError {
  constructor(
    candidates: Array<{
      id: string;
      date: Date;
      amount: number;
      description: string;
    }>,
  ) {
    super('複数の候補取引が存在します。手動で選択してください', 'RC004', {
      candidates,
    });
    this.name = 'MultipleCandidateError';
  }
}
