import { Merchant } from '../entities/merchant.entity';
import { IMerchantRepository } from '../repositories/merchant.repository.interface';

/**
 * 店舗マッチャー Domain Service
 * 店舗マスタとのマッチングを担当
 */
export class MerchantMatcherService {
  constructor(private readonly merchantRepository: IMerchantRepository) {}

  /**
   * 取引説明から店舗をマッチング
   * @param description 取引説明
   * @returns マッチした店舗 | null
   */
  public async match(description: string): Promise<Merchant | null> {
    // 全店舗を取得してマッチング
    // TODO: パフォーマンス改善（キャッシュ利用）
    const merchants = await this.merchantRepository.findAll();

    for (const merchant of merchants) {
      if (merchant.matchesDescription(description)) {
        return merchant;
      }
    }

    return null;
  }

  /**
   * 店舗名で検索
   * @param name 店舗名
   * @returns 店舗 | null
   */
  public async findByName(name: string): Promise<Merchant | null> {
    const normalizedName = this.normalizeText(name);
    const merchants = await this.merchantRepository.findAll();

    for (const merchant of merchants) {
      if (this.normalizeText(merchant.name) === normalizedName) {
        return merchant;
      }
    }

    return null;
  }

  /**
   * 別名で検索
   * @param alias 別名
   * @returns 店舗 | null
   */
  public async findByAlias(alias: string): Promise<Merchant | null> {
    const normalizedAlias = this.normalizeText(alias);
    const merchants = await this.merchantRepository.findAll();

    for (const merchant of merchants) {
      const hasAlias = merchant.aliases.some(
        (a) => this.normalizeText(a) === normalizedAlias,
      );
      if (hasAlias) {
        return merchant;
      }
    }

    return null;
  }

  /**
   * テキストの正規化
   * 小文字化、スペース削除
   */
  private normalizeText(text: string): string {
    return text.toLowerCase().replace(/\s+/g, '');
  }
}
