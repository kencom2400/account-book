import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';

/**
 * 支払いステータス更新リクエストDTO
 */
export class UpdatePaymentStatusRequestDto {
  @IsEnum(PaymentStatus)
  newStatus!: PaymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
