"use client"

import { useMemo } from "react"
import {
  createTranslator,
  type AppMessagePath,
  type MessageValues,
} from "@/components/app-messages"
import { useAppLocale } from "@/hooks/use-app-locale"

type AppTranslator = (path: AppMessagePath, values?: MessageValues) => string

export function useAppTranslator(): {
  locale: ReturnType<typeof useAppLocale>
  t: AppTranslator
} {
  const locale = useAppLocale()
  const t = useMemo(() => createTranslator(locale), [locale])

  return {
    locale,
    t,
  }
}
