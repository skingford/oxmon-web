import { ApiRequestError, getApiErrorMessage } from "@/lib/api"

export function getStatusAwareMessage(
  error: unknown,
  fallback: string,
  statusMessages?: Partial<Record<number, string>>
) {
  if (error instanceof ApiRequestError && statusMessages?.[error.status]) {
    return statusMessages[error.status] as string
  }

  return getApiErrorMessage(error, fallback)
}
