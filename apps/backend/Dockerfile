# apps/backend/Dockerfile
FROM node:20-alpine AS builder

RUN npm install -g pnpm@8.15.0

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build --filter=@account-book/backend

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "dist/main.js"]

