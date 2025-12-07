import { Inject, Injectable } from '@nestjs/common';
import type { IInstitutionRepository } from '../../../institution/domain/repositories/institution.repository.interface';
import { INSTITUTION_REPOSITORY } from '../../../institution/institution.tokens';
import { AssetBalanceDomainService } from '../../domain/services/asset-balance-domain.service';
import { InstitutionEntity } from '../../../institution/domain/entities/institution.entity';
import { AccountEntity } from '../../../institution/domain/entities/account.entity';
import { InstitutionType } from '@account-book/types';

/**
 * AccountAssetDto
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
 */
export interface AssetComparisonDto {
  diff: number;
  rate: number;
}

/**
 * AssetBalanceResponseDto
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

/**
 * CalculateAssetBalanceUseCase
 * 資産残高計算のユースケース
 */
@Injectable()
export class CalculateAssetBalanceUseCase {
  constructor(
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
    private readonly assetBalanceDomainService: AssetBalanceDomainService,
  ) {}

  /**
   * 資産残高を計算
   * @param asOfDate 基準日（デフォルト: 今日）
   * @returns 資産残高情報
   */
  async execute(asOfDate?: Date): Promise<AssetBalanceResponseDto> {
    const targetDate = asOfDate || new Date();

    // すべての金融機関情報を取得
    const institutions = await this.institutionRepository.findAll();

    // 資産と負債に分類
    const classification =
      this.assetBalanceDomainService.classifyAssetsAndLiabilities(institutions);

    // 金融機関別資産情報を構築
    const institutionAssets: InstitutionAssetDto[] = institutions.map(
      (institution) => this.buildInstitutionAsset(institution, classification),
    );

    // 前月比・前年比を計算（将来対応: 履歴データから取得）
    // 現時点では0で返す
    const previousMonth: AssetComparisonDto = {
      diff: 0,
      rate: 0,
    };
    const previousYear: AssetComparisonDto = {
      diff: 0,
      rate: 0,
    };

    return {
      totalAssets: classification.totalAssets,
      totalLiabilities: classification.totalLiabilities,
      netWorth: classification.netWorth,
      institutions: institutionAssets,
      asOfDate: targetDate.toISOString(),
      previousMonth,
      previousYear,
    };
  }

  /**
   * 金融機関別資産情報を構築
   * @param institution 金融機関エンティティ
   * @param classification 資産分類結果
   * @returns 金融機関別資産情報
   */
  private buildInstitutionAsset(
    institution: InstitutionEntity,
    classification: { totalAssets: number },
  ): InstitutionAssetDto {
    // 口座別資産情報を構築
    const accounts: AccountAssetDto[] = institution.accounts.map((account) =>
      this.buildAccountAsset(account),
    );

    // 金融機関別合計を計算
    const total =
      this.assetBalanceDomainService.calculateInstitutionTotal(institution);

    // 構成比を計算（総資産に対する割合）
    // 負債（totalがマイナス）の場合は0.0を返す
    const percentage =
      total < 0
        ? 0.0
        : this.assetBalanceDomainService.calculatePercentage(
            total,
            classification.totalAssets,
          );

    // アイコンを取得
    const icon = this.getInstitutionIcon(institution.type);

    return {
      institutionId: institution.id,
      institutionName: institution.name,
      institutionType: institution.type,
      icon,
      accounts,
      total,
      percentage,
    };
  }

  /**
   * 口座別資産情報を構築
   * @param account 口座エンティティ
   * @returns 口座別資産情報
   */
  private buildAccountAsset(account: AccountEntity): AccountAssetDto {
    // 口座タイプを判定（簡易実装）
    // 将来的にはAccountEntityにaccountTypeフィールドを追加することを検討
    const accountType = this.inferAccountType(account.accountName);

    return {
      accountId: account.id,
      accountName: account.accountName,
      accountType,
      balance: account.balance,
      currency: account.currency,
    };
  }

  /**
   * 口座タイプを推測（簡易実装）
   * @param accountName 口座名
   * @returns 口座タイプ
   */
  private inferAccountType(accountName: string): string {
    const name = accountName.toLowerCase();
    if (name.includes('普通') || name.includes('当座')) {
      return 'SAVINGS';
    }
    if (name.includes('定期')) {
      return 'TIME_DEPOSIT';
    }
    if (name.includes('カード') || name.includes('card')) {
      return 'CREDIT_CARD';
    }
    if (name.includes('株式') || name.includes('stock')) {
      return 'STOCK';
    }
    if (name.includes('投資信託') || name.includes('mutual')) {
      return 'MUTUAL_FUND';
    }
    return 'OTHER';
  }

  /**
   * 金融機関タイプに応じたアイコンを取得
   * @param institutionType 金融機関タイプ
   * @returns アイコン（絵文字）
   */
  private getInstitutionIcon(institutionType: InstitutionType): string {
    switch (institutionType) {
      case InstitutionType.BANK:
        return '🏦';
      case InstitutionType.CREDIT_CARD:
        return '💳';
      case InstitutionType.SECURITIES:
        return '📈';
      default:
        return '🏛️';
    }
  }
}
