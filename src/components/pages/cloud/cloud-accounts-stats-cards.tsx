"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type CloudAccountsStats = {
  total: number
  enabled: number
  disabled: number
  providers: number
}

type CloudAccountsStatsCardsProps = {
  stats: CloudAccountsStats
  texts: {
    total: string
    enabled: string
    disabled: string
    providers: string
  }
}

export function CloudAccountsStatsCards({ stats, texts }: CloudAccountsStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{texts.total}</CardDescription>
          <CardTitle className="text-3xl">{stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{texts.enabled}</CardDescription>
          <CardTitle className="text-3xl text-emerald-600">{stats.enabled}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{texts.disabled}</CardDescription>
          <CardTitle className="text-3xl text-red-600">{stats.disabled}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{texts.providers}</CardDescription>
          <CardTitle className="text-3xl text-amber-600">{stats.providers}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
