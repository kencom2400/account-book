export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  userId: string;
  currency: string;
  locale: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
}
