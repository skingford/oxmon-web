type MetricRecord = {
  id: string
  timestamp: string
  agent_id: string
  metric_name: string
  value: number
  labels: Record<string, string>
  created_at: string
}

type MetricsProps = {
  locale: 'en' | 'zh'
}

const METRIC_RECORDS: MetricRecord[] = [
  {
    id: 'mtr_001',
    timestamp: '2026-02-11T04:20:03.407Z',
    agent_id: 'agent-web-01',
    metric_name: 'cpu_usage',
    value: 0.71,
    labels: {
      env: 'prod',
      region: 'us-east-1',
      service: 'frontend',
    },
    created_at: '2026-02-11T04:20:03.408Z',
  },
  {
    id: 'mtr_002',
    timestamp: '2026-02-11T04:21:13.407Z',
    agent_id: 'agent-web-01',
    metric_name: 'memory_usage',
    value: 0.64,
    labels: {
      env: 'prod',
      region: 'us-east-1',
      service: 'frontend',
    },
    created_at: '2026-02-11T04:21:13.408Z',
  },
  {
    id: 'mtr_003',
    timestamp: '2026-02-11T04:22:20.407Z',
    agent_id: 'agent-api-02',
    metric_name: 'request_latency_p95',
    value: 0.82,
    labels: {
      env: 'prod',
      region: 'us-west-2',
      service: 'api',
    },
    created_at: '2026-02-11T04:22:20.408Z',
  },
  {
    id: 'mtr_004',
    timestamp: '2026-02-11T04:23:32.407Z',
    agent_id: 'agent-db-01',
    metric_name: 'disk_usage',
    value: 0.93,
    labels: {
      env: 'prod',
      region: 'us-west-2',
      service: 'database',
    },
    created_at: '2026-02-11T04:23:32.408Z',
  },
  {
    id: 'mtr_005',
    timestamp: '2026-02-11T04:24:41.407Z',
    agent_id: 'agent-worker-03',
    metric_name: 'queue_depth',
    value: 0.28,
    labels: {
      env: 'staging',
      region: 'eu-central-1',
      service: 'worker',
    },
    created_at: '2026-02-11T04:24:41.408Z',
  },
  {
    id: 'mtr_006',
    timestamp: '2026-02-11T04:25:55.407Z',
    agent_id: 'agent-api-02',
    metric_name: 'error_rate',
    value: 0.12,
    labels: {
      env: 'prod',
      region: 'us-west-2',
      service: 'api',
    },
    created_at: '2026-02-11T04:25:55.408Z',
  },
]

function formatMetricValue(value: number): string {
  if (value <= 1) {
    return `${(value * 100).toFixed(1)}%`
  }

  return value.toFixed(2)
}

function formatTimestamp(value: string, locale: 'en' | 'zh'): string {
  return `${new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(value))} UTC`
}

function getValueClass(value: number): string {
  if (value >= 0.9) {
    return 'border border-red-100 bg-red-50 text-red-600'
  }

  if (value >= 0.75) {
    return 'border border-orange-100 bg-orange-50 text-orange-600'
  }

  return 'border border-green-100 bg-green-50 text-green-600'
}

export default function Metrics({ locale }: MetricsProps) {
  const isZh = locale === 'zh'
  const sortedRecords = [...METRIC_RECORDS].sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  )

  const uniqueAgents = new Set(METRIC_RECORDS.map((record) => record.agent_id)).size
  const uniqueMetricNames = new Set(METRIC_RECORDS.map((record) => record.metric_name)).size
  const averageValue = METRIC_RECORDS.reduce((total, record) => total + record.value, 0) / METRIC_RECORDS.length
  const latestRecord = sortedRecords[0]

  return (
    <div className="flex min-w-0 flex-col pb-6 pt-6">
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-[#e5e5e5]/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{isZh ? '数据点' : 'Data Points'}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{METRIC_RECORDS.length}</p>
        </div>
        <div className="rounded-xl border border-[#e5e5e5]/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{isZh ? '活跃节点' : 'Active Agents'}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{uniqueAgents}</p>
        </div>
        <div className="rounded-xl border border-[#e5e5e5]/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{isZh ? '指标类型' : 'Metric Types'}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{uniqueMetricNames}</p>
        </div>
        <div className="rounded-xl border border-[#e5e5e5]/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{isZh ? '平均值' : 'Average Value'}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatMetricValue(averageValue)}</p>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-[#e5e5e5]/60 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e5e5]/60 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="material-symbols-outlined text-[18px] text-[#0073e6]">schedule</span>
            <span>
              {isZh ? '最近更新时间：' : 'Latest sample: '}
              <span className="font-medium text-slate-700">
                {latestRecord ? formatTimestamp(latestRecord.timestamp, locale) : '-'}
              </span>
            </span>
          </div>

          <div className="relative w-full max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
            <input
              type="text"
              readOnly
              value={isZh ? '按 agent_id / metric_name 搜索（示例）' : 'Search by agent_id / metric_name (sample)'}
              className="h-10 w-full rounded-lg border border-[#dbe0e6] bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-y border-[#e5e5e5]/60 bg-slate-50/50">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Timestamp</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Agent ID</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Metric</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Value</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Labels</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]/60">
              {sortedRecords.map((record) => (
                <tr key={record.id} className="transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {formatTimestamp(record.timestamp, locale)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <code className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{record.agent_id}</code>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-800">{record.metric_name}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getValueClass(record.value)}`}>
                      {formatMetricValue(record.value)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(record.labels).map(([key, labelValue]) => (
                        <span
                          key={`${record.id}-${key}`}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                        >
                          {key}:{labelValue}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-500">
                    {formatTimestamp(record.created_at, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
