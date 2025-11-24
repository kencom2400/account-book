import { Merchant } from '../entities/merchant.entity';

/**
 * 店舗マスタRepository Interface
 * Infrastructure層の実装に依存しない抽象化インターフェース
 */
export interface IMerchantRepository {
  /**
   * IDで店舗を取得
   * @param id 店舗ID
   * @returns 店舗 | null
   */
  findById(id: string): Promise<Merchant | null>;

  /**
   * 全店舗を取得
   * @returns 店舗配列
   */
  findAll(): Promise<Merchant[]>;

  /**
   * 店舗名で検索
   * @param name 店舗名
   * @returns 店舗 | null
   */
  findByName(name: string): Promise<Merchant | null>;

  /**
   * 別名で検索
   * 別名配列の中に一致する文字列があるか検索
   * @param alias 別名
   * @returns 店舗 | null
   */
  findByAlias(alias: string): Promise<Merchant | null>;

  /**
   * キーワードで店舗を検索
   * 店舗名または別名に部分一致する店舗を検索
   * @param query 検索キーワード
   * @returns 店舗配列
   */
  search(query: string): Promise<Merchant[]>;

  /**
   * 店舗を保存
   * @param merchant 店舗
   * @returns 保存された店舗
   */
  save(merchant: Merchant): Promise<Merchant>;

  /**
   * 店舗を更新
   * @param merchant 店舗
   * @returns 更新された店舗
   */
  update(merchant: Merchant): Promise<Merchant>;

  /**
   * 店舗を削除
   * @param id 店舗ID
   */
  delete(id: string): Promise<void>;
}
