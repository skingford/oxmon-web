"use client"

import Link from "next/link"
import { withLocalePrefix } from "@/components/app-locale"
import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import {
  formatDateTime,
  getChannelTypeLabel,
  getSeverityClassName,
  getSeverityLabel,
} from "@/lib/notifications/channel-utils"
import type { ChannelOverview } from "@/types/api"
import { ChannelTypeIcon } from "@/components/notifications/ChannelTypeIcon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircle2,
  CircleOff,
  TriangleAlert,
} from "lucide-react"

type NotificationsChannelsTableProps = {
  loading: boolean
  channels: ChannelOverview[]
  hasActiveFilters: boolean
  togglingId: string | null
  locale: "zh" | "en"
  t: AppNamespaceTranslator<"pages">
  onToggleEnabled: (channel: ChannelOverview) => void | Promise<void>
}

export function NotificationsChannelsTable({
  loading,
  channels,
  hasActiveFilters,
  togglingId,
  locale,
  t,
  onToggleEnabled,
}: NotificationsChannelsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("notifications.tableTitle")}</CardTitle>
        <CardDescription>{t("notifications.tableDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("notifications.tableColName")}</TableHead>
                <TableHead>{t("notifications.tableColType")}</TableHead>
                <TableHead>{t("notifications.tableColSeverity")}</TableHead>
                <TableHead>{t("notifications.tableColStatus")}</TableHead>
                <TableHead>{t("notifications.tableColUpdated")}</TableHead>
                <TableHead className="text-right">{t("notifications.tableColActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={6} className="h-16 text-muted-foreground">
                      {t("notifications.tableLoading")}
                    </TableCell>
                  </TableRow>
                ))
              ) : channels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                      <TriangleAlert className="h-5 w-5" />
                      <p>{hasActiveFilters ? t("notifications.tableEmptyFiltered") : t("notifications.tableEmpty")}</p>
                      {!hasActiveFilters ? (
                        <p className="text-xs">{t("notifications.tableEmptyHint")}</p>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                channels.map((channel) => {
                  const statusKey = channel.enabled ? "notifications.statusEnabled" : "notifications.statusDisabled"

                  return (
                    <TableRow key={channel.id}>
                      <TableCell className="max-w-[280px]">
                        <div className="space-y-1">
                          <p className="truncate font-medium">{channel.name}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {channel.description || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-primary"><ChannelTypeIcon channelType={channel.channel_type} /></span>
                          <span className="text-sm">{getChannelTypeLabel(channel.channel_type, t)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getSeverityClassName(channel.min_severity)}>
                          {getSeverityLabel(channel.min_severity, t)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={channel.enabled}
                            onCheckedChange={() => onToggleEnabled(channel)}
                            disabled={togglingId === channel.id}
                            aria-label={t("notifications.toggleLabel")}
                          />
                          <Badge variant={channel.enabled ? "secondary" : "outline"}>
                            {channel.enabled ? (
                              <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
                            ) : (
                              <CircleOff className="mr-1 h-3 w-3 text-muted-foreground" />
                            )}
                            {t(statusKey)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(channel.updated_at, locale)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button asChild type="button" variant="outline" size="sm">
                            <Link href={withLocalePrefix(`/notifications/${channel.id}`, locale)}>
                              {t("notifications.actionDetails")}
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
