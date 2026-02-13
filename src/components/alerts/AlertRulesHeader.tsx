"use client"

import { Plus, RefreshCw } from "lucide-react"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { Button } from "@/components/ui/button"
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type AlertRulesPageHeaderProps = {
  loading: boolean
  refreshing: boolean
  onCreate: () => void
  onRefresh: () => void
}

export function AlertRulesPageHeader({
  loading,
  refreshing,
  onCreate,
  onRefresh,
}: AlertRulesPageHeaderProps) {
  const { t } = useAppTranslations("alerts")

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("rules.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("rules.description")}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("rules.btnCreate")}
        </Button>
        <Button variant="outline" onClick={onRefresh} disabled={loading || refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {t("rules.btnRefresh")}
        </Button>
      </div>
    </div>
  )
}

export function AlertRulesTableHeader() {
  const { t } = useAppTranslations("alerts")

  return (
    <CardHeader>
      <CardTitle>{t("rules.title")}</CardTitle>
      <CardDescription>{t("rules.tableDescription")}</CardDescription>
    </CardHeader>
  )
}
