'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Agent, Certificate, Alert, TeamMember, AppPreferences, LogEntry } from '@/lib/types'
import { MOCK_AGENTS, MOCK_CERTS, MOCK_ALERTS, MOCK_TEAM, DEFAULT_PREFERENCES } from '@/lib/constants'

interface AppContextType {
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
  terminalInjection: { agent: Agent; command: string } | null
  setTerminalInjection: React.Dispatch<React.SetStateAction<{ agent: Agent; command: string } | null>>
  handleUpdateAgentStatus: (id: string) => void
  handleAcknowledgeAlert: (id: string) => void
  isAuthenticated: boolean
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
}

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

const AppContext = createContext<AppContextType | null>(null)

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const [aiSummary, setAiSummary] = useState<string>('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [logAnalysis, setLogAnalysis] = useState<string | null>(null)
  const [isLogAnalyzing, setIsLogAnalyzing] = useState(false)
  const [predictiveData, setPredictiveData] = useState<string | null>(null)
  const [terminalInjection, setTerminalInjection] = useState<{ agent: Agent; command: string } | null>(null)

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
  useEffect(() => {
    setIsHydrated(true)

    const savedAgents = localStorage.getItem('ox_agents')
    const savedCerts = localStorage.getItem('ox_certs')
    const savedTeam = localStorage.getItem('ox_team')
    const savedPrefs = localStorage.getItem('ox_prefs')
    const savedAlerts = localStorage.getItem('ox_alerts')

    if (savedAgents) setAgents(JSON.parse(savedAgents))
    if (savedCerts) setCertificates(JSON.parse(savedCerts))
    if (savedTeam) setTeamMembers(JSON.parse(savedTeam))
    if (savedPrefs) setPreferences(JSON.parse(savedPrefs))
    if (savedAlerts) setAlerts(JSON.parse(savedAlerts))

    // Generate fresh API key
    setApiKey('ox_live_' + Math.random().toString(36).substr(2, 24))

    // Set current timestamps for logs
    const now = new Date().toISOString().replace('T', ' ').substr(0, 19)
    setLogs([
      { id: '1', timestamp: now, level: 'info', category: 'system', message: 'Admin dashboard initialized.' },
      { id: '2', timestamp: now, level: 'info', category: 'auth', message: 'Login successful for user Alex Morgan.' }
    ])
  }, [])

  // Save to localStorage when data changes (skip on first render)
  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem('ox_agents', JSON.stringify(agents))
  }, [agents, isHydrated])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem('ox_certs', JSON.stringify(certificates))
  }, [certificates, isHydrated])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem('ox_team', JSON.stringify(teamMembers))
  }, [teamMembers, isHydrated])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem('ox_prefs', JSON.stringify(preferences))
  }, [preferences, isHydrated])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem('ox_alerts', JSON.stringify(alerts))
  }, [alerts, isHydrated])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

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

  return (
    <AppContext.Provider value={{
      agents, setAgents,
      certificates, setCertificates,
      alerts, setAlerts,
      teamMembers, setTeamMembers,
      preferences, setPreferences,
      logs, setLogs,
      apiKey, setApiKey,
      toasts, showToast, removeToast,
      aiSummary, setAiSummary,
      isAiLoading, setIsAiLoading,
      logAnalysis, setLogAnalysis,
      isLogAnalyzing, setIsLogAnalyzing,
      predictiveData, setPredictiveData,
      terminalInjection, setTerminalInjection,
      handleUpdateAgentStatus,
      handleAcknowledgeAlert,
      isAuthenticated, setIsAuthenticated,
    }}>
      {children}
    </AppContext.Provider>
  )
}
