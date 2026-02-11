import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Activity, Bell, Info, Minimize, Plus, Share } from 'lucide-react'

type FullScreenMetricsChartViewProps = {
  locale: 'en' | 'zh'
}

type MetricLegendItem = {
  name: string
  avg: string
  peak: string
  colorClass: string
  accentClass: string
  checked: boolean
  muted?: boolean
  hidden?: boolean
}

const USER_AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD8l9ijSXbJWgm4IxgoWKy9gPd0RYqtTS-QHPFTm3MtsyKDx30QEEV7xNZ_AGcM-G9Ic2LHXRVlF49qKaaSDdmWkzyyC7pmXHsQiXgPI9vEDfR9l_lQ3Jk_KCK0I9YNByZ5Y2IrK35ci0ZOPkjF8glihf0BkWJQeW_fL80okG3tRz9e9Pr1AlREbcWLsguEAlIFxcKaXrN1zdCsf3Hrf7RhHp3fKPrG6R-ZjkYKRZDkO0T3yLU39vqiNOF_r-PVd57SKPumZRFzMFE'

const RANGE_OPTIONS = ['1H', '6H', '24H', '7D', '30D'] as const

const X_AXIS_LABELS = ['10:00 AM', '12:00 PM', '02:00 PM', '02:30 PM', '04:00 PM', '06:00 PM', '08:00 PM', '10:00 PM'] as const

const METRIC_LEGEND_ITEMS: MetricLegendItem[] = [
  {
    name: 'CPU Load',
    avg: '45%',
    peak: '92%',
    colorClass: 'bg-[#0071e3]',
    accentClass: 'accent-[#0071e3]',
    checked: true,
  },
  {
    name: 'Memory Usage',
    avg: '3.2GB',
    peak: '6.1GB',
    colorClass: 'bg-[#34c759]',
    accentClass: 'accent-[#34c759]',
    checked: true,
  },
  {
    name: 'Disk I/O',
    avg: '40MB/s',
    peak: '210MB/s',
    colorClass: 'bg-[#ff9500]',
    accentClass: 'accent-[#ff9500]',
    checked: true,
  },
  {
    name: 'Network In',
    avg: 'Hidden',
    peak: '',
    colorClass: 'bg-purple-500',
    accentClass: 'accent-purple-500',
    checked: false,
    muted: true,
    hidden: true,
  },
]

export default function FullScreenMetricsChartView({ locale }: FullScreenMetricsChartViewProps) {
  const isZh = locale === 'zh'

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#f5f7f8] text-slate-900">
      <header className="z-10 flex items-center justify-between border-b border-gray-200 bg-white/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3 text-slate-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0673e0] text-white">
            <Activity className="text-[20px]" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">{isZh ? 'Oxmon 仪表盘' : 'Oxmon Dashboard'}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <Bell className="text-[18px]" />
          </div>
          <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200">
            <img alt="User Avatar" className="h-full w-full object-cover" src={USER_AVATAR_URL} />
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center bg-[#f5f5f7] p-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-200 opacity-20 mix-blend-multiply blur-3xl" />
          <div className="absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-purple-200 opacity-20 mix-blend-multiply blur-3xl" />
          <div className="absolute -bottom-8 left-1/2 h-96 w-96 rounded-full bg-pink-200 opacity-20 mix-blend-multiply blur-3xl" />
        </div>

        <section className="relative z-20 flex h-full w-full max-w-[1600px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-all duration-300">
          <div className="z-30 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
            <div className="flex items-center gap-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {isZh ? '系统资源对比' : 'System Resource Comparison'}
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {isZh ? '最近 24 小时 • 15 分钟间隔' : 'Last 24 Hours • 15 min interval'}
                </p>
              </div>

              <div className="hidden rounded-lg bg-gray-100/80 p-1 md:flex">
                {RANGE_OPTIONS.map((option, index) => (
                  <Button
                    key={option}
                    type="button"
                    className={
                      index === 2
                        ? 'rounded-md bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-sm transition-all'
                        : 'rounded-md px-3 py-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900'
                    }
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-gray-50"
              >
                <Share className="text-[18px]" />
                <span>{isZh ? '导出' : 'Export'}</span>
              </Button>

              <Button
                type="button"
                className="group flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-slate-800"
              >
                <Minimize className="text-[18px] transition-transform group-hover:scale-90" />
                <span>{isZh ? '退出全屏' : 'Exit Full Screen'}</span>
              </Button>
            </div>
          </div>

          <div className="relative flex flex-1 overflow-hidden">
            <div className="relative flex flex-1 flex-col overflow-hidden p-6 md:p-10">
              <div className="absolute top-1/2 left-4 -translate-y-1/2 -rotate-90 text-xs font-medium tracking-wider text-slate-400 uppercase">
                Usage Percentage (%)
              </div>

              <div className="relative flex h-full w-full flex-col justify-between pb-8 pl-8">
                <div className="absolute inset-0 bottom-8 left-8 border-b border-l border-gray-200">
                  <div className="absolute top-0 right-0 left-0 w-full border-t border-dashed border-gray-100" />
                  <div className="absolute top-1/4 right-0 left-0 w-full border-t border-dashed border-gray-100" />
                  <div className="absolute top-2/4 right-0 left-0 w-full border-t border-dashed border-gray-100" />
                  <div className="absolute top-3/4 right-0 left-0 w-full border-t border-dashed border-gray-100" />

                  <div className="absolute -left-8 top-0 w-6 text-right font-mono text-xs text-slate-400">100</div>
                  <div className="absolute -left-8 top-1/4 w-6 text-right font-mono text-xs text-slate-400">75</div>
                  <div className="absolute -left-8 top-2/4 w-6 text-right font-mono text-xs text-slate-400">50</div>
                  <div className="absolute -left-8 top-3/4 w-6 text-right font-mono text-xs text-slate-400">25</div>
                  <div className="absolute -left-8 bottom-0 w-6 text-right font-mono text-xs text-slate-400">0</div>

                  <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 400">
                    <defs>
                      <linearGradient id="fullScreenMetricsBlueGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0071e3" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#0071e3" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <path
                      d="M0,400 L0,150 C150,140 250,200 400,180 C550,160 650,100 800,120 C900,133 950,80 1000,90 L1000,400 Z"
                      fill="url(#fullScreenMetricsBlueGradient)"
                    />

                    <path
                      className="drop-shadow-sm"
                      d="M0,150 C150,140 250,200 400,180 C550,160 650,100 800,120 C900,133 950,80 1000,90"
                      fill="none"
                      stroke="#0071e3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                    />

                    <path
                      className="opacity-80"
                      d="M0,250 C100,240 300,260 500,230 C700,200 850,220 1000,180"
                      fill="none"
                      stroke="#34c759"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                    />

                    <path
                      className="opacity-80"
                      d="M0,320 C200,310 400,340 600,290 C800,240 900,300 1000,280"
                      fill="none"
                      stroke="#ff9500"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                    />

                    <line className="opacity-50" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1" x1="600" x2="600" y1="0" y2="400" />

                    <circle cx="600" cy="154" fill="#0071e3" r="6" stroke="white" strokeWidth="3" />
                    <circle cx="600" cy="216" fill="#34c759" r="6" stroke="white" strokeWidth="3" />
                    <circle cx="600" cy="290" fill="#ff9500" r="6" stroke="white" strokeWidth="3" />
                  </svg>

                  <div className="absolute top-[80px] left-[620px] z-50 w-64 rounded-xl border border-white/50 bg-white/90 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-md">
                    <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">14:30 PM</span>
                      <span className="rounded bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">Oct 24</span>
                    </div>

                    <div className="space-y-3">
                      <div className="group flex cursor-pointer items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#0071e3] shadow-sm" />
                          <span className="text-sm font-medium text-slate-700">CPU Load</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-slate-900">62%</span>
                      </div>

                      <div className="group flex cursor-pointer items-center justify-between opacity-70 transition-opacity hover:opacity-100">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#34c759] shadow-sm" />
                          <span className="text-sm font-medium text-slate-700">Memory</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-slate-900">4.2 GB</span>
                      </div>

                      <div className="group flex cursor-pointer items-center justify-between opacity-70 transition-opacity hover:opacity-100">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#ff9500] shadow-sm" />
                          <span className="text-sm font-medium text-slate-700">Disk I/O</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-slate-900">128 MB/s</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-8 flex items-center justify-between px-0 pt-4 text-xs font-medium text-slate-400">
                  {X_AXIS_LABELS.map((label) => (
                    <span
                      key={label}
                      className={label === '02:30 PM' ? 'rounded bg-gray-100 px-2 py-0.5 font-bold text-slate-900' : ''}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <aside className="z-20 flex w-72 flex-col overflow-y-auto border-l border-gray-100 bg-gray-50/50">
              <div className="border-b border-gray-100 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-bold tracking-widest text-slate-900 uppercase">Metrics</h3>
                  <Button type="button" className="text-xs font-medium text-[#0673e0] hover:underline">
                    {isZh ? '全选' : 'Select All'}
                  </Button>
                </div>

                <div className="space-y-3">
                  {METRIC_LEGEND_ITEMS.map((item) => (
                    <Label
                      key={item.name}
                      className={`group -mx-2 flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-all hover:bg-white hover:shadow-sm ${item.muted ? 'opacity-60 hover:opacity-100' : ''}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <Checkbox
                          defaultChecked={item.checked}
                          className={`h-4 w-4 border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 ${item.accentClass}`}
                          aria-label={`${item.name} toggle`}
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{item.name}</span>
                          <span className={`h-2 w-2 rounded-full ${item.colorClass}`} />
                        </div>

                        {item.hidden ? (
                          <div className="mt-0.5 text-[10px] text-slate-400">Hidden</div>
                        ) : (
                          <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
                            <span>Avg: {item.avg}</span>
                            <span>Peak: {item.peak}</span>
                          </div>
                        )}
                      </div>
                    </Label>
                  ))}
                </div>

                <div className="mt-4 border-t border-dashed border-gray-200 pt-4">
                  <Button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded border border-transparent py-2 text-xs font-medium text-slate-500 transition-colors hover:border-gray-200 hover:bg-white hover:text-[#0673e0] hover:shadow-sm"
                  >
                    <Plus className="text-[16px]" />
                    <span>{isZh ? '添加指标' : 'Add Metric'}</span>
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <h3 className="mb-4 text-xs font-bold tracking-widest text-slate-900 uppercase">
                  {isZh ? '视图设置' : 'View Settings'}
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{isZh ? '对数刻度' : 'Logarithmic Scale'}</span>
                      <span className="text-[10px] text-slate-400">
                        {isZh ? '更适合宽范围数据' : 'Better for wide ranges'}
                      </span>
                    </div>

                    <Button
                      type="button"
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:ring-2 focus:ring-[#0673e0] focus:ring-offset-2 focus:outline-none"
                    >
                      <span className="inline-block h-4 w-4 translate-x-1 transform rounded-full bg-white shadow-sm transition-transform" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Smoothing</span>
                      <span className="rounded bg-gray-100 px-1.5 text-xs font-mono text-slate-500">0.5</span>
                    </div>

                    <div className="relative h-1 w-full rounded-full bg-gray-200">
                      <div className="absolute h-full w-1/2 rounded-full bg-[#0673e0]" />
                      <div className="absolute top-[-6px] right-1/2 h-4 w-4 cursor-grab rounded-full border border-gray-200 bg-white shadow-md transition-transform hover:scale-110" />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Raw</span>
                      <span>Smooth</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{isZh ? '显示注释' : 'Show Annotations'}</span>
                      <span className="text-[10px] text-slate-400">Alerts &amp; Deployments</span>
                    </div>

                    <Button
                      type="button"
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#0673e0] transition-colors focus:ring-2 focus:ring-[#0673e0] focus:ring-offset-2 focus:outline-none"
                    >
                      <span className="inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white shadow-sm transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-auto border-t border-gray-100 bg-gray-50 p-6">
                <div className="flex items-center gap-3 text-slate-500">
                  <Info className="text-[18px]" />
                  <p className="text-[10px] leading-tight">
                    {isZh
                      ? '数据每 15 分钟聚合一次。最后更新于 2 分钟前。'
                      : 'Data is aggregated every 15 minutes. Last updated 2 mins ago.'}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  )
}
