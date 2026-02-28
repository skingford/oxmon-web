"use client"

import Link from "next/link"
import { withLocalePrefix } from "@/components/app-locale"
import {
  getCloudInstanceStatusBadgeVariant,
  resolveCloudInstanceName,
  resolveCloudInstanceStatus,
  type CloudInstanceStatusKey,
} from "@/components/pages/cloud/cloud-instance-list-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TablePaginationControls } from "@/components/ui/table-pagination-controls"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CloudInstanceResponse } from "@/types/api"

type CloudInstancesTableCardProps = {
  loading: boolean
  locale: "zh" | "en"
  instances: CloudInstanceResponse[]
  title: string
  description: string
  getStatusLabel: (status: CloudInstanceStatusKey) => string
  formatDateTime: (value: string | null | undefined, locale: "zh" | "en") => string
  tableTexts: {
    colInstance: string
    colProvider: string
    colAccount: string
    colRegion: string
    colIp: string
    colOs: string
    colStatus: string
    colLastSeen: string
    loading: string
    empty: string
    actionViewDetails: string
  }
  pagination: {
    summaryText: string
    pageIndicatorText: string
    pageSize: number
    pageSizeOptions: number[]
    pageSizePlaceholder: string
    prevLabel: string
    nextLabel: string
    onPageSizeChange: (pageSize: number) => void
    onPrevPage: () => void
    onNextPage: () => void
    prevDisabled: boolean
    nextDisabled: boolean
    pageSizeOptionLabel?: (pageSize: number) => string
  }
}

export function CloudInstancesTableCard({
  loading,
  locale,
  instances,
  title,
  description,
  getStatusLabel,
  formatDateTime,
  tableTexts,
  pagination,
}: CloudInstancesTableCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tableTexts.colInstance}</TableHead>
                <TableHead>{tableTexts.colProvider}</TableHead>
                <TableHead>{tableTexts.colAccount}</TableHead>
                <TableHead>{tableTexts.colRegion}</TableHead>
                <TableHead>{tableTexts.colIp}</TableHead>
                <TableHead>{tableTexts.colOs}</TableHead>
                <TableHead>{tableTexts.colStatus}</TableHead>
                <TableHead>{tableTexts.colLastSeen}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                    {tableTexts.loading}
                  </TableCell>
                </TableRow>
              ) : instances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                    {tableTexts.empty}
                  </TableCell>
                </TableRow>
              ) : (
                instances.map((instance) => {
                  const normalizedStatus = resolveCloudInstanceStatus(instance)

                  return (
                    <TableRow key={instance.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <Link
                            href={withLocalePrefix(`/cloud/instances/${instance.id}`, locale)}
                            className="font-medium hover:underline"
                          >
                            {resolveCloudInstanceName(instance)}
                          </Link>
                          <div className="font-mono text-xs text-muted-foreground">{instance.instance_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{instance.provider}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{instance.account_config_key}</TableCell>
                      <TableCell>{instance.region}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div>{instance.public_ip || "-"}</div>
                          <div className="text-muted-foreground">{instance.private_ip || "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">{instance.os || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getCloudInstanceStatusBadgeVariant(normalizedStatus)}>
                          {getStatusLabel(normalizedStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between gap-2">
                          <span>{formatDateTime(instance.last_seen_at, locale)}</span>
                          <Button asChild type="button" variant="outline" size="sm">
                            <Link href={withLocalePrefix(`/cloud/instances/${instance.id}`, locale)}>
                              {tableTexts.actionViewDetails}
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

        <TablePaginationControls
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
