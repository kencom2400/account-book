/**
 * アラート関連のエラー
 */

/**
 * アラートが見つからないエラー
 */
export class AlertNotFoundException extends Error {
  public readonly code = 'AL001';

  constructor(public readonly alertId: string) {
    super(`Alert not found: ${alertId}`);
    this.name = 'AlertNotFoundException';
  }
}

/**
 * 重複アラート生成エラー
 */
export class DuplicateAlertException extends Error {
  public readonly code = 'AL002';

  constructor(public readonly reconciliationId: string) {
    super(
      `Duplicate alert already exists for reconciliation: ${reconciliationId}`,
    );
    this.name = 'DuplicateAlertException';
  }
}

/**
 * 既に解決済みのアラートエラー
 */
export class AlertAlreadyResolvedException extends Error {
  public readonly code = 'AL003';

  constructor(public readonly alertId: string) {
    super(`Alert is already resolved: ${alertId}`);
    this.name = 'AlertAlreadyResolvedException';
  }
}

/**
 * CRITICALアラート削除不可エラー
 */
export class CriticalAlertDeletionException extends Error {
  public readonly code = 'AL004';

  constructor(public readonly alertId: string) {
    super(`CRITICAL alert cannot be deleted: ${alertId}`);
    this.name = 'CriticalAlertDeletionException';
  }
}

/**
 * アラート生成失敗エラー
 */
export class AlertGenerationException extends Error {
  constructor(public readonly reason: string) {
    super(`Alert generation failed: ${reason}`);
    this.name = 'AlertGenerationException';
  }
}

/**
 * 通知送信失敗エラー
 */
export class NotificationSendException extends Error {
  constructor(public readonly reason: string) {
    super(`Notification send failed: ${reason}`);
    this.name = 'NotificationSendException';
  }
}

/**
 * アラート解決失敗エラー
 */
export class AlertResolutionException extends Error {
  constructor(public readonly reason: string) {
    super(`Alert resolution failed: ${reason}`);
    this.name = 'AlertResolutionException';
  }
}
