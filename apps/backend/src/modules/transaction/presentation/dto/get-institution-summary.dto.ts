import {
  IsDateString,
  IsNotEmpty,
  IsArray,
  IsString,
  IsOptional,
  IsBoolean,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * カスタムバリデーター: endDateがstartDate以降であることを確認
 */
@ValidatorConstraint({ name: 'isEndDateAfterStartDate', async: false })
export class IsEndDateAfterStartDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments): boolean {
    const object = args.object as GetInstitutionSummaryDto;
    const startDate = object.startDate;
    if (!startDate || !endDate) {
      return true; // 必須チェックは @IsNotEmpty で行う
    }
    return new Date(startDate) <= new Date(endDate);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'endDate must be after or equal to startDate';
  }
}

/**
 * GetInstitutionSummaryDto
 * 金融機関別集計取得リクエストDTO
 */
export class GetInstitutionSummaryDto {
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  @Validate(IsEndDateAfterStartDateConstraint)
  endDate!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  institutionIds?: string[];

  @IsBoolean()
  @IsOptional()
  includeTransactions?: boolean;
}
