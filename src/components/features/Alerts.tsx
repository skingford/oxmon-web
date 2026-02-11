'use client'

import { useDeferredValue, useMemo, useState, memo } from 'react'
import type { Alert } from '@/lib/types'
import { AreaChart } from 'recharts/lib/chart/AreaChart'
import { Area } from 'recharts/lib/cartesian/Area'
import { ResponsiveContainer } from 'recharts/lib/component/ResponsiveContainer'
import { useI18n } from '@/contexts/I18nContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Brain,
  BrainCircuit,
  CircleAlert,
  CloudCheck,
  Search,
  Sparkles,
  Terminal,
  TriangleAlert,
  X,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface AlertsProps {
  alerts: Alert[]
  onAcknowledge: (id: string) => void
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void
  onDiagnose: (alert: Alert) => Promise<string | undefined>
  onRunScript?: (agentName: string, command: string) => void
}

const ACTIVITY_DATA = Array.from({ length: 30 }, (_, index) => ({
  time: index,
  val: index > 10 && index < 20 ? (index * 7 + 3) % 15 : (index * 3 + 1) % 5,
}))

const Alerts: React.FC<AlertsProps> = ({
  alerts,
  onAcknowledge,
  onShowToast,
  onDiagnose,
  onRunScript,
}) => {
  const { tr } = useI18n()
  const [filter, setFilter] = useState<
    'All' | 'Critical' | 'Warning' | 'Info' | 'Resolved'
  >('All')
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const [detailAlert, setDetailAlert] = useState<Alert | null>(null)
  const [diagnosingId, setDiagnosingId] = useState<string | null>(null)
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null)

  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase()

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesFilter = filter === 'All' ? true : alert.severity === filter
      if (!matchesFilter) {
        return false
      }

      if (!normalizedSearchTerm) {
        return true
      }

      return (
        alert.source.toLowerCase().includes(normalizedSearchTerm) ||
        alert.message.toLowerCase().includes(normalizedSearchTerm)
      )
    })
  }, [alerts, filter, normalizedSearchTerm])

  const handleDiagnose = async (alert: Alert) => {
    setDiagnosingId(alert.id)
    setDiagnosticResult(null)
    const result = await onDiagnose(alert)
    setDiagnosticResult(result || tr('Diagnostic handshake failed.'))
    setDiagnosingId(null)
  }

  const extractCommand = (text: string) => {
    const match = text.match(/```(?:bash|sh|shell)?\s*([\s\S]*?)```/)
    return match ? match[1].trim() : null
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-3">
          <h2 className="text-5xl font-black text-text-main tracking-tighter uppercase">
            {tr('Incident War Room')}
          </h2>
          <p className="text-secondary text-base font-medium">
            {tr(
              'Real-time anomaly detection, correlation engine, and neural root-cause diagnostics.',
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-[22px] group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder={tr('Grep incident payload...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white border border-border rounded-2xl text-sm w-72 shadow-soft focus:ring-8 focus:ring-primary/5 transition-all outline-none font-bold"
            />
          </div>
          <div className="flex gap-1.5 bg-[#F5F5F7] p-1.5 rounded-[1.5rem] border border-[#E5E5EA] shadow-inner">
            {['All', 'Critical', 'Warning'].map((l) => (
              <Button
                key={l}
                onClick={() => setFilter(l as any)}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === l ? 'bg-white shadow-soft text-primary' : 'text-secondary hover:text-text-main'}`}
              >
                {tr(l)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-12 rounded-[3.5rem] border border-border shadow-soft relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
              <Activity className="text-[150px] text-danger" />
            </div>
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-black text-secondary uppercase tracking-[0.4em]">
                  {tr('24H Activity Pulse')}
                </span>
                <div className="flex items-center gap-2 px-3 py-1 bg-success/5 border border-success/10 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                  <span className="text-[9px] font-black text-success uppercase tracking-widest">
                    {tr('Normal Gradient')}
                  </span>
                </div>
              </div>
            </div>
            <div className="h-40 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ACTIVITY_DATA}>
                  <defs>
                    <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF3B30" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FF3B30" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="#FF3B30"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorPulse)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setDetailAlert(alert)}
                  className="group bg-white p-10 rounded-[2.5rem] border border-border shadow-soft flex items-center gap-8 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div
                    className={`w-16 h-16 rounded-[1.75rem] shrink-0 flex items-center justify-center border-2 transition-all ${
                      alert.severity === 'Critical'
                        ? 'bg-red-50 text-danger border-red-100 shadow-2xl shadow-danger/10'
                        : alert.severity === 'Warning'
                          ? 'bg-orange-50 text-warning border-orange-100'
                          : 'bg-blue-50 text-primary border-blue-100'
                    }`}
                  >
                    {alert.severity === 'Critical' ? (
                      <CircleAlert className="text-[32px] animate-pulse" />
                    ) : (
                      <TriangleAlert className="text-[32px]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-[11px] font-black uppercase tracking-[0.25em] text-secondary font-mono opacity-60 truncate">
                        {alert.source}
                      </span>
                      <span className="text-[11px] text-secondary/30 tracking-widest">
                        •
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-widest text-secondary/60">
                        {alert.time}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-text-main truncate group-hover:text-primary transition-colors tracking-tight leading-none">
                      {alert.message}
                    </h4>
                  </div>
                  <div className="flex items-center gap-4">
                    {alert.severity === 'Critical' && (
                      <div className="hidden sm:flex px-5 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl shadow-primary/30 group-hover:scale-105 transition-transform">
                        {tr('Analyze')}
                      </div>
                    )}
                    <ArrowRight className="text-gray-200 group-hover:text-primary transition-all group-hover:translate-x-2" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-32 bg-white rounded-[3.5rem] border-4 border-dashed border-gray-50 flex flex-col items-center justify-center space-y-8 opacity-40">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                  <CloudCheck className="text-5xl" />
                </div>
                <p className="text-[12px] font-black text-secondary uppercase tracking-[0.4em]">
                  {tr('No active incidents in this domain.')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="p-12 bg-[#0F172A] rounded-[3.5rem] shadow-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
              <BrainCircuit className="text-[180px] text-white" />
            </div>
            <div className="flex items-center gap-5 mb-10 relative z-10">
              <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
                <Brain className="text-[32px]" />
              </div>
              <h3 className="text-white font-black text-sm uppercase tracking-[0.3em]">
                {tr('Neural Triage')}
              </h3>
            </div>
            <p className="text-indigo-100/60 text-sm leading-loose font-medium mb-12 relative z-10">
              {tr(
                'Correlate global telemetry stream to identify silent systemic failures and cross-node impact profiles.',
              )}
            </p>
            <Button
              onClick={() =>
                onShowToast(
                  tr('Synthesizing cluster-wide triage audit...'),
                  'info',
                )
              }
              className="w-full py-5 bg-white/5 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all border border-white/10 relative z-10 shadow-inner"
            >
              {tr('Initiate Handshake')}
            </Button>
          </div>

          <div className="bg-white rounded-[3.5rem] border border-border p-12 shadow-soft flex flex-col items-center text-center space-y-6 group">
            <div className="w-24 h-24 bg-success/5 text-success rounded-full flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <BadgeCheck className="text-5xl" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black uppercase tracking-tighter text-text-main">
                {tr('Global Heartbeat Active')}
              </h4>
              <p className="text-sm text-secondary font-medium leading-relaxed">
                {tr(
                  '99.98% of infrastructure endpoints are reporting healthy telemetry. No critical drift detected.',
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Sheet
        open={detailAlert !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailAlert(null)
            setDiagnosticResult(null)
          }
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="h-full w-full max-w-2xl overflow-hidden border-l border-border bg-white p-16 sm:max-w-2xl"
        >
          {detailAlert && (
            <>
              <SheetHeader className="sr-only">
                <SheetTitle>{tr('Incident Focus')}</SheetTitle>
                <SheetDescription>
                  {detailAlert.source} • {detailAlert.time}
                </SheetDescription>
              </SheetHeader>

              <div className="flex h-full flex-col overflow-hidden">
                <div className="mb-16 flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-16 h-16 rounded-[2rem] flex items-center justify-center font-black text-2xl shadow-2xl transition-transform hover:scale-110 ${detailAlert.severity === 'Critical' ? 'bg-red-50 text-danger shadow-red-500/10' : 'bg-orange-50 text-warning shadow-orange-500/10'}`}
                    >
                      !
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">
                        {tr('Incident Focus')}
                      </h3>
                      <p className="text-[11px] font-black text-secondary uppercase tracking-[0.4em] mt-3">
                        {detailAlert.source} • {detailAlert.time}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setDetailAlert(null)
                      setDiagnosticResult(null)
                    }}
                    className="w-12 h-12 flex items-center justify-center text-secondary hover:text-text-main bg-gray-50 rounded-2xl transition-all"
                  >
                    <X />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-14 pr-4 custom-scrollbar">
                  <div className="p-12 bg-gray-50/50 rounded-[3rem] border border-border shadow-inner group">
                    <p className="text-[11px] uppercase font-black text-secondary mb-6 tracking-[0.5em] opacity-40">
                      {tr('Telemetry Payload')}
                    </p>
                    <p className="text-xl font-bold text-indigo-950 leading-relaxed tracking-tight">
                      {detailAlert.message}
                    </p>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[11px] uppercase font-black text-secondary tracking-[0.5em]">
                        {tr('Neural Root-Cause Analysis')}
                      </h5>
                      {!diagnosticResult && (
                        <Button
                          type="button"
                          onClick={() => handleDiagnose(detailAlert)}
                          disabled={diagnosingId === detailAlert.id}
                          className="text-[11px] font-black text-primary flex items-center gap-3 uppercase tracking-widest disabled:opacity-50 group/btn"
                        >
                          <Sparkles
                            className={`text-[20px] ${diagnosingId === detailAlert.id ? 'animate-spin' : ''}`}
                          />
                          {diagnosingId === detailAlert.id
                            ? tr('Synthesizing...')
                            : tr('Launch Diagnostics')}
                        </Button>
                      )}
                    </div>

                    {diagnosticResult ? (
                      <div className="space-y-10 animate-fade-in-up">
                        <div className="bg-[#0F172A] border border-white/5 rounded-[3rem] p-12 relative overflow-hidden shadow-3xl group">
                          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                            <BrainCircuit className="text-[120px] text-white" />
                          </div>
                          <div className="relative z-10 text-[15px] text-indigo-100/90 font-medium leading-[2.2] prose prose-invert max-w-none">
                            {diagnosticResult}
                          </div>
                        </div>
                        <div className="flex gap-5">
                          {extractCommand(diagnosticResult) && (
                            <Button
                              type="button"
                              onClick={() =>
                                onRunScript?.(
                                  detailAlert.source,
                                  extractCommand(diagnosticResult)!,
                                )
                              }
                              className="flex-1 py-6 bg-primary text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-primary-hover shadow-3xl shadow-primary/40 transition-all flex items-center justify-center gap-4 active:scale-95"
                            >
                              <Terminal className="text-[24px]" />
                              {tr('Execute Remediation')}
                            </Button>
                          )}
                          <Button
                            type="button"
                            onClick={() => {
                              onAcknowledge(detailAlert.id)
                              setDetailAlert(null)
                            }}
                            className="flex-1 py-6 border border-border rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] text-text-main hover:bg-gray-50 transition-all active:scale-95 shadow-soft"
                          >
                            {tr('Resolve Principal')}
                          </Button>
                        </div>
                      </div>
                    ) : diagnosingId === detailAlert.id ? (
                      <div className="space-y-6 animate-pulse">
                        <div className="h-6 bg-gray-50 rounded-full w-full"></div>
                        <div className="h-6 bg-gray-50 rounded-full w-[90%]"></div>
                        <div className="h-6 bg-gray-50 rounded-full w-[70%]"></div>
                      </div>
                    ) : (
                      <div className="p-20 border-4 border-dashed border-gray-50 rounded-[3.5rem] text-center space-y-8 group hover:border-primary/20 transition-all">
                        <div className="w-16 h-16 bg-gray-50 rounded-full mx-auto flex items-center justify-center text-gray-300 group-hover:text-primary transition-colors">
                          <Brain className="text-4xl" />
                        </div>
                        <p className="text-[11px] font-black text-secondary uppercase tracking-[0.5em] leading-[2.5]">
                          {tr('Initiate neural handshake for')}
                          <br />
                          {tr('automated remediation forecast')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default Alerts
