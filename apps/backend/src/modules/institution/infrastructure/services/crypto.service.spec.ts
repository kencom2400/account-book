import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from './crypto.service';
import { EncryptedCredentials } from '../../domain/value-objects/encrypted-credentials.vo';

describe('CryptoService', () => {
  let service: CryptoService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'crypto.encryptionKey') {
                return 'test-encryption-key-for-testing';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt', () => {
    it('should encrypt plain text successfully', () => {
      const plainText = 'test-credentials-data';
      const result = service.encrypt(plainText);

      expect(result).toBeInstanceOf(EncryptedCredentials);
      expect(result.encrypted).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.authTag).toBeDefined();
      expect(result.algorithm).toBe('aes-256-gcm');
      expect(result.version).toBe('1.0');
    });

    it('should produce different encrypted values for the same input (due to random IV)', () => {
      const plainText = 'test-credentials-data';
      const result1 = service.encrypt(plainText);
      const result2 = service.encrypt(plainText);

      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
    });

    it('should handle short strings', () => {
      const plainText = 'a';
      const result = service.encrypt(plainText);

      expect(result).toBeInstanceOf(EncryptedCredentials);
      expect(result.encrypted).toBeDefined();
    });

    it('should handle Japanese characters', () => {
      const plainText = 'テスト認証情報';
      const result = service.encrypt(plainText);

      expect(result).toBeInstanceOf(EncryptedCredentials);
      expect(result.encrypted).toBeDefined();
    });

    it('should handle JSON strings', () => {
      const plainText = JSON.stringify({
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      });
      const result = service.encrypt(plainText);

      expect(result).toBeInstanceOf(EncryptedCredentials);
      expect(result.encrypted).toBeDefined();
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted data successfully', () => {
      const plainText = 'test-credentials-data';
      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should decrypt JSON strings correctly', () => {
      const originalData = {
        bankCode: '0000',
        branchCode: '001',
        accountNumber: '1234567',
      };
      const plainText = JSON.stringify(originalData);
      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
      expect(JSON.parse(decrypted)).toEqual(originalData);
    });

    it('should decrypt Japanese characters correctly', () => {
      const plainText = 'テスト認証情報';
      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should throw error for invalid encrypted data', () => {
      const invalidCredentials = new EncryptedCredentials(
        'invalid-encrypted-data',
        'invalid-iv',
        'invalid-auth-tag',
      );

      expect(() => service.decrypt(invalidCredentials)).toThrow();
    });

    it('should throw error for tampered data', () => {
      const plainText = 'test-credentials-data';
      const encrypted = service.encrypt(plainText);

      // 暗号化データを改ざん（最初の文字を変更）
      const tamperedEncrypted = 'x' + encrypted.encrypted.slice(1);
      const tamperedCredentials = new EncryptedCredentials(
        tamperedEncrypted,
        encrypted.iv,
        encrypted.authTag,
      );

      expect(() => service.decrypt(tamperedCredentials)).toThrow();
    });

    it('should throw error for tampered auth tag', () => {
      const plainText = 'test-credentials-data';
      const encrypted = service.encrypt(plainText);

      // 認証タグを改ざん
      const tamperedCredentials = new EncryptedCredentials(
        encrypted.encrypted,
        encrypted.iv,
        'tampered-auth-tag',
      );

      expect(() => service.decrypt(tamperedCredentials)).toThrow();
    });
  });

  describe('encrypt/decrypt round-trip', () => {
    it('should maintain data integrity through multiple round-trips', () => {
      const plainText = 'test-credentials-data';

      // 1回目
      const encrypted1 = service.encrypt(plainText);
      const decrypted1 = service.decrypt(encrypted1);
      expect(decrypted1).toBe(plainText);

      // 2回目
      const encrypted2 = service.encrypt(decrypted1);
      const decrypted2 = service.decrypt(encrypted2);
      expect(decrypted2).toBe(plainText);

      // 3回目
      const encrypted3 = service.encrypt(decrypted2);
      const decrypted3 = service.decrypt(encrypted3);
      expect(decrypted3).toBe(plainText);
    });
  });

  describe('error handling', () => {
    it('should throw error when encryption key is not configured', async () => {
      await expect(async () => {
        const moduleWithoutKey: TestingModule = await Test.createTestingModule({
          providers: [
            CryptoService,
            {
              provide: ConfigService,
              useValue: {
                get: jest.fn(() => null),
              },
            },
          ],
        }).compile();

        moduleWithoutKey.get<CryptoService>(CryptoService);
      }).rejects.toThrow('ENCRYPTION_KEY is not configured');
    });
  });
});

