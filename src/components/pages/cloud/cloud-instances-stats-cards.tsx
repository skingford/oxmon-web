"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type CloudInstancesStats = {
  total: number
  providers: number
  regions: number
  publicIps: number
}

type CloudInstancesStatsCardsProps = {
  stats: CloudInstancesStats
  labels: {
    total: string
    providers: string
    regions: string
    publicIps: string
  }
}

export function CloudInstancesStatsCards({ stats, labels }: CloudInstancesStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{labels.total}</CardDescription>
          <CardTitle className="text-2xl">{stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{labels.providers}</CardDescription>
          <CardTitle className="text-2xl">{stats.providers}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{labels.regions}</CardDescription>
          <CardTitle className="text-2xl">{stats.regions}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{labels.publicIps}</CardDescription>
          <CardTitle className="text-2xl">{stats.publicIps}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
