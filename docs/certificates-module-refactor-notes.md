# 证书模块重构说明（页面拆分与 Hook 收敛）

更新时间：2026-02-25

## 目标

本轮重构目标是降低证书模块页面体积与复杂度，提升可维护性与回归安全性，主要手段：

- 将大段弹窗/表格/筛选 UI 抽离为独立组件
- 将 URL 查询参数同步、自动检查流程、草稿持久化等副作用逻辑抽离为 Hook
- 将证书页面重复工具函数提取为共享 util

## 重构范围

- `src/app/[language]/(dashboard)/certificates/[id]/page.tsx`
- `src/app/[language]/(dashboard)/certificates/domains/page.tsx`
- `src/app/[language]/(dashboard)/certificates/status/page.tsx`
- `src/app/[language]/(dashboard)/certificates/page.tsx`

## 新增组件（证书模块）

目录：`src/components/pages/certificates/`

- `monitoring-domain-config-dialog.tsx`
  - 证书详情页监控配置创建/编辑弹窗（通用表单视图）
- `domain-create-dialog.tsx`
  - 域名监控新增弹窗
- `domain-batch-create-dialog.tsx`
  - 域名监控批量新增弹窗
- `domain-auto-create-dialog.tsx`
  - 自动创建并检查弹窗（含高级参数折叠与清空确认）
- `domain-history-dialog.tsx`
  - 域名检查历史弹窗
- `domain-delete-dialog.tsx`
  - 域名删除确认弹窗
- `domain-header-actions.tsx`
  - 域名页顶部操作栏（检查全部/刷新 + children）
- `domain-stats-cards.tsx`
  - 域名页统计卡片组
- `domain-filters-card.tsx`
  - 域名页筛选卡片（搜索 + 状态筛选）
- `domain-table-card.tsx`
  - 域名页表格卡片（表格、空态、行操作、分页）

## 新增 Hook（证书模块）

目录：`src/hooks/`

- `use-certificate-monitoring-config.ts`
  - 证书详情页监控配置业务状态与动作
  - 包含：关联域名查询、创建/编辑、可选自动检查、智能默认开关逻辑
- `use-certificate-auto-create-draft.ts`
  - `domains` 页自动创建高级参数草稿（sessionStorage 恢复与持久化）
- `use-certificate-domains-query-state.ts`
  - `domains` 页 `domain/status/offset` 查询状态与 URL 同步
- `use-certificate-domains-auto-check-flow.ts`
  - `domains` 页 `autoCheck=1` 的自动检查入口流程（匹配/检查/进入自动创建）
- `use-certificate-status-query-state.ts`
  - `status` 页 `search/offset` 查询状态与 URL 同步

## 共享 util

目录：`src/lib/certificates/`

- `formats.ts`
  - `formatCertificateDateTime`
  - `parseOptionalNonNegativeInt`

## 当前页面职责建议（约定）

### 页面（Page）

页面文件尽量只负责：

- 路由参数读取
- 顶层数据获取与错误跳转
- 组合组件与 Hook
- 跨模块编排（例如刷新证书详情后再刷新监控配置）

避免在页面内继续堆叠：

- 大段 Dialog JSX
- URL 同步细节
- sessionStorage 持久化细节
- 自动流程状态机（如 autoCheck 入口分支）

### 组件（UI 视图块）

组件优先保持：

- 无业务副作用
- 通过 props 驱动
- 只处理显示逻辑与事件抛出

### Hook（业务状态与副作用）

Hook 优先收敛：

- 同一主题的一组 state
- 关联的 `useEffect`
- 可复用的流程（如 URL 同步、自动检查入口）

## 后续扩展建议

### 1. 新增域名页功能（优先）

如果 `certificates/domains` 继续加功能，优先新增：

- 独立组件：表格列/操作区变化时
- 独立 Hook：新增一组副作用（URL、存储、自动流程）时

### 2. 测试优先级（建议）

先测 Hook，再测页面：

- `use-certificate-domains-query-state`
- `use-certificate-domains-auto-check-flow`
- `use-certificate-status-query-state`

原因：

- 输入输出清晰
- 对 URL 同步与自动流程回归价值高
- 不依赖复杂 DOM 结构

## 回归检查清单（建议）

### 证书详情页 `/certificates/[id]`

- 关联监控域名配置可正确加载
- 未找到关联监控域名时可创建配置
- 编辑配置后保存成功
- “保存后立即检查”开关行为符合预期（默认与手动覆盖）
- 保存/创建后证书详情状态正确刷新

### 域名监控页 `/certificates/domains`

- 搜索/状态筛选与 URL 参数双向同步
- 分页与 URL 参数同步
- `autoCheck=1` 时可自动检查或进入自动创建
- 自动创建高级参数草稿可恢复/持久化/清空
- 历史弹窗/删除弹窗/新增/批量新增弹窗行为正常

### 证书状态页 `/certificates/status`

- 搜索与分页 URL 参数双向同步
- 刷新与全部检查动作正常

## 注意事项

- 当前仓库尚未配置正式测试框架；如要补单测，建议先引入 `vitest` + `@testing-library/react`
- `domains/page.tsx` 虽已显著收敛，但仍是业务编排中心，后续修改应优先在组件/Hook 层扩展
