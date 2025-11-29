# Volta環境セットアップガイド

## 概要

このプロジェクトはVoltaでNode.js/pnpm環境を管理しています。
手動でコマンドを実行する際は、必ずVolta環境を読み込んでください。

---

## クイックスタート

### 1. 現在のシェルでVolta環境を読み込み

```bash
source scripts/setup/volta-env.sh
```

これで`node`, `pnpm`, `volta`コマンドが使用可能になります。

---

## 永続的な設定（推奨）

### zshの場合（macOS標準）

`~/.zshrc`に以下を追加:

```bash
# Account Book プロジェクト用Volta環境
if [ -f ~/github/account-book/scripts/setup/volta-env.sh ]; then
  source ~/github/account-book/scripts/setup/volta-env.sh
fi
```

### bashの場合

`~/.bashrc`または`~/.bash_profile`に以下を追加:

```bash
# Account Book プロジェクト用Volta環境
if [ -f ~/github/account-book/scripts/setup/volta-env.sh ]; then
  source ~/github/account-book/scripts/setup/volta-env.sh
fi
```

設定後、新しいターミナルを開くか、以下を実行:

```bash
source ~/.zshrc  # または source ~/.bashrc
```

---

## 環境確認

### Volta環境が正しく読み込まれているか確認

```bash
which node
# 期待される出力: /Users/[username]/.volta/bin/node

which pnpm
# 期待される出力: /Users/[username]/.volta/bin/pnpm

volta --version
node --version
pnpm --version
```

---

## トラブルシューティング

### `node: command not found`が出る場合

#### 原因

Volta環境が読み込まれていません。

#### 解決方法

```bash
# 1. 現在のシェルで読み込み
source scripts/setup/volta-env.sh

# 2. 確認
which node
```

### `volta: command not found`が出る場合

#### 原因

Voltaがインストールされていません。

#### 解決方法

```bash
# Voltaのインストール
curl https://get.volta.sh | bash

# シェル設定の再読み込み
source ~/.zshrc  # または source ~/.bashrc

# Node.jsとpnpmのインストール
volta install node@20
volta install pnpm
```

---

## スクリプト実行時の注意

### ✅ スクリプトは自動的にVolta環境を読み込みます

```bash
# 以下のスクリプトは自動的にvolta-env.shを読み込みます
./scripts/build/build.sh
./scripts/test/lint.sh
./scripts/test/test.sh all
```

### ❌ 手動でコマンドを実行する場合は環境読み込みが必要

```bash
# ❌ これはエラーになる可能性があります
cd apps/backend
pnpm build

# ✅ 正しい方法
source scripts/setup/volta-env.sh
cd apps/backend
pnpm build
```

---

## 推奨ワークフロー

### 新しいターミナルを開いたら

```bash
cd ~/github/account-book
source scripts/setup/volta-env.sh
```

または、上記の「永続的な設定」を行えば自動的に読み込まれます。

---

## 参考リンク

- [Volta公式サイト](https://volta.sh/)
- [プロジェクトREADME](../../README.md)
- [セットアップガイド](../../SETUP.md)
