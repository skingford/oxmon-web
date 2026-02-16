"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ApiRequestError, api, getApiErrorMessage } from "@/lib/api"
import { AgentDetail, LatestMetric } from "@/types/api"
import { useAppLocale } from "@/hooks/use-app-locale"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import { withLocalePrefix } from "@/components/app-locale"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, ArrowLeft, Gauge, Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"

function toFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.replace("%", "").trim()
    const parsed = Number(normalized)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

function normalizeMetricName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function getMetricValueByPriority(metrics: LatestMetric[], priorityNames: string[]) {
  if (metrics.length === 0) {
    return undefined
  }

  const normalized = metrics.map((metric) => ({
    metric,
    normalizedName: normalizeMetricName(metric.metric_name),
  }))

  for (const name of priorityNames) {
    const normalizedName = normalizeMetricName(name)
    const exactMatched = normalized.find((item) => item.normalizedName === normalizedName)

    if (exactMatched) {
      return toFiniteNumber(exactMatched.metric.value)
    }
  }

  for (const name of priorityNames) {
    const normalizedName = normalizeMetricName(name)
    const partialMatched = normalized.find((item) => item.normalizedName.includes(normalizedName))

    if (partialMatched) {
      return toFiniteNumber(partialMatched.metric.value)
    }
  }

  return undefined
}

function getMetricValueByNamePattern(metrics: LatestMetric[], patterns: RegExp[]) {
  for (const metric of metrics) {
    const normalizedName = normalizeMetricName(metric.metric_name)
    if (patterns.some((pattern) => pattern.test(normalizedName))) {
      const value = toFiniteNumber(metric.value)
      if (value !== undefined) {
        return value
      }
    }
  }

  return undefined
}

function findUsagePercentValue(metrics: LatestMetric[], type: "cpu" | "memory" | "disk") {
  const exactPriorityMap: Record<"cpu" | "memory" | "disk", string[]> = {
    cpu: [
      "cpu_usage_percent",
      "cpu_usage",
      "cpu_used_percent",
      "cpu.percent",
      "cpu_utilization",
      "cpu_util_percent",
      "system_cpu_usage",
      "node_cpu_usage",
    ],
    memory: [
      "memory_usage_percent",
      "memory_usage",
      "memory_used_percent",
      "memory.percent",
      "mem_usage_percent",
      "mem_usage",
      "system_memory_usage",
      "node_memory_usage",
    ],
    disk: [
      "disk_usage_percent",
      "disk_usage",
      "disk_used_percent",
      "disk.percent",
      "disk_util_percent",
      "filesystem_usage_percent",
      "fs_usage_percent",
      "node_filesystem_usage",
    ],
  }

  const exact = getMetricValueByPriority(metrics, exactPriorityMap[type])

  if (exact !== undefined) {
    return exact
  }

  const patternMap: Record<"cpu" | "memory" | "disk", RegExp[]> = {
    cpu: [
      /cpu.*(usage|util|percent|pct)/,
      /(usage|util|percent|pct).*cpu/,
    ],
    memory: [
      /(mem|memory).*(usage|util|percent|pct)/,
      /(usage|util|percent|pct).*(mem|memory)/,
    ],
    disk: [
      /(disk|filesystem|fs).*(usage|util|percent|pct)/,
      /(usage|util|percent|pct).*(disk|filesystem|fs)/,
    ],
  }

  const byPattern = getMetricValueByNamePattern(metrics, patternMap[type])
  if (byPattern !== undefined) {
    return byPattern
  }

  // 宽松兜底：兼容仅上报 `cpu` / `mem` / `memory` / `disk` 等简写指标名
  const loosePriorityMap: Record<"cpu" | "memory" | "disk", string[]> = {
    cpu: ["cpu", "system_cpu", "node_cpu"],
    memory: ["memory", "mem", "system_memory", "node_memory"],
    disk: ["disk", "filesystem", "fs", "system_disk", "node_disk"],
  }

  const loose = getMetricValueByPriority(metrics, loosePriorityMap[type])

  if (loose !== undefined) {
    return loose
  }

  const loosePatternMap: Record<"cpu" | "memory" | "disk", RegExp[]> = {
    cpu: [/cpu/],
    memory: [/(mem|memory)/],
    disk: [/(disk|filesystem|fs)/],
  }

  return getMetricValueByNamePattern(metrics, loosePatternMap[type])
}

function findLoadValue(metrics: LatestMetric[]) {
  const exact = getMetricValueByPriority(metrics, [
    "load1",
    "load_1m",
    "system_load1",
    "node_load1",
    "load_avg_1",
    "load.avg.1m",
  ])

  if (exact !== undefined) {
    return exact
  }

  const partialMatched = metrics.find((metric) => {
    const name = normalizeMetricName(metric.metric_name)
    return (name.includes("load") && name.includes("1")) || name === "load"
  })

  return toFiniteNumber(partialMatched?.value)
}

function toPercent(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return undefined
  }

  if (value >= 0 && value <= 1) {
    return value * 100
  }

  return value
}

function resolveValueColor(value?: number, withThreshold = false) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "text-muted-foreground"
  }

  if (!withThreshold) {
    return "text-foreground"
  }

  if (value > 90) {
    return "text-red-600"
  }

  if (value > 80) {
    return "text-amber-600"
  }

  return "text-foreground"
}

function formatPercent(value?: number) {
  const parsed = toFiniteNumber(value)

  if (parsed === undefined) {
    return "-"
  }

  return `${parsed.toFixed(1)}%`
}

function formatLoad(value?: number) {
  const parsed = toFiniteNumber(value)

  if (parsed === undefined) {
    return "-"
  }

  return parsed.toFixed(2)
}

function formatUpdatedAt(metrics: LatestMetric[]) {
  if (metrics.length === 0) {
    return "-"
  }

  const latest = metrics.reduce((max, current) =>
    new Date(current.timestamp).getTime() > new Date(max.timestamp).getTime() ? current : max
  )

  const time = new Date(latest.timestamp)

  if (Number.isNaN(time.getTime())) {
    return "-"
  }

  return time.toLocaleString()
}

function buildLatestMetricsFromPoints(points: LatestMetric[]) {
  if (points.length === 0) {
    return []
  }

  const latestByMetric = new Map<string, LatestMetric>()

  for (const point of points) {
    const key = point.metric_name
    const existing = latestByMetric.get(key)

    if (!existing) {
      latestByMetric.set(key, point)
      continue
    }

    const currentTime = new Date(point.timestamp).getTime()
    const existingTime = new Date(existing.timestamp).getTime()

    if (!Number.isNaN(currentTime) && (Number.isNaN(existingTime) || currentTime > existingTime)) {
      latestByMetric.set(key, point)
    }
  }

  return Array.from(latestByMetric.values()).sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime()
    const timeB = new Date(b.timestamp).getTime()
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
      return 0
    }
    return timeB - timeA
  })
}

function buildMetricItemKey(metric: LatestMetric, index: number) {
  const labelSignature = Object.entries(metric.labels || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join("|")

  return `${metric.metric_name}-${metric.timestamp}-${labelSignature || "no-label"}-${index}`
}

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useAppLocale()
  const { t } = useAppTranslations("pages")

  const agentRef = useMemo(() => {
    const raw = params?.id

    if (!raw) {
      return ""
    }

    return decodeURIComponent(Array.isArray(raw) ? raw[0] : raw)
  }, [params])

  const {
    data: metrics,
    setData: setMetrics,
    loading,
    refreshing,
    execute,
  } = useRequestState<LatestMetric[]>([])
  const [notFound, setNotFound] = useState(false)
  const [resolvedAgentId, setResolvedAgentId] = useState("")
  const [agentDetail, setAgentDetail] = useState<AgentDetail | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editDescription, setEditDescription] = useState("")
  const [editIntervalSecs, setEditIntervalSecs] = useState("")
  const [preparingEdit, setPreparingEdit] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const agentsPath = useMemo(() => withLocalePrefix("/agents", locale), [locale])

  const fetchAgentDetail = useCallback(async () => {
    if (!agentRef) {
      return
    }

    try {
      const detail = await api.getAgentById(agentRef)
      setAgentDetail(detail)
      setResolvedAgentId((prev) => (prev === detail.agent_id ? prev : detail.agent_id))
      setNotFound(false)
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        setAgentDetail(null)
        setNotFound(true)
        return
      }

      toast.error(getApiErrorMessage(error, t("agentDetail.toastFetchError")))
    }
  }, [agentRef, t])

  const fetchLatestMetrics = useCallback(
    async (silent = false) => {
      if (!agentRef) {
        return
      }

      await execute(
        async () => {
          let hasAnyNotFound = false

          const tryFetchLatest = async (target: string) => {
            try {
              return await api.getAgentLatestMetrics(target)
            } catch (error) {
              if (error instanceof ApiRequestError && error.status === 404) {
                hasAnyNotFound = true
                return []
              }

              throw error
            }
          }

          let latest = await tryFetchLatest(agentRef)

          if (latest.length > 0) {
            setResolvedAgentId((prev) => (prev === agentRef ? prev : agentRef))
            return latest
          }

          let fallbackAgentId = agentDetail?.agent_id || agentRef

          if (!agentDetail) {
            try {
              const detail = await api.getAgentById(agentRef)
              setAgentDetail(detail)
              fallbackAgentId = detail.agent_id || fallbackAgentId
              setResolvedAgentId((prev) => (prev === detail.agent_id ? prev : detail.agent_id))
            } catch (error) {
              if (!(error instanceof ApiRequestError && error.status === 404)) {
                throw error
              }
            }
          }

          if (fallbackAgentId !== agentRef) {
            setResolvedAgentId((prev) => (prev === fallbackAgentId ? prev : fallbackAgentId))
            latest = await tryFetchLatest(fallbackAgentId)
          } else {
            setResolvedAgentId((prev) => (prev === agentRef ? prev : agentRef))
          }

          if (latest.length > 0) {
            return latest
          }

          const metricPoints = await api.queryAllMetrics({
            agent_id__eq: fallbackAgentId,
            limit: 200,
            offset: 0,
          })

          const fallbackMetrics = buildLatestMetricsFromPoints(metricPoints)

          if (fallbackMetrics.length === 0 && hasAnyNotFound) {
            throw new ApiRequestError("Agent not found", { status: 404 })
          }

          return fallbackMetrics
        },
        {
          silent,
          onSuccess: () => {
            setNotFound(false)
          },
          onError: (error: unknown) => {
            if (error instanceof ApiRequestError && error.status === 404) {
              setNotFound(true)
              setMetrics([])
              return
            }

            toast.error(getApiErrorMessage(error, t("agentDetail.toastFetchError")))
          },
        }
      )
    },
    [agentDetail, agentRef, execute, setMetrics, t]
  )

  useEffect(() => {
    fetchAgentDetail()
  }, [fetchAgentDetail])

  useEffect(() => {
    fetchLatestMetrics()
  }, [fetchLatestMetrics])

  const openEditDialog = async () => {
    if (!agentRef) {
      return
    }

    setPreparingEdit(true)
    try {
      let detail = agentDetail

      if (!detail) {
        detail = await api.getAgentById(agentRef)
        setAgentDetail(detail)
        setResolvedAgentId((prev) => (prev === detail.agent_id ? prev : detail.agent_id))
      }

      setEditDescription(detail.description || "")
      setEditIntervalSecs(
        typeof detail.collection_interval_secs === "number"
          ? String(detail.collection_interval_secs)
          : ""
      )
      setIsEditDialogOpen(true)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentDetail.toastFetchError")))
    } finally {
      setPreparingEdit(false)
    }
  }

  const handleUpdateAgent = async () => {
    if (!agentRef) {
      return
    }

    let normalizedInterval: number | null = null

    if (editIntervalSecs.trim()) {
      const parsed = Number(editIntervalSecs)
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast.error(t("agentDetail.toastInvalidInterval"))
        return
      }
      normalizedInterval = Math.trunc(parsed)
    }

    setUpdating(true)
    try {
      await api.updateAgent(agentRef, {
        description: editDescription.trim() ? editDescription.trim() : null,
        collection_interval_secs: normalizedInterval,
      })
      toast.success(t("agentDetail.toastUpdateSuccess"))
      setIsEditDialogOpen(false)
      await fetchAgentDetail()
      await fetchLatestMetrics(true)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentDetail.toastUpdateError")))
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteAgent = async () => {
    if (!agentRef) {
      return
    }

    setDeleting(true)
    try {
      await api.deleteAgent(agentRef)
      toast.success(t("agentDetail.toastDeleteSuccess"))
      router.replace(agentsPath)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentDetail.toastDeleteError")))
    } finally {
      setDeleting(false)
    }
  }

  const cpu = toPercent(findUsagePercentValue(metrics, "cpu"))
  const memory = toPercent(findUsagePercentValue(metrics, "memory"))
  const disk = toPercent(findUsagePercentValue(metrics, "disk"))
  const load = findLoadValue(metrics)

  const cards = [
    {
      key: "cpu",
      title: t("agentDetail.cardCpu"),
      value: formatPercent(cpu),
      valueClass: resolveValueColor(cpu, true),
    },
    {
      key: "memory",
      title: t("agentDetail.cardMemory"),
      value: formatPercent(memory),
      valueClass: resolveValueColor(memory, true),
    },
    {
      key: "disk",
      title: t("agentDetail.cardDisk"),
      value: formatPercent(disk),
      valueClass: resolveValueColor(disk, true),
    },
    {
      key: "load",
      title: t("agentDetail.cardLoad"),
      value: formatLoad(load),
      valueClass: resolveValueColor(load),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" className="mb-2 -ml-3" asChild>
            <Link href={agentsPath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("agentDetail.backToList")}
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{t("agentDetail.title", { agentId: resolvedAgentId || agentRef || "-" })}</h1>
          <p className="text-sm text-muted-foreground">{t("agentDetail.description")}</p>
        </div>
        <div className="flex w-full flex-wrap justify-start gap-2 sm:w-auto sm:justify-end">
          <Button
            variant="outline"
            onClick={() => fetchLatestMetrics(true)}
            disabled={loading || refreshing || !agentRef}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("agentDetail.refreshButton")}
          </Button>
          <Button
            variant="outline"
            onClick={openEditDialog}
            disabled={notFound || preparingEdit || updating || deleting}
          >
            {preparingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
            {t("agentDetail.editButton")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={notFound || deleting || updating}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("agentDetail.deleteButton")}
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex h-56 flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="mb-3 h-6 w-6 animate-spin" />
            {t("agentDetail.loading")}
          </CardContent>
        </Card>
      ) : notFound ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-destructive/70" />
            <div>
              <p className="text-base font-medium">{t("agentDetail.notFoundTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("agentDetail.notFoundDescription")}</p>
            </div>
            <Button variant="outline" asChild>
              <Link href={agentsPath}>{t("agentDetail.backToList")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">{t("agentDetail.updatedBadge")}</Badge>
            <span className="text-sm text-muted-foreground">{t("agentDetail.updatedAt", { time: formatUpdatedAt(metrics) })}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:gap-6">
            {cards.map((card) => (
              <Card key={card.key}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Gauge className="h-4 w-4" />
                    {card.title}
                  </CardDescription>
                  <CardTitle className={`text-4xl font-bold tracking-tight ${card.valueClass}`}>
                    {card.value}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("agentDetail.rawTitle")}</CardTitle>
              <CardDescription>{t("agentDetail.rawDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("agentDetail.rawEmpty")}</p>
              ) : (
                <div className="space-y-2">
                  {metrics.map((metric, index) => (
                    <div
                      key={buildMetricItemKey(metric, index)}
                      className="rounded-md border bg-muted/20 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-mono text-sm font-medium">{metric.metric_name}</p>
                        <span className="text-sm">{metric.value}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("agentDetail.rawTime", { time: new Date(metric.timestamp).toLocaleString() })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("agentDetail.editDialogTitle")}</DialogTitle>
            <DialogDescription>{t("agentDetail.editDialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="agent-description">{t("agentDetail.fieldDescription")}</Label>
              <Input
                id="agent-description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                placeholder={t("agentDetail.placeholderDescription")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-interval">{t("agentDetail.fieldIntervalSecs")}</Label>
              <Input
                id="agent-interval"
                type="number"
                min={0}
                value={editIntervalSecs}
                onChange={(event) => setEditIntervalSecs(event.target.value)}
                placeholder={t("agentDetail.placeholderIntervalSecs")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={updating}>
              {t("agentDetail.btnCancel")}
            </Button>
            <Button onClick={handleUpdateAgent} disabled={updating}>
              {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("agentDetail.btnSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("agentDetail.deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("agentDetail.deleteDialogDescription", {
                agentId: resolvedAgentId || agentRef || "-",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("agentDetail.btnCancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("agentDetail.deleteDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
