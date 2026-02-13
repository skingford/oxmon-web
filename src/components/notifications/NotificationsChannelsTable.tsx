"use client"

import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import {
  formatDateTime,
  getChannelTypeLabel,
  getSeverityClassName,
  getSeverityLabel,
} from "@/lib/notifications/channel-utils"
import type { ChannelOverview, SystemConfigResponse } from "@/types/api"
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
  Loader2,
  Pencil,
  Send,
  Trash2,
  TriangleAlert,
  Users,
} from "lucide-react"

type NotificationsChannelsTableProps = {
  loading: boolean
  channels: ChannelOverview[]
  hasActiveFilters: boolean
  systemConfigMap: Map<string, SystemConfigResponse>
  togglingId: string | null
  testingId: string | null
  locale: "zh" | "en"
  t: AppNamespaceTranslator<"pages">
  onEdit: (channel: ChannelOverview) => void
  onOpenRecipients: (channel: ChannelOverview) => void | Promise<void>
  onToggleEnabled: (channel: ChannelOverview) => void | Promise<void>
  onTestChannel: (channel: ChannelOverview) => void | Promise<void>
  onOpenDelete: (channel: ChannelOverview) => void
}

export function NotificationsChannelsTable({
  loading,
  channels,
  hasActiveFilters,
  systemConfigMap,
  togglingId,
  testingId,
  locale,
  t,
  onEdit,
  onOpenRecipients,
  onToggleEnabled,
  onTestChannel,
  onOpenDelete,
}: NotificationsChannelsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("notifications.tableTitle")}</CardTitle>
        <CardDescription>{t("notifications.tableDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("notifications.tableColName")}</TableHead>
              <TableHead>{t("notifications.tableColType")}</TableHead>
              <TableHead>{t("notifications.tableColSystemConfig")}</TableHead>
              <TableHead>{t("notifications.tableColSeverity")}</TableHead>
              <TableHead>{t("notifications.tableColRecipients")}</TableHead>
              <TableHead>{t("notifications.tableColStatus")}</TableHead>
              <TableHead>{t("notifications.tableColUpdated")}</TableHead>
              <TableHead className="text-right">{t("notifications.tableColActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={8} className="h-16 text-muted-foreground">
                    {t("notifications.tableLoading")}
                  </TableCell>
                </TableRow>
              ))
            ) : channels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
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
                const recipients = channel.recipients || []
                const boundSystemConfig = channel.system_config_id
                  ? systemConfigMap.get(channel.system_config_id)
                  : null
                const statusKey = channel.enabled ? "notifications.statusEnabled" : "notifications.statusDisabled"
                const recipientCountKey = recipients.length === 1
                  ? "notifications.recipientCountOne"
                  : "notifications.recipientCountMany"

                return (
                  <TableRow key={channel.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{channel.name}</p>
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
                      {boundSystemConfig ? (
                        <div className="space-y-1">
                          <p className="text-sm">{boundSystemConfig.display_name}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {boundSystemConfig.config_key}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t("notifications.systemConfigNone")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getSeverityClassName(channel.min_severity)}>
                        {getSeverityLabel(channel.min_severity, t)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {recipients.length > 0 ? (
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {recipients.slice(0, 2).map((recipient) => (
                              <Badge key={recipient} variant="secondary" className="max-w-[180px] truncate">
                                {recipient}
                              </Badge>
                            ))}
                            {recipients.length > 2 ? (
                              <span className="text-xs text-muted-foreground">
                                {t("notifications.recipientMore", {
                                  count: recipients.length - 2,
                                })}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t(recipientCountKey, { count: recipients.length })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t("notifications.recipientNone")}
                        </span>
                      )}
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(channel)}
                          title={t("notifications.actionEdit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onOpenRecipients(channel)}
                          title={t("notifications.actionRecipients")}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={testingId === channel.id || !channel.enabled}
                          onClick={() => onTestChannel(channel)}
                          title={t("notifications.actionTest")}
                        >
                          {testingId === channel.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onOpenDelete(channel)}
                          title={t("notifications.actionDelete")}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
