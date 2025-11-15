import { registerAs } from '@nestjs/config';

export default registerAs('crypto', () => ({
  encryptionKey: process.env.ENCRYPTION_KEY,
  algorithm: 'aes-256-gcm',
}));

