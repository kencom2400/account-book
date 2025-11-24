export enum InstitutionType {
  BANK = 'bank',
  CREDIT_CARD = 'credit-card',
  SECURITIES = 'securities',
}

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  credentials: EncryptedCredentials;
  isConnected: boolean;
  lastSyncedAt?: Date;
  accounts: Account[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  institutionId: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
}

export interface EncryptedCredentials {
  encrypted: string;
  iv: string;
  authTag: string;
  algorithm: string;
  version: string;
}
