import { EntityManager } from 'typeorm';
import { SecuritiesAccountEntity } from '../entities/securities-account.entity';
import { HoldingEntity } from '../entities/holding.entity';
import { SecurityTransactionEntity } from '../entities/security-transaction.entity';

/**
 * 証券口座リポジトリインターフェース
 */
export interface ISecuritiesAccountRepository {
  /**
   * 証券口座を作成
   */
  create(
    account: SecuritiesAccountEntity,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * IDで証券口座を取得
   */
  findById(
    id: string,
    manager?: EntityManager,
  ): Promise<SecuritiesAccountEntity | null>;

  /**
   * すべての証券口座を取得
   */
  findAll(manager?: EntityManager): Promise<SecuritiesAccountEntity[]>;

  /**
   * 証券口座を更新
   */
  update(
    account: SecuritiesAccountEntity,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 証券口座を削除
   */
  delete(id: string, manager?: EntityManager): Promise<void>;
}

/**
 * 保有銘柄リポジトリインターフェース
 */
export interface IHoldingRepository {
  /**
   * 保有銘柄を作成
   */
  create(holding: HoldingEntity): Promise<void>;

  /**
   * IDで保有銘柄を取得
   */
  findById(id: string): Promise<HoldingEntity | null>;

  /**
   * 証券口座IDで保有銘柄を取得
   */
  findByAccountId(accountId: string): Promise<HoldingEntity[]>;

  /**
   * 証券口座IDと銘柄コードで保有銘柄を取得
   */
  findByAccountIdAndSecurityCode(
    accountId: string,
    securityCode: string,
  ): Promise<HoldingEntity | null>;

  /**
   * 保有銘柄を更新
   */
  update(holding: HoldingEntity): Promise<void>;

  /**
   * 保有銘柄を削除
   */
  delete(id: string): Promise<void>;
}

/**
 * 証券取引リポジトリインターフェース
 */
export interface ISecurityTransactionRepository {
  /**
   * 証券取引を作成
   */
  create(
    transaction: SecurityTransactionEntity,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * IDで証券取引を取得
   */
  findById(
    id: string,
    manager?: EntityManager,
  ): Promise<SecurityTransactionEntity | null>;

  /**
   * 証券口座IDで証券取引を取得
   */
  findByAccountId(
    accountId: string,
    manager?: EntityManager,
  ): Promise<SecurityTransactionEntity[]>;

  /**
   * 証券口座IDと期間で証券取引を取得
   */
  findByAccountIdAndDateRange(
    accountId: string,
    startDate: Date,
    endDate: Date,
    manager?: EntityManager,
  ): Promise<SecurityTransactionEntity[]>;

  /**
   * 証券取引を更新
   */
  update(
    transaction: SecurityTransactionEntity,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 証券取引を削除
   */
  delete(id: string, manager?: EntityManager): Promise<void>;
}
