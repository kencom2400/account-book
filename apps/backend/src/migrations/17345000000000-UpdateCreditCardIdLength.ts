import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * credit_cardsテーブルのIDカラムの長さを36文字から39文字に変更
 * cc_プレフィックス付きUUID（39文字）に対応するため
 */
export class UpdateCreditCardIdLength17345000000000 implements MigrationInterface {
  name = 'UpdateCreditCardIdLength17345000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // credit_cardsテーブルのIDカラムの長さを36文字から39文字に変更
    await queryRunner.changeColumn(
      'credit_cards',
      'id',
      new TableColumn({
        name: 'id',
        type: 'varchar',
        length: '39',
        isPrimary: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ロールバック: IDカラムの長さを39文字から36文字に戻す
    await queryRunner.changeColumn(
      'credit_cards',
      'id',
      new TableColumn({
        name: 'id',
        type: 'varchar',
        length: '36',
        isPrimary: true,
      }),
    );
  }
}
