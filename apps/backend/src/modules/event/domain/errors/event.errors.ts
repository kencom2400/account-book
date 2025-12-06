/**
 * イベント関連のエラー
 */

/**
 * イベントが見つからないエラー
 */
export class EventNotFoundException extends Error {
  public readonly code = 'EV001';

  constructor(public readonly eventId: string) {
    super(`Event not found: ${eventId}`);
    this.name = 'EventNotFoundException';
  }
}
