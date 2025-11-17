import {
  IsString,
  IsNotEmpty,
  Matches,
  IsOptional,
  Length,
} from 'class-validator';

/**
 * 銀行接続テストリクエストDTO
 */
export class TestBankConnectionDto {
  @IsString({ message: '銀行コードは文字列で指定してください' })
  @IsNotEmpty({ message: '銀行コードは必須です' })
  @Matches(/^\d{4}$/, {
    message: '銀行コードは4桁の数字で指定してください',
  })
  bankCode: string;

  @IsString({ message: '支店コードは文字列で指定してください' })
  @IsNotEmpty({ message: '支店コードは必須です' })
  @Matches(/^\d{3}$/, {
    message: '支店コードは3桁の数字で指定してください',
  })
  branchCode: string;

  @IsString({ message: '口座番号は文字列で指定してください' })
  @IsNotEmpty({ message: '口座番号は必須です' })
  @Matches(/^\d{7}$/, {
    message: '口座番号は7桁の数字で指定してください',
  })
  accountNumber: string;

  @IsOptional()
  @IsString({ message: 'APIキーは文字列で指定してください' })
  @Length(1, 255, {
    message: 'APIキーは1文字以上255文字以下で指定してください',
  })
  apiKey?: string;

  @IsOptional()
  @IsString({ message: 'APIシークレットは文字列で指定してください' })
  @Length(1, 255, {
    message: 'APIシークレットは1文字以上255文字以下で指定してください',
  })
  apiSecret?: string;
}
