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
import { InstitutionType } from '@account-book/types';

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

    // 必須フィールドのチェック
    if (
      typeof credentials.bankCode !== 'string' ||
      typeof credentials.branchCode !== 'string' ||
      typeof credentials.accountNumber !== 'string'
    ) {
      return false;
    }

    // フォーマットのチェック
    return (
      IsValidBankCredentialsConstraint.bankCodePattern.test(
        credentials.bankCode,
      ) &&
      IsValidBankCredentialsConstraint.branchCodePattern.test(
        credentials.branchCode,
      ) &&
      IsValidBankCredentialsConstraint.accountNumberPattern.test(
        credentials.accountNumber,
      )
    );
  }

  defaultMessage(_args: ValidationArguments): string {
    return '銀行タイプの場合、認証情報にはbankCode（4桁の数字）、branchCode（3桁の数字）、accountNumber（7桁の数字）が必要です';
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
