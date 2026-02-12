import {
  Activity,
  Bell,
  Inbox,
  LayoutDashboard,
  List,
  Server,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react"
import { DEFAULT_APP_LOCALE, type AppLocale } from "@/components/app-locale"
import {
  createScopedTranslator,
  type NavigationLabelKey,
} from "@/components/app-messages"

type SidebarPath = string

type NavigationTranslate = (path: `labels.${NavigationLabelKey}`) => string

export type SidebarChildItem = {
  title: string
  url: SidebarPath
  exact?: boolean
  apiPaths?: string[]
}

export type SidebarItem = {
  title: string
  url: SidebarPath
  icon: LucideIcon
  exact?: boolean
  apiPaths?: string[]
  children?: SidebarChildItem[]
}

export type SidebarGroupConfig = {
  label: string
  items: SidebarItem[]
}

type SidebarChildItemConfig = Omit<SidebarChildItem, "title" | "apiPaths"> & {
  titleKey: NavigationLabelKey
}

type SidebarItemConfig = Omit<SidebarItem, "title" | "apiPaths" | "children"> & {
  titleKey: NavigationLabelKey
  children?: SidebarChildItemConfig[]
}

type SidebarGroupConfigBase = {
  labelKey: NavigationLabelKey
  items: SidebarItemConfig[]
}

function isApiPathSupported(requiredPath: string, supportedPaths: Set<string>) {
  if (supportedPaths.has(requiredPath)) {
    return true
  }

  const pathPrefix = `${requiredPath}/`

  for (const path of supportedPaths) {
    if (path.startsWith(pathPrefix)) {
      return true
    }
  }

  return false
}

function hasSupportedApiPaths(apiPaths: string[] | undefined, supportedPaths?: Set<string>) {
  if (!supportedPaths || supportedPaths.size === 0 || !apiPaths || apiPaths.length === 0) {
    return true
  }

  return apiPaths.some((path) => isApiPathSupported(path, supportedPaths))
}

function resolveSidebarLabel(labelKey: NavigationLabelKey, translate: NavigationTranslate) {
  return translate(`labels.${labelKey}`)
}

export function filterSidebarItemsByApiPaths(
  items: SidebarItem[],
  supportedPaths?: Set<string>
): SidebarItem[] {
  return items.filter((item) => hasSupportedApiPaths(item.apiPaths, supportedPaths))
}

export function filterSidebarGroupsByApiPaths(
  groups: SidebarGroupConfig[],
  supportedPaths?: Set<string>
): SidebarGroupConfig[] {
  return groups
    .map((group) => {
      const items = group.items
        .map((item) => {
          if (!item.children || item.children.length === 0) {
            return hasSupportedApiPaths(item.apiPaths, supportedPaths) ? item : null
          }

          const children = item.children.filter((child) =>
            hasSupportedApiPaths(child.apiPaths, supportedPaths)
          )

          if (!hasSupportedApiPaths(item.apiPaths, supportedPaths) && children.length === 0) {
            return null
          }

          return {
            ...item,
            children,
          }
        })
        .filter((item): item is SidebarItem => item !== null)

      return {
        ...group,
        items,
      }
    })
    .filter((group) => group.items.length > 0)
}

export const sidebarApiPathMap: Record<SidebarPath, string[]> = {
  "/": ["/v1/dashboard/overview"],
  "/metrics": ["/v1/metrics"],
  "/agents": ["/v1/agents"],
  "/whitelist": ["/v1/agents/whitelist"],
  "/alerts": ["/v1/alerts/active"],
  "/alerts/history": ["/v1/alerts/history"],
  "/alerts/rules": ["/v1/alerts/rules"],
  "/certificates": ["/v1/certificates"],
  "/certificates/domains": ["/v1/certs/domains"],
  "/certificates/status": ["/v1/certs/status"],
  "/notifications": ["/v1/notifications/channels"],
  "/notifications/silence": ["/v1/notifications/silence-windows"],
  "/system": ["/v1/system/config"],
}

const sidebarMenuGroupsBase: SidebarGroupConfigBase[] = [
  {
    labelKey: "groupOverview",
    items: [
      {
        titleKey: "itemDashboard",
        url: "/",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        titleKey: "itemMetrics",
        url: "/metrics",
        icon: Activity,
      },
    ],
  },
  {
    labelKey: "groupMonitoring",
    items: [
      {
        titleKey: "itemAgents",
        url: "/agents",
        icon: Server,
        children: [
          {
            titleKey: "itemAllAgents",
            url: "/agents",
            exact: true,
          },
          {
            titleKey: "itemWhitelist",
            url: "/whitelist",
            exact: true,
          },
        ],
      },
      {
        titleKey: "itemAlerts",
        url: "/alerts",
        icon: Bell,
        children: [
          {
            titleKey: "itemActiveAlerts",
            url: "/alerts",
            exact: true,
          },
          {
            titleKey: "itemAlertHistory",
            url: "/alerts/history",
            exact: true,
          },
          {
            titleKey: "itemAlertRules",
            url: "/alerts/rules",
            exact: true,
          },
        ],
      },
      {
        titleKey: "itemCertificates",
        url: "/certificates",
        icon: List,
        children: [
          {
            titleKey: "itemCertificateOverview",
            url: "/certificates",
            exact: true,
          },
          {
            titleKey: "itemCertificateDomains",
            url: "/certificates/domains",
            exact: true,
          },
          {
            titleKey: "itemCertificateStatus",
            url: "/certificates/status",
            exact: true,
          },
        ],
      },
      {
        titleKey: "itemNotifications",
        url: "/notifications",
        icon: Inbox,
        children: [
          {
            titleKey: "itemNotificationChannels",
            url: "/notifications",
            exact: true,
          },
          {
            titleKey: "itemSilenceWindows",
            url: "/notifications/silence",
            exact: true,
          },
        ],
      },
    ],
  },
  {
    labelKey: "groupAdministration",
    items: [
      {
        titleKey: "itemSystem",
        url: "/system",
        icon: Settings,
        exact: true,
      },
    ],
  },
]

const sidebarFooterItemsBase: SidebarItemConfig[] = [
  {
    titleKey: "itemProfile",
    url: "/profile",
    icon: User,
    exact: true,
  },
]

function withApiPathsForChild(
  item: SidebarChildItemConfig,
  translate: NavigationTranslate
): SidebarChildItem {
  return {
    ...item,
    title: resolveSidebarLabel(item.titleKey, translate),
    apiPaths: sidebarApiPathMap[item.url],
  }
}

function withApiPathsForItem(item: SidebarItemConfig, translate: NavigationTranslate): SidebarItem {
  return {
    ...item,
    title: resolveSidebarLabel(item.titleKey, translate),
    apiPaths: sidebarApiPathMap[item.url],
    children: item.children?.map((child) => withApiPathsForChild(child, translate)),
  }
}

export function getSidebarMenuGroups(locale: AppLocale = DEFAULT_APP_LOCALE): SidebarGroupConfig[] {
  const translate = createScopedTranslator(locale, "navigation")

  return sidebarMenuGroupsBase.map((group) => ({
    label: resolveSidebarLabel(group.labelKey, translate),
    items: group.items.map((item) => withApiPathsForItem(item, translate)),
  }))
}

export function getSidebarFooterItems(locale: AppLocale = DEFAULT_APP_LOCALE): SidebarItem[] {
  const translate = createScopedTranslator(locale, "navigation")
  return sidebarFooterItemsBase.map((item) => withApiPathsForItem(item, translate))
}

export const sidebarMenuGroups: SidebarGroupConfig[] = getSidebarMenuGroups()
export const sidebarFooterItems: SidebarItem[] = getSidebarFooterItems()
