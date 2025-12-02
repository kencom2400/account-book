import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { CategoryType } from '@account-book/types';

/**
 * 費目追加リクエストDTO
 */
export class CreateCategoryDto {
  @IsString({ message: '費目名は文字列で指定してください' })
  @Length(1, 50, { message: '費目名は1文字以上50文字以下で指定してください' })
  name!: string;

  @IsEnum(CategoryType, { message: '有効なカテゴリタイプを指定してください' })
  type!: CategoryType;

  @IsOptional()
  @IsUUID('4', { message: '親費目IDはUUID形式で指定してください' })
  parentId?: string | null;

  @IsOptional()
  @IsString({ message: 'アイコンは文字列で指定してください' })
  @MaxLength(10, { message: 'アイコンは10文字以下で指定してください' })
  icon?: string | null;

  @IsOptional()
  @IsString({ message: 'カラーコードは文字列で指定してください' })
  @Matches(/^#([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{8})$/i, {
    message:
      'カラーコードは#RGB、#RRGGBB、または#RRGGBBAA形式で指定してください',
  })
  color?: string | null;
}
