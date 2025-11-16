import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InstitutionType } from '@account-book/types';
import { Transform } from 'class-transformer';

/**
 * 金融機関一覧取得クエリDTO
 */
export class GetInstitutionsQueryDto {
  @IsOptional()
  @IsEnum(InstitutionType, {
    message: '金融機関タイプは有効な値を指定してください',
  })
  type?: InstitutionType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isConnected?: boolean;
}

