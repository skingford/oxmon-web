"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, RefreshCw, Search } from "lucide-react"
import { toast } from "sonner"
import { api, getApiErrorMessage } from "@/lib/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import { withLocalePrefix } from "@/components/app-locale"
import type { CloudInstanceResponse } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type CloudInstancesState = {
  instances: CloudInstanceResponse[]
}

function formatDateTime(value: string | null | undefined, locale: "zh" | "en") {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    hour12: false,
  })
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((item) => item?.trim()).filter((item): item is string => Boolean(item))))
    .sort((a, b) => a.localeCompare(b))
}

function resolveInstanceName(instance: CloudInstanceResponse) {
  return instance.instance_name?.trim() || instance.instance_id
}

function resolveStatusVariant(status: string | null | undefined): "default" | "secondary" | "outline" | "destructive" {
  const normalized = (status || "").toLowerCase()

  if (["running", "active", "online"].includes(normalized)) {
    return "default"
  }

  if (["stopped", "terminated", "failed", "error"].includes(normalized)) {
    return "destructive"
  }

  if (!normalized) {
    return "outline"
  }

  return "secondary"
}

export default function CloudInstancesPage() {
  const { t, locale } = useAppTranslations("pages")
  const { data, loading, refreshing, execute } = useRequestState<CloudInstancesState>({
    instances: [],
  })

  const [searchKeyword, setSearchKeyword] = useState("")
  const [providerFilter, setProviderFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const instances = data.instances

  const fetchInstances = useCallback(async (silent = false) => {
    await execute(
      async () => ({
        instances: await api.listCloudInstances(),
      }),
      {
        silent,
        onError: (error) => {
          toast.error(getApiErrorMessage(error, t("cloud.instances.toastFetchError")))
        },
      }
    )
  }, [execute, t])

  useEffect(() => {
    fetchInstances()
  }, [fetchInstances])

  const providerOptions = useMemo(() => uniqueSorted(instances.map((item) => item.provider)), [instances])
  const regionOptions = useMemo(() => uniqueSorted(instances.map((item) => item.region)), [instances])
  const statusOptions = useMemo(() => uniqueSorted(instances.map((item) => item.status)), [instances])

  const filteredInstances = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    return instances.filter((item) => {
      if (providerFilter !== "all" && item.provider !== providerFilter) {
        return false
      }

      if (regionFilter !== "all" && item.region !== regionFilter) {
        return false
      }

      if (statusFilter !== "all" && (item.status || "") !== statusFilter) {
        return false
      }

      if (!keyword) {
        return true
      }

      const haystack = [
        item.instance_id,
        item.instance_name ?? "",
        item.account_config_key,
        item.provider,
        item.region,
        item.public_ip ?? "",
        item.private_ip ?? "",
        item.os ?? "",
        item.status ?? "",
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(keyword)
    })
  }, [instances, providerFilter, regionFilter, searchKeyword, statusFilter])

  const stats = useMemo(() => ({
    total: instances.length,
    providers: providerOptions.length,
    regions: regionOptions.length,
    publicIps: instances.filter((item) => Boolean(item.public_ip)).length,
  }), [instances, providerOptions.length, regionOptions.length])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("cloud.instances.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("cloud.instances.description")}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => fetchInstances(true)} disabled={refreshing}>
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {t("cloud.instances.refreshButton")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("cloud.instances.statTotal")}</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("cloud.instances.statProviders")}</CardDescription>
            <CardTitle className="text-2xl">{stats.providers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("cloud.instances.statRegions")}</CardDescription>
            <CardTitle className="text-2xl">{stats.regions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("cloud.instances.statPublicIps")}</CardDescription>
            <CardTitle className="text-2xl">{stats.publicIps}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("cloud.instances.filtersTitle")}</CardTitle>
          <CardDescription>{t("cloud.instances.filtersDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="cloud-instance-search">{t("cloud.instances.filterSearch")}</Label>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="cloud-instance-search"
                className="pl-9"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder={t("cloud.instances.filterSearchPlaceholder")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("cloud.instances.filterProvider")}</Label>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t("cloud.instances.filterProviderAll")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("cloud.instances.filterProviderAll")}</SelectItem>
                {providerOptions.map((provider) => (
                  <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("cloud.instances.filterRegion")}</Label>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t("cloud.instances.filterRegionAll")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("cloud.instances.filterRegionAll")}</SelectItem>
                {regionOptions.map((region) => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("cloud.instances.filterStatus")}</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t("cloud.instances.filterStatusAll")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("cloud.instances.filterStatusAll")}</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("cloud.instances.tableTitle")}</CardTitle>
          <CardDescription>{t("cloud.instances.tableDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("cloud.instances.tableColInstance")}</TableHead>
                  <TableHead>{t("cloud.instances.tableColProvider")}</TableHead>
                  <TableHead>{t("cloud.instances.tableColAccount")}</TableHead>
                  <TableHead>{t("cloud.instances.tableColRegion")}</TableHead>
                  <TableHead>{t("cloud.instances.tableColIp")}</TableHead>
                  <TableHead>{t("cloud.instances.tableColOs")}</TableHead>
                  <TableHead>{t("cloud.instances.tableColStatus")}</TableHead>
                  <TableHead>{t("cloud.instances.tableColLastSeen")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                      {t("cloud.instances.tableLoading")}
                    </TableCell>
                  </TableRow>
                ) : filteredInstances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                      {t("cloud.instances.tableEmpty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInstances.map((instance) => (
                    <TableRow key={instance.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <Link
                            href={withLocalePrefix(`/cloud/instances/${instance.id}`, locale)}
                            className="font-medium hover:underline"
                          >
                            {resolveInstanceName(instance)}
                          </Link>
                          <div className="font-mono text-xs text-muted-foreground">{instance.instance_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{instance.provider}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{instance.account_config_key}</TableCell>
                      <TableCell>{instance.region}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div>{instance.public_ip || "-"}</div>
                          <div className="text-muted-foreground">{instance.private_ip || "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">{instance.os || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={resolveStatusVariant(instance.status)}>
                          {instance.status || t("cloud.instances.statusUnknown")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between gap-2">
                          <span>{formatDateTime(instance.last_seen_at, locale)}</span>
                          <Button asChild type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            <Link href={withLocalePrefix(`/cloud/instances/${instance.id}`, locale)}>
                              {t("cloud.instances.actionViewDetails")}
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
