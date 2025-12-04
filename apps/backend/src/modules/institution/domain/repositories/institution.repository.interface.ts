import { InstitutionEntity } from '../entities/institution.entity';
import { InstitutionType } from '@account-book/types';

/**
 * Institution Repositoryのインターフェース
 * ドメイン層で定義し、インフラ層で実装する
 */
export interface IInstitutionRepository {
  /**
   * IDで金融機関を取得
   */
  findById(id: string): Promise<InstitutionEntity | null>;

  /**
   * 複数のIDで金融機関を取得
   */
  findByIds(ids: string[]): Promise<InstitutionEntity[]>;

  /**
   * すべての金融機関を取得
   */
  findAll(): Promise<InstitutionEntity[]>;

  /**
   * タイプで金融機関を取得
   */
  findByType(type: InstitutionType): Promise<InstitutionEntity[]>;

  /**
   * 接続状態で金融機関を取得
   */
  findByConnectionStatus(isConnected: boolean): Promise<InstitutionEntity[]>;

  /**
   * 金融機関を保存
   */
  save(institution: InstitutionEntity): Promise<InstitutionEntity>;

  /**
   * 金融機関を更新
   */
  update(institution: InstitutionEntity): Promise<InstitutionEntity>;

  /**
   * 金融機関を削除
   * @param id 金融機関ID
   * @param manager トランザクション用のEntityManager（オプショナル）
   */
  delete(id: string, manager?: unknown): Promise<void>;

  /**
   * すべての金融機関を削除（テスト用）
   */
  deleteAll(): Promise<void>;
}
