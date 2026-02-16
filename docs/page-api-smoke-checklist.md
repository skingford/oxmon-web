# 页面联调清单（基于 OpenAPI 0.1.4）

最后更新时间：2026-02-15  
接口文档：`http://localhost:8080/v1/openapi.json`

## 使用方式

- 在本地登录后，按页面逐条执行。
- 每项至少覆盖：成功路径、404/409 等常见失败路径、列表刷新是否正确。
- 重点验证写接口：前端均按 `IdResponse` 处理，不依赖返回完整对象。

## Dashboard

- 页面：`/[language]`、`/[language]/dashboard`
- 接口：
  - `GET /v1/dashboard/overview`
- 检查：
  - 总览卡片数据正常渲染。
  - 时间范围刷新后无报错。

## Agents

- 页面：`/[language]/agents`、`/[language]/agents/[id]`
- 接口：
  - `GET /v1/agents`
  - `GET /v1/agents/{id}`
  - `GET /v1/agents/{id}/latest`
  - `GET /v1/metrics`
- 检查：
  - 列表分页正常。
  - 详情页能显示最新指标与趋势图。

## Whitelist

- 页面：`/[language]/whitelist`
- 接口：
  - `GET /v1/agents/whitelist`
  - `POST /v1/agents/whitelist`
  - `PUT /v1/agents/whitelist/{id}`
  - `DELETE /v1/agents/whitelist/{id}`
  - `POST /v1/agents/whitelist/{id}/token`
- 检查：
  - 新增返回 token 并展示一次性弹窗。
  - 编辑描述后列表刷新正确。
  - 删除后分页与列表状态正确。
  - 重新生成 token 后弹窗与复制正常。

## Alerts（活动/历史/详情）

- 页面：`/[language]/alerts`、`/[language]/alerts/history`、`/[language]/alerts/[id]`
- 接口：
  - `GET /v1/alerts/active`
  - `GET /v1/alerts/history`
  - `POST /v1/alerts/history/{id}/acknowledge`
  - `POST /v1/alerts/history/{id}/resolve`
  - `GET /v1/alerts/summary`
- 检查：
  - 批量确认/批量解决后状态刷新正确。
  - 历史过滤（状态/级别/时间）生效。
  - 详情页状态流转正确（未处理 -> 已确认 -> 已处理）。

## Alert Rules

- 页面：`/[language]/alerts/rules`
- 接口：
  - `GET /v1/alerts/rules`（列表，`AlertRuleResponse`）
  - `GET /v1/alerts/rules/{id}`（编辑前拉详情）
  - `POST /v1/alerts/rules`
  - `PUT /v1/alerts/rules/{id}`
  - `PUT /v1/alerts/rules/{id}/enable`
  - `DELETE /v1/alerts/rules/{id}`
- 检查：
  - 列表不依赖详情字段（如 `silence_secs`）。
  - 点击编辑时能正确加载详情并回填表单。
  - 启用/禁用、删除后列表刷新正确。

## Certificates

- 页面：`/[language]/certificates`、`/[language]/certificates/[id]`
- 接口：
  - `GET /v1/certificates`
  - `GET /v1/certificates/{id}`
  - `GET /v1/certificates/{id}/chain`
  - `GET /v1/certs/summary`
- 检查：
  - 列表筛选、详情基础字段与链路信息正常显示。
  - 新增扩展字段存在时渲染不报错（序列号、指纹、TLS 等）。

## Certificate Domains

- 页面：`/[language]/certificates/domains`、`/[language]/certificates/status`
- 接口：
  - `GET /v1/certs/domains`
  - `POST /v1/certs/domains`
  - `POST /v1/certs/domains/batch`
  - `GET /v1/certs/domains/{id}`
  - `PUT /v1/certs/domains/{id}`
  - `DELETE /v1/certs/domains/{id}`
  - `POST /v1/certs/domains/{id}/check`
  - `GET /v1/certs/domains/{id}/history`
  - `POST /v1/certs/check`
  - `GET /v1/certs/status`
  - `GET /v1/certs/status/{domain}`
- 检查：
  - 自动创建后用返回 `id` 回查详情再执行检查。
  - 批量导入冲突/成功提示正确。
  - 状态页分页与批量检测刷新正确。

## Notifications（渠道/详情/日志/静默窗口）

- 页面：`/[language]/notifications`、`/[language]/notifications/[id]`、`/[language]/notifications/logs`、`/[language]/notifications/silence`
- 接口：
  - `GET /v1/notifications/channels`
  - `GET /v1/notifications/channels/{id}`
  - `POST /v1/notifications/channels`
  - `PUT /v1/notifications/channels/{id}`
  - `DELETE /v1/notifications/channels/{id}`
  - `POST /v1/notifications/channels/{id}/test`
  - `GET /v1/notifications/logs`
  - `GET /v1/notifications/logs/{id}`
  - `GET /v1/notifications/logs/summary`
  - `GET /v1/notifications/silence-windows`
  - `POST /v1/notifications/silence-windows`
  - `GET /v1/notifications/silence-windows/{id}`
  - `PUT /v1/notifications/silence-windows/{id}`
  - `DELETE /v1/notifications/silence-windows/{id}`
- 检查：
  - 渠道编辑不允许改 `channel_type`（仅创建时可设）。
  - 列表与详情只依赖 `ChannelOverview`，无重复请求。
  - 收件人更新、测试发送、删除渠道流程正常。
  - 静默窗口“编辑=新建+可选删除旧项”流程正常，创建后能用 `id` 追踪来源。

## System & Dictionaries

- 页面：`/[language]/system`、`/[language]/system/dictionaries`、`/[language]/system/dictionaries/types`
- 接口：
  - `GET /v1/system/config`
  - `GET /v1/system/storage`
  - `POST /v1/system/storage/cleanup`
  - `GET /v1/system/configs`
  - `GET /v1/system/configs/{id}`
  - `POST /v1/system/configs`
  - `PUT /v1/system/configs/{id}`
  - `DELETE /v1/system/configs/{id}`
  - `GET /v1/dictionaries/types`
  - `POST /v1/dictionaries/types`
  - `PUT /v1/dictionaries/types/{dict_type}`
  - `DELETE /v1/dictionaries/types/{dict_type}`
  - `GET /v1/dictionaries/type/{dict_type}`（当前前端实现含 `enabled_only` query）
  - `POST /v1/dictionaries`
  - `GET /v1/dictionaries/{id}`
  - `PUT /v1/dictionaries/{id}`
  - `DELETE /v1/dictionaries/{id}`
- 检查：
  - 系统配置启用/禁用走 `IdResponse` 后本地更新正确。
  - 删除系统配置若被后端拒绝（409）提示正确。
  - 字典条目/类型增删改后列表刷新正确。
  - `enabled_only` 过滤生效（受文档歧义影响，需与后端确认最终定义）。

## Metrics

- 页面：`/[language]/metrics`
- 接口：
  - `GET /v1/metrics`
  - `GET /v1/metrics/summary`
  - `GET /v1/metrics/agents`
  - `GET /v1/metrics/names`
- 检查：
  - 查询条件切换后图表和摘要一致。
  - agent 和 metric 名称联动筛选正常。

## 全局基础项

- 登录：`POST /v1/auth/login`
- 修改密码：`POST /v1/auth/password`
- 健康检查（可选）：`GET /v1/health`

