import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsObject,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { InstitutionType, AuthenticationType } from '@account-book/types';

/**
 * カスタムバリデーター: 銀行タイプの場合、credentialsに必要なフィールドをチェック
 */
@ValidatorConstraint({ name: 'isValidBankCredentials', async: false })
export class IsValidBankCredentialsConstraint implements ValidatorConstraintInterface {
  private static readonly bankCodePattern = /^\d{4}$/;
  private static readonly branchCodePattern = /^\d{3}$/;
  private static readonly accountNumberPattern = /^\d{7}$/;

  validate(
    credentials: Record<string, unknown> | undefined,
    args: ValidationArguments,
  ): boolean {
    // credentialsがundefinedまたはnullの場合は、@IsNotEmptyでチェックされるため、ここではtrueを返す
    if (!credentials || typeof credentials !== 'object') {
      return true;
    }

    const object = args.object as CreateInstitutionDto;
    if (object.type !== InstitutionType.BANK) {
      return true; // 銀行タイプ以外はスキップ
    }

    const { bankCode, authenticationType } = credentials;

    // 銀行コードのチェック
    if (
      typeof bankCode !== 'string' ||
      !IsValidBankCredentialsConstraint.bankCodePattern.test(bankCode)
    ) {
      return false;
    }

    // 認証タイプのチェック
    if (typeof authenticationType !== 'string') {
      return false;
    }

    const authType = authenticationType as AuthenticationType;
    if (
      authType !== AuthenticationType.BRANCH_ACCOUNT &&
      authType !== AuthenticationType.USERID_PASSWORD
    ) {
      return false;
    }

    // 認証方式に応じたバリデーション
    if (authType === AuthenticationType.BRANCH_ACCOUNT) {
      const { branchCode, accountNumber } = credentials;
      return (
        typeof branchCode === 'string' &&
        IsValidBankCredentialsConstraint.branchCodePattern.test(branchCode) &&
        typeof accountNumber === 'string' &&
        IsValidBankCredentialsConstraint.accountNumberPattern.test(
          accountNumber,
        )
      );
    } else if (authType === AuthenticationType.USERID_PASSWORD) {
      const { userId, password } = credentials;
      return (
        typeof userId === 'string' &&
        userId.length >= 1 &&
        userId.length <= 100 &&
        typeof password === 'string' &&
        password.length >= 8 &&
        password.length <= 100
      );
    }

    return false;
  }

  defaultMessage(_args: ValidationArguments): string {
    return '認証方式に応じた必須フィールドが不足しています。支店コード＋口座番号認証の場合はbranchCodeとaccountNumber、ユーザID＋パスワード認証の場合はuserIdとpasswordが必要です';
  }
}

/**
 * 金融機関登録リクエストDTO
 */
export class CreateInstitutionDto {
  @IsString({ message: '金融機関名は文字列で指定してください' })
  @IsNotEmpty({ message: '金融機関名は必須です' })
  name!: string;

  @IsEnum(InstitutionType, {
    message: '金融機関タイプは有効な値を指定してください',
  })
  type!: InstitutionType;

  @IsObject({ message: '認証情報はオブジェクト形式で指定してください' })
  @IsNotEmpty({ message: '認証情報は必須です' })
  @Validate(IsValidBankCredentialsConstraint)
  credentials!: Record<string, unknown>;
}
