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

# 确保 public 目录存在（仓库可能没有该目录，避免 runner 阶段 COPY 失败）
RUN mkdir -p /app/public

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

# Prisma schema 与迁移文件（entrypoint 里 migrate deploy / db push 需要）
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# 完整复制 builder 的 node_modules（保留 pnpm 软链结构与 .pnpm 目录）。
# pnpm 的 node_modules 是软链到 .pnpm 的，单独复制某个包会丢失其传递依赖
# （如 prisma CLI 依赖的 @prisma/engines）。整树复制可保证 standalone server、
# 生成的 @prisma/client 与 prisma CLI（db push/migrate）的依赖全部可解析。
# 放在 standalone COPY 之后，覆盖其精简版 node_modules。
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# 启动脚本：先跑迁移再启动
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3008

ENTRYPOINT ["./docker-entrypoint.sh"]
