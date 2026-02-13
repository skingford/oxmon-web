import {
  DEFAULT_APP_LOCALE,
  stripLocalePrefix,
  type AppLocale,
} from "@/components/app-locale"
import {
  createScopedTranslator,
  type HeaderDescriptionKey,
  type NavigationLabelKey,
} from "@/components/app-messages"

export type AppHeaderMeta = {
  title?: string
  description?: string
}

type AppHeaderMetaKeyConfig = {
  titleKey?: NavigationLabelKey
  descriptionKey?: HeaderDescriptionKey
}

const headerMetaByExactPath: Record<string, AppHeaderMetaKeyConfig> = {
  "/": {
    titleKey: "groupOverview",
    descriptionKey: "overviewDescription",
  },
  "/dashboard": {
    titleKey: "groupOverview",
    descriptionKey: "overviewDescription",
  },
  "/metrics": {
    titleKey: "itemMetrics",
    descriptionKey: "metricsDescription",
  },
  "/agents": {
    titleKey: "itemAgents",
    descriptionKey: "agentsDescription",
  },
  "/whitelist": {
    titleKey: "itemWhitelist",
    descriptionKey: "whitelistDescription",
  },
  "/alerts": {
    titleKey: "itemAlerts",
    descriptionKey: "alertsDescription",
  },
  "/alerts/history": {
    titleKey: "itemAlertHistory",
    descriptionKey: "alertsHistoryDescription",
  },
  "/alerts/rules": {
    titleKey: "itemAlertRules",
    descriptionKey: "alertsRulesDescription",
  },
  "/certificates": {
    titleKey: "itemCertificates",
    descriptionKey: "certificatesDescription",
  },
  "/certificates/domains": {
    titleKey: "itemCertificateDomains",
    descriptionKey: "certificateDomainsDescription",
  },
  "/certificates/status": {
    titleKey: "itemCertificateStatus",
    descriptionKey: "certificateStatusDescription",
  },
  "/notifications": {
    titleKey: "itemNotifications",
    descriptionKey: "notificationsDescription",
  },
  "/notifications/silence": {
    titleKey: "itemSilenceWindows",
    descriptionKey: "silenceWindowsDescription",
  },
  "/system": {
    titleKey: "itemSystem",
    descriptionKey: "systemDescription",
  },
  "/system/dictionaries": {
    titleKey: "itemSystemDictionaries",
    descriptionKey: "systemDictionariesDescription",
  },
  "/profile": {
    titleKey: "itemProfile",
    descriptionKey: "profileDescription",
  },
}

const headerMetaByPrefix: Array<{
  prefix: string
  meta: AppHeaderMetaKeyConfig
}> = [
  {
    prefix: "/agents/",
    meta: {
      titleKey: "itemAgentDetail",
      descriptionKey: "agentDetailDescription",
    },
  },
]

function resolveAppHeaderMeta(
  meta: AppHeaderMetaKeyConfig,
  locale: AppLocale
): AppHeaderMeta | undefined {
  const translateNavigation = createScopedTranslator(locale, "navigation")
  const translateHeader = createScopedTranslator(locale, "header")

  const title = meta.titleKey ? translateNavigation(`labels.${meta.titleKey}`) : undefined
  const description = meta.descriptionKey
    ? translateHeader(`descriptions.${meta.descriptionKey}`)
    : undefined

  if (!title && !description) {
    return undefined
  }

  return {
    title,
    description,
  }
}

export function getAppHeaderMeta(
  pathname: string,
  locale: AppLocale = DEFAULT_APP_LOCALE
): AppHeaderMeta | undefined {
  const normalizedPathname = stripLocalePrefix(pathname)
  const exactMeta = headerMetaByExactPath[normalizedPathname]

  if (exactMeta) {
    return resolveAppHeaderMeta(exactMeta, locale)
  }

  const prefixMeta = headerMetaByPrefix.find((entry) =>
    normalizedPathname.startsWith(entry.prefix)
  )

  return prefixMeta ? resolveAppHeaderMeta(prefixMeta.meta, locale) : undefined
}

export function getDefaultAppHeaderTitle(locale: AppLocale = DEFAULT_APP_LOCALE) {
  const translateNavigation = createScopedTranslator(locale, "navigation")
  return translateNavigation("labels.itemDashboard")
}
