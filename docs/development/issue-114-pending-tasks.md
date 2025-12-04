# Issue #114: 未実施タスク一覧

**作成日**: 2025-12-04  
**ブランチ**: `feature/issue-114-financial-institution-settings-screen`  
**コミット**: `7b4d0a6`

## 概要

Issue #114「E-8: 金融機関設定画面の実装」で実装した機能のうち、未実施のタスクをまとめています。

---

## 🔴 未実施タスク一覧

### 1. 金融機関編集機能の実装

**状態**: 🔴 未実装  
**優先度**: 高  
**実装場所**:

- フロントエンド: `apps/frontend/src/components/institutions/InstitutionCard.tsx` (89行目)
- バックエンド: `apps/backend/src/modules/institution/presentation/controllers/institution.controller.ts`

**実装内容**:

- [ ] バックエンド: `PATCH /api/institutions/:id` エンドポイントの実装
  - UseCaseの作成（`UpdateInstitutionUseCase`）
  - DTOの作成（`UpdateInstitutionDto`）
  - Controllerへのエンドポイント追加
- [ ] フロントエンド: 編集画面の実装
  - 編集ページコンポーネントの作成（`apps/frontend/src/app/banks/[id]/edit/page.tsx`）
  - 編集フォームコンポーネントの作成
  - `InstitutionCard`の編集ボタンから編集画面への遷移実装

**現在の状態**:

```typescript
// InstitutionCard.tsx (89行目)
const handleEdit = (): void => {
  // TODO: 編集画面への遷移を実装
  // 編集機能は別Issueで実装予定
};
```

**関連ファイル**:

- `apps/frontend/src/components/institutions/InstitutionCard.tsx`
- `apps/backend/src/modules/institution/presentation/controllers/institution.controller.ts`

---

### 2. 金融機関削除機能の実装

**状態**: 🔴 未実装（バックエンドAPI未実装）  
**優先度**: 高  
**実装場所**:

- バックエンド: `apps/backend/src/modules/institution/presentation/controllers/institution.controller.ts`
- フロントエンド: `apps/frontend/src/components/institutions/InstitutionCard.tsx` (30行目)

**実装内容**:

- [ ] バックエンド: `DELETE /api/institutions/:id` エンドポイントの実装
  - UseCaseの作成（`DeleteInstitutionUseCase`）
  - 取引履歴の扱いオプション（削除/保持）の実装
  - Controllerへのエンドポイント追加
- [ ] フロントエンド: 削除APIの呼び出し実装
  - `deleteInstitution` APIクライアントの実装（既に追加済みだが、バックエンド未実装のため未使用）
  - `handleConfirmDelete`でのAPI呼び出し実装
  - 取引履歴の扱い選択UIの実装（`DeleteConfirmModal`）

**現在の状態**:

```typescript
// InstitutionCard.tsx (30行目)
// TODO: 削除APIを呼び出す（バックエンドに未実装のため保留）
// 削除機能は別Issueで実装予定
```

**関連ファイル**:

- `apps/frontend/src/components/institutions/InstitutionCard.tsx`
- `apps/frontend/src/components/institutions/DeleteConfirmModal.tsx` (67行目)
- `apps/frontend/src/lib/api/institutions.ts` (既に`deleteInstitution`関数は追加済み)
- `apps/backend/src/modules/institution/presentation/controllers/institution.controller.ts`

**注意**: Repositoryには`delete`メソッドが実装済みですが、Controllerにエンドポイントがありません。

---

### 3. テストコードの作成

**状態**: 🔴 未実装  
**優先度**: 高  
**カバレッジ**: 0% (目標: 80%以上)

**実装内容**:

#### 3-1. ユニットテスト

- [ ] `apps/frontend/src/app/banks/page.tsx`のテスト
- [ ] `apps/frontend/src/components/institutions/InstitutionList.tsx`のテスト
  - データ取得のテスト
  - エラーハンドリングのテスト
  - リフレッシュ機能のテスト
- [ ] `apps/frontend/src/components/institutions/InstitutionCard.tsx`のテスト
  - 表示内容のテスト
  - 同期機能のテスト
  - 編集ボタンのテスト
  - 削除ボタンのテスト
- [ ] `apps/frontend/src/components/institutions/DeleteConfirmModal.tsx`のテスト
  - モーダル表示のテスト
  - 確認/キャンセルボタンのテスト
- [ ] `apps/frontend/src/lib/api/sync.ts`のテスト
  - API呼び出しのテスト
  - エラーハンドリングのテスト

#### 3-2. E2Eテスト

- [ ] 金融機関一覧画面の表示テスト
- [ ] 金融機関の同期機能テスト
- [ ] 削除確認モーダルのテスト
- [ ] 編集機能のテスト（編集機能実装後）

**現在のカバレッジ**:

- すべてのファイル: **0%**

**関連ファイル**:

- `apps/frontend/src/app/banks/page.tsx`
- `apps/frontend/src/components/institutions/InstitutionList.tsx`
- `apps/frontend/src/components/institutions/InstitutionCard.tsx`
- `apps/frontend/src/components/institutions/DeleteConfirmModal.tsx`
- `apps/frontend/src/lib/api/sync.ts`

---

### 4. エラーハンドリングのUI実装

**状態**: 🟡 部分実装（ログ出力のみ）  
**優先度**: 中  
**実装場所**:

- `apps/frontend/src/components/institutions/InstitutionCard.tsx` (107行目)

**実装内容**:

- [ ] 同期エラー時のエラーメッセージ表示
- [ ] 削除エラー時のエラーメッセージ表示
- [ ] データ取得エラー時のエラーメッセージ表示（`InstitutionList`）

**現在の状態**:

```typescript
// InstitutionCard.tsx (107行目)
// TODO: エラーメッセージを表示
// エラーハンドリングは別Issueで実装予定
if (error instanceof Error) {
  console.error('同期処理中にエラーが発生しました:', error);
}
```

**関連ファイル**:

- `apps/frontend/src/components/institutions/InstitutionCard.tsx`
- `apps/frontend/src/components/institutions/InstitutionList.tsx`

---

### 5. 削除確認モーダルの取引履歴選択UI

**状態**: 🔴 未実装  
**優先度**: 中  
**実装場所**:

- `apps/frontend/src/components/institutions/DeleteConfirmModal.tsx` (67行目)

**実装内容**:

- [ ] 取引履歴の扱いを選択するUI要素（ラジオボタンまたはドロップダウン）
  - オプション1: 取引履歴も削除
  - オプション2: 取引履歴は保持
- [ ] 選択したオプションを削除APIに渡す実装

**現在の状態**:

```typescript
// DeleteConfirmModal.tsx (67行目)
{
  /* TODO: 取引履歴の扱いを選択するUI要素を実装（別Issueで実装予定） */
}
```

**関連ファイル**:

- `apps/frontend/src/components/institutions/DeleteConfirmModal.tsx`

---

## 📊 実装状況サマリー

| タスク                  | 状態        | 優先度 | 見積時間 |
| ----------------------- | ----------- | ------ | -------- |
| 1. 金融機関編集機能     | 🔴 未実装   | 高     | 4-6時間  |
| 2. 金融機関削除機能     | 🔴 未実装   | 高     | 3-4時間  |
| 3. テストコード作成     | 🔴 未実装   | 高     | 6-8時間  |
| 4. エラーハンドリングUI | 🟡 部分実装 | 中     | 2-3時間  |
| 5. 取引履歴選択UI       | 🔴 未実装   | 中     | 1-2時間  |

**合計見積時間**: 16-23時間

---

## 🎯 実装優先順位

### Phase 1: 必須機能（高優先度）

1. **金融機関削除機能**（バックエンドAPI + フロントエンド連携）
   - バックエンドAPIが未実装のため、最優先で実装
   - 削除確認モーダルは既に実装済み

2. **テストコード作成**
   - カバレッジ0%のため、品質保証の観点から重要
   - 目標: 80%以上のカバレッジ

### Phase 2: 機能拡張（中優先度）

3. **金融機関編集機能**
   - ユーザビリティ向上のため重要
   - バックエンドAPIの実装が必要

4. **エラーハンドリングUI**
   - ユーザー体験向上のため実装推奨
   - 現在はログ出力のみ

5. **取引履歴選択UI**
   - 削除機能実装時に合わせて実装

---

## 📝 関連Issue

- Issue #114: E-8: 金融機関設定画面の実装（本Issue）
- テスト実装: 別Issueで実装予定
- 編集機能: 別Issueで実装予定
- 削除機能: 別Issueで実装予定

---

## 🔗 関連ドキュメント

- [カバレッジレポート](../testing/coverage-report.md)
- [PR #349](https://github.com/kencom2400/account-book/pull/349)

---

**最終更新**: 2025-12-04
