import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * サブカテゴリと店舗マスタテーブルの追加
 * FR-009: 詳細費目分類機能のためのテーブル作成
 */
export class AddSubcategoriesAndMerchantsTables1732400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // サブカテゴリテーブル作成
    await queryRunner.createTable(
      new Table({
        name: 'subcategories',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'category_type',
            type: 'enum',
            enum: ['INCOME', 'EXPENSE', 'TRANSFER', 'REPAYMENT', 'INVESTMENT'],
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'parent_id',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'display_order',
            type: 'int',
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_subcategories_category_type_is_active',
            columnNames: ['category_type', 'is_active'],
          },
          {
            name: 'IDX_subcategories_parent_id',
            columnNames: ['parent_id'],
          },
        ],
      }),
      true,
    );

    // 店舗マスタテーブル作成
    await queryRunner.createTable(
      new Table({
        name: 'merchants',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'aliases',
            type: 'json',
            comment: '店舗別名リスト（JSON配列）',
          },
          {
            name: 'default_subcategory_id',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'confidence',
            type: 'decimal',
            precision: 3,
            scale: 2,
            comment: '分類信頼度（0.00-1.00）',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_merchants_name',
            columnNames: ['name'],
          },
        ],
      }),
      true,
    );

    // 店舗マスタの外部キー制約追加
    await queryRunner.createForeignKey(
      'merchants',
      new TableForeignKey({
        columnNames: ['default_subcategory_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'subcategories',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // transactionsテーブルへのカラム追加
    await queryRunner.addColumns('transactions', [
      new TableColumn({
        name: 'subcategory_id',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'classification_confidence',
        type: 'decimal',
        precision: 3,
        scale: 2,
        isNullable: true,
        comment: '分類信頼度（0.00-1.00）',
      }),
      new TableColumn({
        name: 'classification_reason',
        type: 'enum',
        enum: [
          'MERCHANT_MATCH',
          'KEYWORD_MATCH',
          'AMOUNT_INFERENCE',
          'RECURRING_PATTERN',
          'DEFAULT',
          'MANUAL',
        ],
        isNullable: true,
      }),
      new TableColumn({
        name: 'merchant_id',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'confirmed_at',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);

    // transactionsテーブルの外部キー制約追加
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['subcategory_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'subcategories',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['merchant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    // transactionsテーブルのインデックス追加
    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_transactions_subcategory_id',
        columnNames: ['subcategory_id'],
      }),
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_transactions_merchant_id',
        columnNames: ['merchant_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // transactionsテーブルのインデックス削除
    await queryRunner.dropIndex('transactions', 'IDX_transactions_merchant_id');
    await queryRunner.dropIndex(
      'transactions',
      'IDX_transactions_subcategory_id',
    );

    // transactionsテーブルの外部キー削除
    const transactionsTable = await queryRunner.getTable('transactions');
    if (transactionsTable) {
      const merchantForeignKey = transactionsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('merchant_id') !== -1,
      );
      if (merchantForeignKey) {
        await queryRunner.dropForeignKey('transactions', merchantForeignKey);
      }

      const subcategoryForeignKey = transactionsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('subcategory_id') !== -1,
      );
      if (subcategoryForeignKey) {
        await queryRunner.dropForeignKey('transactions', subcategoryForeignKey);
      }
    }

    // transactionsテーブルのカラム削除
    await queryRunner.dropColumns('transactions', [
      'confirmed_at',
      'merchant_id',
      'classification_reason',
      'classification_confidence',
      'subcategory_id',
    ]);

    // 店舗マスタテーブルの外部キー削除
    const merchantsTable = await queryRunner.getTable('merchants');
    if (merchantsTable) {
      const foreignKey = merchantsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('default_subcategory_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('merchants', foreignKey);
      }
    }

    // テーブル削除
    await queryRunner.dropTable('merchants');
    await queryRunner.dropTable('subcategories');
  }
}
