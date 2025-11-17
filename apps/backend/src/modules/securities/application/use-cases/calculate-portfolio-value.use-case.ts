import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { Portfolio } from '../../domain/value-objects/portfolio.vo';
import type {
  ISecuritiesAccountRepository,
  IHoldingRepository,
} from '../../domain/repositories/securities.repository.interface';
import {
  SECURITIES_ACCOUNT_REPOSITORY,
  HOLDING_REPOSITORY,
} from '../../securities.tokens';

export interface CalculatePortfolioValueInput {
  accountId: string;
}

export interface PortfolioValue {
  accountId: string;
  accountName: string;
  portfolio: ReturnType<Portfolio['toJSON']>;
  cashBalance: number;
  totalAssets: number;
}

/**
 * CalculatePortfolioValueUseCase
 * ポートフォリオの評価額を計算する
 */
@Injectable()
export class CalculatePortfolioValueUseCase {
  private readonly logger = new Logger(CalculatePortfolioValueUseCase.name);

  constructor(
    @Inject(SECURITIES_ACCOUNT_REPOSITORY)
    private readonly accountRepository: ISecuritiesAccountRepository,
    @Inject(HOLDING_REPOSITORY)
    private readonly holdingRepository: IHoldingRepository,
  ) {}

  async execute(input: CalculatePortfolioValueInput): Promise<PortfolioValue> {
    // 1. 証券口座の存在確認
    const account = await this.accountRepository.findById(input.accountId);
    if (!account) {
      throw new NotFoundException(
        `Securities account not found: ${input.accountId}`,
      );
    }

    // 2. 保有銘柄を取得
    const holdings = await this.holdingRepository.findByAccountId(
      input.accountId,
    );

    // 3. Portfolioを作成
    const portfolio = new Portfolio(holdings);

    // 4. 総資産額を計算（評価額合計 + 現金残高）
    const totalAssets =
      portfolio.getTotalEvaluationAmount() + account.cashBalance;

    // 5. 口座情報を更新（評価額が変わっている場合）
    const currentEvaluationAmount = portfolio.getTotalEvaluationAmount();
    if (currentEvaluationAmount !== account.totalEvaluationAmount) {
      const updatedAccount = account.updateBalances(
        currentEvaluationAmount,
        account.cashBalance,
      );
      await this.accountRepository.update(updatedAccount);
      this.logger.log(
        `Updated account evaluation amount: ${currentEvaluationAmount}`,
      );
    }

    return {
      accountId: account.id,
      accountName: account.securitiesCompanyName,
      portfolio: portfolio.toJSON(),
      cashBalance: account.cashBalance,
      totalAssets,
    };
  }
}
