import { EventEntity } from '../entities/event.entity';

/**
 * Event Repositoryのインターフェース
 * ドメイン層で定義し、インフラ層で実装する
 */
export interface IEventRepository {
  /**
   * イベントを保存
   */
  save(event: EventEntity): Promise<EventEntity>;

  /**
   * IDでイベントを取得
   */
  findById(id: string): Promise<EventEntity | null>;

  /**
   * 日付範囲でイベントを取得
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<EventEntity[]>;

  /**
   * イベントを削除
   */
  delete(id: string): Promise<void>;

  /**
   * 取引IDでイベントを取得
   */
  findByTransactionId(transactionId: string): Promise<EventEntity[]>;

  /**
   * イベントIDで関連する取引ID一覧を取得
   */
  getTransactionIdsByEventId(eventId: string): Promise<string[]>;

  /**
   * イベントと取引を紐付け
   */
  linkTransaction(eventId: string, transactionId: string): Promise<void>;

  /**
   * イベントと取引の紐付けを解除
   */
  unlinkTransaction(eventId: string, transactionId: string): Promise<void>;
}

export const EVENT_REPOSITORY = Symbol('IEventRepository');
