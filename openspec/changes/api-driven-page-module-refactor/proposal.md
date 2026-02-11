## Why

当前页面与模块组织以展示型组件为主，和真实接口能力的映射不稳定，导致功能落地需要重复改动页面结构、状态处理和交互逻辑。随着功能扩展，这种结构会持续放大维护成本与联调风险，因此需要以接口契约为核心对页面和模块进行一次完整重构。

目前相关页面尚未投入生产使用，不存在必须保持界面兼容的约束，因此采用“整页删除后按接口重建”的方案可以显著缩短改造路径并降低过渡成本。

## What Changes

- 以后端接口能力为基准重构页面信息架构，重新定义页面职责、模块边界和数据流。
- 将关键业务页面（如 dashboard / metrics / domains / agents / alerts / settings）改造成“路由容器 + 业务模块 + 复用 UI 原子组件”的分层结构。
- 建立统一的异步数据处理范式（loading / error / empty / success），并统一请求、转换、错误提示和重试策略。
- 对现有与真实业务不匹配的演示型/临时型页面模块进行整页删除，并以接口驱动的新页面实现替换。**BREAKING**
- 强化类型约束：接口返回结构、页面视图模型和模块输入输出使用统一 TypeScript 类型契约。

## Capabilities

### New Capabilities
- `api-driven-feature-pages`: 定义“接口契约 -> 页面能力 -> 模块编排”的映射规则，确保页面功能按接口真实能力构建。
- `moduleized-domain-ui-architecture`: 定义页面级、功能级、基础 UI 级三层模块边界与组合规范，支持可替换与可扩展。
- `unified-async-state-experience`: 定义全站一致的异步状态体验与错误恢复机制，覆盖列表、详情与配置类页面。

### Modified Capabilities
（无）当前仓库暂无既有 openspec capability 需要做 requirement 级变更。

## Impact

- 主要影响目录：`src/app/[locale]/(dashboard)/*`、`src/app/[locale]/*`、`src/components/pages/*`、`src/components/features/*`、`src/actions/*`、`src/lib/types.ts`。
- 可能影响 i18n 文案与路由级 metadata（`src/lib/i18n.ts`、`src/lib/seo-metadata.ts`）。
- 将减少页面层对临时数据结构的耦合，增加对接口契约、类型定义和错误处理策略的一致性要求。
- 由于旧页面尚未投入使用，本次不保留 UI 向后兼容；迁移策略以“删除旧页面文件并切换到新路由实现”为主。
