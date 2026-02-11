import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisVertical, Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Severity = 'Critical' | 'Warning' | 'Info'

type AlertHistoryRow = {
  severity: Severity
  agent: string
  metric: string
  message: string
  value: string
  threshold: string
  time: string
}

const ALERT_ROWS: AlertHistoryRow[] = [
  {
    severity: 'Critical',
    agent: 'Agent-01',
    metric: 'CPU Load Average',
    message: 'CPU usage exceeded 90% for > 5 mins',
    value: '95%',
    threshold: '90%',
    time: '2 mins ago',
  },
  {
    severity: 'Warning',
    agent: 'Agent-04',
    metric: 'Disk Space (root)',
    message: 'Free space below 10GB on /volume1',
    value: '8GB',
    threshold: '10GB',
    time: '12 mins ago',
  },
  {
    severity: 'Info',
    agent: 'Agent-02',
    metric: 'Cert Renewal',
    message: 'SSL Certificate auto-renewed successfully',
    value: 'N/A',
    threshold: '',
    time: '1 hr ago',
  },
  {
    severity: 'Critical',
    agent: 'Database-01',
    metric: 'Connection Pool',
    message: 'Connection pool exhaustion detected',
    value: '100%',
    threshold: '85%',
    time: '3 hrs ago',
  },
  {
    severity: 'Info',
    agent: 'Agent-12',
    metric: 'System Update',
    message: 'Kernel patch applied successfully, restart pending',
    value: 'N/A',
    threshold: '',
    time: '5 hrs ago',
  },
  {
    severity: 'Warning',
    agent: 'Agent-07',
    metric: 'Memory Usage',
    message: 'High memory consumption detected in container',
    value: '88%',
    threshold: '85%',
    time: 'Yesterday',
  },
  {
    severity: 'Info',
    agent: 'Agent-03',
    metric: 'Backup Status',
    message: 'Daily snapshot created successfully',
    value: 'N/A',
    threshold: '',
    time: 'Yesterday',
  },
]

function getSeverityPillClass(severity: Severity): string {
  if (severity === 'Critical') {
    return 'border border-red-200 bg-red-100 text-red-800'
  }

  if (severity === 'Warning') {
    return 'border border-orange-200 bg-orange-100 text-orange-800'
  }

  return 'border border-blue-200 bg-blue-50 text-blue-700'
}

function getSeverityDotClass(severity: Severity): string {
  if (severity === 'Critical') {
    return 'bg-red-500'
  }

  if (severity === 'Warning') {
    return 'bg-orange-500'
  }

  return 'bg-blue-500'
}

function getValueClass(severity: Severity, value: string): string {
  if (value === 'N/A') {
    return 'text-slate-400'
  }

  if (severity === 'Critical') {
    return 'font-bold text-red-600'
  }

  if (severity === 'Warning') {
    return 'font-bold text-orange-600'
  }

  return 'text-slate-700'
}

export function AlertHistoryLogPanel() {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
      <div className="flex flex-wrap items-end gap-4 border-b border-[#e5e7eb] p-4">
        <div className="flex w-64 flex-col gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[20px] text-slate-400" />
            <Input
              type="text"
              placeholder="Search Agent ID, Metric..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0073e6] focus:ring-2 focus:ring-[#0073e6]/20"
            />
          </div>
        </div>

        <div className="flex w-48 flex-col gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Severity</Label>
          <Select defaultValue="all">
            <SelectTrigger className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-8 text-sm text-slate-900 outline-none transition-all focus:border-[#0073e6] focus:ring-2 focus:ring-[#0073e6]/20">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-56 flex-col gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Time Range</Label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400" />
            <Select defaultValue="24h">
              <SelectTrigger className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm text-slate-900 outline-none transition-all focus:border-[#0073e6] focus:ring-2 focus:ring-[#0073e6]/20">
                <SelectValue placeholder="Last 24 Hours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1" />

        <Button
          type="button"
          className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          Clear filters
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full border-collapse text-left">
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-32 whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Severity
              </TableHead>
              <TableHead className="w-40 whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Agent
              </TableHead>
              <TableHead className="w-48 whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Metric
              </TableHead>
              <TableHead className="whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Message
              </TableHead>
              <TableHead className="w-40 whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Value / Threshold
              </TableHead>
              <TableHead className="w-40 whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Time
              </TableHead>
              <TableHead className="w-12 whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500" />
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-[#e5e7eb] bg-white">
            {ALERT_ROWS.map((row, index) => (
              <TableRow key={`${row.agent}-${row.metric}-${index}`} className="group transition-colors hover:bg-slate-50">
                <TableCell className="align-middle px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSeverityPillClass(row.severity)}`}>
                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${getSeverityDotClass(row.severity)}`} />
                    {row.severity}
                  </span>
                </TableCell>

                <TableCell className="align-middle px-4 py-3 font-mono text-sm font-medium text-slate-900">{row.agent}</TableCell>

                <TableCell className="align-middle px-4 py-3 text-sm text-slate-600">{row.metric}</TableCell>

                <TableCell className="max-w-xs truncate align-middle px-4 py-3 text-sm text-slate-600" title={row.message}>
                  {row.message}
                </TableCell>

                <TableCell className="align-middle px-4 py-3 text-right font-mono text-sm text-slate-700">
                  <span className={getValueClass(row.severity, row.value)}>{row.value}</span>
                  {row.threshold ? (
                    <>
                      <span className="mx-1 text-slate-400">/</span>
                      {row.threshold}
                    </>
                  ) : null}
                </TableCell>

                <TableCell className="whitespace-nowrap align-middle px-4 py-3 text-right text-sm text-slate-500">{row.time}</TableCell>

                <TableCell className="align-middle px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-md p-1 text-slate-400 opacity-0 transition-opacity hover:text-[#0073e6] group-hover:opacity-100"
                      >
                        <EllipsisVertical className="text-[20px]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem>View details</DropdownMenuItem>
                      <DropdownMenuItem>Acknowledge</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 focus:text-red-700">Silence</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between rounded-b-xl border-t border-[#e5e7eb] bg-white p-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Rows per page:</span>
          <Select defaultValue="10">
            <SelectTrigger className="h-8 w-20 cursor-pointer rounded border-none bg-slate-50 px-2 py-1 text-sm font-medium text-slate-700 focus:ring-0">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-500">Page 1 of 12</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              <ChevronLeft />
            </Button>

            <Button
              type="button"
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AlertHistoryLog() {
  return (
    <div className="flex flex-col gap-6 pt-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Alert History</h2>
          <p className="text-sm text-slate-500">Monitor infrastructure health and view historical alert logs.</p>
        </div>

        <Button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <Download className="text-[20px]" />
          Export CSV
        </Button>
      </div>

      <AlertHistoryLogPanel />
    </div>
  )
}
