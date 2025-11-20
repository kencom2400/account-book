import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * CreditCardOrmEntity
 * TypeORM用のクレジットカードエンティティ
 * データベースのテーブル構造を定義
 */
@Entity('credit_cards')
@Index(['issuer'])
@Index(['isConnected'])
export class CreditCardOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 255, name: 'card_name' })
  cardName!: string;

  @Column({ type: 'varchar', length: 4, name: 'card_number' })
  cardNumber!: string;

  @Column({ type: 'varchar', length: 255, name: 'card_holder_name' })
  cardHolderName!: string;

  @Column({ type: 'date', name: 'expiry_date' })
  expiryDate!: Date;

  @Column({ type: 'text', name: 'encrypted_credentials' })
  encryptedCredentials!: string;

  @Column({ type: 'boolean', default: false, name: 'is_connected' })
  isConnected!: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_synced_at' })
  lastSyncedAt!: Date | null;

  @Column({ type: 'int', name: 'payment_day' })
  paymentDay!: number;

  @Column({ type: 'int', name: 'closing_day' })
  closingDay!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'credit_limit' })
  creditLimit!: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'current_balance',
  })
  currentBalance!: number;

  @Column({ type: 'varchar', length: 255 })
  issuer!: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}
