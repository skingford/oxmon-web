import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { BellRing, ChevronRight, EyeOff, Link, Mail, Send, Server, User, Zap } from 'lucide-react'

type GlobalNotificationChannelSettingsProps = {
  locale: 'en' | 'zh'
}

type ConfigNavItem = {
  key: string
  label: string
  active?: boolean
}

const CONFIG_NAV_ITEMS: ConfigNavItem[] = [
  { key: 'general', label: 'General', active: true },
  { key: 'email', label: 'Email (SMTP)' },
  { key: 'slack', label: 'Slack Webhook' },
]

export default function GlobalNotificationChannelSettings({ locale }: GlobalNotificationChannelSettingsProps) {
  const isZh = locale === 'zh'

  return (
    <div className="flex min-w-0 flex-col pb-6 font-sans text-[#1D1D1F] antialiased">
      <div className="rounded-2xl bg-[#F5F5F7] p-8">
          <div className="mx-auto flex max-w-5xl items-start gap-8">
            <div className="sticky top-0 hidden w-64 shrink-0 lg:block">
              <div className="flex flex-col gap-1">
                <h3 className="px-3 pb-2 text-xs font-semibold tracking-wider text-[#86868B] uppercase">
                  {isZh ? '配置' : 'Configuration'}
                </h3>

                {CONFIG_NAV_ITEMS.map((item) => (
                  <a
                    key={item.key}
                    href={`#${item.key}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      item.active
                        ? 'bg-white text-[#0071E3] ring-1 ring-[#D2D2D7]/20 shadow-sm'
                        : 'text-[#86868B] hover:bg-white hover:text-[#1D1D1F] hover:shadow-sm'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.active ? <ChevronRight className="text-[16px]" /> : null}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-8">
              <section id="general" className="flex flex-col gap-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1D1D1F]">{isZh ? '通用设置' : 'General Settings'}</h2>
                    <p className="mt-1 text-sm text-[#86868B]">
                      {isZh
                        ? '统一控制所有渠道的通知行为。'
                        : 'Control global notification behavior across all channels.'}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-[#D2D2D7]/40 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_5px_15px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between gap-4 p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0071E3]/10 text-[#0071E3]">
                        <BellRing />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-medium text-[#1D1D1F]">{isZh ? '启用全局通知' : 'Enable Global Notifications'}</span>
                        <span className="text-sm text-[#86868B]">
                          {isZh
                            ? '主开关：可立即暂停或恢复所有外发告警。'
                            : 'Master switch to pause or resume all outgoing alerts immediately.'}
                        </span>
                      </div>
                    </div>

                    <Switch
                      defaultChecked
                      aria-label={isZh ? '启用全局通知' : 'Enable global notifications'}
                      className="h-6 w-11 bg-gray-200 data-[state=checked]:bg-[#0071E3]"
                    />
                  </div>
                </div>
              </section>

              <section id="email" className="flex flex-col gap-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1D1D1F]">Email (SMTP)</h2>
                    <p className="mt-1 text-sm text-[#86868B]">
                      {isZh
                        ? '配置邮件告警的 SMTP 出站服务器。'
                        : 'Configure your outgoing mail server for email alerts.'}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    {isZh ? '已启用' : 'Active'}
                  </span>
                </div>

                <div className="rounded-xl border border-[#D2D2D7]/40 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_5px_15px_rgba(0,0,0,0.02)]">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-server" className="block text-sm font-medium text-[#86868B]">SMTP Server</Label>
                        <div className="relative">
                          <Input
                            id="smtp-server"
                            type="text"
                            value="smtp.mailgun.org"
                            readOnly
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-[#0071E3] focus:ring-[#0071E3]"
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                            <Server className="text-[20px]" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="smtp-port" className="block text-sm font-medium text-[#86868B]">Port</Label>
                        <Input
                          id="smtp-port"
                          type="number"
                          value="587"
                          readOnly
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-[#0071E3] focus:ring-[#0071E3]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="smtp-username" className="block text-sm font-medium text-[#86868B]">Username</Label>
                        <div className="relative">
                          <Input
                            id="smtp-username"
                            type="text"
                            value="postmaster@oxmon.io"
                            readOnly
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-[#0071E3] focus:ring-[#0071E3]"
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                            <User className="text-[20px]" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="smtp-password" className="block text-sm font-medium text-[#86868B]">Password</Label>
                        <div className="relative">
                          <Input
                            id="smtp-password"
                            type="password"
                            value="supersecretpassword"
                            readOnly
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-[#0071E3] focus:ring-[#0071E3]"
                          />
                          <div className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400 transition-colors hover:text-gray-600">
                            <EyeOff className="text-[20px]" />
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1 space-y-2 md:col-span-2">
                        <Label htmlFor="sender-address" className="block text-sm font-medium text-[#86868B]">Sender Address (From)</Label>
                        <div className="relative">
                          <Input
                            id="sender-address"
                            type="email"
                            value="alerts@oxmon.io"
                            readOnly
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-[#0071E3] focus:ring-[#0071E3]"
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                            <Mail className="text-[20px]" />
                          </div>
                        </div>
                        <p className="text-xs text-[#86868B]">
                          {isZh
                            ? '该邮箱地址将显示在通知邮件的 “From” 字段中。'
                            : 'This email address will appear in the "From" field of the notifications.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#D2D2D7]/40 pt-4">
                      <Button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#1D1D1F] shadow-sm transition-all hover:bg-gray-50 focus:ring-2 focus:ring-[#0071E3] focus:ring-offset-2 focus:outline-none"
                      >
                        <Send className="text-[18px]" />
                        {isZh ? '测试连接' : 'Test Connection'}
                      </Button>

                      <div className="flex gap-3">
                        <Button type="button" className="px-3 py-2 text-sm font-medium text-[#86868B] transition-colors hover:text-[#1D1D1F]">
                          {isZh ? '取消' : 'Cancel'}
                        </Button>
                        <Button
                          type="submit"
                          className="inline-flex justify-center rounded-lg border border-transparent bg-[#0071E3] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#0077ED] focus:ring-2 focus:ring-[#0071E3] focus:ring-offset-2 focus:outline-none"
                        >
                          {isZh ? '保存更改' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </section>

              <section id="slack" className="flex flex-col gap-4 pb-20">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1D1D1F]">Slack Webhook</h2>
                    <p className="mt-1 text-sm text-[#86868B]">
                      {isZh
                        ? '通过 Incoming Webhooks 直接将告警发送到 Slack 频道。'
                        : 'Send alerts directly to a Slack channel via Incoming Webhooks.'}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                    {isZh ? '未配置' : 'Not Configured'}
                  </span>
                </div>

                <div className="rounded-xl border border-[#D2D2D7]/40 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_5px_15px_rgba(0,0,0,0.02)]">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="webhook-url" className="block text-sm font-medium text-[#86868B]">Webhook URL</Label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <Link className="text-[20px]" />
                          </div>
                          <Input
                            id="webhook-url"
                            type="url"
                            placeholder="https://example.com/slack-webhook"
                            className="block w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-10 text-sm shadow-sm focus:border-[#0071E3] focus:ring-[#0071E3]"
                          />
                        </div>
                        <p className="text-xs text-[#86868B]">
                          {isZh
                            ? '粘贴 Slack App 管理页面提供的完整 Webhook URL。'
                            : 'Paste the full Webhook URL provided by Slack App management.'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="channel-name" className="block text-sm font-medium text-[#86868B]">Default Channel</Label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <span className="text-sm font-bold">#</span>
                          </div>
                          <Input
                            id="channel-name"
                            type="text"
                            placeholder="alerts-infrastructure"
                            className="block w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-8 text-sm shadow-sm focus:border-[#0071E3] focus:ring-[#0071E3]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#D2D2D7]/40 pt-4">
                      <Button
                        type="button"
                        disabled
                        className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#1D1D1F] opacity-50 shadow-sm"
                      >
                        <Zap className="text-[18px]" />
                        {isZh ? '发送测试消息' : 'Send Test Message'}
                      </Button>

                      <div className="flex gap-3">
                        <Button type="button" className="px-3 py-2 text-sm font-medium text-[#86868B] transition-colors hover:text-[#1D1D1F]">
                          {isZh ? '取消' : 'Cancel'}
                        </Button>
                        <Button
                          type="submit"
                          className="inline-flex justify-center rounded-lg border border-transparent bg-[#0071E3] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#0077ED] focus:ring-2 focus:ring-[#0071E3] focus:ring-offset-2 focus:outline-none"
                        >
                          {isZh ? '保存更改' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </section>
            </div>
          </div>
      </div>
    </div>
  )
}
