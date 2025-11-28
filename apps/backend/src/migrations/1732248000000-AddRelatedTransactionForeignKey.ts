import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

/**
 * AddRelatedTransactionForeignKey Migration
 *
 * transactions.related_transaction_id に自己参照外部キー制約を追加
 *
 * 目的:
 * - 振替取引の関連付けにおけるデータ整合性の保証
 * - 存在しない取引IDへの参照を防止
 * - 関連取引が削除された場合は NULL に設定
 *
 * 参照: docs/database-schema.md - Phase 1.5: データ整合性の改善
 */
export class AddRelatedTransactionForeignKey1732248000000 implements MigrationInterface {
  name = 'AddRelatedTransactionForeignKey1732248000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // transactions.related_transaction_id への自己参照外部キー制約を追加
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        name: 'FK_TRANSACTIONS_RELATED',
        columnNames: ['related_transaction_id'],
        referencedTableName: 'transactions',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL', // 関連取引が削除された場合は NULL に設定
        onUpdate: 'CASCADE', // 関連取引のIDが更新された場合は追従
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 外部キー制約を削除
    await queryRunner.dropForeignKey('transactions', 'FK_TRANSACTIONS_RELATED');
  }
}
