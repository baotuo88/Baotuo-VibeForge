# Baotuo-VibeForge 部署指南

## 📋 目录

- [方案选择](#方案选择)
- [方案一：本地开发（Docker）](#方案一本地开发docker)
- [方案二：Vercel + 云服务部署](#方案二vercel--云服务部署)
- [方案三：Docker 生产部署](#方案三docker-生产部署)
- [常见问题](#常见问题)

---

## 方案选择

| 方案 | 适用场景 | 难度 | 成本 |
|------|---------|------|------|
| 本地开发 | 开发测试 | ⭐ 简单 | 免费 |
| Vercel + 云服务 | 快速上线、个人项目 | ⭐⭐ 中等 | 免费额度 |
| Docker 生产部署 | 私有部署、完全控制 | ⭐⭐⭐ 较难 | 服务器成本 |

---

## 方案一：本地开发（Docker）

### 1. 环境要求

- Node.js 18+
- pnpm 8+
- Docker Desktop

### 2. 克隆项目

```bash
git clone https://github.com/baotuo88/Baotuo-VibeForge.git
cd Baotuo-VibeForge
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# 数据库（Docker 默认配置）
DATABASE_URL="postgresql://postgres:password@localhost:5432/vibeforge"

# Redis（Docker 默认配置）
REDIS_URL="redis://localhost:6379"

# 认证（生成密钥）
NEXTAUTH_URL="http://localhost:3008"
NEXTAUTH_SECRET="你生成的base64密钥"

# 加密（生成密钥）
ENCRYPTION_KEY="你生成的32位hex密钥"

# 存储
STORAGE_PROVIDER="local"

# 端口
NODE_ENV="development"
PORT="3008"
API_PORT="4000"
```

**生成密钥：**

```bash
# NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. 启动数据库

```bash
docker-compose up -d postgres redis
```

### 6. 运行数据库迁移

```bash
pnpm db:migrate
```

### 7. 启动开发服务器

```bash
pnpm dev
```

### 8. 访问应用

打开浏览器访问：**http://localhost:3008**

---

## 方案二：Vercel + 云服务部署

### 架构

- **前端/API**：Vercel
- **数据库**：Supabase (PostgreSQL)
- **缓存**：Upstash (Redis)
- **存储**：Vercel Blob 或 Cloudflare R2

### 步骤 1：设置 Supabase

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目
3. 等待数据库初始化完成
4. 进入 **Settings → Database**
5. 复制 **Connection String** (Transaction 模式)
   ```
   postgresql://postgres.[项目ID]:[密码]@aws-0-[区域].pooler.supabase.com:6543/postgres
   ```

### 步骤 2：设置 Upstash Redis

1. 访问 [upstash.com](https://upstash.com)
2. 创建新 Redis 数据库
3. 选择地区（建议与 Vercel 同区域）
4. 复制 **REDIS_URL**
   ```
   redis://:密码@地区.upstash.io:端口
   ```

### 步骤 3：推送到 GitHub

```bash
git clone https://github.com/baotuo88/Baotuo-VibeForge.git
cd Baotuo-VibeForge

# 如果是你 fork 的仓库
git remote set-url origin https://github.com/你的用户名/Baotuo-VibeForge.git
git push
```

### 步骤 4：Vercel 部署

1. 访问 [vercel.com](https://vercel.com)
2. 点击 **Import Project**
3. 选择你的 GitHub 仓库
4. 配置项目：
   - Framework Preset：**Next.js**
   - Root Directory：`./`
   - Build Command：`pnpm build`

### 步骤 5：配置环境变量

在 Vercel Dashboard → Settings → Environment Variables 添加：

```bash
# 数据库（Supabase）
DATABASE_URL=postgresql://postgres.[项目ID]:[密码]@aws-0-[区域].pooler.supabase.com:6543/postgres

# Redis（Upstash）
REDIS_URL=redis://:密码@地区.upstash.io:端口

# 认证
NEXTAUTH_URL=https://你的项目.vercel.app
NEXTAUTH_SECRET=生成的base64密钥

# 加密
ENCRYPTION_KEY=生成的32位hex密钥

# 存储
STORAGE_PROVIDER=vercel-blob

# 可选：AI Provider（用户也可在后台添加）
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

**生成密钥（在本地终端）：**

```bash
# NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 步骤 6：运行数据库迁移

**方式 1：本地运行迁移（推荐）**

```bash
# 在本地项目目录
# 编辑 .env，使用 Supabase 的 DATABASE_URL
DATABASE_URL="你的Supabase连接字符串"

# 运行迁移
pnpm db:migrate
```

**方式 2：在 Supabase SQL Editor 运行**

1. 进入 Supabase Dashboard → SQL Editor
2. 将 `prisma/migrations` 目录下的 SQL 文件内容粘贴执行

### 步骤 7：部署

1. 在 Vercel Dashboard 点击 **Deploy**
2. 等待构建完成
3. 访问 `https://你的项目.vercel.app`

### 步骤 8：初始化数据（可选）

如果需要创建默认用户和 Agent：

```bash
# 本地连接 Supabase 数据库
DATABASE_URL="你的Supabase连接字符串" pnpm db:seed
```

---

## 方案三：Docker 生产部署

### 1. 服务器要求

- 2 核 CPU
- 4GB 内存
- 20GB 存储
- Ubuntu 20.04+ / Debian 11+

### 2. 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt install docker-compose-plugin
```

### 3. 克隆项目

```bash
git clone https://github.com/baotuo88/Baotuo-VibeForge.git
cd Baotuo-VibeForge
```

### 4. 配置环境变量

```bash
cp .env.example .env
nano .env
```

修改为生产环境配置：

```bash
# 数据库
DATABASE_URL="postgresql://postgres:强密码@postgres:5432/vibeforge"

# Redis
REDIS_URL="redis://redis:6379"

# 认证（使用你的域名）
NEXTAUTH_URL="https://你的域名.com"
NEXTAUTH_SECRET="生成的强密钥"

# 加密
ENCRYPTION_KEY="生成的强密钥"

# 存储（使用 MinIO 或 R2）
STORAGE_PROVIDER="minio"
STORAGE_ENDPOINT="http://minio:9000"
STORAGE_BUCKET="vibeforge"
STORAGE_ACCESS_KEY="minioadmin"
STORAGE_SECRET_KEY="强密码"

# 生产环境
NODE_ENV="production"
PORT="3008"
```

### 5. 生产 Compose 已内置

仓库已包含 `docker-compose.prod.yml`（应用 + PostgreSQL + Redis 一体化）和多阶段构建的 `Dockerfile`，无需手写。服务名为 `app`、`postgres`、`redis`，应用容器启动时会自动执行数据库迁移（见 `docker-entrypoint.sh`：有迁移文件用 `prisma migrate deploy`，无则回退 `prisma db push`）。

生产环境所需的变量（`POSTGRES_PASSWORD`、`NEXTAUTH_URL`、`NEXTAUTH_SECRET`、`ENCRYPTION_KEY` 等）从 `.env` 注入，数据库和 Redis 的连接串已在 compose 内按服务名配置好。

### 6. 构建和启动

```bash
# 构建并启动所有服务（首次会自动建表）
docker compose -f docker-compose.prod.yml up -d --build

# 查看日志
docker compose -f docker-compose.prod.yml logs -f app
```

### 7. 数据库迁移（自动）

应用容器每次启动都会自动同步数据库结构，无需手动执行。如需手动触发：

```bash
docker compose -f docker-compose.prod.yml exec app ./node_modules/.bin/prisma migrate deploy
```

如需创建初始管理员账号：

```bash
docker compose -f docker-compose.prod.yml exec app node -e "require('tsx/cjs')" 2>/dev/null; \
docker compose -f docker-compose.prod.yml exec -e SEED_ADMIN_EMAIL=admin@example.com -e SEED_ADMIN_PASSWORD=你的密码 app ./node_modules/.bin/prisma db seed
```

### 8. 配置 Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name 你的域名.com;

    location / {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 9. 配置 SSL（Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名.com
```

---

## 常见问题

### Q1: 数据库连接失败

**检查：**
```bash
# 测试数据库连接
psql "你的DATABASE_URL"

# 检查容器状态
docker-compose ps
```

### Q2: Redis 连接失败

**检查：**
```bash
# 测试 Redis
redis-cli -u "你的REDIS_URL" ping
```

### Q3: Vercel 部署构建失败

**常见原因：**
- 缺少环境变量
- 依赖安装失败
- 内存不足

**解决：**
```bash
# 在 Vercel Settings → Functions
# 增加 Function Memory Limit
```

### Q4: 如何更新部署

**本地开发：**
```bash
git pull
pnpm install
pnpm db:migrate
```

**Vercel：**
```bash
git push  # Vercel 自动重新部署
```

**Docker：**
```bash
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Q5: 如何备份数据

**PostgreSQL：**
```bash
# 导出
docker-compose exec postgres pg_dump -U postgres vibeforge > backup.sql

# 导入
docker-compose exec -T postgres psql -U postgres vibeforge < backup.sql
```

**完整备份：**
```bash
# 备份所有数据卷
docker run --rm -v baotuo-vibeforge_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres-backup.tar.gz /data
```

---

## 性能优化建议

### 1. 数据库

- 配置连接池（Prisma 自动处理）
- 添加适当索引
- 定期 VACUUM

### 2. Redis

- 设置最大内存限制
- 配置持久化策略
- 使用 Redis Cluster（高并发）

### 3. 应用

- 启用 Next.js 静态生成
- 配置 CDN
- 压缩静态资源

---

## 监控和日志

### Docker 日志

```bash
# 查看所有日志
docker-compose logs -f

# 查看特定服务
docker-compose logs -f web
```

### Vercel 日志

在 Vercel Dashboard → Deployments → View Function Logs

---

## 安全建议

1. **使用强密码和密钥**
2. **定期更新依赖** - `pnpm update`
3. **配置防火墙** - 只开放必要端口
4. **启用 HTTPS** - 生产环境必须
5. **限制 API 访问** - 配置 Rate Limiting
6. **定期备份数据**

---

## 获取帮助

- **GitHub Issues**: https://github.com/baotuo88/Baotuo-VibeForge/issues
- **文档**: 查看项目 README 和其他 MD 文件

---

**祝部署顺利！🚀**
