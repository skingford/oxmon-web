import { Badge } from "@/components/ui/badge"

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

const METHOD_CLASS_MAP: Record<HttpMethod, string> = {
  GET: "border-blue-200 text-blue-700",
  POST: "border-emerald-200 text-emerald-700",
  PUT: "border-amber-200 text-amber-700",
  PATCH: "border-violet-200 text-violet-700",
  DELETE: "border-red-200 text-red-700",
}

export function HttpMethodBadge({
  method,
  className = "",
}: {
  method: HttpMethod
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={`h-4 px-1 text-[10px] leading-none ${METHOD_CLASS_MAP[method]} ${className}`.trim()}
    >
      {method}
    </Badge>
  )
}

