/**
 * EncryptedCredentials Value Object
 * 暗号化された認証情報を表す値オブジェクト
 */
export class EncryptedCredentials {
  constructor(
    public readonly encrypted: string,
    public readonly iv: string,
    public readonly authTag: string,
    public readonly algorithm: string = 'aes-256-gcm',
    public readonly version: string = '1.0',
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.encrypted) {
      throw new Error('Encrypted data is required');
    }

    if (!this.iv) {
      throw new Error('Initialization vector (IV) is required');
    }

    if (!this.authTag) {
      throw new Error('Authentication tag is required');
    }

    if (!this.algorithm) {
      throw new Error('Encryption algorithm is required');
    }

    if (!this.version) {
      throw new Error('Encryption version is required');
    }
  }

  /**
   * 等価性の判定
   */
  equals(other: EncryptedCredentials): boolean {
    return (
      this.encrypted === other.encrypted &&
      this.iv === other.iv &&
      this.authTag === other.authTag &&
      this.algorithm === other.algorithm &&
      this.version === other.version
    );
  }

  /**
   * プレーンオブジェクトに変換
   */
  toJSON(): any {
    return {
      encrypted: this.encrypted,
      iv: this.iv,
      authTag: this.authTag,
      algorithm: this.algorithm,
      version: this.version,
    };
  }
}
