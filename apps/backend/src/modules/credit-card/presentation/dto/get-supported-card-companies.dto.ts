import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CardCompanyCategory } from '@account-book/types';

/**
 * 対応カード会社一覧取得クエリDTO
 */
export class GetSupportedCardCompaniesQueryDto {
  @IsOptional()
  @IsEnum(CardCompanyCategory, {
    message: 'カード会社カテゴリは有効な値を指定してください',
  })
  category?: CardCompanyCategory;

  @IsOptional()
  @IsString({ message: '検索キーワードは文字列で指定してください' })
  searchTerm?: string;
}
