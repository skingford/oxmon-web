# OpenAPI 对齐清单

最后更新时间：2026-03-18
接口文档：`http://localhost:8080/v1/openapi.json`（OpenAPI 3.1.0, version 0.1.10）

## 本次对齐范围

- 已按最新 OpenAPI 逐项核对现有前端接口封装与关键页面调用
- 本轮调整以最新接口为准，不再兼容旧参数名、旧返回结构或历史兜底解析
- 本地基线文件已同步：`openapi.json`
- 类型文件已重生成：`src/types/openapi.d.ts`

## 已完成对齐

- 认证与账号
  - 登录继续使用 `access_token`
  - 改密返回按最新空成功响应处理
  - 新增 `POST /v1/auth/logout` 封装
  - 新增登录节流接口封装：
    - `GET /v1/admin/users/login-throttles`
    - `POST /v1/admin/users/unlock-login-throttle`
- 管理员与审计
  - `POST /v1/admin/users` 改为最新成功响应语义
  - `DELETE /v1/admin/users/{id}` 改为最新成功响应语义
  - `POST /v1/admin/users/{id}/password` 改为最新成功响应语义
  - 新增审计安全接口封装：
    - `GET /v1/audit/logs/security-summary`
    - `GET /v1/audit/logs/security-summary/timeseries`
- AI 模块
  - 新增 `POST /v1/ai/accounts/{id}/trigger`
  - 新增 `GET /v1/ai/reports/{id}/instances`
  - 新增 `GET /v1/ai/reports/{id}/view`
  - 单实例 AI 检测按最新响应处理：`POST /v1/cloud/instances/{id}/ai-check` 返回 `report_id`
  - 全量云实例 AI 检测按最新响应处理：`POST /v1/cloud/instances/ai-check` 返回 `job_id`
  - `TriggerCloudAICheckRequest` 不再发送旧字段 `send_notification`
- 云资源与联系人
  - 新增 `POST /v1/cloud/accounts/{id}/diagnose` 封装
  - 新增实例联系人接口封装：
    - `GET /v1/instance-contacts`
    - `POST /v1/instance-contacts`
    - `GET /v1/instance-contacts/{id}`
    - `PUT /v1/instance-contacts/{id}`
    - `DELETE /v1/instance-contacts/{id}`
    - `GET /v1/instance-contacts/match/{agent_id}`
- 系统与证书
  - 新增 `POST /v1/system/certs/backfill-domains`
  - 新增 `POST /v1/notifications/test-cert-report`
  - OpenAPI 基线补齐证书域名概览接口：
    - `GET /v1/certs/domains/overview`
    - `GET /v1/certs/domains/{id}/detail-view`
  - 证书、域名、证书状态、批量创建域名按最新数组响应解析
- 列表接口解析已全部收紧到最新结构
  - 直接声明为数组响应并按当前分页参数包装 `ListResponse`
  - 不再兼容 `data` / `data.items` / 旧混合包裹结构
  - 覆盖模块包括：
    - agents / whitelist / report-logs
    - alerts active / history / rules
    - certificates / cert domains / cert status
    - notifications channels / silence-windows
    - cloud accounts / instances
    - ai accounts / reports / report instances
    - admin users
    - dictionary types / dictionaries by type
    - metrics / metric agents / metric names / metric sources
    - system configs

## 已移除的旧兼容逻辑

- 告警历史不再接收旧筛选参数 `source_id__eq`，仅使用 `agent_id__eq`
- 列表接口不再兼容以下旧返回形态：
  - `data: []`
  - `data: { items: [] }`
  - 根对象 `items` 与旧分页包装混用
- 单实例云 AI 检测页面提示不再兼容旧 `job_id` 展示，改为展示最新 `report_id`
- 全量云 AI 检测页面不再兼容旧 `report_id` 回退，改为只使用最新 `job_id`

## 备注

- `GET /v1/audit/logs` 与部分历史接口在 OpenAPI 中仍缺少明确 `content/schema`，当前前端对这些少数接口保留必要的严格自定义解析
- `next-env.d.ts` 在构建过程中被 Next.js 自动更新为当前版本生成的路由类型引用，属于正常产物变更

## 验证

- `npm exec tsc --noEmit`：通过
- `npm run build -- --webpack`：通过
