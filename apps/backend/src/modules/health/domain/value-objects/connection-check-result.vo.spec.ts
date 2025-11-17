import { ConnectionCheckResult } from './connection-check-result.vo';
import { ConnectionStatus } from './connection-status.enum';

describe('ConnectionCheckResult', () => {
  describe('isConnected', () => {
    it('接続成功の場合はtrueを返す', () => {
      const result = new ConnectionCheckResult(
        'inst-001',
        ConnectionStatus.CONNECTED,
        new Date(),
        1000,
      );

      expect(result.isConnected()).toBe(true);
    });

    it('接続失敗の場合はfalseを返す', () => {
      const result = new ConnectionCheckResult(
        'inst-001',
        ConnectionStatus.DISCONNECTED,
        new Date(),
        1000,
      );

      expect(result.isConnected()).toBe(false);
    });
  });

  describe('needsReauth', () => {
    it('再認証が必要な場合はtrueを返す', () => {
      const result = new ConnectionCheckResult(
        'inst-001',
        ConnectionStatus.NEED_REAUTH,
        new Date(),
        1000,
      );

      expect(result.needsReauth()).toBe(true);
    });

    it('再認証が不要な場合はfalseを返す', () => {
      const result = new ConnectionCheckResult(
        'inst-001',
        ConnectionStatus.CONNECTED,
        new Date(),
        1000,
      );

      expect(result.needsReauth()).toBe(false);
    });
  });

  describe('hasError', () => {
    it('DISCONNECTED の場合はtrueを返す', () => {
      const result = new ConnectionCheckResult(
        'inst-001',
        ConnectionStatus.DISCONNECTED,
        new Date(),
        1000,
      );

      expect(result.hasError()).toBe(true);
    });

    it('NEED_REAUTH の場合はtrueを返す', () => {
      const result = new ConnectionCheckResult(
        'inst-001',
        ConnectionStatus.NEED_REAUTH,
        new Date(),
        1000,
      );

      expect(result.hasError()).toBe(true);
    });

    it('CONNECTED の場合はfalseを返す', () => {
      const result = new ConnectionCheckResult(
        'inst-001',
        ConnectionStatus.CONNECTED,
        new Date(),
        1000,
      );

      expect(result.hasError()).toBe(false);
    });
  });

  describe('meetsPerformanceRequirement', () => {
    it('5秒以内の場合はtrueを返す', () => {
      const result = new ConnectionCheckResult(
        'inst-001',
        ConnectionStatus.CONNECTED,
        new Date(),
        4999,
      );

      expect(result.meetsPerformanceRequirement()).toBe(true);
    });

    it('5秒を超える場合はfalseを返す', () => {
      const result = new ConnectionCheckResult(
        'inst-001',
        ConnectionStatus.CONNECTED,
        new Date(),
        5001,
      );

      expect(result.meetsPerformanceRequirement()).toBe(false);
    });

    it('ちょうど5秒の場合はtrueを返す', () => {
      const result = new ConnectionCheckResult(
        'inst-001',
        ConnectionStatus.CONNECTED,
        new Date(),
        5000,
      );

      expect(result.meetsPerformanceRequirement()).toBe(true);
    });
  });
});
