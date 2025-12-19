import {
  IsString,
  IsNotEmpty,
  Matches,
  IsOptional,
  Length,
  IsEnum,
  ValidateIf,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { AuthenticationType } from '@account-book/types';

/**
 * カスタムバリデーター: BRANCH_ACCOUNT認証の場合、branchCodeとaccountNumberが必須
 */
@ValidatorConstraint({ name: 'isValidBranchAccountCredentials', async: false })
export class IsValidBranchAccountCredentialsConstraint implements ValidatorConstraintInterface {
  private static readonly branchCodePattern = /^\d{3}$/;
  private static readonly accountNumberPattern = /^\d{7}$/;

  validate(value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as TestBankConnectionDto;
    if (dto.authenticationType !== AuthenticationType.BRANCH_ACCOUNT) {
      return true; // BRANCH_ACCOUNT以外の場合はスキップ
    }

    if (args.property === 'branchCode') {
      return (
        typeof value === 'string' &&
        IsValidBranchAccountCredentialsConstraint.branchCodePattern.test(value)
      );
    }

    if (args.property === 'accountNumber') {
      return (
        typeof value === 'string' &&
        IsValidBranchAccountCredentialsConstraint.accountNumberPattern.test(
          value,
        )
      );
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    if (args.property === 'branchCode') {
      return '支店コード＋口座番号認証の場合、支店コードは必須です';
    }
    if (args.property === 'accountNumber') {
      return '支店コード＋口座番号認証の場合、口座番号は必須です';
    }
    return 'バリデーションエラー';
  }
}

/**
 * カスタムバリデーター: USERID_PASSWORD認証の場合、userIdとpasswordが必須
 */
@ValidatorConstraint({ name: 'isValidUserIdPasswordCredentials', async: false })
export class IsValidUserIdPasswordCredentialsConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as TestBankConnectionDto;
    if (dto.authenticationType !== AuthenticationType.USERID_PASSWORD) {
      return true; // USERID_PASSWORD以外の場合はスキップ
    }

    if (args.property === 'userId') {
      return (
        typeof value === 'string' && value.length >= 1 && value.length <= 100
      );
    }

    if (args.property === 'password') {
      return (
        typeof value === 'string' && value.length >= 8 && value.length <= 100
      );
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    if (args.property === 'userId') {
      return 'ユーザID＋パスワード認証の場合、ユーザIDは必須です';
    }
    if (args.property === 'password') {
      return 'ユーザID＋パスワード認証の場合、パスワードは必須です';
    }
    return 'バリデーションエラー';
  }
}

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
  @ValidateIf((o) => o.authenticationType === AuthenticationType.BRANCH_ACCOUNT)
  @Validate(IsValidBranchAccountCredentialsConstraint)
  @IsNotEmpty({ message: '支店コードは必須です' })
  @IsString({ message: '支店コードは文字列で指定してください' })
  @Matches(/^\d{3}$/, {
    message: '支店コードは3桁の数字で指定してください',
  })
  branchCode?: string;

  @ValidateIf((o) => o.authenticationType === AuthenticationType.BRANCH_ACCOUNT)
  @Validate(IsValidBranchAccountCredentialsConstraint)
  @IsNotEmpty({ message: '口座番号は必須です' })
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
  @ValidateIf(
    (o) => o.authenticationType === AuthenticationType.USERID_PASSWORD,
  )
  @Validate(IsValidUserIdPasswordCredentialsConstraint)
  @IsNotEmpty({ message: 'ユーザIDは必須です' })
  @IsString({ message: 'ユーザIDは文字列で指定してください' })
  @Length(1, 100, {
    message: 'ユーザIDは1文字以上100文字以下で指定してください',
  })
  userId?: string;

  @ValidateIf(
    (o) => o.authenticationType === AuthenticationType.USERID_PASSWORD,
  )
  @Validate(IsValidUserIdPasswordCredentialsConstraint)
  @IsNotEmpty({ message: 'パスワードは必須です' })
  @IsString({ message: 'パスワードは文字列で指定してください' })
  @Length(8, 100, {
    message: 'パスワードは8文字以上100文字以下で指定してください',
  })
  password?: string;
}
