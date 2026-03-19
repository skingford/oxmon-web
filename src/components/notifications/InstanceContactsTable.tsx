"use client"

import type { InstanceContactItem } from "@/types/api"
import { formatDateTimeByLocale } from "@/lib/date-time"
import { getInstanceContactChannels } from "@/lib/notifications/instance-contact-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type InstanceContactsPagination = {
  pageSize: number
  pageSizeOptions: number[]
  onPageSizeChange: (pageSize: number) => void
  summaryText: string
  pageIndicatorText: string
  pageSizePlaceholder: string
  prevLabel: string
  nextLabel: string
  onPrevPage: () => void
  onNextPage: () => void
  prevDisabled: boolean
  nextDisabled: boolean
  pageSizeOptionLabel: (pageSize: number) => string
}

type InstanceContactsTableProps = {
  loading: boolean
  contacts: InstanceContactItem[]
  hasActiveFilters: boolean
  togglingId: string | null
  locale: "zh" | "en"
  pagination: InstanceContactsPagination
  onToggleEnabled: (contact: InstanceContactItem) => void | Promise<void>
  onEdit: (contact: InstanceContactItem) => void | Promise<void>
  onDelete: (contact: InstanceContactItem) => void
  texts: {
    title: string
    description: string
    colName: string
    colPatterns: string
    colChannels: string
    colStatus: string
    colUpdatedAt: string
    colActions: string
    loading: string
    empty: string
    emptyFiltered: string
    actionEdit: string
    actionDelete: string
    channelEmail: string
    channelPhone: string
    channelDingtalk: string
    channelWebhook: string
    patternMore: string
    toggleLabel: string
    statusEnabled: string
    statusDisabled: string
  }
}

function formatChannelLabel(type: string, texts: InstanceContactsTableProps["texts"]) {
  if (type === "email") {
    return texts.channelEmail
  }

  if (type === "phone") {
    return texts.channelPhone
  }

  if (type === "dingtalk") {
    return texts.channelDingtalk
  }

  return texts.channelWebhook
}

export function InstanceContactsTable({
  loading,
  contacts,
  hasActiveFilters,
  togglingId,
  locale,
  pagination,
  onToggleEnabled,
  onEdit,
  onDelete,
  texts,
}: InstanceContactsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{texts.title}</CardTitle>
        <CardDescription>{texts.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>{texts.colName}</TableHead>
                <TableHead>{texts.colPatterns}</TableHead>
                <TableHead>{texts.colChannels}</TableHead>
                <TableHead>{texts.colStatus}</TableHead>
                <TableHead>{texts.colUpdatedAt}</TableHead>
                <TableHead className="text-right">{texts.colActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    {texts.loading}
                  </TableCell>
                </TableRow>
              ) : contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    {hasActiveFilters ? texts.emptyFiltered : texts.empty}
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => {
                  const channels = getInstanceContactChannels(contact)
                  const previewPatterns = contact.agent_patterns.slice(0, 2)
                  const extraPatternCount = Math.max(0, contact.agent_patterns.length - previewPatterns.length)

                  return (
                    <TableRow key={contact.id}>
                      <TableCell className="max-w-[260px]">
                        <div className="space-y-1">
                          <p className="font-medium">{contact.contact_name}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {contact.description || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <div className="flex flex-wrap gap-1.5">
                          {previewPatterns.map((pattern) => (
                            <Badge key={pattern} variant="outline" className="max-w-[220px] truncate font-mono text-[11px]">
                              {pattern}
                            </Badge>
                          ))}
                          {extraPatternCount > 0 ? (
                            <Badge variant="secondary">
                              {texts.patternMore.replace("{count}", String(extraPatternCount))}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        {channels.length === 0 ? (
                          <span className="text-sm text-muted-foreground">-</span>
                        ) : (
                          <div className="space-y-1.5">
                            {channels.map((channel) => (
                              <div key={`${contact.id}-${channel.type}`} className="flex items-center gap-2 text-xs">
                                <Badge variant="secondary">{formatChannelLabel(channel.type, texts)}</Badge>
                                <span className="truncate text-muted-foreground">{channel.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={contact.enabled}
                            onCheckedChange={() => onToggleEnabled(contact)}
                            disabled={togglingId === contact.id}
                            aria-label={texts.toggleLabel}
                          />
                          <Badge variant={contact.enabled ? "secondary" : "outline"}>
                            {contact.enabled ? texts.statusEnabled : texts.statusDisabled}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTimeByLocale(contact.updated_at, locale)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => void onEdit(contact)}>
                            {texts.actionEdit}
                          </Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(contact)}>
                            {texts.actionDelete}
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

        <PaginationControls
          pageSize={pagination.pageSize}
          pageSizeOptions={pagination.pageSizeOptions}
          onPageSizeChange={pagination.onPageSizeChange}
          summaryText={pagination.summaryText}
          pageIndicatorText={pagination.pageIndicatorText}
          pageSizePlaceholder={pagination.pageSizePlaceholder}
          prevLabel={pagination.prevLabel}
          nextLabel={pagination.nextLabel}
          onPrevPage={pagination.onPrevPage}
          onNextPage={pagination.onNextPage}
          prevDisabled={pagination.prevDisabled}
          nextDisabled={pagination.nextDisabled}
          pageSizeOptionLabel={pagination.pageSizeOptionLabel}
        />
      </CardContent>
    </Card>
  )
}
