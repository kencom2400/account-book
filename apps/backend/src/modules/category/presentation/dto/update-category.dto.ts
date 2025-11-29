import {
  IsString,
  IsOptional,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * 費目更新リクエストDTO
 */
export class UpdateCategoryDto {
  @IsString({ message: '費目名は文字列で指定してください' })
  @Length(1, 50, { message: '費目名は1文字以上50文字以下で指定してください' })
  name!: string;

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
