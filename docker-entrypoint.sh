#!/bin/sh
set -e

echo "🔄 等待数据库就绪并应用迁移..."

# 应用数据库 schema：
# - 若存在 migrations 目录，用 migrate deploy（推荐，保留迁移历史）
# - 否则回退到 db push（直接同步 schema，适合尚未生成迁移的首次部署）
# 直接调用镜像内的 prisma 二进制，避免 npx 联网下载
if [ -n "$DATABASE_URL" ]; then
  if [ -d ./prisma/migrations ] && [ -n "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
    echo "📦 检测到 migrations，执行 migrate deploy..."
    ./node_modules/.bin/prisma migrate deploy || echo "⚠️  迁移失败，继续启动"
  else
    echo "📦 未检测到 migrations，执行 db push 同步 schema..."
    ./node_modules/.bin/prisma db push --skip-generate --accept-data-loss || echo "⚠️  db push 失败，继续启动"
  fi
else
  echo "⚠️  未设置 DATABASE_URL，跳过数据库同步"
fi

echo "🚀 启动 Baotuo-VibeForge (端口 ${PORT:-3008})..."

# 启动 Next.js standalone server
exec node server.js
