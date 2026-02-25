# 前端复制 curl 联调规则说明

最后更新时间：2026-02-25

## 目标

统一说明前端页面中“复制 curl”能力的行为规则，避免联调时对 token、app-id、脱敏、`-k` 选项产生误解。

## 当前覆盖页面（已接入）

- 证书概览页：`/[language]/certificates`
- 证书状态页：`/[language]/certificates/status`
- 云实例详情页：`/[language]/cloud/instances/[id]`
- 云账户列表页：`/[language]/cloud`（调试 curl 菜单）
- 云账户新增/编辑弹窗：`/[language]/cloud`

## 复制内容的统一规则

### 1. 自动注入认证头

复制出的 curl 会自动包含：

- `ox-app-id: <value>`
- `Authorization: Bearer <token>`

取值来源：

- `ox-app-id`：`NEXT_PUBLIC_OX_APP_ID`
- `token`：浏览器 `localStorage.token`

回退策略（本地未取到值时）：

- `ox-app-id` → `<YOUR_OX_APP_ID>`
- `token` → `<YOUR_TOKEN>`

## 2. URL 组装规则

- 优先使用 `NEXT_PUBLIC_API_BASE_URL`
- 未配置时使用相对路径（如 `/v1/certs/status?...`）
- Query 参数基于“当前已应用筛选”或“当前页面上下文（如实例 ID）”

## 3. `-k`（忽略证书校验）选项

支持两种复制方式：

- `普通（校验证书）`
- `-k（忽略证书校验）`

用途：

- 本地 HTTPS 自签名证书联调时使用 `-k`
- 正常环境联调优先使用“普通”

说明：

- `-k` 仅影响 curl TLS 证书校验
- 不改变请求 URL、header、body 内容

## 4. 请求体脱敏规则（写操作）

对于带请求体的 curl（如云账户 `POST/PUT`），前端会对请求体执行脱敏后再复制。

### 脱敏范围（默认）

字段名命中以下模式会被替换为 `***`（大小写不敏感）：

- `secret`
- `password` / `passwd` / `pwd`
- `access_key`
- `secret_key`
- `api_key`
- `app_key`
- `private_key`
- `credential`

### Token 不脱敏（当前策略）

当前云账户复制逻辑对请求体采用路径级白名单：

- `config.token` 不脱敏（保留原值）

这样可以：

- 保留需要联调验证的 token 字段
- 继续隐藏其他敏感配置（如 `secret_key`）

## 5. Header 脱敏能力（工具层）

`src/lib/api-curl.ts` 已支持对 `extraHeaders` 做可配置脱敏，但当前页面默认未启用。

默认行为：

- 内置 `Authorization` 与 `ox-app-id` 不脱敏
- 仅当页面调用显式传入 `redactHeaders` 时才会对 `extraHeaders` 生效

## 6. 复用组件与工具

### UI 组件

- `src/components/ui/copy-curl-dropdown.tsx`
  - `CopyCurlDropdown`：按钮触发型（普通 / `-k`）
  - `CopyCurlSubmenu`：菜单二级项型（普通 / `-k`）
- `src/components/ui/http-method-badge.tsx`
  - 统一显示 `GET/POST/PUT/...` 方法徽标

### 生成工具

- `src/lib/api-curl.ts`
  - `buildApiUrl`
  - `buildApiCurlCommand`
  - `copyApiCurlCommand`

支持能力：

- 自动注入 token / app-id
- `insecure`（输出 `-k`）
- 请求体脱敏（含路径级白名单）
- 可选 `extraHeaders`
- 可选 `redactHeaders`

## 7. 联调建议

- 发给后端排查时，优先使用“复制 curl”而不是手写命令，减少参数遗漏。
- 如果是 HTTPS 自签名环境，明确说明你使用的是 `-k` 版本。
- 如果后端需要真实密钥字段排查，确认是否必须提供；默认复制内容可能已脱敏。
- 若需要扩展到新页面，优先复用：
  - `CopyCurlDropdown` / `CopyCurlSubmenu`
  - `copyApiCurlCommand`

