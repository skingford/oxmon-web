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
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Search</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search Agent ID, Metric..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0073e6] focus:ring-2 focus:ring-[#0073e6]/20"
            />
          </div>
        </div>

        <div className="flex w-48 flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Severity</label>
          <div className="relative">
            <select className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-sm text-slate-900 outline-none transition-all focus:border-[#0073e6] focus:ring-2 focus:ring-[#0073e6]/20">
              <option>All Severities</option>
              <option>Critical</option>
              <option>Warning</option>
              <option>Info</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
              expand_more
            </span>
          </div>
        </div>

        <div className="flex w-56 flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Time Range</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
              calendar_today
            </span>
            <select className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm text-slate-900 outline-none transition-all focus:border-[#0073e6] focus:ring-2 focus:ring-[#0073e6]/20">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Custom Range...</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
              expand_more
            </span>
          </div>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          Clear filters
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-32 whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Severity
              </th>
              <th className="w-40 whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Agent
              </th>
              <th className="w-48 whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Metric
              </th>
              <th className="whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Message
              </th>
              <th className="w-40 whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Value / Threshold
              </th>
              <th className="w-40 whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Time
              </th>
              <th className="w-12 whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500" />
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {ALERT_ROWS.map((row, index) => (
              <tr key={`${row.agent}-${row.metric}-${index}`} className="group transition-colors hover:bg-slate-50">
                <td className="align-middle px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSeverityPillClass(row.severity)}`}>
                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${getSeverityDotClass(row.severity)}`} />
                    {row.severity}
                  </span>
                </td>

                <td className="align-middle px-4 py-3 font-mono text-sm font-medium text-slate-900">{row.agent}</td>

                <td className="align-middle px-4 py-3 text-sm text-slate-600">{row.metric}</td>

                <td className="max-w-xs truncate align-middle px-4 py-3 text-sm text-slate-600" title={row.message}>
                  {row.message}
                </td>

                <td className="align-middle px-4 py-3 text-right font-mono text-sm text-slate-700">
                  <span className={getValueClass(row.severity, row.value)}>{row.value}</span>
                  {row.threshold ? (
                    <>
                      <span className="mx-1 text-slate-400">/</span>
                      {row.threshold}
                    </>
                  ) : null}
                </td>

                <td className="whitespace-nowrap align-middle px-4 py-3 text-right text-sm text-slate-500">{row.time}</td>

                <td className="align-middle px-4 py-3 text-right">
                  <button
                    type="button"
                    className="rounded-md p-1 text-slate-400 opacity-0 transition-opacity hover:text-[#0073e6] group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-b-xl border-t border-[#e5e7eb] bg-white p-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Rows per page:</span>
          <select className="cursor-pointer rounded border-none bg-slate-50 px-2 py-1 text-sm font-medium text-slate-700 focus:ring-0">
            <option>10</option>
            <option>20</option>
            <option>50</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-500">Page 1 of 12</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <button
              type="button"
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
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

        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          Export CSV
        </button>
      </div>

      <AlertHistoryLogPanel />
    </div>
  )
}
