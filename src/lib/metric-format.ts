export type MetricUnitKind =
  | "percent"
  | "bytes"
  | "bytes_per_sec"
  | "iops"
  | "ms"
  | "seconds"
  | "temperature_c"
  | "count"
  | "plain"

export function toFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.replace("%", "").trim()
    const parsed = Number(normalized)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

export function detectMetricUnit(metricName?: string): MetricUnitKind {
  const name = (metricName || "").toLowerCase()

  if (!name) return "plain"
  if (/(percent|_pct|\.pct|cpu\.usage|memory\.usage|disk\.usage)/.test(name))
    return "percent"
  if (/(iops)/.test(name)) return "iops"
  if (/(latency|duration)(_ms|\.ms)?|response_time_ms|_ms$|\.ms$/.test(name))
    return "ms"
  if (
    /(uptime|duration)(_secs|_seconds)?|_secs$|_seconds$|\.seconds$/.test(name)
  )
    return "seconds"
  if (/(temp|temperature)/.test(name)) return "temperature_c"
  if (
    /(bytes_per_sec|bytes\/s|network\.(bytes_recv|bytes_sent)|network_(in|out)_bytes)/.test(
      name,
    )
  )
    return "bytes_per_sec"
  if (
    /(bytes|_bytes|memory_used|disk_used|mem_used|memory_(available|free|total)|mem_(available|free|total)|disk_(available|free|total|size)|filesystem_(available|free|total|size)|fs_(available|free|total|size)|memory\.(available|free|total)|mem\.(available|free|total)|disk\.(available|free|total|size)|filesystem\.(available|free|total|size)|fs\.(available|free|total|size))/.test(
      name,
    )
  )
    return "bytes"
  if (/(connections|count|total|qps|rps|tps)/.test(name)) return "count"

  return "plain"
}

export function formatBinaryBytes(value: number, suffix = "") {
  const abs = Math.abs(value)
  if (abs === 0) return `0 B${suffix}`
  const units = ["B", "KB", "MB", "GB", "TB", "PB"]
  // Clamp sub-byte values to B to avoid negative exponents like units[-1].
  const exponent = Math.max(
    0,
    Math.min(
      Math.floor(Math.log(abs) / Math.log(1024)),
      units.length - 1,
    ),
  )
  const scaled = value / 1024 ** exponent
  const digits = Math.abs(scaled) >= 100 ? 0 : Math.abs(scaled) >= 10 ? 1 : 2
  return `${scaled.toLocaleString(undefined, { maximumFractionDigits: digits })} ${units[exponent]}${suffix}`
}

export function formatMetricValue(
  value: unknown,
  metricName?: string,
  options?: { ratioToPercent?: boolean },
) {
  const parsed = toFiniteNumber(value)
  if (parsed === undefined) {
    if (value === null || value === undefined || value === "") {
      return "-"
    }

    return String(value)
  }

  const unit = detectMetricUnit(metricName)

  if (unit === "percent") {
    const percentValue =
      options?.ratioToPercent && parsed >= 0 && parsed <= 1 ? parsed * 100 : parsed
    return `${percentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
  }

  if (unit === "bytes") {
    return formatBinaryBytes(parsed)
  }

  if (unit === "bytes_per_sec") {
    return formatBinaryBytes(parsed, "/s")
  }

  if (unit === "iops") {
    return `${parsed.toLocaleString(undefined, { maximumFractionDigits: 2 })} IOPS`
  }

  if (unit === "ms") {
    return `${parsed.toLocaleString(undefined, { maximumFractionDigits: 2 })} ms`
  }

  if (unit === "seconds") {
    return `${parsed.toLocaleString(undefined, { maximumFractionDigits: 2 })} s`
  }

  if (unit === "temperature_c") {
    return `${parsed.toLocaleString(undefined, { maximumFractionDigits: 2 })} °C`
  }

  if (unit === "count") {
    return parsed.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }

  if (Math.abs(parsed) >= 1000) {
    return parsed.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  return parsed.toLocaleString(undefined, { maximumFractionDigits: 4 })
}
