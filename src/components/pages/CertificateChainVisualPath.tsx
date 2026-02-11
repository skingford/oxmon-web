import Link from 'next/link'

type CertificateChainVisualPathProps = {
  locale: 'en' | 'zh'
}

type ChainNode = {
  type: string
  title: string
  subtitle: string
  icon: string
  active?: boolean
}

const CHAIN_NODES: ChainNode[] = [
  {
    type: 'Root CA',
    title: 'DigiCert Global Root CA',
    subtitle: 'Issuer: DigiCert Inc • Expires: Nov 10, 2031',
    icon: 'account_balance',
  },
  {
    type: 'Intermediate CA',
    title: 'RapidSSL TLS RSA CA G1',
    subtitle: 'Issuer: DigiCert Global Root CA • Expires: Sep 20, 2028',
    icon: 'security',
  },
  {
    type: 'Leaf Certificate',
    title: '*.example.com',
    subtitle: 'Issuer: RapidSSL TLS RSA CA G1 • Expires: Jul 14, 2024',
    icon: 'language',
    active: true,
  },
]

function ChainCard({ node }: { node: ChainNode }) {
  if (node.active) {
    return (
      <div className="relative flex items-center overflow-hidden rounded-xl border-2 border-[#0673e0] bg-blue-50/30 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#0673e0]" />

        <div className="mr-4 flex shrink-0 rounded-lg bg-[#0673e0] p-3 text-white shadow-sm">
          <span className="material-symbols-outlined">{node.icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-[#0673e0] uppercase">{node.type}</span>
            <span className="material-symbols-outlined text-[16px] text-[#34c759]">check_circle</span>
          </div>
          <h3 className="truncate text-lg font-bold text-[#1d1d1f]">{node.title}</h3>
          <p className="truncate text-sm text-[#86868b]">{node.subtitle}</p>
        </div>

        <div className="ml-4">
          <button type="button" className="text-sm font-medium text-[#0673e0] transition-colors hover:text-blue-700">
            Details
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex cursor-pointer items-center rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="mr-4 shrink-0 rounded-lg bg-gray-100 p-3 text-gray-600">
        <span className="material-symbols-outlined">{node.icon}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-[#86868b] uppercase">{node.type}</span>
          <span className="material-symbols-outlined text-[16px] text-[#34c759]">check_circle</span>
        </div>
        <h3 className="truncate text-lg font-semibold text-[#1d1d1f]">{node.title}</h3>
        <p className="truncate text-sm text-[#86868b]">{node.subtitle}</p>
      </div>

      <div className="ml-4 text-gray-400">
        <span className="material-symbols-outlined">chevron_right</span>
      </div>
    </div>
  )
}

export default function CertificateChainVisualPath({ locale }: CertificateChainVisualPathProps) {
  const isZh = locale === 'zh'

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f8] text-[#1d1d1f] antialiased">
      <header className="w-full border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto w-full max-w-5xl">
          <nav className="flex items-center text-sm font-medium text-[#86868b]">
            <Link href={`/${locale}/domains`} className="transition-colors hover:text-[#0673e0]">
              {isZh ? '证书' : 'domains'}
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <Link href={`/${locale}/certificate-detail-view-example-com`} className="transition-colors hover:text-[#0673e0]">
              {isZh ? '资产清单' : 'Inventory'}
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-[#1d1d1f]">*.example.com</span>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">{isZh ? '证书链' : 'Certificate Chain'}</h1>
              <p className="mt-1 text-lg text-[#86868b]">{isZh ? '*.example.com 的可视化路径' : 'Visual path for *.example.com'}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                {isZh ? '可信' : 'Trusted'}
              </span>

              <button
                type="button"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[#1d1d1f] shadow-sm transition-all hover:bg-gray-50"
              >
                {isZh ? '导出证书链' : 'Export Chain'}
              </button>

              <Link
                href={`/${locale}/domains/settings`}
                className="rounded-lg bg-[#0673e0] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                {isZh ? '通知设置' : 'Settings'}
              </Link>
            </div>
          </div>

          <section className="relative rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="relative flex flex-col items-center gap-0">
              <div className="relative z-10 w-full max-w-2xl">
                <ChainCard node={CHAIN_NODES[0]} />
              </div>

              <div className="relative h-12 w-full after:absolute after:top-0 after:bottom-0 after:left-1/2 after:z-0 after:w-[2px] after:-translate-x-1/2 after:bg-[#d2d2d7] after:content-['']" />

              <div className="relative z-10 w-full max-w-2xl">
                <ChainCard node={CHAIN_NODES[1]} />
              </div>

              <div className="relative h-12 w-full after:absolute after:top-0 after:bottom-0 after:left-1/2 after:z-0 after:w-[2px] after:-translate-x-1/2 after:bg-[#d2d2d7] after:content-['']" />

              <div className="relative z-10 w-full max-w-2xl">
                <ChainCard node={CHAIN_NODES[2]} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <article className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-[#86868b]">{isZh ? '链路状态' : 'Chain Status'}</p>
              <div className="flex items-center gap-2">
                <span className="leading-none text-2xl font-bold text-[#1d1d1f]">{isZh ? '有效' : 'Valid'}</span>
                <span className="material-symbols-outlined text-[24px] text-[#34c759]">verified</span>
              </div>
              <p className="mt-1 text-xs font-medium text-green-600">+ {isZh ? '已通过信任库验证' : 'Verified against trust store'}</p>
            </article>

            <article className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-[#86868b]">{isZh ? '链路深度' : 'Chain Depth'}</p>
              <span className="text-2xl font-bold text-[#1d1d1f]">3</span>
              <p className="mt-1 text-xs text-[#86868b]">{isZh ? '根证书 + 中间证书 + 叶子证书' : 'Root + Intermediate + Leaf'}</p>
            </article>

            <article className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-[#86868b]">{isZh ? '签名算法' : 'Signature Algorithm'}</p>
              <span className="text-2xl font-bold text-[#1d1d1f]">SHA-256</span>
              <p className="mt-1 text-xs text-[#86868b]">{isZh ? '使用 RSA 加密' : 'with RSA Encryption'}</p>
            </article>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="flex gap-4">
                <div className="mt-1 shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <span className="material-symbols-outlined">rule</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <h4 className="text-base font-bold text-[#1d1d1f]">{isZh ? '证书链验证成功' : 'Chain Validation Successful'}</h4>
                  <p className="max-w-2xl text-sm leading-relaxed text-[#86868b]">
                    {isZh
                      ? '证书链完整。服务器已提供所有必要的中间证书。链路终止于操作系统信任库中的受信任根证书。通过 OCSP 检测，未发现吊销问题。'
                      : 'The certificate chain is complete. The server provided all necessary intermediate domains. The chain terminates at a trusted Root CA found in the OS trust store. No revocation issues detected via OCSP.'}
                  </p>
                </div>
              </div>

              <Link
                href={`/${locale}/domains/settings`}
                className="flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0673e0] px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 md:w-auto"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                <span>{isZh ? '前往通知设置' : 'Go to Settings'}</span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
