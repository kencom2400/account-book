import { IsString, IsNotEmpty, IsEnum, IsObject } from 'class-validator';
import { InstitutionType } from '@account-book/types';

/**
 * 金融機関登録リクエストDTO
 */
export class CreateInstitutionDto {
  @IsString({ message: '金融機関名は文字列で指定してください' })
  @IsNotEmpty({ message: '金融機関名は必須です' })
  name: string;

  @IsEnum(InstitutionType, {
    message: '金融機関タイプは有効な値を指定してください',
  })
  type: InstitutionType;

  @IsObject({ message: '認証情報はオブジェクト形式で指定してください' })
  @IsNotEmpty({ message: '認証情報は必須です' })
  credentials: Record<string, any>;
}
