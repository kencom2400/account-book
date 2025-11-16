import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import {
  PaymentVO,
  PaymentStatus,
} from '../../domain/value-objects/payment.vo';
import {
  ICreditCardRepository,
  IPaymentRepository,
  ICreditCardTransactionRepository,
} from '../../domain/repositories/credit-card.repository.interface';
import { ICreditCardAPIClient } from '../../infrastructure/adapters/credit-card-api.adapter.interface';
import { ICryptoService } from '../../../institution/domain/services/crypto.service.interface';

export interface FetchPaymentInfoInput {
  creditCardId: string;
  billingMonth?: string; // YYYY-MM形式、指定がない場合は当月
  forceRefresh?: boolean;
}

/**
 * FetchPaymentInfoUseCase
 * クレジットカードの支払い情報を取得する
 */
@Injectable()
export class FetchPaymentInfoUseCase {
  private readonly logger = new Logger(FetchPaymentInfoUseCase.name);

  constructor(
    private readonly creditCardRepository: ICreditCardRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly transactionRepository: ICreditCardTransactionRepository,
    private readonly creditCardAPIClient: ICreditCardAPIClient,
    private readonly cryptoService: ICryptoService,
  ) {}

  async execute(input: FetchPaymentInfoInput): Promise<PaymentVO> {
    // 1. クレジットカードが存在するか確認
    const creditCard = await this.creditCardRepository.findById(
      input.creditCardId,
    );

    if (!creditCard) {
      throw new NotFoundException(
        `Credit card not found with ID: ${input.creditCardId}`,
      );
    }

    // 2. 請求月の設定（デフォルトは当月）
    const billingMonth = input.billingMonth || this.getCurrentMonth();

    // 3. 強制リフレッシュまたは接続済みの場合はAPIから取得
    if (input.forceRefresh || creditCard.isConnected) {
      try {
        await this.refreshPaymentInfoFromAPI(creditCard, billingMonth);

        // 最終同期日時を更新
        const updatedCard = creditCard.updateLastSyncedAt(new Date());
        await this.creditCardRepository.save(updatedCard);
      } catch (error) {
        this.logger.error(
          `Failed to refresh payment info from API: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined,
        );
        // API取得失敗時はローカルのデータを返す
      }
    }

    // 4. ローカルストレージから支払い情報を取得
    let payment = await this.paymentRepository.findByCreditCardIdAndMonth(
      input.creditCardId,
      billingMonth,
    );

    // 5. 支払い情報がない場合は計算して作成
    if (!payment) {
      payment = await this.calculatePaymentInfo(creditCard, billingMonth);
      await this.paymentRepository.save(input.creditCardId, payment);
    }

    return payment;
  }

  private async refreshPaymentInfoFromAPI(
    creditCard: CreditCardEntity,
    billingMonth: string,
  ): Promise<void> {
    // 認証情報を復号化
    const decryptedData = await this.cryptoService.decrypt(
      creditCard.credentials,
    );

    let credentials;
    try {
      credentials = JSON.parse(decryptedData);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to parse credentials for card ${creditCard.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // APIから支払い情報を取得
    const apiPaymentInfo =
      await this.creditCardAPIClient.getPaymentInfo(credentials);

    // PaymentVOに変換して保存
    const payment = this.creditCardAPIClient.mapToPaymentVO(
      billingMonth,
      apiPaymentInfo,
    );

    await this.paymentRepository.save(creditCard.id, payment);
  }

  private async calculatePaymentInfo(
    creditCard: CreditCardEntity,
    billingMonth: string,
  ): Promise<PaymentVO> {
    // 請求月の取引を取得
    const [year, month] = billingMonth.split('-').map(Number);
    const transactions = await this.transactionRepository.findByMonth(
      creditCard.id,
      year,
      month,
    );

    // 合計金額を計算
    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    // 支払済み金額を計算
    const paidAmount = transactions
      .filter((tx) => tx.isPaid)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const remainingAmount = totalAmount - paidAmount;

    // 締め日と支払期限を計算
    const closingDate = new Date(year, month - 1, creditCard.closingDay);
    const paymentDueDate = new Date(year, month, creditCard.paymentDay);

    return new PaymentVO(
      billingMonth,
      closingDate,
      paymentDueDate,
      totalAmount,
      paidAmount,
      remainingAmount,
      remainingAmount === 0 ? PaymentStatus.PAID : PaymentStatus.UNPAID,
    );
  }

  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
