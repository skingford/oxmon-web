"use client"

import { Loader2, MoreHorizontal, Play, TestTube2 } from "lucide-react"
import type { CloudAccountResponse } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyCurlSubmenu } from "@/components/ui/copy-curl-dropdown"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HttpMethodBadge } from "@/components/ui/http-method-badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type CloudAccountsTableCardProps = {
  loading: boolean
  locale: "zh" | "en"
  accounts: CloudAccountResponse[]
  testingId: string | null
  collectingId: string | null
  togglingId: string | null
  onToggleEnabled: (account: CloudAccountResponse) => void
  onTestConnection: (account: CloudAccountResponse) => void
  onCollect: (account: CloudAccountResponse) => void
  onCopyTestCurl: (account: CloudAccountResponse, insecure?: boolean) => void | Promise<void>
  onCopyCollectCurl: (account: CloudAccountResponse, insecure?: boolean) => void | Promise<void>
  onCopyUpdateCurl: (account: CloudAccountResponse, insecure?: boolean) => void | Promise<void>
  onEdit: (account: CloudAccountResponse) => void
  onDelete: (account: CloudAccountResponse) => void
  formatDateTime: (value: string | null | undefined, locale: "zh" | "en") => string
  texts: {
    title: string
    description: string
    colName: string
    colConfigKey: string
    colProvider: string
    colStatus: string
    colUpdatedAt: string
    colActions: string
    tableLoading: string
    tableEmpty: string
    toggleEnabledLabel: string
    statusEnabled: string
    statusDisabled: string
    actionTest: string
    actionCollect: string
    actionMore: string
    actionDebugCurl: string
    actionCopyTestCurl: string
    actionCopyCollectCurl: string
    actionCopyUpdateCurl: string
    actionEdit: string
    actionDelete: string
    debugMenuLabel: string
    copyApiCurlNormal: string
    copyApiCurlInsecure: string
    copyApiCurlInsecureBadge: string
  }
}

export function CloudAccountsTableCard({
  loading,
  locale,
  accounts,
  testingId,
  collectingId,
  togglingId,
  onToggleEnabled,
  onTestConnection,
  onCollect,
  onCopyTestCurl,
  onCopyCollectCurl,
  onCopyUpdateCurl,
  onEdit,
  onDelete,
  formatDateTime,
  texts,
}: CloudAccountsTableCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{texts.title}</CardTitle>
        <CardDescription>{texts.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{texts.colName}</TableHead>
                <TableHead>{texts.colConfigKey}</TableHead>
                <TableHead>{texts.colProvider}</TableHead>
                <TableHead>{texts.colStatus}</TableHead>
                <TableHead>{texts.colUpdatedAt}</TableHead>
                <TableHead className="text-right">{texts.colActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    {texts.tableLoading}
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    {texts.tableEmpty}
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{account.display_name}</div>
                        {account.description ? (
                          <div className="max-w-[320px] truncate text-xs text-muted-foreground">
                            {account.description}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{account.config_key}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{account.provider}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={account.enabled}
                          disabled={togglingId === account.id}
                          onCheckedChange={() => onToggleEnabled(account)}
                          aria-label={texts.toggleEnabledLabel}
                        />
                        <span className="text-sm text-muted-foreground">
                          {account.enabled ? texts.statusEnabled : texts.statusDisabled}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(account.updated_at, locale)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(account)}>
                          {texts.actionEdit}
                        </Button>
                        <DropdownMenu modal>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" size="sm">
                              <MoreHorizontal className="mr-1 h-3.5 w-3.5" />
                              {texts.actionMore}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" sideOffset={6} className="z-[200] bg-popover shadow-xl">
                            <DropdownMenuLabel>{texts.actionMore}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => onTestConnection(account)}
                              disabled={testingId === account.id}
                            >
                              {testingId === account.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <TestTube2 className="h-3.5 w-3.5" />
                              )}
                              {texts.actionTest}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => onCollect(account)}
                              disabled={collectingId === account.id}
                            >
                              {collectingId === account.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                              {texts.actionCollect}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>{texts.debugMenuLabel}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <CopyCurlSubmenu
                              texts={{
                                title: texts.actionCopyTestCurl,
                                normal: texts.copyApiCurlNormal,
                                insecure: texts.copyApiCurlInsecure,
                              }}
                              onCopy={(insecure) => onCopyTestCurl(account, insecure)}
                              label={texts.actionCopyTestCurl}
                              preferenceKeyId="cloud-accounts-copy-test-curl"
                              suffix={<HttpMethodBadge method="POST" className="ml-auto" />}
                              insecureBadgeLabel={texts.copyApiCurlInsecureBadge}
                            />
                            <CopyCurlSubmenu
                              texts={{
                                title: texts.actionCopyCollectCurl,
                                normal: texts.copyApiCurlNormal,
                                insecure: texts.copyApiCurlInsecure,
                              }}
                              onCopy={(insecure) => onCopyCollectCurl(account, insecure)}
                              label={texts.actionCopyCollectCurl}
                              preferenceKeyId="cloud-accounts-copy-collect-curl"
                              suffix={<HttpMethodBadge method="POST" className="ml-auto" />}
                              insecureBadgeLabel={texts.copyApiCurlInsecureBadge}
                            />
                            <CopyCurlSubmenu
                              texts={{
                                title: texts.actionCopyUpdateCurl,
                                normal: texts.copyApiCurlNormal,
                                insecure: texts.copyApiCurlInsecure,
                              }}
                              onCopy={(insecure) => onCopyUpdateCurl(account, insecure)}
                              label={texts.actionCopyUpdateCurl}
                              preferenceKeyId="cloud-accounts-copy-update-curl"
                              suffix={<HttpMethodBadge method="PUT" className="ml-auto" />}
                              insecureBadgeLabel={texts.copyApiCurlInsecureBadge}
                            />
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => onDelete(account)}
                            >
                              {texts.actionDelete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
