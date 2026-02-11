'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppUiContext } from '@/contexts/AppContext'
import { useI18n } from '@/contexts/I18nContext'
import { interpretCommand } from '@/actions/ai'
import { buildLocalePath } from '@/lib/locale'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

interface CommandPaletteProps {
  onClose: () => void
}

const viewToRoute: Record<string, string> = {
  dashboard: '/dashboard',
  agents: '/agents',
  metrics: '/metrics',
  infrastructure: '/infrastructure',
  domains: '/domains',
  alerts: '/alerts',
  logs: '/logs',
  tools: '/tools',
  settings: '/settings',
  help: '/help',
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose }) => {
  const router = useRouter()
  const { showToast } = useAppUiContext()
  const { locale, t, tr } = useI18n()
  const [commandInput, setCommandInput] = useState('')
  const [isCommandExecuting, setIsCommandExecuting] = useState(false)

  const executeCommand = async (rawCommand: string) => {
    const normalizedCommand = rawCommand.trim()
    if (!normalizedCommand || isCommandExecuting) return

    setIsCommandExecuting(true)
    try {
      const result = await interpretCommand(normalizedCommand)
      if (result.action === 'navigate') {
        const route = viewToRoute[result.target] || '/dashboard'
        router.push(buildLocalePath(locale, route))
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

  const canExecute = commandInput.trim().length > 0 && !isCommandExecuting

  return (
    <CommandDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={t('commandPalette.inputPlaceholder')}
      description={t('commandPalette.intentSuggestions')}
      className="max-w-2xl overflow-hidden rounded-[2.5rem] border border-[#E5E5EA] p-0 shadow-2xl ring-1 ring-black/5"
      showCloseButton={false}
    >
      <div className="relative border-b border-[#E5E5EA] p-10">
        <CommandInput
          autoFocus
          value={commandInput}
          onValueChange={setCommandInput}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void executeCommand(commandInput)
            }
          }}
          placeholder={t('commandPalette.inputPlaceholder')}
          className="h-14 text-lg font-black text-[#1D1D1F] placeholder:text-[#C1C1C1]"
          disabled={isCommandExecuting}
        />
        {isCommandExecuting && <div className="absolute right-10 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-[#0071E3] border-t-transparent animate-spin" />}
      </div>

      <CommandList className="max-h-[360px] bg-[#F5F5F7]/50 p-6">
        <CommandEmpty className="px-4 py-6 text-left text-xs font-semibold text-[#86868B]">
          {t('commandPalette.intentSuggestions')}
        </CommandEmpty>

        <CommandGroup heading={t('commandPalette.intentSuggestions')}>
          {suggestions.map((suggestion) => (
            <CommandItem
              key={suggestion}
              value={suggestion}
              onSelect={() => setCommandInput(suggestion)}
              className="rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-[#86868B] shadow-sm data-[selected=true]:border-[#0071E3]/30 data-[selected=true]:bg-white data-[selected=true]:text-[#0071E3]"
            >
              {suggestion}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup>
          <CommandItem
            value={t('commandPalette.inputPlaceholder')}
            onSelect={() => {
              if (canExecute) {
                void executeCommand(commandInput)
              }
            }}
            disabled={!canExecute}
            className="mt-4 rounded-2xl bg-[#0071E3] px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-white data-[selected=true]:bg-[#0063cb] data-[disabled=true]:opacity-40"
          >
            {isCommandExecuting ? tr('Synthesizing Link...') : tr('Initiate Handshake')}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export default CommandPalette
