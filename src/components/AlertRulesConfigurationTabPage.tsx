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

const SIDEBAR_LOGO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAtXHzQZC2XGF2GKt3mC3G6BrpJvDcpGB6BXHHUafKtWZgb1UkK_BgrERWC4ILeLyWQLWRuR5kEKaclpf35Mou-QyKw8rdSQJW5l0Wg7VWYhYnlPo-gTK5FQZ3QT7a4bjQVXFaPtTjNPUimX-fAMK4lEC4X9m2j0Gs74jj3-zvbi3XHS8CO06_sLhva266MLhnNmUd4LF20SFSXInZyRKFe2xGjLcvwhUfIilW-UWtt19jbgS05es8757ZiInHvQ9vn8UDvrIKQ-eU'

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
    return 'bg-red-50 text-red-600 border border-red-100'
  }

  if (severity === 'Warning') {
    return 'bg-amber-50 text-amber-600 border border-amber-100'
  }

  return 'bg-blue-50 text-blue-600 border border-blue-100'
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

function ToggleSwitch({ checked, id }: { checked: boolean; id: string }) {
  return (
    <div className="inline-block h-7 w-[3.25rem]">
      <input
        type="checkbox"
        id={id}
        readOnly
        checked={checked}
        className="peer sr-only"
      />
      <label
        htmlFor={id}
        className="relative block h-6 w-10 cursor-pointer rounded-full bg-[#E5E5EA] transition-colors peer-checked:bg-[#34C759]"
      >
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-transform peer-checked:translate-x-4" />
      </label>
    </div>
  )
}

export default function AlertRulesConfigurationTabPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F5F5F7] font-sans text-[#1D1D1F] antialiased">
      <aside className="hidden w-72 flex-col justify-between border-r border-[#E5E5EA] bg-white p-4 md:flex">
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 px-2 py-2">
            <div
              className="size-10 rounded-xl bg-cover bg-center bg-no-repeat shadow-sm"
              style={{ backgroundImage: `url(${SIDEBAR_LOGO_IMAGE})` }}
            />
            <div className="flex flex-col justify-center">
              <h1 className="text-base font-bold leading-none text-[#1D1D1F]">Oxmon</h1>
              <p className="mt-1 text-xs font-normal text-[#6E6E73]">Admin Console</p>
            </div>
          </div>

          <nav className="mt-4 flex flex-col gap-1">
            <a href="#" className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#6E6E73] transition-colors hover:bg-gray-100 hover:text-[#1D1D1F]">
              <span className="material-symbols-outlined text-[#6E6E73] transition-colors group-hover:text-[#0071E3]">pie_chart</span>
              <p className="text-sm font-medium">Dashboard</p>
            </a>
            <a href="#" className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2.5 text-[#0071E3]">
              <span className="material-symbols-outlined filled text-[#0071E3]">notifications</span>
              <p className="text-sm font-medium">Alerts</p>
            </a>
            <a href="#" className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#6E6E73] transition-colors hover:bg-gray-100 hover:text-[#1D1D1F]">
              <span className="material-symbols-outlined text-[#6E6E73] transition-colors group-hover:text-[#0071E3]">dns</span>
              <p className="text-sm font-medium">Infrastructure</p>
            </a>
            <a href="#" className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#6E6E73] transition-colors hover:bg-gray-100 hover:text-[#1D1D1F]">
              <span className="material-symbols-outlined text-[#6E6E73] transition-colors group-hover:text-[#0071E3]">receipt_long</span>
              <p className="text-sm font-medium">Logs</p>
            </a>
            <a href="#" className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#6E6E73] transition-colors hover:bg-gray-100 hover:text-[#1D1D1F]">
              <span className="material-symbols-outlined text-[#6E6E73] transition-colors group-hover:text-[#0071E3]">settings</span>
              <p className="text-sm font-medium">Settings</p>
            </a>
          </nav>
        </div>

        <div className="mt-auto border-t border-[#E5E5EA] px-3 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">JD</div>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-[#1D1D1F]">Jane Doe</p>
              <p className="text-xs text-[#6E6E73]">DevOps Engineer</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#F5F5F7]">
        <header className="flex-none px-8 pb-4 pt-8">
          <div className="mx-auto w-full max-w-[1200px]">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div className="flex flex-col gap-1">
                <div className="mb-1 flex items-center gap-2 text-sm text-[#6E6E73]">
                  <span>Monitoring</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  <span className="font-medium text-[#1D1D1F]">Alerts</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F] md:text-4xl">Alert Rules</h2>
                <p className="mt-1 max-w-2xl text-base text-[#6E6E73]">Configure threshold and anomaly detection rules for your infrastructure.</p>
              </div>

              <button
                type="button"
                className="group flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0071E3] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-600 active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>Create Rule</span>
              </button>
            </div>

            <div className="flex border-b border-[#E5E5EA]">
              <a href="#" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-[#6E6E73] transition-colors hover:text-[#1D1D1F]">
                Active Alerts
                <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">3</span>
              </a>
              <a href="#" className="border-b-2 border-[#0071E3] px-4 py-3 text-sm font-medium text-[#0071E3]">
                Alert Rules
              </a>
              <a href="#" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-[#6E6E73] transition-colors hover:text-[#1D1D1F]">
                Notification Channels
              </a>
              <a href="#" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-[#6E6E73] transition-colors hover:text-[#1D1D1F]">
                Silencing
              </a>
            </div>
          </div>
        </header>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-8 pb-8">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 py-2">
              <div className="relative max-w-md min-w-[280px] flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E73]">search</span>
                <input
                  type="text"
                  placeholder="Search rules..."
                  className="w-full rounded-lg border border-[#D2D2D7] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1D1D1F] placeholder:text-[#6E6E73] shadow-sm transition-shadow focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/50"
                />
              </div>

              <div className="flex gap-3">
                <div className="group relative">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-[#D2D2D7] bg-white px-4 py-2.5 text-sm font-medium text-[#1D1D1F] shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#6E6E73]">filter_list</span>
                    <span>Severity</span>
                    <span className="material-symbols-outlined text-[18px] text-[#6E6E73]">expand_more</span>
                  </button>
                </div>

                <div className="group relative">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-[#D2D2D7] bg-white px-4 py-2.5 text-sm font-medium text-[#1D1D1F] shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#6E6E73]">category</span>
                    <span>Type</span>
                    <span className="material-symbols-outlined text-[18px] text-[#6E6E73]">expand_more</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-transparent bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="border-b border-[#E5E5EA] bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Rule Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Metric</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]"><span className="inline-block leading-[1.15]">Agent<br />Match</span></th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Severity</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E5E5EA]">
                    {ALERT_RULE_ROWS.map((rule, index) => (
                      <tr key={`${rule.name}-${index}`} className="group transition-colors hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-[#1D1D1F]">{rule.name}</span>
                            <span className="mt-0.5 hidden text-xs text-[#6E6E73] transition-all group-hover:block">{rule.hint}</span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                            {rule.type}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <code className="rounded border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs text-gray-600">{rule.metric}</code>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <code className="font-mono text-xs text-[#0071E3]">{rule.agentMatch}</code>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getSeverityBadgeClass(rule.severity)}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${getSeverityDotClass(rule.severity)}`} />
                            {rule.severity}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          <ToggleSwitch checked={rule.enabled} id={`rule-toggle-${index}`} />
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button
                            type="button"
                            className="rounded-md p-1 text-[#6E6E73] transition-colors hover:bg-gray-100 hover:text-[#0071E3]"
                          >
                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-[#E5E5EA] bg-white px-6 py-4">
                <span className="text-sm text-[#6E6E73]">
                  Showing <span className="font-medium text-[#1D1D1F]">1</span> to <span className="font-medium text-[#1D1D1F]">5</span> of <span className="font-medium text-[#1D1D1F]">12</span> results
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-lg border border-[#E5E5EA] bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-400"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    className="rounded-lg border border-[#E5E5EA] px-3 py-1.5 text-sm font-medium text-[#1D1D1F] transition-colors hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
