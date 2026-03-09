"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Plus, RefreshCw } from "lucide-react"
import { api } from "@/lib/api"
import { formatDateTimeByLocale } from "@/lib/date-time"
import { encryptPasswordWithPublicKey } from "@/lib/password-encryption"
import { getAuthTokenPayload } from "@/lib/auth-token"
import type { AdminUserResponse } from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useServerOffsetPagination } from "@/hooks/use-server-offset-pagination"
import { buildTranslatedPaginationTextBundle } from "@/lib/pagination-summary"
import { toast, toastApiError, toastCreated, toastSaved, toastStatusError } from "@/lib/toast"
import Link from "next/link"
import { withLocalePrefix } from "@/components/app-locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaginationControls } from "@/components/ui/pagination-controls"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const PAGE_LIMIT = 20

type AdminUsersPageState = {
  items: AdminUserResponse[]
  total: number
}

type CreateForm = {
  username: string
  password: string
}

type ResetPasswordForm = {
  password: string
}

function getDefaultCreateForm(): CreateForm {
  return {
    username: "",
    password: "",
  }
}

function getDefaultResetForm(): ResetPasswordForm {
  return {
    password: "",
  }
}

function resolveUserStatusBadgeVariant(status: string) {
  return status === "disabled" ? "destructive" as const : "success" as const
}

export default function SystemAdminUsersPage() {
  const { t, locale } = useAppTranslations("system")
  const [keyword, setKeyword] = useState("")
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<AdminUsersPageState>({ items: [], total: 0 })
  const [createOpen, setCreateOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(getDefaultCreateForm)
  const [resetTarget, setResetTarget] = useState<AdminUserResponse | null>(null)
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [resetForm, setResetForm] = useState<ResetPasswordForm>(getDefaultResetForm)
  const [toggleStatusTarget, setToggleStatusTarget] = useState<AdminUserResponse | null>(null)
  const [togglingStatusUserId, setTogglingStatusUserId] = useState<string | null>(null)
  const authPayload = useMemo(() => getAuthTokenPayload(), [])

  const fetchUsers = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const page = await api.listAdminUsersPage({
        username__contains: keyword.trim() || undefined,
        limit: PAGE_LIMIT,
        offset,
      })

      setData({
        items: page.items,
        total: page.total,
      })
    } catch (error) {
      toastApiError(error, t("adminUsersToastFetchError"))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [keyword, offset, t])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const pagination = useServerOffsetPagination({
    offset,
    limit: PAGE_LIMIT,
    currentItemsCount: data.items.length,
    totalItems: data.total,
  })

  const stats = useMemo(() => {
    return {
      total: data.total,
      currentPageCount: data.items.length,
    }
  }, [data.items.length, data.total])

  const applyFilters = () => {
    if (offset === 0) {
      fetchUsers(true)
      return
    }

    setOffset(0)
  }

  const resetFilters = () => {
    setKeyword("")
    setOffset(0)
  }

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const username = createForm.username.trim()
    const password = createForm.password

    if (!username) {
      toast.error(t("adminUsersToastUsernameRequired"))
      return
    }

    if (!password) {
      toast.error(t("adminUsersToastPasswordRequired"))
      return
    }

    if (password.length < 8) {
      toast.error(t("adminUsersToastPasswordTooShort"))
      return
    }

    setCreateSubmitting(true)
    try {
      const publicKey = await api.getAuthPublicKey()
      const encryptedPassword = await encryptPasswordWithPublicKey(publicKey.public_key, password)

      await api.createAdminUser({
        username,
        encrypted_password: encryptedPassword,
      })

      toastCreated(t("adminUsersToastCreateSuccess"))
      setCreateOpen(false)
      setCreateForm(getDefaultCreateForm())
      await fetchUsers(true)
    } catch (error) {
      toastStatusError(error, t("adminUsersToastCreateError"), {
        409: t("adminUsersToastCreateConflict"),
      })
    } finally {
      setCreateSubmitting(false)
    }
  }

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!resetTarget) {
      return
    }

    const password = resetForm.password
    if (!password) {
      toast.error(t("adminUsersToastPasswordRequired"))
      return
    }

    if (password.length < 8) {
      toast.error(t("adminUsersToastPasswordTooShort"))
      return
    }

    setResetSubmitting(true)
    try {
      const publicKey = await api.getAuthPublicKey()
      const encryptedPassword = await encryptPasswordWithPublicKey(publicKey.public_key, password)

      await api.resetAdminUserPassword(resetTarget.id, {
        encrypted_new_password: encryptedPassword,
      })

      toastSaved(t("adminUsersToastResetPasswordSuccess"))
      setResetTarget(null)
      setResetForm(getDefaultResetForm())
    } catch (error) {
      toastApiError(error, t("adminUsersToastResetPasswordError"))
    } finally {
      setResetSubmitting(false)
    }
  }

  const handleToggleUserStatus = async (item: AdminUserResponse) => {
    const nextStatus = item.status === "disabled" ? "active" : "disabled"
    setTogglingStatusUserId(item.id)
    try {
      await api.updateAdminUser(item.id, { status: nextStatus })
      toastSaved(nextStatus === "disabled" ? t("adminUsersToastDisableSuccess") : t("adminUsersToastEnableSuccess"))
      await fetchUsers(true)
    } catch (error) {
      toastApiError(error, t("adminUsersToastToggleStatusError"))
    } finally {
      setTogglingStatusUserId(null)
    }
  }

  const handleConfirmToggleUserStatus = async () => {
    if (!toggleStatusTarget) {
      return
    }

    await handleToggleUserStatus(toggleStatusTarget)
    setToggleStatusTarget(null)
  }

  return (
    <div className="space-y-6 px-8 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("adminUsersTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("adminUsersDescription")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => fetchUsers(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {t("adminUsersRefreshButton")}
          </Button>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("adminUsersCreateButton")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("adminUsersStatTotal")}</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("adminUsersStatCurrentPage")}</CardDescription>
            <CardTitle className="text-2xl">{stats.currentPageCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("adminUsersFiltersTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              applyFilters()
            }}
          >
            <div className="grid gap-4 md:grid-cols-[minmax(260px,380px)_1fr]">
              <div className="space-y-2">
                <Label htmlFor="admin-users-keyword">{t("adminUsersFieldUsernameContains")}</Label>
                <Input
                  id="admin-users-keyword"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder={t("adminUsersFieldUsernameContainsPlaceholder")}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit">{t("adminUsersApplyFilters")}</Button>
              <Button type="button" variant="outline" onClick={resetFilters}>{t("adminUsersClearFilters")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("adminUsersTableTitle")}</CardTitle>
          <CardDescription>{t("adminUsersTableDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("adminUsersTableColUsername")}</TableHead>
                  <TableHead>{t("adminUsersTableColStatus")}</TableHead>
                  <TableHead>{t("adminUsersTableColId")}</TableHead>
                  <TableHead>{t("adminUsersTableColCreatedAt")}</TableHead>
                  <TableHead>{t("adminUsersTableColUpdatedAt")}</TableHead>
                  <TableHead className="text-right">{t("adminUsersTableColActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {t("adminUsersTableLoading")}
                    </TableCell>
                  </TableRow>
                ) : data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {t("adminUsersTableEmpty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((item) => (
                    (() => {
                      const subject = String(authPayload?.sub || "")
                      const authUsername = String(authPayload?.username || "")
                      const isCurrentUser =
                        (subject && (item.id === subject || item.username === subject)) ||
                        (authUsername && item.username === authUsername)

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <Link className="hover:underline" href={withLocalePrefix(`/system/admin-users/${item.id}`, locale)}>
                              {item.username}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={resolveUserStatusBadgeVariant(item.status)}>
                              {item.status === "disabled" ? t("adminUsersStatusDisabled") : t("adminUsersStatusActive")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{item.id}</TableCell>
                          <TableCell>{formatDateTimeByLocale(item.created_at, locale, item.created_at || "-", { hour12: false })}</TableCell>
                          <TableCell>{formatDateTimeByLocale(item.updated_at, locale, item.updated_at || "-", { hour12: false })}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button asChild type="button" variant="outline" size="sm">
                                <Link href={withLocalePrefix(`/system/admin-users/${item.id}`, locale)}>
                                  {t("adminUsersActionDetails")}
                                </Link>
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => setResetTarget(item)}>
                                {t("adminUsersActionResetPassword")}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setToggleStatusTarget(item)}
                                disabled={isCurrentUser}
                                title={isCurrentUser ? t("adminUsersToggleSelfHint") : undefined}
                              >
                                {togglingStatusUserId === item.id
                                  ? t("adminUsersActionStatusUpdating")
                                  : item.status === "disabled"
                                    ? t("adminUsersActionEnable")
                                    : t("adminUsersActionDisable")}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })()
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            className="mt-4"
            pageSize={PAGE_LIMIT}
            {...buildTranslatedPaginationTextBundle({
              t,
              summaryKey: "adminUsersPaginationSummary",
              total: data.total,
              start: pagination.rangeStart,
              end: pagination.rangeEnd,
              pageKey: "adminUsersPaginationPage",
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages,
              prevKey: "adminUsersPaginationPrev",
              nextKey: "adminUsersPaginationNext",
            })}
            onPrevPage={() => setOffset((previous) => Math.max(0, previous - PAGE_LIMIT))}
            onNextPage={() => setOffset((previous) => previous + PAGE_LIMIT)}
            prevDisabled={!pagination.canGoPrev || loading}
            nextDisabled={!pagination.canGoNext || loading}
          />
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={(nextOpen) => {
        if (!createSubmitting) {
          setCreateOpen(nextOpen)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminUsersCreateDialogTitle")}</DialogTitle>
            <DialogDescription>{t("adminUsersCreateDialogDescription")}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateUser}>
            <div className="space-y-2">
              <Label htmlFor="admin-create-username">{t("adminUsersFieldUsername")}</Label>
              <Input
                id="admin-create-username"
                value={createForm.username}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, username: event.target.value }))}
                placeholder={t("adminUsersFieldUsernamePlaceholder")}
                disabled={createSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-create-password">{t("adminUsersFieldPassword")}</Label>
              <Input
                id="admin-create-password"
                type="password"
                value={createForm.password}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder={t("adminUsersFieldPasswordPlaceholder")}
                disabled={createSubmitting}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={createSubmitting}>
                {t("adminUsersDialogCancel")}
              </Button>
              <Button type="submit" disabled={createSubmitting}>
                {createSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("adminUsersCreateDialogSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetTarget)} onOpenChange={(nextOpen) => {
        if (!nextOpen && !resetSubmitting) {
          setResetTarget(null)
          setResetForm(getDefaultResetForm())
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminUsersResetDialogTitle")}</DialogTitle>
            <DialogDescription>{t("adminUsersResetDialogDescription", { username: resetTarget?.username || "-" })}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div className="space-y-2">
              <Label htmlFor="admin-reset-password">{t("adminUsersFieldNewPassword")}</Label>
              <Input
                id="admin-reset-password"
                type="password"
                value={resetForm.password}
                onChange={(event) => setResetForm({ password: event.target.value })}
                placeholder={t("adminUsersFieldPasswordPlaceholder")}
                disabled={resetSubmitting}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetTarget(null)} disabled={resetSubmitting}>
                {t("adminUsersDialogCancel")}
              </Button>
              <Button type="submit" disabled={resetSubmitting}>
                {resetSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("adminUsersResetDialogSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(toggleStatusTarget)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && togglingStatusUserId === null) {
            setToggleStatusTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("adminUsersToggleStatusDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {toggleStatusTarget?.status === "disabled"
                ? t("adminUsersToggleStatusDialogEnableDescription", { username: toggleStatusTarget?.username || "-" })
                : t("adminUsersToggleStatusDialogDisableDescription", { username: toggleStatusTarget?.username || "-" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={togglingStatusUserId !== null}>
              {t("adminUsersDialogCancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggleUserStatus} disabled={togglingStatusUserId !== null}>
              {togglingStatusUserId !== null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("adminUsersToggleStatusDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
