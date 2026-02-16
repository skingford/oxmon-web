# OpenAPI 对齐清单

最后更新时间：2026-02-15
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

## 已移除/废弃

- `ChannelConfig` 类型与相关 API：`listChannelConfigs`、`getChannelConfigById`
- 通知与系统页面中的 `system_config_id` 前端依赖

## 文档歧义（需后端确认）

- 路径：`GET /v1/dictionaries/type/{dict_type}`
- 同时声明了 `enabled_only` 为 `in: path` 且 `required: true`，但 path 模板中没有该占位符。
- 当前前端实现：`/v1/dictionaries/type/{dict_type}?enabled_only=true|false`。

## 构建验证

- 已多次执行：`npm run build -- --webpack`
- 结果：通过
