'use client'

import { useAppContext } from '@/contexts/AppContext'
import Agents from '@/components/Agents'

export default function AgentsPage() {
  const {
    agents,
    setAgents,
    terminalInjection,
    setTerminalInjection,
    showToast
  } = useAppContext()

  return (
    <Agents
      agents={agents}
      onAddAgent={(agent) => setAgents(prev => [...prev, agent])}
      onDeleteAgent={(id) => setAgents(prev => prev.filter(a => a.id !== id))}
      onUpdateStatus={(id) => setAgents(prev => prev.map((agent) => {
        if (agent.id !== id) return agent
        if (agent.status === 'Online') return { ...agent, status: 'Offline' }
        if (agent.status === 'Offline') return { ...agent, status: 'Maintenance' }
        return { ...agent, status: 'Online' }
      }))}
      onShowToast={showToast}
      initialInjection={terminalInjection}
      clearInjection={() => setTerminalInjection(null)}
    />
  )
}
