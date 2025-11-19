import { create } from 'zustand';

export type NotificationType = 'warning' | 'error' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  details?: string;
  timestamp: Date;
  institutionId?: string;
  retryable?: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  hasNotification: (message: string) => boolean;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>): void => {
    // 重複通知の防止
    const { hasNotification } = get();
    if (hasNotification(notification.message)) {
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    set((state: NotificationStore) => ({
      notifications: [...state.notifications, newNotification],
    }));
  },

  removeNotification: (id: string): void => {
    set((state: NotificationStore) => ({
      notifications: state.notifications.filter((n: Notification) => n.id !== id),
    }));
  },

  clearAll: (): void => {
    set({ notifications: [] });
  },

  hasNotification: (message: string): boolean => {
    const { notifications } = get();
    return notifications.some((n: Notification) => n.message === message);
  },
}));
