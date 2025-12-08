import { Injectable } from '@nestjs/common';
import { TransactionEntity } from '../../domain/entities/transaction.entity';

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
}

/**
 * エクスポートサービス
 * 取引データをCSV/JSON形式に変換する
 */
@Injectable()
export class ExportService {
  /**
   * 取引データをCSV形式に変換
   */
  convertToCSV(transactions: TransactionEntity[]): string {
    if (transactions.length === 0) {
      return '';
    }

    // CSVヘッダー
    const headers = [
      'ID',
      '日付',
      '金額',
      'カテゴリID',
      'カテゴリ名',
      'カテゴリタイプ',
      '摘要',
      '金融機関ID',
      '口座ID',
      'ステータス',
      '照合済み',
      '関連取引ID',
      '作成日時',
      '更新日時',
    ];

    // CSV行データ
    const rows: string[][] = transactions.map((transaction) => {
      return [
        this.escapeCSVField(transaction.id),
        this.formatDate(transaction.date),
        transaction.amount.toString(),
        this.escapeCSVField(transaction.category.id),
        this.escapeCSVField(transaction.category.name),
        this.escapeCSVField(transaction.category.type),
        this.escapeCSVField(transaction.description),
        this.escapeCSVField(transaction.institutionId),
        this.escapeCSVField(transaction.accountId),
        this.escapeCSVField(transaction.status),
        transaction.isReconciled ? 'true' : 'false',
        transaction.relatedTransactionId
          ? this.escapeCSVField(transaction.relatedTransactionId)
          : '',
        this.formatDateTime(transaction.createdAt),
        this.formatDateTime(transaction.updatedAt),
      ];
    });

    // BOM付きUTF-8でエンコード（Excel対応）
    const csvContent = [headers, ...rows]
      .map((row) => row.join(','))
      .join('\n');

    return '\uFEFF' + csvContent;
  }

  /**
   * 取引データをJSON形式に変換
   */
  convertToJSON(transactions: TransactionEntity[]): string {
    const jsonData = transactions.map((transaction) => transaction.toJSON());
    return JSON.stringify(jsonData, null, 2);
  }

  /**
   * CSVフィールドのエスケープ処理
   */
  private escapeCSVField(field: unknown): string {
    if (field === null || field === undefined) {
      return '';
    }

    // プリミティブ型のみを文字列に変換（オブジェクトは除外）
    if (typeof field === 'object') {
      return '';
    }

    // プリミティブ型のみなので安全に文字列変換
    const stringField =
      typeof field === 'string'
        ? field
        : typeof field === 'number' || typeof field === 'boolean'
          ? String(field)
          : '';

    // カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
    if (
      stringField.includes(',') ||
      stringField.includes('\n') ||
      stringField.includes('"')
    ) {
      // ダブルクォートをエスケープ
      const escaped = stringField.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    return stringField;
  }

  /**
   * 日付をYYYY-MM-DD形式にフォーマット
   * 他のクラスからも再利用可能にするためpublicに
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 日時をYYYY-MM-DD HH:mm:ss形式にフォーマット
   */
  private formatDateTime(date: Date): string {
    const dateStr = this.formatDate(date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}:${seconds}`;
  }
}
