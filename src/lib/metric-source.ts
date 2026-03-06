import type { MetricSourceItemResponse } from "@/types/api"

export function buildMetricSourceDisplayNameMap(items: MetricSourceItemResponse[]) {
  const map: Record<string, string> = {}

  items.forEach((item) => {
    const name = item.display_name?.trim()

    if (!name) {
      return
    }

    if (item.id) {
      map[item.id] = name
    }

    const cloudInstanceId = item.instance_id?.trim()
    if (cloudInstanceId) {
      map[cloudInstanceId] = name
    }
  })

  return map
}
