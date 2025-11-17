import { CategoryType, PaymentStatus } from '@account-book/types';
import { CreditCardEntity } from '../../src/modules/credit-card/domain/entities/credit-card.entity';
import { CreditCardTransactionEntity } from '../../src/modules/credit-card/domain/entities/credit-card-transaction.entity';
import { PaymentVO } from '../../src/modules/credit-card/domain/value-objects/payment.vo';
import { EncryptedCredentials } from '../../src/modules/institution/domain/value-objects/encrypted-credentials.vo';

export function createTestEncryptedCredentials(
  overrides?: Partial<EncryptedCredentials>,
): EncryptedCredentials {
  return new EncryptedCredentials(
    overrides?.encrypted || 'encrypted_test_data',
    overrides?.iv || 'test_iv',
    overrides?.authTag || 'test_auth_tag',
    overrides?.algorithm || 'aes-256-gcm',
    overrides?.version || '1',
  );
}

export function createTestCreditCard(
  overrides?: Partial<{
    id: string;
    cardName: string;
    cardNumber: string;
    cardHolderName: string;
    expiryDate: Date;
    credentials: EncryptedCredentials;
    isConnected: boolean;
    lastSyncedAt: Date | null;
    paymentDay: number;
    closingDay: number;
    creditLimit: number;
    currentBalance: number;
    issuer: string;
    createdAt: Date;
    updatedAt: Date;
  }>,
): CreditCardEntity {
  return new CreditCardEntity(
    overrides?.id || 'cc_test_123',
    overrides?.cardName || 'テストカード',
    overrides?.cardNumber || '1234',
    overrides?.cardHolderName || '山田太郎',
    overrides?.expiryDate || new Date('2030-12-31'),
    overrides?.credentials || createTestEncryptedCredentials(),
    overrides?.isConnected ?? true,
    overrides?.lastSyncedAt !== undefined ? overrides.lastSyncedAt : new Date(),
    overrides?.paymentDay ?? 27,
    overrides?.closingDay ?? 15,
    overrides?.creditLimit ?? 500000,
    overrides?.currentBalance ?? 125000,
    overrides?.issuer || 'テスト銀行',
    overrides?.createdAt || new Date(),
    overrides?.updatedAt || new Date(),
  );
}

export function createTestCreditCardTransaction(
  overrides?: Partial<{
    id: string;
    creditCardId: string;
    transactionDate: Date;
    postingDate: Date;
    amount: number;
    merchantName: string;
    merchantCategory: string;
    description: string;
    category: CategoryType;
    isInstallment: boolean;
    installmentCount: number | null;
    installmentNumber: number | null;
    isPaid: boolean;
    paymentScheduledDate: Date | null;
    paidDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>,
): CreditCardTransactionEntity {
  return new CreditCardTransactionEntity(
    overrides?.id || 'tx_test_123',
    overrides?.creditCardId || 'cc_test_123',
    overrides?.transactionDate || new Date('2025-01-15'),
    overrides?.postingDate || new Date('2025-01-16'),
    overrides?.amount || 5000,
    overrides?.merchantName || 'テストストア',
    overrides?.merchantCategory || 'スーパー',
    overrides?.description || 'カード利用',
    overrides?.category || CategoryType.EXPENSE,
    overrides?.isInstallment ?? false,
    overrides?.installmentCount !== undefined
      ? overrides.installmentCount
      : null,
    overrides?.installmentNumber !== undefined
      ? overrides.installmentNumber
      : null,
    overrides?.isPaid ?? false,
    overrides?.paymentScheduledDate !== undefined
      ? overrides.paymentScheduledDate
      : null,
    overrides?.paidDate !== undefined ? overrides.paidDate : null,
    overrides?.createdAt || new Date(),
    overrides?.updatedAt || new Date(),
  );
}

export function createTestPayment(
  overrides?: Partial<{
    billingMonth: string;
    closingDate: Date;
    paymentDueDate: Date;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: PaymentStatus;
    paidDate: Date | null;
  }>,
): PaymentVO {
  const totalAmount = overrides?.totalAmount || 125000;
  const paidAmount = overrides?.paidAmount || 0;
  const remainingAmount =
    overrides?.remainingAmount || totalAmount - paidAmount;

  return new PaymentVO(
    overrides?.billingMonth || '2025-01',
    overrides?.closingDate || new Date('2025-01-15'),
    overrides?.paymentDueDate || new Date('2025-02-10'),
    totalAmount,
    paidAmount,
    remainingAmount,
    overrides?.status || PaymentStatus.UNPAID,
    overrides?.paidDate !== undefined ? overrides.paidDate : null,
  );
}
