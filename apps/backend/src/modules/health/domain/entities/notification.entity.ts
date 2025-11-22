/**
 * 通知エンティティ
 * FR-005: 接続失敗時の通知機能
 */
export class NotificationEntity {
  constructor(
    public readonly id: string,
    public readonly institutionId: string,
    public readonly institutionName: string,
    public readonly message: string,
    public readonly status: NotificationStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * 新しい通知を作成
   */
  static create(
    id: string,
    institutionId: string,
    institutionName: string,
    message: string,
  ): NotificationEntity {
    const now: Date = new Date();
    return new NotificationEntity(
      id,
      institutionId,
      institutionName,
      message,
      NotificationStatus.PENDING,
      now,
      now,
    );
  }

  /**
   * ステータスを更新
   */
  updateStatus(newStatus: NotificationStatus): NotificationEntity {
    return new NotificationEntity(
      this.id,
      this.institutionId,
      this.institutionName,
      this.message,
      newStatus,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 削除可能かどうかを判定
   * @param referenceDate 基準日時（通常は現在時刻）
   * @returns 削除可能な場合はtrue
   */
  canBeDeleted(referenceDate: Date): boolean {
    const daysSinceUpdate: number = this.getDaysSinceUpdate(referenceDate);

    switch (this.status) {
      case NotificationStatus.CONFIRMED:
      case NotificationStatus.ARCHIVED:
        return daysSinceUpdate >= 30;
      case NotificationStatus.DISMISSED:
        return daysSinceUpdate >= 7;
      case NotificationStatus.PENDING:
      case NotificationStatus.DISPLAYED:
      case NotificationStatus.LATER:
      default:
        return false;
    }
  }

  /**
   * 更新からの経過日数を計算
   */
  private getDaysSinceUpdate(referenceDate: Date): number {
    const diffMilliseconds: number =
      referenceDate.getTime() - this.updatedAt.getTime();
    return Math.floor(diffMilliseconds / (24 * 60 * 60 * 1000));
  }
}

/**
 * 通知ステータス
 */
export enum NotificationStatus {
  /** 未表示 */
  PENDING = 'pending',
  /** 表示中 */
  DISPLAYED = 'displayed',
  /** 後で確認 */
  LATER = 'later',
  /** ユーザー確認済み */
  CONFIRMED = 'confirmed',
  /** 却下 */
  DISMISSED = 'dismissed',
  /** アーカイブ */
  ARCHIVED = 'archived',
}
