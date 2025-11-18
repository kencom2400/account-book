# apps/frontend/Dockerfile
FROM node:20-alpine AS builder

RUN npm install -g pnpm@8.15.0

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build --filter=@account-book/frontend

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
ENV NODE_ENV=production
CMD ["pnpm", "start"]

