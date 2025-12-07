import { Injectable } from '@nestjs/common';
import { InstitutionEntity } from '../../../institution/domain/entities/institution.entity';

/**
 * AssetClassification
 * 資産と負債の分類結果
 */
export interface AssetClassification {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

/**
 * AssetBalanceDomainService
 * 資産残高計算のドメインロジック
 */
@Injectable()
export class AssetBalanceDomainService {
  /**
   * 資産と負債に分類し、純資産を計算
   * @param institutions 金融機関リスト
   * @returns 資産分類結果
   */
  classifyAssetsAndLiabilities(
    institutions: InstitutionEntity[],
  ): AssetClassification {
    let totalAssets = 0;
    let totalLiabilities = 0;

    for (const institution of institutions) {
      for (const account of institution.accounts) {
        if (account.hasPositiveBalance()) {
          totalAssets += account.balance;
        } else if (account.hasNegativeBalance()) {
          totalLiabilities += Math.abs(account.balance);
        }
        // balance === 0 の場合は資産にも負債にも含めない
      }
    }

    const netWorth = totalAssets - totalLiabilities;

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
    };
  }

  /**
   * 純資産を計算
   * @param institutions 金融機関リスト
   * @returns 純資産
   */
  calculateNetWorth(institutions: InstitutionEntity[]): number {
    const classification = this.classifyAssetsAndLiabilities(institutions);
    return classification.netWorth;
  }

  /**
   * 構成比を計算
   * @param institutionTotal 金融機関別合計
   * @param grandTotal 全体合計
   * @returns 構成比（%）
   */
  calculatePercentage(institutionTotal: number, grandTotal: number): number {
    if (grandTotal === 0) {
      return 0;
    }
    return (institutionTotal / grandTotal) * 100;
  }

  /**
   * 金融機関別の合計残高を計算
   * @param institution 金融機関
   * @returns 合計残高
   */
  calculateInstitutionTotal(institution: InstitutionEntity): number {
    return institution.accounts.reduce((sum, account) => {
      return sum + account.balance;
    }, 0);
  }
}
