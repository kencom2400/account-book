# GitHub Project上でのEpic管理ガイド

## 📋 現在の状況

### ✅ 完了したフェーズ

- **Phase 1**: Epicリストの作成 ✅
- **Phase 2**: GitHub Issueの一覧取得 ✅
- **Epic作成**: 16個のEpic Issue作成完了 (#181-#196) ✅
- **Project登録**: 全EpicをProject #1に追加完了 ✅

### 🎯 次のフェーズ

- **Phase 3**: Epicと既存Issueの紐付け
- **Phase 4**: 追加で必要なEpicの洗い出し
- **Phase 5**: 追加Epicの作成
- **Phase 6**: 追加Epicへの既存Issue紐付け

---

## 🔗 Phase 3: Epicと既存Issueの紐付け

### 作業概要

各Epicに関連する既存IssueをEpicのサブタスクとして紐付けます。

### 作業方法

#### 方法1: GitHub Project UI（推奨）

1. **Projectにアクセス**
   - https://github.com/users/kencom2400/projects/1

2. **Epicビューを作成**
   - 左上の「View」から「New view」をクリック
   - 「Board」または「Table」を選択
   - フィルター: `label:epic`を設定
   - 名前: "Epics"として保存

3. **各Epicに対して関連Issueを紐付け**

   各Epicの説明文に記載されている関連Issue（チェックボックス）を確認し、以下の方法で紐付けます：

   **方法A: Issue Description内で`- [ ] #番号`形式で列挙（現在採用）**
   - 既に各Epic Issueの説明文に関連Issueが列挙されています
   - これらのチェックボックスをチェックすることで進捗を管理できます

   **方法B: GitHub Projects の「Tracks」機能を使用**
   1. Projectでissueを選択
   2. 右側のパネルで「Tracks」セクションを開く
   3. 「Add tracked by」で親Epic (#181-#196) を選択
   4. これにより、Epic配下にIssueが階層化されます

   **方法C: Issue本文に「Epic: #番号」を追記**
   1. 各関連IssueのDescriptionを編集
   2. 最上部に`**Epic**: #<Epic番号>`を追記
   3. これにより、どのEpicに属するかが明確になります

#### 方法2: GitHub CLI + スクリプト（自動化）

以下のスクリプトを使用して、各Issueに対応するEpic番号を本文に自動追記できます：

```bash
# 例: FR-001〜007関連のIssueにEPIC-002を紐付け
cd /Users/kencom/github/account-book
./scripts/github/link-issues-to-epic.sh 182 47 48 49 50 51 52 53
```

---

## 📊 Epic と 関連Issue のマッピング

### EPIC-001: #181 - 基盤構築

**Status**: ✅ Completed  
**関連Issue**:

- #138 [TASK] GitHub環境構築と全Issue詳細化の完了

### EPIC-002: #182 - データ取得機能

**Status**: 🔴 Pending  
**関連Issue**:

- #47 [FEATURE] FR-001: 銀行口座との連携機能
- #48 [FEATURE] FR-002: クレジットカードとの連携機能
- #49 [FEATURE] FR-003: 証券会社との連携機能
- #50 [FEATURE] FR-004: 連携状態の確認機能
- #51 [FEATURE] FR-005: 連携失敗時の通知機能
- #52 [FEATURE] FR-006: 取引データの自動取得機能
- #53 [FEATURE] FR-007: JSONファイルへのデータ保存

### EPIC-003: #183 - データ分類機能

**Status**: 🔴 Pending  
**関連Issue**:

- #55 [FEATURE] FR-008: 5種類のカテゴリ分類機能
- #56 [FEATURE] FR-009: 詳細費目分類機能
- #57 [FEATURE] FR-010: 費目の手動修正機能
- #58 [FEATURE] FR-011: 費目の追加・編集・削除機能
- #110 [TASK] E-4: 費目編集画面の実装

### EPIC-004: #184 - クレジットカード管理

**Status**: 🔴 Pending  
**関連Issue**:

- #59 [FEATURE] FR-012: クレジットカード利用明細の月別集計
- #60 [FEATURE] FR-013: 銀行引落額との自動照合機能
- #61 [FEATURE] FR-014: 支払いステータス管理機能
- #62 [FEATURE] FR-015: 不一致時のアラート表示
- #113 [TASK] E-7: クレジットカード管理画面の実装

### EPIC-005: #185 - 集計・分析機能

**Status**: 🔴 Pending  
**関連Issue**:

- #63 [FEATURE] FR-016: 月別収支集計機能
- #64 [FEATURE] FR-017: 金融機関別集計機能
- #65 [FEATURE] FR-018: カテゴリ別集計機能
- #66 [FEATURE] FR-019: 費目別集計機能
- #67 [FEATURE] FR-020: 年間収支推移表示機能
- #68 [FEATURE] FR-021: イベントメモ機能
- #69 [FEATURE] FR-022: イベントと収支の紐付け機能
- #111 [TASK] E-5: 月次レポート画面の実装
- #112 [TASK] E-6: 年次レポート画面の実装

### EPIC-006: #186 - 可視化機能

**Status**: 🔴 Pending  
**関連Issue**:

- #54 [FEATURE] FR-025: カテゴリ別円グラフ表示
- #70 [FEATURE] FR-023: 月間収支グラフ表示
- #71 [FEATURE] FR-024: 年間収支グラフ表示
- #72 [FEATURE] FR-025: カテゴリ別円グラフ表示
- #73 [FEATURE] FR-026: 金融機関別資産残高表示
- #74 [FEATURE] FR-027: 収支推移のトレンド表示
- #116 [TASK] E-10: グラフコンポーネントの実装

### EPIC-007: #187 - 設定機能

**Status**: 🔴 Pending  
**関連Issue**:

- #75 [FEATURE] FR-028: 金融機関の登録・編集・削除機能
- #76 [FEATURE] FR-029: 同期設定機能
- #77 [FEATURE] FR-030: 表示設定機能
- #78 [FEATURE] FR-031: データエクスポート機能
- #114 [TASK] E-8: 金融機関設定画面の実装
- #115 [TASK] E-9: 同期設定画面の実装

### EPIC-008: #188 - セキュリティ強化

**Status**: 🔴 Pending  
**関連Issue**:

- #79 [TASK] C-1: 認証情報の暗号化保存
- #80 [TASK] C-2: HTTPS通信の実装
- #81 [TASK] C-3: 環境変数による秘匿情報管理
- #82 [TASK] C-4: CSRF対策の実装
- #83 [TASK] C-5: XSS対策の実装
- #105 [TASK] D-13: セキュリティテスト実装

### EPIC-009: #189 - パフォーマンス最適化

**Status**: 🔴 Pending  
**関連Issue**:

- #84 [TASK] C-6: アプリ起動時間の最適化
- #85 [TASK] C-7: データ同期処理のバックグラウンド化
- #86 [TASK] C-8: 大量データの表示パフォーマンス最適化
- #104 [TASK] D-12: パフォーマンステスト実装
- #126 [TASK] F-5: パフォーマンステストとチューニング

### EPIC-010: #190 - Frontend実装

**Status**: 🟡 In Progress  
**関連Issue**:

- #107 [TASK] E-1: ダッシュボード画面の実装
- #108 [TASK] E-2: 取引履歴一覧画面の実装
- #109 [TASK] E-3: 取引詳細画面の実装
- #110 [TASK] E-4: 費目編集画面の実装
- #111 [TASK] E-5: 月次レポート画面の実装
- #112 [TASK] E-6: 年次レポート画面の実装
- #113 [TASK] E-7: クレジットカード管理画面の実装
- #114 [TASK] E-8: 金融機関設定画面の実装
- #115 [TASK] E-9: 同期設定画面の実装
- #116 [TASK] E-10: グラフコンポーネントの実装
- #117 [TASK] E-11: 共通UIコンポーネントライブラリ構築
- #118 [TASK] E-12: ローディング・スケルトンUI実装
- #119 [TASK] E-13: エラー表示UI実装
- #120 [TASK] E-14: ダークモードの実装
- #121 [TASK] E-15: アクセシビリティ対応
- #92 [TASK] C-14: レスポンシブデザインの実装

### EPIC-011: #191 - Backend実装

**Status**: 🟡 In Progress  
**関連Issue**:

- #37 [TASK] B-10: Repositoryパターン実装
- #38 [TASK] B-11: UseCaseレイヤー実装
- #39 [TASK] B-12: REST APIエンドポイント実装
- #40 [TASK] B-13: バリデーション実装
- #41 [TASK] B-14: エラーハンドリング実装
- #88 [TASK] C-10: エラーハンドリング統一化
- #89 [TASK] C-11: ロギング機能の実装
- #90 [TASK] C-12: レイヤー分離の徹底
- #91 [TASK] C-13: API仕様書の自動生成
- #127 [TASK] G-1: API仕様書の整備

### EPIC-012: #192 - テスト実装

**Status**: 🟡 In Progress  
**関連Issue**:

- #93 [TASK] D-1: Backendユニットテスト環境構築
- #94 [TASK] D-2: Frontendユニットテスト環境構築
- #95 [TASK] D-3: Domain層ユニットテスト
- #96 [TASK] D-4: Application層ユニットテスト
- #97 [TASK] D-5: Reactコンポーネントテスト
- #98 [TASK] D-6: APIエンドポイント統合テスト
- #99 [TASK] D-7: Repository統合テスト
- #100 [TASK] D-8: E2Eテストシナリオ作成
- #101 [TASK] D-9: E2Eテスト実装
- #102 [TASK] D-10: テスト自動化スクリプト作成
- #103 [TASK] D-11: テストフィクスチャ整備
- #104 [TASK] D-12: パフォーマンステスト実装
- #105 [TASK] D-13: セキュリティテスト実装
- #106 [TASK] D-14: テストカバレッジ80%達成
- #167 [testing] E2Eテストの完全実装 (CLOSED) ✅

### EPIC-013: #193 - データ永続化基盤

**Status**: 🟡 In Progress  
**関連Issue**:

- #122 [TASK] F-1: TypeORMセットアップ
- #123 [TASK] F-2: データベーススキーマ設計
- #124 [TASK] F-3: マイグレーションスクリプト作成
- #125 [TASK] F-4: Repository実装のDB対応
- #126 [TASK] F-5: パフォーマンステストとチューニング
- #165 [infrastructure] JSONファイルからMySQL + Dockerへのデータ永続化基盤の移行 (OPEN)
- #166 [infrastructure] 開発環境のDocker化 (CLOSED) ✅

### EPIC-014: #194 - ドキュメント整備

**Status**: 🔴 Pending  
**関連Issue**:

- #127 [TASK] G-1: API仕様書の整備
- #128 [TASK] G-2: コンポーネント仕様書の整備
- #129 [TASK] G-3: デプロイ手順書の作成
- #130 [TASK] G-4: トラブルシューティングガイド作成
- #133 [TASK] G-7: READMEの最終更新
- #140 [docs] Geminiコードレビュー指摘事項への対応 (CLOSED) ✅

### EPIC-015: #195 - インフラ・運用整備

**Status**: 🟡 In Progress  
**関連Issue**:

- #131 [TASK] G-5: 運用監視の仕組み構築
- #132 [TASK] G-6: バックアップ・リストア手順整備
- #165 [infrastructure] JSONファイルからMySQL + Dockerへのデータ永続化基盤の移行 (OPEN)
- #166 [infrastructure] 開発環境のDocker化 (CLOSED) ✅
- #176 [infra] 初回環境セットアップスクリプトの作成 (OPEN)

### EPIC-016: #196 - 将来拡張機能

**Status**: 🔵 Future  
**関連Issue**:

- #134 [ENHANCEMENT] H-1: 予算設定機能
- #135 [ENHANCEMENT] H-2: AIによる支出予測機能
- #136 [ENHANCEMENT] H-3: レシート自動読取機能
- #137 [ENHANCEMENT] H-4: マルチユーザー対応

---

## 🛠️ Phase 3の作業手順（Project UI推奨）

### ステップ1: Epicビューの作成

1. Project URLにアクセス: https://github.com/users/kencom2400/projects/1
2. 左上「+ New view」をクリック
3. 「Board」を選択
4. フィルター設定:
   - `label:epic` を追加
   - または `is:open label:epic` で未完了のEpicのみ表示
5. View名を「Epics」として保存

### ステップ2: 各Epicへの関連Issue紐付け

#### オプションA: Issue Description内のチェックボックスで管理（現状）

各Epic Issueの説明文には、既に関連Issueがチェックボックス形式で列挙されています。

**利点**:

- 各Epic Issueを開くだけで進捗が一目で分かる
- チェックボックスをチェックするだけで進捗管理ができる

**実施方法**:

1. 各Epic Issue (#181-#196) を開く
2. 関連Issueが完了したら、該当のチェックボックスにチェックを入れる
3. すべてのチェックボックスがチェックされたら、Epicを完了とする

#### オプションB: GitHub Projects の「Tracked by」機能で階層化

GitHub Projects (Beta) の機能を使って、親子関係を明示的に設定できます。

**実施方法**:

1. Projectで子Issue（例: #47）を選択
2. 右側パネルで「Tracked by」を開く
3. 親Epic（例: #182）を選択
4. これにより、Project上でEpic配下にIssueが階層表示されます

#### オプションC: 各IssueにEpic番号を記載

各関連IssueのDescriptionに、所属するEpicを明記します。

**スクリプトで一括実施**:

```bash
# 例: FR-001〜007のIssueに「Epic: #182」を追記
cd /Users/kencom/github/account-book
./scripts/github/link-issues-to-epic.sh
```

---

## 📌 Phase 4: 追加で必要なEpicの洗い出し

### 確認すべき観点

Phase 3でIssueを紐付けながら、以下の観点で追加Epicが必要か確認します：

1. **紐付けられないIssueの存在**
   - どのEpicにも属さないIssueがある場合、新たなEpicが必要

2. **Epicの粒度が大きすぎる**
   - 1つのEpicに20個以上のIssueが紐付く場合、分割を検討

3. **新たな機能カテゴリの発見**
   - 開発を進める中で、新たな機能群が必要になった場合

### 追加Epicの候補（現時点）

現状、16個のEpicでほぼすべてのIssueをカバーできていますが、以下の観点で追加を検討する余地があります：

- **EPIC-017**: オフラインモード対応
  - #87 [TASK] C-9: オフラインモードの実装
- **EPIC-018**: CI/CD強化
  - CI/CD関連のIssueをまとめる

---

## 🎯 推奨アクション

### 今すぐ実施

1. **Projectにアクセス**

   ```
   https://github.com/users/kencom2400/projects/1
   ```

2. **Epicビューを作成**
   - フィルター: `label:epic`
   - 16個のEpicが表示されることを確認

3. **各Epicの進捗を確認**
   - 各Epic Issueを開き、関連Issueのチェックボックスを確認
   - 完了済みのIssueにチェックを入れる

### 継続的に実施

- Issue完了時に、対応するEpic内のチェックボックスをチェック
- すべてのチェックボックスが完了したら、Epicを Close
- 新たなIssue作成時に、対応するEpicを明記

---

## 📊 進捗の可視化

### Epicごとの進捗率

Project上でカスタムフィールドを追加することで、進捗率を自動計算できます：

1. Projectの「Settings」→「Custom fields」
2. 「Add field」→「Iteration」または「Number」
3. フィールド名: "Progress (%)"
4. 各Epicに対して、手動で進捗率を入力

または、GitHub Actionsで自動更新するワークフローを作成することも可能です。

---

## 🔗 関連リソース

- [GitHub Projects公式ドキュメント](https://docs.github.com/ja/issues/planning-and-tracking-with-projects)
- [Epic管理のベストプラクティス](https://docs.github.com/ja/issues/planning-and-tracking-with-projects/learning-about-projects/best-practices-for-projects)
- 本プロジェクトのEpicリスト: `docs/epic-list.md`

---

**最終更新**: 2025-11-19  
**Project URL**: https://github.com/users/kencom2400/projects/1
