import { IsBoolean, IsOptional } from 'class-validator';

/**
 * 金融機関削除リクエストDTO
 */
export class DeleteInstitutionDto {
  /**
   * 取引履歴を削除するかどうか
   * true: 取引履歴も削除
   * false: 取引履歴は保持（デフォルト）
   */
  @IsBoolean({ message: '取引履歴の削除フラグは真偽値で指定してください' })
  @IsOptional()
  deleteTransactions?: boolean;
}
