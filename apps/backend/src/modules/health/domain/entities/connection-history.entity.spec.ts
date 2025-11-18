import { ConnectionHistory } from './connection-history.entity';
import { ConnectionStatus } from '../value-objects/connection-status.enum';

describe('ConnectionHistory', () => {
  describe('create', () => {
    it('新しい接続履歴を作成できる', () => {
      const history = ConnectionHistory.create(
        'inst-001',
        '三菱UFJ銀行',
        'bank',
        ConnectionStatus.CONNECTED,
        new Date(),
        1500,
      );

      expect(history.id).toBeDefined();
      expect(history.institutionId).toBe('inst-001');
      expect(history.institutionName).toBe('三菱UFJ銀行');
      expect(history.institutionType).toBe('bank');
      expect(history.status).toBe(ConnectionStatus.CONNECTED);
      expect(history.responseTime).toBe(1500);
    });

    it('エラー情報を含む接続履歴を作成できる', () => {
      const history = ConnectionHistory.create(
        'inst-001',
        '三菱UFJ銀行',
        'bank',
        ConnectionStatus.DISCONNECTED,
        new Date(),
        3000,
        '接続に失敗しました',
        'CONNECTION_ERROR',
      );

      expect(history.errorMessage).toBe('接続に失敗しました');
      expect(history.errorCode).toBe('CONNECTION_ERROR');
    });
  });

  describe('restore', () => {
    it('既存データから接続履歴を復元できる', () => {
      const checkedAt = new Date();
      const history = ConnectionHistory.restore(
        'history-001',
        'inst-001',
        '三菱UFJ銀行',
        'bank',
        ConnectionStatus.CONNECTED,
        checkedAt,
        1500,
      );

      expect(history.id).toBe('history-001');
      expect(history.institutionId).toBe('inst-001');
      expect(history.checkedAt).toEqual(checkedAt);
    });
  });

  describe('toJSON', () => {
    it('JSONにシリアライズできる', () => {
      const checkedAt = new Date('2025-11-17T10:00:00Z');
      const history = ConnectionHistory.create(
        'inst-001',
        '三菱UFJ銀行',
        'bank',
        ConnectionStatus.CONNECTED,
        checkedAt,
        1500,
      );

      const json = history.toJSON();

      expect(json).toMatchObject({
        institutionId: 'inst-001',
        institutionName: '三菱UFJ銀行',
        institutionType: 'bank',
        status: ConnectionStatus.CONNECTED,
        checkedAt: '2025-11-17T10:00:00.000Z',
        responseTime: 1500,
      });
      expect(json.id).toBeDefined();
    });
  });

  describe('isConnected', () => {
    it('接続成功の場合はtrueを返す', () => {
      const history = ConnectionHistory.create(
        'inst-001',
        '三菱UFJ銀行',
        'bank',
        ConnectionStatus.CONNECTED,
        new Date(),
        1500,
      );

      expect(history.isConnected()).toBe(true);
    });

    it('接続失敗の場合はfalseを返す', () => {
      const history = ConnectionHistory.create(
        'inst-001',
        '三菱UFJ銀行',
        'bank',
        ConnectionStatus.DISCONNECTED,
        new Date(),
        1500,
      );

      expect(history.isConnected()).toBe(false);
    });
  });

  describe('hasError', () => {
    it('DISCONNECTED の場合はtrueを返す', () => {
      const history = ConnectionHistory.create(
        'inst-001',
        '三菱UFJ銀行',
        'bank',
        ConnectionStatus.DISCONNECTED,
        new Date(),
        1500,
      );

      expect(history.hasError()).toBe(true);
    });

    it('NEED_REAUTH の場合はtrueを返す', () => {
      const history = ConnectionHistory.create(
        'inst-001',
        '三菱UFJ銀行',
        'bank',
        ConnectionStatus.NEED_REAUTH,
        new Date(),
        1500,
      );

      expect(history.hasError()).toBe(true);
    });

    it('CONNECTED の場合はfalseを返す', () => {
      const history = ConnectionHistory.create(
        'inst-001',
        '三菱UFJ銀行',
        'bank',
        ConnectionStatus.CONNECTED,
        new Date(),
        1500,
      );

      expect(history.hasError()).toBe(false);
    });
  });
});
