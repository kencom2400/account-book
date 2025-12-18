import { Injectable } from '@nestjs/common';
import { CardCompany, CardCompanyCategory } from '@account-book/types';
import { SUPPORTED_CARD_COMPANIES } from '../../infrastructure/data/card-companies.data';

export interface GetSupportedCardCompaniesQuery {
  category?: CardCompanyCategory;
  searchTerm?: string;
}

/**
 * 対応カード会社一覧取得ユースケース
 */
@Injectable()
export class GetSupportedCardCompaniesUseCase {
  execute(query?: GetSupportedCardCompaniesQuery): CardCompany[] {
    let companies = [...SUPPORTED_CARD_COMPANIES];

    // カテゴリで絞り込み
    if (query?.category) {
      companies = companies.filter(
        (company) => company.category === query.category,
      );
    }

    // 検索キーワードで絞り込み
    if (query?.searchTerm) {
      const searchTerm = query.searchTerm.toLowerCase();
      companies = companies.filter(
        (company) =>
          company.name.toLowerCase().includes(searchTerm) ||
          company.code.toLowerCase().includes(searchTerm),
      );
    }

    // サポート対象のみを返す
    return companies.filter((company) => company.isSupported);
  }

  /**
   * カード会社コードからカード会社情報を取得
   */
  findByCode(companyCode: string): CardCompany | null {
    const company = SUPPORTED_CARD_COMPANIES.find(
      (c) => c.code === companyCode,
    );
    return company && company.isSupported ? company : null;
  }
}
