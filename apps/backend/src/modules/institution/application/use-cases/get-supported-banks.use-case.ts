import { Injectable } from '@nestjs/common';
import { Bank, BankCategory } from '@account-book/types';
import { SUPPORTED_BANKS } from '../../infrastructure/data/banks.data';

export interface GetSupportedBanksQuery {
  category?: BankCategory;
  searchTerm?: string;
}

/**
 * 対応銀行一覧取得ユースケース
 */
@Injectable()
export class GetSupportedBanksUseCase {
  execute(query?: GetSupportedBanksQuery): Bank[] {
    let banks = [...SUPPORTED_BANKS];

    // カテゴリで絞り込み
    if (query?.category) {
      banks = banks.filter((bank) => bank.category === query.category);
    }

    // 検索キーワードで絞り込み
    if (query?.searchTerm) {
      const searchTerm = query.searchTerm.toLowerCase();
      banks = banks.filter(
        (bank) =>
          bank.name.toLowerCase().includes(searchTerm) ||
          bank.code.includes(searchTerm),
      );
    }

    // サポート対象のみを返す
    return banks.filter((bank) => bank.isSupported);
  }

  /**
   * 銀行コードから銀行情報を取得
   */
  findByCode(bankCode: string): Bank | null {
    const bank = SUPPORTED_BANKS.find((b) => b.code === bankCode);
    return bank && bank.isSupported ? bank : null;
  }
}
