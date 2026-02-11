import Link from 'next/link'

type domainstatusReportPdfPreviewProps = {
  locale: 'en' | 'zh'
}

type ReportOption = {
  title: string
  description: string
  checked: boolean
}

type CertificateRow = {
  domain: string
  issuer: string
  expiryDate: string
  status: 'Valid' | 'Expiring' | 'Expired'
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    title: 'Include SANs',
    description: 'List Subject Alternative Names for each certificate.',
    checked: true,
  },
  {
    title: 'Include IP Addresses',
    description: 'Show resolved IPs for domains in the summary.',
    checked: false,
  },
  {
    title: 'Attach Detailed Logs',
    description: 'Append raw validation logs at the end of the report.',
    checked: false,
  },
]

const CERTIFICATE_ROWS: CertificateRow[] = [
  {
    domain: 'api.oxmon.com',
    issuer: "Let's Encrypt",
    expiryDate: 'Jan 21, 2024',
    status: 'Valid',
  },
  {
    domain: 'auth.oxmon.com',
    issuer: 'DigiCert',
    expiryDate: 'Nov 05, 2023',
    status: 'Expiring',
  },
  {
    domain: 'legacy.internal',
    issuer: 'Self-Signed',
    expiryDate: 'Oct 20, 2023',
    status: 'Expired',
  },
  {
    domain: 'cdn.oxmon.net',
    issuer: 'AWS',
    expiryDate: 'Dec 15, 2023',
    status: 'Valid',
  },
  {
    domain: 'mail.oxmon.com',
    issuer: 'DigiCert',
    expiryDate: 'Feb 28, 2024',
    status: 'Valid',
  },
]

const CANVAS_BG =
  "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZjFmMmY2Ii8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlN2U4ZWMiLz4KPC9zdmc+')]"

function getStatusClass(status: CertificateRow['status']): string {
  if (status === 'Valid') {
    return 'bg-green-50 text-green-700 ring-green-600/20'
  }

  if (status === 'Expiring') {
    return 'bg-amber-50 text-amber-700 ring-amber-600/20'
  }

  return 'bg-red-50 text-red-700 ring-red-600/20'
}

export default function domainstatusReportPdfPreview({ locale }: domainstatusReportPdfPreviewProps) {
  const isZh = locale === 'zh'

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f5f7f8] font-sans text-slate-900">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 opacity-40">
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-white">
          <header className="flex items-center justify-between border-b border-[#f0f2f5] px-10 py-3">
            <div className="flex items-center gap-4 text-[#111418]">
              <div className="size-8 rounded-full bg-slate-200" />
              <div className="h-4 w-32 rounded bg-slate-200" />
            </div>
          </header>
          <div className="grid grid-cols-3 gap-6 p-10">
            <div className="h-64 rounded-xl bg-slate-100" />
            <div className="h-64 rounded-xl bg-slate-100" />
            <div className="h-64 rounded-xl bg-slate-100" />
            <div className="col-span-3 h-96 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[20px] transition-all duration-300 sm:p-6 lg:p-8">
        <div className="flex h-[90vh] w-full max-w-[1200px] overflow-hidden rounded-2xl bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
          <div className="relative flex min-w-0 flex-1 flex-col bg-slate-100/50">
            <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <span className="material-symbols-outlined text-lg">description</span>
                <span>{isZh ? '正在预览第 1 / 4 页' : 'Previewing 1 of 4 pages'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100">
                  <span className="material-symbols-outlined text-xl">remove</span>
                </button>
                <span className="w-12 text-center text-sm font-semibold text-slate-700">100%</span>
                <button type="button" className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100">
                  <span className="material-symbols-outlined text-xl">add</span>
                </button>
              </div>
            </div>

            <div className={`flex flex-1 justify-center overflow-y-auto p-8 ${CANVAS_BG}`}>
              <div className="relative mx-auto flex min-h-[1123px] w-[794px] origin-top flex-col bg-white p-[60px] text-slate-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.05)] transition-transform">
                <div className="mb-8 flex items-start justify-between border-b-2 border-slate-100 pb-6">
                  <div className="flex flex-col gap-1">
                    <div className="mb-1 flex items-center gap-2 text-[#0b73da]">
                      <span className="material-symbols-outlined text-3xl">verified_user</span>
                      <span className="text-xl font-bold tracking-tight text-slate-900">Oxmon</span>
                    </div>
                    <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Infrastructure Security</div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Certificate Status Report</h1>
                    <p className="mt-1 text-sm text-slate-500">Generated on October 24, 2023</p>
                    <p className="mt-0.5 text-xs text-slate-400">Ref: OX-2023-10-24-A</p>
                  </div>
                </div>

                <div className="mb-10 grid grid-cols-2 gap-8">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-5">
                    <h3 className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-700">
                      <span className="material-symbols-outlined text-sm">pie_chart</span>
                      Validity Distribution
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="relative h-24 w-24 shrink-0 rounded-full bg-[conic-gradient(#22c55e_70%,#f59e0b_70%_90%,#ef4444_90%_100%)]">
                        <div className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-slate-50" />
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full bg-green-500" />
                          <span className="font-medium text-slate-600">Valid (70%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full bg-amber-500" />
                          <span className="font-medium text-slate-600">Expiring Soon (20%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full bg-red-500" />
                          <span className="font-medium text-slate-600">Expired (10%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-5">
                    <h3 className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-700">
                      <span className="material-symbols-outlined text-sm">bar_chart</span>
                      Top Issuers
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-slate-600">
                          <span>Let's Encrypt</span>
                          <span className="font-medium">45%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200">
                          <div className="h-1.5 w-[45%] rounded-full bg-[#0b73da]" />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-slate-600">
                          <span>DigiCert</span>
                          <span className="font-medium">30%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200">
                          <div className="h-1.5 w-[30%] rounded-full bg-[#0b73da]/70" />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-slate-600">
                          <span>AWS</span>
                          <span className="font-medium">25%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200">
                          <div className="h-1.5 w-[25%] rounded-full bg-[#0b73da]/40" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>Certificate Details</span>
                    <span className="text-xs font-normal text-slate-500">Showing top 5 priority items</span>
                  </h3>

                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase">
                        <th className="py-2 pl-2 font-medium">Domain</th>
                        <th className="py-2 font-medium">Issuer</th>
                        <th className="py-2 font-medium">Expiry Date</th>
                        <th className="py-2 pr-2 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {CERTIFICATE_ROWS.map((row) => (
                        <tr key={row.domain} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 pl-2 font-medium text-slate-900">{row.domain}</td>
                          <td className="py-3 text-slate-500">{row.issuer}</td>
                          <td className="py-3 font-tabular text-slate-500">{row.expiryDate}</td>
                          <td className="py-3 pr-2 text-right">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusClass(row.status)}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-auto border-t border-slate-100 pt-6 text-center">
                  <p className="text-[10px] text-slate-400">Confidential Report • Generated by Oxmon Security Suite • Page 1 of 4</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="z-20 flex w-[360px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Export Options</h2>
              <Link
                href={`/${locale}/domains/settings`}
                className="text-slate-400 transition-colors hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </Link>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto p-6">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Report Content</h3>
                {REPORT_OPTIONS.map((option) => (
                  <label key={option.title} className="group flex cursor-pointer items-start gap-3">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={option.checked}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 bg-white transition-all checked:border-[#0b73da] checked:bg-[#0b73da] focus:ring-2 focus:ring-[#0b73da]/20"
                        aria-label={option.title}
                      />
                      <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[14px] text-white opacity-0 peer-checked:opacity-100">
                        check
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="block text-sm font-medium text-slate-900 transition-colors group-hover:text-[#0b73da]">{option.title}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Format</h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Paper Size</label>
                    <div className="relative">
                      <select
                        defaultValue="a4"
                        className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 text-slate-900 shadow-sm focus:border-[#0b73da] focus:ring-[#0b73da] sm:text-sm"
                      >
                        <option value="a4">A4 (210 x 297 mm)</option>
                        <option value="letter">Letter (8.5 x 11 in)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <span className="material-symbols-outlined">expand_more</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Orientation</label>
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input type="radio" name="orientation" defaultChecked className="peer sr-only" />
                        <div className="rounded-lg border border-slate-200 p-3 text-center transition-all hover:border-[#0b73da]/50 peer-checked:border-[#0b73da] peer-checked:bg-[#0b73da]/5 peer-checked:text-[#0b73da]">
                          <span className="material-symbols-outlined mx-auto mb-1 block">crop_portrait</span>
                          <span className="text-xs font-medium">{isZh ? '纵向' : 'Portrait'}</span>
                        </div>
                      </label>
                      <label className="flex-1 cursor-pointer">
                        <input type="radio" name="orientation" className="peer sr-only" />
                        <div className="rounded-lg border border-slate-200 p-3 text-center transition-all hover:border-[#0b73da]/50 peer-checked:border-[#0b73da] peer-checked:bg-[#0b73da]/5 peer-checked:text-[#0b73da]">
                          <span className="material-symbols-outlined mx-auto mb-1 block">crop_landscape</span>
                          <span className="text-xs font-medium">{isZh ? '横向' : 'Landscape'}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-6">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0b73da] px-4 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-600 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined">download</span>
                <span>{isZh ? '下载 PDF' : 'Download PDF'}</span>
              </button>
              <Link
                href={`/${locale}/domains/settings`}
                className="mt-3 block w-full text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
              >
                {isZh ? '返回通知设置' : 'Back to Settings'}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
