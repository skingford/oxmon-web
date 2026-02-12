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

type SidebarPath = string

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

type SidebarChildItemConfig = Omit<SidebarChildItem, "apiPaths">

type SidebarItemConfig = Omit<SidebarItem, "apiPaths" | "children"> & {
  children?: SidebarChildItemConfig[]
}

type SidebarGroupConfigBase = {
  label: string
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

export function filterSidebarGroupsByApiPaths(
  groups: SidebarGroupConfig[],
  supportedPaths?: Set<string>
) {
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
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        title: "Metrics",
        url: "/metrics",
        icon: Activity,
      },
    ],
  },
  {
    label: "Monitoring",
    items: [
      {
        title: "Agents",
        url: "/agents",
        icon: Server,
        children: [
          {
            title: "All Agents",
            url: "/agents",
            exact: true,
          },
          {
            title: "Whitelist",
            url: "/whitelist",
            exact: true,
          },
        ],
      },
      {
        title: "Alerts",
        url: "/alerts",
        icon: Bell,
        children: [
          {
            title: "Active",
            url: "/alerts",
            exact: true,
          },
          {
            title: "History",
            url: "/alerts/history",
            exact: true,
          },
          {
            title: "Rules",
            url: "/alerts/rules",
            exact: true,
          },
        ],
      },
      {
        title: "Certificates",
        url: "/certificates",
        icon: List,
        children: [
          {
            title: "Overview",
            url: "/certificates",
            exact: true,
          },
          {
            title: "Domains",
            url: "/certificates/domains",
            exact: true,
          },
          {
            title: "Status",
            url: "/certificates/status",
            exact: true,
          },
        ],
      },
      {
        title: "Notifications",
        url: "/notifications",
        icon: Inbox,
        children: [
          {
            title: "Channels",
            url: "/notifications",
            exact: true,
          },
          {
            title: "Silence Windows",
            url: "/notifications/silence",
            exact: true,
          },
        ],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "System",
        url: "/system",
        icon: Settings,
        exact: true,
      },
    ],
  },
]

function withApiPathsForChild(item: SidebarChildItemConfig): SidebarChildItem {
  return {
    ...item,
    apiPaths: sidebarApiPathMap[item.url],
  }
}

function withApiPathsForItem(item: SidebarItemConfig): SidebarItem {
  return {
    ...item,
    apiPaths: sidebarApiPathMap[item.url],
    children: item.children?.map(withApiPathsForChild),
  }
}

export const sidebarMenuGroups: SidebarGroupConfig[] = sidebarMenuGroupsBase.map((group) => ({
  ...group,
  items: group.items.map(withApiPathsForItem),
}))

export const sidebarFooterItems: SidebarItem[] = [
  {
    title: "Profile",
    url: "/profile",
    icon: User,
    exact: true,
  },
]
