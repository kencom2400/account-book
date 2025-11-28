import { InstitutionType } from '@account-book/types';
import { InstitutionEntity } from './institution.entity';
import { EncryptedCredentials } from '../value-objects/encrypted-credentials.vo';
import { AccountEntity } from './account.entity';

describe('InstitutionEntity', () => {
  const mockCredentials = new EncryptedCredentials(
    'encrypted_data',
    'iv_data',
    'auth_tag',
  );

  const mockAccounts = [
    new AccountEntity('acc_1', 'inst_1', '123', 'Account 1', 10000, 'JPY'),
  ];

  const validInstitution = {
    id: 'inst_123',
    name: 'Test Bank',
    type: InstitutionType.BANK,
    credentials: mockCredentials,
    isConnected: true,
    lastSyncedAt: new Date('2024-01-15'),
    accounts: mockAccounts,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  describe('constructor', () => {
    it('should create a valid institution entity', () => {
      const institution = new InstitutionEntity(
        validInstitution.id,
        validInstitution.name,
        validInstitution.type,
        validInstitution.credentials,
        validInstitution.isConnected,
        validInstitution.lastSyncedAt,
        validInstitution.accounts,
        validInstitution.createdAt,
        validInstitution.updatedAt,
      );

      expect(institution.id).toBe('inst_123');
      expect(institution.name).toBe('Test Bank');
      expect(institution.isConnected).toBe(true);
    });

    it('should throw error when id is missing', () => {
      expect(
        () =>
          new InstitutionEntity(
            '',
            validInstitution.name,
            validInstitution.type,
            validInstitution.credentials,
            validInstitution.isConnected,
            validInstitution.lastSyncedAt,
            validInstitution.accounts,
            validInstitution.createdAt,
            validInstitution.updatedAt,
          ),
      ).toThrow('Institution ID is required');
    });

    it('should throw error when name is missing', () => {
      expect(
        () =>
          new InstitutionEntity(
            validInstitution.id,
            '',
            validInstitution.type,
            validInstitution.credentials,
            validInstitution.isConnected,
            validInstitution.lastSyncedAt,
            validInstitution.accounts,
            validInstitution.createdAt,
            validInstitution.updatedAt,
          ),
      ).toThrow('Institution name is required');
    });

    it('should throw error when credentials are missing', () => {
      expect(
        () =>
          new InstitutionEntity(
            validInstitution.id,
            validInstitution.name,
            validInstitution.type,
            null as any,
            validInstitution.isConnected,
            validInstitution.lastSyncedAt,
            validInstitution.accounts,
            validInstitution.createdAt,
            validInstitution.updatedAt,
          ),
      ).toThrow('Institution credentials are required');
    });
  });

  describe('isBank', () => {
    it('should return true for bank type', () => {
      const institution = new InstitutionEntity(
        validInstitution.id,
        validInstitution.name,
        InstitutionType.BANK,
        validInstitution.credentials,
        validInstitution.isConnected,
        validInstitution.lastSyncedAt,
        validInstitution.accounts,
        validInstitution.createdAt,
        validInstitution.updatedAt,
      );

      expect(institution.isBank()).toBe(true);
      expect(institution.isCreditCard()).toBe(false);
      expect(institution.isSecurities()).toBe(false);
    });
  });

  describe('isCreditCard', () => {
    it('should return true for credit card type', () => {
      const institution = new InstitutionEntity(
        validInstitution.id,
        validInstitution.name,
        InstitutionType.CREDIT_CARD,
        validInstitution.credentials,
        validInstitution.isConnected,
        validInstitution.lastSyncedAt,
        validInstitution.accounts,
        validInstitution.createdAt,
        validInstitution.updatedAt,
      );

      expect(institution.isCreditCard()).toBe(true);
      expect(institution.isBank()).toBe(false);
      expect(institution.isSecurities()).toBe(false);
    });
  });

  describe('isSecurities', () => {
    it('should return true for securities type', () => {
      const institution = new InstitutionEntity(
        validInstitution.id,
        validInstitution.name,
        InstitutionType.SECURITIES,
        validInstitution.credentials,
        validInstitution.isConnected,
        validInstitution.lastSyncedAt,
        validInstitution.accounts,
        validInstitution.createdAt,
        validInstitution.updatedAt,
      );

      expect(institution.isSecurities()).toBe(true);
      expect(institution.isBank()).toBe(false);
      expect(institution.isCreditCard()).toBe(false);
    });
  });

  describe('updateConnectionStatus', () => {
    it('should update connection status', () => {
      const institution = new InstitutionEntity(
        validInstitution.id,
        validInstitution.name,
        validInstitution.type,
        validInstitution.credentials,
        true,
        validInstitution.lastSyncedAt,
        validInstitution.accounts,
        validInstitution.createdAt,
        validInstitution.updatedAt,
      );

      const updated = institution.updateConnectionStatus(false);

      expect(updated.isConnected).toBe(false);
      expect(institution.isConnected).toBe(true); // Original unchanged
    });
  });

  describe('updateLastSyncedAt', () => {
    it('should update last synced date', () => {
      const institution = new InstitutionEntity(
        validInstitution.id,
        validInstitution.name,
        validInstitution.type,
        validInstitution.credentials,
        validInstitution.isConnected,
        new Date('2024-01-01'),
        validInstitution.accounts,
        validInstitution.createdAt,
        validInstitution.updatedAt,
      );

      const newDate = new Date('2024-01-15');
      const updated = institution.updateLastSyncedAt(newDate);

      expect(updated.lastSyncedAt).toEqual(newDate);
      expect(institution.lastSyncedAt).toEqual(new Date('2024-01-01'));
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON correctly', () => {
      const institution = new InstitutionEntity(
        validInstitution.id,
        validInstitution.name,
        validInstitution.type,
        validInstitution.credentials,
        validInstitution.isConnected,
        validInstitution.lastSyncedAt,
        validInstitution.accounts,
        validInstitution.createdAt,
        validInstitution.updatedAt,
      );

      const json = institution.toJSON();

      expect(json.id).toBe('inst_123');
      expect(json.name).toBe('Test Bank');
      expect(json.type).toBe(InstitutionType.BANK);
      expect(json.isConnected).toBe(true);
      expect(json.accounts).toHaveLength(1);
    });
  });
});
