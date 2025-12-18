import {
  IsString,
  IsNotEmpty,
  Matches,
  IsOptional,
  Length,
  IsEnum,
} from 'class-validator';
import { AuthenticationType } from '@account-book/types';

/**
 * 銀行接続テストリクエストDTO
 */
export class TestBankConnectionDto {
  @IsString({ message: '銀行コードは文字列で指定してください' })
  @IsNotEmpty({ message: '銀行コードは必須です' })
  @Matches(/^\d{4}$/, {
    message: '銀行コードは4桁の数字で指定してください',
  })
  bankCode!: string;

  @IsEnum(AuthenticationType, {
    message: '認証タイプは有効な値を指定してください',
  })
  @IsNotEmpty({ message: '認証タイプは必須です' })
  authenticationType!: AuthenticationType;

  // 支店コード＋口座番号認証の場合
  @IsOptional()
  @IsString({ message: '支店コードは文字列で指定してください' })
  @Matches(/^\d{3}$/, {
    message: '支店コードは3桁の数字で指定してください',
  })
  branchCode?: string;

  @IsOptional()
  @IsString({ message: '口座番号は文字列で指定してください' })
  @Matches(/^\d{7}$/, {
    message: '口座番号は7桁の数字で指定してください',
  })
  accountNumber?: string;

  @IsOptional()
  @IsString({ message: 'APIキーは文字列で指定してください' })
  @Length(1, 500, {
    message: 'APIキーは1文字以上500文字以下で指定してください',
  })
  apiKey?: string;

  @IsOptional()
  @IsString({ message: 'APIシークレットは文字列で指定してください' })
  @Length(1, 500, {
    message: 'APIシークレットは1文字以上500文字以下で指定してください',
  })
  apiSecret?: string;

  // ユーザID＋パスワード認証の場合
  @IsOptional()
  @IsString({ message: 'ユーザIDは文字列で指定してください' })
  @Length(1, 100, {
    message: 'ユーザIDは1文字以上100文字以下で指定してください',
  })
  userId?: string;

  @IsOptional()
  @IsString({ message: 'パスワードは文字列で指定してください' })
  @Length(8, 100, {
    message: 'パスワードは8文字以上100文字以下で指定してください',
  })
  password?: string;
}
