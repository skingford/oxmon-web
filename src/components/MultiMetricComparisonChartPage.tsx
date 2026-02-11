type MultiMetricComparisonChartPageProps = {
  locale: 'en' | 'zh'
}

type LegendItem = {
  name: string
  detail: string
  colorClass: string
  accentClass: string
  checked: boolean
  muted?: boolean
}

type StatCard = {
  title: string
  icon: string
  value: string
  trend: string
  trendIcon: string
  trendClass: string
}

const USER_AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAGDCrDRXCT45xTpzo2NLKzW4ODtX23BVcpOUaBI2h-hx0X1QnMhhZu9AJd7nrg4eP70VBwqlXs9TzQcXMsjbXoU3et5YRn3EWj2p-2Eelh6EXM87n0W0En6hIqzRpOYVwWqmrxcgQ5tp8zSQo3YFSHU_vr5xKOJKnphkvKJxBFT0zoF-oiH8uDxt5AeYqeyaHpHABE4i-2jiOBKaR_TU0SnPP4Uz4UlPg6iDvgcHJ_0x2vsphmq3VUFiizDfRv2s2IFx0u2vPTr0c'

const NAV_ITEMS = [
  { label: 'Dashboard', active: false },
  { label: 'Metrics', active: true },
  { label: 'Alerts', active: false },
  { label: 'Settings', active: false },
] as const

const TIME_RANGE_OPTIONS = ['1H', '24H', '7D'] as const

const X_AXIS_LABELS = ['10:00 AM', '10:05 AM', '10:10 AM', '10:15 AM', '10:20 AM', '10:25 AM', '10:30 AM'] as const

const LEGEND_ITEMS: LegendItem[] = [
  {
    name: 'Server Alpha',
    detail: 'us-east-1a • i-0f9a8...',
    colorClass: 'bg-[#0071E3]',
    accentClass: 'accent-[#0071E3]',
    checked: true,
  },
  {
    name: 'Server Beta',
    detail: 'us-west-2b • i-0b3c2...',
    colorClass: 'bg-[#34C759]',
    accentClass: 'accent-[#34C759]',
    checked: true,
  },
  {
    name: 'DB Primary',
    detail: 'us-east-1c • rds-pg...',
    colorClass: 'bg-[#FF9500]',
    accentClass: 'accent-[#FF9500]',
    checked: true,
  },
  {
    name: 'Redis Cache',
    detail: 'us-east-1a • elastic...',
    colorClass: 'bg-[#FF3B30]',
    accentClass: 'accent-[#FF3B30]',
    checked: false,
    muted: true,
  },
]

const STAT_CARDS: StatCard[] = [
  {
    title: 'Total Requests',
    icon: 'bar_chart',
    value: '2.4M',
    trend: '12%',
    trendIcon: 'arrow_upward',
    trendClass: 'text-green-600',
  },
  {
    title: 'Error Rate',
    icon: 'warning',
    value: '0.02%',
    trend: '0.4%',
    trendIcon: 'arrow_downward',
    trendClass: 'text-green-600',
  },
  {
    title: 'Avg Response Time',
    icon: 'timer',
    value: '124ms',
    trend: '0%',
    trendIcon: 'remove',
    trendClass: 'text-slate-400',
  },
]

export default function MultiMetricComparisonChartPage({ locale }: MultiMetricComparisonChartPageProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#f5f7f8] text-slate-900 antialiased">
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-200 bg-white/90 px-10 py-3 backdrop-blur-md transition-colors duration-200">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 text-slate-900">
            <div className="size-8 text-[#0673e0]">
              <svg className="h-full w-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor" />
              </svg>
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-900">Oxmon</h2>
          </div>

          <label className="hidden h-10 min-w-40 max-w-64 flex-col md:flex">
            <div className="group relative flex h-full w-full flex-1 items-stretch rounded-lg">
              <div className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#0673e0]">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input
                className="form-input h-full w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-slate-200 bg-slate-50 py-0 pr-4 pl-10 text-sm font-normal leading-normal text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#0673e0] focus:ring-2 focus:ring-[#0673e0]/20 focus:outline-none"
                placeholder="Search resources..."
                defaultValue=""
              />
            </div>
          </label>
        </div>

        <div className="flex flex-1 items-center justify-end gap-6">
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href="#"
                className={item.active ? 'text-[#0673e0]' : 'transition-colors hover:text-[#0673e0]'}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden h-6 w-px bg-slate-200 lg:block" />

          <div className="flex gap-2">
            <button
              type="button"
              className="flex size-10 cursor-pointer items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>

            <button
              type="button"
              className="flex size-10 cursor-pointer items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>

            <div
              aria-label="User profile picture"
              className="ml-2 size-10 cursor-pointer rounded-full bg-cover bg-center bg-no-repeat ring-2 ring-white"
              role="img"
              style={{ backgroundImage: `url(${USER_AVATAR_URL})` }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 px-6 py-8 md:px-12 lg:px-24">
        <section className="w-full">
          <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="flex flex-col gap-2">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                <span>{locale === 'zh' ? '基础设施' : 'Infrastructure'}</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <span>{locale === 'zh' ? '监控' : 'Monitoring'}</span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                {locale === 'zh' ? '指标对比' : 'Metric Comparison'}
              </h1>

              <p className="max-w-2xl text-base text-slate-500">
                {locale === 'zh'
                  ? '实时分析你的基础设施代理性能趋势。'
                  : 'Analyze performance trends across your infrastructure agents in real-time.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                {TIME_RANGE_OPTIONS.map((range, index) => (
                  <button
                    key={range}
                    type="button"
                    className={
                      index === 0
                        ? 'rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm'
                        : 'rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50'
                    }
                  >
                    {range}
                  </button>
                ))}

                <div className="mx-1 h-4 w-px bg-slate-200" />

                <button type="button" className="px-2 py-1.5 text-slate-500 transition-colors hover:text-slate-900">
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                </button>
              </div>

              <button
                type="button"
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
                <span>{locale === 'zh' ? '刷新' : 'Refresh'}</span>
              </button>

              <button
                type="button"
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0673e0] px-4 text-sm font-medium text-white shadow-sm shadow-blue-500/20 transition-all hover:bg-blue-600"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>{locale === 'zh' ? '添加指标' : 'Add Metric'}</span>
              </button>
            </div>
          </div>

          <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">CPU Usage &amp; Load Average</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Live</span>
                  <span className="text-sm text-slate-500">Oct 24, 2023 • 10:00 AM - 10:30 AM</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold tracking-tight text-slate-900">82.4%</div>
                  <div className="text-xs text-slate-500">Peak Usage</div>
                </div>

                <div className="h-8 w-px bg-slate-200" />

                <div className="text-right">
                  <div className="text-2xl font-bold tracking-tight text-slate-900">45.2%</div>
                  <div className="text-xs text-slate-500">Avg Load</div>
                </div>
              </div>
            </div>

            <div className="relative mb-6 h-[400px] w-full cursor-crosshair select-none">
              <div className="pointer-events-none absolute top-0 bottom-8 left-0 z-10 flex flex-col justify-between pr-4 text-xs font-medium text-slate-400">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              <div className="pointer-events-none absolute top-3 right-0 bottom-8 left-8 flex flex-col justify-between">
                <div className="h-0 w-full border-t border-slate-100" />
                <div className="h-0 w-full border-t border-slate-100" />
                <div className="h-0 w-full border-t border-slate-100" />
                <div className="h-0 w-full border-t border-slate-100" />
                <div className="h-0 w-full border-t border-slate-100" />
              </div>

              <svg
                className="absolute top-3 right-0 bottom-8 left-8 h-[calc(100%-2.75rem)] w-[calc(100%-2rem)] overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 1000 300"
              >
                <defs>
                  <linearGradient id="gradientBlue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0071E3" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#0071E3" stopOpacity="0" />
                  </linearGradient>

                  <linearGradient id="gradientGreen" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#34C759" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#34C759" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d="M0,200 C150,180 300,50 450,120 C600,190 750,100 850,80 C950,60 1000,150 1000,150 L1000,300 L0,300 Z"
                  fill="url(#gradientBlue)"
                />

                <path
                  className="drop-shadow-md"
                  d="M0,200 C150,180 300,50 450,120 C600,190 750,100 850,80 C950,60 1000,150 1000,150"
                  fill="none"
                  stroke="#0071E3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                />

                <path
                  d="M0,250 C120,240 250,180 400,200 C550,220 700,150 820,180 C920,205 1000,100 1000,100"
                  fill="none"
                  stroke="#34C759"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                />

                <path
                  d="M0,150 C100,160 200,250 350,240 C500,230 650,280 750,260 C850,240 1000,280 1000,280"
                  fill="none"
                  stroke="#FF9500"
                  strokeDasharray="6,4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                />

                <g className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <line stroke="#94a3b8" strokeDasharray="4,4" strokeWidth="1" x1="600" x2="600" y1="0" y2="300" />

                  <circle cx="600" cy="190" fill="white" r="5" stroke="#0071E3" strokeWidth="3" />
                  <circle cx="600" cy="213" fill="white" r="5" stroke="#34C759" strokeWidth="3" />
                  <circle cx="600" cy="265" fill="white" r="5" stroke="#FF9500" strokeWidth="3" />
                </g>
              </svg>

              <div className="pointer-events-none absolute top-[80px] left-[620px] z-20 min-w-[220px] translate-y-2 rounded-xl border border-slate-100 bg-white p-4 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)] transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                <div className="mb-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">Oct 24, 10:18 AM</div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full bg-[#0071E3] shadow-[0_0_6px_rgba(0,113,227,0.6)]" />
                      <span className="text-sm font-medium text-slate-700">Server Alpha</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">62%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full bg-[#34C759] shadow-[0_0_6px_rgba(52,199,89,0.6)]" />
                      <span className="text-sm font-medium text-slate-700">Server Beta</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">48%</span>
                  </div>

                  <div className="flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full bg-[#FF9500]" />
                      <span className="text-sm font-medium text-slate-700">DB Primary</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">15%</span>
                  </div>
                </div>
              </div>

              <div className="absolute right-0 bottom-0 left-8 flex justify-between pt-2 text-xs font-medium text-slate-400">
                {X_AXIS_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>

            <div className="mt-2 border-t border-slate-100 pt-6">
              <div className="flex flex-wrap gap-4">
                {LEGEND_ITEMS.map((item) => (
                  <label
                    key={item.name}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-slate-200 hover:bg-slate-50 ${item.muted ? 'opacity-60' : ''}`}
                  >
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className={`size-4 rounded border-slate-300 ${item.accentClass}`}
                      aria-label={`${item.name} visibility`}
                    />
                    <div className={`size-2 rounded-full ${item.colorClass}`} />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                      <span className="text-xs text-slate-500">{item.detail}</span>
                    </div>
                  </label>
                ))}

                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-[#0673e0] hover:text-[#0673e0]"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>{locale === 'zh' ? '对比' : 'Compare'}</span>
                </button>
              </div>
            </div>
          </article>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {STAT_CARDS.map((card) => (
              <article
                key={card.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-500">{card.title}</h4>
                  <span className="material-symbols-outlined text-[20px] text-slate-400">{card.icon}</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="leading-none text-2xl font-bold text-slate-900">{card.value}</span>
                  <span className={`flex items-center text-xs font-medium ${card.trendClass}`}>
                    <span className="material-symbols-outlined text-[14px]">{card.trendIcon}</span>
                    {card.trend}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
