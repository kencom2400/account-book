#!/bin/bash

# GitHub Labels Setup Script
# .github/labels.ymlからラベルを一括作成します

set -e

echo "🏷️  GitHub Labelsのセットアップを開始します..."

# GitHub CLIがインストールされているか確認
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLIがインストールされていません"
    echo "インストール方法: https://cli.github.com/"
    exit 1
fi

# 認証確認
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLIの認証が必要です"
    echo "実行してください: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI認証済み"

# labels.ymlの存在確認
LABELS_FILE=".github/labels.yml"
if [ ! -f "$LABELS_FILE" ]; then
    echo "❌ $LABELS_FILE が見つかりません"
    exit 1
fi

echo "📄 $LABELS_FILE を読み込んでいます..."

# yamlパーサーがあれば使用、なければpythonで解析
if command -v yq &> /dev/null; then
    echo "✅ yqを使用してラベルを作成します"
    
    # 既存ラベルの削除確認
    read -p "既存のラベルを削除しますか？ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  既存ラベルを削除中..."
        gh label list --json name --jq '.[].name' | while read label; do
            gh label delete "$label" --yes 2>/dev/null || true
        done
    fi
    
    # ラベルの作成
    yq eval '.[] | [.name, .color, .description] | @tsv' "$LABELS_FILE" | while IFS=$'\t' read -r name color description; do
        echo "作成中: $name"
        gh label create "$name" --color "$color" --description "$description" --force 2>/dev/null || \
        gh label edit "$name" --color "$color" --description "$description" 2>/dev/null || true
    done
else
    echo "⚠️  yqがインストールされていません。Pythonを使用します。"
    
    # Pythonでyamlを解析してラベルを作成
    python3 << 'EOF'
import yaml
import subprocess
import sys

try:
    with open('.github/labels.yml', 'r', encoding='utf-8') as f:
        labels = yaml.safe_load(f)
    
    print(f"📋 {len(labels)}個のラベルを作成します...\n")
    
    for label in labels:
        name = label['name']
        color = label['color']
        description = label.get('description', '')
        
        print(f"作成中: {name}")
        
        # まず作成を試みる
        result = subprocess.run(
            ['gh', 'label', 'create', name, '--color', color, '--description', description, '--force'],
            capture_output=True,
            text=True
        )
        
        # 既存の場合は更新
        if result.returncode != 0:
            subprocess.run(
                ['gh', 'label', 'edit', name, '--color', color, '--description', description],
                capture_output=True
            )
    
    print("\n✅ ラベルの作成が完了しました！")

except FileNotFoundError:
    print("❌ .github/labels.yml が見つかりません")
    sys.exit(1)
except yaml.YAMLError as e:
    print(f"❌ YAMLパースエラー: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ エラー: {e}")
    sys.exit(1)
EOF
fi

echo ""
echo "✅ ラベルのセットアップが完了しました！"
echo ""
echo "📊 作成されたラベルを確認:"
gh label list

echo ""
echo "💡 Tip: GitHub Webで確認するには以下を実行:"
echo "   gh browse --settings"
