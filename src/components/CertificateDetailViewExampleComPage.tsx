import Link from 'next/link'

type CertificateDetailViewExampleComPageProps = {
  locale: 'en' | 'zh'
}

const USER_AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA95vzPTIcGKtPPCsXaD-bkSaGPpARS440ek20nS0MIVRMJP_4b-1mRpgHcCfmtNMI7oaK7wfHD6scc66UlO52IoKD8aJSUMUhR-niv1vqz7UisTNfzqbIYORewTT62EH_E5aD9wvlyQdsjoeem_9akzueRhwXtR6Dqoat1F1L2xRpJOVgljOZoFzoHoEXcla8omG87klynnaej8bQ6DWGt6qvD_dxJoRjm5D2_CuoGwtKa3wh5jpIPT_y8D3307yK_aUtyfXv579c'

const BREADCRUMBS = [
  { label: 'Certificates', href: '#' },
  { label: 'Managed Domains', href: '#' },
] as const

const OVERVIEW_ROWS = [
  { label: 'Common Name (CN)', value: 'example.com', copyable: true },
  { label: 'Issuer Organization', value: "Let's Encrypt (R3)", icon: 'L' },
  {
    label: 'Remaining Validity',
    value: '90 Days',
    badge: 'Safe',
  },
  { label: 'Valid From', value: 'Oct 24, 2023 10:00 UTC', mono: true },
  { label: 'Expires On', value: 'Jan 22, 2024 10:00 UTC', mono: true },
] as const

const SAN_ROWS = [
  { name: 'example.com', type: 'DNS' },
  { name: 'www.example.com', type: 'DNS' },
  { name: 'api.example.com', type: 'DNS' },
] as const

const IP_ROWS = [
  { ip: '192.168.1.1', status: 'Active' },
  { ip: '2606:4700:3031::ac43:a6f5', status: 'Active' },
] as const

const CHAIN_ROWS = [
  {
    icon: 'account_balance',
    title: 'ISRG Root X1',
    subtitle: 'Root CA • Valid until 2035',
    leaf: false,
  },
  {
    icon: 'apartment',
    title: "R3 (Let's Encrypt)",
    subtitle: 'Intermediate CA • Valid until 2025',
    leaf: false,
  },
  {
    icon: 'language',
    title: 'example.com',
    subtitle: 'Leaf Certificate • Expires in 90 days',
    leaf: true,
  },
] as const

export default function CertificateDetailViewExampleComPage({ locale }: CertificateDetailViewExampleComPageProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f5f7f8] font-sans text-[#111827] antialiased">
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-[#e5e7eb] bg-white/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-[#0073e6]">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#0073e6] text-white">
              <span className="material-symbols-outlined text-[20px]">security</span>
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-tight text-[#111827]">Oxmon</h2>
          </div>

          <label className="hidden !h-9 min-w-40 max-w-64 flex-col md:flex">
            <div className="group flex h-full w-full flex-1 items-stretch rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-[#0073e6]/20">
              <div className="flex items-center justify-center rounded-l-lg bg-[#f3f4f6] pl-3 text-[#6b7280]">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </div>
              <input
                value=""
                readOnly
                placeholder="Search resources..."
                className="form-input h-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg rounded-l-none border-none bg-[#f3f4f6] px-3 pl-2 text-sm font-normal leading-normal text-[#111827] placeholder:text-[#9ca3af] focus:border-none focus:outline-0 focus:ring-0"
              />
            </div>
          </label>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-6 lg:flex">
            <Link href="#" className="text-sm font-medium leading-normal text-[#6b7280] transition-colors hover:text-[#0073e6]">
              Dashboard
            </Link>
            <Link href="#" className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium leading-normal text-[#111827]">
              Certificates
            </Link>
            <Link href="#" className="text-sm font-medium leading-normal text-[#6b7280] transition-colors hover:text-[#0073e6]">
              Infrastructure
            </Link>
            <Link href="#" className="text-sm font-medium leading-normal text-[#6b7280] transition-colors hover:text-[#0073e6]">
              Alerts
            </Link>
          </nav>

          <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
            <button type="button" className="relative text-[#6b7280] transition-colors hover:text-[#111827]">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute right-0 top-0 size-2 rounded-full border-2 border-white bg-red-500" />
            </button>

            <div className="size-9 cursor-pointer rounded-full bg-cover bg-center bg-no-repeat ring-2 ring-gray-100" style={{ backgroundImage: `url(${USER_AVATAR_URL})` }} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 p-6 md:p-8 lg:px-12">
        <nav className="mb-6 flex items-center text-sm text-[#6b7280]">
          <Link href={`/${locale}/dashboard`} className="flex items-center gap-1 transition-colors hover:text-[#0073e6]">
            <span className="material-symbols-outlined text-[18px]">home</span>
          </Link>
          {BREADCRUMBS.map((item) => (
            <div key={item.label} className="flex items-center">
              <span className="mx-2 text-gray-300">/</span>
              <Link href={item.href} className="transition-colors hover:text-[#0073e6]">
                {item.label}
              </Link>
            </div>
          ))}
          <span className="mx-2 text-gray-300">/</span>
          <span className="font-medium text-[#111827]">example.com</span>
        </nav>

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="mb-1 flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">example.com</h1>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                <span className="mr-1.5 size-1.5 rounded-full bg-green-600" />
                Active
              </span>
            </div>
            <p className="text-sm text-[#6b7280] md:text-base">SSL/TLS Certificate details and verification status.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#111827] shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50"
            >
              <span className="material-symbols-outlined mr-2 text-[18px]">download</span>
              Download
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-[#0073e6] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0073e6]/90"
            >
              <span className="material-symbols-outlined mr-2 text-[18px]">refresh</span>
              Refresh Status
            </button>
          </div>
        </div>

        <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_-1px_rgba(0,0,0,0.05)] md:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#111827]">
              <span className="material-symbols-outlined text-[#0073e6]">verified_user</span>
              Certificate Overview
            </h3>
            <span className="font-mono text-xs text-[#6b7280]">ID: cert_8f92a...</span>
          </div>

          <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[#6b7280]">{OVERVIEW_ROWS[0].label}</span>
              <div className="group flex cursor-pointer items-center gap-2">
                <span className="text-base font-semibold text-[#111827]">{OVERVIEW_ROWS[0].value}</span>
                <span className="material-symbols-outlined text-[16px] text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">
                  content_copy
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[#6b7280]">{OVERVIEW_ROWS[1].label}</span>
              <div className="flex items-center gap-2">
                <div className="flex size-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">L</div>
                <span className="text-base font-medium text-[#111827]">{OVERVIEW_ROWS[1].value}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[#6b7280]">{OVERVIEW_ROWS[2].label}</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold tracking-tight text-[#111827]">{OVERVIEW_ROWS[2].value}</span>
                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Safe
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[#6b7280]">{OVERVIEW_ROWS[3].label}</span>
              <span className="font-mono text-base text-[#111827]">{OVERVIEW_ROWS[3].value}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[#6b7280]">{OVERVIEW_ROWS[4].label}</span>
              <span className="font-mono text-base text-[#111827]">{OVERVIEW_ROWS[4].value}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-[#6b7280]">Chain Status</span>
              <div className="flex items-center gap-2 text-green-600">
                <span className="material-symbols-outlined filled text-[20px]">check_circle</span>
                <span className="text-base font-medium">Valid &amp; Trusted</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-[#111827]">Subject Alternative Names (SANs)</h3>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">3</span>
            </div>

            <div className="p-2">
              <table className="min-w-full divide-y divide-gray-50">
                <tbody className="divide-y divide-gray-50 bg-white">
                  {SAN_ROWS.map((row) => (
                    <tr key={row.name}>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-[#111827]">{row.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-[#6b7280]">{row.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-auto rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-3">
              <button type="button" className="flex items-center gap-1 text-sm font-medium text-[#0073e6] transition-colors hover:text-[#0073e6]/80">
                View all 3 SANs
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-[#111827]">Resolved IP Addresses</h3>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">2</span>
            </div>

            <div className="p-2">
              <table className="min-w-full divide-y divide-gray-50">
                <tbody className="divide-y divide-gray-50 bg-white">
                  {IP_ROWS.map((row) => (
                    <tr key={row.ip} className="group transition-colors hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-[#111827]">{row.ip}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-auto rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-3">
              <span className="text-xs text-[#6b7280]">Last resolved: 5 mins ago</span>
            </div>
          </div>
        </section>

        <section className="mb-12 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <h3 className="text-base font-semibold text-[#111827]">Certificate Chain Verification</h3>
            <Link
              href={`/${locale}/certificate-chain-visual-path`}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#0073e6] transition-colors hover:text-[#005dc1]"
            >
              {locale === 'zh' ? '查看链路路径' : 'View chain path'}
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="flex flex-col items-start gap-6 p-6 md:flex-row md:items-center md:p-8">
            <div className="relative w-full flex-1">
              <div className="absolute bottom-6 left-[19px] top-6 -z-10 w-0.5 bg-gray-200" />
              <div className="flex flex-col gap-6">
                {CHAIN_ROWS.map((row) => (
                  <div key={row.title} className="flex items-center gap-4">
                    <div
                      className={`z-10 flex size-10 items-center justify-center rounded-full border-2 shadow-sm ${
                        row.leaf
                          ? 'border-green-500 bg-green-50'
                          : 'border-white bg-gray-100'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${row.leaf ? 'text-green-600' : 'text-gray-500'}`}>
                        {row.icon}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className={`text-sm ${row.leaf ? 'font-bold' : 'font-semibold'} text-[#111827]`}>{row.title}</span>
                      <span className="text-xs text-[#6b7280]">{row.subtitle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex w-full flex-1 items-start gap-4 rounded-xl border border-green-100 bg-green-50/50 p-6">
              <div className="rounded-full bg-green-100 p-2 text-green-600">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div>
                <h4 className="mb-1 text-base font-bold text-green-800">Chain is complete and trusted</h4>
                <p className="leading-relaxed text-green-700/80">
                  The certificate chain is correctly configured. The root certificate is trusted by major browsers and operating systems (Mozilla, Google, Apple, Microsoft).
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
