"use client"

import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type NotificationsStats = {
  total: number
  enabled: number
  disabled: number
  missingRecipients: number
}

type NotificationsStatsCardsProps = {
  stats: NotificationsStats
  t: AppNamespaceTranslator<"pages">
}

export function NotificationsStatsCards({
  stats,
  t,
}: NotificationsStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("notifications.statTotal")}</CardDescription>
          <CardTitle className="text-2xl">{stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("notifications.statEnabled")}</CardDescription>
          <CardTitle className="text-2xl text-emerald-600">{stats.enabled}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("notifications.statDisabled")}</CardDescription>
          <CardTitle className="text-2xl text-muted-foreground">{stats.disabled}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("notifications.statNoRecipients")}</CardDescription>
          <CardTitle className="text-2xl text-amber-600">{stats.missingRecipients}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
