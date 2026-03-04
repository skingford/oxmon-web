export type CloudProviderOption = {
  value: string
  label: string
  sortOrder: number
}

type CloudProviderDictionaryItem = {
  dict_key: string
  dict_label: string
  sort_order: number
}

const CLOUD_PROVIDER_ALIASES: Record<string, string> = {
  aliyun: "alibaba",
  alicloud: "alibaba",
  alibabacloud: "alibaba",
  tencentcloud: "tencent",
  qcloud: "tencent",
  sangforcloud: "sangfor",
  "sangfor-cloud": "sangfor",
  sangfor_scp: "sangfor",
  scp: "sangfor",
}

export function normalizeCloudProvider(value: string | null | undefined) {
  const normalized = (value || "").trim().toLowerCase()
  if (!normalized) {
    return ""
  }

  return CLOUD_PROVIDER_ALIASES[normalized] || normalized
}

export function normalizeCloudProviderDictionaryItems(items: CloudProviderDictionaryItem[]): CloudProviderOption[] {
  const normalizedItems = items
    .map((item) => ({
      value: normalizeCloudProvider(item.dict_key),
      label: item.dict_label.trim() || normalizeCloudProvider(item.dict_key),
      sortOrder: item.sort_order,
    }))
    .filter((item) => Boolean(item.value))
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder
      }

      return left.label.localeCompare(right.label)
    })

  const seen = new Set<string>()
  return normalizedItems.filter((item) => {
    if (seen.has(item.value)) {
      return false
    }

    seen.add(item.value)
    return true
  })
}

export function buildFallbackCloudProviderOptions(locale: "zh" | "en"): CloudProviderOption[] {
  return [
    {
      value: "tencent",
      label: locale === "zh" ? "腾讯云" : "Tencent Cloud",
      sortOrder: 10,
    },
    {
      value: "alibaba",
      label: locale === "zh" ? "阿里云" : "Alibaba Cloud",
      sortOrder: 20,
    },
    {
      value: "sangfor",
      label: locale === "zh" ? "深信服云平台" : "Sangfor Cloud Platform",
      sortOrder: 30,
    },
  ]
}
