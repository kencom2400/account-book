'use client';

import React from 'react';
import { formatCurrency } from '@account-book/utils';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
}

/**
 * カスタムツールチップコンポーネント
 * RechartsのTooltipで使用
 */
export function CustomTooltip({ active, payload }: CustomTooltipProps): React.JSX.Element | null {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      {payload.map((item, index) => (
        <p key={index} className="text-sm" style={{ color: item.color }}>
          {`${item.name}: ${formatCurrency(item.value)}`}
        </p>
      ))}
    </div>
  );
}
