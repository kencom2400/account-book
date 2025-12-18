import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';

/**
 * クレジットカード接続テストリクエストDTO
 */
export class TestCreditCardConnectionDto {
  @IsString({ message: 'カード番号は文字列で指定してください' })
  @IsNotEmpty({ message: 'カード番号は必須です' })
  @Matches(/^\d{16}$/, {
    message: 'カード番号は16桁の数字で指定してください',
  })
  cardNumber!: string;

  @IsString({ message: 'カード名義は文字列で指定してください' })
  @IsNotEmpty({ message: 'カード名義は必須です' })
  @Length(1, 100, {
    message: 'カード名義は1文字以上100文字以下で指定してください',
  })
  cardHolderName!: string;

  @IsDateString(
    {},
    { message: '有効期限は有効な日付形式（YYYY-MM-DD）で指定してください' },
  )
  @IsNotEmpty({ message: '有効期限は必須です' })
  expiryDate!: string;

  @IsString({ message: 'ログインIDは文字列で指定してください' })
  @IsNotEmpty({ message: 'ログインIDは必須です' })
  @Length(1, 255, {
    message: 'ログインIDは1文字以上255文字以下で指定してください',
  })
  username!: string;

  @IsString({ message: 'パスワードは文字列で指定してください' })
  @IsNotEmpty({ message: 'パスワードは必須です' })
  @Length(8, 100, {
    message: 'パスワードは8文字以上100文字以下で指定してください',
  })
  password!: string;

  @IsString({ message: '発行会社は文字列で指定してください' })
  @IsNotEmpty({ message: '発行会社は必須です' })
  @Length(1, 100, {
    message: '発行会社は1文字以上100文字以下で指定してください',
  })
  issuer!: string;

  @IsOptional()
  @IsString({ message: 'API認証キーは文字列で指定してください' })
  @Length(1, 255, {
    message: 'API認証キーは1文字以上255文字以下で指定してください',
  })
  apiKey?: string;
}
