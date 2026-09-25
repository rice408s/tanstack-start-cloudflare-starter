# TanStack Start + Cloudflare 启动模板

[English](README.md) | 简体中文

一个免费、MIT 许可的全栈启动模板，基于 **TanStack Start + Cloudflare Workers（D1 / R2）**，自带免密码登录、多语言、MDX 博客和文档，以及让 AI 编程 agent（Claude Code、Codex、Cursor）不跑偏的规则文件。

它是 **ShipKit Lite**：去掉付费模块的 [ShipKit](https://shipkit.sh)。剩下的部分可以独立运行，随便用。

## 包含什么

| 层 | 选型 |
|---|---|
| 框架 | TanStack Start + TanStack Router / Query |
| 运行时 | Cloudflare Workers（`@cloudflare/vite-plugin`，本地开发也跑在 workerd 里） |
| 数据库 | Cloudflare D1 + Drizzle（绑定方式，无需连接串） |
| 登录 | better-auth，免密码：邮箱 6 位验证码；配置密钥后支持 Google 和 GitHub |
| 存储 | R2 绑定（用户头像） |
| 邮件 | Resend；没有密钥时，验证码打印在开发日志里 |
| 多语言 | Paraglide：英文在 `/`，中文在 `/zh`，路由里没有任何语言代码 |
| 内容 | MDX 博客、文档和法律页面，构建时编译 |
| UI | shadcn/ui + Tailwind v4，四套主题（亮色和暗色），落地页由配置数据拼装 |
| 质量 | Biome、Vitest、Playwright，以及用测试来守护的项目规则（`src/core/rules.test.ts`） |

## 快速开始

```bash
bun install
cp .dev.vars.example .dev.vars    # 填 BETTER_AUTH_SECRET：openssl rand -base64 32
bun run cf-typegen
bun run db:migrate:local
bun run dev                       # http://localhost:3000
```

打开 `/login` 用邮箱验证码登录；没有 `RESEND_API_KEY` 时，验证码打印在开发服务器的终端里。

完整步骤：[快速开始](content/docs/getting-started.zh.mdx) · [部署](content/docs/deploy.zh.mdx)。

## 配合 AI agent 使用

用 Claude Code 打开仓库，运行 `/setup`。`/google-oauth` 配置 Google 登录，`/deploy` 部署到 Cloudflare。项目规则写在 `CLAUDE.md` 里；`AGENTS.md` 让 Codex、Cursor、Copilot、Windsurf、opencode、Zed 和 Amp 遵守同一套规则。

## 常用脚本

| 脚本 | 作用 |
|---|---|
| `bun run dev` | 在 workerd 里启动开发服务器，使用本地 D1 / R2 |
| `bun run build` / `deploy` | 生产构建（预渲染营销页）/ 构建后执行 `wrangler deploy` |
| `bun run db:generate` | 根据 schema 生成 Drizzle 迁移 |
| `bun run db:migrate:local` / `:remote` | 执行迁移 |
| `bun run auth:generate` | 修改登录配置后重新生成 better-auth 的表 |
| `bun run typecheck` / `check` | tsc / Biome |
| `bun run test` / `e2e` | Vitest / Playwright |
| `bun run cf-typegen` | 修改 `wrangler.jsonc` 后重新生成 `Env` 类型 |

## 需要更多功能？

[ShipKit](https://shipkit.sh) 是同一套架构的完整版：Stripe 和 Creem 支付（一次性购买、订阅、退款）、按量计费的积分、带角色权限的管理后台、API key、联盟推广、站内通知和审计日志，每个模块都能几分钟内删掉。一次付费，永久使用。

## 许可证

[MIT](LICENSE)
