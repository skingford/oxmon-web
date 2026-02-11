type DomainRow = {
  domain: string
  subLabel: string
  port: string
  enabled: boolean
  interval: string
  lastChecked: string
  paused?: boolean
}

const SIDEBAR_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCkF8F0vB-DHSZBgriuiaKUQ8gQv8QE8dHr-VglFUPwFDzu4XRmqAts_12gUvDG6orKocB3XWaKRW4ayiCMKwItIO1R3ewtBgKtIqGNMZDRrVM0xNjGLaPN-nevVV6euwppQ-IvIxr-kGB9FmQLfuYeNhLuY5JGQ9oFE1ZiEaL06--38B_13D703efDFvbrvBg9l7yoqeRUt4fX0jfHjzNfFo7Z8FN_nZ7al6785eV9Z9Kc2iSsdW9b5GrWE82OJG0YC2UWOKwnPEY'

const DOMAIN_ROWS: DomainRow[] = [
  {
    domain: 'api.oxmon.com',
    subLabel: 'Expires in 290 days',
    port: '443',
    enabled: true,
    interval: '10m',
    lastChecked: '2 mins ago',
  },
  {
    domain: 'www.google.com',
    subLabel: 'Expires in 45 days',
    port: '443',
    enabled: true,
    interval: '5m',
    lastChecked: '1 min ago',
  },
  {
    domain: 'shop.mysite.io',
    subLabel: 'Monitoring Paused',
    port: '8443',
    enabled: false,
    interval: '1h',
    lastChecked: '5 hours ago',
    paused: true,
  },
  {
    domain: 'dev-server.internal',
    subLabel: 'Expires in 12 days',
    port: '443',
    enabled: true,
    interval: '30m',
    lastChecked: '15 mins ago',
  },
]

function ToggleSwitch({ checked }: { checked: boolean }) {
  return (
    <button
      type="button"
      className={`relative -top-px inline-flex h-6 w-11 items-center rounded-full transition-colors duration-150 ease-out ${checked ? 'bg-[#34c759]' : 'bg-[#e5e7eb]'}`}
      aria-label={checked ? 'Enabled' : 'Disabled'}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-transform duration-150 ease-out ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  )
}

export default function DomainManagementTabPage() {
  return (
    <div className="relative flex min-h-screen w-full overflow-x-hidden bg-[#f5f7f8] font-sans text-[#111418] antialiased">
      <aside className="hidden h-screen w-[280px] shrink-0 flex-col border-r border-[#d7dde4] bg-[#f6f7f9] lg:flex">
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 px-2 py-3">
              <div
                className="size-10 shrink-0 rounded-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${SIDEBAR_AVATAR})` }}
              />
              <div className="flex min-w-0 flex-col">
                <h1 className="truncate text-base font-semibold leading-tight text-[#2b3137]">Oxmon</h1>
                <p className="mt-[5px] truncate text-sm font-normal leading-tight text-[#60758a]">Admin Console</p>
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              <a href="#" className="group flex items-center gap-3 rounded-[11px] px-3 py-[10px] transition-colors duration-150 ease-out hover:bg-[#f1f4f7] active:bg-[#e9eef4]">
                <span className="material-symbols-outlined text-[20px] text-[#60758a] transition-colors duration-150 ease-out group-hover:text-[#2587e8]">bar_chart</span>
                <p className="text-sm font-medium leading-normal text-[#2e343b]">Dashboard</p>
              </a>
              <a href="#" className="flex items-center gap-3 rounded-[11px] bg-[#dce9f8] px-3 py-[10px] text-[#2587e8]">
                <span className="material-symbols-outlined filled text-[20px] text-[#2587e8]">verified_user</span>
                <p className="text-sm font-medium leading-normal">Certificates</p>
              </a>
              <a href="#" className="group flex items-center gap-3 rounded-[11px] px-3 py-[10px] transition-colors duration-150 ease-out hover:bg-[#f1f4f7] active:bg-[#e9eef4]">
                <span className="material-symbols-outlined text-[20px] text-[#60758a] transition-colors duration-150 ease-out group-hover:text-[#2587e8]">dns</span>
                <p className="text-sm font-medium leading-normal text-[#2e343b]">Monitors</p>
              </a>
              <a href="#" className="group flex items-center gap-3 rounded-[11px] px-3 py-[10px] transition-colors duration-150 ease-out hover:bg-[#f1f4f7] active:bg-[#e9eef4]">
                <span className="material-symbols-outlined text-[20px] text-[#60758a] transition-colors duration-150 ease-out group-hover:text-[#2587e8]">notifications</span>
                <p className="text-sm font-medium leading-normal text-[#2e343b]">Alerts</p>
              </a>
              <a href="#" className="group flex items-center gap-3 rounded-[11px] px-3 py-[10px] transition-colors duration-150 ease-out hover:bg-[#f1f4f7] active:bg-[#e9eef4]">
                <span className="material-symbols-outlined text-[20px] text-[#60758a] transition-colors duration-150 ease-out group-hover:text-[#2587e8]">settings</span>
                <p className="text-sm font-medium leading-normal text-[#2e343b]">Settings</p>
              </a>
            </nav>
          </div>

          <div className="px-2 pb-2">
            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-150 ease-out hover:bg-[#f1f4f7] active:bg-[#e9eef4]">
              <span className="material-symbols-outlined text-[20px] text-[#60758a]">logout</span>
              <p className="text-sm font-medium leading-normal text-[#2e343b]">Sign Out</p>
            </a>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-[#f5f7f8]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col p-4 md:p-8">
          <div className="flex flex-col gap-1 pb-6">
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-[#12161b] md:text-3xl">SSL Certificates</h2>
            <p className="text-sm font-normal leading-normal text-[#60758a] md:text-base">Manage and monitor your SSL domains</p>
          </div>

          <div className="mb-5 border-b border-[#d8dee5]">
            <div className="flex gap-6 md:gap-8">
              <a href="#" className="relative flex items-center border-b-2 border-[#2587e8] px-1 pb-3 text-sm font-semibold leading-normal text-[#2587e8]">
                Domain Management
              </a>
              <a href="#" className="relative flex items-center border-b-2 border-transparent px-1 pb-3 text-sm font-medium leading-normal text-[#60758a] transition-colors duration-150 ease-out hover:text-[#111418] active:text-[#3f4c5a]">
                Alert Rules
              </a>
              <a href="#" className="relative flex items-center border-b-2 border-transparent px-1 pb-3 text-sm font-medium leading-normal text-[#60758a] transition-colors duration-150 ease-out hover:text-[#111418] active:text-[#3f4c5a]">
                Logs
              </a>
            </div>
          </div>

          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[352px]">
              <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                <span className="material-symbols-outlined text-[20px] leading-none text-[#9ca3af]">search</span>
              </div>
              <input
                type="text"
                placeholder="Search domains..."
                className="block h-[46px] w-full rounded-[14px] border-none bg-white py-2.5 pl-11 pr-3 text-sm leading-normal text-[#111418] placeholder-[#9ca3af] shadow-[0_1px_2px_rgba(16,24,40,0.045)] outline-none ring-2 ring-transparent transition duration-150 ease-out focus:ring-[#2587e8]/35"
              />
            </div>

            <div className="flex w-full gap-3 sm:w-auto">
              <button
                type="button"
                className="h-[46px] flex-1 rounded-[14px] border border-[#d8dee5] bg-white px-5 text-sm font-medium leading-normal text-[#111418] shadow-[0_1px_2px_rgba(16,24,40,0.045)] transition-colors duration-150 ease-out hover:bg-[#f8fafc] active:bg-[#eef2f6] sm:flex-none"
              >
                Bulk Add
              </button>
              <button
                type="button"
                className="flex h-[46px] flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-[#2587e8] px-5 text-sm font-semibold leading-normal text-white shadow-[0_1px_2px_rgba(37,135,232,0.18)] transition-colors duration-150 ease-out hover:bg-[#2587e8]/90 active:bg-[#227fdc] sm:flex-none"
              >
                <span className="material-symbols-outlined relative -top-px text-[18px] leading-none">add</span>
                Add Domain
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-[#d2d9e1] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.045),0_1px_1px_rgba(16,24,40,0.018)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[930px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#d7dee6] bg-[#f7f8fa]">
                    <th className="px-[22px] py-[15px] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6f8397]">Domain</th>
                    <th className="px-[22px] py-[15px] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6f8397]">Port</th>
                    <th className="px-[22px] py-[15px] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6f8397]">Enabled</th>
                    <th className="px-[22px] py-[15px] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6f8397]">Interval</th>
                    <th className="px-[22px] py-[15px] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6f8397]">Last Checked</th>
                    <th className="px-[22px] py-[15px] text-right text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6f8397]">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#d9e0e7]">
                  {DOMAIN_ROWS.map((row) => (
                    <tr key={row.domain} className="group transition-colors duration-150 ease-out hover:bg-[#f9fbfd]">
                      <td className="px-[22px] py-[15px]">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${row.paused ? 'bg-[#edf1f4]' : 'bg-[#e9f2ff]'}`}>
                            <span className={`material-symbols-outlined relative -top-px text-[18px] leading-none ${row.paused ? 'text-[#7e8896]' : 'text-[#2587e8]'}`}>
                              language
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-normal text-[#2e343b]">{row.domain}</p>
                            <p className="mt-[2px] text-xs font-normal leading-normal text-[#6f8397]">{row.subLabel}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-[22px] py-[15px] align-middle"><span className="relative -top-px block text-sm font-medium leading-normal text-[#6f8397]">{row.port}</span></td>
                      <td className="px-[22px] py-[15px] align-middle">
                        <div className="relative -top-px">
                          <ToggleSwitch checked={row.enabled} />
                        </div>
                      </td>
                      <td className="w-[124px] rounded-[10px] bg-[#f3f4f6] px-[22px] py-[15px] align-middle"><span className="relative -top-px block text-sm font-medium leading-normal text-[#2e343b]">{row.interval}</span></td>
                      <td className="px-[22px] py-[15px] align-middle">
                        <div className="relative -top-px flex items-center gap-2 text-sm font-normal leading-normal text-[#6f8397]">
                          <span className={`h-2.5 w-2.5 rounded-full ${row.paused ? 'bg-[#cfd5dc]' : 'bg-[#27c184]'}`} />
                          {row.lastChecked}
                        </div>
                      </td>
                      <td className="px-[22px] py-[15px] text-right">
                        <div className="relative -right-px flex items-center justify-end gap-[7px] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100">
                          <button
                            type="button"
                            className="rounded-lg p-2 text-[#60758a] transition-colors duration-150 ease-out hover:bg-[#f2f5f8] hover:text-[#2587e8] active:bg-[#e8edf3]"
                            title="Detect Now"
                          >
                            <span className="material-symbols-outlined relative -top-px text-[20px] leading-none">refresh</span>
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 text-[#60758a] transition-colors duration-150 ease-out hover:bg-[#f2f5f8] hover:text-[#2587e8] active:bg-[#e8edf3]"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined relative -top-px text-[20px] leading-none">edit</span>
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 text-[#60758a] transition-colors duration-150 ease-out hover:bg-[#fff3f2] hover:text-red-500 active:bg-[#ffe9e7]"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined relative -top-px text-[20px] leading-none">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[#d9e0e7] bg-white px-[22px] py-[15px]">
              <p className="text-sm font-normal leading-normal text-[#6f8397]">
                Showing <span className="font-medium text-[#2e343b]">1</span> to <span className="font-medium text-[#2e343b]">4</span> of{' '}
                <span className="font-medium text-[#2e343b]">12</span> results
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg p-2 text-[#6f8397] transition-colors duration-150 ease-out hover:bg-[#f2f5f8] active:bg-[#e8edf3]"
                  aria-label="Previous page"
                >
                  <span className="material-symbols-outlined relative -top-px text-[20px] leading-none">chevron_left</span>
                </button>
                <button
                  type="button"
                  className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-[#eef1f4] text-sm font-medium leading-normal text-[#2e343b]"
                >
                  1
                </button>
                <button
                  type="button"
                  className="flex h-[35px] w-[35px] items-center justify-center rounded-full text-sm font-medium leading-normal text-[#6f8397] transition-colors duration-150 ease-out hover:bg-[#f2f5f8] active:bg-[#e8edf3]"
                >
                  2
                </button>
                <button
                  type="button"
                  className="flex h-[35px] w-[35px] items-center justify-center rounded-full text-sm font-medium leading-normal text-[#6f8397] transition-colors duration-150 ease-out hover:bg-[#f2f5f8] active:bg-[#e8edf3]"
                >
                  3
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-[#6f8397] transition-colors duration-150 ease-out hover:bg-[#f2f5f8] active:bg-[#e8edf3]"
                  aria-label="Next page"
                >
                  <span className="material-symbols-outlined relative -top-px text-[20px] leading-none">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
