import { ApiRequestError, getApiErrorMessage } from "@/lib/api"
import { toast as sonnerToast } from "sonner"

type ToastOptions = Parameters<typeof sonnerToast.error>[1]
type StatusMessages = Partial<Record<number, string>>
type SuccessToastOptions = Parameters<typeof sonnerToast.success>[1]

const TOAST_DURATIONS = {
  success: 2200,
  info: 3000,
  warning: 3200,
  error: 3600,
  loading: 10000,
} as const

function withDefaultDuration<T extends (message: any, options?: any) => any>(
  fn: T,
  duration: number
) {
  return ((message: Parameters<T>[0], options?: Parameters<T>[1]) =>
    fn(message, {
      duration,
      ...options,
    })) as T
}

export const toast = Object.assign(
  ((...args: Parameters<typeof sonnerToast>) => sonnerToast(...args)) as typeof sonnerToast,
  sonnerToast,
  {
    success: withDefaultDuration(sonnerToast.success, TOAST_DURATIONS.success),
    info: withDefaultDuration(sonnerToast.info, TOAST_DURATIONS.info),
    warning: withDefaultDuration(sonnerToast.warning, TOAST_DURATIONS.warning),
    error: withDefaultDuration(sonnerToast.error, TOAST_DURATIONS.error),
    loading: withDefaultDuration(sonnerToast.loading, TOAST_DURATIONS.loading),
  }
)

export function toastApiError(
  error: unknown,
  fallbackMessage: string,
  options?: ToastOptions
) {
  return toast.error(getApiErrorMessage(error, fallbackMessage), options)
}

export function toastStatusError(
  error: unknown,
  fallbackMessage: string,
  statusMessages?: StatusMessages,
  options?: ToastOptions
) {
  if (error instanceof ApiRequestError && statusMessages?.[error.status]) {
    return toast.error(statusMessages[error.status] as string, options)
  }

  return toastApiError(error, fallbackMessage, options)
}

export function toastCopied(message = "已复制", options?: SuccessToastOptions) {
  return toast.success(message, options)
}

export function toastSaved(message = "已保存", options?: SuccessToastOptions) {
  return toast.success(message, options)
}

export function toastCreated(message = "已创建", options?: SuccessToastOptions) {
  return toast.success(message, options)
}

export function toastDeleted(message = "已删除", options?: SuccessToastOptions) {
  return toast.success(message, options)
}

export function toastActionSuccess(message = "操作成功", options?: SuccessToastOptions) {
  return toast.success(message, options)
}
