#!/bin/bash

# Geminiコードレビュー対応Issue作成スクリプト

echo "════════════════════════════════════════════════════════════════"
echo "   📋 Geminiコードレビュー対応Issue作成"
echo "════════════════════════════════════════════════════════════════"
echo ""

gh issue create \
  --title "[docs] Geminiコードレビュー指摘事項への対応 - 設計文書の修正" \
  --label "documentation,priority: medium,size: M" \
  --body "## 概要
PR #1, #2に対するGeminiのコードレビューで指摘された、設計文書の修正を一括で対応します。
全15件の指摘事項を含みます。

## 対象PR
- PR #1: https://github.com/kencom2400/account-book/pull/1
- PR #2: https://github.com/kencom2400/account-book/pull/2

## 修正内容

### 1. \`.cursor/rules/project.md\` (3件)

#### 1-1. Onion Architectureレイヤ図の修正 (22-30行目) 【優先度: high】
**問題点:**
- 矢印 ↑ の表記が、Onion Architectureの原則「依存関係は内側に向かう」と矛盾
- Presentation LayerとInfrastructure Layerが階層的に配置されているが、実際は同列の外側レイヤ

**修正内容:**
\`\`\`
修正前:
Domain Layer（最内層）
  ↑
Application Layer
  ↑
Infrastructure Layer
  ↑
Presentation Layer（最外層）

修正後:
依存関係は常に内側に向かいます。
- Presentation Layer は Application Layer に依存
- Infrastructure Layer は Application Layer に依存  
- Application Layer は Domain Layer に依存
\`\`\`

#### 1-2. コミットメッセージセクションの重複削除 (125-133行目) 【優先度: medium】
**問題点:**
- \`.cursor/rules/commit.md\`と内容が重複

**修正内容:**
\`\`\`
修正前:
## コミットメッセージ
\`\`\`
feat: 新機能追加
fix: バグ修正
...
\`\`\`

修正後:
## コミットメッセージ
コミットメッセージの規約については、[Commit Rules](./commit.md) を参照してください。
\`\`\`

#### 1-3. JSON/SQLiteの表記修正 【優先度: low】
**問題点:**
- データ永続化セクションで \"Json\", \"SQLLite\" と誤表記

**修正内容:**
- \"Json\" → \"JSON\"
- \"SQLLite\" → \"SQLite\"

---

### 2. \`.cursor/rules/commit.md\` (1件)

#### 2-1. 命令形表記の明確化 (59行目) 【優先度: low】
**問題点:**
- 「命令形を使用」という表現が日本語では分かりにくい

**修正内容:**
\`\`\`
修正前: 命令形を使用（「追加する」ではなく「追加」）
修正後: 命令形で記述（「追加する」ではなく「追加」）
\`\`\`

---

### 3. \`REQUIREMENT.md\` (2件)

#### 3-1. JSON/SQLiteの表記修正 【優先度: low】
**修正内容:**
- \"Json\" → \"JSON\"
- \"SQLLite\" → \"SQLite\"

#### 3-2. ドキュメント構成の整理 (2-32行目) 【優先度: medium】
**問題点:**
- 「要望」と「アプリケーションへの要望」に機能要件と非機能要件が混在

**修正提案:**
セクションを以下のように再構成：
- **機能要件**: アプリがユーザーに提供する機能（資産データの取得、カテゴリ分類、集計など）
- **非機能要件**: 技術スタック、アーキテクチャ、データ永続化方針など
- **ユースケース**: ユーザーがアプリをどのように利用するかのシナリオ

---

### 4. \`docs/development-setup-tasks.md\` (3件)

#### 4-1. カード番号バリデーション改善 【優先度: high】
**問題点:**
- \`isCardNumber\`メソッドで16桁固定チェックを行っているが、カードタイプによって桁数が異なる（American Expressは15桁など）

**修正内容:**
\`\`\`typescript
修正前: if (digits.length !== 16) return false;
修正後: if (digits.length < 13 || digits.length > 19) return false;
\`\`\`

#### 4-2. TypeScript重複インストールタスクの削除 (317-320行目) 【優先度: medium】
**問題点:**
- タスク3.1.4でTypeScriptを再インストールしているが、タスク2.1.2でルートに\`-w\`フラグ付きでインストール済み
- バージョン不整合のリスクあり

**修正内容:**
- タスク3.1.4（TypeScriptインストール）を削除

#### 4-3. NestJS CLIのグローバルインストールをローカルに変更 【優先度: medium】
**問題点:**
- \`pnpm add -g @nestjs/cli\`でグローバルインストールしているが、プロジェクトの依存関係はローカルに閉じるべき

**修正内容:**
\`\`\`bash
修正前: pnpm add -g @nestjs/cli
修正後: pnpm add -D @nestjs/cli -w
\`\`\`
※実行方法を\`pnpm exec nest\`やnpmスクリプト経由に変更する旨も追記

---

### 5. \`docs/functional-requirements/FR-001-007_data-acquisition.md\` (2件)

#### 5-1. ステータス値の整合性修正 【優先度: high】
**問題点:**
- データスキーマ例で\`status: \"confirmed\"\`となっているが、\`development-setup-tasks.md\`の\`TransactionStatus\` enumでは\`PENDING, COMPLETED, FAILED, CANCELLED\`が定義されている

**修正内容:**
\`\`\`json
修正前: \"status\": \"confirmed\",
修正後: \"status\": \"completed\",
\`\`\`

#### 5-2. PCI-DSSの全角ハイフン修正 【優先度: medium】
**修正内容:**
- \"PCIーDSS\" → \"PCI-DSS\"（全角ハイフン→半角ハイフン）

---

### 6. \`docs/functional-requirements/FR-008-011_data-classification.md\` (1件)

#### 6-1. リスト項目の改行ミス修正 【優先度: medium】
**問題点:**
- 「電子マネーへの入金」と「証券口座への入金」の間にスペースがない

**修正内容:**
\`\`\`markdown
修正前:
- 電子マネーへの入金- 証券口座への入金

修正後:
- 電子マネーへの入金
- 証券口座への入金
\`\`\`

---

### 7. \`docs/functional-requirements/FR-012-015_credit-card-management.md\` (1件)

#### 7-1. タイポ修正 【優先度: medium】
**修正内容:**
- \"マッチングアルゴリム\" → \"マッチングアルゴリズム\"

---

### 8. \`docs/functional-requirements/FR-023-027_visualization.md\` (1件)

#### 8-1. グラフカラーパレットの不整合修正 (171-233行目) 【優先度: medium】
**問題点:**
- FR-023では「収入: 緑」「収支プラス: 青」と定義
- FR-024では「収入: 青」「収支: 緑」と記載
- アプリケーション全体で統一されたカラーリングが必要

**修正内容:**
カラーパレットをアプリ全体で統一（どちらかに一貫させる）

---

### 9. \`docs/system-architecture.md\` (2件)

#### 9-1. REST API / GraphQLの表記不整合 【優先度: medium】
**問題点:**
- システムアーキテクチャ図では「REST API / GraphQL」と記載されているが、API設計セクション（7.1）ではRESTful APIのエンドポイントのみが定義されている

**修正内容:**
\`\`\`
修正前: │ REST API / GraphQL
修正後: │ REST API
\`\`\`
※GraphQLの導入計画がある場合はその設計を追記

#### 9-2. UIライブラリの併用に関する指針不足 (156-161行目) 【優先度: medium】
**問題点:**
- Chakra UI + Tailwind CSSの併用を推奨しているが、スタイル競合や設定の複雑化のリスクあり
- 併用する場合の具体的な方針が不明

**修正提案:**
どちらか一方に絞るか、併用する場合の具体的な方針を明記
（例: Chakra UIのテーマでTailwindのデザイントークンを利用する等）

---

## 作業チェックリスト

### .cursor/rules/project.md
- [ ] Onion Architectureレイヤ図の修正 (22-30行目)
- [ ] コミットメッセージセクションの重複削除 (125-133行目)
- [ ] JSON/SQLiteの表記修正

### .cursor/rules/commit.md
- [ ] 命令形表記の明確化 (59行目)

### REQUIREMENT.md
- [ ] JSON/SQLiteの表記修正
- [ ] ドキュメント構成の整理 (2-32行目)

### docs/development-setup-tasks.md
- [ ] カード番号バリデーション改善
- [ ] TypeScript重複インストールタスクの削除 (317-320行目)
- [ ] NestJS CLIのグローバルインストールをローカルに変更

### docs/functional-requirements/FR-001-007_data-acquisition.md
- [ ] ステータス値の整合性修正
- [ ] PCI-DSSの全角ハイフン修正

### docs/functional-requirements/FR-008-011_data-classification.md
- [ ] リスト項目の改行ミス修正

### docs/functional-requirements/FR-012-015_credit-card-management.md
- [ ] タイポ修正（アルゴリム→アルゴリズム）

### docs/functional-requirements/FR-023-027_visualization.md
- [ ] グラフカラーパレットの不整合修正 (171-233行目)

### docs/system-architecture.md
- [ ] REST API / GraphQLの表記不整合修正
- [ ] UIライブラリの併用に関する指針追記 (156-161行目)

---

## 見積もり工数
2〜3時間

## 備考
- 優先度highの項目から対応することを推奨
- カラーパレットやUIライブラリについては、チーム内で方針を決定してから修正
- 修正後は全ドキュメントの整合性を再確認"

if [ $? -eq 0 ]; then
    ISSUE_NUM=$(gh issue list --limit 1 --json number --jq '.[0].number')
    echo "✅ Issue #${ISSUE_NUM} 作成成功"
    echo ""
    
    # Projectに追加
    echo "📊 プロジェクトボードに追加中..."
    gh project item-add 1 --owner kencom2400 --url "https://github.com/kencom2400/account-book/issues/${ISSUE_NUM}" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ プロジェクトボードに追加完了"
    else
        echo "⚠️  プロジェクトボードへの追加に失敗しました"
        echo "   手動で追加してください: https://github.com/kencom2400/account-book/issues/${ISSUE_NUM}"
    fi
    
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "   ✅ 完了"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "Issue URL: https://github.com/kencom2400/account-book/issues/${ISSUE_NUM}"
else
    echo "❌ Issue作成に失敗しました"
    exit 1
fi

