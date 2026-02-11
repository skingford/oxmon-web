'use client'

import { useEffect, useState } from 'react'
import { AlertHistoryLogPanel } from '@/components/features/AlertHistoryLog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Bell,
  ChevronDown,
  Download,
  EllipsisVertical,
  Grid2x2,
  History,
  ListFilter,
  Plus,
  Search,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

type RuleSeverity = 'Critical' | 'Warning' | 'Info'

type AlertRule = {
  name: string
  hint: string
  type: string
  metric: string
  agentMatch: string
  severity: RuleSeverity
  enabled: boolean
}

type AlertViewTab = 'rules' | 'history'

type AlertRulesConfigurationTabProps = {
  initialTab?: AlertViewTab
}

const ALERT_RULE_ROWS: AlertRule[] = [
  {
    name: 'High CPU Load',
    hint: '> 90% for 5m',
    type: 'Threshold',
    metric: 'cpu.usage_idle',
    agentMatch: 'prod-db-*',
    severity: 'Critical',
    enabled: true,
  },
  {
    name: 'Disk Space Low',
    hint: 'Free space < 10%',
    type: 'Prediction',
    metric: 'disk.free',
    agentMatch: '*-web-*',
    severity: 'Warning',
    enabled: true,
  },
  {
    name: 'Agent Offline',
    hint: 'No ping > 2m',
    type: 'Availability',
    metric: 'agent.ping',
    agentMatch: '*',
    severity: 'Info',
    enabled: false,
  },
  {
    name: 'Memory Spike',
    hint: 'Sudden increase > 20%',
    type: 'Rate of Change',
    metric: 'mem.used',
    agentMatch: 'cache-*',
    severity: 'Warning',
    enabled: true,
  },
  {
    name: 'Network Latency',
    hint: '> 300ms',
    type: 'Threshold',
    metric: 'net.latency',
    agentMatch: 'lb-*',
    severity: 'Critical',
    enabled: true,
  },
]

function getSeverityBadgeClass(severity: RuleSeverity): string {
  if (severity === 'Critical') {
    return 'border border-red-100 bg-red-50 text-red-600'
  }

  if (severity === 'Warning') {
    return 'border border-amber-100 bg-amber-50 text-amber-600'
  }

  return 'border border-blue-100 bg-blue-50 text-blue-600'
}

function getSeverityDotClass(severity: RuleSeverity): string {
  if (severity === 'Critical') {
    return 'bg-red-500'
  }

  if (severity === 'Warning') {
    return 'bg-amber-500'
  }

  return 'bg-blue-500'
}

function ToggleSwitch({ checked }: { checked: boolean }) {
  return (
    <Switch
      checked={checked}
      className="h-6 w-10 bg-[#E5E5EA] data-[state=checked]:bg-[#34C759]"
      aria-label="Rule enabled"
    />
  )
}

function AlertRulesTable() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 py-1">
        <div className="relative max-w-md min-w-[280px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
          <Input
            type="text"
            placeholder="Search rules..."
            className="w-full rounded-lg border border-[#D2D2D7] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1D1D1F] placeholder:text-[#6E6E73] shadow-sm transition-shadow focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/50"
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-[#D2D2D7] bg-white px-4 py-2.5 text-sm font-medium text-[#1D1D1F] shadow-sm transition-colors hover:bg-gray-50"
          >
            <ListFilter className="text-[18px] text-[#6E6E73]" />
            <span>Severity</span>
            <ChevronDown className="text-[18px] text-[#6E6E73]" />
          </Button>

          <Button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-[#D2D2D7] bg-white px-4 py-2.5 text-sm font-medium text-[#1D1D1F] shadow-sm transition-colors hover:bg-gray-50"
          >
            <Grid2x2 className="text-[18px] text-[#6E6E73]" />
            <span>Type</span>
            <ChevronDown className="text-[18px] text-[#6E6E73]" />
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-transparent bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[900px]">
            <TableHeader className="border-b border-[#E5E5EA] bg-gray-50">
              <TableRow>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
                  Rule Name
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
                  Type
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
                  Metric
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
                  <span className="inline-block leading-[1.15]">
                    Agent
                    <br />
                    Match
                  </span>
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
                  Severity
                </TableHead>
                <TableHead className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
                  Status
                </TableHead>
                <TableHead className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-[#E5E5EA]">
              {ALERT_RULE_ROWS.map((rule, index) => (
                <TableRow
                  key={`${rule.name}-${index}`}
                  className="group transition-colors hover:bg-gray-50"
                >
                  <TableCell className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#1D1D1F]">
                        {rule.name}
                      </span>
                      <span className="mt-0.5 hidden text-xs text-[#6E6E73] transition-all group-hover:block">
                        {rule.hint}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {rule.type}
                    </span>
                  </TableCell>

                  <TableCell className="whitespace-nowrap px-6 py-4">
                    <code className="rounded border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs text-gray-600">
                      {rule.metric}
                    </code>
                  </TableCell>

                  <TableCell className="whitespace-nowrap px-6 py-4">
                    <code className="font-mono text-xs text-[#0071E3]">
                      {rule.agentMatch}
                    </code>
                  </TableCell>

                  <TableCell className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getSeverityBadgeClass(rule.severity)}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${getSeverityDotClass(rule.severity)}`}
                      />
                      {rule.severity}
                    </span>
                  </TableCell>

                  <TableCell className="whitespace-nowrap px-6 py-4 text-center">
                    <ToggleSwitch checked={rule.enabled} />
                  </TableCell>

                  <TableCell className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-md p-1 text-[#6E6E73] transition-colors hover:bg-gray-100 hover:text-[#0071E3]"
                        >
                          <EllipsisVertical className="text-[20px]" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-700">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t border-[#E5E5EA] bg-white px-6 py-4">
          <span className="text-sm text-[#6E6E73]">
            Showing <span className="font-medium text-[#1D1D1F]">1</span> to{' '}
            <span className="font-medium text-[#1D1D1F]">5</span> of{' '}
            <span className="font-medium text-[#1D1D1F]">12</span> results
          </span>

          <div className="flex gap-2">
            <Button
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg border border-[#E5E5EA] bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-400"
            >
              Previous
            </Button>

            <Button
              type="button"
              className="rounded-lg border border-[#E5E5EA] px-3 py-1.5 text-sm font-medium text-[#1D1D1F] transition-colors hover:bg-gray-50"
            >
              Next
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

export default function AlertRulesConfigurationTab({
  initialTab = 'rules',
}: AlertRulesConfigurationTabProps) {
  const [activeTab, setActiveTab] = useState<AlertViewTab>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const isHistoryTab = activeTab === 'history'

  return (
    <div className="flex flex-col gap-6 pt-6 animate-fade-in">
      <header className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-sm text-[#6E6E73]">
            {isHistoryTab ? (
              <History className="text-[18px]" />
            ) : (
              <Bell className="text-[18px]" />
            )}
            <span className="font-medium text-[#1D1D1F]">Alerts</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F] md:text-4xl">
            {isHistoryTab ? 'Alert History' : 'Alert Rules'}
          </h2>
          <p className="mt-1 max-w-2xl text-base text-[#6E6E73]">
            {isHistoryTab
              ? 'Monitor infrastructure health and review historical alert logs.'
              : 'Configure threshold and anomaly detection rules for your infrastructure.'}
          </p>
        </div>

        {isHistoryTab ? (
          <Button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Download className="text-[20px]" />
            Export CSV
          </Button>
        ) : (
          <Button
            type="button"
            className="group flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0071E3] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-600 active:scale-95"
          >
            <Plus className="text-[20px]" />
            <span>Create Rule</span>
          </Button>
        )}
      </header>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AlertViewTab)}>
        <div className="border-b border-[#E5E5EA]">
          <TabsList variant="line" className="h-auto gap-1 overflow-x-auto whitespace-nowrap bg-transparent p-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger
              value="rules"
              className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-[#6E6E73] transition-colors data-[state=active]:border-[#0071E3] data-[state=active]:text-[#0071E3]"
            >
              Alert Rules
            </TabsTrigger>

            <TabsTrigger
              value="history"
              className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-[#6E6E73] transition-colors data-[state=active]:border-[#0071E3] data-[state=active]:text-[#0071E3]"
            >
              Alert History
            </TabsTrigger>

            <Button
              type="button"
              className="cursor-not-allowed border-b-2 border-transparent px-4 py-3 text-sm font-medium text-[#9a9aa1]"
            >
              Notification Channels
            </Button>

            <Button
              type="button"
              className="cursor-not-allowed border-b-2 border-transparent px-4 py-3 text-sm font-medium text-[#9a9aa1]"
            >
              Silencing
            </Button>
          </TabsList>
        </div>

        <TabsContent value="rules" className="mt-0">
          <AlertRulesTable />
        </TabsContent>
        <TabsContent value="history" className="mt-0">
          <AlertHistoryLogPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
