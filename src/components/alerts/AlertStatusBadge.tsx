"use client"

import { Badge } from "@/components/ui/badge"
import {
  getAlertStatusBadgeClass,
  getAlertStatusIcon,
  getAlertStatusLabel,
} from "@/components/alerts/alert-status-utils"

type AlertStatusBadgeProps = {
  status: number | null | undefined
  t: (key: "history.statusResolved" | "history.statusAcknowledged" | "history.statusOpen") => string
}

export function AlertStatusBadge({ status, t }: AlertStatusBadgeProps) {
  const StatusIcon = getAlertStatusIcon(status)

  return (
    <Badge className={getAlertStatusBadgeClass(status)}>
      <StatusIcon className="mr-1 h-3 w-3" />
      {getAlertStatusLabel(status, t)}
    </Badge>
  )
}
