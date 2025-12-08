'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  getAllInstitutionSyncSettings,
  updateInstitutionSyncSettings,
} from '@/lib/api/sync-settings';
import { getInstitutions } from '@/lib/api/institutions';
import type {
  InstitutionSyncSettingsResponseDto,
  UpdateInstitutionSyncSettingsRequestDto,
  SyncIntervalType,
  TimeUnit,
  Institution,
  InstitutionSyncStatus,
} from '@account-book/types';
import {
  SyncIntervalType as SyncIntervalTypeEnum,
  InstitutionSyncStatus as InstitutionSyncStatusEnum,
  TimeUnit as TimeUnitEnum,
} from '@account-book/types';

/**
 * 金融機関設定タブコンポーネント
 * FR-030: データ同期間隔の設定
 */
export function InstitutionSettingsTab(): React.JSX.Element {
  const [settings, setSettings] = useState<InstitutionSyncSettingsResponseDto[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    intervalType: SyncIntervalType;
    customValue: number;
    customUnit: TimeUnit;
    enabled: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const [settingsData, institutionsData] = await Promise.all([
          getAllInstitutionSyncSettings(),
          getInstitutions(),
        ]);
        setSettings(settingsData);
        setInstitutions(institutionsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : '設定の取得に失敗しました。';
        setError(message);
        console.error('設定の取得中にエラーが発生しました:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const handleEdit = (setting: InstitutionSyncSettingsResponseDto): void => {
    setEditingId(setting.id);
    setEditForm({
      intervalType: setting.interval.type,
      customValue: setting.interval.value ?? 6,
      customUnit: setting.interval.unit ?? TimeUnitEnum.HOURS,
      enabled: setting.enabled,
    });
  };

  const handleCancelEdit = (): void => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSave = async (settingId: string): Promise<void> => {
    if (!editForm) return;

    try {
      setSavingId(settingId);
      setError(null);

      // バリデーション
      if (
        editForm.intervalType === SyncIntervalTypeEnum.CUSTOM &&
        (!editForm.customValue || editForm.customValue < 5)
      ) {
        setError('カスタム間隔は5分以上を指定してください');
        return;
      }

      const request: UpdateInstitutionSyncSettingsRequestDto = {
        interval: {
          type: editForm.intervalType,
          ...(editForm.intervalType === SyncIntervalTypeEnum.CUSTOM && {
            value: editForm.customValue,
            unit: editForm.customUnit,
          }),
        },
        enabled: editForm.enabled,
      };

      const setting = settings.find((s) => s.id === settingId);
      if (!setting) {
        setError('設定が見つかりません');
        return;
      }

      const updatedSetting = await updateInstitutionSyncSettings(setting.institutionId, request);

      // 一覧を再取得する代わりに、ローカルstateを更新
      setSettings((currentSettings) =>
        currentSettings.map((s) => (s.id === updatedSetting.id ? updatedSetting : s))
      );
      setEditingId(null);
      setEditForm(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : '設定の保存に失敗しました。';
      setError(message);
      console.error('設定の保存中にエラーが発生しました:', err);
    } finally {
      setSavingId(null);
    }
  };

  // 金融機関IDから名前へのMapを一度だけ生成
  const institutionNameMap = useMemo(() => {
    const map = new Map<string, string>();
    institutions.forEach((institution) => {
      map.set(institution.id, institution.name);
    });
    return map;
  }, [institutions]);

  const getInstitutionName = (institutionId: string): string => {
    return institutionNameMap.get(institutionId) ?? institutionId;
  };

  const formatInterval = (interval: {
    type: SyncIntervalType;
    value?: number;
    unit?: TimeUnit;
  }): string => {
    switch (interval.type) {
      case SyncIntervalTypeEnum.REALTIME:
        return 'リアルタイム（5分ごと）';
      case SyncIntervalTypeEnum.FREQUENT:
        return '高頻度（1時間ごと）';
      case SyncIntervalTypeEnum.STANDARD:
        return '標準（6時間ごと）';
      case SyncIntervalTypeEnum.INFREQUENT:
        return '低頻度（1日1回）';
      case SyncIntervalTypeEnum.MANUAL:
        return '手動のみ';
      case SyncIntervalTypeEnum.CUSTOM:
        if (interval.value && interval.unit) {
          const unitLabel =
            interval.unit === TimeUnitEnum.MINUTES
              ? '分'
              : interval.unit === TimeUnitEnum.HOURS
                ? '時間'
                : '日';
          return `カスタム（${interval.value}${unitLabel}ごと）`;
        }
        return 'カスタム';
      default:
        return '不明';
    }
  };

  const formatStatus = (status: InstitutionSyncStatus): string => {
    switch (status) {
      case InstitutionSyncStatusEnum.IDLE:
        return '待機中';
      case InstitutionSyncStatusEnum.SYNCING:
        return '同期中';
      case InstitutionSyncStatusEnum.ERROR:
        return 'エラー';
      default:
        return '不明';
    }
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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

      {settings.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-gray-600 text-center py-8">金融機関の設定がありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {settings.map((setting) => (
            <Card key={setting.id}>
              <CardHeader>
                <CardTitle>{getInstitutionName(setting.institutionId)}</CardTitle>
              </CardHeader>
              <CardContent>
                {editingId === setting.id && editForm ? (
                  <div className="space-y-4">
                    <div>
                      <div className="block text-sm font-medium text-gray-700 mb-2">同期間隔</div>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`interval-${setting.id}`}
                            value={SyncIntervalTypeEnum.REALTIME}
                            checked={editForm.intervalType === SyncIntervalTypeEnum.REALTIME}
                            onChange={() =>
                              setEditForm({
                                ...editForm,
                                intervalType: SyncIntervalTypeEnum.REALTIME,
                              })
                            }
                            className="mr-2"
                          />
                          <span>リアルタイム（5分ごと）</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`interval-${setting.id}`}
                            value={SyncIntervalTypeEnum.FREQUENT}
                            checked={editForm.intervalType === SyncIntervalTypeEnum.FREQUENT}
                            onChange={() =>
                              setEditForm({
                                ...editForm,
                                intervalType: SyncIntervalTypeEnum.FREQUENT,
                              })
                            }
                            className="mr-2"
                          />
                          <span>高頻度（1時間ごと）</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`interval-${setting.id}`}
                            value={SyncIntervalTypeEnum.STANDARD}
                            checked={editForm.intervalType === SyncIntervalTypeEnum.STANDARD}
                            onChange={() =>
                              setEditForm({
                                ...editForm,
                                intervalType: SyncIntervalTypeEnum.STANDARD,
                              })
                            }
                            className="mr-2"
                          />
                          <span>標準（6時間ごと）</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`interval-${setting.id}`}
                            value={SyncIntervalTypeEnum.INFREQUENT}
                            checked={editForm.intervalType === SyncIntervalTypeEnum.INFREQUENT}
                            onChange={() =>
                              setEditForm({
                                ...editForm,
                                intervalType: SyncIntervalTypeEnum.INFREQUENT,
                              })
                            }
                            className="mr-2"
                          />
                          <span>低頻度（1日1回）</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`interval-${setting.id}`}
                            value={SyncIntervalTypeEnum.MANUAL}
                            checked={editForm.intervalType === SyncIntervalTypeEnum.MANUAL}
                            onChange={() =>
                              setEditForm({
                                ...editForm,
                                intervalType: SyncIntervalTypeEnum.MANUAL,
                              })
                            }
                            className="mr-2"
                          />
                          <span>手動のみ</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`interval-${setting.id}`}
                            value={SyncIntervalTypeEnum.CUSTOM}
                            checked={editForm.intervalType === SyncIntervalTypeEnum.CUSTOM}
                            onChange={() =>
                              setEditForm({
                                ...editForm,
                                intervalType: SyncIntervalTypeEnum.CUSTOM,
                              })
                            }
                            className="mr-2"
                          />
                          <span>カスタム</span>
                        </label>
                        {editForm.intervalType === SyncIntervalTypeEnum.CUSTOM && (
                          <div className="ml-6 flex items-center gap-2">
                            <input
                              type="number"
                              min="5"
                              max="43200"
                              value={editForm.customValue}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  customValue: Number(e.target.value),
                                })
                              }
                              className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                            />
                            <select
                              value={editForm.customUnit}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  customUnit: e.target.value as TimeUnit,
                                })
                              }
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
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.enabled}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              enabled: e.target.checked,
                            })
                          }
                          className="mr-2"
                          aria-label="有効"
                        />
                        <span>有効</span>
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={() => handleSave(setting.id)}
                        disabled={savingId === setting.id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingId === setting.id ? '保存中...' : '保存'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">同期間隔: </span>
                      <span className="font-medium">{formatInterval(setting.interval)}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">ステータス: </span>
                      <span
                        className={`font-medium ${
                          setting.syncStatus === InstitutionSyncStatusEnum.ERROR
                            ? 'text-red-600'
                            : setting.syncStatus === InstitutionSyncStatusEnum.SYNCING
                              ? 'text-blue-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {formatStatus(setting.syncStatus)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">最終同期: </span>
                      <span className="font-medium">{formatDateTime(setting.lastSyncedAt)}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">次回同期: </span>
                      <span className="font-medium">{formatDateTime(setting.nextSyncAt)}</span>
                    </div>
                    {setting.lastError && (
                      <div>
                        <span className="text-sm text-red-600">エラー: {setting.lastError}</span>
                      </div>
                    )}
                    <div className="mt-4">
                      <button
                        onClick={() => handleEdit(setting)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        編集
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
