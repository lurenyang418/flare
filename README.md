# Flare Workers

Flare 的 Cloudflare Workers 实现，使用 Hono、Cloudflare D1 和 Workers Static Assets
提供轻量的个人导航页、在线数据编辑和配置管理。

## 功能

- 展示应用、分类书签、搜索、日期和问候语
- 在线调整主题、搜索和页面外观
- 使用 Handsontable 在线编辑应用、书签和分类
- 支持插入行、撤销、重做、剪切、复制、搜索和拖动排序
- 使用 TOML 导入、导出和备份配置
- 使用 Cloudflare D1 持久化数据
- 支持公开首页或全站私有访问
- 通过 GitHub Actions 自动检查并部署到 Cloudflare Workers

## 技术栈

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Hono](https://hono.dev/)
- TypeScript
- Handsontable
- pnpm

## 快速开始

### 环境要求

- Node.js 22
- pnpm 11
- Cloudflare 账号

安装依赖：

```bash
pnpm install
```

### 初始化本地数据库

首次本地运行前，执行数据库初始化：

```bash
pnpm db:migrate:local
```

该命令会在 `.wrangler/` 中创建本地 D1 数据，并写入示例配置、应用和书签。

### 配置本地登录

本地开发 Secret 可以放在项目根目录的 `.dev.vars` 或 `.env` 中。两种格式
Wrangler 都支持，但应二选一；存在 `.dev.vars` 时，Wrangler 不会加载 `.env`。

```dotenv
FLARE_USER="flare"
FLARE_PASS="change-this-password"
```

也可以在本地调试时关闭登录：

```dotenv
DISABLE_LOGIN="true"
```

如果未设置 `FLARE_USER`，默认用户名为 `flare`。如果未设置 `FLARE_PASS`，程序会生成
随机密码，因此无法使用固定密码登录；本地开发应明确设置密码或关闭登录。

`.dev.vars*` 和 `.env*` 已加入 `.gitignore`，不要提交其中的 Secret。

### 启动本地服务

```bash
pnpm dev
```

默认访问地址为 <http://localhost:8787>。

常用入口：

| 路径 | 用途 |
| --- | --- |
| `/` | 首页 |
| `/editor` | 在线编辑应用、书签和分类 |
| `/settings/application` | 登录、退出和数据导入导出 |
| `/settings/theme` | 主题设置 |
| `/settings/search` | 搜索设置 |
| `/settings/appearance` | 页面外观设置 |
| `/icons` | MDI 图标速查 |
| `/ping` | 健康检查 |

## 配置

非敏感配置位于 `wrangler.toml`：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `ENABLE_EDITOR` | `"true"` | 是否在帮助页面显示内容编辑入口，不会禁用 `/editor` 路由 |
| `VISIBILITY` | `"DEFAULT"` | `DEFAULT` 公开首页；`PRIVATE` 要求登录后访问首页 |

认证相关环境变量：

| Secret | 说明 |
| --- | --- |
| `FLARE_USER` | 登录用户名，未设置时默认为 `flare` |
| `FLARE_PASS` | 登录密码，同时用于签名登录 Session |
| `DISABLE_LOGIN` | 设置为 `"true"` 时跳过登录，仅建议用于本地调试 |

生产环境不要将敏感值写入 `wrangler.toml`。使用 Wrangler 设置 Worker Secret：

```bash
pnpm wrangler secret put FLARE_USER
pnpm wrangler secret put FLARE_PASS
```

## 部署到 Cloudflare

### 创建 D1 数据库

Fork 或首次部署时，先登录 Cloudflare 并创建自己的 D1 数据库：

```bash
pnpm wrangler login
pnpm db:create
```

确认 `wrangler.toml` 中 D1 binding 保持为 `DB`，并将 `database_id` 更新为新数据库
的 ID。

对全新的远程数据库执行一次初始化：

```bash
pnpm db:migrate:remote
```

`0001_initial.sql` 包含初始示例数据，不应对已有远程数据库重复执行。

### 手动部署

```bash
pnpm typecheck
pnpm deploy
```

Wrangler 登录状态只适用于本机。部署前还应确认远程 Worker 已配置
`FLARE_USER` 和 `FLARE_PASS`。

## GitHub Actions 自动部署

工作流位于 `.github/workflows/deploy.yml`：

- Pull Request：安装依赖并运行 TypeScript 类型检查
- 推送到 `main`：类型检查通过后部署 Worker
- `workflow_dispatch`：支持从 GitHub 手动触发部署

在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中添加：

| GitHub Secret | 获取方式 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard > Account API Tokens，创建并限制到目标账号的 Workers 编辑 Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard 中目标账号的 Account ID |

这两个 GitHub Secret 只用于 CI 部署，不能替代 Worker 运行时使用的
`FLARE_USER` 和 `FLARE_PASS`。当前工作流使用 Wrangler Action，因此
`CLOUDFLARE_ACCOUNT_ID` 是必需的。

## 数据导入与备份

登录后访问 `/settings/application`，可以：

- 导出 `config.toml`、`apps.toml` 和 `bookmarks.toml`
- 下载单个 TOML 文件
- 将 TOML 文件重新导入 D1

在线编辑器位于 `/editor`。保存时会更新 D1 中的分类、应用和书签数据。

对生产数据做批量编辑或执行数据库迁移前，建议先导出 TOML 备份。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动本地 Worker |
| `pnpm typecheck` | 运行 TypeScript 类型检查 |
| `pnpm db:create` | 创建名为 `flare-db` 的远程 D1 数据库 |
| `pnpm db:migrate:local` | 初始化本地 D1 数据库 |
| `pnpm db:migrate:remote` | 初始化远程 D1 数据库 |
| `pnpm deploy` | 部署到 Cloudflare Workers |

## 项目结构

```text
.
├── .github/workflows/deploy.yml  # CI 和自动部署
├── public/                       # 静态资源
├── src/
│   ├── db/                       # D1 schema 和初始化 SQL
│   ├── handlers/                 # 页面及 API handlers
│   ├── middleware/               # 登录认证和日志
│   ├── services/                 # HTML 渲染和 TOML 转换
│   ├── types/                    # TypeScript 数据类型
│   ├── utils/                    # 数据库、主题、图标等工具
│   └── index.ts                  # Worker 入口及路由
├── package.json
└── wrangler.toml                 # Worker、D1、Assets 和变量配置
```

## 安全说明

- 不要提交 `.dev.vars`、`.env`、API Token 或登录密码。
- 生产环境不要设置 `DISABLE_LOGIN=true`。
- `VISIBILITY=DEFAULT` 时首页公开，但设置、编辑器和 TOML API 仍要求登录。
- `VISIBILITY=PRIVATE` 时首页、应用、书签和帮助页面也要求登录。
- API Token 应限制到目标 Cloudflare 账号，并仅授予部署所需权限。

## 参考文档

- [Workers 本地 Secret](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Workers GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Cloudflare D1 入门](https://developers.cloudflare.com/d1/get-started/)
