# 页面联调结果模板

测试日期：`YYYY-MM-DD`  
测试环境：`dev / staging / prod`  
前端分支：`<branch>`  
后端版本：`openapi 0.1.4`  
测试人：`<name>`

参考清单：`docs/page-api-smoke-checklist.md`

## 总体结论

- 结论：`通过 / 部分通过 / 未通过`
- 阻塞问题数：`0`
- 非阻塞问题数：`0`
- 备注：`...`

## 页面结果

### 1. Dashboard

- 页面：`/[language]`、`/[language]/dashboard`
- 状态：`通过 / 失败 / 未测`
- 结果说明：`...`
- 缺陷记录：`...`

### 2. Agents

- 页面：`/[language]/agents`、`/[language]/agents/[id]`
- 状态：`通过 / 失败 / 未测`
- 结果说明：`...`
- 缺陷记录：`...`

### 3. Whitelist

- 页面：`/[language]/whitelist`
- 状态：`通过 / 失败 / 未测`
- 结果说明：`...`
- 缺陷记录：`...`

### 4. Alerts（活动/历史/详情）

- 页面：`/[language]/alerts`、`/[language]/alerts/history`、`/[language]/alerts/[id]`
- 状态：`通过 / 失败 / 未测`
- 结果说明：`...`
- 缺陷记录：`...`

### 5. Alert Rules

- 页面：`/[language]/alerts/rules`
- 状态：`通过 / 失败 / 未测`
- 结果说明：`...`
- 缺陷记录：`...`

### 6. Certificates

- 页面：`/[language]/certificates`、`/[language]/certificates/[id]`
- 状态：`通过 / 失败 / 未测`
- 结果说明：`...`
- 缺陷记录：`...`

### 7. Certificate Domains

- 页面：`/[language]/certificates/domains`、`/[language]/certificates/status`
- 状态：`通过 / 失败 / 未测`
- 结果说明：`...`
- 缺陷记录：`...`

### 8. Notifications（渠道/详情/日志/静默窗口）

- 页面：`/[language]/notifications`、`/[language]/notifications/[id]`、`/[language]/notifications/logs`、`/[language]/notifications/silence`
- 状态：`通过 / 失败 / 未测`
- 结果说明：`...`
- 缺陷记录：`...`

### 9. System & Dictionaries

- 页面：`/[language]/system`、`/[language]/system/dictionaries`、`/[language]/system/dictionaries/types`
- 状态：`通过 / 失败 / 未测`
- 结果说明：`...`
- 缺陷记录：`...`

### 10. Metrics

- 页面：`/[language]/metrics`
- 状态：`通过 / 失败 / 未测`
- 结果说明：`...`
- 缺陷记录：`...`

## 重点回归项（建议逐条勾选）

- [ ] 写操作均按 `IdResponse` 处理，前端不依赖返回完整对象
- [ ] 通知模块仅使用 `ChannelOverview`，无重复配置请求
- [ ] 通知编辑不允许修改 `channel_type`
- [ ] 告警规则列表按 `AlertRuleResponse` 展示，编辑前单独拉详情
- [ ] 系统配置启用/禁用、删除逻辑与后端返回一致
- [ ] 字典类型/条目增删改后列表刷新正常
- [ ] 证书域名自动创建流程使用返回 `id` 回查详情
- [ ] 静默窗口编辑流程（新建+可选删除旧项）结果正确
- [ ] 登录、修改密码、鉴权过期跳转行为正常

## 接口歧义确认记录

- 项目：`GET /v1/dictionaries/type/{dict_type}` 的 `enabled_only` 参数定义
- 当前前端实现：`query 参数`
- 后端确认结论：`...`
- 处理动作：`...`

## 缺陷明细（可复制多条）

### BUG-001

- 严重级别：`P0 / P1 / P2 / P3`
- 页面：`...`
- 接口：`METHOD /v1/...`
- 复现步骤：
  1. ...
  2. ...
  3. ...
- 实际结果：`...`
- 预期结果：`...`
- 请求样例：`...`
- 响应样例：`...`
- 关联日志/截图：`...`
- 结论：`待修复 / 已修复待回归 / 已关闭`

