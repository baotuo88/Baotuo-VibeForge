# ============================================================================
# Baotuo-VibeForge 生产 Dockerfile (多阶段构建)
# 基于 Next.js standalone 输出，最终镜像仅包含运行所需文件
# ============================================================================

# ---- 阶段 1: 依赖安装 ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma
# 有 lockfile 时用 --frozen-lockfile 保证可复现；无 lockfile 时回退普通安装
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile; \
    else \
      echo "⚠️  未找到 pnpm-lock.yaml，使用普通安装（建议提交 lockfile）"; \
      pnpm install --no-frozen-lockfile; \
    fi

# ---- 阶段 2: 构建 ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client 并构建
RUN pnpm prisma generate
# 构建时不校验环境变量（运行时注入）
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- 阶段 3: 运行 ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3008

# 非 root 用户运行
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# 复制 standalone 产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma schema、迁移文件与生成的 client（standalone 会带上 node_modules 里的 client，
# 但迁移需要 schema 和 CLI，这里显式复制 schema、迁移目录、client 与 prisma CLI）
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
# prisma CLI 及其依赖，供 entrypoint 里 migrate deploy 使用（避免联网下载）
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# 启动脚本：先跑迁移再启动
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3008

ENTRYPOINT ["./docker-entrypoint.sh"]
