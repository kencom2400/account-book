import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // categories テーブル作成
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['income', 'expense', 'transfer', 'repayment', 'investment'],
          },
          {
            name: 'parent_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'is_system_defined',
            type: 'boolean',
            default: false,
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
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
      }),
      true,
    );

    await queryRunner.createIndex(
      'categories',
      new TableIndex({
        name: 'IDX_CATEGORIES_TYPE',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'categories',
      new TableIndex({
        name: 'IDX_CATEGORIES_PARENT_ID',
        columnNames: ['parent_id'],
      }),
    );

    // institutions テーブル作成
    await queryRunner.createTable(
      new Table({
        name: 'institutions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['bank', 'credit_card', 'securities'],
          },
          {
            name: 'encrypted_credentials',
            type: 'text',
          },
          {
            name: 'is_connected',
            type: 'boolean',
            default: false,
          },
          {
            name: 'last_synced_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'accounts',
            type: 'json',
            isNullable: true,
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
      }),
      true,
    );

    await queryRunner.createIndex(
      'institutions',
      new TableIndex({
        name: 'IDX_INSTITUTIONS_TYPE',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'institutions',
      new TableIndex({
        name: 'IDX_INSTITUTIONS_IS_CONNECTED',
        columnNames: ['is_connected'],
      }),
    );

    // credit_cards テーブル作成
    await queryRunner.createTable(
      new Table({
        name: 'credit_cards',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'card_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'card_number',
            type: 'varchar',
            length: '4',
          },
          {
            name: 'card_holder_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'expiry_date',
            type: 'date',
          },
          {
            name: 'encrypted_credentials',
            type: 'text',
          },
          {
            name: 'is_connected',
            type: 'boolean',
            default: false,
          },
          {
            name: 'last_synced_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'payment_day',
            type: 'int',
          },
          {
            name: 'closing_day',
            type: 'int',
          },
          {
            name: 'credit_limit',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'current_balance',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'issuer',
            type: 'varchar',
            length: '255',
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
      }),
      true,
    );

    await queryRunner.createIndex(
      'credit_cards',
      new TableIndex({
        name: 'IDX_CREDIT_CARDS_ISSUER',
        columnNames: ['issuer'],
      }),
    );

    await queryRunner.createIndex(
      'credit_cards',
      new TableIndex({
        name: 'IDX_CREDIT_CARDS_IS_CONNECTED',
        columnNames: ['is_connected'],
      }),
    );

    // transactions テーブル作成
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'category_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'category_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'category_type',
            type: 'enum',
            enum: ['income', 'expense', 'transfer', 'repayment', 'investment'],
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'institution_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'account_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'completed', 'failed', 'cancelled'],
            default: "'completed'",
          },
          {
            name: 'is_reconciled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'related_transaction_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
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
      }),
      true,
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_TRANSACTIONS_DATE_INSTITUTION',
        columnNames: ['date', 'institution_id'],
      }),
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_TRANSACTIONS_CATEGORY',
        columnNames: ['category_id'],
      }),
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_TRANSACTIONS_STATUS',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('transactions');
    await queryRunner.dropTable('credit_cards');
    await queryRunner.dropTable('institutions');
    await queryRunner.dropTable('categories');
  }
}
