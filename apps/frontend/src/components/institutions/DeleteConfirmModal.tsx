'use client';

import React from 'react';
import { Institution } from '@account-book/types';

interface DeleteConfirmModalProps {
  institution: Institution;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * 削除確認モーダルコンポーネント
 * Issue #114: E-8: 金融機関設定画面の実装
 * FR-028: 金融機関接続設定の画面管理
 */
export function DeleteConfirmModal({
  institution,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* オーバーレイ */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onCancel}
          onKeyDown={(e): void => {
            if (e.key === 'Escape') {
              onCancel();
            }
          }}
          role="presentation"
          aria-label="モーダルを閉じる"
        ></div>

        {/* モーダル */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-modal-title"
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3
                  id="delete-confirm-modal-title"
                  className="text-lg leading-6 font-medium text-gray-900"
                >
                  金融機関を削除しますか？
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    <strong>{institution.name}</strong>
                    を削除しようとしています。この操作は取り消せません。
                  </p>
                  {/* TODO: 取引履歴の扱いを選択するUI要素を実装（別Issueで実装予定） */}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onConfirm}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              削除
            </button>
            <button
              onClick={onCancel}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
