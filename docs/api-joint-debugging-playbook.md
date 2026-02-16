# API 联调执行手册

最后更新时间：2026-02-15

## 目标

提供统一的 API 联调执行入口，减少遗漏与重复沟通。

## 使用顺序（建议）

1. 先看对齐现状  
   `docs/openapi-alignment-report.md`
2. 按页面执行联调  
   `docs/page-api-smoke-checklist.md`
3. 记录联调结果  
   `docs/page-api-smoke-result-template.md`
4. 提交缺陷并分级  
   `docs/bug-triage-template.md`

## 快速入口

- 对齐报告：`docs/openapi-alignment-report.md`
- 联调清单：`docs/page-api-smoke-checklist.md`
- 结果模板：`docs/page-api-smoke-result-template.md`
- 缺陷规范：`docs/bug-triage-template.md`

## 执行建议

- 每次联调固定记录：
  - 前端分支
  - 后端版本
  - 环境（dev/staging/prod）
  - 测试日期与执行人
- 每个页面至少覆盖：
  - 成功路径
  - 参数错误路径（400）
  - 资源不存在（404）
  - 冲突（409，若适用）
- 写操作统一验证：
  - 前端是否仅依赖 `IdResponse`
  - 页面是否通过刷新/回查正确更新数据

## 联调产物提交清单

- [ ] 已更新 `docs/page-api-smoke-result-template.md` 的当次结果
- [ ] 所有失败项已按 `docs/bug-triage-template.md` 提单
- [ ] 对齐差异已回写 `docs/openapi-alignment-report.md`

## 当前已知注意点

- 字典接口 `GET /v1/dictionaries/type/{dict_type}` 的 `enabled_only` 参数在 OpenAPI 定义存在歧义，需要后端最终确认。

