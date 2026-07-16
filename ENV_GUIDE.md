# 环境变量配置说明

## 必需配置（必须填写）

### 数据库配置
```bash
DATABASE_URL="postgresql://用户名:密码@主机:端口/数据库名"
```
**示例：**
- 本地开发（Docker）：`postgresql://postgres:password@localhost:5432/vibeforge`
- Supabase：`postgresql://postgres.[项目ID]:[密码]@aws-0-[区域].pooler.supabase.com:6543/postgres`

### Redis 配置
```bash
REDIS_URL="redis://主机:端口"
```
**示例：**
- 本地开发（Docker）：`redis://localhost:6379`
- Upstash：`redis://:密码@区域.upstash.io:端口`

### 认证密钥
```bash
NEXTAUTH_URL="http://localhost:3008"  # 本地开发
NEXTAUTH_SECRET="随机生成的密钥"
```
**生成密钥：**
```bash
# 在终端运行
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### API Key 加密密钥
```bash
ENCRYPTION_KEY="32位十六进制字符串"
```
**生成密钥：**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 可选配置（用户可在后台添加，不是必须）

### AI Provider（后台可配置）
```bash
# OpenAI
OPENAI_API_KEY="sk-..."

# Anthropic
ANTHROPIC_API_KEY="sk-ant-..."

# Google
GOOGLE_API_KEY="AI..."
```
**说明：** 这些可以不填，用户登录后在"设置 → AI Provider"页面添加

---

## 存储配置（默认本地存储）

### 本地存储（默认）
```bash
STORAGE_PROVIDER="local"
```

### Cloudflare R2
```bash
STORAGE_PROVIDER="r2"
STORAGE_BUCKET="vibeforge-uploads"
STORAGE_ENDPOINT="https://账户ID.r2.cloudflarestorage.com"
STORAGE_ACCESS_KEY="R2 Access Key"
STORAGE_SECRET_KEY="R2 Secret Key"
```

### AWS S3
```bash
STORAGE_PROVIDER="s3"
STORAGE_BUCKET="your-bucket"
STORAGE_REGION="us-east-1"
STORAGE_ACCESS_KEY="AWS Access Key"
STORAGE_SECRET_KEY="AWS Secret Key"
```

### MinIO（自建）
```bash
STORAGE_PROVIDER="minio"
STORAGE_ENDPOINT="http://localhost:9000"
STORAGE_BUCKET="vibeforge"
STORAGE_ACCESS_KEY="minioadmin"
STORAGE_SECRET_KEY="minioadmin"
```

---

## 限流配置（可选）

```bash
RATE_LIMIT_FREE_TIER="10"    # 免费用户每小时请求次数
RATE_LIMIT_PRO_TIER="100"    # Pro 用户每小时请求次数
RATE_LIMIT_TEAM_TIER="1000"  # Team 用户每小时请求次数
```

---

## 计费系统（可选，暂未实现）

```bash
ENABLE_BILLING="false"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_PRO="price_..."
STRIPE_PRICE_ID_TEAM="price_..."
```

---

## 功能开关（可选）

```bash
ENABLE_TEAM_FEATURES="false"         # 团队功能
ENABLE_BILLING="false"               # 计费系统
ENABLE_GITHUB_INTEGRATION="false"    # GitHub 集成
ENABLE_FIGMA_INTEGRATION="false"     # Figma 集成
```

---

## 快速开始配置（最小化）

创建 `.env` 文件，只需填写：

```bash
# 数据库（Docker 默认配置）
DATABASE_URL="postgresql://postgres:password@localhost:5432/vibeforge"

# Redis（Docker 默认配置）
REDIS_URL="redis://localhost:6379"

# 认证
NEXTAUTH_URL="http://localhost:3008"
NEXTAUTH_SECRET="在这里粘贴生成的密钥"

# 加密（用于保护 API Key）
ENCRYPTION_KEY="在这里粘贴生成的32位hex密钥"

# 存储（使用本地）
STORAGE_PROVIDER="local"

# 应用配置
NODE_ENV="development"
PORT="3008"
API_PORT="4000"
```

**生成密钥命令：**
```bash
# NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 生产环境建议

1. **使用环境变量管理工具**
   - Vercel：在 Dashboard 配置
   - Docker：使用 `.env` 文件
   - 服务器：使用 systemd 环境变量

2. **密钥安全**
   - 绝对不要提交 `.env` 到 Git
   - 使用强随机密钥
   - 定期轮换密钥

3. **数据库**
   - 生产环境使用 SSL 连接
   - 使用连接池
   - 定期备份

4. **Redis**
   - 设置密码保护
   - 使用持久化存储
   - 配置最大内存限制
