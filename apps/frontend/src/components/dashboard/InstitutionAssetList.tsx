'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '@account-book/utils';
import type { InstitutionAssetDto } from '@/lib/api/aggregation';

interface InstitutionAssetListProps {
  institutions: InstitutionAssetDto[];
}

/**
 * 機関別資産リストコンポーネント
 * FR-026: 金融機関別資産残高表示
 */
export function InstitutionAssetList({
  institutions,
}: InstitutionAssetListProps): React.JSX.Element {
  if (institutions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>金融機関別資産</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">データがありません</div>
        </CardContent>
      </Card>
    );
  }

  // 資産（total >= 0）と負債（total < 0）に分けて、資産は降順、負債は昇順でソート
  const assets = institutions.filter((inst) => inst.total >= 0).sort((a, b) => b.total - a.total);
  const liabilities = institutions
    .filter((inst) => inst.total < 0)
    .sort((a, b) => a.total - b.total);

  return (
    <Card>
      <CardHeader>
        <CardTitle>金融機関別資産</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 資産セクション */}
          {assets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">資産</h3>
              <div className="space-y-3">
                {assets.map((institution) => (
                  <InstitutionItem key={institution.institutionId} institution={institution} />
                ))}
              </div>
            </div>
          )}

          {/* 負債セクション */}
          {liabilities.length > 0 && (
            <div className={assets.length > 0 ? 'pt-4 border-t border-gray-200' : ''}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">負債</h3>
              <div className="space-y-3">
                {liabilities.map((institution) => (
                  <InstitutionItem key={institution.institutionId} institution={institution} />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 金融機関アイテムコンポーネント
 */
function InstitutionItem({ institution }: { institution: InstitutionAssetDto }): React.JSX.Element {
  const isAsset = institution.total >= 0;
  const totalColor = isAsset ? 'text-blue-600' : 'text-red-600';

  return (
    <div className="p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
      {/* 金融機関ヘッダー */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{institution.icon}</span>
          <span className="font-medium text-gray-900">{institution.institutionName}</span>
        </div>
        <div className="text-right">
          <div className={`text-lg font-semibold ${totalColor}`}>
            {formatCurrency(Math.abs(institution.total))}
          </div>
          {isAsset && institution.percentage > 0 && (
            <div className="text-xs text-gray-500">{institution.percentage.toFixed(1)}%</div>
          )}
        </div>
      </div>

      {/* 口座リスト */}
      {institution.accounts.length > 0 && (
        <div className="ml-8 mt-2 space-y-1">
          {institution.accounts.map((account) => {
            const accountColor = account.balance >= 0 ? 'text-gray-700' : 'text-red-600';
            return (
              <div key={account.accountId} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{account.accountName}</span>
                <span className={`font-medium ${accountColor}`}>
                  {formatCurrency(Math.abs(account.balance))}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
