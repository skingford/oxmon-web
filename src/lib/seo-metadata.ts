import type { Locale } from '@/lib/locale'

export type PageMeta = {
  title: string
  description: string
}

export const PAGE_METADATA = {
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
  'metrics-time-series-query': {
    en: {
      title: 'Metrics Explorer | Oxmon Admin',
      description: 'Analyze infrastructure performance and visualize time-series telemetry data.',
    },
    zh: {
      title: '指标查询 | Oxmon Admin',
      description: '分析基础设施性能并可视化时序指标数据。',
    },
  },
  'agent-detailed-metrics-web-01': {
    en: {
      title: 'Agent web-01 Metrics | Oxmon Admin',
      description: 'Detailed infrastructure metrics and health status for production web server web-01.',
    },
    zh: {
      title: '节点 web-01 指标 | Oxmon Admin',
      description: '生产 Web 节点 web-01 的详细基础设施指标与健康状态。',
    },
  },
  'alert-history-log': {
    en: {
      title: 'Alert History | Oxmon Admin',
      description: 'Monitor infrastructure health and review historical alert logs.',
    },
    zh: {
      title: '告警历史 | Oxmon Admin',
      description: '监控基础设施健康状态并查看历史告警日志。',
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
} as const satisfies Record<string, Record<Locale, PageMeta>>

export type PageKey = keyof typeof PAGE_METADATA

const DEFAULT_PAGE_KEY: PageKey = 'dashboard'

function isPageKey(value: string): value is PageKey {
  return value in PAGE_METADATA
}

export function getPageMetaForPath(pathname: string, locale: Locale): PageMeta {
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  const candidatePageKey = !firstSegment || firstSegment === DEFAULT_PAGE_KEY ? DEFAULT_PAGE_KEY : firstSegment
  const normalizedPageKey: PageKey = isPageKey(candidatePageKey) ? candidatePageKey : DEFAULT_PAGE_KEY

  return PAGE_METADATA[normalizedPageKey][locale]
}
