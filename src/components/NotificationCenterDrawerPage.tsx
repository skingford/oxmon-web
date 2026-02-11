type NotificationCenterDrawerPageProps = {
  locale: 'en' | 'zh'
}

type NotificationTone = 'critical' | 'warning' | 'success' | 'info' | 'security' | 'mail'

type NotificationItem = {
  title: string
  description: string
  time: string
  tone: NotificationTone
  unread?: boolean
}

const TODAY_NOTIFICATIONS: NotificationItem[] = [
  {
    title: 'Agent web-01 Offline',
    description: 'Critical connection lost to the main server instance in US-East region.',
    time: '5m ago',
    tone: 'critical',
    unread: true,
  },
  {
    title: 'High Memory Usage',
    description: 'Database DB-04 is running at 92% capacity. Consider scaling up resources.',
    time: '2h ago',
    tone: 'warning',
    unread: true,
  },
  {
    title: 'Deploy Successful',
    description: 'Production build v2.4.0 was successfully deployed.',
    time: '4h ago',
    tone: 'success',
  },
]

const EARLIER_NOTIFICATIONS: NotificationItem[] = [
  {
    title: 'Backup Completed',
    description: 'Daily snapshot created for cluster-01. Total size: 450GB.',
    time: 'Yesterday',
    tone: 'info',
  },
  {
    title: 'New Login Detected',
    description: 'New login from IP 192.168.1.1 (London, UK).',
    time: 'Yesterday',
    tone: 'security',
  },
  {
    title: 'Weekly Report Ready',
    description: 'Your weekly analytics summary is ready for review.',
    time: '2 days ago',
    tone: 'mail',
  },
]

function getToneStyle(tone: NotificationTone): { icon: string; className: string } {
  if (tone === 'critical') {
    return {
      icon: 'error',
      className: 'bg-red-100 text-red-600',
    }
  }

  if (tone === 'warning') {
    return {
      icon: 'warning',
      className: 'bg-amber-100 text-amber-600',
    }
  }

  if (tone === 'success') {
    return {
      icon: 'check_circle',
      className: 'bg-green-100 text-green-600',
    }
  }

  if (tone === 'info') {
    return {
      icon: 'info',
      className: 'bg-blue-100 text-[#0d7ff2]',
    }
  }

  if (tone === 'security') {
    return {
      icon: 'security',
      className: 'bg-purple-100 text-purple-600',
    }
  }

  return {
    icon: 'mail',
    className: 'bg-gray-100 text-gray-500',
  }
}

function NotificationItemRow({ item }: { item: NotificationItem }) {
  const toneStyle = getToneStyle(item.tone)

  return (
    <button
      type="button"
      className="group relative flex w-full cursor-pointer gap-4 border-b border-[#E5E5EA] px-6 py-4 text-left transition-colors hover:bg-gray-50"
    >
      {item.unread ? (
        <span className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#0d7ff2]" />
      ) : null}

      <div
        className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneStyle.className}`}
      >
        <span className="material-symbols-outlined text-[20px]">{toneStyle.icon}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-start justify-between gap-3">
          <h3 className="truncate pr-2 text-sm font-semibold text-[#1F2937]">{item.title}</h3>
          <span className="whitespace-nowrap text-xs text-[#6B7280]">{item.time}</span>
        </div>
        <p className="text-sm leading-snug text-[#6B7280]">{item.description}</p>
      </div>
    </button>
  )
}

export default function NotificationCenterDrawerPage({ locale }: NotificationCenterDrawerPageProps) {
  const isZh = locale === 'zh'

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#f5f7f8] font-sans text-[#1F2937] antialiased">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 flex h-full w-full gap-8 p-6 opacity-35">
        <div className="h-full w-64 rounded-2xl bg-gray-300/80" />
        <div className="flex flex-1 flex-col gap-6">
          <div className="h-36 w-full rounded-2xl bg-gray-300/80" />
          <div className="grid flex-1 grid-cols-2 gap-6">
            <div className="rounded-2xl bg-gray-300/80" />
            <div className="rounded-2xl bg-gray-300/80" />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-10 bg-black/20 backdrop-blur-[1px]" />

      <aside className="absolute right-0 top-0 z-20 flex h-full w-full max-w-[420px] flex-col border-l border-[#E5E5EA]/70 bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.08)]">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E5E5EA] bg-white/95 px-6 py-[22px] backdrop-blur-sm">
          <h2 className="text-xl font-semibold tracking-tight text-[#1F2937]">
            {isZh ? '通知' : 'Notifications'}
          </h2>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-sm font-medium text-[#0d7ff2] transition-colors hover:text-blue-600"
            >
              {isZh ? '全部标记已读' : 'Mark all as read'}
            </button>

            <button
              type="button"
              className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label={isZh ? '关闭通知抽屉' : 'Close notifications drawer'}
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex flex-col">
            <div className="sticky top-0 z-10 border-b border-[#E5E5EA]/70 bg-gray-50/80 px-6 py-3 backdrop-blur-sm">
              <p className="text-xs font-semibold tracking-wider text-[#6B7280] uppercase">{isZh ? '今天' : 'Today'}</p>
            </div>

            {TODAY_NOTIFICATIONS.map((notification) => (
              <NotificationItemRow
                key={`${notification.title}-${notification.time}`}
                item={notification}
              />
            ))}
          </div>

          <div className="mt-2 flex flex-col">
            <div className="sticky top-0 z-10 border-b border-[#E5E5EA]/70 bg-gray-50/80 px-6 py-3 backdrop-blur-sm">
              <p className="text-xs font-semibold tracking-wider text-[#6B7280] uppercase">{isZh ? '更早' : 'Earlier'}</p>
            </div>

            {EARLIER_NOTIFICATIONS.map((notification) => (
              <NotificationItemRow
                key={`${notification.title}-${notification.time}`}
                item={notification}
              />
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 z-30 border-t border-[#E5E5EA] bg-white px-6 py-4">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-[#6B7280] transition-all hover:bg-gray-100 hover:text-[#1F2937]"
          >
            <span>{isZh ? '查看全部通知' : 'View All Notifications'}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </aside>
    </div>
  )
}
