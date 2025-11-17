import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ICryptoService } from '../../domain/services/crypto.service.interface';
import { EncryptedCredentials } from '../../domain/value-objects/encrypted-credentials.vo';

/**
 * 暗号化サービスの実装
 * AES-256-GCMを使用した暗号化・復号化
 */
@Injectable()
export class CryptoService implements ICryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly version = '1.0';
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('crypto.encryptionKey');
    const salt = this.configService.get<string>('crypto.salt');

    if (!key) {
      throw new Error('ENCRYPTION_KEY is not configured');
    }

    if (!salt) {
      throw new Error('CRYPTO_SALT is not configured');
    }

    // 32バイト（256ビット）のキーを生成
    this.encryptionKey = crypto.scryptSync(key, salt, 32);
  }

  /**
   * データを暗号化する
   */
  encrypt(plainText: string): EncryptedCredentials {
    try {
      // 16バイトのIV（初期化ベクトル）を生成
      const iv = crypto.randomBytes(16);

      // 暗号化器を作成
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );

      // データを暗号化
      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // 認証タグを取得
      const authTag = cipher.getAuthTag().toString('hex');

      return new EncryptedCredentials(
        encrypted,
        iv.toString('hex'),
        authTag,
        this.algorithm,
        this.version,
      );
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * データを復号化する
   */
  decrypt(credentials: EncryptedCredentials): string {
    try {
      // IVと認証タグをバッファに変換
      const iv = Buffer.from(credentials.iv, 'hex');
      const authTag = Buffer.from(credentials.authTag, 'hex');

      // 復号化器を作成
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );
      decipher.setAuthTag(authTag);

      // データを復号化
      let decrypted = decipher.update(credentials.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
