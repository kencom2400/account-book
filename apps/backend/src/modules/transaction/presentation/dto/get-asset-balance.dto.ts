import { IsDateString, IsOptional, Validate } from 'class-validator';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * 未来日チェック用のカスタムバリデーター
 *
 * 注意: このバリデーターは`new Date()`を使用しているため、
 * ユニットテストを作成する際には`jest.useFakeTimers()`を使用して
 * 時刻を固定化する必要があります。
 */
@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(asOfDate: string): boolean {
    if (!asOfDate) {
      return true; // 必須チェックは @IsOptional で行う
    }
    const date = new Date(asOfDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 今日の終わりまで許容
    return date <= today;
  }

  defaultMessage(): string {
    return 'asOfDate must not be a future date';
  }
}

/**
 * GetAssetBalanceDto
 * 資産残高取得リクエストDTO
 */
export class GetAssetBalanceDto {
  @IsDateString()
  @IsOptional()
  @Validate(IsNotFutureDateConstraint)
  asOfDate?: string;
}
