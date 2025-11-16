# Issue詳細化ガイドライン

## 目的
各Issueに以下を明確に記載し、開発者が迷わず実装できるようにする：
1. Acceptance Criteria（受入基準）
2. Definition of Done（完了定義）
3. Implementation Details（実装詳細）
4. Dependencies（依存関係）

## テンプレート構造

### 機能要件Issue（FR-XXX）

```markdown
## 📋 概要
[機能の概要説明]

## 🎯 ユーザーストーリー
[誰が][何を][なぜ]したいか

## 📦 実装内容

### Backend
- [ ] [具体的な実装項目1]
- [ ] [具体的な実装項目2]

### Frontend
- [ ] [具体的な実装項目1]
- [ ] [具体的な実装項目2]

### Domain層
- [ ] [Entity/Value Object/Domain Service]

### Application層
- [ ] [UseCase実装]

### Infrastructure層
- [ ] [Repository/外部API連携]

### Presentation層
- [ ] [Controller/画面実装]

## ✅ Acceptance Criteria（受入基準）
- [ ] [テスト可能な具体的な基準1]
- [ ] [テスト可能な具体的な基準2]
- [ ] [テスト可能な具体的な基準3]
- [ ] [パフォーマンス基準]
- [ ] [エラーハンドリング基準]

## 📋 Definition of Done（完了定義）

### コード
- [ ] 実装が完了している
- [ ] コードレビューが完了している
- [ ] Lintエラーがない
- [ ] TypeScript型定義が適切

### テスト
- [ ] ユニットテストが書かれている（カバレッジ80%以上）
- [ ] 統合テストが書かれている（該当する場合）
- [ ] E2Eテストが書かれている（該当する場合）
- [ ] すべてのテストがパスしている

### ドキュメント
- [ ] API仕様書が更新されている（Backend）
- [ ] コンポーネント仕様書が更新されている（Frontend）
- [ ] READMEが更新されている（必要に応じて）

### デプロイ
- [ ] developブランチにマージ済み
- [ ] CIが成功している
- [ ] 手動動作確認が完了している

## 🔗 Related Issues
- Depends on: #XXX
- Blocks: #XXX
- Related to: #XXX

## 📁 関連ファイル
- `path/to/file1.ts`
- `path/to/file2.tsx`

## 📚 参考資料
- `docs/functional-requirements/FR-XXX.md`
- `docs/system-architecture.md`
```

### タスクIssue

```markdown
## 📋 概要
[タスクの概要説明]

## 🎯 目的
[なぜこのタスクが必要か]

## 📦 作業内容
- [ ] [具体的な作業項目1]
- [ ] [具体的な作業項目2]
- [ ] [具体的な作業項目3]

## ✅ Acceptance Criteria（受入基準）
- [ ] [テスト可能な具体的な基準1]
- [ ] [テスト可能な具体的な基準2]
- [ ] [テスト可能な具体的な基準3]

## 📋 Definition of Done（完了定義）

### 実装
- [ ] 作業が完了している
- [ ] コードレビューが完了している
- [ ] Lintエラーがない

### テスト
- [ ] 動作確認が完了している
- [ ] テストが書かれている（必要に応じて）
- [ ] すべてのテストがパスしている

### ドキュメント
- [ ] ドキュメントが更新されている（必要に応じて）

### その他
- [ ] マージ済み
- [ ] CIが成功している

## 🔗 Related Issues
- Related to: #XXX

## 📁 関連ファイル
- `path/to/file1.ts`

## 📚 参考資料
- `docs/xxx.md`
```

## 更新手順

1. カテゴリごとに詳細テンプレートを作成
2. gh issue editコマンドで各Issueを更新
3. 重要度の高いIssueから優先的に詳細化

## 優先順位

1. Phase 0-1（環境構築・データ取得）
2. Phase 2-3（分類・クレジットカード）
3. Phase 4-5（集計・可視化）
4. Phase 6（設定）
5. テスト・非機能要件
6. 拡張機能

