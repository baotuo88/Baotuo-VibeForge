#!/bin/sh
set -e

echo "🔄 等待数据库就绪并应用迁移..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ 未设置 DATABASE_URL，无法启动。请在环境变量中配置。"
  exit 1
fi

# ---- 等待数据库就绪 ----
# prisma migrate/db push 在数据库尚未接受连接时会直接失败，
# 容器编排里 app 常常先于 postgres 就绪，这里做有限次重试探活。
DB_WAIT_RETRIES="${DB_WAIT_RETRIES:-30}"
i=0
until ./node_modules/.bin/prisma db execute --stdin <<'EOF' >/dev/null 2>&1
SELECT 1;
EOF
do
  i=$((i + 1))
  if [ "$i" -ge "$DB_WAIT_RETRIES" ]; then
    echo "❌ 等待数据库就绪超时（${DB_WAIT_RETRIES} 次重试后仍不可用），退出。"
    exit 1
  fi
  echo "⏳ 数据库尚未就绪，等待中... ($i/$DB_WAIT_RETRIES)"
  sleep 2
done
echo "✅ 数据库连接就绪"

# ---- 应用数据库 schema ----
# - 若存在 migrations 目录，用 migrate deploy（推荐，保留迁移历史）
# - 否则回退到 db push（直接同步 schema，适合尚未生成迁移的首次部署）
# 直接调用镜像内的 prisma 二进制，避免 npx 联网下载。
# 迁移失败必须退出（而非吞错继续启动），否则应用会带着不完整/空的表结构运行，
# 问题被延迟到运行时（如注册 500）才暴露，难以排查。
if [ -d ./prisma/migrations ] && [ -n "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
  echo "📦 检测到 migrations，执行 migrate deploy..."
  if ! ./node_modules/.bin/prisma migrate deploy; then
    echo "❌ 数据库迁移失败，退出。请检查数据库状态与 schema。"
    exit 1
  fi
else
  echo "📦 未检测到 migrations，执行 db push 同步 schema..."
  if ! ./node_modules/.bin/prisma db push --skip-generate --accept-data-loss; then
    echo "❌ db push 同步 schema 失败，退出。"
    echo "   若因唯一约束冲突失败，说明库中存在重复数据（重复的文档/Prompt 版本或重复的 Agent 类型），需先清理。"
    exit 1
  fi
fi

echo "🚀 启动 Baotuo-VibeForge (端口 ${PORT:-3008})..."

# 启动 Next.js standalone server
exec node server.js
