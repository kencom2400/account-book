'use client';

import React from 'react';
import { ClassificationReason } from '@account-book/types';
import { getClassificationReasonText } from '@/utils/classification.utils';

/**
 * 分類信頼度バッジのProps
 */
interface ClassificationBadgeProps {
  confidence: number;
  reason: ClassificationReason;
  merchantName?: string;
}

/**
 * 分類信頼度バッジコンポーネント
 * FR-009: 詳細費目分類機能
 */
export function ClassificationBadge({
  confidence,
  reason,
  merchantName,
}: ClassificationBadgeProps): React.JSX.Element {
  const confidencePercent = Math.round(confidence * 100);

  // 信頼度に応じた色とラベル
  const getConfidenceStyle = (): {
    bgColor: string;
    textColor: string;
    label: string;
  } => {
    if (confidencePercent >= 90) {
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        label: '高信頼度',
      };
    } else if (confidencePercent >= 70) {
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        label: '中信頼度',
      };
    } else if (confidencePercent >= 50) {
      return {
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        label: '低信頼度',
      };
    } else {
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        label: 'デフォルト',
      };
    }
  };

  const style = getConfidenceStyle();
  const reasonText = getClassificationReasonText(reason, merchantName);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${style.bgColor} ${style.textColor}`}
      title={reasonText}
    >
      <span className="font-semibold">{confidencePercent}%</span>
      <span className="text-xs opacity-75">({style.label})</span>
      <span className="ml-1 text-xs opacity-60" title={reasonText}>
        ℹ️
      </span>
    </div>
  );
}
