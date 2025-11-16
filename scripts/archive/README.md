# アーカイブスクリプト

このディレクトリには、プロジェクト初期セットアップで一度だけ使用したスクリプトが格納されています。

## 📦 格納されているスクリプト

### Issue作成系
初回のGitHub Issue一括作成に使用したスクリプト

| スクリプト | 説明 | 実行日 |
|-----------|------|--------|
| `create-all-issues.sh` | 全Issue作成（初期版） | 2025-11-16 |
| `create-issues-batch.sh` | サンプルIssue作成 | 2025-11-16 |
| `create-issues-category-a.sh` | カテゴリA（環境構築）Issue作成 | 2025-11-16 |
| `create-issues-category-b1.sh` | FR-001〜007 Issue作成 | 2025-11-16 |
| `create-issues-remaining-features.sh` | FR-008〜031 Issue作成 | 2025-11-16 |
| `create-issues-remaining-all.sh` | カテゴリC〜H Issue作成 | 2025-11-16 |

### Issue更新系
全Issueへの詳細情報追加に使用したスクリプト

| スクリプト | 説明 | 実行日 |
|-----------|------|--------|
| `update-issues-detail-fr001-007.sh` | FR-001〜007詳細化（完全版） | 2025-11-16 |
| `update-issues-detail-fr003-007.sh` | FR-003〜007詳細化 | 2025-11-16 |
| `update-all-issues-bulk.sh` | 全Issue一括詳細化（93個） | 2025-11-16 |

### GitHub初期セットアップ系
GitHub環境の初期構築に使用したスクリプト

| スクリプト | 説明 | 実行日 |
|-----------|------|--------|
| `setup-github-labels.sh` | 58個のラベル作成 | 2025-11-16 |
| `setup-github-workflow.sh` | ラベル・マイルストーン・プロジェクトボード作成 | 2025-11-16 |

## 🔄 再利用について

これらのスクリプトは既に実行済みで、**通常は再実行の必要はありません**。

ただし、以下の場合に参考にできます：

### 新しいIssueを追加する場合
- `create-issues-*.sh` のテンプレートを参考に新規スクリプトを作成
- Issue作成のフォーマットやラベル付けのパターンを確認

### 新しいリポジトリで同様のセットアップをする場合
- `setup-github-*.sh` を参考に新規プロジェクトのセットアップ

### Issueテンプレートを更新する場合
- `update-all-issues-bulk.sh` の標準テンプレート関数を参考

## 📝 削除について

これらのスクリプトは参考用として保管していますが、**完全に不要であれば削除しても問題ありません**。

```bash
# アーカイブディレクトリごと削除する場合
rm -rf scripts/archive/
```

## 📚 関連ドキュメント

- `.github/ISSUE_DETAIL_COMPLETION_REPORT.md` - Issue詳細化完了報告
- `.github/ISSUE_DETAIL_GUIDELINE.md` - Issue詳細化ガイドライン
- `.github/SETUP_COMPLETED.md` - GitHub環境セットアップ完了報告

---

**作成日**: 2025年11月16日  
**目的**: プロジェクト初期セットアップスクリプトのアーカイブ

