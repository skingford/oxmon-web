"use client"

import { useCallback, useMemo } from "react"
import {
  createScopedTranslator,
  type AppMessageNamespace,
  type AppMessageNamespacePath,
  type MessageValues,
} from "@/components/app-messages"
import { useAppLocale } from "@/hooks/use-app-locale"

export type AppNamespaceTranslator<Namespace extends AppMessageNamespace> = (
  path: AppMessageNamespacePath<Namespace> | string,
  values?: MessageValues
) => string

export function useAppTranslations<Namespace extends AppMessageNamespace>(
  namespace: Namespace
): {
  locale: ReturnType<typeof useAppLocale>
  t: AppNamespaceTranslator<Namespace>
} {
  const locale = useAppLocale()
  const scopedTranslator = useMemo(() => createScopedTranslator(locale, namespace), [locale, namespace])

  const t = useCallback<AppNamespaceTranslator<Namespace>>(
    (path, values) => scopedTranslator(path as AppMessageNamespacePath<Namespace>, values),
    [scopedTranslator]
  )

  return {
    locale,
    t,
  }
}
