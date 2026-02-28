"use client"

import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import type { DashboardOverview, CertSummary, CloudSummary } from "@/types/api"
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
  cloudSummary: CloudSummary
  certSummary: CertSummary
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
  certSummary,
  cloudEnabledAccountRate,
  alertsPath,
  certificatesPath,
  cloudAccountsPath,
  cloudInstancesPath,
  systemPath,
}: DashboardOverviewContentProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <DashboardTopStatsCards
        overview={overview}
        onlineRate={onlineRate}
        severityStats={severityStats}
        uptimeText={uptimeText}
        storageSizeText={storageSizeText}
      />
      </motion.div>

      <motion.div
        className="grid gap-4 lg:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        onMouseEnter={preloadDashboardCharts}
        onFocusCapture={preloadDashboardCharts}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <DashboardCertSummaryChartCard certSummary={certSummary} />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <DashboardCloudSummaryChartCard
            cloudSummary={cloudSummary}
            cloudEnabledAccountRate={cloudEnabledAccountRate}
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <DashboardQuickLinksCard
            alertsPath={alertsPath}
            certificatesPath={certificatesPath}
            cloudAccountsPath={cloudAccountsPath}
            cloudInstancesPath={cloudInstancesPath}
            systemPath={systemPath}
            alerts24h={overview.alerts_24h}
            totalDomains={certSummary.total_domains}
            enabledCloudAccounts={cloudSummary.enabled_accounts}
            runningCloudInstances={cloudSummary.running_instances}
            storageSizeText={storageSizeText}
          />
        </motion.div>
      </motion.div>
    </>
  )
}
