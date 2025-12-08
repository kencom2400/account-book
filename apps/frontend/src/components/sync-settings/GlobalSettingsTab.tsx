'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { getSyncSettings, updateSyncSettings } from '@/lib/api/sync-settings';
import type { UpdateSyncSettingsRequestDto, SyncIntervalType, TimeUnit } from '@account-book/types';
import {
  SyncIntervalType as SyncIntervalTypeEnum,
  TimeUnit as TimeUnitEnum,
} from '@account-book/types';

/**
 * 全体設定タブコンポーネント
 * FR-030: データ同期間隔の設定
 */
export function GlobalSettingsTab(): React.JSX.Element {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // フォーム状態
  const [defaultIntervalType, setDefaultIntervalType] = useState<SyncIntervalType>(
    SyncIntervalTypeEnum.STANDARD
  );
  const [customValue, setCustomValue] = useState<number>(6);
  const [customUnit, setCustomUnit] = useState<TimeUnit>(TimeUnitEnum.HOURS);
  const [wifiOnly, setWifiOnly] = useState<boolean>(false);
  const [batterySavingMode, setBatterySavingMode] = useState<boolean>(false);
  const [autoRetry, setAutoRetry] = useState<boolean>(true);
  const [maxRetryCount, setMaxRetryCount] = useState<number>(3);
  const [nightModeSuspend, setNightModeSuspend] = useState<boolean>(false);
  const [nightModeStart, setNightModeStart] = useState<string>('22:00');
  const [nightModeEnd, setNightModeEnd] = useState<string>('06:00');

  useEffect(() => {
    const fetchSettings = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSyncSettings();

        // フォームに反映
        setDefaultIntervalType(data.defaultInterval.type);
        if (data.defaultInterval.value !== undefined) {
          setCustomValue(data.defaultInterval.value);
        }
        if (data.defaultInterval.unit) {
          setCustomUnit(data.defaultInterval.unit);
        }
        setWifiOnly(data.wifiOnly);
        setBatterySavingMode(data.batterySavingMode);
        setAutoRetry(data.autoRetry);
        setMaxRetryCount(data.maxRetryCount);
        setNightModeSuspend(data.nightModeSuspend);
        setNightModeStart(data.nightModeStart);
        setNightModeEnd(data.nightModeEnd);
      } catch (err) {
        const message = err instanceof Error ? err.message : '設定の取得に失敗しました。';
        setError(message);
        console.error('設定の取得中にエラーが発生しました:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // バリデーション
      if (
        defaultIntervalType === SyncIntervalTypeEnum.CUSTOM &&
        (!customValue || customValue < 5)
      ) {
        setError('カスタム間隔は5分以上を指定してください');
        setSaving(false);
        return;
      }

      if (nightModeSuspend && nightModeStart === nightModeEnd) {
        setError('夜間モードの開始時刻と終了時刻は異なる必要があります');
        setSaving(false);
        return;
      }

      const request: UpdateSyncSettingsRequestDto = {
        defaultInterval: {
          type: defaultIntervalType,
          ...(defaultIntervalType === SyncIntervalTypeEnum.CUSTOM && {
            value: customValue,
            unit: customUnit,
          }),
        },
        wifiOnly,
        batterySavingMode,
        autoRetry,
        maxRetryCount,
        nightModeSuspend,
        ...(nightModeSuspend && {
          nightModeStart,
          nightModeEnd,
        }),
      };

      await updateSyncSettings(request);
      setSuccessMessage('設定を保存しました');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : '設定の保存に失敗しました。';
      setError(message);
      console.error('設定の保存中にエラーが発生しました:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 成功メッセージ */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>デフォルト同期間隔</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="interval"
                value={SyncIntervalTypeEnum.REALTIME}
                checked={defaultIntervalType === SyncIntervalTypeEnum.REALTIME}
                onChange={() => setDefaultIntervalType(SyncIntervalTypeEnum.REALTIME)}
                className="mr-3"
              />
              <span>リアルタイム（5分ごと）</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="interval"
                value={SyncIntervalTypeEnum.FREQUENT}
                checked={defaultIntervalType === SyncIntervalTypeEnum.FREQUENT}
                onChange={() => setDefaultIntervalType(SyncIntervalTypeEnum.FREQUENT)}
                className="mr-3"
              />
              <span>高頻度（1時間ごと）</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="interval"
                value={SyncIntervalTypeEnum.STANDARD}
                checked={defaultIntervalType === SyncIntervalTypeEnum.STANDARD}
                onChange={() => setDefaultIntervalType(SyncIntervalTypeEnum.STANDARD)}
                className="mr-3"
              />
              <span>標準（6時間ごと）【推奨】</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="interval"
                value={SyncIntervalTypeEnum.INFREQUENT}
                checked={defaultIntervalType === SyncIntervalTypeEnum.INFREQUENT}
                onChange={() => setDefaultIntervalType(SyncIntervalTypeEnum.INFREQUENT)}
                className="mr-3"
              />
              <span>低頻度（1日1回）</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="interval"
                value={SyncIntervalTypeEnum.MANUAL}
                checked={defaultIntervalType === SyncIntervalTypeEnum.MANUAL}
                onChange={() => setDefaultIntervalType(SyncIntervalTypeEnum.MANUAL)}
                className="mr-3"
              />
              <span>手動のみ</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="interval"
                value={SyncIntervalTypeEnum.CUSTOM}
                checked={defaultIntervalType === SyncIntervalTypeEnum.CUSTOM}
                onChange={() => setDefaultIntervalType(SyncIntervalTypeEnum.CUSTOM)}
                className="mr-3"
              />
              <span>カスタム</span>
            </label>

            {defaultIntervalType === SyncIntervalTypeEnum.CUSTOM && (
              <div className="ml-6 mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="43200"
                  value={customValue}
                  onChange={(e) => setCustomValue(Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value as TimeUnit)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="minutes">分</option>
                  <option value="hours">時間</option>
                  <option value="days">日</option>
                </select>
                <span className="text-gray-600">ごと</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>詳細オプション</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={wifiOnly}
                onChange={(e) => setWifiOnly(e.target.checked)}
                className="mr-3"
              />
              <span>Wi-Fi接続時のみ自動同期する</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={batterySavingMode}
                onChange={(e) => setBatterySavingMode(e.target.checked)}
                className="mr-3"
              />
              <span>バッテリー節約モード時は同期を控える</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRetry}
                onChange={(e) => setAutoRetry(e.target.checked)}
                className="mr-3"
              />
              <span>エラー時は自動リトライする</span>
            </label>
            {autoRetry && (
              <div className="ml-6">
                <label className="flex items-center">
                  <span className="mr-2">最大リトライ回数:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxRetryCount}
                    onChange={(e) => setMaxRetryCount(Number(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </label>
              </div>
            )}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={nightModeSuspend}
                onChange={(e) => setNightModeSuspend(e.target.checked)}
                className="mr-3"
              />
              <span>夜間モードを有効にする</span>
            </label>
            {nightModeSuspend && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-24">開始時刻:</span>
                  <input
                    type="time"
                    value={nightModeStart}
                    onChange={(e) => setNightModeStart(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-24">終了時刻:</span>
                  <input
                    type="time"
                    value={nightModeEnd}
                    onChange={(e) => setNightModeEnd(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}
