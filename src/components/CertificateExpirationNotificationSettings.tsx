import Link from 'next/link'

type CertificateExpirationNotificationSettingsProps = {
  locale: 'en' | 'zh'
}

type ThresholdItem = {
  label: string
  description: string
  enabled: boolean
  critical?: boolean
}

type ChannelItem = {
  name: string
  description: string
  icon: 'mail' | 'slack' | 'webhook'
  checked: boolean
}

const THRESHOLD_ITEMS: ThresholdItem[] = [
  {
    label: '30 Days Before',
    description: 'Standard early warning',
    enabled: true,
  },
  {
    label: '15 Days Before',
    description: 'Mid-term reminder',
    enabled: false,
  },
  {
    label: '7 Days Before',
    description: 'Urgent attention required',
    enabled: true,
  },
  {
    label: '1 Day Before',
    description: 'Critical warning',
    enabled: true,
    critical: true,
  },
]

const CHANNEL_ITEMS: ChannelItem[] = [
  {
    name: 'Email',
    description: 'Send to recipient list',
    icon: 'mail',
    checked: true,
  },
  {
    name: 'Slack',
    description: 'Post to #ops channel',
    icon: 'slack',
    checked: false,
  },
  {
    name: 'Webhook',
    description: 'Trigger custom integration',
    icon: 'webhook',
    checked: false,
  },
]

function Toggle({ enabled, id }: { enabled: boolean; id: string }) {
  return (
    <button
      id={id}
      type="button"
      aria-pressed={enabled}
      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
        enabled ? 'bg-[#0071E3]' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function ChannelIcon({ icon }: { icon: ChannelItem['icon'] }) {
  if (icon === 'mail') {
    return <span className="material-symbols-outlined text-[20px] text-gray-500 transition-colors group-hover:text-[#0071E3]">mail</span>
  }

  if (icon === 'webhook') {
    return <span className="material-symbols-outlined text-[20px] text-gray-500 transition-colors group-hover:text-[#0071E3]">webhook</span>
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5 text-gray-500 transition-colors group-hover:text-[#0071E3]" fill="currentColor" viewBox="0 0 24 24">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.52v-6.315zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.52v2.52h-2.52zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.522 2.521 2.527 2.527 0 0 1-2.522-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.522 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.522 2.521A2.527 2.527 0 0 1 15.165 24a2.527 2.527 0 0 1-2.522-2.521v-2.522h2.522zM15.165 17.688a2.527 2.527 0 0 1-2.522-2.522 2.527 2.527 0 0 1 2.522-2.522h6.312A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.522h-6.313z" />
    </svg>
  )
}

export default function CertificateExpirationNotificationSettings({ locale }: CertificateExpirationNotificationSettingsProps) {
  const isZh = locale === 'zh'

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 lg:px-12">
      <div className="mb-6 flex items-center gap-2 text-sm text-[#86868B]">
        <Link href={`/${locale}/certificates`} className="transition-colors hover:text-[#0071E3]">
          {isZh ? '证书' : 'Certificates'}
        </Link>
        <span className="text-[#D2D2D7]">/</span>
        <span className="font-medium text-[#1D1D1F]">{isZh ? '通知设置' : 'Settings'}</span>
      </div>

      <div className="mb-10">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#1D1D1F]">{isZh ? '证书过期通知设置' : 'Certificate Expiration Settings'}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-[#86868B]">
          {isZh
            ? '配置何时以及如何接收即将过期的 SSL/TLS 证书告警。良好的监控可以避免用户侧宕机和安全警告。'
            : 'Configure when and how you receive alerts for expiring SSL/TLS certificates. Proper monitoring prevents downtime and security warnings for your users.'}
        </p>
      </div>

      <div className="space-y-8">
        <section className="overflow-hidden rounded-xl border border-[#D2D2D7]/50 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_-1px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between border-b border-[#D2D2D7]/50 bg-gray-50/50 px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold text-[#1D1D1F]">{isZh ? '通知阈值' : 'Notification Thresholds'}</h3>
              <p className="mt-1 text-sm text-[#86868B]">
                {isZh
                  ? '指定你希望在证书到期前多少天收到通知。'
                  : 'Specify how many days before expiration you want to be notified.'}
              </p>
            </div>
            <span className="material-symbols-outlined text-[#86868B] opacity-50">calendar_clock</span>
          </div>

          <div className="divide-y divide-[#D2D2D7]/50">
            {THRESHOLD_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50">
                <div className="flex flex-col">
                  <span className="font-medium text-[#1D1D1F]">{item.label}</span>
                  <span className={`text-sm ${item.critical ? 'font-medium text-red-500' : 'text-[#86868B]'}`}>
                    {item.description}
                  </span>
                </div>
                <Toggle enabled={item.enabled} id={`toggle-${item.label.replaceAll(' ', '-').toLowerCase()}`} />
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#D2D2D7]/50 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_-1px_rgba(0,0,0,0.02)]">
          <div className="border-b border-[#D2D2D7]/50 bg-gray-50/50 px-6 py-5">
            <h3 className="text-lg font-semibold text-[#1D1D1F]">{isZh ? '通知渠道' : 'Delivery Channels'}</h3>
            <p className="mt-1 text-sm text-[#86868B]">
              {isZh ? '选择你希望接收这些通知的位置。' : 'Choose where you want to receive these notifications.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
            {CHANNEL_ITEMS.map((channel) => (
              <label
                key={channel.name}
                className="group flex cursor-pointer items-start gap-3 rounded-lg border border-[#D2D2D7] p-4 transition-all hover:border-[#0071E3]/50 hover:bg-blue-50/50"
              >
                <div className="mt-1">
                  <input
                    type="checkbox"
                    defaultChecked={channel.checked}
                    className="h-5 w-5 rounded border-gray-300 text-[#0071E3] transition duration-150 ease-in-out focus:ring-[#0071E3]/20"
                    aria-label={`${channel.name} channel`}
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <ChannelIcon icon={channel.icon} />
                    <span className="font-semibold text-[#1D1D1F] transition-colors group-hover:text-[#0071E3]">{channel.name}</span>
                  </div>
                  <p className="text-xs text-[#86868B]">{channel.description}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#D2D2D7]/50 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_-1px_rgba(0,0,0,0.02)]">
          <div className="border-b border-[#D2D2D7]/50 bg-gray-50/50 px-6 py-5">
            <h3 className="text-lg font-semibold text-[#1D1D1F]">{isZh ? '告警详情' : 'Alert Details'}</h3>
            <p className="mt-1 text-sm text-[#86868B]">
              {isZh ? '细化谁会收到消息以及发送频率。' : 'Fine-tune who receives the message and how often.'}
            </p>
          </div>

          <div className="space-y-6 p-6">
            <div>
              <label htmlFor="recipients" className="mb-2 block text-sm font-semibold text-[#1D1D1F]">
                {isZh ? '收件人列表' : 'Recipient List'}
              </label>
              <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-[#D2D2D7] bg-white p-2 transition-shadow focus-within:border-[#0071E3] focus-within:ring-2 focus-within:ring-[#0071E3]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0071E3]/20 bg-[#0071E3]/10 px-2.5 py-1 text-xs font-medium text-[#0071E3]">
                  admin@oxmon.com
                  <button type="button" className="hover:text-[#0077ED] focus:outline-none">
                    <span className="material-symbols-outlined align-middle text-[14px]">close</span>
                  </button>
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0071E3]/20 bg-[#0071E3]/10 px-2.5 py-1 text-xs font-medium text-[#0071E3]">
                  security-team@oxmon.com
                  <button type="button" className="hover:text-[#0077ED] focus:outline-none">
                    <span className="material-symbols-outlined align-middle text-[14px]">close</span>
                  </button>
                </span>

                <input
                  id="recipients"
                  type="text"
                  placeholder={isZh ? '添加邮箱地址...' : 'Add email address...'}
                  className="min-w-[150px] flex-1 border-none bg-transparent p-1 text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:ring-0 focus:outline-none"
                />
              </div>
              <p className="mt-2 text-xs text-[#86868B]">{isZh ? '按回车可添加多个收件人。' : 'Press Enter to add multiple recipients.'}</p>
            </div>

            <div className="max-w-md">
              <label htmlFor="frequency" className="mb-2 block text-sm font-semibold text-[#1D1D1F]">
                {isZh ? '通知频率' : 'Notification Frequency'}
              </label>
              <div className="relative">
                <select
                  id="frequency"
                  className="block w-full cursor-pointer rounded-lg border border-[#D2D2D7] bg-white py-2.5 pr-10 pl-3 text-sm text-[#1D1D1F] shadow-sm transition-colors hover:border-gray-400 focus:border-[#0071E3] focus:ring-[#0071E3]"
                  defaultValue="once"
                >
                  <option value="once">{isZh ? '每个阈值仅通知一次' : 'Notify Once per threshold'}</option>
                  <option value="daily">{isZh ? '每日提醒直到解决' : 'Daily Reminders until resolved'}</option>
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <span className="material-symbols-outlined text-[20px] text-[#86868B]">expand_more</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-[#86868B]">
                {isZh
                  ? '“每日提醒”会在首次达到阈值后每 24 小时重发一次告警。'
                  : '"Daily Reminders" will resend the alert every 24 hours after the first threshold is met.'}
              </p>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-4 pt-4 pb-12">
          <Link
            href={`/${locale}/certificate-chain-visual-path`}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-[#86868B] transition-colors hover:bg-gray-100 hover:text-[#1D1D1F]"
          >
            {isZh ? '返回链路' : 'Back to chain'}
          </Link>
          <Link
            href={`/${locale}/certificate-status-report-pdf-preview`}
            className="rounded-lg bg-[#0071E3] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#0077ED] hover:shadow-md focus:ring-2 focus:ring-[#0071E3] focus:ring-offset-2"
          >
            {isZh ? '保存并预览 PDF' : 'Save & Preview PDF'}
          </Link>
        </div>
      </div>
    </div>
  )
}
