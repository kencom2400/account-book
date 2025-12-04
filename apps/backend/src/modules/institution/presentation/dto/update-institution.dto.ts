import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { InstitutionType } from '@account-book/types';

/**
 * 金融機関更新リクエストDTO
 */
export class UpdateInstitutionDto {
  @IsString({ message: '金融機関名は文字列で指定してください' })
  @IsOptional()
  name?: string;

  @IsEnum(InstitutionType, {
    message: '金融機関タイプは有効な値を指定してください',
  })
  @IsOptional()
  type?: InstitutionType;

  @IsObject({ message: '認証情報はオブジェクト形式で指定してください' })
  @IsOptional()
  credentials?: Record<string, unknown>;
}
