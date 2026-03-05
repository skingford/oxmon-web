export function notifiedBadgeClassName(notified: boolean) {
  if (notified) {
    return "border-emerald-200 bg-emerald-50 text-emerald-600"
  }

  return "border-slate-200 bg-slate-50 text-slate-600"
}
