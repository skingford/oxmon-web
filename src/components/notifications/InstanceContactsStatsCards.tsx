"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type InstanceContactsStatsCardsProps = {
  stats: {
    total: number
    enabled: number
    disabled: number
    patterns: number
  }
  texts: {
    total: string
    enabled: string
    disabled: string
    patterns: string
  }
}

export function InstanceContactsStatsCards({
  stats,
  texts,
}: InstanceContactsStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{texts.total}</CardDescription>
          <CardTitle className="text-2xl">{stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{texts.enabled}</CardDescription>
          <CardTitle className="text-2xl text-emerald-600">{stats.enabled}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{texts.disabled}</CardDescription>
          <CardTitle className="text-2xl text-muted-foreground">{stats.disabled}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{texts.patterns}</CardDescription>
          <CardTitle className="text-2xl text-sky-600">{stats.patterns}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
