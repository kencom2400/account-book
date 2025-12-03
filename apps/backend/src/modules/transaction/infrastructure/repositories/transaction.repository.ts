import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { CategoryType, TransactionStatus } from '@account-book/types';

/**
 * JSONファイルに保存する取引データの型定義
 */
interface TransactionJSON {
  id: string;
  date: string;
  amount: number;
  category: {
    id: string;
    name: string;
    type: CategoryType;
  };
  description: string;
  institutionId: string;
  accountId: string;
  status: TransactionStatus;
  isReconciled: boolean;
  relatedTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transaction Repository Implementation
 * JSONファイルでの永続化を実装
 */
@Injectable()
export class TransactionRepository implements ITransactionRepository {
  private readonly dataDir: string;

  constructor(private configService: ConfigService) {
    this.dataDir = path.join(process.cwd(), 'data', 'transactions');
    void this.ensureDataDirectory();
  }

  /**
   * データディレクトリの存在を確認・作成
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  /**
   * IDで取引を取得
   */
  async findById(id: string): Promise<TransactionEntity | null> {
    const allTransactions = await this.findAll();
    return allTransactions.find((t) => t.id === id) || null;
  }

  /**
   * すべての取引を取得
   */
  async findAll(): Promise<TransactionEntity[]> {
    await this.ensureDataDirectory();
    const files = await fs.readdir(this.dataDir);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    const allTransactions: TransactionEntity[] = [];

    for (const file of jsonFiles) {
      const filePath = path.join(this.dataDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as unknown;

      if (Array.isArray(data)) {
        const transactions = data.map((item) =>
          this.toEntity(item as TransactionJSON),
        );
        allTransactions.push(...transactions);
      }
    }

    return allTransactions;
  }

  /**
   * 金融機関IDで取引を取得
   */
  async findByInstitutionId(
    institutionId: string,
  ): Promise<TransactionEntity[]> {
    const allTransactions = await this.findAll();
    return allTransactions.filter((t) => t.institutionId === institutionId);
  }

  /**
   * 口座IDで取引を取得
   */
  async findByAccountId(accountId: string): Promise<TransactionEntity[]> {
    const allTransactions = await this.findAll();
    return allTransactions.filter((t) => t.accountId === accountId);
  }

  /**
   * 期間で取引を取得
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionEntity[]> {
    const allTransactions = await this.findAll();
    return allTransactions.filter(
      (t) => t.date >= startDate && t.date <= endDate,
    );
  }

  /**
   * 金融機関IDと期間で取引を取得
   */
  async findByInstitutionIdsAndDateRange(
    institutionIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionEntity[]> {
    if (institutionIds.length === 0) {
      return [];
    }

    const allTransactions = await this.findAll();
    const institutionIdSet = new Set(institutionIds);
    return allTransactions.filter(
      (t) =>
        institutionIdSet.has(t.institutionId) &&
        t.date >= startDate &&
        t.date <= endDate,
    );
  }

  /**
   * 月で取引を取得
   */
  async findByMonth(year: number, month: number): Promise<TransactionEntity[]> {
    const fileName = this.getMonthFileName(year, month);
    const filePath = path.join(this.dataDir, fileName);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as unknown;
      return Array.isArray(data)
        ? data.map((item) => this.toEntity(item as TransactionJSON))
        : [];
    } catch {
      // ファイルが存在しない場合は空配列を返す
      return [];
    }
  }

  /**
   * 年で取引を取得
   */
  async findByYear(year: number): Promise<TransactionEntity[]> {
    const transactions: TransactionEntity[] = [];

    for (let month = 1; month <= 12; month++) {
      const monthTransactions = await this.findByMonth(year, month);
      transactions.push(...monthTransactions);
    }

    return transactions;
  }

  /**
   * 照合が必要な取引を取得（振替で未照合）
   */
  async findUnreconciledTransfers(): Promise<TransactionEntity[]> {
    const allTransactions = await this.findAll();
    return allTransactions.filter(
      (t) => t.category.type === CategoryType.TRANSFER && !t.isReconciled,
    );
  }

  /**
   * 取引を保存
   */
  async save(transaction: TransactionEntity): Promise<TransactionEntity> {
    const year = transaction.date.getFullYear();
    const month = transaction.date.getMonth() + 1;

    const existingTransactions = await this.findByMonth(year, month);
    existingTransactions.push(transaction);

    await this.saveMonthData(year, month, existingTransactions);
    return transaction;
  }

  /**
   * 複数の取引を一括保存
   */
  async saveMany(
    transactions: TransactionEntity[],
  ): Promise<TransactionEntity[]> {
    // 月ごとにグループ化
    const groupedByMonth = new Map<string, TransactionEntity[]>();

    for (const transaction of transactions) {
      const year = transaction.date.getFullYear();
      const month = transaction.date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!groupedByMonth.has(key)) {
        groupedByMonth.set(key, []);
      }
      groupedByMonth.get(key)!.push(transaction);
    }

    // 月ごとに保存
    for (const [key, monthTransactions] of groupedByMonth.entries()) {
      const [year, month] = key.split('-').map(Number);
      const existingTransactions = await this.findByMonth(year, month);
      const allTransactions = [...existingTransactions, ...monthTransactions];
      await this.saveMonthData(year, month, allTransactions);
    }

    return transactions;
  }

  /**
   * 取引を更新
   */
  async update(transaction: TransactionEntity): Promise<TransactionEntity> {
    const year = transaction.date.getFullYear();
    const month = transaction.date.getMonth() + 1;

    const existingTransactions = await this.findByMonth(year, month);
    const updatedTransactions = existingTransactions.map((t) =>
      t.id === transaction.id ? transaction : t,
    );

    await this.saveMonthData(year, month, updatedTransactions);
    return transaction;
  }

  /**
   * 取引を削除
   */
  async delete(id: string): Promise<void> {
    const transaction = await this.findById(id);
    if (!transaction) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    const year = transaction.date.getFullYear();
    const month = transaction.date.getMonth() + 1;

    const existingTransactions = await this.findByMonth(year, month);
    const filteredTransactions = existingTransactions.filter(
      (t) => t.id !== id,
    );

    await this.saveMonthData(year, month, filteredTransactions);
  }

  /**
   * すべての取引を削除（テスト用）
   */
  async deleteAll(): Promise<void> {
    await this.ensureDataDirectory();
    const files = await fs.readdir(this.dataDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        await fs.unlink(path.join(this.dataDir, file));
      }
    }
  }

  /**
   * 月データをファイルに保存
   */
  private async saveMonthData(
    year: number,
    month: number,
    transactions: TransactionEntity[],
  ): Promise<void> {
    await this.ensureDataDirectory();
    const fileName = this.getMonthFileName(year, month);
    const filePath = path.join(this.dataDir, fileName);

    const data = transactions.map((t) => this.toJSON(t));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 月ファイル名を取得
   */
  private getMonthFileName(year: number, month: number): string {
    const paddedMonth = String(month).padStart(2, '0');
    return `${year}-${paddedMonth}.json`;
  }

  /**
   * エンティティをJSONオブジェクトに変換
   */
  private toJSON(entity: TransactionEntity): TransactionJSON {
    return {
      id: entity.id,
      date: entity.date.toISOString(),
      amount: entity.amount,
      category: entity.category,
      description: entity.description,
      institutionId: entity.institutionId,
      accountId: entity.accountId,
      status: entity.status,
      isReconciled: entity.isReconciled,
      relatedTransactionId: entity.relatedTransactionId,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * JSONオブジェクトをエンティティに変換
   */
  private toEntity(data: TransactionJSON): TransactionEntity {
    return new TransactionEntity(
      data.id,
      new Date(data.date),
      data.amount,
      data.category,
      data.description,
      data.institutionId,
      data.accountId,
      data.status || TransactionStatus.COMPLETED,
      data.isReconciled || false,
      data.relatedTransactionId || null,
      new Date(data.createdAt),
      new Date(data.updatedAt),
    );
  }
}
