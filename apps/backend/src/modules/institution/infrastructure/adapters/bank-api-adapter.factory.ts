import { Injectable } from '@nestjs/common';
import { IBankApiAdapter } from '../../domain/adapters/bank-api.adapter.interface';
import { MockBankApiAdapter } from './mock-bank-api.adapter';
import { MufgBankApiAdapter } from './mufg-bank-api.adapter';

/**
 * 銀行APIアダプターファクトリー
 * 銀行コードに応じて適切なアダプターを返す
 */
@Injectable()
export class BankApiAdapterFactory {
  /**
   * 銀行コードに応じて適切なアダプターを作成
   * @param bankCode 銀行コード
   * @returns 銀行APIアダプター
   */
  create(bankCode: string): IBankApiAdapter {
    // 環境変数でモック/本番を切り替え
    const useMock = process.env.USE_MOCK_BANK_API !== 'false';

    // モックモードの場合は常にMockBankApiAdapterを返す
    if (useMock) {
      return new MockBankApiAdapter(bankCode);
    }

    // 本番モード: 銀行コードに応じて適切なアダプターを返す
    switch (bankCode) {
      case '0005': // 三菱UFJ銀行
        return new MufgBankApiAdapter();
      // 他の銀行のアダプターもここに追加
      // case '0001': // みずほ銀行
      //   return new MizuhoBankApiAdapter();
      // case '0009': // 三井住友銀行
      //   return new SmbcBankApiAdapter();
      default:
        // 未対応の銀行はモックアダプターを返す
        return new MockBankApiAdapter(bankCode);
    }
  }
}
