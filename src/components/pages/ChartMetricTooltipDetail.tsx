import { Button } from '@/components/ui/button'
import {
  Activity,
  Bell,
  ChartColumn,
  ChartLine,
  ChevronRight,
  History,
  MemoryStick,
  Settings,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

type ChartMetricTooltipDetailProps = {
  locale: 'en' | 'zh'
}

const USER_AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD-FwM8uG7EwO4CDiVtWBEXeWwRa1CWWYB5K7n_JhoB0yoeTHMUK18rHz_E96koBubYKapqF24zr8IUAzNFRpVj7_b7YDKep66ODyZDerfoOzcflqG4SQsNKSvoLSRBaU2yHrAjvL8KjJl21RqwgTjPi01HvP5noG24lR5GLw1MNYWMi5D8yVJLU2M1sMt1Trqw-kPmdnqa7WveQ8snj-FKWboMa8qSqCxQMhNSPj_93IjHpJy8pZULlsqZFrs3o_XsQkTU8PqNLt0'

const TIME_RANGE_OPTIONS = ['1H', '24H', '7D', '30D'] as const

const METRIC_CARDS: Array<{
  id: string
  icon: LucideIcon
  iconWrap: string
  trendWrap: string
  trendIcon: LucideIcon
  trendText: string
  label: string
  value: string
}> = [
  {
    id: 'current',
    icon: MemoryStick,
    iconWrap: 'bg-blue-50 text-blue-600',
    trendWrap: 'bg-green-50 text-green-600',
    trendIcon: TrendingUp,
    trendText: '2.4%',
    label: 'Current Usage',
    value: '45.28%',
  },
  {
    id: 'peak',
    icon: ChartColumn,
    iconWrap: 'bg-purple-50 text-purple-600',
    trendWrap: 'bg-green-50 text-green-600',
    trendIcon: TrendingUp,
    trendText: '12.1%',
    label: 'Peak (24h)',
    value: '88.12%',
  },
  {
    id: 'average',
    icon: History,
    iconWrap: 'bg-orange-50 text-orange-600',
    trendWrap: 'bg-red-50 text-red-600',
    trendIcon: TrendingDown,
    trendText: '5.2%',
    label: 'Average (24h)',
    value: '32.40%',
  },
  {
    id: 'projected',
    icon: ChartLine,
    iconWrap: 'bg-teal-50 text-teal-600',
    trendWrap: 'bg-green-50 text-green-600',
    trendIcon: TrendingUp,
    trendText: '1.2%',
    label: 'Projected',
    value: '48.00%',
  },
]

export default function ChartMetricTooltipDetail({
  locale,
}: ChartMetricTooltipDetailProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f8] text-[#111418] antialiased">
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-gray-200 bg-white px-10 py-3">
        <div className="flex items-center gap-4 text-[#111418]">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#0673e0]/10 text-[#0673e0]">
            <Activity />
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">
            Oxmon
          </h2>
        </div>

        <div className="flex flex-1 justify-end gap-8">
          <div className="flex gap-2">
            <Button
              type="button"
              className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-[#111418] transition-colors hover:bg-gray-200"
            >
              <Bell className="text-[20px]" />
            </Button>
            <Button
              type="button"
              className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-[#111418] transition-colors hover:bg-gray-200"
            >
              <Settings className="text-[20px]" />
            </Button>
          </div>

          <div
            className="size-10 rounded-full bg-cover bg-center bg-no-repeat ring-2 ring-white shadow-sm"
            style={{ backgroundImage: `url(${USER_AVATAR_URL})` }}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-8 sm:px-10">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
              <span>Infrastructure</span>
              <ChevronRight className="text-[14px]" />
              <span>Hosts</span>
              <ChevronRight className="text-[14px]" />
              <span className="font-medium text-[#0673e0]">
                server-production-01
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#111418]">
              CPU Usage History
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            {TIME_RANGE_OPTIONS.map((option, index) => (
              <Button
                type="button"
                key={option}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  index === 0
                    ? 'bg-gray-100 text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-semibold tracking-tight text-[#111418]">
                  Total CPU Utilization
                </h3>
                <p className="mt-1.5 text-base text-[#6E6E73]">
                  Real-time metrics from agent v2.4.1
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Live
              </span>
            </div>
          </div>

          <div className="relative px-6 py-6 sm:px-8">
            <svg
              className="w-full"
              viewBox="0 0 1200 460"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="chartFillGradientTooltipDetail"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#0673e0" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#0673e0" stopOpacity="0.04" />
                </linearGradient>
              </defs>

              {[20, 110, 200, 290, 380].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="1200"
                  y2={y}
                  stroke="#e5e5ea"
                  strokeDasharray="4 4"
                />
              ))}

              <line
                x1="620"
                y1="20"
                x2="620"
                y2="380"
                stroke="#d1d5db"
                strokeDasharray="5 5"
              />

              <path
                d="M80 330 C 150 320, 180 280, 240 250 C 300 220, 350 270, 420 210 C 480 170, 520 240, 620 220 C 700 190, 730 140, 780 145 C 830 150, 880 200, 930 195"
                fill="none"
                stroke="#0673e0"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M80 330 C 150 320, 180 280, 240 250 C 300 220, 350 270, 420 210 C 480 170, 520 240, 620 220 C 700 190, 730 140, 780 145 C 830 150, 880 200, 930 195 L 930 380 L 80 380 Z"
                fill="url(#chartFillGradientTooltipDetail)"
              />

              <circle cx="620" cy="220" r="9" fill="#0673e0" opacity="0.16" />
              <circle
                cx="620"
                cy="220"
                r="5.5"
                fill="#0673e0"
                stroke="white"
                strokeWidth="3"
              />

              <g fill="#6E6E73" fontSize="14" fontWeight="600">
                <text x="32" y="45">
                  0%
                </text>
                <text x="32" y="135">
                  5%
                </text>
                <text x="32" y="225">
                  0%
                </text>
                <text x="32" y="315">
                  5%
                </text>
                <text x="32" y="405">
                  0%
                </text>
              </g>

              <g fill="#6E6E73" fontSize="14" fontWeight="600">
                <text x="80" y="430" textAnchor="middle">
                  10:00
                </text>
                <text x="200" y="430" textAnchor="middle">
                  10:10
                </text>
                <text x="320" y="430" textAnchor="middle">
                  10:20
                </text>
                <text x="440" y="430" textAnchor="middle">
                  10:30
                </text>
                <text
                  x="620"
                  y="430"
                  textAnchor="middle"
                  fontWeight="700"
                  fill="#111418"
                >
                  10:40
                </text>
                <text x="760" y="430" textAnchor="middle">
                  10:50
                </text>
                <text x="900" y="430" textAnchor="middle">
                  11:00
                </text>
                <text x="1060" y="430" textAnchor="middle">
                  11:10
                </text>
              </g>
            </svg>

            <div className="pointer-events-none absolute left-[48%] top-[28%] z-30 mb-4 -translate-x-1/2 -translate-y-full transform sm:left-[50%]">
              <div className="relative min-w-[160px] rounded-lg border border-gray-100 bg-white p-3 shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col gap-2">
                  <div className="mb-0.5 border-b border-gray-100 pb-2">
                    <span className="block text-xs font-bold tracking-wide text-[#6E6E73]">
                      10:42:15 AM
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#0673e0] shadow-sm" />
                      <span className="text-sm font-medium text-gray-500">
                        cpu.usage
                      </span>
                    </div>
                    <span className="tabular-nums text-sm font-bold tracking-tight text-gray-900">
                      45.28%
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                      <span className="text-sm font-medium text-gray-400">
                        avg.load
                      </span>
                    </div>
                    <span className="tabular-nums text-sm font-medium tracking-tight text-gray-500">
                      32.1%
                    </span>
                  </div>
                </div>

                <div className="absolute -bottom-[6px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 transform border-b border-r border-gray-100 bg-white" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {METRIC_CARDS.map((card) => {
            const CardIcon = card.icon
            const TrendIcon = card.trendIcon

            return (
              <article
                key={card.id}
                className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className={`rounded-lg p-2 transition-transform group-hover:scale-110 ${card.iconWrap}`}
                  >
                    <CardIcon />
                  </div>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium ${card.trendWrap}`}
                  >
                    <TrendIcon className="text-[14px]" />
                    {card.trendText}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-gray-500">
                  {card.label}
                </h4>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {card.value}
                </p>
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}
