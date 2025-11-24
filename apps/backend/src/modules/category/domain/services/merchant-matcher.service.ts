import { Injectable } from '@nestjs/common';
import { Merchant } from '../entities/merchant.entity';
import type { IMerchantRepository } from '../repositories/merchant.repository.interface';

/**
 * 店舗マッチャー Domain Service
 * 店舗マスタとのマッチングを担当
 */
@Injectable()
export class MerchantMatcherService {
  constructor(private readonly merchantRepository: IMerchantRepository) {}

  /**
   * 取引説明から店舗をマッチング
   * リポジトリ層に検索を委譲し、パフォーマンスを最適化
   *
   * @param description 取引説明
   * @returns マッチした店舗 | null
   */
  public async match(description: string): Promise<Merchant | null> {
    // リポジトリ層でDB検索を実施（パフォーマンス最適化）
    return await this.merchantRepository.searchByDescription(description);
  }
}
