import { renderHook, act } from '@testing-library/react';
import { useNotificationStore } from '@/stores/notification.store';

describe('useNotificationStore', () => {
  beforeEach(() => {
    // 各テスト前にstoreをクリア
    const { clearAll } = useNotificationStore.getState();
    clearAll();
  });

  it('通知を追加できること', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({
        type: 'error',
        message: 'テストエラーメッセージ',
        details: 'エラーの詳細情報',
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe('テストエラーメッセージ');
    expect(result.current.notifications[0].type).toBe('error');
  });

  it('重複通知を防止できること', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({
        type: 'error',
        message: '同じメッセージ',
      });
      result.current.addNotification({
        type: 'error',
        message: '同じメッセージ',
      });
    });

    expect(result.current.notifications).toHaveLength(1);
  });

  it('異なるメッセージは追加されること', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({
        type: 'error',
        message: 'メッセージ1',
      });
      result.current.addNotification({
        type: 'warning',
        message: 'メッセージ2',
      });
    });

    expect(result.current.notifications).toHaveLength(2);
  });

  it('通知を削除できること', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({
        type: 'error',
        message: 'テストメッセージ',
      });
    });

    const notificationId: string = result.current.notifications[0].id;

    act(() => {
      result.current.removeNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('すべての通知をクリアできること', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({
        type: 'error',
        message: 'メッセージ1',
      });
      result.current.addNotification({
        type: 'warning',
        message: 'メッセージ2',
      });
      result.current.addNotification({
        type: 'critical',
        message: 'メッセージ3',
      });
    });

    expect(result.current.notifications).toHaveLength(3);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('通知の存在を確認できること', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({
        type: 'error',
        message: 'テストメッセージ',
      });
    });

    expect(result.current.hasNotification('テストメッセージ')).toBe(true);
    expect(result.current.hasNotification('存在しないメッセージ')).toBe(false);
  });

  it('追加された通知にIDとタイムスタンプが設定されること', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.addNotification({
        type: 'error',
        message: 'テストメッセージ',
      });
    });

    const notification = result.current.notifications[0];
    expect(notification.id).toBeDefined();
    expect(notification.timestamp).toBeInstanceOf(Date);
  });
});
