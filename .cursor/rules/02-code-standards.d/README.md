# コード品質基準とテスト - ディレクトリ

## 目的

このディレクトリには、コード品質の基準とテスト実装のガイドラインが含まれています。

**重要**: このディレクトリのファイルは、元の`02-code-standards.md`（60,000トークン超）を機能別に分割したものです。

## ファイル一覧と優先順位

1. **`README.md`** - このファイル（ディレクトリの説明）
2. **`01-type-safety.md`** - 型安全性（最優先）⭐
3. **`02-test-requirements.md`** - テスト作成の必須化
4. **`03-data-access.md`** - データアクセスと配列操作
5. **`04-architecture.md`** - アーキテクチャとモジュール設計
6. **`05-test-guidelines.md`** - テスト実装ガイドライン
7. **`06-eslint-config.md`** - ESLint設定
8. **`07-gemini-learnings.md`** - Geminiレビューから学んだ観点

## セクション間の関係性

```
01-type-safety.md (最優先)
    ↓
02-test-requirements.md
    ↓
03-data-access.md → 04-architecture.md
    ↓
05-test-guidelines.md
    ↓
06-eslint-config.md
    ↓
07-gemini-learnings.md (参考情報)
```

## 最優先事項

1. **型安全性**: `01-type-safety.md`を最優先で参照
2. **テスト作成**: `02-test-requirements.md`に従い、すべての実装にテストを作成
3. **データアクセス**: `03-data-access.md`に従い、IDベースのマッピングを使用

## 関連する他のディレクトリ

- **`01-project.d/`** - プロジェクト概要・技術スタック
- **`03-git-workflow.d/`** - push前チェック（テスト実行）

## 使用方法

このディレクトリのファイルは、`@inc-all-rules`で自動的に読み込まれます。

個別に参照する場合は、以下のように指定してください：

```markdown
参照: `.cursor/rules/02-code-standards.d/01-type-safety.md`
```
