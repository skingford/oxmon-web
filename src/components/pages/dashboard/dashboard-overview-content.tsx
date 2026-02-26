"use client"

import dynamic from "next/dynamic"
import type { DashboardOverview } from "@/types/api"
import { DashboardChartCardSkeleton } from "@/components/pages/dashboard/dashboard-chart-card-skeleton"
import { DashboardQuickLinksCard } from "@/components/pages/dashboard/dashboard-quick-links-card"
import { DashboardTopStatsCards } from "@/components/pages/dashboard/dashboard-top-stats-cards"

const loadDashboardCertSummaryChartCard = () =>
  import("@/components/pages/dashboard/dashboard-cert-summary-chart-card").then(
    (module) => module.DashboardCertSummaryChartCard
  )

const loadDashboardCloudSummaryChartCard = () =>
  import("@/components/pages/dashboard/dashboard-cloud-summary-chart-card").then(
    (module) => module.DashboardCloudSummaryChartCard
  )

const DashboardCertSummaryChartCard = dynamic(
  loadDashboardCertSummaryChartCard,
  { loading: () => <DashboardChartCardSkeleton />, ssr: false }
)

const DashboardCloudSummaryChartCard = dynamic(
  loadDashboardCloudSummaryChartCard,
  { loading: () => <DashboardChartCardSkeleton />, ssr: false }
)

function preloadDashboardCharts() {
  void Promise.all([loadDashboardCertSummaryChartCard(), loadDashboardCloudSummaryChartCard()])
}

type DashboardOverviewContentProps = {
  overview: DashboardOverview
  onlineRate: number
  severityStats: Array<[string, number]>
  uptimeText: string
  storageSizeText: string
  cloudSummary: DashboardOverview["cloud_summary"]
  cloudEnabledAccountRate: number
  alertsPath: string
  certificatesPath: string
  cloudAccountsPath: string
  cloudInstancesPath: string
  systemPath: string
}

export function DashboardOverviewContent({
  overview,
  onlineRate,
  severityStats,
  uptimeText,
  storageSizeText,
  cloudSummary,
  cloudEnabledAccountRate,
  alertsPath,
  certificatesPath,
  cloudAccountsPath,
  cloudInstancesPath,
  systemPath,
}: DashboardOverviewContentProps) {
  return (
    <>
      <DashboardTopStatsCards
        overview={overview}
        onlineRate={onlineRate}
        severityStats={severityStats}
        uptimeText={uptimeText}
        storageSizeText={storageSizeText}
      />

      <div
        className="grid gap-4 lg:grid-cols-3"
        onMouseEnter={preloadDashboardCharts}
        onFocusCapture={preloadDashboardCharts}
      >
        <DashboardCertSummaryChartCard certSummary={overview.cert_summary} />
        <DashboardCloudSummaryChartCard
          cloudSummary={cloudSummary}
          cloudEnabledAccountRate={cloudEnabledAccountRate}
        />
        <DashboardQuickLinksCard
          alertsPath={alertsPath}
          certificatesPath={certificatesPath}
          cloudAccountsPath={cloudAccountsPath}
          cloudInstancesPath={cloudInstancesPath}
          systemPath={systemPath}
          alerts24h={overview.alerts_24h}
          totalDomains={overview.cert_summary.total_domains}
          enabledCloudAccounts={cloudSummary.enabled_accounts}
          runningCloudInstances={cloudSummary.running_instances}
          storageSizeText={storageSizeText}
        />
      </div>
    </>
  )
}
