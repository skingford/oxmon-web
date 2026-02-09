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
      onUpdateStatus={(id) => setAgents(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'Maintenance' ? 'Online' : 'Maintenance' } : a))}
      onShowToast={showToast}
      initialInjection={terminalInjection}
      clearInjection={() => setTerminalInjection(null)}
    />
  )
}
