#!/bin/bash

# 型安全性向上（any型排除）Issue作成スクリプト

echo "════════════════════════════════════════════════════════════════"
echo "   📋 型安全性向上Issue作成 - any型の排除"
echo "════════════════════════════════════════════════════════════════"
echo ""

gh issue create \
  --title "[refactor] 型安全性の向上 - any型の排除" \
  --label "refactor,backend,frontend,library,priority: medium,size: M" \
  --body "## 概要
プロジェクト全体で型安全性を向上させるために、\`any\`型をすべて排除します。
現在、13ファイルで26箇所の\`any\`型が使用されています。

## 背景
\`any\`型を使用すると、TypeScriptの型チェックが無効化され、以下の問題が発生します：
- ランタイムエラーの可能性が高まる
- IDEの補完機能が効かなくなる
- コードの保守性が低下する
- バグの早期発見が困難になる

## 対象ファイル

### Backend (11ファイル)
1. \`apps/backend/test/institution.e2e-spec.ts\` - 4箇所
2. \`apps/backend/src/modules/transaction/domain/entities/transaction.entity.ts\` - 1箇所
3. \`apps/backend/src/modules/transaction/application/use-cases/calculate-monthly-summary.use-case.ts\` - 2箇所
4. \`apps/backend/src/modules/institution/domain/value-objects/encrypted-credentials.vo.ts\` - 1箇所
5. \`apps/backend/src/modules/institution/domain/errors/bank-connection.error.ts\` - 6箇所
6. \`apps/backend/src/modules/institution/domain/entities/institution.entity.ts\` - 1箇所
7. \`apps/backend/src/modules/institution/domain/entities/account.entity.ts\` - 1箇所
8. \`apps/backend/src/modules/credit-card/infrastructure/adapters/credit-card-api.adapter.interface.ts\` - 4箇所
9. \`apps/backend/src/modules/credit-card/domain/entities/credit-card.entity.ts\` - 1箇所
10. \`apps/backend/src/modules/credit-card/domain/value-objects/payment.vo.ts\` - 1箇所
11. \`apps/backend/src/modules/credit-card/domain/entities/credit-card-transaction.entity.ts\` - 1箇所

### Library (1ファイル)
12. \`libs/types/src/bank.types.ts\` - 1箇所

### Frontend (1ファイル)
13. \`apps/frontend/src/lib/api/client.ts\` - 2箇所

## 修正方針

### 1. 適切な型定義の作成
\`\`\`typescript
// 悪い例
function processData(data: any) {
  return data.value;
}

// 良い例
interface DataType {
  value: string;
}
function processData(data: DataType) {
  return data.value;
}
\`\`\`

### 2. ジェネリクスの活用
\`\`\`typescript
// 悪い例
function getData(key: string): any {
  return storage.get(key);
}

// 良い例
function getData<T>(key: string): T {
  return storage.get(key) as T;
}
\`\`\`

### 3. unknownの使用（型が不明な場合）
\`\`\`typescript
// 悪い例
function parseJson(json: string): any {
  return JSON.parse(json);
}

// 良い例
function parseJson(json: string): unknown {
  return JSON.parse(json);
}
\`\`\`

### 4. 型ガードの実装
\`\`\`typescript
function isUserData(data: unknown): data is UserData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data
  );
}
\`\`\`

## 作業チェックリスト

### Phase 1: Backend - Domain Layer (優先度: High)
- [ ] \`transaction.entity.ts\` - any型の排除
- [ ] \`institution.entity.ts\` - any型の排除
- [ ] \`account.entity.ts\` - any型の排除
- [ ] \`credit-card.entity.ts\` - any型の排除
- [ ] \`credit-card-transaction.entity.ts\` - any型の排除
- [ ] \`payment.vo.ts\` - any型の排除
- [ ] \`encrypted-credentials.vo.ts\` - any型の排除
- [ ] \`bank-connection.error.ts\` - any型の排除

### Phase 2: Backend - Application Layer
- [ ] \`calculate-monthly-summary.use-case.ts\` - any型の排除

### Phase 3: Backend - Infrastructure Layer
- [ ] \`credit-card-api.adapter.interface.ts\` - any型の排除

### Phase 4: Library
- [ ] \`libs/types/src/bank.types.ts\` - any型の排除

### Phase 5: Frontend
- [ ] \`apps/frontend/src/lib/api/client.ts\` - any型の排除

### Phase 6: Test
- [ ] \`apps/backend/test/institution.e2e-spec.ts\` - any型の排除

### Phase 7: 検証
- [ ] 全ファイルでany型が残っていないことを確認
- [ ] TypeScriptコンパイルエラーがないことを確認
- [ ] 既存テストがすべてパスすることを確認
- [ ] Lintエラーがないことを確認

## 受入基準
- [ ] プロジェクト内にany型が存在しない（\`eslint\`で検出されない）
- [ ] すべてのTypeScriptファイルが型安全にコンパイルできる
- [ ] 既存のすべてのテストがパスする
- [ ] ESLintで型安全性に関する警告が出ない

## ESLint設定の強化（推奨）
\`\`\`javascript
// eslint.config.mjs
export default [
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error', // anyを禁止
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
    },
  },
];
\`\`\`

## 見積もり工数
- Phase 1-3 (Backend): 1〜2日
- Phase 4 (Library): 0.5日
- Phase 5 (Frontend): 0.5日
- Phase 6 (Test): 0.5日
- Phase 7 (検証): 0.5日

**合計**: 3〜4日

## 参考資料
- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Deep Dive - unknown vs any](https://basarat.gitbook.io/typescript/type-system/moving-types)
- [eslint-plugin-typescript - no-explicit-any](https://typescript-eslint.io/rules/no-explicit-any/)

## 備考
- Domain Layerから順番に対応することで、型定義が下層から上層に伝播しやすくなります
- 外部APIのレスポンス型など、型が保証できない場合は\`unknown\`を使用し、型ガードで安全に扱います
- 作業完了後は、ESLintの設定を強化してany型の新規導入を防止します"

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

