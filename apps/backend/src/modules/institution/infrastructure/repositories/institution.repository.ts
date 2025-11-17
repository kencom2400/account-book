import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { InstitutionEntity } from '../../domain/entities/institution.entity';
import { AccountEntity } from '../../domain/entities/account.entity';
import { EncryptedCredentials } from '../../domain/value-objects/encrypted-credentials.vo';
import { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import { InstitutionType } from '@account-book/types';

/**
 * JSONファイルに保存する金融機関データの型定義
 */
interface InstitutionJSON {
  id: string;
  name: string;
  type: InstitutionType;
  credentials: {
    encrypted: string;
    iv: string;
    authTag: string;
    algorithm: string;
    version: string;
  };
  isConnected: boolean;
  lastSyncedAt: string | null;
  accounts: Array<{
    id: string;
    institutionId: string;
    accountNumber: string;
    accountName: string;
    balance: number;
    currency: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Institution Repository Implementation
 * JSONファイルでの永続化を実装
 */
@Injectable()
export class InstitutionRepository implements IInstitutionRepository {
  private readonly dataDir: string;
  private readonly fileName = 'institutions.json';

  constructor(private configService: ConfigService) {
    this.dataDir = path.join(process.cwd(), 'data', 'institutions');
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
   * データファイルのパスを取得
   */
  private getFilePath(): string {
    return path.join(this.dataDir, this.fileName);
  }

  /**
   * データファイルを読み込み
   */
  private async loadData(): Promise<InstitutionEntity[]> {
    await this.ensureDataDirectory();
    const filePath = this.getFilePath();

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as unknown;
      return Array.isArray(data)
        ? data.map((item) => this.toEntity(item as InstitutionJSON))
        : [];
    } catch {
      // ファイルが存在しない場合は空配列を返す
      return [];
    }
  }

  /**
   * データファイルに保存
   */
  private async saveData(institutions: InstitutionEntity[]): Promise<void> {
    await this.ensureDataDirectory();
    const filePath = this.getFilePath();
    const data = institutions.map((i) => this.toJSON(i));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * IDで金融機関を取得
   */
  async findById(id: string): Promise<InstitutionEntity | null> {
    const institutions = await this.loadData();
    return institutions.find((i) => i.id === id) || null;
  }

  /**
   * すべての金融機関を取得
   */
  async findAll(): Promise<InstitutionEntity[]> {
    return await this.loadData();
  }

  /**
   * タイプで金融機関を取得
   */
  async findByType(type: InstitutionType): Promise<InstitutionEntity[]> {
    const institutions = await this.loadData();
    return institutions.filter((i) => i.type === type);
  }

  /**
   * 接続状態で金融機関を取得
   */
  async findByConnectionStatus(
    isConnected: boolean,
  ): Promise<InstitutionEntity[]> {
    const institutions = await this.loadData();
    return institutions.filter((i) => i.isConnected === isConnected);
  }

  /**
   * 金融機関を保存
   */
  async save(institution: InstitutionEntity): Promise<InstitutionEntity> {
    const institutions = await this.loadData();
    institutions.push(institution);
    await this.saveData(institutions);
    return institution;
  }

  /**
   * 金融機関を更新
   */
  async update(institution: InstitutionEntity): Promise<InstitutionEntity> {
    const institutions = await this.loadData();
    const updatedInstitutions = institutions.map((i) =>
      i.id === institution.id ? institution : i,
    );
    await this.saveData(updatedInstitutions);
    return institution;
  }

  /**
   * 金融機関を削除
   */
  async delete(id: string): Promise<void> {
    const institutions = await this.loadData();
    const filteredInstitutions = institutions.filter((i) => i.id !== id);
    await this.saveData(filteredInstitutions);
  }

  /**
   * すべての金融機関を削除（テスト用）
   */
  async deleteAll(): Promise<void> {
    await this.saveData([]);
  }

  /**
   * エンティティをJSONオブジェクトに変換
   */
  private toJSON(entity: InstitutionEntity): InstitutionJSON {
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      credentials: entity.credentials.toJSON(),
      isConnected: entity.isConnected,
      lastSyncedAt: entity.lastSyncedAt?.toISOString() || null,
      accounts: entity.accounts.map((a) => a.toJSON()),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * JSONオブジェクトをエンティティに変換
   */
  private toEntity(data: InstitutionJSON): InstitutionEntity {
    const credentials = new EncryptedCredentials(
      data.credentials.encrypted,
      data.credentials.iv,
      data.credentials.authTag,
      data.credentials.algorithm,
      data.credentials.version,
    );

    const accounts = (data.accounts || []).map(
      (a) =>
        new AccountEntity(
          a.id,
          a.institutionId,
          a.accountNumber,
          a.accountName,
          a.balance,
          a.currency,
        ),
    );

    return new InstitutionEntity(
      data.id,
      data.name,
      data.type,
      credentials,
      data.isConnected,
      data.lastSyncedAt ? new Date(data.lastSyncedAt) : null,
      accounts,
      new Date(data.createdAt),
      new Date(data.updatedAt),
    );
  }
}
