import {
  Controller,
  Get,
  Query,
  Param,
  Logger,
  HttpStatus,
  HttpException,
  Inject,
} from '@nestjs/common';
import {
  CheckConnectionStatusUseCase,
  type ConnectionStatusResult,
} from '../../application/use-cases/check-connection-status.use-case';
import {
  GetConnectionHistoryUseCase,
  type ConnectionHistoryResult,
} from '../../application/use-cases/get-connection-history.use-case';
import {
  CheckConnectionRequestDto,
  CheckConnectionResponseDto,
  ConnectionStatusDto,
} from '../dto/check-connection.dto';
import {
  GetConnectionHistoryQueryDto,
  GetConnectionHistoryResponseDto,
  ConnectionHistoryDto,
} from '../dto/get-connection-history.dto';

// 金融機関モジュールのリポジトリインターフェース
import {
  INSTITUTION_REPOSITORY,
  BANK_API_ADAPTER,
} from '../../../institution/institution.tokens';
import type { IInstitutionRepository } from '../../../institution/domain/repositories/institution.repository.interface';
import type { IBankApiAdapter } from '../../../institution/domain/adapters/bank-api.adapter.interface';
import {
  CREDIT_CARD_REPOSITORY,
  CREDIT_CARD_API_CLIENT,
} from '../../../credit-card/credit-card.tokens';
import type { ICreditCardRepository } from '../../../credit-card/domain/repositories/credit-card.repository.interface';
import type { ICreditCardAPIClient } from '../../../credit-card/infrastructure/adapters/credit-card-api.adapter.interface';
import {
  SECURITIES_ACCOUNT_REPOSITORY,
  SECURITIES_API_CLIENT,
} from '../../../securities/securities.tokens';
import type { ISecuritiesAccountRepository } from '../../../securities/domain/repositories/securities.repository.interface';
import type { ISecuritiesAPIClient } from '../../../securities/infrastructure/adapters/securities-api.adapter.interface';
import type {
  IInstitutionInfo,
  IFinancialApiClient,
} from '../../domain/adapters/api-client.interface';

/**
 * ヘルスチェックコントローラー
 * FR-004: バックグラウンド接続確認で使用
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly checkConnectionStatusUseCase: CheckConnectionStatusUseCase,
    private readonly getConnectionHistoryUseCase: GetConnectionHistoryUseCase,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: ICreditCardRepository,
    @Inject(SECURITIES_ACCOUNT_REPOSITORY)
    private readonly securitiesRepository: ISecuritiesAccountRepository,
    @Inject(BANK_API_ADAPTER)
    private readonly bankApiAdapter: IBankApiAdapter,
    @Inject(CREDIT_CARD_API_CLIENT)
    private readonly creditCardApiClient: ICreditCardAPIClient,
    @Inject(SECURITIES_API_CLIENT)
    private readonly securitiesApiClient: ISecuritiesAPIClient,
  ) {}

  /**
   * GET /api/health/institutions
   * 全金融機関または特定の金融機関の接続状態をチェック
   */
  @Get('institutions')
  async checkInstitutionsHealth(
    @Query() query: CheckConnectionRequestDto,
  ): Promise<CheckConnectionResponseDto> {
    try {
      this.logger.log('接続状態チェック開始');

      // 登録されている金融機関を取得
      const institutions = await this.getAllInstitutions();

      if (institutions.length === 0) {
        return {
          results: [],
          totalCount: 0,
          successCount: 0,
          errorCount: 0,
          checkedAt: new Date().toISOString(),
        };
      }

      // 接続チェック実行
      const results = await this.checkConnectionStatusUseCase.execute(
        { institutionId: query.institutionId },
        institutions,
      );

      const successCount = results.filter((r) => !r.errorMessage).length;
      const errorCount = results.length - successCount;

      return {
        results: results.map((r) => this.toConnectionStatusDto(r)),
        totalCount: results.length,
        successCount,
        errorCount,
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        '接続状態チェック中にエラーが発生しました',
        error instanceof Error ? error.stack : String(error),
      );
      throw new HttpException(
        '接続状態のチェックに失敗しました',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/health/institutions/:id
   * 特定の金融機関の接続履歴を取得
   */
  @Get('institutions/:id')
  async getInstitutionHistory(
    @Param('id') institutionId: string,
    @Query() query: GetConnectionHistoryQueryDto,
  ): Promise<GetConnectionHistoryResponseDto> {
    try {
      this.logger.log(`接続履歴取得: ${institutionId}`);

      const histories = await this.getConnectionHistoryUseCase.execute({
        institutionId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        limit: query.limit,
      });

      return {
        histories: histories.map((h) => this.toConnectionHistoryDto(h)),
        totalCount: histories.length,
      };
    } catch (error) {
      this.logger.error(
        `接続履歴の取得中にエラーが発生しました: ${institutionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new HttpException(
        '接続履歴の取得に失敗しました',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/health/institutions/latest/all
   * 全金融機関の最新の接続状態を取得
   */
  @Get('institutions/latest/all')
  async getLatestStatuses(): Promise<GetConnectionHistoryResponseDto> {
    try {
      this.logger.log('最新の接続状態を取得');

      const histories =
        await this.getConnectionHistoryUseCase.getLatestStatuses();

      return {
        histories: histories.map((h) => this.toConnectionHistoryDto(h)),
        totalCount: histories.length,
      };
    } catch (error) {
      this.logger.error(
        '最新接続状態の取得中にエラーが発生しました',
        error instanceof Error ? error.stack : String(error),
      );
      throw new HttpException(
        '最新接続状態の取得に失敗しました',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 全金融機関を取得（銀行、クレジットカード、証券）
   */
  private async getAllInstitutions(): Promise<IInstitutionInfo[]> {
    const institutions: IInstitutionInfo[] = [];

    // 銀行を取得
    try {
      const banks = await this.institutionRepository.findAll();
      institutions.push(
        ...banks.map((bank) => ({
          id: bank.id,
          name: bank.name,
          type: 'bank' as const,
          // BankApiAdapterをIFinancialApiClientとしてキャスト
          // 注: 各APIアダプターはtestConnectionメソッドを持つが、シグネチャが異なる
          // TODO: 各APIアダプターにhealthCheckメソッドを追加し、IFinancialApiClientを実装する

          apiClient: this.bankApiAdapter as unknown as IFinancialApiClient,
        })),
      );
    } catch (error: unknown) {
      this.logger.warn(
        '銀行の取得に失敗しました',
        error instanceof Error ? error.stack : String(error),
      );
    }

    // クレジットカードを取得
    try {
      const creditCards = await this.creditCardRepository.findAll();
      institutions.push(
        ...creditCards.map((card) => ({
          id: card.id,
          name: card.issuer,
          type: 'credit-card' as const,
          // CreditCardAPIClientをIFinancialApiClientとしてキャスト
          // 注: testConnectionメソッドのシグネチャが異なる
          // TODO: ICreditCardAPIClientにhealthCheckメソッドを追加

          apiClient: this.creditCardApiClient as unknown as IFinancialApiClient,
        })),
      );
    } catch (error: unknown) {
      this.logger.warn(
        'クレジットカードの取得に失敗しました',
        error instanceof Error ? error.stack : String(error),
      );
    }

    // 証券口座を取得
    try {
      const securities = await this.securitiesRepository.findAll();
      institutions.push(
        ...securities.map((sec) => ({
          id: sec.id,
          name: sec.securitiesCompanyName,
          type: 'securities' as const,
          // SecuritiesAPIClientをIFinancialApiClientとしてキャスト
          // 注: testConnectionメソッドのシグネチャが異なる
          // TODO: ISecuritiesAPIClientにhealthCheckメソッドを追加

          apiClient: this.securitiesApiClient as unknown as IFinancialApiClient,
        })),
      );
    } catch (error: unknown) {
      this.logger.warn(
        '証券口座の取得に失敗しました',
        error instanceof Error ? error.stack : String(error),
      );
    }

    return institutions;
  }

  /**
   * ConnectionStatusResultをDTOに変換
   */
  private toConnectionStatusDto(
    result: ConnectionStatusResult,
  ): ConnectionStatusDto {
    return {
      institutionId: result.institutionId,
      institutionName: result.institutionName,
      institutionType: result.institutionType,
      status: result.status,
      checkedAt: result.checkedAt,
      responseTime: result.responseTime,
      errorMessage: result.errorMessage,
      errorCode: result.errorCode,
    };
  }

  /**
   * ConnectionHistoryResultをDTOに変換
   */
  private toConnectionHistoryDto(
    history: ConnectionHistoryResult,
  ): ConnectionHistoryDto {
    return {
      id: history.id,
      institutionId: history.institutionId,
      institutionName: history.institutionName,
      institutionType: history.institutionType,
      status: history.status,
      checkedAt: history.checkedAt,
      responseTime: history.responseTime,
      errorMessage: history.errorMessage,
      errorCode: history.errorCode,
    };
  }
}
