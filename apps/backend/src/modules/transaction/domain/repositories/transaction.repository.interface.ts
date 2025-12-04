import { TransactionEntity } from '../entities/transaction.entity';
import { CategoryType } from '@account-book/types';

/**
 * Transaction Repositoryのインターフェース
 * ドメイン層で定義し、インフラ層で実装する
 */
export interface ITransactionRepository {
  /**
   * IDで取引を取得
   */
  findById(id: string): Promise<TransactionEntity | null>;

  /**
   * すべての取引を取得
   */
  findAll(): Promise<TransactionEntity[]>;

  /**
   * 金融機関IDで取引を取得
   */
  findByInstitutionId(institutionId: string): Promise<TransactionEntity[]>;

  /**
   * 口座IDで取引を取得
   */
  findByAccountId(accountId: string): Promise<TransactionEntity[]>;

  /**
   * 期間で取引を取得
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<TransactionEntity[]>;

  /**
   * カテゴリタイプと期間で取引を取得
   */
  findByCategoryType(
    categoryType: CategoryType,
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionEntity[]>;

  /**
   * カテゴリIDの配列と期間で取引を取得
   */
  findByCategoryIdsAndDateRange(
    categoryIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionEntity[]>;

  /**
   * 金融機関IDと期間で取引を取得
   */
  findByInstitutionIdsAndDateRange(
    institutionIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionEntity[]>;

  /**
   * 月で取引を取得
   */
  findByMonth(year: number, month: number): Promise<TransactionEntity[]>;

  /**
   * 年で取引を取得
   */
  findByYear(year: number): Promise<TransactionEntity[]>;

  /**
   * 照合が必要な取引を取得（振替で未照合）
   */
  findUnreconciledTransfers(): Promise<TransactionEntity[]>;

  /**
   * 取引を保存
   */
  save(transaction: TransactionEntity): Promise<TransactionEntity>;

  /**
   * 複数の取引を一括保存
   */
  saveMany(transactions: TransactionEntity[]): Promise<TransactionEntity[]>;

  /**
   * 取引を更新
   */
  update(transaction: TransactionEntity): Promise<TransactionEntity>;

  /**
   * 取引を削除
   */
  delete(id: string): Promise<void>;

  /**
   * 金融機関IDで取引を一括削除
   * @param institutionId 金融機関ID
   * @param manager トランザクション用のEntityManager（オプショナル）
   */
  deleteByInstitutionId(
    institutionId: string,
    manager?: unknown,
  ): Promise<void>;

  /**
   * すべての取引を削除（テスト用）
   */
  deleteAll(): Promise<void>;
}

export const TRANSACTION_REPOSITORY = Symbol('ITransactionRepository');
