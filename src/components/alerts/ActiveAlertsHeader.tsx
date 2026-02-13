"use client"

import { RefreshCw, X } from "lucide-react"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { Button } from "@/components/ui/button"
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

type ActiveAlertsTopControlsProps = {
  autoRefresh: boolean
  loading: boolean
  refreshing: boolean
  onAutoRefreshChange: (value: boolean) => void
  onRefresh: () => void
}

type ActiveAlertsListHeaderProps = {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
}

export function ActiveAlertsTopControls({
  autoRefresh,
  loading,
  refreshing,
  onAutoRefreshChange,
  onRefresh,
}: ActiveAlertsTopControlsProps) {
  const { t } = useAppTranslations("alerts")

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("active.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("active.description")}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={onAutoRefreshChange} />
            <Label htmlFor="auto-refresh" className="cursor-pointer text-sm">
              {t("active.autoRefresh")}
            </Label>
          </div>
          <Button variant="outline" onClick={onRefresh} disabled={loading || refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("active.btnRefresh")}
          </Button>
        </div>
      </div>

      {autoRefresh ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          {t("active.autoRefreshEnabled")}
        </div>
      ) : null}
    </>
  )
}

export function ActiveAlertsListHeader({ searchQuery, onSearchQueryChange }: ActiveAlertsListHeaderProps) {
  const { t } = useAppTranslations("alerts")

  return (
    <CardHeader>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{t("active.title")}</CardTitle>
          <CardDescription>{t("active.description")}</CardDescription>
        </div>
        <div className="w-full md:w-80">
          <FilterToolbar
            className="md:grid-cols-1 xl:grid-cols-1"
            search={{
              value: searchQuery,
              onValueChange: onSearchQueryChange,
              placeholder: t("active.searchPlaceholder"),
              inputClassName: "h-10",
              trailing: searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null,
            }}
          />
        </div>
      </div>
    </CardHeader>
  )
}
