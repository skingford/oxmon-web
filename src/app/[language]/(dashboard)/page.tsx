"use client"

import { withLocalePrefix } from "@/components/app-locale"
import { DashboardOverviewErrorCard } from "@/components/pages/dashboard/dashboard-overview-error-card"
import { DashboardOverviewContent } from "@/components/pages/dashboard/dashboard-overview-content"
import { DashboardOverviewSkeleton } from "@/components/pages/dashboard/dashboard-overview-skeleton"
import { DashboardPageHeader } from "@/components/pages/dashboard/dashboard-page-header"
import { useDashboardOverview } from "@/components/pages/dashboard/use-dashboard-overview"
import { useAppLocale } from "@/hooks/use-app-locale"

export default function DashboardPage() {
  const locale = useAppLocale()
  const {
    overview,
    loading,
    refreshing,
    fetchOverview,
    onlineRate,
    cloudSummary,
    certSummary,
    cloudEnabledAccountRate,
    uptimeText,
    storageSizeText,
    severityStats,
  } = useDashboardOverview()

  const alertsPath = withLocalePrefix("/alerts", locale)
  const certificatesPath = withLocalePrefix("/certificates", locale)
  const cloudAccountsPath = withLocalePrefix("/cloud", locale)
  const cloudInstancesPath = withLocalePrefix("/cloud/instances", locale)
  const systemPath = withLocalePrefix("/system", locale)

  return (
    <div className="space-y-6 p-4 md:p-6">
      <DashboardPageHeader refreshing={refreshing} onRefresh={() => fetchOverview(true)} />

      {loading && !overview ? (
        <DashboardOverviewSkeleton />
      ) : !overview ? (
        <DashboardOverviewErrorCard onRetry={() => fetchOverview()} retrying={refreshing} />
      ) : (
        <DashboardOverviewContent
          overview={overview}
          onlineRate={onlineRate}
          severityStats={severityStats}
          uptimeText={uptimeText}
          storageSizeText={storageSizeText}
          cloudSummary={cloudSummary}
          certSummary={certSummary}
          cloudEnabledAccountRate={cloudEnabledAccountRate}
          alertsPath={alertsPath}
          certificatesPath={certificatesPath}
          cloudAccountsPath={cloudAccountsPath}
          cloudInstancesPath={cloudInstancesPath}
          systemPath={systemPath}
        />
      )}
    </div>
  )
}
