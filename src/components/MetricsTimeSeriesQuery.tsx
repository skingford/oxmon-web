const TIME_RANGE_OPTIONS = ['1h', '6h', '24h', '7d', 'Custom'] as const
const X_AXIS_LABELS = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '00:00'] as const

export default function MetricsTimeSeriesQuery() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#f5f7f8] font-sans text-[#1d1d1f] antialiased">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center text-[#0073e6]">
                <span className="material-symbols-outlined text-[32px]">monitoring</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-[#1d1d1f]">Oxmon Admin</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Search"
                className="rounded-full p-2 text-[#86868b] transition-colors hover:bg-gray-100 hover:text-[#1d1d1f]"
              >
                <span className="material-symbols-outlined">search</span>
              </button>

              <button
                type="button"
                aria-label="Notifications"
                className="relative rounded-full p-2 text-[#86868b] transition-colors hover:bg-gray-100 hover:text-[#1d1d1f]"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              </button>

              <button
                type="button"
                aria-label="Settings"
                className="rounded-full p-2 text-[#86868b] transition-colors hover:bg-gray-100 hover:text-[#1d1d1f]"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>

              <div className="ml-2 h-8 w-8 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsmQIdkjq2DcTglPk8kW9mqpk5nqYnjRzFF39f_bjpL0P0E96RzxGxKj_QjrVGrxD7u5XWGvGwXMzAm3IHKM_i43z49TQf418qJudCn6CGgRerl9OGV1dHTEQOq-CBa0YxsTG_-BN7tB36M2sqZasEA_-PeXpl6QXcal1Ar6_YIiXnqg294wzlkgWO39haYv2dpBhrO4unJQYIyycDtdfgViigebOYc9qR5QdsUgkFewnftsx4nSt0h6K_U60huHJMm8YKR7qMBjU"
                  alt="User Profile"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">Metrics Explorer</h1>
            <p className="mt-1 text-base text-[#86868b]">Analyze infrastructure performance and visualize time-series data.</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[#1d1d1f] shadow-sm transition-colors hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Export
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[#1d1d1f] shadow-sm transition-colors hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
              Share
            </button>
          </div>
        </div>

        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col items-end gap-6 lg:flex-row">
            <div className="w-full flex-1 space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#86868b]">Agent</label>
              <div className="group relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#0073e6]">
                  dns
                </span>
                <input
                  type="text"
                  defaultValue="production-server-01"
                  placeholder="Search agent (e.g. prod-server-01)"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#1d1d1f] placeholder-gray-400 transition-all focus:border-[#0073e6] focus:outline-none focus:ring-2 focus:ring-[#0073e6]/50"
                />
              </div>
            </div>

            <div className="w-full flex-1 space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#86868b]">Metric Name</label>
              <div className="group relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#0073e6]">
                  bar_chart
                </span>
                <select
                  defaultValue="cpu"
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-[#1d1d1f] transition-all focus:border-[#0073e6] focus:outline-none focus:ring-2 focus:ring-[#0073e6]/50"
                >
                  <option value="cpu">system.cpu.usage</option>
                  <option value="memory">system.memory.usage</option>
                  <option value="disk">system.disk.io</option>
                  <option value="network">system.network.bytes</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  expand_more
                </span>
              </div>
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0073e6] px-6 py-2.5 font-medium text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-600 active:scale-95 lg:w-auto"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              Query
            </button>
          </div>

          <div className="my-5 h-px bg-gray-100" />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1">
              {TIME_RANGE_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    option === '24h'
                      ? 'bg-white text-[#0073e6] shadow-sm'
                      : 'text-[#86868b] hover:text-[#1d1d1f]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-sm text-[#86868b]">
              <span className="flex items-center gap-1.5">
                <span className="block h-2 w-2 rounded-full bg-green-500" />
                Live
              </span>
              <span className="text-gray-300">|</span>
              <span>Updated 1m ago</span>
              <button type="button" title="Refresh" className="rounded p-1 transition-colors hover:bg-gray-100">
                <span className="material-symbols-outlined text-[18px]">refresh</span>
              </button>
            </div>
          </div>
        </section>

        <section className="flex h-[500px] flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#1d1d1f]">CPU Usage %</h3>
              <p className="text-sm text-[#86868b]">production-server-01</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full border border-[#0073e6] bg-[#0073e6]/20" />
                <span className="font-medium text-[#1d1d1f]">Avg Usage</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full border border-red-500 bg-red-500/20" />
                <span className="text-[#86868b]">Peak Threshold</span>
              </div>
            </div>
          </div>

          <div className="relative w-full flex-1">
            <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1200 400">
              <defs>
                <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0073e6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0073e6" stopOpacity="0" />
                </linearGradient>
              </defs>

              <line x1="0" x2="1200" y1="0" y2="0" stroke="#e5e7eb" strokeDasharray="4" strokeWidth="1" />
              <line x1="0" x2="1200" y1="100" y2="100" stroke="#e5e7eb" strokeDasharray="4" strokeWidth="1" />
              <line x1="0" x2="1200" y1="200" y2="200" stroke="#e5e7eb" strokeDasharray="4" strokeWidth="1" />
              <line x1="0" x2="1200" y1="300" y2="300" stroke="#e5e7eb" strokeDasharray="4" strokeWidth="1" />
              <line x1="0" x2="1200" y1="400" y2="400" stroke="#e5e7eb" strokeDasharray="4" strokeWidth="1" />

              <path
                d="M0,350 C100,320 150,340 200,280 C250,220 300,250 350,260 C400,270 450,150 500,180 C550,210 600,220 650,200 C700,180 750,140 800,160 C850,180 900,120 950,140 C1000,160 1050,200 1100,180 C1150,160 1200,220 1200,220 V400 H0 Z"
                fill="url(#gradient)"
                opacity="0.2"
              />

              <path
                d="M0,350 C100,320 150,340 200,280 C250,220 300,250 350,260 C400,270 450,150 500,180 C550,210 600,220 650,200 C700,180 750,140 800,160 C850,180 900,120 950,140 C1000,160 1050,200 1100,180 C1150,160 1200,220 1200,220"
                fill="none"
                stroke="#0073e6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                style={{ filter: 'drop-shadow(0 4px 10px rgba(0, 115, 230, 0.2))' }}
              />

              <g transform="translate(500, 180)">
                <circle r="6" fill="#0073e6" stroke="white" strokeWidth="3" />
                <g transform="translate(-60, -85)">
                  <rect width="120" height="70" rx="8" fill="#1d1d1f" />
                  <text x="60" y="25" fill="#86868b" fontFamily="Inter" fontSize="12" textAnchor="middle">
                    10:32 AM
                  </text>
                  <text x="60" y="50" fill="white" fontFamily="Inter" fontSize="16" fontWeight="700" textAnchor="middle">
                    68.4%
                  </text>
                  <path d="M54,70 L60,76 L66,70 Z" fill="#1d1d1f" />
                </g>
              </g>
            </svg>

            <div className="pointer-events-none absolute inset-0 flex select-none flex-col justify-between py-0 pr-2 text-xs text-[#86868b]">
              <div className="w-full -translate-y-1/2 text-right">100%</div>
              <div className="w-full -translate-y-1/2 text-right">75%</div>
              <div className="w-full -translate-y-1/2 text-right">50%</div>
              <div className="w-full -translate-y-1/2 text-right">25%</div>
              <div className="w-full translate-y-1/2 text-right">0%</div>
            </div>
          </div>

          <div className="mt-4 flex justify-between px-2 text-xs font-medium text-[#86868b]">
            {X_AXIS_LABELS.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <article className="flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="text-xs font-medium uppercase tracking-wide text-[#86868b]">Average</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#1d1d1f]">42.8%</span>
              <span className="flex items-center text-xs font-medium text-green-500">
                <span className="material-symbols-outlined text-[14px]">trending_down</span>
                2.1%
              </span>
            </div>
          </article>

          <article className="flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="text-xs font-medium uppercase tracking-wide text-[#86868b]">Maximum</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#1d1d1f]">89.2%</span>
              <span className="flex items-center text-xs font-medium text-red-500">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Spike detected
              </span>
            </div>
          </article>

          <article className="flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="text-xs font-medium uppercase tracking-wide text-[#86868b]">Minimum</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#1d1d1f]">12.4%</span>
              <span className="text-xs text-[#86868b]">at 03:45 AM</span>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
