import { registerAs } from '@nestjs/config';

export default registerAs('crypto', () => ({
  encryptionKey: process.env.ENCRYPTION_KEY,
  salt: process.env.CRYPTO_SALT,
  algorithm: 'aes-256-gcm',
}));
