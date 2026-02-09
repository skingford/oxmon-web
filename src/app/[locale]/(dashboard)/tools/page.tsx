'use client'

import { useAppContext } from '@/contexts/AppContext'
import ConfigForge from '@/components/ConfigForge'

export default function ToolsPage() {
  const { showToast } = useAppContext()

  return (
    <ConfigForge onShowToast={showToast} />
  )
}
