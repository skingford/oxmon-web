"use client"

import { useMemo } from "react"
import {
  createScopedTranslator,
  type AppMessageNamespace,
  type AppMessageNamespacePath,
  type MessageValues,
} from "@/components/app-messages"
import { useAppLocale } from "@/hooks/use-app-locale"

type NamespaceTranslator<Namespace extends AppMessageNamespace> = (
  path: AppMessageNamespacePath<Namespace>,
  values?: MessageValues
) => string

export function useAppTranslations<Namespace extends AppMessageNamespace>(
  namespace: Namespace
): {
  locale: ReturnType<typeof useAppLocale>
  t: NamespaceTranslator<Namespace>
} {
  const locale = useAppLocale()
  const t = useMemo(() => createScopedTranslator(locale, namespace), [locale, namespace])

  return {
    locale,
    t,
  }
}
