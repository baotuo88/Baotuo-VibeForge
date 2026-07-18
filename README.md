# Baotuo-VibeForge

**AI 软件架构师 + Vibe Coding Prompt 工厂**

输入一个想法，AI 帮你完成产品设计与技术规划，并生成适用于 Claude Code、Codex、Cursor 等 10 种开发工具的专业开发指令。

## 产品定位

Baotuo-VibeForge 通过多 Agent 系统将你的想法转化为：

- 产品需求文档 (PRD)
- 技术架构方案
- 数据库设计
- 开发工具专用 Prompt

## 核心功能

**AI 对话需求分析** — 类似 ChatGPT 的聊天界面，但 AI 不直接写代码，而是理解想法、细化需求、生成专业文档。

**多 Agent 协作** — Supervisor 编排 PRD、UI/UX、架构、数据库、Prompt 五类专职 Agent，每个可绑定不同模型、自定义 System Prompt 与运行参数。

```
          Supervisor Agent
                 |
    -----------------------------
    |      |      |      |      |
   PRD   UI/UX  架构  数据库  Prompt
```

**AI Provider 管理** — 支持 OpenAI、Anthropic、DeepSeek、Moonshot、智谱、OpenRouter，以及任意 OpenAI 兼容的自定义网关（如 newapi、one-api）。API Key 采用 AES-256-GCM 加密存储，支持自动发现模型列表。

**开发工具 Prompt 生成** — 一键生成适配 Claude Code、Codex、Cursor、Windsurf、Cline、Continue、Aider、Lovable、Bolt、Replit Agent 的开发 Prompt，自动带入 PRD / 架构 / 数据库上下文，版本化保存。

**项目工作空间** — 每个项目包含对话历史、生成的文档（自动版本递增）、Prompt 仓库。

## 技术栈

| 层 | 技术 |
|----|------|
| 全栈框架 | Next.js 14 (App Router) + TypeScript |
| 样式 | Tailwind CSS |
| 数据获取 | React Query |
| 认证 | NextAuth (邮箱 + 密码，JWT 会话) |
| ORM / 数据库 | Prisma + PostgreSQL |
| 缓存 / 限流 | Redis（可选，无则回退内存） |
| Agent 编排 | LangGraph + LangChain |
| AI SDK | @langchain/openai、@langchain/anthropic |

> 应用为纯 Next.js 全栈架构，API 通过 App Router 的 Route Handlers 实现，无独立后端进程。

## 快速开始（本地开发）

前置：Node.js 18+、pnpm 8+、Docker（用于跑 PostgreSQL/Redis）。

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 生成密钥填入 .env：
#   NEXTAUTH_SECRET： openssl rand -base64 32
#   ENCRYPTION_KEY：  openssl rand -hex 32

# 3. 启动数据库与 Redis
docker compose up -d postgres redis

# 4. 初始化数据库并写入种子数据（含默认管理员账号）
pnpm db:push
pnpm db:seed

# 5. 启动开发服务器
pnpm dev
```

访问 http://localhost:3008 ，用种子管理员账号登录（默认 `admin@vibeforge.com` / `password123`）。

### 首次使用流程

1. 登录后进入 `/admin/providers`，添加一个 AI Provider（填 API Key），点「同步」发现模型。
2. 进入 `/admin/agents`，点「一键初始化默认 Agent」，自动创建 5 个专职 Agent 并绑定模型。
3. 回到 `/dashboard`，新建项目，开始对话。

## 生产部署

### 方式一：Docker Compose（一体化，推荐）

```bash
cp .env.example .env
# 编辑 .env：务必设置强随机的 NEXTAUTH_SECRET 和 ENCRYPTION_KEY，
# 并将 NEXTAUTH_URL 改为你的域名/公网地址

docker compose -f docker-compose.prod.yml up -d --build
```

应用容器启动时会自动应用数据库迁移（无迁移文件时回退 `prisma db push`）。访问 `http://<服务器IP>:3008`。

### 方式二：Vercel + 托管数据库

1. 数据库用 Supabase / Neon 等托管 PostgreSQL，Redis 可选用 Upstash。
2. Vercel 导入仓库，配置环境变量（`DATABASE_URL`、`NEXTAUTH_SECRET`、`NEXTAUTH_URL`、`ENCRYPTION_KEY`，可选 `REDIS_URL`）。
3. Build Command 设为 `prisma generate && next build`，部署后在本地执行一次 `pnpm db:push` 初始化表结构。

环境变量说明见 [ENV_GUIDE.md](./ENV_GUIDE.md)，完整部署细节见 [DEPLOY_README.md](./DEPLOY_README.md)。

## 常用命令

```bash
pnpm dev          # 开发服务器（端口 3008）
pnpm build        # 生产构建
pnpm start        # 启动生产构建
pnpm db:push      # 同步 schema 到数据库（开发/无迁移场景）
pnpm db:migrate   # 创建并应用迁移（开发）
pnpm db:seed      # 写入种子数据（管理员 + 默认 Agent）
pnpm db:studio    # Prisma Studio 可视化
pnpm lint         # ESLint
pnpm type-check   # TypeScript 类型检查
```

## 项目结构

```
src/
├── app/
│   ├── (auth)/            # 登录、注册页
│   ├── admin/            # 后台：Providers / Models / Agents 管理
│   ├── api/              # Route Handlers（providers / models / agents / projects）
│   ├── dashboard/        # 首页
│   └── projects/[id]/    # 项目工作空间（对话 + 文档 + Prompt）
├── lib/
│   ├── agents/           # LangGraph 编排器与默认 Agent 定义
│   ├── services/         # Provider / LLM / 文档持久化服务
│   ├── prompts/          # 开发工具 Prompt 模板
│   ├── auth.ts           # NextAuth 配置
│   ├── session.ts        # requireUser / requireAdmin 鉴权
│   ├── crypto.ts         # API Key 加解密
│   ├── redis.ts          # Redis + 内存回退
│   └── api-utils.ts      # 限流与统一错误响应
└── middleware.ts         # 路由保护
prisma/
├── schema.prisma         # 数据模型
└── seed.ts               # 种子脚本
```

## 安全说明

- API Key 使用 `ENCRYPTION_KEY` 做 AES-256-GCM 加密后入库，接口返回时脱敏。
- 所有业务 API 需登录；Provider/Model/Agent 的写操作限管理员。
- `/api/agents/run` 按用户限流（默认每分钟 5 次）。
- 生产环境务必设置强随机的 `NEXTAUTH_SECRET` 与 `ENCRYPTION_KEY`，切勿使用示例值。

## 许可证

MIT License
