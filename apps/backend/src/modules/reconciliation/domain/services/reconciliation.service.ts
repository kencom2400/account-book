import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { MonthlyCardSummary } from '../../../aggregation/domain/entities/monthly-card-summary.entity';
import { ReconciliationResult } from '../value-objects/reconciliation-result.vo';
import { Discrepancy } from '../value-objects/discrepancy.vo';
import { MultipleCandidateError } from '../errors/reconciliation.errors';

/**
 * 照合サービス
 *
 * 照合ロジックの実装
 */
export class ReconciliationService {
  /**
   * カード請求と銀行取引を照合
   */
  reconcilePayment(
    cardSummary: MonthlyCardSummary,
    bankTransactions: TransactionEntity[],
  ): ReconciliationResult {
    // 日付範囲でフィルタリング（引落予定日 ± 3営業日）
    const dateRangeCandidates = this.filterByDateRange(
      bankTransactions,
      cardSummary.paymentDate,
      3, // ±3営業日
    );

    // 金額でフィルタリング
    const amountMatches = this.filterByAmount(
      dateRangeCandidates,
      cardSummary.netPaymentAmount,
    );

    // 摘要でフィルタリング
    const descriptionMatches = this.filterByDescription(
      amountMatches,
      cardSummary.cardName,
    );

    // 完全一致（1件のみ）
    if (descriptionMatches.length === 1) {
      const matchedTransaction = descriptionMatches[0];
      const confidence = ReconciliationResult.calculateConfidence(
        true, // amountMatch
        true, // dateMatch
        true, // descriptionMatch
      );

      return new ReconciliationResult(
        true,
        confidence,
        matchedTransaction.id,
        cardSummary.id,
        matchedTransaction.date,
        null,
      );
    }

    // 部分一致（金額・日付のみ一致）
    if (amountMatches.length > 0) {
      // 最も近い日付の取引を特定
      const bestMatch = amountMatches.reduce((prev, curr) => {
        const prevDiff = Math.abs(
          prev.date.getTime() - cardSummary.paymentDate.getTime(),
        );
        const currDiff = Math.abs(
          curr.date.getTime() - cardSummary.paymentDate.getTime(),
        );
        return currDiff < prevDiff ? curr : prev;
      });

      // 複数候補がある場合、同じ日付差の候補が複数あるかチェック
      // 例: 支払日の前日と翌日に同額の取引があった場合、どちらが正しいか判断できない
      if (amountMatches.length > 1) {
        const bestMatchDiff = Math.abs(
          bestMatch.date.getTime() - cardSummary.paymentDate.getTime(),
        );
        const sameDiffCandidates = amountMatches.filter(
          (tx) =>
            Math.abs(tx.date.getTime() - cardSummary.paymentDate.getTime()) ===
            bestMatchDiff,
        );

        // 同じ日付差の候補が複数ある場合はエラー
        if (sameDiffCandidates.length > 1) {
          throw new MultipleCandidateError(
            sameDiffCandidates.map((tx) => ({
              id: tx.id,
              date: tx.date,
              amount: tx.amount,
              description: tx.description,
            })),
          );
        }
      }
      const confidence = ReconciliationResult.calculateConfidence(
        true, // amountMatch
        true, // dateMatch
        false, // descriptionMatch
      );

      const dateDifference = this.calculateBusinessDays(
        cardSummary.paymentDate,
        bestMatch.date,
      );

      const discrepancy = new Discrepancy(
        0, // amountDifference（金額は一致）
        dateDifference,
        false, // descriptionMatch
        '金額・日付は一致しましたが、摘要が一致しませんでした',
      );

      return new ReconciliationResult(
        false,
        confidence,
        null,
        cardSummary.id,
        null,
        discrepancy,
      );
    }

    // 不一致
    const discrepancy = this.analyzeDiscrepancy(cardSummary, bankTransactions);

    return new ReconciliationResult(
      false,
      0,
      null,
      cardSummary.id,
      null,
      discrepancy,
    );
  }

  /**
   * 日付範囲でフィルタリング（営業日計算）
   */
  private filterByDateRange(
    transactions: TransactionEntity[],
    paymentDate: Date,
    businessDays: number,
  ): TransactionEntity[] {
    const startDate = this.subtractBusinessDays(paymentDate, businessDays);
    const endDate = this.addBusinessDays(paymentDate, businessDays);

    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      txDate.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      return txDate >= start && txDate <= end;
    });
  }

  /**
   * 金額でフィルタリング
   */
  private filterByAmount(
    transactions: TransactionEntity[],
    amount: number,
  ): TransactionEntity[] {
    return transactions.filter((tx) => tx.amount === amount);
  }

  /**
   * 摘要でフィルタリング
   */
  private filterByDescription(
    transactions: TransactionEntity[],
    cardName: string,
  ): TransactionEntity[] {
    const normalizedCardName = this.normalizeCardName(cardName);

    return transactions.filter((tx) => {
      const normalizedDescription = this.normalizeText(tx.description);
      return this.matchesCardCompany(normalizedDescription, normalizedCardName);
    });
  }

  /**
   * カード会社名が摘要に含まれるか判定
   */
  private matchesCardCompany(description: string, cardName: string): boolean {
    // カード会社名のキーワードを抽出
    const keywords = this.extractCardKeywords(cardName);

    // 摘要にキーワードが含まれるか判定
    return keywords.some((keyword) => description.includes(keyword));
  }

  /**
   * カード名からキーワードを抽出
   */
  private extractCardKeywords(cardName: string): string[] {
    const normalized = this.normalizeCardName(cardName);
    const keywords: string[] = [];

    // 「カード」「クレジット」などのキーワードを追加
    if (normalized.includes('カード') || normalized.includes('カ－ド')) {
      keywords.push('カード');
      keywords.push('カ－ド');
    }
    if (normalized.includes('クレジット')) {
      keywords.push('クレジット');
    }

    // カード会社名の主要部分を抽出（例: 「三井住友」→「三井住友」）
    const companyNames = [
      '三井住友',
      '三菱UFJ',
      'みずほ',
      '楽天',
      'JCB',
      'アメリカン・エクスプレス',
      'ダイナース',
    ];

    for (const companyName of companyNames) {
      if (normalized.includes(companyName)) {
        keywords.push(companyName);
      }
    }

    return keywords.length > 0 ? keywords : ['カード', 'カ－ド', 'クレジット'];
  }

  /**
   * カード名を正規化
   */
  private normalizeCardName(cardName: string): string {
    return cardName
      .replace(/\s+/g, '')
      .replace(/[ー－]/g, '')
      .toLowerCase();
  }

  /**
   * テキストを正規化
   */
  private normalizeText(text: string): string {
    return text
      .replace(/\s+/g, '')
      .replace(/[ー－]/g, '')
      .toLowerCase();
  }

  /**
   * 営業日を減算
   */
  private subtractBusinessDays(date: Date, days: number): Date {
    const currentDate = new Date(date);
    let remainingDays = days;

    while (remainingDays > 0) {
      currentDate.setDate(currentDate.getDate() - 1);

      if (this.isBusinessDay(currentDate)) {
        remainingDays--;
      }
    }

    return currentDate;
  }

  /**
   * 営業日を加算
   */
  private addBusinessDays(date: Date, days: number): Date {
    const currentDate = new Date(date);
    let remainingDays = days;

    while (remainingDays > 0) {
      currentDate.setDate(currentDate.getDate() + 1);

      if (this.isBusinessDay(currentDate)) {
        remainingDays--;
      }
    }

    return currentDate;
  }

  /**
   * 営業日かどうかを判定（土日を除外）
   */
  private isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // 0=日曜日, 6=土曜日
  }

  /**
   * 営業日数を計算
   * 日付の「差」を計算するため、期間の片方の端点のみを含める
   */
  private calculateBusinessDays(d1: Date, d2: Date): number {
    const date1 = new Date(d1.getTime());
    const date2 = new Date(d2.getTime());
    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);

    if (date1.getTime() === date2.getTime()) {
      return 0;
    }

    const sign = date2 > date1 ? 1 : -1;
    const start = sign > 0 ? date1 : date2;
    const end = sign > 0 ? date2 : date1;

    let businessDays = 0;
    const current = new Date(start);

    while (current < end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        businessDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return businessDays * sign;
  }

  /**
   * 不一致を分析
   */
  private analyzeDiscrepancy(
    cardSummary: MonthlyCardSummary,
    bankTransactions: TransactionEntity[],
  ): Discrepancy {
    // 日付範囲内の取引を取得
    const dateRangeTransactions = this.filterByDateRange(
      bankTransactions,
      cardSummary.paymentDate,
      3,
    );

    // 最も近い金額の取引を探す
    let closestTransaction: TransactionEntity | null = null;
    let minAmountDifference = Infinity;

    for (const tx of dateRangeTransactions) {
      const amountDifference = Math.abs(
        tx.amount - cardSummary.netPaymentAmount,
      );
      if (amountDifference < minAmountDifference) {
        minAmountDifference = amountDifference;
        closestTransaction = tx;
      }
    }

    if (closestTransaction) {
      const dateDifference = this.calculateBusinessDays(
        cardSummary.paymentDate,
        closestTransaction.date,
      );
      const descriptionMatch = this.matchesCardCompany(
        this.normalizeText(closestTransaction.description),
        this.normalizeCardName(cardSummary.cardName),
      );

      let reason = '照合対象が見つかりませんでした';
      if (minAmountDifference > 0) {
        reason += `（最も近い金額との差: ${minAmountDifference}円）`;
      }
      if (dateDifference !== 0) {
        reason += `（日付差: ${dateDifference}営業日）`;
      }
      if (!descriptionMatch) {
        reason += '（摘要不一致）';
      }

      return new Discrepancy(
        minAmountDifference,
        dateDifference,
        descriptionMatch,
        reason,
      );
    }

    // 取引が見つからない場合
    return new Discrepancy(
      cardSummary.netPaymentAmount, // 金額差（全額）
      0, // 日付差（取引なし）
      false, // 摘要一致フラグ
      '指定期間内に該当する銀行取引が見つかりませんでした',
    );
  }
}
