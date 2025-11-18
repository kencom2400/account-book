import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ConnectionHistory } from '../../domain/entities/connection-history.entity';
import { IConnectionHistoryRepository } from '../../domain/repositories/connection-history.repository.interface';
import { ConnectionStatus } from '../../domain/value-objects/connection-status.enum';

interface ConnectionHistoryData {
  id: string;
  institutionId: string;
  institutionName: string;
  institutionType: 'bank' | 'credit-card' | 'securities';
  status: ConnectionStatus;
  checkedAt: string;
  responseTime: number;
  errorMessage?: string;
  errorCode?: string;
}

interface ConnectionHistoryFile {
  histories: ConnectionHistoryData[];
  lastUpdated: string;
}

/**
 * 接続履歴リポジトリのファイルシステム実装
 *
 * ⚠️ 競合状態対策について:
 * - メモリ内セマフォで単一プロセス内の同時書き込みを防止
 * - 複数プロセス/サーバー間の競合には対応不可
 * - 本番環境では必ずデータベース（SQLite/PostgreSQL等）に移行すること
 */
@Injectable()
export class FileSystemConnectionHistoryRepository
  implements IConnectionHistoryRepository
{
  private readonly logger = new Logger(
    FileSystemConnectionHistoryRepository.name,
  );
  private readonly dataDir: string;
  private readonly fileName = 'connection-history.json';
  private writeLock: Promise<void> = Promise.resolve();

  constructor() {
    // プロジェクトルートからの相対パス
    this.dataDir = join(process.cwd(), 'data', 'health');
  }

  /**
   * 書き込みロックを取得（単一プロセス内の排他制御）
   */
  private async acquireWriteLock(): Promise<() => void> {
    // 現在のロックが解放されるまで待機
    await this.writeLock;

    // 新しいロックを作成
    let resolver: () => void;
    this.writeLock = new Promise<void>((resolve) => {
      resolver = resolve;
    });

    // ロック解放関数を返す
    return () => resolver();
  }

  async save(history: ConnectionHistory): Promise<void> {
    const release = await this.acquireWriteLock();
    try {
      await this.ensureDataDirectory();

      const existingData = await this.loadData();
      existingData.histories.push(this.toData(history));
      existingData.lastUpdated = new Date().toISOString();

      await this.saveData(existingData);

      this.logger.debug(`接続履歴を保存しました: ${history.institutionId}`);
    } catch (error) {
      this.logger.error(
        `接続履歴の保存に失敗: ${history.institutionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    } finally {
      release();
    }
  }

  async saveMany(histories: ConnectionHistory[]): Promise<void> {
    const release = await this.acquireWriteLock();
    try {
      await this.ensureDataDirectory();

      const existingData = await this.loadData();
      const newHistories = histories.map((h) => this.toData(h));
      existingData.histories.push(...newHistories);
      existingData.lastUpdated = new Date().toISOString();

      await this.saveData(existingData);

      this.logger.debug(`${histories.length}件の接続履歴を保存しました`);
    } catch (error) {
      this.logger.error(
        `接続履歴の一括保存に失敗`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    } finally {
      release();
    }
  }

  async findLatestByInstitutionId(
    institutionId: string,
  ): Promise<ConnectionHistory | null> {
    try {
      const data = await this.loadData();

      // 指定された金融機関の履歴のみフィルタ
      const institutionHistories = data.histories
        .filter((h) => h.institutionId === institutionId)
        .sort(
          (a, b) =>
            new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime(),
        );

      if (institutionHistories.length === 0) {
        return null;
      }

      return this.fromData(institutionHistories[0]);
    } catch (error) {
      this.logger.error(
        `最新の接続履歴の取得に失敗: ${institutionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  async findAllLatest(): Promise<ConnectionHistory[]> {
    try {
      const data = await this.loadData();

      // 金融機関ごとにグループ化して最新のものだけ取得
      const latestByInstitution = new Map<string, ConnectionHistoryData>();

      for (const history of data.histories) {
        const existing = latestByInstitution.get(history.institutionId);

        if (
          !existing ||
          new Date(history.checkedAt) > new Date(existing.checkedAt)
        ) {
          latestByInstitution.set(history.institutionId, history);
        }
      }

      return Array.from(latestByInstitution.values()).map((h) =>
        this.fromData(h),
      );
    } catch (error) {
      this.logger.error(
        `全金融機関の最新接続履歴の取得に失敗`,
        error instanceof Error ? error.stack : String(error),
      );
      return [];
    }
  }

  async findByInstitutionIdAndDateRange(
    institutionId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ConnectionHistory[]> {
    try {
      const data = await this.loadData();

      const filtered = data.histories
        .filter((h) => {
          const checkedAt = new Date(h.checkedAt);
          return (
            h.institutionId === institutionId &&
            checkedAt >= startDate &&
            checkedAt <= endDate
          );
        })
        .sort(
          (a, b) =>
            new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime(),
        );

      return filtered.map((h) => this.fromData(h));
    } catch (error) {
      this.logger.error(
        `期間指定での接続履歴取得に失敗: ${institutionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return [];
    }
  }

  async findAll(limit?: number): Promise<ConnectionHistory[]> {
    try {
      const data = await this.loadData();

      const sorted = data.histories.sort(
        (a, b) =>
          new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime(),
      );

      const limited = limit ? sorted.slice(0, limit) : sorted;

      return limited.map((h) => this.fromData(h));
    } catch (error) {
      this.logger.error(
        `全接続履歴の取得に失敗`,
        error instanceof Error ? error.stack : String(error),
      );
      return [];
    }
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const release = await this.acquireWriteLock();
    try {
      const data = await this.loadData();
      const originalCount = data.histories.length;

      data.histories = data.histories.filter(
        (h) => new Date(h.checkedAt) >= date,
      );

      const deletedCount = originalCount - data.histories.length;

      if (deletedCount > 0) {
        data.lastUpdated = new Date().toISOString();
        await this.saveData(data);
        this.logger.log(`${deletedCount}件の古い接続履歴を削除しました`);
      }

      return deletedCount;
    } catch (error) {
      this.logger.error(
        `古い接続履歴の削除に失敗`,
        error instanceof Error ? error.stack : String(error),
      );
      return 0;
    } finally {
      release();
    }
  }

  /**
   * データディレクトリが存在することを保証
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      this.logger.error(
        `データディレクトリの作成に失敗`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * データファイルを読み込む
   */
  private async loadData(): Promise<ConnectionHistoryFile> {
    try {
      const filePath = join(this.dataDir, this.fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as ConnectionHistoryFile;
    } catch (error) {
      // ファイルが存在しない場合は空データを返す
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          histories: [],
          lastUpdated: new Date().toISOString(),
        };
      }
      throw error;
    }
  }

  /**
   * データファイルに保存
   */
  private async saveData(data: ConnectionHistoryFile): Promise<void> {
    const filePath = join(this.dataDir, this.fileName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * エンティティからデータ形式に変換
   */
  private toData(history: ConnectionHistory): ConnectionHistoryData {
    return {
      id: history.id,
      institutionId: history.institutionId,
      institutionName: history.institutionName,
      institutionType: history.institutionType,
      status: history.status,
      checkedAt: history.checkedAt.toISOString(),
      responseTime: history.responseTime,
      errorMessage: history.errorMessage,
      errorCode: history.errorCode,
    };
  }

  /**
   * データ形式からエンティティに変換
   */
  private fromData(data: ConnectionHistoryData): ConnectionHistory {
    return ConnectionHistory.restore(
      data.id,
      data.institutionId,
      data.institutionName,
      data.institutionType,
      data.status,
      new Date(data.checkedAt),
      data.responseTime,
      data.errorMessage,
      data.errorCode,
    );
  }
}
