# apps/frontend/Dockerfile
FROM node:20-alpine AS builder

RUN npm install -g pnpm@8.15.0

WORKDIR /app

# 依存関係のインストール（キャッシュ効率化のため、package.jsonを先にコピー）
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY libs/types/package.json ./libs/types/
COPY libs/utils/package.json ./libs/utils/

# postinstallスクリプトをスキップ（Alpine LinuxではPlaywrightの--with-depsが動作しないため）
# 本番環境ではPlaywrightのブラウザインストールは不要
RUN pnpm install --frozen-lockfile --ignore-scripts

# ソースコードのコピーとビルド
COPY . .
RUN pnpm run build --filter=@account-book/types
RUN pnpm run build --filter=@account-book/utils
RUN pnpm run build --filter=@account-book/frontend

FROM node:20-alpine AS runner
WORKDIR /app

# 本番環境に必要なファイルのみコピー（イメージサイズの最適化）
COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/package.json ./
# 本番環境に必要な依存関係のみコピー
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
ENV NODE_ENV=production
CMD ["pnpm", "start"]

