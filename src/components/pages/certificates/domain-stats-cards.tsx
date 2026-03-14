"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type TranslateFn = (path: string, values?: Record<string, string | number>) => string

type DomainStatsCardsProps = {
  t: TranslateFn
  stats: {
    total: number
    healthy: number
    failed: number
    expiring: number
  }
}

export function DomainStatsCards({ t, stats }: DomainStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("certificates.domains.statTotal")}</CardDescription>
          <CardTitle className="text-3xl">{stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("certificates.domains.statHealthy")}</CardDescription>
          <CardTitle className="text-3xl text-emerald-600">{stats.healthy}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("certificates.domains.statFailed")}</CardDescription>
          <CardTitle className="text-3xl text-red-600">{stats.failed}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("certificates.domains.statExpiring")}</CardDescription>
          <CardTitle className="text-3xl text-amber-600">{stats.expiring}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
