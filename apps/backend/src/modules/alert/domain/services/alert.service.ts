import { Alert } from '../entities/alert.entity';
import { AlertType } from '../enums/alert-type.enum';
import { AlertLevel } from '../enums/alert-level.enum';
import { AlertStatus } from '../enums/alert-status.enum';
import { AlertDetails } from '../value-objects/alert-details.vo';
import { AlertAction } from '../value-objects/alert-action.vo';
import { ActionType } from '../enums/action-type.enum';
import { Reconciliation } from '../../../reconciliation/domain/entities/reconciliation.entity';
import { ReconciliationStatus } from '../../../reconciliation/domain/enums/reconciliation-status.enum';
import type { AggregationRepository } from '../../../aggregation/domain/repositories/aggregation.repository.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * アラートサービス
 *
 * アラート生成ロジックを担当
 */
export class AlertService {
  constructor(private readonly aggregationRepository: AggregationRepository) {}
  /**
   * 照合結果からアラートを生成
   */
  async createAlertFromReconciliation(
    reconciliation: Reconciliation,
  ): Promise<Alert> {
    // 1. 照合結果を分析してアラート種別を判定
    const alertType = this.analyzeReconciliationResult(reconciliation);

    // 2. アラート詳細情報を構築
    const details = await this.buildAlertDetails(reconciliation);

    // 3. アラートレベルを決定
    const level = this.determineAlertLevel(alertType, details);

    // 4. アラートメッセージを構築
    const message = this.buildAlertMessage(alertType, details);

    // 5. アラートタイトルを構築
    const title = this.buildAlertTitle(alertType, details);

    // 6. アクションリストを構築
    const actions = this.buildAlertActions(alertType);

    // 7. アラートエンティティを作成
    return new Alert(
      uuidv4(),
      alertType,
      level,
      title,
      message,
      details,
      AlertStatus.UNREAD,
      new Date(),
      null,
      null,
      null,
      actions,
    );
  }

  /**
   * 照合結果を分析してアラート種別を判定
   */
  analyzeReconciliationResult(reconciliation: Reconciliation): AlertType {
    const { status, results } = reconciliation;

    if (status !== ReconciliationStatus.UNMATCHED) {
      // 基本的にUNMATCHED以外でアラートは作成されない想定だが、念のため
      // 本来はエラーをスローするか、専用のタイプを返すのが望ましい
      return AlertType.AMOUNT_MISMATCH;
    }

    const unmatchedResults = results.filter((r) => !r.isMatched);

    if (unmatchedResults.length === 0) {
      return AlertType.PAYMENT_NOT_FOUND;
    }

    if (unmatchedResults.length > 1) {
      return AlertType.MULTIPLE_CANDIDATES;
    }

    // unmatchedResults.length === 1 の場合
    const unmatchedResult = unmatchedResults[0];
    if (unmatchedResult.discrepancy?.amountDifference !== 0) {
      return AlertType.AMOUNT_MISMATCH;
    }

    // その他の不一致要因（ここに来るケースは現状ないかもしれないが、将来の拡張のため）
    return AlertType.AMOUNT_MISMATCH;
  }

  /**
   * アラート詳細情報を構築
   */
  private async buildAlertDetails(
    reconciliation: Reconciliation,
  ): Promise<AlertDetails> {
    const firstResult = reconciliation.results[0];
    const discrepancy =
      firstResult && !firstResult.isMatched && firstResult.discrepancy !== null
        ? firstResult.discrepancy
        : null;

    // MonthlyCardSummaryからカード名と請求額を取得
    const cardSummary = await this.aggregationRepository.findByCardAndMonth(
      reconciliation.cardId,
      reconciliation.billingMonth,
    );

    const cardName = cardSummary?.cardName ?? '不明なカード';
    const expectedAmount = cardSummary?.totalAmount ?? 0;

    return new AlertDetails(
      reconciliation.cardId,
      cardName,
      reconciliation.billingMonth,
      expectedAmount,
      null, // actualAmount
      discrepancy !== null ? discrepancy.amountDifference : null,
      cardSummary?.paymentDate ?? null, // paymentDate
      null, // daysElapsed
      firstResult && firstResult.bankTransactionId !== null
        ? [firstResult.bankTransactionId]
        : [],
      reconciliation.id,
    );
  }

  /**
   * アラートタイプと詳細からレベルを決定
   */
  determineAlertLevel(type: AlertType, _details: AlertDetails): AlertLevel {
    switch (type) {
      case AlertType.AMOUNT_MISMATCH:
        return AlertLevel.WARNING;
      case AlertType.PAYMENT_NOT_FOUND:
        return AlertLevel.ERROR;
      case AlertType.OVERDUE:
        return AlertLevel.CRITICAL;
      case AlertType.MULTIPLE_CANDIDATES:
        return AlertLevel.INFO;
      default:
        return AlertLevel.WARNING;
    }
  }

  /**
   * アラートタイトルを構築
   */
  private buildAlertTitle(type: AlertType, _details: AlertDetails): string {
    switch (type) {
      case AlertType.AMOUNT_MISMATCH:
        return 'クレジットカード引落額が一致しません';
      case AlertType.PAYMENT_NOT_FOUND:
        return 'クレジットカード引落が検出されませんでした';
      case AlertType.OVERDUE:
        return 'クレジットカード支払いが延滞しています';
      case AlertType.MULTIPLE_CANDIDATES:
        return '複数の照合候補が見つかりました';
      default:
        return 'アラート';
    }
  }

  /**
   * アラートメッセージを構築
   */
  buildAlertMessage(type: AlertType, details: AlertDetails): string {
    const cardName = details.cardName;
    const billingMonth = details.billingMonth;

    switch (type) {
      case AlertType.AMOUNT_MISMATCH:
        return `${cardName}の${billingMonth}分の引落額に差異があります。\n\n請求額: ¥${details.expectedAmount.toLocaleString()}\n引落額: ${details.actualAmount ? `¥${details.actualAmount.toLocaleString()}` : '未検出'}\n差額: ${details.discrepancy ? `¥${details.discrepancy.toLocaleString()}` : '計算不可'}`;
      case AlertType.PAYMENT_NOT_FOUND:
        return `${cardName}の${billingMonth}分の引落が検出されませんでした。\n\n請求額: ¥${details.expectedAmount.toLocaleString()}\n引落予定日: ${details.paymentDate ? details.paymentDate.toLocaleDateString() : '不明'}\n経過日数: ${details.daysElapsed ?? '不明'}日`;
      case AlertType.OVERDUE:
        return `${cardName}の${billingMonth}分の支払いが延滞しています。\n\n未払い金額: ¥${details.expectedAmount.toLocaleString()}\n延滞日数: ${details.daysElapsed ?? '不明'}日`;
      case AlertType.MULTIPLE_CANDIDATES:
        return `${cardName}の${billingMonth}分の照合で、複数の候補取引が見つかりました。\n\n手動で照合を選択してください。`;
      default:
        return 'アラートが発生しました。';
    }
  }

  /**
   * アラートタイプからアクションリストを構築
   */
  buildAlertActions(type: AlertType): AlertAction[] {
    const actions: AlertAction[] = [];

    switch (type) {
      case AlertType.AMOUNT_MISMATCH:
        actions.push(
          new AlertAction(
            uuidv4(),
            '詳細を確認',
            ActionType.VIEW_DETAILS,
            false,
          ),
          new AlertAction(
            uuidv4(),
            '手動で照合',
            ActionType.MANUAL_MATCH,
            true,
          ),
          new AlertAction(
            uuidv4(),
            '解決済みにする',
            ActionType.MARK_RESOLVED,
            false,
          ),
        );
        break;
      case AlertType.PAYMENT_NOT_FOUND:
        actions.push(
          new AlertAction(
            uuidv4(),
            '詳細を確認',
            ActionType.VIEW_DETAILS,
            false,
          ),
          new AlertAction(
            uuidv4(),
            'カード会社に問い合わせ',
            ActionType.CONTACT_BANK,
            true,
          ),
          new AlertAction(
            uuidv4(),
            '解決済みにする',
            ActionType.MARK_RESOLVED,
            false,
          ),
        );
        break;
      case AlertType.OVERDUE:
        actions.push(
          new AlertAction(
            uuidv4(),
            '詳細を確認',
            ActionType.VIEW_DETAILS,
            false,
          ),
          new AlertAction(
            uuidv4(),
            'カード会社に問い合わせ',
            ActionType.CONTACT_BANK,
            true,
          ),
        );
        break;
      case AlertType.MULTIPLE_CANDIDATES:
        actions.push(
          new AlertAction(
            uuidv4(),
            '詳細を確認',
            ActionType.VIEW_DETAILS,
            false,
          ),
          new AlertAction(
            uuidv4(),
            '手動で照合',
            ActionType.MANUAL_MATCH,
            true,
          ),
        );
        break;
    }

    return actions;
  }
}
