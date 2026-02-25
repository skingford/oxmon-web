"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type TranslateFn = (path: string, values?: Record<string, string | number>) => string

type SilenceStats = {
  total: number
  active: number
  scheduled: number
  expired: number
}

type SilenceStatsCardsProps = {
  t: TranslateFn
  stats: SilenceStats
}

export function SilenceStatsCards({ t, stats }: SilenceStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("notifications.silenceStatTotal")}</CardDescription>
          <CardTitle className="text-2xl">{stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("notifications.silenceStatActive")}</CardDescription>
          <CardTitle className="text-2xl text-emerald-600">{stats.active}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("notifications.silenceStatScheduled")}</CardDescription>
          <CardTitle className="text-2xl text-amber-600">{stats.scheduled}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("notifications.silenceStatExpired")}</CardDescription>
          <CardTitle className="text-2xl text-muted-foreground">{stats.expired}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
