import { InstitutionType } from '@account-book/types';

/**
 * AccountAssetDto
 * 口座別資産情報
 */
export interface AccountAssetDto {
  accountId: string;
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
}

/**
 * InstitutionAssetDto
 * 金融機関別資産情報
 */
export interface InstitutionAssetDto {
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  icon: string;
  accounts: AccountAssetDto[];
  total: number;
  percentage: number;
}

/**
 * AssetComparisonDto
 * 資産比較情報（前月比・前年比）
 */
export interface AssetComparisonDto {
  diff: number;
  rate: number;
}

/**
 * AssetBalanceResponseDto
 * 資産残高レスポンスDTO
 */
export interface AssetBalanceResponseDto {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  institutions: InstitutionAssetDto[];
  asOfDate: string; // ISO8601形式
  previousMonth: AssetComparisonDto;
  previousYear: AssetComparisonDto;
}
