"use client"

import { toastApiError } from "@/lib/toast"

export async function executeAlertRequest(
  task: () => Promise<void>,
  errorMessage: string
) {
  try {
    await task()
    return true
  } catch (error) {
    toastApiError(error, errorMessage)
    return false
  }
}
