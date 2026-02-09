'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/contexts/AppContext'
import { useI18n } from '@/contexts/I18nContext'
import { interpretCommand } from '@/actions/ai'
import { ViewState } from '@/lib/types'

interface CommandPaletteProps {
  onClose: () => void
}

const viewToRoute: Record<string, string> = {
  dashboard: '/dashboard',
  agents: '/agents',
  infrastructure: '/infrastructure',
  certificates: '/certificates',
  alerts: '/alerts',
  logs: '/logs',
  tools: '/tools',
  settings: '/settings',
  help: '/help',
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose }) => {
  const router = useRouter()
  const { showToast } = useAppContext()
  const { t } = useI18n()
  const [commandInput, setCommandInput] = useState('')
  const [isCommandExecuting, setIsCommandExecuting] = useState(false)

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commandInput.trim()) return
    setIsCommandExecuting(true)
    try {
      const result = await interpretCommand(commandInput)
      if (result.action === 'navigate') {
        const route = viewToRoute[result.target] || '/dashboard'
        router.push(route)
        showToast(result.message, 'info')
      }
      onClose()
      setCommandInput('')
    } catch {
      showToast(t('commandPalette.translationFailed'), 'error')
    } finally {
      setIsCommandExecuting(false)
    }
  }

  const suggestions = [
    t('commandPalette.suggestion.infrastructure'),
    t('commandPalette.suggestion.alerts'),
    t('commandPalette.suggestion.logs'),
    t('commandPalette.suggestion.tools'),
    t('commandPalette.suggestion.settings'),
  ]

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-[#E5E5EA] overflow-hidden animate-fade-in-up ring-1 ring-black/5">
        <form onSubmit={handleCommandSubmit} className="flex items-center p-12 border-b border-[#E5E5EA]">
          <span className="material-symbols-outlined text-[#0071E3] text-4xl mr-8 filled">psychology</span>
          <input autoFocus type="text" value={commandInput} onChange={(e) => setCommandInput(e.target.value)} placeholder={t('commandPalette.inputPlaceholder')} className="flex-1 text-2xl font-black text-[#1D1D1F] outline-none bg-transparent placeholder:text-[#C1C1C1]" disabled={isCommandExecuting} />
          {isCommandExecuting && <div className="w-8 h-8 border-4 border-[#0071E3] border-t-transparent rounded-full animate-spin"></div>}
        </form>
        <div className="p-10 bg-[#F5F5F7]/50">
          <h4 className="text-[10px] font-black text-[#86868B] uppercase tracking-[0.4em] mb-8">{t('commandPalette.intentSuggestions')}</h4>
          <div className="grid grid-cols-2 gap-4">
            {suggestions.map((cmd) => (
              <button key={cmd} onClick={() => setCommandInput(cmd)} className="text-left px-8 py-5 bg-white border border-[#E5E5EA] rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-[#86868B] hover:text-[#0071E3] hover:border-[#0071E3]/30 hover:shadow-soft transition-all shadow-sm group">
                <span className="group-hover:translate-x-1 transition-transform inline-block">{cmd}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
