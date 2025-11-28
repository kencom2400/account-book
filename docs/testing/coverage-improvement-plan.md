# テストカバレッジ向上計画

> **作成日**: 2025-11-28  
> **関連Issue**: #308  
> **前提**: Issue #307完了（モジュール別カバレッジレポート作成済み）

## 📋 概要

現在のテストカバレッジを以下の目標まで向上させる計画です。

### 目標

| 対象            | 現在   | 目標        | 優先度     |
| --------------- | ------ | ----------- | ---------- |
| Backend (Unit)  | 35.89% | **80%以上** | **最優先** |
| Frontend (Unit) | 47.92% | **80%以上** | **最優先** |

**重要**: すべてのモジュールで70%以上を達成すること。

## 🎯 フェーズ1: Unitテスト - モジュール別70%達成（最優先）

### Backend - 優先順位付き実装計画

#### 🔴 Phase 1.1: High Priority（<30%, 最優先）

| No. | モジュール | 現在   | 目標 | ギャップ | 実装順 | 期間 |
| --- | ---------- | ------ | ---- | -------- | ------ | ---- |
| 1   | securities | 22.27% | 70%  | +47.73%  | 1番目  | 2日  |
| 2   | health     | 28.50% | 70%  | +41.50%  | 2番目  | 1日  |

**実装方針**:

- `securities`: Use Cases（証券取引、ポートフォリオ計算）を優先
- `health`: ヘルスチェックエンドポイント、DB接続確認

#### 🟡 Phase 1.2: Medium Priority（30-50%）

| No. | モジュール  | 現在   | 目標 | ギャップ | 実装順 | 期間 |
| --- | ----------- | ------ | ---- | -------- | ------ | ---- |
| 3   | transaction | 30.39% | 70%  | +39.61%  | 3番目  | 3日  |
| 4   | institution | 34.28% | 70%  | +35.72%  | 4番目  | 2日  |
| 5   | credit-card | 47.71% | 70%  | +22.29%  | 5番目  | 2日  |
| 6   | sync        | 47.47% | 70%  | +22.53%  | 6番目  | 2日  |

**実装方針**:

- `transaction`: Use Cases（取引作成、更新、分類）、バリデーション
- `institution`: 金融機関接続、認証、API統合
- `credit-card`: カード取引管理、引き落とし突合
- `sync`: データ同期ロジック、スケジューリング

#### 🟢 Phase 1.3: Low Priority（50%以上）

| No. | モジュール | 現在   | 目標 | ギャップ | 実装順 | 期間 |
| --- | ---------- | ------ | ---- | -------- | ------ | ---- |
| 7   | category   | 52.76% | 70%  | +17.24%  | 7番目  | 1日  |

**実装方針**:

- `category`: カテゴリ分類ロジック、ルールエンジン

**Backend Phase 1 合計期間**: 約13日

### Frontend - 優先順位付き実装計画

#### 🔴 Phase 1.4: High Priority（<30%, 最優先）

| No. | モジュール | 現在   | 目標 | ギャップ | 実装順 | 期間 |
| --- | ---------- | ------ | ---- | -------- | ------ | ---- |
| 8   | app        | 0.00%  | 70%  | +70.00%  | 8番目  | 3日  |
| 9   | lib        | 16.96% | 70%  | +53.04%  | 9番目  | 3日  |

**実装方針**:

- `app`: Next.jsページコンポーネント（データフェッチング、レンダリング）
- `lib`: APIクライアント関数、エラーハンドリング

#### 🟡 Phase 1.5: Medium Priority（30-50%）

| No. | モジュール | 現在   | 目標 | ギャップ | 実装順 | 期間 |
| --- | ---------- | ------ | ---- | -------- | ------ | ---- |
| 10  | stores     | 43.14% | 70%  | +26.86%  | 10番目 | 2日  |

**実装方針**:

- `stores`: Zustand store（アクション、セレクタ、ミドルウェア）

#### 🟢 Phase 1.6: Low Priority（50%以上）

| No. | モジュール | 現在   | 目標 | ギャップ | 実装順 | 期間 |
| --- | ---------- | ------ | ---- | -------- | ------ | ---- |
| 11  | components | 63.04% | 70%  | +6.96%   | 11番目 | 1日  |
| 12  | utils      | 88.89% | 70%  | -18.89%  | -      | -    |

**実装方針**:

- `components`: 未テストのコンポーネント（条件分岐、エッジケース）
- `utils`: 既に88.89%達成のため、対応不要

**Frontend Phase 1 合計期間**: 約9日

**Phase 1（モジュール別70%達成）合計期間**: **約22日（3-4週間）**

## 🎯 フェーズ2: Unitテスト - 全体80%達成

### Phase 2: 全体カバレッジ80%達成

**前提条件**: すべてのモジュールが70%達成済み

| No. | 対象            | 現在（予想） | 目標 | 実装順 | 期間 |
| --- | --------------- | ------------ | ---- | ------ | ---- |
| 13  | Backend (Unit)  | 70%          | 80%  | 13番目 | 3日  |
| 14  | Frontend (Unit) | 70%          | 80%  | 14番目 | 3日  |

**実装方針**:

- 重要度の高いコードを追加カバー
- 複雑な条件分岐、エラーハンドリング
- 統合的なテストケース

**Phase 2 合計期間**: **約6日（1週間）**

## 🎯 フェーズ3: E2Eテスト - ルート網羅

### Phase 3.1: Backend E2E - 実装済みAPIルート網羅

**目標**: すべての実装済みAPIエンドポイントをテスト（カバレッジ数値は気にしない）

| No. | モジュール  | 実装済みルート数（推定） | 実装順 | 期間 |
| --- | ----------- | ------------------------ | ------ | ---- |
| 15  | transaction | 10ルート                 | 15番目 | 2日  |
| 16  | category    | 8ルート                  | 16番目 | 2日  |
| 17  | institution | 6ルート                  | 17番目 | 1日  |
| 18  | credit-card | 8ルート                  | 18番目 | 2日  |
| 19  | securities  | 6ルート                  | 19番目 | 1日  |
| 20  | sync        | 4ルート                  | 20番目 | 1日  |
| 21  | health      | 2ルート                  | 21番目 | 1日  |

**実装方針**:

- 正常系: 期待通りのレスポンス
- 異常系: バリデーションエラー、認証エラー
- エッジケース: 境界値、NULL値

**Phase 3.1 合計期間**: **約10日（2週間）**

### Phase 3.2: Frontend E2E - 主要ユーザーフロー網羅

**目標**: 実装済みの主要なユーザーフローをテスト（カバレッジ数値は気にしない）

| No. | フロー                 | 実装順 | 期間 |
| --- | ---------------------- | ------ | ---- |
| 22  | 銀行連携追加           | 22番目 | 2日  |
| 23  | 取引一覧表示・フィルタ | 23番目 | 2日  |
| 24  | サブカテゴリ分類       | 24番目 | 2日  |
| 25  | ダッシュボード表示     | 25番目 | 1日  |
| 26  | クレジットカード管理   | 26番目 | 2日  |
| 27  | 証券取引管理           | 27番目 | 2日  |

**実装方針**:

- ハッピーパス: 正常な操作フロー
- エラーハンドリング: エラー発生時の挙動
- エッジケース: 空データ、大量データ

**Phase 3.2 合計期間**: **約11日（2週間）**

**Phase 3（E2Eテスト）合計期間**: **約21日（3-4週間）**

## 📊 全体スケジュール

| フェーズ | 内容                         | 期間     | 累積期間  |
| -------- | ---------------------------- | -------- | --------- |
| Phase 1  | Unitテスト - モジュール別70% | 22日     | 22日      |
| Phase 2  | Unitテスト - 全体80%         | 6日      | 28日      |
| Phase 3  | E2Eテスト - ルート網羅       | 21日     | 49日      |
| **合計** |                              | **49日** | **7週間** |

### マイルストーン

- **Week 1-2**: Backend High Priority完了（securities, health）
- **Week 3-4**: Backend Medium Priority完了（transaction, institution, credit-card, sync）
- **Week 4**: Backend Low Priority完了（category）
- **Week 5**: Frontend High Priority完了（app, lib）
- **Week 6**: Frontend Medium/Low Priority完了（stores, components）
- **Week 6**: Phase 2完了（全体80%達成）
- **Week 7-9**: Phase 3完了（E2Eテスト網羅）

## 📋 実装手順

### ステップ1: モジュール別テスト追加（Phase 1）

各モジュールについて以下を実行：

1. **現状確認**

   ```bash
   # Backendの場合
   cd apps/backend
   pnpm test:cov
   # HTMLレポートを開く: apps/backend/coverage/lcov-report/index.html

   # Frontendの場合
   cd apps/frontend
   pnpm test -- --coverage
   # HTMLレポートを開く: apps/frontend/coverage/lcov-report/index.html
   ```

2. **未カバーコードの特定**
   - HTMLレポートで未カバーの行を確認
   - 優先度順にテストケースを作成

3. **テストケース追加**
   - Use Cases（Backend）/ Custom Hooks（Frontend）を優先
   - バリデーション、エラーハンドリングをカバー
   - エッジケースを追加

4. **カバレッジ再計測**

   ```bash
   pnpm test:cov  # Backend
   pnpm test -- --coverage  # Frontend
   ```

5. **70%達成確認**
   - モジュール別カバレッジレポートで確認
   - 70%未達成の場合は3に戻る

### ステップ2: 全体80%達成（Phase 2）

1. **全体カバレッジ確認**

   ```bash
   # Backend
   cd apps/backend
   pnpm test:cov
   # 全体レポートを確認

   # Frontend
   cd apps/frontend
   pnpm test -- --coverage
   # 全体レポートを確認
   ```

2. **80%未達成の場合**
   - 重要度の高いコードを特定
   - テストケースを追加
   - 80%達成まで繰り返し

### ステップ3: E2Eテスト実装（Phase 3）

#### Backend E2E

1. **ルートリストの作成**

   ```bash
   # すべてのコントローラーを確認
   find apps/backend/src -name "*.controller.ts"
   # 各コントローラーのルートをリストアップ
   ```

2. **エンドポイントごとにテストケース作成**

   ```bash
   # E2Eテストファイルを作成
   touch apps/backend/test/[module].e2e-spec.ts
   ```

3. **テスト実装**
   - 正常系: 期待通りのレスポンス
   - 異常系: バリデーションエラー、認証エラー
   - エッジケース: 境界値、NULL値

4. **カバレッジ確認**
   ```bash
   cd apps/backend
   pnpm test:e2e:cov
   # HTMLレポートを確認: apps/backend/coverage-e2e/lcov-report/index.html
   ```

#### Frontend E2E

1. **主要フローのリストアップ**
   - 実装済みの画面・機能を確認
   - ユーザーフローを定義

2. **フローごとにテストケース作成**

   ```bash
   # E2Eテストファイルを作成
   touch apps/frontend/e2e/[flow-name].spec.ts
   ```

3. **テスト実装**
   - ハッピーパス: 正常な操作フロー
   - エラーハンドリング: エラー発生時の挙動
   - エッジケース: 空データ、大量データ

4. **テスト実行**
   ```bash
   cd apps/frontend
   pnpm test:e2e
   ```

### ステップ4: CI/CDへの統合

1. **カバレッジ閾値の設定**

   ```javascript
   // apps/backend/package.json または jest.config.js
   {
     "jest": {
       "coverageThreshold": {
         "global": {
           "branches": 80,
           "functions": 80,
           "lines": 80,
           "statements": 80
         },
         "./src/modules/category/**/*.ts": {
           "branches": 70,
           "functions": 70,
           "lines": 70,
           "statements": 70
         },
         "./src/modules/credit-card/**/*.ts": {
           "branches": 70,
           "functions": 70,
           "lines": 70,
           "statements": 70
         },
         "./src/modules/health/**/*.ts": {
           "branches": 70,
           "functions": 70,
           "lines": 70,
           "statements": 70
         },
         "./src/modules/institution/**/*.ts": {
           "branches": 70,
           "functions": 70,
           "lines": 70,
           "statements": 70
         },
         "./src/modules/securities/**/*.ts": {
           "branches": 70,
           "functions": 70,
           "lines": 70,
           "statements": 70
         },
         "./src/modules/sync/**/*.ts": {
           "branches": 70,
           "functions": 70,
           "lines": 70,
           "statements": 70
         },
         "./src/modules/transaction/**/*.ts": {
           "branches": 70,
           "functions": 70,
           "lines": 70,
           "statements": 70
         }
       }
     }
   }
   ```

   ```javascript
   // apps/frontend/jest.config.js
   module.exports = {
     // ... 既存の設定
     coverageThreshold: {
       global: {
         branches: 80,
         functions: 80,
         lines: 80,
         statements: 80,
       },
       './src/app/**/*.{ts,tsx}': {
         branches: 70,
         functions: 70,
         lines: 70,
         statements: 70,
       },
       './src/components/**/*.{ts,tsx}': {
         branches: 70,
         functions: 70,
         lines: 70,
         statements: 70,
       },
       './src/lib/**/*.ts': {
         branches: 70,
         functions: 70,
         lines: 70,
         statements: 70,
       },
       './src/stores/**/*.ts': {
         branches: 70,
         functions: 70,
         lines: 70,
         statements: 70,
       },
       './src/utils/**/*.ts': {
         branches: 70,
         functions: 70,
         lines: 70,
         statements: 70,
       },
     },
   };
   ```

2. **CIでカバレッジチェックを実行**

   ```yaml
   # .github/workflows/ci.yml
   - name: Run Unit Tests with Coverage
     run: pnpm test:cov

   - name: Check Coverage Threshold
     run: |
       if [ $(jq '.total.lines.pct' < coverage/coverage-summary.json | cut -d. -f1) -lt 80 ]; then
         echo "❌ Coverage is below 80%"
         exit 1
       fi
   ```

3. **カバレッジレポートのアップロード**
   ```yaml
   - name: Upload Coverage to Codecov
     uses: codecov/codecov-action@v4
     with:
       files: ./apps/backend/coverage/lcov.info,./apps/frontend/coverage/lcov.info
       flags: unittests
       fail_ci_if_error: true
   ```

## ✅ 受け入れ基準

### Phase 1（必須）

- [ ] Backend: すべてのモジュールで70%以上達成
  - [ ] securities: 70%以上
  - [ ] health: 70%以上
  - [ ] transaction: 70%以上
  - [ ] institution: 70%以上
  - [ ] credit-card: 70%以上
  - [ ] sync: 70%以上
  - [ ] category: 70%以上
- [ ] Frontend: すべてのモジュールで70%以上達成
  - [ ] app: 70%以上
  - [ ] lib: 70%以上
  - [ ] stores: 70%以上
  - [ ] components: 70%以上
  - [ ] utils: 70%以上（既に達成）

### Phase 2（必須）

- [ ] Backend Unit テスト: 全体80%以上
- [ ] Frontend Unit テスト: 全体80%以上
- [ ] すべての新規追加テストがパスする
- [ ] 既存テストに影響がない

### Phase 3（推奨）

- [ ] Backend E2E: すべての実装済みAPIルートをテスト
- [ ] Frontend E2E: 主要なユーザーフローをテスト

## 📝 進捗管理

### 週次レビュー

毎週、以下を確認：

1. カバレッジレポートの更新
2. モジュール別カバレッジの確認
3. 70%未達成モジュールの特定
4. 次週の優先タスク決定

### Sub-Issue作成

各モジュールごとにSub-Issueを作成し、進捗を管理：

- [ ] #308-1: Backend securities モジュール 70%達成
- [ ] #308-2: Backend health モジュール 70%達成
- [ ] #308-3: Backend transaction モジュール 70%達成
- [ ] #308-4: Backend institution モジュール 70%達成
- [ ] #308-5: Backend credit-card モジュール 70%達成
- [ ] #308-6: Backend sync モジュール 70%達成
- [ ] #308-7: Backend category モジュール 70%達成
- [ ] #308-8: Frontend app モジュール 70%達成
- [ ] #308-9: Frontend lib モジュール 70%達成
- [ ] #308-10: Frontend stores モジュール 70%達成
- [ ] #308-11: Frontend components モジュール 70%達成
- [ ] #308-12: Backend Unit 全体 80%達成
- [ ] #308-13: Frontend Unit 全体 80%達成
- [ ] #308-14: Backend E2E ルート網羅
- [ ] #308-15: Frontend E2E フロー網羅

## 🔗 関連リンク

- **Issue**: #308
- **モジュール別カバレッジレポート**:
  - Backend: `docs/testing/module-coverage/backend.md`
  - Frontend: `docs/testing/module-coverage/frontend.md`
- **カバレッジ履歴**: `docs/testing/coverage-history.md`
- **カバレッジ使用ガイド**: `docs/testing/coverage-usage-guide.md`
