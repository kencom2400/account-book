import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Alert } from '../../domain/entities/alert.entity';
import { AlertStatus } from '../../domain/enums/alert-status.enum';
import { AlertLevel } from '../../domain/enums/alert-level.enum';
import { AlertType } from '../../domain/enums/alert-type.enum';
import { ActionType } from '../../domain/enums/action-type.enum';
import type { AlertRepository } from '../../domain/repositories/alert.repository.interface';
import { AlertAction } from '../../domain/value-objects/alert-action.vo';
import { CriticalAlertDeletionException } from '../../domain/errors/alert.errors';

const DATA_DIR = path.join(process.cwd(), 'data', 'alerts');
const FILE_NAME = 'alerts.json';

interface AlertJSON {
  id: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  message: string;
  details: {
    cardId: string;
    cardName: string;
    billingMonth: string;
    expectedAmount: number;
    actualAmount: number | null;
    discrepancy: number | null;
    paymentDate: string | null;
    daysElapsed: number | null;
    relatedTransactions: string[];
    reconciliationId: string | null;
  };
  status: AlertStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
  actions: Array<{
    id: string;
    label: string;
    action: string;
    isPrimary: boolean;
  }>;
}

/**
 * JSON形式でのアラートデータリポジトリ実装
 *
 * 開発環境用のJSONファイルベースの永続化
 */
@Injectable()
export class JsonAlertRepository implements AlertRepository {
  private readonly logger = new Logger(JsonAlertRepository.name);
  private cache: Alert[] | null = null;

  constructor() {
    void this.ensureDataDirectory();
  }

  /**
   * アラートデータを保存
   */
  async save(alert: Alert): Promise<Alert> {
    const alerts = await this.loadFromFile();

    // 既存データを検索
    const existingIndex = alerts.findIndex((a) => a.id === alert.id);

    if (existingIndex >= 0) {
      // 既存データを更新
      alerts[existingIndex] = alert;
    } else {
      // 新規データを追加
      alerts.push(alert);
    }

    await this.saveToFile(alerts);
    this.cache = alerts;

    return alert;
  }

  /**
   * IDでアラートデータを検索
   */
  async findById(id: string): Promise<Alert | null> {
    const alerts = await this.loadFromFile();
    return alerts.find((a) => a.id === id) ?? null;
  }

  /**
   * 照合結果IDでアラートデータを検索（重複チェック用）
   */
  async findByReconciliationId(
    reconciliationId: string,
  ): Promise<Alert | null> {
    const alerts = await this.loadFromFile();
    return (
      alerts.find((a) => a.details.reconciliationId === reconciliationId) ??
      null
    );
  }

  /**
   * カードIDと請求月で複数のアラートを取得
   */
  async findByCardAndMonth(
    cardId: string,
    billingMonth: string,
  ): Promise<Alert[]> {
    const alerts = await this.loadFromFile();
    return alerts.filter(
      (a) =>
        a.details.cardId === cardId && a.details.billingMonth === billingMonth,
    );
  }

  /**
   * 未解決のアラートを取得
   */
  async findUnresolved(): Promise<Alert[]> {
    const alerts = await this.loadFromFile();
    return alerts.filter((a) => a.status !== AlertStatus.RESOLVED);
  }

  /**
   * 未読のアラートを取得
   */
  async findUnread(): Promise<Alert[]> {
    const alerts = await this.loadFromFile();
    return alerts.filter((a) => a.status === AlertStatus.UNREAD);
  }

  /**
   * クエリパラメータに基づいてアラートを取得
   */
  async findAll(query: {
    level?: string;
    status?: string;
    type?: string;
    cardId?: string;
    billingMonth?: string;
    page?: number;
    limit?: number;
  }): Promise<Alert[]> {
    let alerts = await this.loadFromFile();

    // フィルタリング
    if (query.level) {
      alerts = alerts.filter((a) => a.level === query.level);
    }
    if (query.status) {
      alerts = alerts.filter((a) => a.status === query.status);
    }
    if (query.type) {
      alerts = alerts.filter((a) => a.type === query.type);
    }
    if (query.cardId) {
      alerts = alerts.filter((a) => a.details.cardId === query.cardId);
    }
    if (query.billingMonth) {
      alerts = alerts.filter(
        (a) => a.details.billingMonth === query.billingMonth,
      );
    }

    // ソート（作成日時の降順）
    alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // ページネーション
    if (query.page && query.limit) {
      const start = (query.page - 1) * query.limit;
      const end = start + query.limit;
      alerts = alerts.slice(start, end);
    }

    return alerts;
  }

  /**
   * アラートデータを削除
   */
  async delete(id: string): Promise<void> {
    const alerts = await this.loadFromFile();
    const alert = alerts.find((a) => a.id === id);

    if (!alert) {
      return;
    }

    // CRITICALアラートは削除不可
    if (alert.level === AlertLevel.CRITICAL) {
      throw new CriticalAlertDeletionException(id);
    }

    const filtered = alerts.filter((a) => a.id !== id);
    await this.saveToFile(filtered);
    this.cache = filtered;
  }

  /**
   * ファイルからデータを読み込み
   */
  private async loadFromFile(): Promise<Alert[]> {
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

      const alerts = jsonArray.map((json) =>
        this.deserialize(json as AlertJSON),
      );

      this.cache = alerts;
      return alerts;
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
      this.logger.error('Failed to load alerts', error);
      throw error;
    }
  }

  /**
   * ファイルにデータを保存
   */
  private async saveToFile(alerts: Alert[]): Promise<void> {
    await this.ensureDataDirectory();
    const filePath = path.join(DATA_DIR, FILE_NAME);

    const jsonArray = alerts.map((a) => this.serialize(a));

    await fs.writeFile(filePath, JSON.stringify(jsonArray, null, 2), 'utf-8');
  }

  /**
   * AlertエンティティをJSONに変換
   */
  private serialize(alert: Alert): AlertJSON {
    const plain = alert.toPlain();
    return {
      ...plain,
      details: {
        ...plain.details,
        paymentDate: plain.details.paymentDate?.toISOString() ?? null,
      },
      createdAt: plain.createdAt.toISOString(),
      resolvedAt: plain.resolvedAt?.toISOString() ?? null,
      actions: plain.actions.map((a) => ({
        ...a,
        action: a.action,
      })),
    };
  }

  /**
   * JSONをAlertエンティティに変換
   */
  private deserialize(json: AlertJSON): Alert {
    return Alert.fromPlain({
      id: json.id,
      type: json.type,
      level: json.level,
      title: json.title,
      message: json.message,
      details: {
        ...json.details,
        paymentDate: json.details.paymentDate
          ? new Date(json.details.paymentDate)
          : null,
      },
      status: json.status,
      createdAt: new Date(json.createdAt),
      resolvedAt: json.resolvedAt ? new Date(json.resolvedAt) : null,
      resolvedBy: json.resolvedBy,
      resolutionNote: json.resolutionNote,
      actions: json.actions.map((a) =>
        AlertAction.fromPlain({
          id: a.id,
          label: a.label,
          action: a.action as ActionType,
          isPrimary: a.isPrimary,
        }),
      ),
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
