# OpenAPI 对齐清单

最后更新时间：2026-02-17
接口文档：`http://localhost:8080/v1/openapi.json`（OpenAPI 3.1.0, version 0.1.4）

## 已完成对齐

- 写操作统一按 `IdResponse` 处理：
  - alerts rules / alerts history acknowledge resolve
  - notifications channels / silence-windows
  - system configs
  - dictionaries / dictionary types
  - cert domains
  - whitelist agent update/delete
- 通知模块统一使用 `ChannelOverview`，移除旧 `ChannelConfig` 链路与重复请求。
- 通知更新请求体严格按 `UpdateNotificationChannelRequest`：不再提交 `channel_type`、`system_config_id`。
- 告警规则更新请求体严格按 `UpdateAlertRuleRequest`：不再提交 `rule_type`。
- 告警规则列表按 `AlertRuleResponse` 解析；编辑时单独拉取 `AlertRuleDetailResponse`。
- 关键类型字段补齐：
  - `AlertEventResponse.predicted_breach`
  - `CertificateDetails` 扩展字段（序列号、指纹、用途、OCSP/CRL、TLS、链深等）
  - 各 `Update*Request` 的 nullable 语义
- 列表查询参数对齐 OpenAPI（新增筛选参数类型与调用签名）：
  - agents / whitelist
  - alerts active / rules
  - notifications channels / silence-windows
  - certs status
  - dictionaries types
- metrics 维度接口补齐分页语义：
  - `getMetricAgents`、`getMetricNames` 默认自动翻页拉全量（显式传 `limit/offset` 时按单页请求）。
- 登录接口字段对齐：
  - 前端登录与存储统一使用 `LoginResponse.access_token`，不再保留 `token` 兼容字段。
  - 登录请求改为 `encrypted_password`，并接入 `GET /v1/auth/public-key` + `RSA-OAEP-SHA256` 加密流程。
- 改密接口字段对齐：
  - `ChangePasswordRequest` 改为 `encrypted_current_password` / `encrypted_new_password`。
  - 系统页改密操作接入 `GET /v1/auth/public-key` + `RSA-OAEP-SHA256` 加密流程。
  - 改密成功后清除本地 token 并跳转登录页（与后端“需重新登录”语义一致）。
- 域名批量创建响应对齐：
  - `POST /v1/certs/domains/batch` 前端返回类型修正为 `IdResponse[]`（与 OpenAPI 201 响应一致）。

## 已移除/废弃

- `ChannelConfig` 类型与相关 API：`listChannelConfigs`、`getChannelConfigById`
- 通知与系统页面中的 `system_config_id` 前端依赖

## 文档歧义（需后端确认）

- 路径：`GET /v1/dictionaries/type/{dict_type}`
- OpenAPI 将 `enabled_only`、`key__contains`、`label__contains` 标成了 `in: path` 且 `required: true`，但 path 模板只有 `{dict_type}`。
- 后端实际行为是 Query 参数；当前前端实现：
  - `/v1/dictionaries/type/{dict_type}?enabled_only=true|false`
  - 支持附加 `key__contains` / `label__contains` 过滤参数。
- 下列接口 `200` 响应在 OpenAPI 中缺少 `content/schema`，但后端实际返回 JSON：
  - `GET /v1/alerts/active`
  - `GET /v1/alerts/summary`
  - `GET /v1/certs/domains/{id}/history`
  - `GET /v1/certs/summary`
  - `GET /v1/metrics/summary`
  - `POST /v1/auth/password`
  - `POST /v1/notifications/channels/{id}/test`
  - `POST /v1/system/storage/cleanup`

## 构建验证

- 已多次执行：`npm run build -- --webpack`
- 结果：通过
