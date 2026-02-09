import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { buildLocalePath, isLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/locale'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

type PageMeta = {
  title: string
  description: string
}

const PAGE_METADATA: Record<string, Record<Locale, PageMeta>> = {
  dashboard: {
    en: {
      title: 'Dashboard | Oxmon Admin',
      description: 'Cluster health overview, incident pulse, and AI-assisted operations in one place.',
    },
    zh: {
      title: '总览 | Oxmon Admin',
      description: '在一个视图中掌握集群健康、事件态势与 AI 辅助运维。',
    },
  },
  infrastructure: {
    en: {
      title: 'Infrastructure | Oxmon Admin',
      description: 'Explore topology maps, node telemetry, and distributed infrastructure status.',
    },
    zh: {
      title: '基础设施 | Oxmon Admin',
      description: '查看拓扑地图、节点遥测与分布式基础设施状态。',
    },
  },
  agents: {
    en: {
      title: 'Agents | Oxmon Admin',
      description: 'Manage agent lifecycle, monitor connectivity, and execute targeted operations.',
    },
    zh: {
      title: '代理节点 | Oxmon Admin',
      description: '管理节点生命周期，监控连接状态并执行定向运维操作。',
    },
  },
  certificates: {
    en: {
      title: 'Certificates | Oxmon Admin',
      description: 'Track TLS/SSL assets, expiration risk, and trust chain integrity.',
    },
    zh: {
      title: '证书 | Oxmon Admin',
      description: '追踪 TLS/SSL 资产、过期风险与信任链完整性。',
    },
  },
  alerts: {
    en: {
      title: 'Alerts | Oxmon Admin',
      description: 'Triage incidents in real time, correlate signals, and accelerate response.',
    },
    zh: {
      title: '告警 | Oxmon Admin',
      description: '实时分诊告警，关联信号并加速事件响应。',
    },
  },
  logs: {
    en: {
      title: 'Logs | Oxmon Admin',
      description: 'Inspect audit logs, detect anomalies, and investigate operational timelines.',
    },
    zh: {
      title: '日志 | Oxmon Admin',
      description: '分析审计日志、识别异常并回溯运维时间线。',
    },
  },
  tools: {
    en: {
      title: 'Tools | Oxmon Admin',
      description: 'Generate and validate configuration artifacts with AI-powered tooling.',
    },
    zh: {
      title: '工具 | Oxmon Admin',
      description: '通过 AI 工具生成并校验配置产物。',
    },
  },
  help: {
    en: {
      title: 'Help Center | Oxmon Admin',
      description: 'Access runbooks, product guidance, and support resources for operators.',
    },
    zh: {
      title: '帮助中心 | Oxmon Admin',
      description: '获取运维手册、产品指引与支持资源。',
    },
  },
  settings: {
    en: {
      title: 'Settings | Oxmon Admin',
      description: 'Configure security policies, team permissions, and platform preferences.',
    },
    zh: {
      title: '设置 | Oxmon Admin',
      description: '配置安全策略、团队权限与平台偏好。',
    },
  },
  login: {
    en: {
      title: 'Login | Oxmon Admin',
      description: 'Securely sign in to access Oxmon operations and observability workspace.',
    },
    zh: {
      title: '登录 | Oxmon Admin',
      description: '安全登录 Oxmon，进入运维与可观测性工作台。',
    },
  },
}

function absoluteUrl(pathname: string): string {
  return `${SITE_URL.replace(/\/$/, '')}${pathname}`
}

function resolvePathForLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const localeInPath = segments[0]

  if (localeInPath && isLocale(localeInPath)) {
    const rest = segments.slice(1).join('/')
    return rest ? `/${rest}` : '/dashboard'
  }

  return pathname === '/' ? '/dashboard' : pathname
}

function resolvePageKey(pathname: string): string {
  const firstSegment = pathname.split('/').filter(Boolean)[0]

  if (!firstSegment || firstSegment === 'dashboard') {
    return 'dashboard'
  }

  return PAGE_METADATA[firstSegment] ? firstSegment : 'dashboard'
}

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>
  }
): Promise<Metadata> {
  const { locale } = await props.params

  if (!isLocale(locale)) {
    return {}
  }

  const requestHeaders = await headers()
  const currentPathname = requestHeaders.get('x-current-pathname') ?? `/${locale}/dashboard`
  const targetPath = resolvePathForLocale(currentPathname)
  const pageKey = resolvePageKey(targetPath)
  const pageMeta = PAGE_METADATA[pageKey][locale]

  const languages: Record<string, string> = {}
  for (const supportedLocale of SUPPORTED_LOCALES) {
    languages[supportedLocale] = absoluteUrl(buildLocalePath(supportedLocale, targetPath))
  }

  languages['x-default'] = absoluteUrl(buildLocalePath('en', targetPath))

  return {
    title: pageMeta.title,
    description: pageMeta.description,
    alternates: {
      canonical: absoluteUrl(buildLocalePath(locale, targetPath)),
      languages,
    },
  }
}

export default async function LocaleLayout(
  props: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
  }
) {
  const { children, params } = props
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  return children
}

export function generateStaticParams(): Array<{ locale: Locale }> {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}
