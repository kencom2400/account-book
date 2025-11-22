import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import {
  NotificationEntity,
  NotificationStatus,
} from '../../domain/entities/notification.entity';

/**
 * 通知リポジトリ実装（JSON形式）
 * FR-005: 通知機能のデータ永続化
 */
@Injectable()
export class NotificationRepository implements INotificationRepository {
  private readonly logger = new Logger(NotificationRepository.name);
  private readonly dataFilePath: string;

  constructor() {
    // プロジェクトルートからの相対パス
    const projectRoot: string = path.resolve(__dirname, '../../../../../../');
    this.dataFilePath = path.join(
      projectRoot,
      'data',
      'notifications',
      'notifications.json',
    );
  }

  /**
   * 通知を保存
   */
  async save(notification: NotificationEntity): Promise<NotificationEntity> {
    const notifications: NotificationEntity[] = await this.findAll();

    // 既存の通知を更新、なければ追加
    const existingIndex: number = notifications.findIndex(
      (n: NotificationEntity) => n.id === notification.id,
    );

    if (existingIndex >= 0) {
      notifications[existingIndex] = notification;
    } else {
      notifications.push(notification);
    }

    await this.writeToFile(notifications);
    return notification;
  }

  /**
   * IDで通知を取得
   */
  async findById(id: string): Promise<NotificationEntity | null> {
    const notifications: NotificationEntity[] = await this.findAll();
    const notification: NotificationEntity | undefined = notifications.find(
      (n: NotificationEntity) => n.id === id,
    );
    return notification ?? null;
  }

  /**
   * すべての通知を取得
   */
  async findAll(): Promise<NotificationEntity[]> {
    try {
      // ディレクトリが存在しない場合は作成
      await this.ensureDirectoryExists();

      // ファイルが存在しない場合は空配列を返す
      try {
        await fs.access(this.dataFilePath);
      } catch {
        return [];
      }

      const fileContent: string = await fs.readFile(this.dataFilePath, 'utf-8');

      if (!fileContent.trim()) {
        return [];
      }

      interface NotificationJson {
        id: string;
        institutionId: string;
        institutionName: string;
        message: string;
        status: NotificationStatus;
        createdAt: string;
        updatedAt: string;
      }

      const parsedData: unknown = JSON.parse(fileContent);

      if (!Array.isArray(parsedData)) {
        this.logger.error('通知データの形式が不正です');
        return [];
      }

      const data: NotificationJson[] = parsedData as NotificationJson[];

      return data.map(
        (item: NotificationJson) =>
          new NotificationEntity(
            item.id,
            item.institutionId,
            item.institutionName,
            item.message,
            item.status,
            new Date(item.createdAt),
            new Date(item.updatedAt),
          ),
      );
    } catch (error) {
      this.logger.error('通知の読み込みに失敗しました', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * 通知を削除
   */
  async delete(id: string): Promise<void> {
    const notifications: NotificationEntity[] = await this.findAll();
    const filtered: NotificationEntity[] = notifications.filter(
      (n: NotificationEntity) => n.id !== id,
    );

    await this.writeToFile(filtered);
  }

  /**
   * 複数の通知を一括削除
   */
  async deleteMany(ids: string[]): Promise<void> {
    const notifications: NotificationEntity[] = await this.findAll();
    const idsSet: Set<string> = new Set(ids);
    const filtered: NotificationEntity[] = notifications.filter(
      (n: NotificationEntity) => !idsSet.has(n.id),
    );

    await this.writeToFile(filtered);
  }

  /**
   * ファイルにデータを書き込む
   */
  private async writeToFile(
    notifications: NotificationEntity[],
  ): Promise<void> {
    try {
      await this.ensureDirectoryExists();

      interface NotificationJson {
        id: string;
        institutionId: string;
        institutionName: string;
        message: string;
        status: NotificationStatus;
        createdAt: string;
        updatedAt: string;
      }

      const data: NotificationJson[] = notifications.map(
        (n: NotificationEntity): NotificationJson => ({
          id: n.id,
          institutionId: n.institutionId,
          institutionName: n.institutionName,
          message: n.message,
          status: n.status,
          createdAt: n.createdAt.toISOString(),
          updatedAt: n.updatedAt.toISOString(),
        }),
      );

      await fs.writeFile(
        this.dataFilePath,
        JSON.stringify(data, null, 2),
        'utf-8',
      );
    } catch (error) {
      this.logger.error('通知の書き込みに失敗しました', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * ディレクトリが存在することを保証
   */
  private async ensureDirectoryExists(): Promise<void> {
    const directory: string = path.dirname(this.dataFilePath);
    try {
      await fs.access(directory);
    } catch {
      await fs.mkdir(directory, { recursive: true });
    }
  }
}
