import { getFromLocalStorage, setToLocalStorage } from './localStorage'
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  normalizeLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from './locale'

export { DEFAULT_LOCALE, SUPPORTED_LOCALES, LOCALE_COOKIE_KEY, normalizeLocale, type Locale }

export const LOCALE_STORAGE_KEY = 'ox_locale'

type TranslationValues = Record<string, string | number>

const EN_MESSAGES = {
  'language.current': 'Language',
  'language.english': 'EN',
  'language.chinese': '中文',

  'header.sentinel': 'Sentinel',
  'header.clusterHealth': 'Cluster Health: {{value}}%',
  'header.command': 'Command',

  'view.dashboard': 'Dashboard',
  'view.infrastructure': 'Infrastructure',
  'view.agents': 'Agents',
  'view.certificates': 'Certificates',
  'view.alerts': 'Alerts',
  'view.logs': 'Logs',
  'view.tools': 'Tools',
  'view.help': 'Help',
  'view.settings': 'Settings',

  'sidebar.sreConsole': 'SRE Console',
  'sidebar.nav.dashboard': 'Sentinel Core',
  'sidebar.nav.infrastructure': 'Topology Map',
  'sidebar.nav.agents': 'Agent Grid',
  'sidebar.nav.certificates': 'Trust Perimeter',
  'sidebar.nav.alerts': 'Incident Hub',
  'sidebar.nav.logs': 'Audit Stream',
  'sidebar.nav.tools': 'Config Forge',
  'sidebar.nav.help': 'Knowledge Hub',
  'sidebar.nav.settings': 'Governance',
  'sidebar.neuralLink': 'Neural Link',
  'sidebar.masterAdmin': 'Master Admin',
  'sidebar.terminateSession': 'Terminate Session',

  'search.placeholder': 'Global Grep...',
  'search.noResults': 'No matching assets identified.',
  'search.type.agent': 'Agent',
  'search.type.certificate': 'Certificate',
  'search.type.alert': 'Alert',

  'commandPalette.inputPlaceholder': 'Neural Command Input...',
  'commandPalette.intentSuggestions': 'Intent Suggestions',
  'commandPalette.suggestion.infrastructure': 'Show infrastructure nodes',
  'commandPalette.suggestion.alerts': 'View incident center',
  'commandPalette.suggestion.logs': 'Analyze audit stream',
  'commandPalette.suggestion.tools': 'Forge Nginx config',
  'commandPalette.suggestion.settings': 'Open security vault',
  'commandPalette.translationFailed': 'Neural translation failed.',

  'login.subtitle': 'Infrastructure Monitoring & Certificates',
  'login.username': 'Username',
  'login.password': 'Password',
  'login.forgotPassword': 'Forgot password?',
  'login.signIn': 'Sign In',
  'login.protected': 'Protected by enterprise-grade encryption.',
  'login.version': 'v2.4.0 (Stable)',

  'toast.sessionTerminated': 'Session terminated.',
  'toast.securityKeyRotated': 'Security key rotated.',
  'toast.certificateRenewalInitiated': 'Certificate renewal initiated.',
  'toast.aiSynthesisComplete': 'AI synthesis complete.',
  'toast.aiAuditFailed': 'AI audit failed.',
  'toast.reportExported': 'Report exported.',
  'toast.exportFailed': 'Export failed.',
  'toast.predictiveScanSynchronized': 'Predictive scan synchronized.',
  'toast.predictiveHandshakeFailed': 'Predictive handshake failed.',
  'toast.objectForged': 'Object successfully forged.',
  'toast.neuralForgeFailure': 'Neural forge failure.',
  'toast.pemCopied': 'PEM payload copied.',
  'toast.visionSyncFailed': 'Vision sync failed: Camera permission required.',
  'toast.simProjectionSynchronized': 'Sim-X Projection synchronized.',
  'toast.neuralSimInterrupted': 'Neural sim interrupted.',
  'toast.physicalAuditSynchronized': 'Physical Audit synchronized.',
  'toast.neuralVisionHandshakeFailed': 'Neural Vision handshake failed.',
  'toast.clusterTriage': 'Synthesizing cluster-wide triage audit...',
  'toast.verificationLinkDispatched': 'Verification secure link dispatched.',
  'toast.governanceAuditComplete': 'Governance Audit complete.',
  'toast.neuralAuditHandshakeFailed': 'Neural Audit handshake failed.',
  'toast.keyCopied': 'Key copied.',
  'toast.neuralAuditLowercaseFailed': 'Neural audit handshake failed.',
  'toast.neuralTranslationFailed': 'Neural translation failed.',
  'toast.agentStatusToggled': 'Agent {{id}} status toggled via voice link.',
  'toast.incidentResolved': 'Incident {{id}} resolved via voice link.',
  'toast.monitorActive': 'Monitor active for {{domain}}.',
  'toast.nodeDeployed': 'Node {{name}} deployed.',
  'toast.inviteBroadcasted': 'Invite broadcasted to {{email}}',
} as const

export type TranslationKey = keyof typeof EN_MESSAGES

const ZH_MESSAGES: Record<TranslationKey, string> = {
  'language.current': '语言',
  'language.english': 'EN',
  'language.chinese': '中文',

  'header.sentinel': '哨兵',
  'header.clusterHealth': '集群健康度：{{value}}%',
  'header.command': '命令',

  'view.dashboard': '总览',
  'view.infrastructure': '基础设施',
  'view.agents': '代理节点',
  'view.certificates': '证书',
  'view.alerts': '告警',
  'view.logs': '日志',
  'view.tools': '工具',
  'view.help': '帮助',
  'view.settings': '设置',

  'sidebar.sreConsole': '运维控制台',
  'sidebar.nav.dashboard': '哨兵核心',
  'sidebar.nav.infrastructure': '拓扑地图',
  'sidebar.nav.agents': '节点网格',
  'sidebar.nav.certificates': '信任边界',
  'sidebar.nav.alerts': '事件中心',
  'sidebar.nav.logs': '审计流',
  'sidebar.nav.tools': '配置工坊',
  'sidebar.nav.help': '知识中心',
  'sidebar.nav.settings': '治理中心',
  'sidebar.neuralLink': '神经链路',
  'sidebar.masterAdmin': '超级管理员',
  'sidebar.terminateSession': '结束会话',

  'search.placeholder': '全局搜索...',
  'search.noResults': '未找到匹配资产。',
  'search.type.agent': '节点',
  'search.type.certificate': '证书',
  'search.type.alert': '告警',

  'commandPalette.inputPlaceholder': '输入神经命令...',
  'commandPalette.intentSuggestions': '意图建议',
  'commandPalette.suggestion.infrastructure': '查看基础设施节点',
  'commandPalette.suggestion.alerts': '查看事件中心',
  'commandPalette.suggestion.logs': '分析审计日志流',
  'commandPalette.suggestion.tools': '生成 Nginx 配置',
  'commandPalette.suggestion.settings': '打开安全密钥库',
  'commandPalette.translationFailed': '神经语义转换失败。',

  'login.subtitle': '基础设施监控与证书管理',
  'login.username': '用户名',
  'login.password': '密码',
  'login.forgotPassword': '忘记密码？',
  'login.signIn': '登录',
  'login.protected': '由企业级加密保护。',
  'login.version': 'v2.4.0（稳定版）',

  'toast.sessionTerminated': '会话已结束。',
  'toast.securityKeyRotated': '安全密钥已轮换。',
  'toast.certificateRenewalInitiated': '证书续期已启动。',
  'toast.aiSynthesisComplete': 'AI 综合分析完成。',
  'toast.aiAuditFailed': 'AI 审计失败。',
  'toast.reportExported': '报告已导出。',
  'toast.exportFailed': '导出失败。',
  'toast.predictiveScanSynchronized': '预测扫描已同步。',
  'toast.predictiveHandshakeFailed': '预测握手失败。',
  'toast.objectForged': '配置对象生成成功。',
  'toast.neuralForgeFailure': '神经生成失败。',
  'toast.pemCopied': 'PEM 内容已复制。',
  'toast.visionSyncFailed': '视觉同步失败：需要摄像头权限。',
  'toast.simProjectionSynchronized': 'Sim-X 投影已同步。',
  'toast.neuralSimInterrupted': '神经模拟已中断。',
  'toast.physicalAuditSynchronized': '物理审计已同步。',
  'toast.neuralVisionHandshakeFailed': '神经视觉握手失败。',
  'toast.clusterTriage': '正在综合全局集群分诊审计...',
  'toast.verificationLinkDispatched': '验证安全链接已发送。',
  'toast.governanceAuditComplete': '治理审计完成。',
  'toast.neuralAuditHandshakeFailed': '神经审计握手失败。',
  'toast.keyCopied': '密钥已复制。',
  'toast.neuralAuditLowercaseFailed': '神经审计握手失败。',
  'toast.neuralTranslationFailed': '神经语义转换失败。',
  'toast.agentStatusToggled': '节点 {{id}} 状态已通过语音链路切换。',
  'toast.incidentResolved': '事件 {{id}} 已通过语音链路解决。',
  'toast.monitorActive': '{{domain}} 监控已启用。',
  'toast.nodeDeployed': '节点 {{name}} 已部署。',
  'toast.inviteBroadcasted': '邀请已发送至 {{email}}',
}

const MESSAGES: Record<Locale, Record<TranslationKey, string>> = {
  en: EN_MESSAGES,
  zh: ZH_MESSAGES,
}

const TOAST_EXACT_KEY_MAP: Record<string, TranslationKey> = {
  'Session terminated.': 'toast.sessionTerminated',
  'Security key rotated.': 'toast.securityKeyRotated',
  'Certificate renewal initiated.': 'toast.certificateRenewalInitiated',
  'AI synthesis complete.': 'toast.aiSynthesisComplete',
  'AI audit failed.': 'toast.aiAuditFailed',
  'Report exported.': 'toast.reportExported',
  'Export failed.': 'toast.exportFailed',
  'Predictive scan synchronized.': 'toast.predictiveScanSynchronized',
  'Predictive handshake failed.': 'toast.predictiveHandshakeFailed',
  'Object successfully forged.': 'toast.objectForged',
  'Neural forge failure.': 'toast.neuralForgeFailure',
  'PEM payload copied.': 'toast.pemCopied',
  'Vision sync failed: Camera permission required.': 'toast.visionSyncFailed',
  'Sim-X Projection synchronized.': 'toast.simProjectionSynchronized',
  'Neural sim interrupted.': 'toast.neuralSimInterrupted',
  'Physical Audit synchronized.': 'toast.physicalAuditSynchronized',
  'Neural Vision handshake failed.': 'toast.neuralVisionHandshakeFailed',
  'Synthesizing cluster-wide triage audit...': 'toast.clusterTriage',
  'Verification secure link dispatched.': 'toast.verificationLinkDispatched',
  'Governance Audit complete.': 'toast.governanceAuditComplete',
  'Neural Audit handshake failed.': 'toast.neuralAuditHandshakeFailed',
  'Neural audit handshake failed.': 'toast.neuralAuditLowercaseFailed',
  'Key copied.': 'toast.keyCopied',
  'Neural translation failed.': 'toast.neuralTranslationFailed',
}

const UI_TEXT_MAP: Record<string, string> = {
  'Compiling global cluster telemetry...': '正在汇总全局集群遥测数据...',
  'Rendering neural frames...': '正在渲染神经画面...',
  'Neural synthesis link failed.': '神经合成链路失败。',
  'Executive Overview': '执行总览',
  'High-fidelity visualization of global infrastructure reach, distributed cluster health, and neural security metrics.': '高精度可视化展示全球基础设施覆盖、分布式集群健康与神经安全指标。',
  'Synthesizing...': '合成中...',
  'AI Visual Briefing': 'AI 可视化简报',
  'Analyzing...': '分析中...',
  'Neural Cluster Audit': '神经集群审计',
  'Sentinel Visual Dispatch': '哨兵视觉分发',
  'Forging Neural Frames': '正在生成神经画面',
  'Global Health Index': '全局健康指数',
  'Optimized': '已优化',
  'Global Mesh Throughput': '全局网格吞吐',
  'Live Traffic': '实时流量',
  'Historical': '历史',
  'Regional Latency': '区域延迟',
  'Sentinel Intelligence Synthesis': '哨兵智能综合',
  'Neural Observation Logic Active': '神经观测逻辑已启用',
  'Establish link to the Oxmon Sentinel to receive distributed cluster health summaries, systemic risk matrix assessments, and automated remediation forecasts.': '连接 Oxmon 哨兵以获取分布式集群健康摘要、系统风险矩阵评估与自动修复预测。',
  'Refresh Neural Audit': '刷新神经审计',
  'Neural Health Forecast': '神经健康预测',
  'Predictive Anomaly Detection': '预测异常检测',
  'Executing Scan...': '执行扫描中...',
  'Execute Forecast': '执行预测',
  'Risk Vector Projection': '风险向量投影',
  'No active forecast payload.': '暂无活跃预测载荷。',
  'Initiate neural link to anticipate systemic cluster vulnerabilities.': '启动神经链路以预判系统级集群脆弱点。',
  'Sentinel Heartbeat': '哨兵心跳',
  'Sentinel Incident Center': '哨兵事件中心',
  'Dashboard Overview': '仪表盘概览',
  'Welcome back, Administrator': '欢迎回来，管理员',
  "Here's what's happening with your infrastructure today.": '以下是你今日基础设施的运行动态。',
  'Agent Online Rate': '节点在线率',
  'Service Version': '服务版本',
  'System Uptime': '系统运行时长',
  'Since last maintenance': '自上次维护以来',
  'Recent Alerts': '最近告警',
  'View all alerts': '查看所有告警',
  'Severity': '严重级别',
  'Source': '来源',
  'Message': '消息',
  'Time': '时间',
  'Progress': '进度',
  'Up to date': '已是最新',

  'Americas': '美洲',
  'Europe': '欧洲',
  'APAC': '亚太',
  'LatAm': '拉美',
  'Topology Mesh': '拓扑网格',
  'Interactive neural topology explorer for distributed infrastructure visualization.': '用于分布式基础设施可视化的交互式神经拓扑探索器。',
  'Mesh Grid': '网格拓扑',
  'Global Map': '全球地图',
  'HW Vision': '硬件视觉',
  'Live Telemetry Active': '实时遥测已启用',
  'Enable Neural Flow': '启用神经流',
  'Hardware Vision Audit': '硬件视觉审计',
  'AI-powered physical infrastructure diagnostics via remote visual sync. Capture hardware logic frames for high-fidelity health assessment.': '通过远程视觉同步进行 AI 驱动的物理基础设施诊断，采集硬件逻辑帧以进行高精度健康评估。',
  'Capture Logic Frame': '捕获逻辑帧',
  'Terminate Stream': '结束流',
  'Sync Static Payload': '同步静态载荷',
  'Neural Live-Stream': '神经实时流',
  'Synchronizing Vision Logic...': '正在同步视觉逻辑...',
  'Vision Diagnostic Audit': '视觉诊断审计',
  'SRE Grade: Optimized Physical Layer': 'SRE 评级：物理层已优化',
  'Handshaking with neural vision mesh...': '正在与神经视觉网格握手...',
  'Neural Cluster Profile': '神经集群画像',
  'Entity Identifier': '实体标识',
  'Mesh Integrity': '网格完整性',
  'Cluster Uptime': '集群可用率',
  'Global Endpoint': '全局端点',
  'Initializing Sim-X...': '初始化 Sim-X...',
  'Execute Failure Sim-X': '执行故障 Sim-X',
  'Risk Projection Audit': '风险投影审计',
  'Await Target Selection for': '等待选择目标以进行',
  'High-Fidelity Neural Profile': '高精度神经画像',

  'Infrastructure Grid': '基础设施网格',
  'Operational state and compute telemetry for the distributed cluster.': '分布式集群的运行状态与计算遥测。',
  'Grep nodes...': '检索节点...',
  'Deploy Node': '部署节点',
  'Sync:': '同步：',
  'Shell': '终端',
  'Data': '数据',
  'Neural Terminal:': '神经终端：',
  'Synthesizing response...': '正在生成响应...',
  'Awaiting neural command payload...': '等待神经命令载荷...',
  'Node Insight': '节点洞察',
  'Platform': '平台',
  'OS Build': '系统构建',
  'Uptime': '运行时长',
  'Sync Status': '同步状态',
  'NOMINAL': '正常',
  'Live Heartbeat': '实时心跳',
  'CPU LOAD': 'CPU 负载',
  'Smart Shell': '智能终端',
  'Decommission': '下线',
  'Provision Node': '配置节点',
  'Node Label': '节点标签',
  'e.g. AWS Production Node': '例如：AWS 生产节点',
  'IP Address': 'IP 地址',
  'Cancel': '取消',
  'Register Agent': '注册节点',
  'Connection interrupt. Node heartbeat lost.': '连接中断，节点心跳丢失。',

  'Trust Perimeter': '信任边界',
  'Global lifecycle management for TLS/SSL credentials and distributed trust chains.': 'TLS/SSL 凭据与分布式信任链的全生命周期管理。',
  'Filter domains...': '筛选域名...',
  'Deploy Monitor': '部署监控',
  'Domains Protected': '受保护域名',
  'Secure Gradient': '安全梯度',
  'Expiring Soon': '即将过期',
  'TTL Overdue': 'TTL 已超期',
  'Domain Endpoint': '域名端点',
  'Trust Integrity': '信任完整性',
  'CA Entity': 'CA 实体',
  'TTL Remaining': 'TTL 剩余',
  'Days': '天',
  'No matching trust assets identified.': '未识别到匹配的信任资产。',
  'Trust Analysis': '信任分析',
  'Asset Telemetry': '资产遥测',
  'Status': '状态',
  'TTL': 'TTL',
  'Authority': '签发机构',
  'Last Sync': '上次同步',
  'Neural Trust Audit': '神经信任审计',
  'Synchronizing...': '同步中...',
  'Establish neural link for high-fidelity trust chain vulnerability assessment': '建立神经链路以进行高精度信任链脆弱性评估',
  'Renew Trust Asset': '续期信任资产',
  'Provision Monitor': '配置监控',
  'FQDN / Endpoint Identifier': 'FQDN / 端点标识',
  'e.g. sentinel.oxmon.io': '例如：sentinel.oxmon.io',
  'CA Issuing Authority': 'CA 签发机构',
  'e.g. DigiCert Global G2': '例如：DigiCert Global G2',
  'Handshake Expiry': '握手过期时间',
  'Discard': '放弃',
  'Enable Monitor': '启用监控',

  'Incident War Room': '事件作战室',
  'Real-time anomaly detection, correlation engine, and neural root-cause diagnostics.': '实时异常检测、关联分析引擎与神经根因诊断。',
  'Grep incident payload...': '检索事件载荷...',
  '24H Activity Pulse': '24小时活动脉冲',
  'Normal Gradient': '正常梯度',
  'Analyze': '分析',
  'No active incidents in this domain.': '当前域内无活跃事件。',
  'Neural Triage': '神经分诊',
  'Correlate global telemetry stream to identify silent systemic failures and cross-node impact profiles.': '关联全局遥测流，识别隐性系统故障与跨节点影响画像。',
  'Initiate Handshake': '发起握手',
  'Global Heartbeat Active': '全局心跳活跃',
  '99.98% of infrastructure endpoints are reporting healthy telemetry. No critical drift detected.': '99.98% 的基础设施端点回传健康遥测，未检测到关键漂移。',
  'Incident Focus': '事件聚焦',
  'Telemetry Payload': '遥测载荷',
  'Neural Root-Cause Analysis': '神经根因分析',
  'Launch Diagnostics': '启动诊断',
  'Execute Remediation': '执行修复',
  'Resolve Principal': '标记已解决',
  'Initiate neural handshake for': '发起神经握手以进行',
  'automated remediation forecast': '自动化修复预测',
  'Diagnostic handshake failed.': '诊断握手失败。',

  'Audit Stream': '审计流',
  'Distributed cluster observability, neural security logging, and principal access tracking.': '分布式集群可观测性、神经安全日志与主体访问追踪。',
  'Grep telemetry stream...': '检索遥测流...',
  'Interrupt Trace': '中断追踪',
  'Neural Live-Trace': '神经实时追踪',
  'Processing...': '处理中...',
  'Neural Synthesis': '神经综合',
  'Cluster Incident Gradient': '集群事件梯度',
  'Critical Payload': '关键载荷',
  'Anomalous Drift': '异常漂移',
  'Neural Pattern Detection': '神经模式检测',
  'Global Cross-Log Correlation Logic Active': '全局跨日志关联逻辑已启用',
  'Telemetry Index': '遥测索引',
  'State': '状态',
  'Identity': '身份',
  'High-Fidelity Payload': '高精度载荷',
  'No Telemetry Drift Identified in Selected Buffer': '在选定缓冲区中未识别到遥测漂移',

  'Governance Center': '治理中心',
  'Manage workspace identities, security vaults, and team collaboration.': '管理工作区身份、安全密库与团队协作。',
  'Workspace Meta': '工作区元信息',
  'Team Access': '团队访问',
  'Alert Delivery': '告警投递',
  'Security Vault': '安全密库',
  'Compliance Rating': '合规评级',
  'Auditing...': '审计中...',
  'Neural Scan': '神经扫描',
  'Neural Governance Audit': '神经治理审计',
  'Global Parameters': '全局参数',
  'Identification and support configuration for the Sentinel instance.': '哨兵实例的身份与支持配置。',
  'Workspace Alias': '工作区别名',
  'Support Endpoint': '支持端点',
  'Verifying...': '验证中...',
  'Verify Protocol': '验证协议',
  'Dispatch Logic': '分发逻辑',
  'Automated alert routing and high-fidelity reporting protocols.': '自动化告警路由与高精度上报协议。',
  'SMTP Relay': 'SMTP 中继',
  'Instant alert propagation via verified email infrastructure.': '通过已验证邮件基础设施即时传播告警。',
  'Webhooks': 'Webhook',
  'Broadcast critical telemetry to integrated Slack channels.': '向集成的 Slack 通道广播关键遥测。',
  'Neural Briefings': '神经简报',
  'Receive AI-synthesized cluster reports every 7 days.': '每 7 天接收 AI 综合集群报告。',
  'Security Perimeter': '安全边界',
  'Governance policies and infrastructure access keys.': '治理策略与基础设施访问密钥。',
  'MFA Enforcement': 'MFA 强制',
  'Require biometric or token-based authentication for all principals.': '要求所有主体使用生物特征或令牌认证。',
  'Access Credentials': '访问凭据',
  'Rotate Sentinel Key': '轮换哨兵密钥',
  'Principal Access': '主体访问',
  'Assign roles and manage team identities.': '分配角色并管理团队身份。',
  'principal@oxmon.io': 'principal@oxmon.io',
  'Invite': '邀请',

  'Knowledge Hub': '知识中心',
  'Neural advisor for global infrastructure patterns, enterprise DevOps best practices, and Oxmon technical documentation.': '面向全球基础设施模式、企业 DevOps 最佳实践与 Oxmon 技术文档的神经顾问。',
  'Consult the SRE Neural Advisor...': '咨询 SRE 神经顾问...',
  'Thinking...': '思考中...',
  'Launch Neural Search': '启动神经搜索',
  'Sentinel Trending Insights': '哨兵热门洞察',
  'Nginx Optimization': 'Nginx 优化',
  'Load balancing strategies for 1M+ RPS clusters.': '面向百万级 RPS 集群的负载均衡策略。',
  'Zero Trust K8s': '零信任 K8s',
  'Hardening pod security policies in multi-tenant environments.': '在多租户环境中加固 Pod 安全策略。',
  'Multi-Region DR': '多区域容灾',
  'Optimizing EBS snapshots for low RTO failover.': '优化 EBS 快照以实现低 RTO 故障切换。',
  'Neural Observability': '神经可观测性',
  'Integrating AI-driven log correlation pipelines.': '集成 AI 驱动的日志关联流水线。',
  'Diagnose high CPU wait patterns on DB-01': '诊断 DB-01 上 CPU 等待过高模式',
  'Analyze TLS 1.3 trust chain vulnerabilities': '分析 TLS 1.3 信任链漏洞',
  'Distributed cluster latency optimization': '分布式集群延迟优化',
  'Automating remediation for Nginx 504 events': '自动化修复 Nginx 504 事件',
  'Handshaking with global SRE knowledge mesh...': '正在与全局 SRE 知识网络握手...',
  'AI Neural Insight': 'AI 神经洞察',
  'Grounded Domain Synthesis Active': '有据域知识综合已启用',
  'Expert Reference Nodes': '专家参考节点',
  'Neural connection to the Knowledge Hub failed.': '连接知识中心失败。',

  'Config Forge': '配置工坊',
  'Oxmon Sentinel v4.0': 'Oxmon 哨兵 v4.0',
  'Neural synthesis for infrastructure-as-code and mission-critical server configurations.': '用于基础设施即代码与关键服务器配置的神经合成。',
  'Nginx Gateway': 'Nginx 网关',
  'Optimized Nginx reverse proxy with SSL termination, HSTS, and Brotli compression.': '优化的 Nginx 反向代理，含 SSL 终止、HSTS 与 Brotli 压缩。',
  'K8s Mesh': 'K8s 网格',
  'Kubernetes deployment YAML with pod affinity, resource limits, and Istio sidecar injection.': '包含 Pod 亲和性、资源限制与 Istio Sidecar 注入的 Kubernetes 部署 YAML。',
  'Terraform AWS': 'Terraform AWS',
  'Terraform script for a multi-AZ VPC with public and private subnets, and an IGW.': '用于多可用区 VPC（公有/私有子网及 IGW）的 Terraform 脚本。',
  'Redis Cluster': 'Redis 集群',
  'Redis configuration for a high-availability persistent cluster with sentinel failover.': '面向高可用持久化集群（含 sentinel 故障转移）的 Redis 配置。',
  'Neural Logic Input': '神经逻辑输入',
  'Describe your target infrastructure object in detail...': '请详细描述你的目标基础设施对象...',
  'Neural Hardening': '神经加固',
  'SRE Audit Active': 'SRE 审计已启用',
  'Forge Infrastructure': '生成基础设施配置',
  'Forge History': '生成历史',
  'Neural PEM Stream': '神经 PEM 流',
  'Copy Buffer': '复制缓冲',
  'Initializing Synthesis': '初始化合成中',
  'Await Neural Handshake': '等待神经握手',
  'Audit Disclosure Summary': '审计披露摘要',

  'Initializing high-fidelity neural link...': '正在初始化高精度神经链路...',
  'Oxmon Sentinel Link established. Awaiting voice directives.': 'Oxmon 哨兵链路已建立，等待语音指令。',
  'Error: Neural handshake failed. Check environment configuration.': '错误：神经握手失败，请检查环境配置。',
  'Sentinel Assistant': '哨兵助手',
  'Neural Link Active': '神经链路活跃',
  'Handshaking...': '握手中...',
  'Ready for Telemetry': '准备接入遥测',
  'Awaiting neural handshake for real-time infrastructure command & control.': '等待神经握手以进行基础设施实时指挥与控制。',
  'Initializing high-fidelity stream...': '正在初始化高精度流...',
  'Initiate Neural Session': '发起神经会话',
  'Terminate Link': '终止链路',
  'Synthesizing Link...': '合成链路中...',
  'Oxmon Native Audio Intelligence v3.1': 'Oxmon 原生音频智能 v3.1',

  'All': '全部',
  'Critical': '严重',
  'Warning': '警告',
  'Info': '信息',
  'Resolved': '已解决',
  'Valid': '有效',
  'Expiring': '即将过期',
  'Expired': '已过期',
  'Online': '在线',
  'Offline': '离线',
  'Maintenance': '维护中',
  'Owner': '所有者',
  'Admin': '管理员',
  'Editor': '编辑者',
  'Viewer': '查看者',
  'Active': '活跃',
  'Pending': '待处理',
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template

  return template.replace(/\{\{(.*?)\}\}/g, (_, rawKey: string) => {
    const key = rawKey.trim()
    const value = values[key]
    return value === undefined ? '' : String(value)
  })
}

function getLocaleFromCookie(): Locale | null {
  if (typeof document === 'undefined') return null

  const localeCookie = document.cookie
    .split(';')
    .map((segment) => segment.trim())
    .find((segment) => segment.startsWith(`${LOCALE_COOKIE_KEY}=`))

  if (!localeCookie) return null

  const cookieValue = localeCookie.split('=')[1]
  return cookieValue === 'en' || cookieValue === 'zh' ? cookieValue : null
}

export function getPreferredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  const storedLocale = getFromLocalStorage<Locale | null>(LOCALE_STORAGE_KEY, null)
  if (storedLocale === 'en' || storedLocale === 'zh') return storedLocale

  const cookieLocale = getLocaleFromCookie()
  if (cookieLocale) return cookieLocale

  return normalizeLocale(window.navigator.language)
}

export function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  setToLocalStorage(LOCALE_STORAGE_KEY, locale)
  document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`
}

export function t(locale: Locale, key: TranslationKey, values?: TranslationValues): string {
  return interpolate(MESSAGES[locale][key] ?? MESSAGES.en[key], values)
}

export function tr(locale: Locale, value: string, values?: TranslationValues): string {
  const translatedValue = locale === 'zh' ? (UI_TEXT_MAP[value] ?? value) : value
  return interpolate(translatedValue, values)
}

export function getViewLabel(locale: Locale, rawView: string): string {
  const viewMap: Record<string, TranslationKey> = {
    dashboard: 'view.dashboard',
    infrastructure: 'view.infrastructure',
    agents: 'view.agents',
    certificates: 'view.certificates',
    alerts: 'view.alerts',
    logs: 'view.logs',
    tools: 'view.tools',
    help: 'view.help',
    settings: 'view.settings',
  }

  const normalizedView = rawView.toLowerCase()
  const messageKey = viewMap[normalizedView]
  return messageKey ? t(locale, messageKey) : rawView
}

export function localizeToastMessage(locale: Locale, message: string): string {
  const exactKey = TOAST_EXACT_KEY_MAP[message]
  if (exactKey) return t(locale, exactKey)

  const agentStatusMatch = message.match(/^Agent\s+(.+?)\s+status toggled via voice link\.$/)
  if (agentStatusMatch) {
    return t(locale, 'toast.agentStatusToggled', { id: agentStatusMatch[1] })
  }

  const incidentResolvedMatch = message.match(/^Incident\s+(.+?)\s+resolved via voice link\.$/)
  if (incidentResolvedMatch) {
    return t(locale, 'toast.incidentResolved', { id: incidentResolvedMatch[1] })
  }

  const monitorActiveMatch = message.match(/^Monitor active for\s+(.+?)\.$/)
  if (monitorActiveMatch) {
    return t(locale, 'toast.monitorActive', { domain: monitorActiveMatch[1] })
  }

  const nodeDeployedMatch = message.match(/^Node\s+(.+?)\s+deployed\.$/)
  if (nodeDeployedMatch) {
    return t(locale, 'toast.nodeDeployed', { name: nodeDeployedMatch[1] })
  }

  const inviteBroadcastedMatch = message.match(/^Invite broadcasted to\s+(.+)$/)
  if (inviteBroadcastedMatch) {
    return t(locale, 'toast.inviteBroadcasted', { email: inviteBroadcastedMatch[1] })
  }

  return message
}
