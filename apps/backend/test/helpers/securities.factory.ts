import { SecuritiesAccountEntity } from '../../src/modules/securities/domain/entities/securities-account.entity';
import { SecurityTransactionEntity } from '../../src/modules/securities/domain/entities/security-transaction.entity';
import { EncryptedCredentials } from '../../src/modules/institution/domain/value-objects/encrypted-credentials.vo';

export function createTestSecuritiesAccount(
  overrides?: Partial<{
    id: string;
    securitiesCompanyName: string;
    accountNumber: string;
    accountType: 'general' | 'specific' | 'nisa' | 'tsumitate-nisa' | 'isa';
    credentials: EncryptedCredentials;
    isConnected: boolean;
    lastSyncedAt: Date | null;
    totalEvaluationAmount: number;
    cashBalance: number;
    createdAt: Date;
    updatedAt: Date;
  }>,
): SecuritiesAccountEntity {
  const defaultCredentials = new EncryptedCredentials(
    'encrypted_test_data',
    'test_iv',
    'test_auth_tag',
    'aes-256-gcm',
    '1',
  );

  return new SecuritiesAccountEntity(
    overrides?.id || 'sec_account_test_123',
    overrides?.securitiesCompanyName || 'テスト証券',
    overrides?.accountNumber || 'A123456789',
    overrides?.accountType || 'general',
    overrides?.credentials || defaultCredentials,
    overrides?.isConnected ?? true,
    overrides?.lastSyncedAt !== undefined ? overrides.lastSyncedAt : new Date(),
    overrides?.totalEvaluationAmount ?? 1000000,
    overrides?.cashBalance ?? 50000,
    overrides?.createdAt || new Date(),
    overrides?.updatedAt || new Date(),
  );
}

export function createTestSecurityTransaction(
  overrides?: Partial<{
    id: string;
    securitiesAccountId: string;
    securityCode: string;
    securityName: string;
    transactionDate: Date;
    transactionType:
      | 'buy'
      | 'sell'
      | 'dividend'
      | 'distribution'
      | 'split'
      | 'other';
    quantity: number;
    price: number;
    fee: number;
    status: 'pending' | 'completed' | 'cancelled';
    createdAt: Date;
  }>,
): SecurityTransactionEntity {
  return new SecurityTransactionEntity(
    overrides?.id || 'sec_tx_test_123',
    overrides?.securitiesAccountId || 'sec_account_test_123',
    overrides?.securityCode || '7203',
    overrides?.securityName || 'トヨタ自動車',
    overrides?.transactionDate || new Date('2025-01-15'),
    overrides?.transactionType || 'buy',
    overrides?.quantity ?? 100,
    overrides?.price ?? 2500,
    overrides?.fee ?? 200,
    overrides?.status || 'completed',
    overrides?.createdAt || new Date(),
  );
}
