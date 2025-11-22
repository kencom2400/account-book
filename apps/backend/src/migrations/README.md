# マイグレーション管理ガイド

このディレクトリには、データベーススキーマのマイグレーションファイルが含まれています。

## マイグレーションファイル一覧

### 実行済みマイグレーション

1. **1700000000000-InitialMigration.ts**
   - 初期スキーマの作成
   - テーブル: categories, institutions, credit_cards, transactions
   - インデックス: 9個
   - 外部キー制約: 3個
   - 実行日: 2025-11-22

2. **1732248000000-AddRelatedTransactionForeignKey.ts**
   - transactions.related_transaction_id への自己参照外部キー制約を追加
   - データ整合性の改善（Phase 1.5）
   - onDelete: SET NULL
   - onUpdate: CASCADE
   - 実行日: （未実行）

## マイグレーション実行方法

### 1. マイグレーション状態の確認

```bash
cd apps/backend
pnpm migration:show
```

実行結果の見方：

- `[X]`: 実行済み
- `[ ]`: 未実行

### 2. マイグレーションの実行

```bash
cd apps/backend
pnpm migration:run
```

### 3. マイグレーションの取り消し（ロールバック）

```bash
cd apps/backend
pnpm migration:revert
```

## マイグレーション作成方法

### 自動生成（エンティティから）

エンティティの変更からマイグレーションを自動生成：

```bash
cd apps/backend
pnpm migration:generate src/migrations/YourMigrationName
```

### 手動作成

空のマイグレーションファイルを作成：

```bash
cd apps/backend
pnpm migration:create src/migrations/YourMigrationName
```

## マイグレーション命名規則

```
<timestamp>-<PascalCaseDescription>.ts
```

例：

- `1700000000000-InitialMigration.ts`
- `1732248000000-AddRelatedTransactionForeignKey.ts`
- `1732249000000-AddUserTable.ts`

## マイグレーション実装のベストプラクティス

### 1. `up()` メソッド

- スキーマの変更を適用する処理を記述
- データベースを新しいバージョンに更新

### 2. `down()` メソッド

- `up()` の逆操作を記述
- ロールバック時に使用
- 必ず実装すること

### 3. トランザクション

TypeORMは自動的にトランザクションを使用します：

- マイグレーション全体が成功または失敗
- 部分的な適用は発生しない

### 4. データ移行

スキーマ変更だけでなく、データ移行も可能：

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // スキーマ変更
  await queryRunner.addColumn('users', new TableColumn({
    name: 'email_verified',
    type: 'boolean',
    default: false,
  }));

  // データ移行
  await queryRunner.query(
    `UPDATE users SET email_verified = true WHERE email IS NOT NULL`
  );
}
```

### 5. 複雑な変更の分割

大きな変更は複数のマイグレーションに分割：

- テーブル追加 → 外部キー追加 → データ移行

## 注意事項

### 本番環境へのデプロイ前

1. **ローカルでテスト**

   ```bash
   pnpm migration:run
   pnpm migration:revert
   pnpm migration:run
   ```

2. **データバックアップ**

   ```bash
   ./scripts/data/backup-database.sh
   ```

3. **ロールバック戦略の確認**
   - `down()` メソッドが正しく実装されているか
   - データ損失のリスクはないか

### 既にデプロイされたマイグレーションの変更は禁止

- 実行済みマイグレーションは絶対に変更しない
- 修正が必要な場合は新しいマイグレーションを作成

### 外部キー制約の追加

既存データがある場合：

1. データの整合性を確認
2. 不整合データがあれば事前に修正
3. 制約を追加

## トラブルシューティング

### マイグレーション実行エラー

```bash
# エラー内容を確認
pnpm migration:show

# ロールバック
pnpm migration:revert

# データベースをリセット（開発環境のみ）
./scripts/dev/reset-database.sh
```

### マイグレーションの手動実行

```bash
# MySQLに直接接続
docker exec -it account-book-mysql mysql -u root -p

# マイグレーション状態を確認
USE account_book_dev;
SELECT * FROM migrations;
```

## 関連ドキュメント

- [データベーススキーマ設計書](../../../docs/database-schema.md)
- [データベースセットアップガイド](../../../docs/database-setup.md)
- [TypeORM Documentation](https://typeorm.io/migrations)

## 今後の予定マイグレーション

Phase 1.5 - データ整合性の改善:

- [x] transactions.related_transaction_id への外部キー制約追加
- [ ] institutions と credit_cards の関係整理

Phase 2 - 追加予定のテーブル:

- [ ] accounts テーブルの作成
- [ ] sync_logs テーブルの作成
- [ ] auto_classification_rules テーブルの作成
- [ ] events テーブルの作成

Phase 3 - 機能拡張:

- [ ] users テーブルの追加（マルチユーザー対応）
- [ ] budgets テーブルの追加（予算管理）
- [ ] tags テーブルの追加（タグ機能）

---

**最終更新**: 2025-11-22  
**管理者**: Development Team
