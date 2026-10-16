# 脑洞发电传媒企业官网

企业展示、服务介绍与商务咨询网站。前端为原生 HTML、CSS 和 JavaScript，生产平台为 Cloudflare Pages；咨询接口使用 Pages Functions 向企业微信发送通知。当前无前端构建步骤、数据库或 CRM 后台。

## 项目结构

```text
index.html             页面、内联样式和交互脚本
assets/                图片及商务二维码（当前 22 个文件）
functions/api/lead.js  /api/lead 的 Pages Functions 实现
AGENTS.md              Codex 开发与生产保护规范
```

## 本地开发

使用现有 checkout，不需要额外 worktree。云环境已提供 Node.js 24、npm 和仓库外的 Wrangler 4.151.0。以下启动命令会生成已忽略的本地缓存，不会部署：

```sh
cd /workspace/tom944101-gif.github.io
XDG_CONFIG_HOME=/workspace/.onboarding-config WRANGLER_SEND_METRICS=false /workspace/.onboarding-tools/node_modules/.bin/wrangler pages dev . --ip 127.0.0.1 --port 8788 --persist-to /workspace/.onboarding-state
```

其他机器需先准备兼容的 Node.js 和 Wrangler 4.151.0，并调整路径。不要仅用静态 HTTP 服务验证表单，静态服务不执行 Functions。当前命令未固定兼容日期；未来应在独立配置评审中明确，避免无意改变运行语义。

## 环境变量与绑定

| 名称 | 用途 |
| --- | --- |
| WE_COM_WEBHOOK_URL | 企业微信机器人 HTTPS 通知地址，仅由服务端读取；真实通知必需 |
| LEAD_RATE_LIMIT | 可选的 Cloudflare 限流绑定，不是普通字符串变量 |

生产密钥由 Cloudflare Pages 安全管理；不要提交或输出真实值。本地如确需配置，使用被忽略的 .dev.vars，仅使用隔离测试渠道。仓库不提供真实密钥，未配置通知地址时 POST 接口返回 503。未经明确授权，不进行真实通知测试。云开发环境的网络权限与 Cloudflare 生产网络相互独立。

## 测试与检查

当前没有自动化测试套件、package.json 或 CI。不要把零测试执行描述为测试通过。

文档及配置修改可执行：

```sh
git diff --check
git diff --stat
git status --short
```

获得允许启动本地服务后，可检查首页和图片返回 200，以及 GET /api/lead 返回 405。仅在确认没有任何真实通知绑定的隔离环境中，检查 POST /api/lead 返回 503；不要对生产执行该检查。

未来功能测试应覆盖无效 JSON、非对象输入、字段校验、请求体限制、限流、通知超时及失败响应；通知成功路径应模拟网络请求。当前这些测试尚未实现。

## Cloudflare Pages 部署结构

生产分支约定为 main。当前源码无需构建，发布目录应包含 index.html 和 assets/，项目根目录包含 functions/，由 Pages 编译 Functions。GitHub Pages 本身不能运行此接口。

Cloudflare 控制台中的项目根目录、输出目录、兼容日期、生产/预览分支和密钥绑定需要单独核实。不要把本地启动命令当作部署命令。预览使用独立测试资源，禁止默认复用生产企业微信渠道。正式部署与生产配置调整必须经人工批准；本文不执行或更改任何部署设置。

## 分支与 PR 流程

1. 检查工作区，保留现有变更；发现冲突或同名分支先报告。
2. 获取远程 main，基于其最新提交创建任务分支，如 chore/dev-baseline 或 feat/功能名。
3. 最小化修改，按 AGENTS.md 验证并提供差异、测试和风险报告。
4. 人工批准后再提交、推送和创建 PR；推送前确认 Cloudflare 分支触发规则。
5. 经审阅与必要检查后人工决定合并和部署，禁止自动合并或直接向 main 提交。

建议在 GitHub 配置 main 分支保护与必需检查；当前是否启用尚未验证。

## 常见问题

- **表单 503**：通知变量未配置或格式不匹配。只检查绑定状态，不输出值；生产排查需授权。
- **表单 502**：可能是网络、超时或企业微信返回失败；避免记录客户数据及完整通知地址。
- **表单 429**：限流触发。是否配置限流绑定需在相应环境核实。
- **GET 接口 405**：预期行为，该接口通过 POST 接收表单。
- **本地只有页面可用**：确认使用 Pages 开发服务，而非纯静态服务器。
- **npm 缓存目录不可写**：云安装脚本使用 /workspace/.npm-cache，不要关闭 TLS 或包完整性验证。
- **出现 .wrangler/**：本地生成缓存，保留并忽略，不提交源码映射或生成 Worker。

## 代码质量工具建议

本阶段不安装依赖、不升级技术栈。未来可先引入 ESLint 检查原生 JavaScript；Prettier 应单独评审，避免集中式 HTML 产生大范围格式差异。Vitest 适合模拟 Functions 请求、绑定及 fetch，Playwright 适合页面与表单端到端检查。TypeScript 可在 CRM 等新增模块中评估，当前官网无需强制迁移。引入工具时单独提交配置、锁文件及有意义的测试，并隔离生产通知。
