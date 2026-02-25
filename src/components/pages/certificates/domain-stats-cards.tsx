"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type TranslateFn = (path: string, values?: Record<string, string | number>) => string

type DomainStatsCardsProps = {
  t: TranslateFn
  stats: {
    total: number
    enabled: number
    disabled: number
  }
}

export function DomainStatsCards({ t, stats }: DomainStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("certificates.domains.statTotal")}</CardDescription>
          <CardTitle className="text-3xl">{stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("certificates.domains.statEnabled")}</CardDescription>
          <CardTitle className="text-3xl text-emerald-600">{stats.enabled}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("certificates.domains.statDisabled")}</CardDescription>
          <CardTitle className="text-3xl text-muted-foreground">{stats.disabled}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
