"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { api, getApiErrorMessage } from "@/lib/api"
import { AgentResponse, ListResponse } from "@/types/api"
import { useAppLocale } from "@/hooks/use-app-locale"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import { withLocalePrefix } from "@/components/app-locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Loader2,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react"
import { toast } from "sonner"

type TranslateFn = (path: string, values?: Record<string, string | number>) => string

function formatLastSeen(lastSeen: string | null, t: TranslateFn) {
  if (!lastSeen) {
    return t("agents.lastSeenNever")
  }

  const seenAt = new Date(lastSeen)

  if (Number.isNaN(seenAt.getTime())) {
    return "-"
  }

  const diff = Date.now() - seenAt.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return t("agents.lastSeenJustNow")
  }

  if (diff < hour) {
    return t("agents.lastSeenMinutesAgo", { count: Math.floor(diff / minute) })
  }

  if (diff < day) {
    return t("agents.lastSeenHoursAgo", { count: Math.floor(diff / hour) })
  }

  return t("agents.lastSeenDaysAgo", { count: Math.floor(diff / day) })
}

function getStatusMeta(status: string, t: TranslateFn) {
  const normalized = status.toLowerCase()

  if (normalized === "active") {
    return {
      label: t("agents.statusActive"),
      icon: Wifi,
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    }
  }

  if (normalized === "inactive") {
    return {
      label: t("agents.statusInactive"),
      icon: WifiOff,
      className: "border-muted bg-muted text-muted-foreground",
    }
  }

  return {
    label: t("agents.statusUnknown"),
    icon: Server,
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  }
}

export default function AgentsPage() {
  const locale = useAppLocale()
  const { t } = useAppTranslations("pages")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const searchParamValue = searchParams.get("search") || ""
  const rawOffset = Number(searchParams.get("offset") || "0")

  const initialOffset = Number.isFinite(rawOffset) && rawOffset > 0
    ? Math.floor(rawOffset)
    : 0

  const [search, setSearch] = useState(searchParamValue)
  const [offset, setOffset] = useState(initialOffset)
  const limit = 20

  const {
    data: agentsPage,
    loading,
    refreshing,
    execute,
  } = useRequestState<ListResponse<AgentResponse>>({
    items: [],
    total: 0,
    limit,
    offset: 0,
  })
  const agents = agentsPage.items

  const whitelistPath = useMemo(() => withLocalePrefix("/whitelist", locale), [locale])

  const fetchAgents = useCallback(
    async (silent = false) => {
      await execute(
        () => api.getAgents({ limit, offset }),
        {
          silent,
          onError: (error) => {
            toast.error(getApiErrorMessage(error, t("agents.toastFetchError")))
          },
        }
      )
    },
    [execute, limit, offset, t]
  )

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  useEffect(() => {
    const nextSearch = searchParams.get("search") || ""
    const nextRawOffset = Number(searchParams.get("offset") || "0")
    const nextOffset = Number.isFinite(nextRawOffset) && nextRawOffset > 0
      ? Math.floor(nextRawOffset)
      : 0

    setSearch((prev) => (prev === nextSearch ? prev : nextSearch))
    setOffset((prev) => (prev === nextOffset ? prev : nextOffset))
  }, [searchParams])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (search.trim()) {
      nextParams.set("search", search)
    } else {
      nextParams.delete("search")
    }

    if (offset > 0) {
      nextParams.set("offset", String(offset))
    } else {
      nextParams.delete("offset")
    }

    const nextQuery = nextParams.toString()
    const currentQuery = searchParams.toString()

    if (nextQuery === currentQuery) {
      return
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    })
  }, [offset, pathname, router, search, searchParams])

  const filteredAgents = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) {
      return agents
    }

    return agents.filter((agent) => agent.agent_id.toLowerCase().includes(keyword))
  }, [agents, search])

  const statusStats = useMemo(() => {
    return agents.reduce(
      (stats, agent) => {
        const status = agent.status.toLowerCase()

        if (status === "active") {
          stats.active += 1
        } else if (status === "inactive") {
          stats.inactive += 1
        } else {
          stats.unknown += 1
        }

        return stats
      },
      {
        active: 0,
        inactive: 0,
        unknown: 0,
      }
    )
  }, [agents])

  const pageNumber = Math.floor(offset / limit) + 1
  const canGoPrev = offset > 0
  const canGoNext = offset + agents.length < agentsPage.total

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("agents.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("agents.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={whitelistPath}>
              <ListChecks className="mr-2 h-4 w-4" />
              {t("agents.whitelistButton")}
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchAgents(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("agents.refreshButton")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("agents.statActive")}</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{statusStats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("agents.statInactive")}</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">{statusStats.inactive}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("agents.statUnknown")}</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{statusStats.unknown}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t("agents.currentPageTitle")}</CardTitle>
              <CardDescription>{t("agents.currentPageDescription", { limit })}</CardDescription>
            </div>
            <div className="w-full md:w-72">
              <FilterToolbar
                className="md:grid-cols-1 xl:grid-cols-1"
                search={{
                  value: search,
                  onValueChange: setSearch,
                  placeholder: t("agents.searchPlaceholder"),
                  inputClassName: "h-10",
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("agents.tableColAgentId")}</TableHead>
                  <TableHead>{t("agents.tableColStatus")}</TableHead>
                  <TableHead>{t("agents.tableColLastSeen")}</TableHead>
                  <TableHead className="text-right">{t("agents.tableColActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      {t("agents.tableLoading")}
                    </TableCell>
                  </TableRow>
                ) : filteredAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      {t("agents.tableEmpty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgents.map((agent) => {
                    const statusMeta = getStatusMeta(agent.status, t)
                    const AgentStatusIcon = statusMeta.icon
                    const detailId = (typeof agent.id === "string" && agent.id.trim()) || agent.agent_id
                    const detailPath = withLocalePrefix(
                      `/agents/${encodeURIComponent(detailId)}`,
                      locale
                    )

                    return (
                      <TableRow key={agent.agent_id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-sm">
                          <Link href={detailPath} className="text-primary hover:underline">
                            {agent.agent_id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className={`gap-1 ${statusMeta.className}`}>
                            <AgentStatusIcon className="h-3 w-3" />
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatLastSeen(agent.last_seen, t)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={detailPath}>{t("agents.detailAction")}</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <span className="mr-2 text-xs text-muted-foreground">{t("agents.paginationPage", { page: pageNumber })}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoPrev || loading}
              onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("agents.paginationPrev")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoNext || loading}
              onClick={() => setOffset((prev) => prev + limit)}
            >
              {t("agents.paginationNext")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
