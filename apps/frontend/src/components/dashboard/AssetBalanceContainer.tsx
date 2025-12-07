'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AssetBalanceCard } from './AssetBalanceCard';
import { InstitutionAssetList } from './InstitutionAssetList';
import { AssetBalanceGraph } from './AssetBalanceGraph';
import { aggregationApi, type AssetBalanceResponse } from '@/lib/api/aggregation';

interface AssetBalanceContainerProps {
  asOfDate?: Date;
}

/**
 * 資産残高コンテナコンポーネント
 * FR-026: 金融機関別資産残高表示
 */
export function AssetBalanceContainer({ asOfDate }: AssetBalanceContainerProps): React.JSX.Element {
  const [data, setData] = useState<AssetBalanceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // API呼び出し
      const response = await aggregationApi.getAssetBalance(
        asOfDate ? asOfDate.toISOString().split('T')[0] : undefined
      );

      setData(response);
    } catch (err) {
      setError('データの取得に失敗しました');
      console.error('Failed to fetch asset balance:', err);
    } finally {
      setLoading(false);
    }
  }, [asOfDate]);

  // データ取得のトリガー
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">データがありません</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 総資産カード */}
      <AssetBalanceCard data={data} />

      {/* 機関別リストとグラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InstitutionAssetList institutions={data.institutions} />
        <AssetBalanceGraph institutions={data.institutions} />
      </div>
    </div>
  );
}
