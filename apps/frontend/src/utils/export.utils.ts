import type { Transaction } from '@account-book/types';

/**
 * CSVフィールドのエスケープ処理
 */
function escapeCSVField(field: unknown): string {
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
  if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
    // ダブルクォートをエスケープ
    const escaped = stringField.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return stringField;
}

/**
 * 日付をYYYY-MM-DD形式にフォーマット
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 日時をYYYY-MM-DD HH:mm:ss形式にフォーマット
 */
function formatDateTime(date: Date): string {
  const dateStr = formatDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
}

/**
 * 取引データをCSV形式に変換
 */
export function convertTransactionsToCSV(transactions: Transaction[]): string {
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
      escapeCSVField(transaction.id),
      formatDate(transaction.date),
      escapeCSVField(transaction.amount),
      escapeCSVField(transaction.category.id),
      escapeCSVField(transaction.category.name),
      escapeCSVField(transaction.category.type),
      escapeCSVField(transaction.description),
      escapeCSVField(transaction.institutionId),
      escapeCSVField(transaction.accountId),
      escapeCSVField(transaction.status),
      escapeCSVField(transaction.isReconciled),
      escapeCSVField(transaction.relatedTransactionId),
      formatDateTime(transaction.createdAt),
      formatDateTime(transaction.updatedAt),
    ];
  });

  // BOM付きUTF-8でエンコード（Excel対応）
  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

  return '\uFEFF' + csvContent;
}

/**
 * 取引データをJSON形式に変換
 */
export function convertTransactionsToJSON(transactions: Transaction[]): string {
  const jsonData = transactions.map((transaction) => ({
    id: transaction.id,
    date: transaction.date.toISOString(),
    amount: transaction.amount,
    category: {
      id: transaction.category.id,
      name: transaction.category.name,
      type: transaction.category.type,
    },
    description: transaction.description,
    institutionId: transaction.institutionId,
    accountId: transaction.accountId,
    status: transaction.status,
    isReconciled: transaction.isReconciled,
    relatedTransactionId: transaction.relatedTransactionId,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  }));
  return JSON.stringify(jsonData, null, 2);
}

/**
 * ファイルをダウンロード
 */
export function downloadFile(content: string, filename: string, mimeType: string): Promise<void> {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // ダウンロードイベントが確実に発火するように、少し遅延してからURLを解放
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 100);
  // Promiseは即座に解決（ダウンロードイベントは既に発火している）
  return Promise.resolve();
}
