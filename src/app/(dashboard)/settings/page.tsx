'use client'

import { useAppContext } from '@/contexts/AppContext'
import Settings from '@/components/Settings'

export default function SettingsPage() {
  const {
    teamMembers,
    setTeamMembers,
    preferences,
    setPreferences,
    apiKey,
    setApiKey,
    showToast
  } = useAppContext()

  return (
    <Settings
      teamMembers={teamMembers}
      preferences={preferences}
      onAddTeamMember={(member) => setTeamMembers(prev => [...prev, member])}
      onRemoveTeamMember={(id) => setTeamMembers(prev => prev.filter(m => m.id !== id))}
      onUpdateTeamMemberRole={(id, role) => setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m))}
      onUpdatePreferences={(prefs) => setPreferences(prev => ({ ...prev, ...prefs }))}
      onShowToast={showToast}
      apiKey={apiKey}
      onRegenerateKey={() => {
        setApiKey('ox_live_' + Math.random().toString(36).substr(2, 24))
        showToast('Security key rotated.', 'success')
      }}
    />
  )
}
