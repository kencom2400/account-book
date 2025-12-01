import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import type { PaymentStatusRepository } from '../../domain/repositories/payment-status.repository.interface';
import { PaymentStatusHistory } from '../../domain/entities/payment-status-history.entity';
import { PaymentStatusRecord } from '../../domain/entities/payment-status-record.entity';

const DATA_DIR = path.join(process.cwd(), 'data', 'payment-status');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');

interface PaymentStatusRecordJSON {
  id: string;
  cardSummaryId: string;
  status: PaymentStatus;
  previousStatus: PaymentStatus | null;
  updatedAt: string;
  updatedBy: 'system' | 'user';
  reason: string | null;
  reconciliationId: string | null;
  notes: string | null;
  createdAt: string;
}

/**
 * JSON形式での支払いステータスリポジトリ実装
 *
 * 開発環境用のJSONファイルベースの永続化
 * 履歴は追記のみ（append-only）で、削除・変更は不可
 */
@Injectable()
export class JsonPaymentStatusRepository implements PaymentStatusRepository {
  private readonly logger = new Logger(JsonPaymentStatusRepository.name);
  private cache: PaymentStatusRecord[] | null = null;

  constructor() {
    void this.ensureDataDirectory();
  }

  /**
   * ステータス記録を保存
   * 履歴は追記のみ（append-only）
   */
  async save(record: PaymentStatusRecord): Promise<PaymentStatusRecord> {
    const records = await this.loadFromFile();

    // 既存の記録を更新（同じIDの場合）
    const existingIndex = records.findIndex((r) => r.id === record.id);
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      // 新しい記録を追加
      records.push(record);
    }

    await this.saveToFile(records);
    this.cache = records;

    return record;
  }

  /**
   * IDでステータス記録を検索
   */
  async findById(id: string): Promise<PaymentStatusRecord | null> {
    const records = await this.loadFromFile();
    return records.find((r) => r.id === id) || null;
  }

  /**
   * カード集計IDで最新のステータス記録を検索
   */
  async findByCardSummaryId(
    cardSummaryId: string,
  ): Promise<PaymentStatusRecord | null> {
    const records = await this.loadFromFile();
    const matchingRecords = records.filter(
      (r) => r.cardSummaryId === cardSummaryId,
    );

    if (matchingRecords.length === 0) {
      return null;
    }

    // updatedAtでソートして最新を返す
    matchingRecords.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
    return matchingRecords[0];
  }

  /**
   * カード集計IDでステータス変更履歴を取得
   */
  async findHistoryByCardSummaryId(
    cardSummaryId: string,
  ): Promise<PaymentStatusHistory> {
    const records = await this.loadFromFile();
    const matchingRecords = records.filter(
      (r) => r.cardSummaryId === cardSummaryId,
    );

    // updatedAtでソート（昇順）
    matchingRecords.sort(
      (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime(),
    );

    return new PaymentStatusHistory(cardSummaryId, matchingRecords);
  }

  /**
   * ステータスでステータス記録を検索
   */
  async findAllByStatus(status: PaymentStatus): Promise<PaymentStatusRecord[]> {
    const records = await this.loadFromFile();
    const matchingRecords = records.filter((r) => r.status === status);

    // 各cardSummaryIdごとに最新の記録のみを返す
    const latestByCardSummary = new Map<string, PaymentStatusRecord>();
    for (const record of matchingRecords) {
      const existing = latestByCardSummary.get(record.cardSummaryId);
      if (
        !existing ||
        record.updatedAt.getTime() > existing.updatedAt.getTime()
      ) {
        latestByCardSummary.set(record.cardSummaryId, record);
      }
    }

    return Array.from(latestByCardSummary.values());
  }

  /**
   * データディレクトリを確保
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error: unknown) {
      this.logger.error('Failed to create data directory', error);
      throw error;
    }
  }

  /**
   * ファイルからデータを読み込み
   */
  private async loadFromFile(): Promise<PaymentStatusRecord[]> {
    // キャッシュが存在すればそれを返す
    if (this.cache !== null) {
      return this.cache;
    }

    await this.ensureDataDirectory();

    try {
      const content = await fs.readFile(RECORDS_FILE, 'utf-8');
      const data = JSON.parse(content) as unknown;
      const jsonArray = Array.isArray(data) ? data : [];

      const records = jsonArray.map((json) =>
        this.deserialize(json as PaymentStatusRecordJSON),
      );

      this.cache = records;
      return records;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        // ファイルが存在しない場合は空配列を返す
        this.cache = [];
        return [];
      }
      this.logger.error('Failed to load payment status records', error);
      throw error;
    }
  }

  /**
   * ファイルにデータを保存
   */
  private async saveToFile(records: PaymentStatusRecord[]): Promise<void> {
    await this.ensureDataDirectory();

    const jsonArray = records.map((record) => this.serialize(record));
    const content = JSON.stringify(jsonArray, null, 2);

    try {
      await fs.writeFile(RECORDS_FILE, content, 'utf-8');
    } catch (error: unknown) {
      this.logger.error('Failed to save payment status records', error);
      throw error;
    }
  }

  /**
   * エンティティをJSON形式にシリアライズ
   */
  private serialize(record: PaymentStatusRecord): PaymentStatusRecordJSON {
    return {
      id: record.id,
      cardSummaryId: record.cardSummaryId,
      status: record.status,
      previousStatus: record.previousStatus || null,
      updatedAt: record.updatedAt.toISOString(),
      updatedBy: record.updatedBy,
      reason: record.reason || null,
      reconciliationId: record.reconciliationId || null,
      notes: record.notes || null,
      createdAt: record.createdAt.toISOString(),
    };
  }

  /**
   * JSON形式からエンティティにデシリアライズ
   */
  private deserialize(json: PaymentStatusRecordJSON): PaymentStatusRecord {
    return new PaymentStatusRecord(
      json.id,
      json.cardSummaryId,
      json.status,
      json.previousStatus || undefined,
      new Date(json.updatedAt),
      json.updatedBy,
      json.reason || undefined,
      json.reconciliationId || undefined,
      json.notes || undefined,
      new Date(json.createdAt),
    );
  }
}
