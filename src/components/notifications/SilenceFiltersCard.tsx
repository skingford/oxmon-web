"use client"

import { ChangeEventHandler, RefObject } from "react"
import { Download, FilterX, Loader2, Upload } from "lucide-react"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

type SilenceStatusFilter = "all" | "active" | "scheduled" | "expired" | "unknown"
type WindowOriginModeFilter = "all" | "replaced" | "cloned"

type SilenceFiltersCardProps = {
  searchKeyword: string
  statusFilter: SilenceStatusFilter
  originModeFilter: WindowOriginModeFilter
  windowOriginTtlDays: number
  onlyOriginMarked: boolean
  hasActiveFilters: boolean
  hasWindowOrigins: boolean
  importingOrigins: boolean
  originMarksCount: number
  originModeCounts: {
    replaced: number
    cloned: number
  }
  importOriginsInputRef: RefObject<HTMLInputElement | null>
  onSearchKeywordChange: (value: string) => void
  onStatusFilterChange: (value: SilenceStatusFilter) => void
  onOriginModeFilterChange: (value: WindowOriginModeFilter) => void
  onWindowOriginTtlDaysChange: (value: string) => void
  onOnlyOriginMarkedChange: (value: boolean) => void
  onImportWindowOrigins: ChangeEventHandler<HTMLInputElement>
  onResetFilters: () => void
  onClearWindowOrigins: () => void
  onTriggerImportOrigins: () => void
  onExportWindowOrigins: () => void
}

export function SilenceFiltersCard({
  searchKeyword,
  statusFilter,
  originModeFilter,
  windowOriginTtlDays,
  onlyOriginMarked,
  hasActiveFilters,
  hasWindowOrigins,
  importingOrigins,
  originMarksCount,
  originModeCounts,
  importOriginsInputRef,
  onSearchKeywordChange,
  onStatusFilterChange,
  onOriginModeFilterChange,
  onWindowOriginTtlDaysChange,
  onOnlyOriginMarkedChange,
  onImportWindowOrigins,
  onResetFilters,
  onClearWindowOrigins,
  onTriggerImportOrigins,
  onExportWindowOrigins,
}: SilenceFiltersCardProps) {
  const { t } = useAppTranslations("pages")

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("notifications.silenceFiltersTitle")}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={hasWindowOrigins ? "secondary" : "outline"}>
              {t("notifications.silenceOriginMarksCount", { count: originMarksCount })}
            </Badge>
            <Badge variant={originModeCounts.replaced > 0 ? "secondary" : "outline"}>
              {t("notifications.silenceOriginReplacedCount", { count: originModeCounts.replaced })}
            </Badge>
            <Badge variant={originModeCounts.cloned > 0 ? "secondary" : "outline"}>
              {t("notifications.silenceOriginClonedCount", { count: originModeCounts.cloned })}
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            ref={importOriginsInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImportWindowOrigins}
          />

          <div className="rounded-lg border bg-muted/20 p-3 sm:p-4">
            <FilterToolbar
              className="gap-3 sm:grid-cols-2 xl:grid-cols-12"
              search={{
                value: searchKeyword,
                onValueChange: onSearchKeywordChange,
                placeholder: t("notifications.silenceSearchPlaceholder"),
                fieldClassName: "sm:col-span-2 xl:col-span-6",
                inputClassName: "h-10",
              }}
            >
              <div className="xl:col-span-2">
                <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as SilenceStatusFilter)}>
                  <SelectTrigger className="h-10 w-full bg-background">
                    <SelectValue placeholder={t("notifications.silenceFilterStatusLabel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("notifications.silenceFilterStatusAll")}</SelectItem>
                    <SelectItem value="active">{t("notifications.silenceFilterStatusActive")}</SelectItem>
                    <SelectItem value="scheduled">{t("notifications.silenceFilterStatusScheduled")}</SelectItem>
                    <SelectItem value="expired">{t("notifications.silenceFilterStatusExpired")}</SelectItem>
                    <SelectItem value="unknown">{t("notifications.silenceFilterStatusUnknown")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="xl:col-span-2">
                <Select value={originModeFilter} onValueChange={(value) => onOriginModeFilterChange(value as WindowOriginModeFilter)}>
                  <SelectTrigger className="h-10 w-full bg-background">
                    <SelectValue placeholder={t("notifications.silenceFilterOriginModeLabel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("notifications.silenceFilterOriginModeAll")}</SelectItem>
                    <SelectItem value="replaced">{t("notifications.silenceFilterOriginModeReplaced")}</SelectItem>
                    <SelectItem value="cloned">{t("notifications.silenceFilterOriginModeCloned")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="xl:col-span-2">
                <Select value={String(windowOriginTtlDays)} onValueChange={onWindowOriginTtlDaysChange}>
                  <SelectTrigger className="h-10 w-full bg-background">
                    <SelectValue placeholder={t("notifications.silenceOriginTtlLabel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t("notifications.silenceOriginTtlOneDay")}</SelectItem>
                    <SelectItem value="7">{t("notifications.silenceOriginTtlSevenDays")}</SelectItem>
                    <SelectItem value="30">{t("notifications.silenceOriginTtlThirtyDays")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FilterToolbar>
          </div>

          <div className="rounded-lg border p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="flex h-10 items-center justify-between rounded-md border bg-background px-3">
                <p className="truncate text-sm">{t("notifications.silenceFilterOriginOnlyLabel")}</p>
                <Switch checked={onlyOriginMarked} onCheckedChange={onOnlyOriginMarkedChange} />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={onResetFilters}
                disabled={!hasActiveFilters}
                title={t("notifications.silenceClearFilters")}
                aria-label={t("notifications.silenceClearFilters")}
                className="h-10 w-full justify-center gap-1.5 px-2 text-sm"
              >
                <FilterX className="h-4 w-4 shrink-0" />
                {t("notifications.silenceClearFiltersShort")}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onClearWindowOrigins}
                disabled={!hasWindowOrigins}
                title={t("notifications.silenceClearOriginsButton")}
                aria-label={t("notifications.silenceClearOriginsButton")}
                className="h-10 w-full justify-center gap-1.5 px-2 text-sm"
              >
                {t("notifications.silenceClearOriginsShort")}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onTriggerImportOrigins}
                disabled={importingOrigins}
                title={t("notifications.silenceImportOriginsButton")}
                aria-label={t("notifications.silenceImportOriginsButton")}
                className="h-10 w-full justify-center gap-1.5 px-2 text-sm"
              >
                {importingOrigins ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Upload className="h-4 w-4 shrink-0" />}
                {t("notifications.silenceImportOriginsShort")}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onExportWindowOrigins}
                disabled={!hasWindowOrigins}
                title={t("notifications.silenceExportOriginsButton")}
                aria-label={t("notifications.silenceExportOriginsButton")}
                className="h-10 w-full justify-center gap-1.5 px-2 text-sm"
              >
                <Download className="h-4 w-4 shrink-0" />
                {t("notifications.silenceExportOriginsShort")}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
