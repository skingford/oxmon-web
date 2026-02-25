# Toast 使用约定

## 导入方式

- 统一从 `@/lib/toast` 导入
- 不要直接从 `sonner` 导入 `toast`

```ts
import { toast, toastApiError } from "@/lib/toast"
```

## 推荐用法

- 通用提示：`toast.success / toast.error / toast.warning`
- API 错误提示：`toastApiError(error, fallbackMessage)`
- 按状态码映射错误：`toastStatusError(error, fallbackMessage, { 404: "..." })`

## 语义化成功提示

- 创建成功：`toastCreated(...)`
- 保存/更新成功：`toastSaved(...)`
- 删除成功：`toastDeleted(...)`
- 复制成功：`toastCopied(...)`
- 一般动作成功（测试/检查/清理/重置等）：`toastActionSuccess(...)`

## 默认行为

- Toaster 默认位置：`top-center`
- 已在 `src/components/ui/sonner.tsx` 统一配置
- 常见 `toast` 类型已统一默认 `duration`（可在调用时覆盖）
