import { Alert } from '../entities/alert.entity';
import { AlertType } from '../enums/alert-type.enum';
import { AlertLevel } from '../enums/alert-level.enum';
import { AlertStatus } from '../enums/alert-status.enum';
import { AlertDetails } from '../value-objects/alert-details.vo';
import { AlertAction } from '../value-objects/alert-action.vo';
import { ActionType } from '../enums/action-type.enum';
import { Reconciliation } from '../../../reconciliation/domain/entities/reconciliation.entity';
import { ReconciliationStatus } from '../../../reconciliation/domain/enums/reconciliation-status.enum';
import { v4 as uuidv4 } from 'uuid';

/**
 * アラートサービス
 *
 * アラート生成ロジックを担当
 */
export class AlertService {
  /**
   * 照合結果からアラートを生成
   */
  createAlertFromReconciliation(reconciliation: Reconciliation): Alert {
    // 1. 照合結果を分析してアラート種別を判定
    const alertType = this.analyzeReconciliationResult(reconciliation);

    // 2. アラート詳細情報を構築
    const details = this.buildAlertDetails(reconciliation);

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
    const status = reconciliation.status;
    const results = reconciliation.results;

    // 照合結果が不一致の場合
    if (status === ReconciliationStatus.UNMATCHED) {
      // 候補取引が複数ある場合は複数候補アラート
      const unmatchedResults = results.filter((r) => !r.isMatched);
      if (unmatchedResults.length > 1) {
        return AlertType.MULTIPLE_CANDIDATES;
      }

      // 金額不一致をチェック
      const firstResult = results[0];
      if (
        firstResult &&
        !firstResult.isMatched &&
        firstResult.discrepancy !== null
      ) {
        if (firstResult.discrepancy.amountDifference !== 0) {
          return AlertType.AMOUNT_MISMATCH;
        }
      }

      // 引落未検出をチェック（候補取引が0件）
      if (unmatchedResults.length === 0) {
        return AlertType.PAYMENT_NOT_FOUND;
      }
    }

    // デフォルトは金額不一致
    return AlertType.AMOUNT_MISMATCH;
  }

  /**
   * アラート詳細情報を構築
   */
  private buildAlertDetails(reconciliation: Reconciliation): AlertDetails {
    const firstResult = reconciliation.results[0];
    const discrepancy =
      firstResult && !firstResult.isMatched && firstResult.discrepancy !== null
        ? firstResult.discrepancy
        : null;

    // カード情報と請求月は照合結果から取得
    // 実際の実装では、MonthlyCardSummaryから取得する必要があります
    // ここでは簡易実装として、照合結果から取得できる情報のみを使用
    return new AlertDetails(
      reconciliation.cardId,
      'カード名', // TODO: 実際のカード名を取得
      reconciliation.billingMonth,
      reconciliation.summary.total, // TODO: 実際の請求額を取得
      null, // actualAmount
      discrepancy !== null ? discrepancy.amountDifference : null,
      null, // paymentDate
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
