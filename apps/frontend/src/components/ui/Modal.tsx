'use client';

import React, { useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';

// モーダルが開いている数を管理するカウンター
let modalCount = 0;

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const sizeStyles: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Modalコンポーネント
 * モーダルダイアログ用のコンポーネント
 *
 * @param onClose - モーダルを閉じるコールバック関数
 *   パフォーマンス最適化のため、親コンポーネントで`useCallback`を使用してメモ化することを推奨します。
 *   例: `const handleClose = useCallback(() => setOpen(false), []);`
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps): React.JSX.Element | null {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // ESCキーで閉じる、フォーカス管理
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      // モーダルを開く前のフォーカス要素を保存
      if (document.activeElement instanceof HTMLElement) {
        previousActiveElementRef.current = document.activeElement;
      }
      document.addEventListener('keydown', handleEscape);
      // モーダル表示時はbodyのスクロールを無効化（複数モーダル対応）
      modalCount++;
      if (modalCount === 1) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      // モーダルを閉じたときにフォーカスを戻す
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
        previousActiveElementRef.current = null;
      }
    }

    return (): void => {
      document.removeEventListener('keydown', handleEscape);
      // モーダルが閉じられたとき、カウンターを減らす
      if (isOpen) {
        modalCount--;
        // すべてのモーダルが閉じられたときのみ、bodyのスクロールを有効化
        if (modalCount === 0) {
          document.body.style.overflow = '';
        }
      }
    };
  }, [isOpen, onClose]);

  const handleOverlayKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const sizeStyle = sizeStyles[size];

  return (
    <FocusTrap
      active={true}
      focusTrapOptions={{
        fallbackFocus: '.modal-content',
        clickOutsideDeactivates: false,
      }}
    >
      <div
        className="fixed inset-0 z-50 flex items-center justify-center modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* オーバーレイ */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
          onKeyDown={handleOverlayKeyDown}
          role="button"
          tabIndex={0}
          aria-label="モーダルを閉じる"
        />

        {/* モーダルコンテンツ */}
        <div
          className={`relative bg-white rounded-lg shadow-xl ${sizeStyle} w-full mx-4 max-h-[90vh] overflow-y-auto`}
        >
          {/* ヘッダー */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              {title && (
                <h2 id="modal-title" className="text-xl font-bold text-gray-900">
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                  aria-label="閉じる"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* ボディ */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </FocusTrap>
  );
}
