# Baotuo-VibeForge 部署指南

## 快速开始

### 1. 环境要求

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- pnpm 8+

### 2. 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd baotuo-vibeforge

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入必要的配置

# 启动数据库服务
docker-compose up -d postgres redis

# 运行数据库迁移
pnpm db:migrate

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

### 3. Docker 部署（推荐）

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 4. Vercel + Supabase 部署

#### 4.1 Supabase 设置

1. 在 [Supabase](https://supabase.com) 创建项目
2. 获取数据库连接字符串
3. 在 Supabase Dashboard 运行 Prisma 迁移

#### 4.2 Vercel 部署

1. 在 [Vercel](https://vercel.com) 导入项目
2. 配置环境变量：
   - `DATABASE_URL`
   - `REDIS_URL`
   - `NEXTAUTH_SECRET`
   - `ENCRYPTION_KEY`
3. 部署

## 环境变量说明

### 必需配置

```bash
# 数据库
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://..."

# 认证
NEXTAUTH_SECRET="your-secret-key"

# 加密（用于 API Key）
ENCRYPTION_KEY="32-character-key"
```

### 可选配置

```bash
# AI Providers（用户也可在后台添加）
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# 存储
STORAGE_PROVIDER="local"  # local | s3 | r2
STORAGE_BUCKET=""
STORAGE_ACCESS_KEY=""
STORAGE_SECRET_KEY=""

# 计费
STRIPE_SECRET_KEY=""
ENABLE_BILLING="false"
```

## 初始化数据

### 创建默认 Agent

```bash
pnpm db:seed
```

这将创建：
- Supervisor Agent
- Product Manager Agent
- Architect Agent
- Database Agent
- Prompt Agent

### 手动创建 Agent

1. 登录后台
2. 前往 "Agent 配置"
3. 添加 Agent 并绑定模型

## 故障排除

### 数据库连接失败

检查 `DATABASE_URL` 格式：
```
postgresql://user:password@host:port/database
```

### Redis 连接失败

确保 Redis 服务运行：
```bash
docker-compose ps redis
```

### API Key 加密错误

确保 `ENCRYPTION_KEY` 长度为 32 字符：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 生产环境建议

### 安全

- 使用强密码和密钥
- 启用 HTTPS
- 配置 CORS
- 限制 API 访问频率

### 性能

- 配置 Redis 缓存
- 使用 CDN
- 启用数据库连接池
- 监控资源使用

### 备份

- 定期备份数据库
- 备份用户上传文件
- 保存环境变量配置

## 更新部署

```bash
# 拉取最新代码
git pull

# 安装新依赖
pnpm install

# 运行数据库迁移
pnpm db:migrate

# 重启服务
docker-compose restart
# 或 Vercel 会自动重新部署
```

## 监控和日志

### Docker 日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务
docker-compose logs -f web
```

### Vercel 日志

在 Vercel Dashboard 查看实时日志和错误。

## 支持

如遇问题，请提交 Issue 或查看文档：
- GitHub Issues: [链接]
- 文档: [链接]
