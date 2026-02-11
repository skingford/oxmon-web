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
      title: 'SSL Certificates | Oxmon Admin',
      description: 'Manage SSL certificate monitoring domains, check intervals, and status actions in one view.',
    },
    zh: {
      title: 'SSL 证书 | Oxmon Admin',
      description: '集中管理 SSL 监控域名、检测间隔与状态操作。',
    },
  },
  alerts: {
    en: {
      title: 'Alert Rules | Oxmon Admin',
      description: 'Configure threshold and anomaly detection alert rules for infrastructure monitoring.',
    },
    zh: {
      title: '告警规则 | Oxmon Admin',
      description: '配置基础设施监控的阈值与异常检测告警规则。',
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
  'alert-rules-configuration-tab': {
    en: {
      title: 'Alert Rules | Oxmon Admin',
      description: 'Configure threshold and anomaly detection alert rules for infrastructure monitoring.',
    },
    zh: {
      title: '告警规则 | Oxmon Admin',
      description: '配置基础设施监控的阈值与异常检测告警规则。',
    },
  },
  'certificate-detail-view-example-com': {
    en: {
      title: 'Certificate example.com | Oxmon Admin',
      description: 'SSL/TLS certificate details, SANs, resolved IPs, and trust-chain verification for example.com.',
    },
    zh: {
      title: '证书详情 example.com | Oxmon Admin',
      description: '查看 example.com 的 SSL/TLS 证书详情、SAN、解析 IP 与信任链校验状态。',
    },
  },
  'chart-metric-tooltip-detail': {
    en: {
      title: 'CPU Usage History | Oxmon Admin',
      description: 'Detailed CPU usage timeline with metric tooltip breakdown and trend summary cards.',
    },
    zh: {
      title: 'CPU 使用历史 | Oxmon Admin',
      description: '包含指标悬浮提示与趋势汇总卡片的 CPU 使用时间线详情。',
    },
  },
  'multi-metric-comparison-chart': {
    en: {
      title: 'Metric Comparison | Oxmon Admin',
      description: 'Compare multiple infrastructure metrics in a single timeline with live legend and KPI summary.',
    },
    zh: {
      title: '多指标对比 | Oxmon Admin',
      description: '在单一时间线中对比多个基础设施指标，并查看实时图例与 KPI 汇总。',
    },
  },
  'full-screen-metrics-chart-view': {
    en: {
      title: 'Full Screen Metrics | Oxmon Admin',
      description: 'Analyze system resource metrics in a dedicated full-screen chart workspace with side controls.',
    },
    zh: {
      title: '全屏指标图表 | Oxmon Admin',
      description: '在专用全屏图表工作区中分析系统资源指标，并配合侧栏控制项。',
    },
  },
  'certificate-chain-visual-path': {
    en: {
      title: 'Certificate Chain Path | Oxmon Admin',
      description: 'Visualize the certificate trust chain from root to leaf with validation summary and export actions.',
    },
    zh: {
      title: '证书链路径 | Oxmon Admin',
      description: '可视化从根到叶子证书的信任链，并查看验证摘要与导出操作。',
    },
  },
  'certificate-expiration-notification-settings': {
    en: {
      title: 'Certificate Expiration Settings | Oxmon Admin',
      description: 'Configure expiration alert thresholds, delivery channels, recipients, and reminder frequency for certificates.',
    },
    zh: {
      title: '证书过期通知设置 | Oxmon Admin',
      description: '配置证书过期告警阈值、通知渠道、收件人和提醒频率。',
    },
  },
  'certificate-status-report-pdf-preview': {
    en: {
      title: 'Certificate Report PDF Preview | Oxmon Admin',
      description: 'Preview certificate status reports before export and configure PDF content and format options.',
    },
    zh: {
      title: '证书报告 PDF 预览 | Oxmon Admin',
      description: '导出前预览证书状态报告，并配置 PDF 内容与格式选项。',
    },
  },
  'global-notification-channel-settings': {
    en: {
      title: 'Global Notification Channels | Oxmon Admin',
      description: 'Manage global notification behavior and configure Email SMTP and Slack webhook delivery channels.',
    },
    zh: {
      title: '全局通知渠道设置 | Oxmon Admin',
      description: '管理全局通知行为，并配置 Email SMTP 与 Slack Webhook 投递渠道。',
    },
  },
  'notification-center-drawer': {
    en: {
      title: 'Notification Center Drawer | Oxmon Admin',
      description: 'Review grouped notification events in a right-side drawer with unread indicators and quick actions.',
    },
    zh: {
      title: '通知中心抽屉 | Oxmon Admin',
      description: '在右侧抽屉中查看分组通知事件，包含未读标记与快速操作。',
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

const PAGE_KEY_ALIASES: Partial<Record<string, PageKey>> = {
  'domain-management-tab': 'certificates',
  'certificates/settings': 'certificate-expiration-notification-settings',
}

function isPageKey(value: string): value is PageKey {
  return value in PAGE_METADATA
}

export function getPageMetaForPath(pathname: string, locale: Locale): PageMeta {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  const nestedSegment = segments.length > 1 ? `${segments[0]}/${segments[1]}` : null

  const candidatePageKey = nestedSegment && (nestedSegment in PAGE_KEY_ALIASES || isPageKey(nestedSegment))
    ? nestedSegment
    : (!firstSegment || firstSegment === DEFAULT_PAGE_KEY ? DEFAULT_PAGE_KEY : firstSegment)

  const aliasedPageKey = PAGE_KEY_ALIASES[candidatePageKey] ?? candidatePageKey
  const normalizedPageKey: PageKey = isPageKey(aliasedPageKey) ? aliasedPageKey : DEFAULT_PAGE_KEY

  return PAGE_METADATA[normalizedPageKey][locale]
}
