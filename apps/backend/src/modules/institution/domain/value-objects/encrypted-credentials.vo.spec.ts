import { EncryptedCredentials } from './encrypted-credentials.vo';

describe('EncryptedCredentials', () => {
  const validCredentials = {
    encrypted: 'encrypted_data_base64',
    iv: 'iv_base64',
    authTag: 'auth_tag_base64',
    algorithm: 'aes-256-gcm',
    version: '1.0',
  };

  describe('constructor', () => {
    it('should create valid encrypted credentials', () => {
      const credentials = new EncryptedCredentials(
        validCredentials.encrypted,
        validCredentials.iv,
        validCredentials.authTag,
        validCredentials.algorithm,
        validCredentials.version,
      );

      expect(credentials.encrypted).toBe('encrypted_data_base64');
      expect(credentials.iv).toBe('iv_base64');
      expect(credentials.authTag).toBe('auth_tag_base64');
      expect(credentials.algorithm).toBe('aes-256-gcm');
      expect(credentials.version).toBe('1.0');
    });

    it('should use default algorithm when not provided', () => {
      const credentials = new EncryptedCredentials(
        validCredentials.encrypted,
        validCredentials.iv,
        validCredentials.authTag,
      );

      expect(credentials.algorithm).toBe('aes-256-gcm');
      expect(credentials.version).toBe('1.0');
    });

    it('should throw error when encrypted data is missing', () => {
      expect(
        () =>
          new EncryptedCredentials(
            '',
            validCredentials.iv,
            validCredentials.authTag,
          ),
      ).toThrow('Encrypted data is required');
    });

    it('should throw error when IV is missing', () => {
      expect(
        () =>
          new EncryptedCredentials(
            validCredentials.encrypted,
            '',
            validCredentials.authTag,
          ),
      ).toThrow('Initialization vector (IV) is required');
    });

    it('should throw error when auth tag is missing', () => {
      expect(
        () =>
          new EncryptedCredentials(
            validCredentials.encrypted,
            validCredentials.iv,
            '',
          ),
      ).toThrow('Authentication tag is required');
    });

    it('should throw error when algorithm is missing', () => {
      expect(
        () =>
          new EncryptedCredentials(
            validCredentials.encrypted,
            validCredentials.iv,
            validCredentials.authTag,
            '',
            validCredentials.version,
          ),
      ).toThrow('Encryption algorithm is required');
    });

    it('should throw error when version is missing', () => {
      expect(
        () =>
          new EncryptedCredentials(
            validCredentials.encrypted,
            validCredentials.iv,
            validCredentials.authTag,
            validCredentials.algorithm,
            '',
          ),
      ).toThrow('Encryption version is required');
    });
  });

  describe('equals', () => {
    it('should return true for identical credentials', () => {
      const credentials1 = new EncryptedCredentials(
        validCredentials.encrypted,
        validCredentials.iv,
        validCredentials.authTag,
        validCredentials.algorithm,
        validCredentials.version,
      );
      const credentials2 = new EncryptedCredentials(
        validCredentials.encrypted,
        validCredentials.iv,
        validCredentials.authTag,
        validCredentials.algorithm,
        validCredentials.version,
      );

      expect(credentials1.equals(credentials2)).toBe(true);
    });

    it('should return false when encrypted data differs', () => {
      const credentials1 = new EncryptedCredentials(
        'encrypted1',
        validCredentials.iv,
        validCredentials.authTag,
        validCredentials.algorithm,
        validCredentials.version,
      );
      const credentials2 = new EncryptedCredentials(
        'encrypted2',
        validCredentials.iv,
        validCredentials.authTag,
        validCredentials.algorithm,
        validCredentials.version,
      );

      expect(credentials1.equals(credentials2)).toBe(false);
    });

    it('should return false when IV differs', () => {
      const credentials1 = new EncryptedCredentials(
        validCredentials.encrypted,
        'iv1',
        validCredentials.authTag,
        validCredentials.algorithm,
        validCredentials.version,
      );
      const credentials2 = new EncryptedCredentials(
        validCredentials.encrypted,
        'iv2',
        validCredentials.authTag,
        validCredentials.algorithm,
        validCredentials.version,
      );

      expect(credentials1.equals(credentials2)).toBe(false);
    });

    it('should return false when auth tag differs', () => {
      const credentials1 = new EncryptedCredentials(
        validCredentials.encrypted,
        validCredentials.iv,
        'tag1',
        validCredentials.algorithm,
        validCredentials.version,
      );
      const credentials2 = new EncryptedCredentials(
        validCredentials.encrypted,
        validCredentials.iv,
        'tag2',
        validCredentials.algorithm,
        validCredentials.version,
      );

      expect(credentials1.equals(credentials2)).toBe(false);
    });

    it('should return false when algorithm differs', () => {
      const credentials1 = new EncryptedCredentials(
        validCredentials.encrypted,
        validCredentials.iv,
        validCredentials.authTag,
        'aes-256-gcm',
        validCredentials.version,
      );
      const credentials2 = new EncryptedCredentials(
        validCredentials.encrypted,
        validCredentials.iv,
        validCredentials.authTag,
        'aes-128-gcm',
        validCredentials.version,
      );

      expect(credentials1.equals(credentials2)).toBe(false);
    });

    it('should return false when version differs', () => {
      const credentials1 = new EncryptedCredentials(
        validCredentials.encrypted,
        validCredentials.iv,
        validCredentials.authTag,
        validCredentials.algorithm,
        '1.0',
      );
      const credentials2 = new EncryptedCredentials(
        validCredentials.encrypted,
        validCredentials.iv,
        validCredentials.authTag,
        validCredentials.algorithm,
        '2.0',
      );

      expect(credentials1.equals(credentials2)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON correctly', () => {
      const credentials = new EncryptedCredentials(
        validCredentials.encrypted,
        validCredentials.iv,
        validCredentials.authTag,
        validCredentials.algorithm,
        validCredentials.version,
      );

      const json = credentials.toJSON();

      expect(json.encrypted).toBe('encrypted_data_base64');
      expect(json.iv).toBe('iv_base64');
      expect(json.authTag).toBe('auth_tag_base64');
      expect(json.algorithm).toBe('aes-256-gcm');
      expect(json.version).toBe('1.0');
    });

    it('should include default values in JSON', () => {
      const credentials = new EncryptedCredentials(
        validCredentials.encrypted,
        validCredentials.iv,
        validCredentials.authTag,
      );

      const json = credentials.toJSON();

      expect(json.algorithm).toBe('aes-256-gcm');
      expect(json.version).toBe('1.0');
    });
  });
});
