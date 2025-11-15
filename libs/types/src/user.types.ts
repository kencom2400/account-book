export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  currency: string;
  locale: string;
  timezone: string;
}

