import { DevelopmentTool } from "@prisma/client"

export interface PromptTemplate {
  tool: DevelopmentTool
  name: string
  generate: (context: PromptContext) => string
}

export interface PromptContext {
  projectName: string
  description?: string
  prd?: string
  architecture?: string
  databaseDesign?: string
  techStack?: {
    frontend: string[]
    backend: string[]
    database: string[]
  }
}

export const PROMPT_TEMPLATES: Record<DevelopmentTool, PromptTemplate> = {
  CLAUDE_CODE: {
    tool: "CLAUDE_CODE",
    name: "Claude Code (CLAUDE.md)",
    generate: (ctx) => `# ${ctx.projectName}

${ctx.description || ""}

## Project Context

${ctx.prd || "项目需求文档待生成"}

## Technical Architecture

${ctx.architecture || "技术架构待设计"}

## Database Schema

${ctx.databaseDesign || "数据库设计待完成"}

## Development Guidelines

### Tech Stack

${ctx.techStack ? `
- **Frontend**: ${ctx.techStack.frontend.join(", ")}
- **Backend**: ${ctx.techStack.backend.join(", ")}
- **Database**: ${ctx.techStack.database.join(", ")}
` : "技术栈待确定"}

### Code Standards

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 编写清晰的注释和文档
- 保持代码模块化和可测试性

### Development Phases

#### Phase 1: Foundation
- 项目初始化和配置
- 数据库 Schema 设计和迁移
- 核心模型和 API 结构

#### Phase 2: Core Features
- 实现主要业务逻辑
- API 端点开发
- 前端组件构建

#### Phase 3: Integration
- 前后端集成
- 测试和调试
- 性能优化

#### Phase 4: Polish
- UI/UX 完善
- 错误处理
- 文档完善

## Testing Requirements

- 单元测试覆盖核心逻辑
- API 集成测试
- E2E 测试关键流程

## Acceptance Criteria

- 所有核心功能正常工作
- 代码通过 lint 检查
- 测试覆盖率 > 70%
- 性能满足预期
`,
  },

  CODEX: {
    tool: "CODEX",
    name: "OpenAI Codex CLI",
    generate: (ctx) => `# Task: Build ${ctx.projectName}

## Objective
${ctx.description || "构建完整的应用程序"}

## Requirements

### Product Requirements
${ctx.prd || "- 待补充具体需求"}

### Technical Requirements
${ctx.architecture || "- 待补充技术要求"}

## Implementation Scope

### Files to Create/Modify
- 根据架构文档确定需要创建的文件
- 确保代码结构清晰模块化

### Database Schema
${ctx.databaseDesign || "- 待补充数据库设计"}

## Acceptance Criteria
- [ ] 所有核心功能实现
- [ ] 代码通过类型检查
- [ ] 单元测试通过
- [ ] API 端点正常工作
- [ ] UI 界面完整

## Testing Requirements
- 为核心逻辑编写单元测试
- 测试 API 端点
- 验证数据库操作

## Notes
- 遵循项目现有的代码风格
- 确保代码可维护性
- 添加必要的错误处理
`,
  },

  CURSOR: {
    tool: "CURSOR",
    name: "Cursor (.cursorrules)",
    generate: (ctx) => `# ${ctx.projectName}

## Project Overview
${ctx.description || "项目描述"}

## Tech Stack
${ctx.techStack ? `
- Frontend: ${ctx.techStack.frontend.join(", ")}
- Backend: ${ctx.techStack.backend.join(", ")}
- Database: ${ctx.techStack.database.join(", ")}
` : "待确定"}

## Coding Rules

### TypeScript
- 使用严格模式
- 优先使用类型推导
- 避免使用 any 类型

### React/Next.js
- 使用函数组件和 Hooks
- 使用 Server Components 优先
- 保持组件职责单一

### API Design
- RESTful 风格
- 统一错误处理
- 请求验证和类型检查

### Database
- 使用 Prisma ORM
- 编写清晰的 Schema
- 添加适当的索引

### Testing
- Jest + React Testing Library
- 覆盖核心逻辑
- Mock 外部依赖

## Architecture
${ctx.architecture || "待补充"}

## Database Schema
${ctx.databaseDesign || "待补充"}

## Development Workflow
1. 从需求开始，明确功能范围
2. 设计数据模型
3. 实现 API 层
4. 构建 UI 组件
5. 测试和调试
`,
  },

  WINDSURF: {
    tool: "WINDSURF",
    name: "Windsurf",
    generate: (ctx) => `# ${ctx.projectName}

## 项目描述
${ctx.description || ""}

## 需求文档
${ctx.prd || "待补充"}

## 技术架构
${ctx.architecture || "待补充"}

## 数据库设计
${ctx.databaseDesign || "待补充"}

## 任务拆解
1. 项目初始化和配置
2. 数据库 Schema 设计
3. 后端 API 开发
4. 前端界面构建
5. 集成和测试
`,
  },

  CLINE: {
    tool: "CLINE",
    name: "Cline",
    generate: (ctx) => PROMPT_TEMPLATES.WINDSURF.generate(ctx),
  },

  CONTINUE: {
    tool: "CONTINUE",
    name: "Continue",
    generate: (ctx) => PROMPT_TEMPLATES.CURSOR.generate(ctx),
  },

  AIDER: {
    tool: "AIDER",
    name: "Aider",
    generate: (ctx) => `# ${ctx.projectName}

Build this project step by step.

## Requirements
${ctx.description || ""}

${ctx.prd ? `## Product Requirements\n${ctx.prd}` : ""}

${ctx.architecture ? `## Architecture\n${ctx.architecture}` : ""}

${ctx.databaseDesign ? `## Database\n${ctx.databaseDesign}` : ""}

## Implementation Steps
1. Set up project structure
2. Implement database schema
3. Build API layer
4. Create UI components
5. Test and refine
`,
  },

  LOVABLE: {
    tool: "LOVABLE",
    name: "Lovable",
    generate: (ctx) => `Create a ${ctx.projectName}

${ctx.description || ""}

## Key Features
${ctx.prd || "待补充功能列表"}

## Tech Stack
${ctx.techStack ? `${ctx.techStack.frontend.join(", ")}, ${ctx.techStack.backend.join(", ")}` : "待确定"}

Make it beautiful, functional, and user-friendly.
`,
  },

  BOLT: {
    tool: "BOLT",
    name: "Bolt",
    generate: (ctx) => PROMPT_TEMPLATES.LOVABLE.generate(ctx),
  },

  REPLIT_AGENT: {
    tool: "REPLIT_AGENT",
    name: "Replit Agent",
    generate: (ctx) => `Build a ${ctx.projectName}

${ctx.description || ""}

Requirements:
${ctx.prd || "- 待补充"}

Tech stack:
${ctx.techStack ? `${ctx.techStack.frontend.join(", ")}, ${ctx.techStack.backend.join(", ")}` : "待确定"}

Create a fully functional application with clean code and good UX.
`,
  },

  CUSTOM: {
    tool: "CUSTOM",
    name: "Custom",
    generate: (ctx) => PROMPT_TEMPLATES.CLAUDE_CODE.generate(ctx),
  },
}

export function generatePrompt(tool: DevelopmentTool, context: PromptContext): string {
  const template = PROMPT_TEMPLATES[tool]
  if (!template) {
    throw new Error(`Unknown tool: ${tool}`)
  }
  return template.generate(context)
}
