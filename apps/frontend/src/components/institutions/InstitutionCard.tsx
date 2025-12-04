'use client';

import React, { useState } from 'react';
import { Institution, InstitutionType } from '@account-book/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { startSync } from '@/lib/api/sync';

interface InstitutionCardProps {
  institution: Institution;
  onUpdate: () => void;
}

/**
 * 金融機関カードコンポーネント
 * Issue #114: E-8: 金融機関設定画面の実装
 * FR-028: 金融機関接続設定の画面管理
 */
export function InstitutionCard({
  institution,
  onUpdate,
}: InstitutionCardProps): React.JSX.Element {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleConfirmDelete = (): void => {
    setIsDeleting(true);
    try {
      // TODO: 削除APIを呼び出す（バックエンドに未実装のため保留）
      // 削除機能は別Issueで実装予定
      setShowDeleteModal(false);
      onUpdate();
    } catch (error) {
      // エラーハンドリングは別Issueで実装予定
      if (error instanceof Error) {
        console.error('削除処理中にエラーが発生しました:', error);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = (): void => {
    setShowDeleteModal(false);
  };

  const getInstitutionIcon = (type: InstitutionType): string => {
    switch (type) {
      case InstitutionType.BANK:
        return '🏦';
      case InstitutionType.CREDIT_CARD:
        return '💳';
      case InstitutionType.SECURITIES:
        return '📈';
      default:
        return '🏛️';
    }
  };

  const getConnectionStatusDisplay = (
    isConnected: boolean
  ): {
    text: string;
    color: string;
    icon: string;
  } => {
    if (isConnected) {
      return {
        text: '正常',
        color: 'text-green-600',
        icon: '✓',
      };
    }
    return {
      text: 'エラー',
      color: 'text-red-600',
      icon: '✗',
    };
  };

  const formatDate = (date?: Date): string => {
    if (!date) return '未同期';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleEdit = (): void => {
    // TODO: 編集画面への遷移を実装
    // 編集機能は別Issueで実装予定
  };

  const handleDelete = (): void => {
    setShowDeleteModal(true);
  };

  const handleSync = async (): Promise<void> => {
    setIsSyncing(true);
    try {
      await startSync({
        institutionIds: [institution.id],
        forceFullSync: false,
      });
      // 同期完了後、一覧を更新
      onUpdate();
    } catch (error) {
      // TODO: エラーメッセージを表示
      // エラーハンドリングは別Issueで実装予定
      if (error instanceof Error) {
        console.error('同期処理中にエラーが発生しました:', error);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const status = getConnectionStatusDisplay(institution.isConnected);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <span className="text-3xl mr-3">{getInstitutionIcon(institution.type)}</span>
              <div>
                <CardTitle className="text-lg">{institution.name}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {institution.accounts.length > 0
                    ? institution.accounts[0].accountName
                    : '口座情報なし'}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 接続状態 */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">接続状態:</span>
              <span className={`text-sm font-medium ${status.color}`}>
                <span className="mr-1">{status.icon}</span>
                {status.text}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600">最終同期:</span>
              <span className="text-sm text-gray-900">{formatDate(institution.lastSyncedAt)}</span>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={handleEdit}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded text-sm"
            >
              編集
            </button>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-3 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  同期中...
                </span>
              ) : (
                '今すぐ同期'
              )}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-3 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              削除
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <DeleteConfirmModal
          institution={institution}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
}
