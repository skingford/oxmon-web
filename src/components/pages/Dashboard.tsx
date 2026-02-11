'use client'

import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CloudCheck,
  Info,
  Rocket,
  Timer,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DashboardStatCard {
  id: string
  title: string
  value: string
  icon: LucideIcon
  iconWrapClass: string
  valueSuffix?: string
  detail?: string
  footer:
    | {
      type: 'progress'
      label: string
      value: string
      progress: number
    }
    | {
      type: 'badge'
      icon: LucideIcon
      text: string
      className: string
    }
    | {
      type: 'text'
      text: string
    }
}

type AlertSeverity = 'Critical' | 'Warning' | 'Info'

interface AlertItem {
  id: string
  severity: AlertSeverity
  source: string
  message: string
  time: string
}

const STATIC_ALERTS: AlertItem[] = [
  {
    id: 'critical-web-01',
    severity: 'Critical',
    source: 'web-01',
    message: 'High CPU usage detected (92%) - Exceeds threshold > 90%',
    time: '2 mins ago',
  },
  {
    id: 'warning-db-01',
    severity: 'Warning',
    source: 'db-01',
    message: 'Memory usage is high (78%) - Monitoring required',
    time: '15 mins ago',
  },
  {
    id: 'info-web-02',
    severity: 'Info',
    source: 'web-02',
    message: 'Scheduled disk cleanup completed successfully',
    time: '1 hr ago',
  },
]

const DASHBOARD_STATS: DashboardStatCard[] = [
  {
    id: 'online-rate',
    title: 'Agent Online Rate',
    value: '3/5',
    detail: '(60%)',
    icon: CloudCheck,
    iconWrapClass: 'bg-blue-50 text-[#0073e6]',
    footer: {
      type: 'progress',
      label: 'Progress',
      value: '60%',
      progress: 60,
    },
  },
  {
    id: 'service-version',
    title: 'Service Version',
    value: 'v0.1.0',
    icon: Rocket,
    iconWrapClass: 'bg-purple-50 text-purple-600',
    footer: {
      type: 'badge',
      icon: CheckCircle2,
      text: 'Up to date',
      className: 'text-green-700 bg-green-50 border-green-100',
    },
  },
  {
    id: 'system-uptime',
    title: 'System Uptime',
    value: '3',
    valueSuffix: 'Days',
    icon: Timer,
    iconWrapClass: 'bg-green-50 text-green-600',
    footer: {
      type: 'text',
      text: 'Since last maintenance',
    },
  },
]

function getSeverityClass(severity: AlertSeverity) {
  if (severity === 'Critical') {
    return 'bg-red-50 text-red-700 border-red-100'
  }

  if (severity === 'Warning') {
    return 'bg-orange-50 text-orange-700 border-orange-100'
  }

  return 'bg-blue-50 text-blue-700 border-blue-100'
}

function getSeverityIcon(severity: AlertSeverity) {
  if (severity === 'Critical') {
    return CircleAlert
  }

  if (severity === 'Warning') {
    return TriangleAlert
  }

  return Info
}

export default function Dashboard() {
  const { tr } = useI18n()

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-1">{tr('Welcome back, Administrator')}</h3>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {DASHBOARD_STATS.map((stat) => {
          const StatIcon = stat.icon
          const FooterIcon = stat.footer.type === 'badge' ? stat.footer.icon : null

          return (
            <Card key={stat.id} className="h-40 justify-between gap-0 border-[#E5E5EA] shadow-card">
              <CardHeader className="pt-6">
                <CardTitle className="text-sm font-medium text-slate-500">{tr(stat.title)}</CardTitle>
                <CardDescription className="mt-2 text-3xl font-bold text-slate-900">
                  {stat.value}
                  {stat.valueSuffix ? ` ${tr(stat.valueSuffix)}` : null}
                  {stat.detail ? <span className="text-lg font-medium text-slate-400"> {stat.detail}</span> : null}
                </CardDescription>
                <CardAction>
                  <div className={`rounded-lg p-2 ${stat.iconWrapClass}`}>
                    <StatIcon className="size-5" />
                  </div>
                </CardAction>
              </CardHeader>

              <CardContent>
                {stat.footer.type === 'progress' ? (
                  <div className="w-full space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>{tr(stat.footer.label)}</span>
                      <span>{stat.footer.value}</span>
                    </div>
                    <Progress value={stat.footer.progress} />
                  </div>
                ) : null}

                {stat.footer.type === 'badge' ? (
                  <Badge variant="outline" className={`gap-1.5 ${stat.footer.className}`}>
                    {FooterIcon ? <FooterIcon className="size-3.5" /> : null}
                    <span>{tr(stat.footer.text)}</span>
                  </Badge>
                ) : null}

                {stat.footer.type === 'text' ? (
                  <p className="text-sm text-slate-500">{tr(stat.footer.text)}</p>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{tr('Recent Alerts')}</h3>
          <Button variant="link" size="sm" className="h-auto px-0 py-0 text-sm font-medium text-[#0073e6]">
            <span>{tr('View all alerts')}</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <Card className="overflow-hidden border-[#E5E5EA] shadow-card">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-slate-50">
                <TableHead className="w-[140px]">{tr('Severity')}</TableHead>
                <TableHead className="w-[140px]">{tr('Source')}</TableHead>
                <TableHead>{tr('Message')}</TableHead>
                <TableHead className="text-right">{tr('Time')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STATIC_ALERTS.map((alert) => {
                const SeverityIcon = getSeverityIcon(alert.severity)

                return (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1.5 ${getSeverityClass(alert.severity)}`}>
                        <SeverityIcon className="size-3.5" />
                        {tr(alert.severity)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">{alert.source}</TableCell>
                    <TableCell className="text-slate-600">{tr(alert.message)}</TableCell>
                    <TableCell className="text-right text-xs font-medium text-slate-400">{tr(alert.time)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      </section>

      <footer className="pt-6 mt-8 border-t border-[#E5E5EA] text-center text-xs text-slate-400">
        <p>© 2023 Oxmon Inc. Infrastructure Monitoring Dashboard.</p>
      </footer>
    </div>
  )
}
