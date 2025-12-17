/**
 * ユニットテスト用のモックファクトリー
 *
 * 各モジュールで使用するモックオブジェクトを生成するファクトリー関数を提供します。
 */

import { CategoryType, TransactionStatus } from '@account-book/types';
import { TransactionEntity } from '../../modules/transaction/domain/entities/transaction.entity';

/**
 * TransactionEntityのモックを作成するファクトリー関数
 *
 * @param overrides - デフォルト値を上書きするプロパティ
 * @returns TransactionEntityのインスタンス
 */
export function createMockTransaction(
  overrides?: Partial<{
    id: string;
    date: Date;
    amount: number;
    category: { id: string; name: string; type: CategoryType };
    description: string;
    institutionId: string;
    accountId: string;
    status: TransactionStatus;
    isReconciled: boolean;
    relatedTransactionId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>,
): TransactionEntity {
  const defaultDate = new Date('2024-01-15');
  return new TransactionEntity(
    overrides?.id || 'tx_test_123',
    overrides?.date || defaultDate,
    overrides?.amount ?? 1000,
    overrides?.category || {
      id: 'cat_1',
      name: 'Test Category',
      type: CategoryType.EXPENSE,
    },
    overrides?.description || 'Test transaction',
    overrides?.institutionId || 'inst_1',
    overrides?.accountId || 'acc_1',
    overrides?.status || TransactionStatus.COMPLETED,
    overrides?.isReconciled ?? false,
    overrides?.relatedTransactionId ?? null,
    overrides?.createdAt || defaultDate,
    overrides?.updatedAt || defaultDate,
  );
}
