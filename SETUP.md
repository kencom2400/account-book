# セットアップガイド

## 前提条件

- Node.js 18以上
- pnpm 8以上

## プロジェクトのセットアップ

### 1. 依存パッケージのインストール

プロジェクトルートで以下のコマンドを実行します：

```bash
pnpm install
```

### 2. 環境変数の設定

#### バックエンド

```bash
cd apps/backend
cp .env.example .env
```

`.env`ファイルを編集し、必要な環境変数を設定します：

```env
NODE_ENV=development
PORT=3001
CRYPTO_KEY=your-secret-key-here-32-characters-long
```

**注意**: `CRYPTO_KEY`は32文字以上のランダムな文字列を設定してください。

#### フロントエンド

```bash
cd apps/frontend
cp .env.local.example .env.local
```

`.env.local`ファイルを編集し、バックエンドのURLを設定します：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. 共通ライブラリのビルド

```bash
# typesライブラリをビルド
cd libs/types
pnpm build

# utilsライブラリをビルド
cd ../utils
pnpm build
```

### 4. カテゴリの初期化

バックエンドを起動後、デフォルトカテゴリを初期化します：

```bash
curl -X POST http://localhost:3001/categories/initialize
```

## 開発サーバーの起動

### ターミナル1: バックエンド

```bash
cd apps/backend
pnpm dev
```

バックエンドは `http://localhost:3001` で起動します。

### ターミナル2: フロントエンド

```bash
cd apps/frontend
pnpm dev
```

フロントエンドは `http://localhost:3000` で起動します。

## ビルド

### 全体ビルド

プロジェクトルートで：

```bash
pnpm build
```

### 個別ビルド

```bash
# バックエンド
cd apps/backend
pnpm build

# フロントエンド
cd apps/frontend
pnpm build
```

## データ構造

アプリケーションのデータは以下のディレクトリに保存されます：

```
data/
├── transactions/     # 取引データ（月別JSONファイル）
│   ├── 2025-01.json
│   ├── 2025-02.json
│   └── ...
├── institutions/     # 金融機関データ
│   └── institutions.json
├── categories/       # カテゴリデータ
│   └── categories.json
└── settings/         # 設定データ
    └── config.json
```

## APIエンドポイント

### 取引（Transactions）

- `POST /transactions` - 取引を作成
- `GET /transactions` - 取引一覧を取得
- `GET /transactions/summary/monthly/:year/:month` - 月次サマリーを取得
- `PATCH /transactions/:id/category` - 取引のカテゴリを更新

### 金融機関（Institutions）

- `POST /institutions` - 金融機関を登録
- `GET /institutions` - 金融機関一覧を取得

### カテゴリ（Categories）

- `POST /categories/initialize` - デフォルトカテゴリを初期化
- `GET /categories` - カテゴリ一覧を取得

## トラブルシューティング

### ポートが使用中の場合

バックエンドのポートを変更する場合は、`.env`ファイルの`PORT`を変更し、フロントエンドの`.env.local`の`NEXT_PUBLIC_API_URL`も合わせて変更してください。

### データが表示されない場合

1. バックエンドが正常に起動しているか確認
2. カテゴリの初期化を実行したか確認
3. ブラウザのコンソールでエラーを確認

### ビルドエラーが発生する場合

1. `node_modules`を削除して再インストール

```bash
rm -rf node_modules
pnpm install
```

2. 共通ライブラリを再ビルド

```bash
cd libs/types && pnpm build
cd ../utils && pnpm build
```

## 次のステップ

実装が完了した主要機能：

- ✅ ドメインモデル（Transaction, Institution, Category）
- ✅ Repositoryパターン（JSON保存）
- ✅ ユースケース（取引管理、月次集計）
- ✅ APIエンドポイント
- ✅ UIコンポーネント（ダッシュボード、取引一覧）

今後実装予定の機能：

- [ ] 金融機関API連携
- [ ] クレジットカード照合機能
- [ ] グラフ・チャート表示
- [ ] データエクスポート
- [ ] 年次レポート
- [ ] 予算管理

詳細は[開発タスク一覧](./docs/development-setup-tasks.md)を参照してください。

