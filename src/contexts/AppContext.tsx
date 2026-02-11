'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import type { Agent, Certificate, Alert, TeamMember, AppPreferences, LogEntry } from '@/lib/types'
import { MOCK_AGENTS, MOCK_CERTS, MOCK_ALERTS, MOCK_TEAM, DEFAULT_PREFERENCES } from '@/lib/constants'
import { getFromLocalStorage, setToLocalStorage } from '@/lib/localStorage'
import { createId } from '@/lib/id'
import { useI18n } from '@/contexts/I18nContext'

type AgentCommandInjection = { agent: Agent; command: string } | null

interface AppDataContextType {
  agents: Agent[]
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>
  certificates: Certificate[]
  setCertificates: React.Dispatch<React.SetStateAction<Certificate[]>>
  alerts: Alert[]
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>
  teamMembers: TeamMember[]
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>
  preferences: AppPreferences
  setPreferences: React.Dispatch<React.SetStateAction<AppPreferences>>
  logs: LogEntry[]
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>
  apiKey: string
  setApiKey: React.Dispatch<React.SetStateAction<string>>
  handleUpdateAgentStatus: (id: string) => void
  handleAcknowledgeAlert: (id: string) => void
}

interface AppUiContextType {
  toasts: ToastMessage[]
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
  aiSummary: string
  setAiSummary: React.Dispatch<React.SetStateAction<string>>
  isAiLoading: boolean
  setIsAiLoading: React.Dispatch<React.SetStateAction<boolean>>
  logAnalysis: string | null
  setLogAnalysis: React.Dispatch<React.SetStateAction<string | null>>
  isLogAnalyzing: boolean
  setIsLogAnalyzing: React.Dispatch<React.SetStateAction<boolean>>
  predictiveData: string | null
  setPredictiveData: React.Dispatch<React.SetStateAction<string | null>>
  terminalInjection: AgentCommandInjection
  setTerminalInjection: React.Dispatch<React.SetStateAction<AgentCommandInjection>>
  isAuthenticated: boolean
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
}

type AppContextType = AppDataContextType & AppUiContextType

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

const AppDataContext = createContext<AppDataContextType | null>(null)
const AppUiContext = createContext<AppUiContextType | null>(null)

function getMissingContextErrorMessage(hookName: string): string {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : 'unknown'
  return `${hookName} must be used within AppProvider (pathname: ${pathname})`
}

export function useAppDataContext() {
  const ctx = useContext(AppDataContext)

  if (!ctx) {
    throw new Error(getMissingContextErrorMessage('useAppDataContext'))
  }

  return ctx
}

export function useAppUiContext() {
  const ctx = useContext(AppUiContext)

  if (!ctx) {
    throw new Error(getMissingContextErrorMessage('useAppUiContext'))
  }

  return ctx
}

export function useAppContext() {
  const data = useAppDataContext()
  const ui = useAppUiContext()

  return useMemo(() => ({ ...data, ...ui }), [data, ui])
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { localizeToast } = useI18n()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const [aiSummary, setAiSummary] = useState<string>('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [logAnalysis, setLogAnalysis] = useState<string | null>(null)
  const [isLogAnalyzing, setIsLogAnalyzing] = useState(false)
  const [predictiveData, setPredictiveData] = useState<string | null>(null)
  const [terminalInjection, setTerminalInjection] = useState<AgentCommandInjection>(null)

  // Initialize with defaults first (SSR compatible)
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS)
  const [certificates, setCertificates] = useState<Certificate[]>(MOCK_CERTS)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(MOCK_TEAM)
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES)
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS)
  const [apiKey, setApiKey] = useState('ox_live_' + 'initialization_key')
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: '2024-01-01 00:00:00', level: 'info', category: 'system', message: 'Admin dashboard initialized.' },
    { id: '2', timestamp: '2024-01-01 00:00:00', level: 'info', category: 'auth', message: 'Login successful for user Alex Morgan.' }
  ])

  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage after hydration (client-side only)
  // Apply client-localstorage-schema pattern with versioning
  useEffect(() => {
    setIsHydrated(true)

    // Load data with version checking
    setAgents(getFromLocalStorage('ox_agents', MOCK_AGENTS))
    setCertificates(getFromLocalStorage('ox_certs', MOCK_CERTS))
    setTeamMembers(getFromLocalStorage('ox_team', MOCK_TEAM))
    setPreferences(getFromLocalStorage('ox_prefs', DEFAULT_PREFERENCES))
    setAlerts(getFromLocalStorage('ox_alerts', MOCK_ALERTS))

    // Generate fresh API key
    setApiKey(`ox_live_${createId('key')}`)

    // Set current timestamps for logs
    const now = new Date().toISOString().replace('T', ' ').substr(0, 19)
    setLogs([
      { id: '1', timestamp: now, level: 'info', category: 'system', message: 'Admin dashboard initialized.' },
      { id: '2', timestamp: now, level: 'info', category: 'auth', message: 'Login successful for user Alex Morgan.' }
    ])
  }, [])

  // Save to localStorage when data changes (skip on first render)
  // Debounced batch write to reduce frequent sync writes
  useEffect(() => {
    if (!isHydrated) return

    const timeoutId = window.setTimeout(() => {
      setToLocalStorage('ox_agents', agents)
      setToLocalStorage('ox_certs', certificates)
      setToLocalStorage('ox_team', teamMembers)
      setToLocalStorage('ox_prefs', preferences)
      setToLocalStorage('ox_alerts', alerts)
    }, 150)

    return () => window.clearTimeout(timeoutId)
  }, [agents, certificates, teamMembers, preferences, alerts, isHydrated])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = createId('toast')
    const localizedMessage = localizeToast(message)
    setToasts((prev) => [...prev, { id, message: localizedMessage, type }])
  }, [localizeToast])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const handleUpdateAgentStatus = useCallback((id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'Maintenance' ? 'Online' : 'Maintenance' } : a))
    showToast(`Agent ${id} status toggled via voice link.`, 'info')
  }, [showToast])

  const handleAcknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, severity: 'Resolved' } : a))
    showToast(`Incident ${id} resolved via voice link.`, 'success')
  }, [showToast])

  const dataContextValue = useMemo(() => ({
    agents, setAgents,
    certificates, setCertificates,
    alerts, setAlerts,
    teamMembers, setTeamMembers,
    preferences, setPreferences,
    logs, setLogs,
    apiKey, setApiKey,
    handleUpdateAgentStatus,
    handleAcknowledgeAlert,
  }), [
    agents, certificates, alerts, teamMembers, preferences, logs, apiKey,
    handleUpdateAgentStatus, handleAcknowledgeAlert,
  ])

  const uiContextValue = useMemo(() => ({
    toasts, showToast, removeToast,
    aiSummary, setAiSummary,
    isAiLoading, setIsAiLoading,
    logAnalysis, setLogAnalysis,
    isLogAnalyzing, setIsLogAnalyzing,
    predictiveData, setPredictiveData,
    terminalInjection, setTerminalInjection,
    isAuthenticated, setIsAuthenticated,
  }), [
    toasts, showToast, removeToast,
    aiSummary, isAiLoading, logAnalysis, isLogAnalyzing,
    predictiveData, terminalInjection,
    isAuthenticated,
  ])

  return (
    <AppDataContext.Provider value={dataContextValue}>
      <AppUiContext.Provider value={uiContextValue}>
        {children}
      </AppUiContext.Provider>
    </AppDataContext.Provider>
  )
}
