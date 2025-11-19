# GitHub Projects でのEpic階層化設定ガイド

## 🎯 目的

GitHub Projects上で、各IssueをEpicのsub-issueとして階層化し、親子関係を明確にします。

## ❗ 重要な注意

**[2025-11-19 更新]** GitHub GraphQL APIの`addSubIssue` mutationを使用することで、プログラムによるsub-issue設定が可能であることが判明しました。

このガイドは、GraphQL APIを使用せずに手動でUI操作を行う場合の手順を記載しています。
API経由での自動設定については、`scripts/github/setup-all-epic-subissues.sh`を参照してください。

## 📋 現在の状態

**[2025-11-19 更新]** 全てのEpic-Subissue関係の設定が完了しました。

✅ **完了していること**:

- 16個のEpic Issueを作成 (#181-196)
- 142個のIssueをEpicに紐付け（Description内に参照を追加）
- すべてのIssue・EpicをProject #1に追加
- **GraphQL APIを使用してすべてのEpic-Subissue関係を設定完了**

このガイドは、追加のIssueを手動でEpicに紐付ける必要がある場合の参考資料として残しています。

---

## 🛠️ 手動設定手順

### 方法1: Issue単位で設定（推奨）

#### ステップ1: Projectを開く

1. Projectにアクセス:

   ```
   https://github.com/users/kencom2400/projects/1
   ```

2. ビューを「Table」に切り替え（右上のビュー切替ボタン）

#### ステップ2: 各Issueに「Tracked by」を設定

1. Issueを1つクリック（例: #47）
2. 右側のサイドパネルが開く
3. 「Tracked by」セクションを見つける
4. 「+ Add tracked by」をクリック
5. 対応するEpic（例: #182）を検索して選択
6. 設定完了！

#### ステップ3: 繰り返し

すべてのIssueに対して、対応するEpicを設定します。

---

### 方法2: Epic側から設定（一括設定）

#### ステップ1: Epic Issueを開く

1. Epic Issue（例: #182）を開く
2. 右側のサイドパネルで「Tracks」セクションを見つける

#### ステップ2: 子Issueを追加

1. 「+ Add tracked issue」をクリック
2. 子Issue（例: #47, #48, #49...）を検索して追加
3. すべての関連Issueを追加

#### ステップ3: 繰り返し

すべてのEpic（#181-196）に対して、関連Issueを追加します。

---

## 📊 Epic別の子Issue一覧

以下のマッピングを参考に、各Epicに子Issueを設定してください：

### EPIC-001: #181 - 基盤構築

**子Issue**: #10, #138

### EPIC-002: #182 - データ取得機能

**子Issue**: #47, #48, #49, #50, #51, #52, #53, #22, #28

### EPIC-003: #183 - データ分類機能

**子Issue**: #55, #56, #57, #58, #110, #29, #30, #31, #32

### EPIC-004: #184 - クレジットカード管理

**子Issue**: #59, #60, #61, #62, #113, #33, #34, #35, #36, #42, #43, #44

### EPIC-005: #185 - 集計・分析機能

**子Issue**: #63, #64, #65, #66, #67, #68, #69, #111, #112, #45, #46

### EPIC-006: #186 - 可視化機能

**子Issue**: #54, #70, #71, #72, #73, #74, #116

### EPIC-007: #187 - 設定機能

**子Issue**: #75, #76, #77, #78, #114, #115

### EPIC-008: #188 - セキュリティ強化

**子Issue**: #79, #80, #81, #82, #83, #105

### EPIC-009: #189 - パフォーマンス最適化

**子Issue**: #84, #85, #86, #104, #126, #87

### EPIC-010: #190 - Frontend実装

**子Issue**: #107, #108, #109, #110, #111, #112, #113, #114, #115, #116, #117, #118, #119, #120, #121, #92

### EPIC-011: #191 - Backend実装

**子Issue**: #37, #38, #39, #40, #41, #88, #89, #90, #91, #127

### EPIC-012: #192 - テスト実装

**子Issue**: #93, #94, #95, #96, #97, #98, #99, #100, #101, #102, #103, #104, #105, #106, #167

### EPIC-013: #193 - データ永続化基盤

**子Issue**: #122, #123, #124, #125, #126, #165, #166

### EPIC-014: #194 - ドキュメント整備

**子Issue**: #127, #128, #129, #130, #133, #140

### EPIC-015: #195 - インフラ・運用整備

**子Issue**: #131, #132, #165, #166, #176

### EPIC-016: #196 - 将来拡張機能

**子Issue**: #134, #135, #136, #137

---

## 🚀 効率的な設定方法

### 推奨アプローチ: Epic側から一括設定

1. **準備**: 上記のEpic別子Issue一覧をコピー
2. **Epic #182を開く**
3. 右側「Tracks」→「+ Add tracked issue」
4. Issue番号（47, 48, 49...）を1つずつ入力して追加
5. 次のEpic (#183) に移動して繰り返し

### 所要時間

- 1つのEpicあたり: 2-3分
- 全16Epic: 約30-45分

---

## ✅ 設定後の確認

### 確認1: Epic Issue内での表示

1. Epic Issue（例: #182）を開く
2. 「Tracks」セクションに子Issueが表示されているか確認
3. 進捗バー（例: "3 of 9 completed"）が表示されているか確認

### 確認2: Project内での階層表示

1. Projectを開く
2. Table viewで「Tracked by」列を追加
3. 各Issueの「Tracked by」列にEpic番号が表示されているか確認

### 確認3: 進捗の自動更新

1. 子Issueを1つClose
2. 対応するEpic Issueを開く
3. 進捗バーが更新されているか確認（例: "4 of 9 completed"）

---

## 💡 Tips

### 複数Issueの一括選択

残念ながら、GitHub Projects UIでは複数Issueを一括で「Tracked by」設定することはできません。
1つずつ設定する必要があります。

### 検索の活用

Epic側から設定する際、Issue番号で検索すると効率的です：

- 「#47」と入力 → 候補が表示される → Enter

### ブラウザのキーボードショートカット

- `Ctrl/Cmd + K`: コマンドパレットを開く
- 「Go to issue」で素早くIssueに移動可能

---

## 🔄 自動化の可能性

### GitHub Actions での自動化

将来的には、以下のような自動化が可能です：

```yaml
# .github/workflows/auto-link-epic.yml
name: Auto Link to Epic

on:
  issues:
    types: [opened, edited]

jobs:
  link-epic:
    runs-on: ubuntu-latest
    steps:
      - name: Extract Epic from body
        # Issue descriptionから Epic 番号を抽出
      - name: Set tracked by relationship
        # GraphQL APIで関係を設定
```

ただし、GitHub Projects (Beta) のGraphQL APIは複雑なため、
現時点では**手動設定を推奨**します。

---

## 📞 サポート

設定中に問題が発生した場合：

1. **GitHub Docsを確認**:
   - [About tracked by and tracks in issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/about-tracked-by-and-tracks-in-issues)

2. **Project設定を確認**:
   - Projectの「Settings」→「Features」で「Tracked by」が有効か確認

3. **権限を確認**:
   - Projectの管理者権限があるか確認

---

## 📈 設定後のメリット

✅ **Epic配下の子Issueが一目で分かる**  
✅ **進捗が自動計算される**（例: "5 of 10 completed"）  
✅ **Epic単位での進捗管理が容易**  
✅ **依存関係が明確になる**  
✅ **プロジェクト全体の見通しが良くなる**

---

**最終更新**: 2025-11-19
