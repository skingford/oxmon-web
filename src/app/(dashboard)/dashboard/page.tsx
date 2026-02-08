'use client'

import { useRouter } from 'next/navigation'
import { useAppContext } from '@/contexts/AppContext'
import Dashboard from '@/components/Dashboard'
import { generateSystemSummary, generateFullReport, generatePredictiveMaintenance } from '@/actions/ai'

export default function DashboardPage() {
  const router = useRouter()
  const {
    agents,
    certificates,
    alerts,
    aiSummary,
    setAiSummary,
    isAiLoading,
    setIsAiLoading,
    predictiveData,
    setPredictiveData,
    showToast
  } = useAppContext()

  const handleGenerateAiSummary = async () => {
    setIsAiLoading(true)
    try {
      const summary = await generateSystemSummary(agents.length, alerts.filter(a => a.severity === 'Critical').length)
      setAiSummary(summary)
      showToast('AI synthesis complete.', 'success')
    } catch {
      showToast('AI audit failed.', 'error')
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleGenerateFullReport = async () => {
    try {
      const report = await generateFullReport(agents.length, certificates.length, alerts.length)
      const blob = new Blob([report], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `oxmon-report-${Date.now()}.md`
      a.click()
      showToast('Report exported.', 'success')
    } catch {
      showToast('Export failed.', 'error')
    }
  }

  const handleRunPredictiveScan = async () => {
    try {
      const result = await generatePredictiveMaintenance(agents.map(a => a.name))
      setPredictiveData(result)
      showToast('Predictive scan synchronized.', 'info')
    } catch {
      showToast('Predictive handshake failed.', 'error')
    }
  }

  return (
    <Dashboard
      onChangeView={(view) => router.push(`/${view}`)}
      agents={agents}
      certificates={certificates}
      alerts={alerts}
      aiSummary={aiSummary}
      isAiLoading={isAiLoading}
      onGenerateAiSummary={handleGenerateAiSummary}
      onGenerateFullReport={handleGenerateFullReport}
      predictiveData={predictiveData}
      onRunPredictiveScan={handleRunPredictiveScan}
    />
  )
}
