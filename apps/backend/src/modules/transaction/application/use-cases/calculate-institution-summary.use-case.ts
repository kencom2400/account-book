import { Inject, Injectable } from '@nestjs/common';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { IInstitutionRepository } from '../../../institution/domain/repositories/institution.repository.interface';
import { INSTITUTION_REPOSITORY } from '../../../institution/institution.tokens';
import {
  InstitutionAggregationDomainService,
  type InstitutionAggregationData,
  type AccountAggregationData,
} from '../../domain/services/institution-aggregation-domain.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { InstitutionEntity } from '../../../institution/domain/entities/institution.entity';
import { AccountEntity } from '../../../institution/domain/entities/account.entity';
import { InstitutionType } from '@account-book/types';

/**
 * TransactionDto
 * プレゼンテーション層用のDTO
 */
export interface TransactionDto {
  id: string;
  date: string; // ISO8601形式
  amount: number;
  categoryType: string; // CategoryTypeの文字列値
  categoryId: string;
  institutionId: string;
  accountId: string;
  description: string;
}

/**
 * PeriodDto
 */
export interface PeriodDto {
  start: string; // ISO8601形式
  end: string; // ISO8601形式
}

/**
 * AccountSummaryDto
 */
export interface AccountSummaryDto {
  accountId: string;
  accountName: string;
  income: number;
  expense: number;
  periodBalance: number;
  currentBalance: number;
  transactionCount: number;
}

/**
 * InstitutionSummaryDto
 */
export interface InstitutionSummaryDto {
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  period: PeriodDto;
  accounts: AccountSummaryDto[];
  totalIncome: number;
  totalExpense: number;
  periodBalance: number;
  currentBalance: number;
  transactionCount: number;
  transactions: TransactionDto[];
}

/**
 * InstitutionSummaryResponseDto
 */
export interface InstitutionSummaryResponseDto {
  institutions: InstitutionSummaryDto[];
}

/**
 * CalculateInstitutionSummaryUseCase
 * 金融機関別集計のユースケース
 */
@Injectable()
export class CalculateInstitutionSummaryUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
    private readonly institutionAggregationDomainService: InstitutionAggregationDomainService,
  ) {}

  /**
   * 金融機関別集計を実行
   */
  async execute(
    startDate: Date,
    endDate: Date,
    institutionIds?: string[],
    includeTransactions = false,
  ): Promise<InstitutionSummaryResponseDto> {
    // 金融機関情報を取得
    const institutions = institutionIds
      ? await this.institutionRepository.findByIds(institutionIds)
      : await this.institutionRepository.findAll();

    // 期間内の取引データを取得
    const transactions = institutionIds
      ? await this.transactionRepository.findByInstitutionIdsAndDateRange(
          institutionIds,
          startDate,
          endDate,
        )
      : await this.transactionRepository.findByDateRange(startDate, endDate);

    // 金融機関別に集計
    const institutionAggregation =
      this.institutionAggregationDomainService.aggregateByInstitution(
        transactions,
        institutions,
      );

    // 各金融機関のサマリーを構築
    const institutionSummaries: InstitutionSummaryDto[] = [];

    for (const institution of institutions) {
      const aggregationData = institutionAggregation.get(institution.id);
      if (!aggregationData) {
        // 期間内に取引がない場合でも、0埋めデータとして返す
        const emptyAggregationData: InstitutionAggregationData = {
          totalIncome: 0,
          totalExpense: 0,
          periodBalance: 0,
          transactionCount: 0,
          transactions: [],
        };
        institutionSummaries.push(
          this.buildInstitutionSummary(
            institution,
            emptyAggregationData,
            institution.accounts,
            includeTransactions,
            startDate,
            endDate,
          ),
        );
        continue;
      }

      // 口座別に集計
      const accountAggregation =
        this.institutionAggregationDomainService.aggregateByAccount(
          aggregationData.transactions,
          institution.accounts,
        );

      institutionSummaries.push(
        this.buildInstitutionSummary(
          institution,
          aggregationData,
          institution.accounts,
          includeTransactions,
          startDate,
          endDate,
          accountAggregation,
        ),
      );
    }

    // 取引額の多い順にソート
    institutionSummaries.sort(
      (a, b) => Math.abs(b.periodBalance) - Math.abs(a.periodBalance),
    );

    return {
      institutions: institutionSummaries,
    };
  }

  /**
   * 金融機関別サマリーを構築
   */
  private buildInstitutionSummary(
    institution: InstitutionEntity,
    aggregationData: InstitutionAggregationData,
    accounts: AccountEntity[],
    includeTransactions: boolean,
    startDate: Date,
    endDate: Date,
    accountAggregation?: Map<string, AccountAggregationData>,
  ): InstitutionSummaryDto {
    // 口座別サマリーを構築
    const accountSummaries: AccountSummaryDto[] = accounts.map((account) => {
      const accountData = accountAggregation?.get(account.id);
      if (!accountData) {
        return {
          accountId: account.id,
          accountName: account.accountName,
          income: 0,
          expense: 0,
          periodBalance: 0,
          currentBalance: account.balance,
          transactionCount: 0,
        };
      }

      return {
        accountId: account.id,
        accountName: account.accountName,
        income: accountData.income,
        expense: accountData.expense,
        periodBalance: accountData.periodBalance,
        currentBalance: account.balance,
        transactionCount: accountData.transactionCount,
      };
    });

    // 現在の残高を計算（全口座の合計）
    const currentBalance = accounts.reduce(
      (sum, account) => sum + account.balance,
      0,
    );

    // 取引明細を取得（includeTransactionsがtrueの場合のみ）
    const transactions = includeTransactions
      ? aggregationData.transactions.map((t) => this.toTransactionDto(t))
      : [];

    return {
      institutionId: institution.id,
      institutionName: institution.name,
      institutionType: institution.type,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      accounts: accountSummaries,
      totalIncome: aggregationData.totalIncome,
      totalExpense: aggregationData.totalExpense,
      periodBalance: aggregationData.periodBalance,
      currentBalance,
      transactionCount: aggregationData.transactionCount,
      transactions,
    };
  }

  /**
   * TransactionEntityをTransactionDtoに変換
   */
  private toTransactionDto(entity: TransactionEntity): TransactionDto {
    return {
      id: entity.id,
      date: entity.date.toISOString(),
      amount: entity.amount,
      categoryType: entity.category.type,
      categoryId: entity.category.id,
      institutionId: entity.institutionId,
      accountId: entity.accountId,
      description: entity.description,
    };
  }
}
