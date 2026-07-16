# 推送到 GitHub 步骤

由于权限限制，请在本地 Windows 终端执行以下命令：

## 1. 初始化 Git 仓库

```bash
cd C:\Users\50360\Desktop\Baotuo-VibeForge

# 如果已有 .git 目录，先删除
rmdir /s /q .git

# 初始化新仓库
git init
git branch -m main
```

## 2. 添加文件并提交

```bash
# 添加所有文件
git add .

# 首次提交
git commit -m "feat: initial commit - Baotuo-VibeForge MVP"
```

## 3. 关联远程仓库并推送

```bash
# 添加远程仓库
git remote add origin https://github.com/baotuo88/Baotuo-VibeForge.git

# 推送到 GitHub
git push -u origin main
```

## 4. 如果需要强制推送（远程仓库已有内容）

```bash
git push -u origin main --force
```

## 5. 其他电脑拉取测试

```bash
# 克隆仓库
git clone https://github.com/baotuo88/Baotuo-VibeForge.git
cd Baotuo-VibeForge

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入必要配置

# 启动数据库
docker-compose up -d postgres redis

# 运行迁移
pnpm db:migrate

# 启动开发服务器
pnpm dev
```

## 注意事项

1. **不要提交敏感信息**
   - `.env` 文件已在 `.gitignore` 中
   - 确保不要提交真实的 API Key

2. **在 GitHub 上设置环境变量**
   - 如果部署到 Vercel，在 Vercel Dashboard 配置环境变量
   - 不要在代码中硬编码密钥

3. **README 更新**
   - 仓库 URL 已在 README 中，其他开发者可直接克隆

推送完成后访问：https://github.com/baotuo88/Baotuo-VibeForge
