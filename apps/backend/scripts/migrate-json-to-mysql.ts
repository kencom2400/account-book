#!/usr/bin/env node

/**
 * データ移行スクリプト: JSON → MySQL
 *
 * 使用方法:
 * pnpm ts-node scripts/migrate-json-to-mysql.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource, EntityManager } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CategoryOrmEntity } from '../src/modules/category/infrastructure/entities/category.orm-entity';
import {
  InstitutionOrmEntity,
  AccountJSON,
} from '../src/modules/institution/infrastructure/entities/institution.orm-entity';
import { TransactionOrmEntity } from '../src/modules/transaction/infrastructure/entities/transaction.orm-entity';

interface CategoryJSON {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  isSystemDefined: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface EncryptedCredentialsJSON {
  encrypted: string;
  iv: string;
  authTag: string;
  algorithm: string;
  version: string;
}

interface InstitutionJSON {
  id: string;
  name: string;
  type: string;
  credentials: EncryptedCredentialsJSON;
  isConnected: boolean;
  lastSyncedAt: string | null;
  accounts: AccountJSON[];
  createdAt: string;
  updatedAt: string;
}

/**
 * AccountJSON型ガード関数
 */
function isValidAccountJSON(account: unknown): account is AccountJSON {
  if (typeof account !== 'object' || account === null) {
    return false;
  }
  const obj = account as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.institutionId === 'string' &&
    typeof obj.accountNumber === 'string' &&
    typeof obj.accountName === 'string' &&
    typeof obj.balance === 'number' &&
    typeof obj.currency === 'string'
  );
}

interface TransactionJSON {
  id: string;
  date: string;
  amount: number;
  category: {
    id: string;
    name: string;
    type: string;
  };
  description: string;
  institutionId: string;
  accountId: string;
  status: string;
  isReconciled: boolean;
  relatedTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

async function migrateCategories(manager: EntityManager): Promise<void> {
  console.log('📁 カテゴリデータの移行を開始...');

  const filePath: string = path.join(
    process.cwd(),
    'data',
    'categories',
    'categories.json',
  );

  try {
    const content: string = await fs.readFile(filePath, 'utf-8');
    const categories: CategoryJSON[] = JSON.parse(content) as CategoryJSON[];

    const repository = manager.getRepository(CategoryOrmEntity);

    // バッチ処理でパフォーマンス改善
    const entities: CategoryOrmEntity[] = categories.map(
      (cat: CategoryJSON) => {
        const entity: CategoryOrmEntity = new CategoryOrmEntity();
        entity.id = cat.id;
        entity.name = cat.name;
        entity.type = cat.type as CategoryOrmEntity['type'];
        entity.parentId = cat.parentId;
        entity.icon = cat.icon;
        entity.color = cat.color;
        entity.isSystemDefined = cat.isSystemDefined;
        entity.order = cat.order;
        entity.createdAt = new Date(cat.createdAt);
        entity.updatedAt = new Date(cat.updatedAt);
        return entity;
      },
    );

    await repository.save(entities);

    console.log(`✅ カテゴリ ${categories.length}件を移行しました`);
  } catch (error) {
    console.error(
      `⚠️  カテゴリデータの移行中にエラーが発生しました: ${filePath}`,
      error,
    );
    throw error;
  }
}

async function migrateInstitutions(manager: EntityManager): Promise<void> {
  console.log('📁 金融機関データの移行を開始...');

  const filePath: string = path.join(
    process.cwd(),
    'data',
    'institutions',
    'institutions.json',
  );

  try {
    const content: string = await fs.readFile(filePath, 'utf-8');
    const institutions: InstitutionJSON[] = JSON.parse(
      content,
    ) as InstitutionJSON[];

    const repository = manager.getRepository(InstitutionOrmEntity);

    // バッチ処理でパフォーマンス改善
    const entities: InstitutionOrmEntity[] = institutions.map(
      (inst: InstitutionJSON) => {
        const entity: InstitutionOrmEntity = new InstitutionOrmEntity();
        entity.id = inst.id;
        entity.name = inst.name;
        entity.type = inst.type as InstitutionOrmEntity['type'];
        entity.encryptedCredentials = JSON.stringify(inst.credentials);
        entity.isConnected = inst.isConnected;
        entity.lastSyncedAt = inst.lastSyncedAt
          ? new Date(inst.lastSyncedAt)
          : null;

        // 型安全なaccountsマッピング
        if (
          Array.isArray(inst.accounts) &&
          inst.accounts.every(isValidAccountJSON)
        ) {
          entity.accounts = inst.accounts;
        } else {
          console.warn(
            `⚠️  Invalid accounts structure for institution ${inst.id}, using empty array`,
          );
          entity.accounts = [];
        }

        entity.createdAt = new Date(inst.createdAt);
        entity.updatedAt = new Date(inst.updatedAt);
        return entity;
      },
    );

    await repository.save(entities);

    console.log(`✅ 金融機関 ${institutions.length}件を移行しました`);
  } catch (error) {
    console.error(
      `⚠️  金融機関データの移行中にエラーが発生しました: ${filePath}`,
      error,
    );
    throw error;
  }
}

async function migrateTransactions(manager: EntityManager): Promise<void> {
  console.log('📁 取引データの移行を開始...');

  const dirPath: string = path.join(process.cwd(), 'data', 'transactions');

  try {
    const files: string[] = await fs.readdir(dirPath);
    const jsonFiles: string[] = files.filter((f: string) =>
      f.endsWith('.json'),
    );

    const repository = manager.getRepository(TransactionOrmEntity);
    let totalCount = 0;

    for (const file of jsonFiles) {
      const filePath: string = path.join(dirPath, file);
      const content: string = await fs.readFile(filePath, 'utf-8');
      const transactions: TransactionJSON[] = JSON.parse(
        content,
      ) as TransactionJSON[];

      // バッチ処理でパフォーマンス改善
      const entities: TransactionOrmEntity[] = transactions.map(
        (txn: TransactionJSON) => {
          const entity: TransactionOrmEntity = new TransactionOrmEntity();
          entity.id = txn.id;
          entity.date = new Date(txn.date);
          // amountはstring型に変換
          entity.amount = txn.amount.toString();
          entity.categoryId = txn.category.id;
          entity.categoryName = txn.category.name;
          entity.categoryType = txn.category
            .type as TransactionOrmEntity['categoryType'];
          entity.description = txn.description;
          entity.institutionId = txn.institutionId;
          entity.accountId = txn.accountId;
          entity.status = txn.status as TransactionOrmEntity['status'];
          entity.isReconciled = txn.isReconciled;
          entity.relatedTransactionId = txn.relatedTransactionId;
          entity.createdAt = new Date(txn.createdAt);
          entity.updatedAt = new Date(txn.updatedAt);
          return entity;
        },
      );

      await repository.save(entities);
      totalCount += entities.length;
    }

    console.log(`✅ 取引 ${totalCount}件を移行しました`);
  } catch (error) {
    console.error(`⚠️  取引データの移行中にエラーが発生しました:`, error);
    throw error;
  }
}

async function bootstrap(): Promise<void> {
  console.log('🚀 データ移行を開始します...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource: DataSource = app.get(DataSource);
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('✅ データベース接続成功、トランザクション開始\n');

    // EntityManagerを渡して各移行処理を実行
    await migrateCategories(queryRunner.manager);
    await migrateInstitutions(queryRunner.manager);
    await migrateTransactions(queryRunner.manager);

    await queryRunner.commitTransaction();
    console.log('\n🎉 すべてのデータ移行が完了しました！');
  } catch (error) {
    console.error('❌ データ移行中にエラーが発生しました:', error);
    await queryRunner.rollbackTransaction();
    console.log('↩️  トランザクションをロールバックしました');
    process.exit(1);
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap().catch((error: Error) => {
  console.error('❌ 致命的なエラー:', error);
  process.exit(1);
});
