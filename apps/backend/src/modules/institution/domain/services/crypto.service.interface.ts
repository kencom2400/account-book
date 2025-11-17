import { EncryptedCredentials } from '../value-objects/encrypted-credentials.vo';

/**
 * 暗号化サービスのインターフェース
 * 認証情報の暗号化・復号化を行う
 */
export interface ICryptoService {
  /**
   * データを暗号化する
   * @param plainText 平文データ
   * @returns 暗号化された認証情報
   */
  encrypt(plainText: string): EncryptedCredentials;

  /**
   * データを復号化する
   * @param credentials 暗号化された認証情報
   * @returns 平文データ
   */
  decrypt(credentials: EncryptedCredentials): string;
}
