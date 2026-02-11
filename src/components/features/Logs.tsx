'use client'

import { useState, useEffect, useRef, memo, useMemo } from 'react'
import type { LogEntry } from '@/lib/types'
import { generateLiveLog } from '@/actions/ai'
import { BarChart } from 'recharts/lib/chart/BarChart'
import { Bar } from 'recharts/lib/cartesian/Bar'
import { ResponsiveContainer } from 'recharts/lib/component/ResponsiveContainer'
import { useI18n } from '@/contexts/I18nContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BrainCircuit,
  ChartColumn,
  History,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react'

interface LogsProps {
  logs: LogEntry[]
  onAnalyze: () => void
  logAnalysis: string | null
  isAnalyzing: boolean
  onClear?: () => void
}

const HISTOGRAM_DATA = Array.from({ length: 15 }, (_, index) => ({
  time: index,
  errors: (index * 3 + 1) % 4,
  warnings: (index * 5 + 2) % 8,
}))

const Logs: React.FC<LogsProps> = ({
  logs,
  onAnalyze,
  logAnalysis,
  isAnalyzing,
  onClear,
}) => {
  const { tr } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [isLiveTrace, setIsLiveTrace] = useState(false)
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const isPollingRef = useRef(false)
  const pollingTimeoutRef = useRef<number | null>(null)
  const liveLogCounterRef = useRef(0)

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  const allLogs = useMemo(
    () =>
      [...liveLogs, ...logs].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [liveLogs, logs],
  )

  const filteredLogs = useMemo(() => {
    if (!normalizedSearchTerm) {
      return allLogs
    }

    return allLogs.filter((log) => {
      return (
        log.message.toLowerCase().includes(normalizedSearchTerm) ||
        log.category.toLowerCase().includes(normalizedSearchTerm)
      )
    })
  }, [allLogs, normalizedSearchTerm])

  useEffect(() => {
    if (!isLiveTrace) {
      if (pollingTimeoutRef.current !== null) {
        window.clearTimeout(pollingTimeoutRef.current)
        pollingTimeoutRef.current = null
      }

      isPollingRef.current = false
      return
    }

    let cancelled = false

    const pollLiveLog = async () => {
      if (cancelled || isPollingRef.current) {
        return
      }

      isPollingRef.current = true

      try {
        const entry = await generateLiveLog()

        if (entry && entry.message) {
          const level =
            entry.level === 'info' ||
            entry.level === 'warn' ||
            entry.level === 'error'
              ? entry.level
              : 'info'
          const category =
            entry.category === 'system' ||
            entry.category === 'auth' ||
            entry.category === 'agent' ||
            entry.category === 'cert'
              ? entry.category
              : 'system'
          liveLogCounterRef.current += 1

          const newLog: LogEntry = {
            id: `ag_${Date.now()}_${liveLogCounterRef.current}`,
            timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
            level,
            category,
            message: entry.message,
          }

          setLiveLogs((prev) => [newLog, ...prev].slice(0, 100))
        }
      } catch {
        console.error(tr('Trace interrupted.'))
      } finally {
        isPollingRef.current = false

        if (!cancelled) {
          pollingTimeoutRef.current = window.setTimeout(() => {
            void pollLiveLog()
          }, 2500)
        }
      }
    }

    void pollLiveLog()

    return () => {
      cancelled = true

      if (pollingTimeoutRef.current !== null) {
        window.clearTimeout(pollingTimeoutRef.current)
        pollingTimeoutRef.current = null
      }

      isPollingRef.current = false
    }
  }, [isLiveTrace, tr])

  useEffect(() => {
    if (!scrollRef.current || !isLiveTrace) {
      return
    }

    scrollRef.current.scrollTop = 0
  }, [liveLogs, isLiveTrace])

  return (
    <div className="space-y-10 animate-fade-in h-full flex flex-col pb-16">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-3">
          <h2 className="text-5xl font-black text-text-main tracking-tighter uppercase">
            {tr('Audit Stream')}
          </h2>
          <p className="text-secondary text-base font-medium">
            {tr(
              'Distributed cluster observability, neural security logging, and principal access tracking.',
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative group">
            <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-[22px] group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder={tr('Grep telemetry stream...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white border border-border rounded-2xl text-sm w-72 shadow-soft focus:ring-8 focus:ring-primary/5 transition-all outline-none font-bold"
            />
          </div>
          <Button
            onClick={() => setIsLiveTrace(!isLiveTrace)}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${isLiveTrace ? 'bg-danger text-white border-danger shadow-2xl shadow-danger/30' : 'bg-white text-secondary border-border hover:bg-gray-50 shadow-soft'}`}
          >
            {isLiveTrace ? (
              <PauseCircle className="text-[22px] animate-pulse" />
            ) : (
              <PlayCircle className="text-[22px]" />
            )}
            {isLiveTrace ? tr('Interrupt Trace') : tr('Neural Live-Trace')}
          </Button>
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-3 px-10 py-3.5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-3xl shadow-primary/30 hover:bg-primary-hover active:scale-95 disabled:opacity-70 transition-all"
          >
            <Sparkles
              className={`text-[22px] ${isAnalyzing ? 'animate-spin' : ''}`}
            />
            {isAnalyzing ? tr('Processing...') : tr('Neural Synthesis')}
          </Button>
        </div>
      </div>

      <div className="bg-white p-12 rounded-[3.5rem] border border-border shadow-soft relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-105 transition-transform">
          <ChartColumn className="text-[150px] text-indigo-500" />
        </div>
        <div className="flex items-center justify-between mb-10 relative z-10">
          <span className="text-[11px] font-black text-secondary uppercase tracking-[0.4em]">
            {tr('Cluster Incident Gradient')}
          </span>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-danger shadow-lg shadow-danger/30"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-60">
                {tr('Critical Payload')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-warning shadow-lg shadow-warning/30"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-60">
                {tr('Anomalous Drift')}
              </span>
            </div>
          </div>
        </div>
        <div className="h-28 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={HISTOGRAM_DATA}>
              <Bar dataKey="errors" fill="#FF3B30" radius={[6, 6, 0, 0]} />
              <Bar dataKey="warnings" fill="#FF9F0A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {logAnalysis && (
        <div className="bg-[#0F172A] text-white rounded-[3.5rem] p-16 shadow-3xl animate-fade-in-up border border-white/5 relative overflow-hidden shrink-0 group">
          <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
            <BrainCircuit className="text-[200px] text-white" />
          </div>
          <div className="flex items-center gap-6 mb-12 relative z-10">
            <div className="w-16 h-16 bg-indigo-500/10 border border-white/10 text-indigo-300 rounded-[1.75rem] flex items-center justify-center shadow-inner group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <ShieldCheck className="text-[32px]" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tighter uppercase text-indigo-300 leading-none">
                {tr('Neural Pattern Detection')}
              </h3>
              <p className="text-indigo-500 text-[11px] font-black uppercase mt-3 tracking-widest">
                {tr('Global Cross-Log Correlation Logic Active')}
              </p>
            </div>
          </div>
          <div className="relative z-10 text-[15px] text-indigo-100/80 leading-[2.2] font-medium whitespace-pre-wrap font-sans max-w-5xl prose prose-invert">
            {logAnalysis}
          </div>
          <Button
            onClick={onClear}
            className="absolute top-16 right-16 text-white/20 hover:text-white transition-colors"
          >
            <X className="text-[32px]" />
          </Button>
        </div>
      )}

      <div className="flex-1 bg-white rounded-[3.5rem] border border-border shadow-soft overflow-hidden flex flex-col font-mono text-[12px] min-h-0 ring-1 ring-black/5">
        <div className="bg-[#FBFBFD] px-12 py-7 border-b border-border grid grid-cols-12 gap-8 text-secondary font-black uppercase tracking-[0.2em] sticky top-0 z-10 shadow-sm">
          <div className="col-span-3 lg:col-span-2">
            {tr('Telemetry Index')}
          </div>
          <div className="col-span-2 lg:col-span-1">{tr('State')}</div>
          <div className="col-span-2 lg:col-span-1 text-center">
            {tr('Identity')}
          </div>
          <div className="col-span-5 lg:col-span-8">
            {tr('High-Fidelity Payload')}
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto divide-y divide-border custom-scrollbar"
        >
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`px-12 py-6 grid grid-cols-12 gap-8 hover:bg-gray-50/50 transition-all items-center ${log.id.startsWith('ag_') ? 'bg-indigo-50/10' : ''}`}
              >
                <div className="col-span-3 lg:col-span-2 text-secondary font-bold tracking-tight opacity-50">
                  {log.timestamp}
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border-2 tracking-widest flex items-center justify-center gap-2 ${
                      log.level === 'error'
                        ? 'bg-red-50 text-danger border-red-100'
                        : log.level === 'warn'
                          ? 'bg-orange-50 text-warning border-orange-100'
                          : 'bg-blue-50 text-primary border-blue-100'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${log.level === 'error' ? 'bg-danger' : log.level === 'warn' ? 'bg-warning' : 'bg-primary'}`}
                    ></span>
                    {tr(log.level)}
                  </span>
                </div>
                <div className="col-span-2 lg:col-span-1 text-center font-black uppercase tracking-[0.3em] text-secondary opacity-40">
                  {log.category}
                </div>
                <div
                  className="col-span-5 lg:col-span-8 text-text-main truncate font-bold tracking-tight group relative"
                  title={log.message}
                >
                  {log.id.startsWith('ag_') && (
                    <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse mr-4 shadow-lg shadow-primary/40"></span>
                  )}
                  <span className="selection:bg-primary/20">{log.message}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-40 opacity-20 text-center space-y-8 grayscale">
              <History className="text-[100px]" />
              <p className="text-[14px] font-black uppercase tracking-[0.6em] leading-loose">
                {tr('No Telemetry Drift Identified in Selected Buffer')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Logs
