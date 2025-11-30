import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Reconciliation } from '../../domain/entities/reconciliation.entity';
import { ReconciliationStatus } from '../../domain/enums/reconciliation-status.enum';
import { ReconciliationRepository } from '../../domain/repositories/reconciliation.repository.interface';
import { ReconciliationResult } from '../../domain/value-objects/reconciliation-result.vo';
import { ReconciliationSummary } from '../../domain/value-objects/reconciliation-summary.vo';
import { Discrepancy } from '../../domain/value-objects/discrepancy.vo';

const DATA_DIR = path.join(process.cwd(), 'data', 'reconciliation');
const FILE_NAME = 'reconciliations.json';

interface ReconciliationJSON {
  id: string;
  cardId: string;
  billingMonth: string;
  status: ReconciliationStatus;
  executedAt: string;
  results: Array<{
    isMatched: boolean;
    confidence: number;
    bankTransactionId: string | null;
    cardSummaryId: string;
    matchedAt: string | null;
    discrepancy: {
      amountDifference: number;
      dateDifference: number;
      descriptionMatch: boolean;
      reason: string;
    } | null;
  }>;
  summary: {
    total: number;
    matched: number;
    unmatched: number;
    partial: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * JSON形式での照合データリポジトリ実装
 *
 * 開発環境用のJSONファイルベースの永続化
 */
@Injectable()
export class JsonReconciliationRepository implements ReconciliationRepository {
  private readonly logger = new Logger(JsonReconciliationRepository.name);
  private cache: Reconciliation[] | null = null;

  constructor() {
    void this.ensureDataDirectory();
  }

  /**
   * 照合データを保存
   */
  async save(reconciliation: Reconciliation): Promise<Reconciliation> {
    const reconciliations = await this.loadFromFile();

    // 既存データを検索（cardId + billingMonthで一意）
    const existingIndex = reconciliations.findIndex(
      (r) =>
        r.cardId === reconciliation.cardId &&
        r.billingMonth === reconciliation.billingMonth,
    );

    const plain = reconciliation.toPlain();
    const json: ReconciliationJSON = {
      ...plain,
      executedAt: plain.executedAt.toISOString(),
      results: plain.results.map((r) => ({
        ...r,
        matchedAt: r.matchedAt?.toISOString() ?? null,
      })),
      createdAt: plain.createdAt.toISOString(),
      updatedAt: plain.updatedAt.toISOString(),
    };

    if (existingIndex >= 0) {
      // 既存データを更新
      reconciliations[existingIndex] = Reconciliation.fromPlain({
        ...json,
        executedAt: new Date(json.executedAt),
        results: json.results.map((r) => ({
          ...r,
          matchedAt: r.matchedAt ? new Date(r.matchedAt) : null,
        })),
        createdAt: new Date(json.createdAt),
        updatedAt: new Date(json.updatedAt),
      });
    } else {
      // 新規データを追加
      reconciliations.push(
        Reconciliation.fromPlain({
          ...json,
          executedAt: new Date(json.executedAt),
          results: json.results.map((r) => ({
            ...r,
            matchedAt: r.matchedAt ? new Date(r.matchedAt) : null,
          })),
          createdAt: new Date(json.createdAt),
          updatedAt: new Date(json.updatedAt),
        }),
      );
    }

    await this.saveToFile(reconciliations);
    this.cache = reconciliations;

    return reconciliation;
  }

  /**
   * IDで照合データを検索
   */
  async findById(id: string): Promise<Reconciliation | null> {
    const reconciliations = await this.loadFromFile();
    return reconciliations.find((r) => r.id === id) ?? null;
  }

  /**
   * カードIDと請求月で検索
   */
  async findByCardAndMonth(
    cardId: string,
    billingMonth: string,
  ): Promise<Reconciliation | null> {
    const reconciliations = await this.loadFromFile();
    return (
      reconciliations.find(
        (r) => r.cardId === cardId && r.billingMonth === billingMonth,
      ) ?? null
    );
  }

  /**
   * カードIDと期間で複数の照合データを取得
   */
  async findByCard(
    cardId: string,
    startMonth: string,
    endMonth: string,
  ): Promise<Reconciliation[]> {
    const reconciliations = await this.loadFromFile();
    return reconciliations.filter((r) => {
      if (r.cardId !== cardId) {
        return false;
      }
      if (startMonth && r.billingMonth < startMonth) {
        return false;
      }
      if (endMonth && r.billingMonth > endMonth) {
        return false;
      }
      return true;
    });
  }

  /**
   * すべての照合データを取得
   */
  async findAll(): Promise<Reconciliation[]> {
    return await this.loadFromFile();
  }

  /**
   * 照合データを削除
   */
  async delete(id: string): Promise<void> {
    const reconciliations = await this.loadFromFile();
    const filtered = reconciliations.filter((r) => r.id !== id);
    await this.saveToFile(filtered);
    this.cache = filtered;
  }

  /**
   * ファイルからデータを読み込み
   */
  private async loadFromFile(): Promise<Reconciliation[]> {
    // キャッシュが存在すればそれを返す
    if (this.cache !== null) {
      return this.cache;
    }

    await this.ensureDataDirectory();
    const filePath = path.join(DATA_DIR, FILE_NAME);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as unknown;
      const jsonArray = Array.isArray(data) ? data : [];

      const reconciliations = jsonArray.map((json) =>
        this.deserialize(json as ReconciliationJSON),
      );

      this.cache = reconciliations;
      return reconciliations;
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
      this.logger.error('Failed to load reconciliations', error);
      throw error;
    }
  }

  /**
   * ファイルにデータを保存
   */
  private async saveToFile(reconciliations: Reconciliation[]): Promise<void> {
    await this.ensureDataDirectory();
    const filePath = path.join(DATA_DIR, FILE_NAME);

    const jsonArray = reconciliations.map((r) => this.serialize(r));

    await fs.writeFile(filePath, JSON.stringify(jsonArray, null, 2), 'utf-8');
  }

  /**
   * ReconciliationエンティティをJSONに変換
   */
  private serialize(reconciliation: Reconciliation): ReconciliationJSON {
    const plain = reconciliation.toPlain();
    return {
      ...plain,
      executedAt: plain.executedAt.toISOString(),
      results: plain.results.map((r) => ({
        ...r,
        matchedAt: r.matchedAt?.toISOString() ?? null,
      })),
      createdAt: plain.createdAt.toISOString(),
      updatedAt: plain.updatedAt.toISOString(),
    };
  }

  /**
   * JSONをReconciliationエンティティに変換
   */
  private deserialize(json: ReconciliationJSON): Reconciliation {
    return Reconciliation.fromPlain({
      id: json.id,
      cardId: json.cardId,
      billingMonth: json.billingMonth,
      status: json.status,
      executedAt: new Date(json.executedAt),
      results: json.results.map((r) =>
        ReconciliationResult.fromPlain({
          isMatched: r.isMatched,
          confidence: r.confidence,
          bankTransactionId: r.bankTransactionId,
          cardSummaryId: r.cardSummaryId,
          matchedAt: r.matchedAt ? new Date(r.matchedAt) : null,
          discrepancy: r.discrepancy
            ? Discrepancy.fromPlain(r.discrepancy)
            : null,
        }),
      ),
      summary: ReconciliationSummary.fromPlain(json.summary),
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
    });
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
}
