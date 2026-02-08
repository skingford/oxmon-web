'use client'

import { useAppContext } from '@/contexts/AppContext'
import Infrastructure from '@/components/Infrastructure'

export default function InfrastructurePage() {
  const { agents, showToast } = useAppContext()

  return (
    <Infrastructure
      agents={agents}
      onShowToast={showToast}
    />
  )
}
