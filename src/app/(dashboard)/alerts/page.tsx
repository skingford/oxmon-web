'use client'

import { useAppContext } from '@/contexts/AppContext'
import { Alert, Agent } from '@/lib/types'
import Alerts from '@/components/Alerts'

export default function AlertsPage() {
  const { alerts, setAlerts, agents, setTerminalInjection, showToast } = useAppContext()

  const handleDiagnose = async (alert: Alert): Promise<string | undefined> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      return `Root Cause Analysis for ${alert.source}: Detected high resource contention. Recommend scaling horizontal replicas.`
    } catch {
      return undefined
    }
  }

  const handleRunScript = (agentName: string, command: string) => {
    const agent = agents.find(a => a.name === agentName)
    if (agent) {
      setTerminalInjection({ agent, command })
    }
  }

  return (
    <Alerts
      alerts={alerts}
      onAcknowledge={(id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, severity: 'Resolved' } : a))}
      onShowToast={showToast}
      onDiagnose={handleDiagnose}
      onRunScript={handleRunScript}
    />
  )
}
