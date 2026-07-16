# Baotuo-VibeForge

**AI 软件架构师 + Vibe Coding Prompt 工厂**

一句话描述：输入一个想法，AI 帮你完成产品设计、技术规划，并生成适用于 Claude Code、Codex、Cursor 等开发工具的专业开发指令。

## 🎯 产品定位

Baotuo-VibeForge 是一个 AI 驱动的软件项目规划平台，通过多 Agent 系统将你的想法转化为：

- 📋 **产品需求文档 (PRD)**
- 🏗️ **技术架构方案**
- 🗄️ **数据库设计**
- 🎨 **UI/UX 设计建议**
- ⚡ **开发工具专用 Prompt**

## ✨ 核心功能

### 1. AI 对话需求分析

类似 ChatGPT 的聊天界面，但 AI 不会直接生成代码，而是：

- 理解你的想法
- 提出关键问题
- 逐步细化需求
- 生成专业文档

**两种模式：**

- **普通模式**：一句话 → 自动规划
- **专业模式**：需求访谈 → PRD → 架构 → 任务拆解

### 2. 多 Agent 协作系统

```
          Supervisor Agent
                 |
    -----------------------------
    |      |      |      |      |
   PRD   UI/UX  架构  数据库  Prompt
```

每个 Agent 可以：

- 绑定不同的 AI 模型
- 自定义 System Prompt
- 独立配置参数

### 3. AI 模型管理

支持多种 AI 提供商：

- OpenAI (GPT-4, GPT-5)
- Anthropic (Claude)
- Google (Gemini)
- DeepSeek
- Moonshot (Kimi)
- 智谱 AI
- OpenRouter
- **自定义 API（OpenAI 兼容格式）**

**特色功能：**

- 自动发现模型列表
- 每个 Agent 绑定不同模型
- API Key 加密存储

### 4. 开发工具 Prompt 生成

生成适配以下工具的专业 Prompt：

| 工具 | 输出格式 | 说明 |
|------|----------|------|
| **Claude Code** | `CLAUDE.md` | 项目规则、开发阶段、代码规范 |
| **Codex CLI** | 结构化指令 | 任务描述、修改范围、验收标准 |
| **Cursor** | `.cursorrules` | AI 行为配置、项目上下文 |
| **Windsurf** | 自定义格式 | 任务拆解、上下文管理 |
| **Cline** | 结构化任务 | 分步指令、验收条件 |
| **Continue** | 配置文件 | AI 辅助编程规则 |
| **Aider** | 命令行指令 | Git 集成、代码修改 |
| **Lovable** | 自然语言 | 产品级描述 |
| **Bolt** | 项目配置 | 快速原型搭建 |
| **Replit Agent** | 任务脚本 | 在线开发环境指令 |

### 5. 项目工作空间

每个项目包含：

- 📝 对话历史
- 📄 生成的文档（PRD、架构、数据库设计）
- 🔖 Prompt 仓库（版本化）
- 📁 知识库（上传的文件、GitHub 仓库）

### 6. 知识库系统

支持上传：

- PDF、Word、Markdown 文档
- GitHub 仓库链接
- ZIP 源码包
- 图片、设计稿
- Figma 链接

AI 自动分析项目现状，提供针对性建议。

### 7. 行业模板库

内置模板：

- **SaaS**：用户系统、权限、订阅、支付
- **电商**：商品、订单、库存、支付
- **AI 应用**：Chat、模型管理、Prompt 管理、Token 统计
- **博客**：CMS、SEO、评论

## 🏗️ 技术架构

### 前端

- **Next.js 15** - React 全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式方案
- **shadcn/ui** - 组件库
- **React Query** - 数据获取与缓存

### 后端

- **Fastify** - 高性能 Node.js 框架
- **Prisma** - ORM
- **PostgreSQL** - 主数据库
- **Redis** - 缓存与限流

### AI 层

- **LangGraph** - Agent 编排框架
- **OpenAI SDK** - OpenAI 兼容 API
- **Anthropic SDK** - Claude 原生支持

### 部署

**方案 1：云端部署**

```
Vercel (前端) + Supabase (数据库 + 认证 + 存储)
```

**方案 2：私有部署**

```yaml
# docker-compose.yml
services:
  web:      # Next.js
  api:      # Fastify
  postgres: # 数据库
  redis:    # 缓存
  minio:    # 对象存储
```

## 🚀 快速开始

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/baotuo-vibeforge.git
cd baotuo-vibeforge

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env

# 启动数据库
docker-compose up -d postgres redis

# 运行数据库迁移
pnpm db:migrate

# 启动开发服务器
pnpm dev
```

### Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 💰 定价方案

| 方案 | 价格 | 功能 |
|------|------|------|
| **Free** | 免费 | 1 个 AI Provider<br>每日限制<br>3 个项目 |
| **Pro** | ¥49/月 | 无限项目<br>多个模型<br>自定义 Agent |
| **Team** | ¥199/月 | 团队知识库<br>共享模型<br>权限管理 |

## 🗺️ 开发路线图

### MVP (v0.1)

- [x] 数据库设计
- [ ] 用户认证系统
- [ ] AI Provider 管理
- [ ] 对话需求分析
- [ ] Product Manager Agent
- [ ] Architecture Agent
- [ ] Prompt Generator Agent
- [ ] Claude Code + Codex Prompt 生成
- [ ] 项目工作空间

### v0.2

- [ ] UI/UX Designer Agent
- [ ] Database Designer Agent
- [ ] 全部 10 种开发工具支持
- [ ] 知识库上传
- [ ] 行业模板库

### v0.3

- [ ] 团队协作
- [ ] 订阅计费
- [ ] 使用量统计
- [ ] API 接口

## 📝 开发文档

- [数据库设计](./docs/database.md)
- [Agent 系统](./docs/agents.md)
- [Prompt 模板](./docs/prompts.md)
- [API 文档](./docs/api.md)

## 🤝 贡献指南

欢迎提交 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License

## 🙏 致谢

- [LangGraph](https://github.com/langchain-ai/langgraph) - Agent 编排框架
- [Claude Code](https://www.anthropic.com) - AI 编程工具
- [shadcn/ui](https://ui.shadcn.com) - UI 组件库

---

**Built with ❤️ by Baotuo Team**
