/**
 * 時間単位列挙型
 *
 * @description
 * カスタム同期間隔の時間単位を定義します。
 * FR-030: データ同期間隔の設定
 */
export enum TimeUnit {
  /** 分 */
  MINUTES = 'minutes',

  /** 時間 */
  HOURS = 'hours',

  /** 日 */
  DAYS = 'days',
}
