# 服务器部署问题修复指南

## 问题 1: `docker-compose: command not found`

✅ **已解决** - 你使用 `docker compose` (新版本) 成功启动了服务

---

## 问题 2: `prisma: not found` 和 `node_modules missing`

### 原因
依赖未安装，需要先安装 node_modules

### 解决步骤

```bash
# 1. 安装依赖
pnpm install

# 2. 运行数据库迁移
pnpm db:migrate

# 3. 启动开发服务器
pnpm dev
```

---

## 完整部署流程（服务器）

### 步骤 1: 确认环境

```bash
# 检查 Node.js 版本（需要 18+）
node -v

# 检查 pnpm 版本
pnpm -v

# 检查 Docker
docker --version
```

### 步骤 2: 克隆并配置

```bash
cd ~/Baotuo-VibeForge

# 确认 .env 已配置
cat .env

# 检查关键配置
grep DATABASE_URL .env
grep REDIS_URL .env
grep NEXTAUTH_SECRET .env
grep ENCRYPTION_KEY .env
```

### 步骤 3: 启动 Docker 服务

```bash
# 启动数据库和 Redis（已完成）
docker compose up -d

# 检查容器状态
docker compose ps

# 应该看到 3 个容器运行：
# vibeforge-postgres
# vibeforge-redis
# vibeforge-minio
```

### 步骤 4: 安装依赖

```bash
# 安装所有依赖
pnpm install

# 等待安装完成
```

### 步骤 5: 数据库迁移

```bash
# 运行 Prisma 迁移
pnpm db:migrate

# 如果提示创建数据库，选择 Yes
```

### 步骤 6: 启动应用

```bash
# 开发模式
pnpm dev

# 或生产模式
pnpm build
pnpm start
```

### 步骤 7: 配置防火墙（重要）

```bash
# 开放端口 3008（应用）
sudo ufw allow 3008

# 如果使用 Nginx 反向代理
sudo ufw allow 80
sudo ufw allow 443

# 检查防火墙状态
sudo ufw status
```

### 步骤 8: 使用 PM2 保持运行（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start pnpm --name "vibeforge" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs vibeforge

# 查看状态
pm2 status
```

---

## 生产环境配置

### 使用 Nginx 反向代理

```bash
# 安装 Nginx
sudo apt update
sudo apt install nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/vibeforge
```

Nginx 配置内容：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    location / {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/vibeforge /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 配置 SSL (Let's Encrypt)

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d 你的域名.com

# Certbot 会自动配置 HTTPS
```

---

## 常用命令

### Docker 管理

```bash
# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 停止并删除数据
docker compose down -v
```

### 应用管理

```bash
# 查看进程
pm2 list

# 重启应用
pm2 restart vibeforge

# 停止应用
pm2 stop vibeforge

# 查看日志
pm2 logs vibeforge

# 监控
pm2 monit
```

### 数据库管理

```bash
# 进入 PostgreSQL
docker compose exec postgres psql -U postgres -d vibeforge

# 备份数据库
docker compose exec postgres pg_dump -U postgres vibeforge > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker compose exec -T postgres psql -U postgres vibeforge < backup.sql
```

---

## 验证部署

### 1. 检查服务状态

```bash
# 检查端口监听
netstat -tlnp | grep 3008

# 或
ss -tlnp | grep 3008

# 应该看到 Node.js 进程监听 3008 端口
```

### 2. 测试访问

```bash
# 本地测试
curl http://localhost:3008

# 外部测试（替换为你的服务器 IP）
curl http://你的IP:3008
```

### 3. 查看日志

```bash
# PM2 日志
pm2 logs vibeforge --lines 100

# Docker 日志
docker compose logs -f --tail=100
```

---

## 当前状态检查

根据你的输出，现在的状态：

✅ Docker 服务已启动
✅ 数据库容器运行中
✅ Redis 容器运行中
❌ node_modules 未安装
❌ 应用未启动

**下一步执行：**

```bash
# 1. 安装依赖
pnpm install

# 2. 运行迁移
pnpm db:migrate

# 3. 启动应用（开发模式测试）
pnpm dev

# 如果成功，按 Ctrl+C 停止，然后用 PM2 启动
pnpm build
pm2 start pnpm --name "vibeforge" -- start
```

---

## 故障排查

### 如果 pnpm install 失败

```bash
# 清理缓存
pnpm store prune

# 删除 node_modules
rm -rf node_modules

# 重新安装
pnpm install --no-frozen-lockfile
```

### 如果数据库连接失败

```bash
# 检查数据库容器
docker compose ps postgres

# 检查数据库日志
docker compose logs postgres

# 测试连接
docker compose exec postgres psql -U postgres -c "SELECT version();"
```

### 如果端口被占用

```bash
# 查看占用端口的进程
sudo lsof -i :3008

# 或
sudo netstat -tlnp | grep 3008

# 杀死进程
sudo kill -9 进程ID
```

---

需要我帮你检查其他问题吗？
