import { InstitutionEntity } from '../../src/modules/institution/domain/entities/institution.entity';
import { AccountEntity } from '../../src/modules/institution/domain/entities/account.entity';
import { EncryptedCredentials } from '../../src/modules/institution/domain/value-objects/encrypted-credentials.vo';
import { InstitutionType } from '@account-book/types';

export function createTestInstitution(
  overrides?: Partial<{
    id: string;
    name: string;
    type: InstitutionType;
    credentials: EncryptedCredentials;
    isConnected: boolean;
    lastSyncedAt: Date | null;
    accounts: AccountEntity[];
    createdAt: Date;
    updatedAt: Date;
  }>,
): InstitutionEntity {
  const defaultCredentials = new EncryptedCredentials(
    'encrypted_test_data',
    'test_iv',
    'test_auth_tag',
    'aes-256-gcm',
    '1',
  );

  return new InstitutionEntity(
    overrides?.id || 'inst_test_123',
    overrides?.name || 'テスト金融機関',
    overrides?.type || InstitutionType.BANK,
    overrides?.credentials || defaultCredentials,
    overrides?.isConnected ?? true,
    overrides?.lastSyncedAt !== undefined ? overrides.lastSyncedAt : new Date(),
    overrides?.accounts || [],
    overrides?.createdAt || new Date(),
    overrides?.updatedAt || new Date(),
  );
}
