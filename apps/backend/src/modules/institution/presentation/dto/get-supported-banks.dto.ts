import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BankCategory } from '@account-book/types';

/**
 * 対応銀行一覧取得クエリDTO
 */
export class GetSupportedBanksQueryDto {
  @IsOptional()
  @IsEnum(BankCategory, {
    message: '銀行カテゴリは有効な値を指定してください',
  })
  category?: BankCategory;

  @IsOptional()
  @IsString({ message: '検索キーワードは文字列で指定してください' })
  searchTerm?: string;
}

