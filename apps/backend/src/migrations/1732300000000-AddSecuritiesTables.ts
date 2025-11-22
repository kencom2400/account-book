import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class AddSecuritiesTables1732300000000 implements MigrationInterface {
  name = 'AddSecuritiesTables1732300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // securities_accounts テーブル作成
    await queryRunner.createTable(
      new Table({
        name: 'securities_accounts',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '60',
            isPrimary: true,
          },
          {
            name: 'securities_company_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'account_number',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'account_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'credentials_encrypted',
            type: 'text',
          },
          {
            name: 'credentials_iv',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'credentials_auth_tag',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'credentials_algorithm',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'credentials_version',
            type: 'varchar',
            length: '10',
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
            name: 'total_evaluation_amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'cash_balance',
            type: 'decimal',
            precision: 15,
            scale: 2,
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
      'securities_accounts',
      new TableIndex({
        name: 'IDX_SECURITIES_ACCOUNTS_IS_CONNECTED',
        columnNames: ['is_connected'],
      }),
    );

    // holdings テーブル作成
    await queryRunner.createTable(
      new Table({
        name: 'holdings',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '60',
            isPrimary: true,
          },
          {
            name: 'securities_account_id',
            type: 'varchar',
            length: '60',
          },
          {
            name: 'security_code',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'security_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'quantity',
            type: 'int',
          },
          {
            name: 'average_acquisition_price',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'current_price',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'security_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'market',
            type: 'varchar',
            length: '50',
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
      'holdings',
      new TableIndex({
        name: 'IDX_HOLDINGS_SECURITIES_ACCOUNT_ID',
        columnNames: ['securities_account_id'],
      }),
    );

    await queryRunner.createIndex(
      'holdings',
      new TableIndex({
        name: 'IDX_HOLDINGS_SECURITY_CODE',
        columnNames: ['security_code'],
      }),
    );

    await queryRunner.createForeignKey(
      'holdings',
      new TableForeignKey({
        columnNames: ['securities_account_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'securities_accounts',
        onDelete: 'CASCADE',
      }),
    );

    // security_transactions テーブル作成
    await queryRunner.createTable(
      new Table({
        name: 'security_transactions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '60',
            isPrimary: true,
          },
          {
            name: 'securities_account_id',
            type: 'varchar',
            length: '60',
          },
          {
            name: 'security_code',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'security_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'transaction_date',
            type: 'timestamp',
          },
          {
            name: 'transaction_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'quantity',
            type: 'int',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'fee',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'security_transactions',
      new TableIndex({
        name: 'IDX_SECURITY_TRANSACTIONS_SECURITIES_ACCOUNT_ID',
        columnNames: ['securities_account_id'],
      }),
    );

    await queryRunner.createIndex(
      'security_transactions',
      new TableIndex({
        name: 'IDX_SECURITY_TRANSACTIONS_DATE',
        columnNames: ['transaction_date'],
      }),
    );

    await queryRunner.createIndex(
      'security_transactions',
      new TableIndex({
        name: 'IDX_SECURITY_TRANSACTIONS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createForeignKey(
      'security_transactions',
      new TableForeignKey({
        columnNames: ['securities_account_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'securities_accounts',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 外部キー制約を削除
    const securityTransactionsTable = await queryRunner.getTable(
      'security_transactions',
    );
    const holdingsTable = await queryRunner.getTable('holdings');

    if (securityTransactionsTable) {
      const foreignKeys = securityTransactionsTable.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('security_transactions', foreignKey);
      }
    }

    if (holdingsTable) {
      const foreignKeys = holdingsTable.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('holdings', foreignKey);
      }
    }

    // テーブルを削除
    await queryRunner.dropTable('security_transactions', true);
    await queryRunner.dropTable('holdings', true);
    await queryRunner.dropTable('securities_accounts', true);
  }
}
