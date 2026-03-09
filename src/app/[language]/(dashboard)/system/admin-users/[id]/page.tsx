"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { formatDateTimeByLocale } from "@/lib/date-time"
import { withLocalePrefix } from "@/components/app-locale"
import { useAppLocale } from "@/hooks/use-app-locale"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useRequestState } from "@/hooks/use-request-state"
import { toastApiError, toastSaved } from "@/lib/toast"
import type { AdminUserResponse, UpdateAdminUserRequest } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type DetailState = {
  item: AdminUserResponse | null
}

type FormState = {
  avatar: string
  phone: string
  email: string
}

function toFormState(user: AdminUserResponse): FormState {
  return {
    avatar: user.avatar || "",
    phone: user.phone || "",
    email: user.email || "",
  }
}

export default function AdminUserDetailPage() {
  const { t, locale } = useAppTranslations("system")
  const appLocale = useAppLocale()
  const params = useParams<{ id: string }>()
  const userId = typeof params.id === "string" ? params.id : ""
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>({
    avatar: "",
    phone: "",
    email: "",
  })
  const { data, loading, execute } = useRequestState<DetailState>(
    { item: null },
    { initialLoading: true }
  )

  const fetchDetail = useCallback(async () => {
    if (!userId) {
      return
    }

    await execute(
      async () => {
        const item = await api.getAdminUserById(userId)
        return { item }
      },
      {
        onSuccess: (result) => {
          if (result?.item) {
            setForm(toFormState(result.item))
          }
        },
        onError: (error) => {
          toastApiError(error, t("adminUsersDetailToastFetchError"))
        },
      }
    )
  }, [execute, t, userId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const statusBadgeVariant = useMemo(() => {
    if (data.item?.status === "disabled") {
      return "destructive" as const
    }

    return "success" as const
  }, [data.item?.status])

  const handleSubmit = async () => {
    if (!data.item) {
      return
    }

    const payload: UpdateAdminUserRequest = {
      avatar: form.avatar.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
    }

    setSubmitting(true)
    try {
      const updated = await api.updateAdminUser(data.item.id, payload)
      setForm(toFormState(updated))
      await execute(async () => ({ item: updated }), { silent: true })
      toastSaved(t("adminUsersDetailToastUpdateSuccess"))
    } catch (error) {
      toastApiError(error, t("adminUsersDetailToastUpdateError"))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[220px] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t("adminUsersDetailLoading")}
        </CardContent>
      </Card>
    )
  }

  if (!data.item) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("adminUsersDetailNotFoundTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("adminUsersDetailNotFoundDescription", { id: userId || "-" })}</p>
          <Button asChild variant="outline">
            <Link href={withLocalePrefix("/system/admin-users", appLocale)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("adminUsersDetailBackToList")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const item = data.item

  return (
    <div className="space-y-6 px-8 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("adminUsersDetailTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("adminUsersDetailDescription")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={withLocalePrefix("/system/admin-users", appLocale)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("adminUsersDetailBackToList")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("adminUsersDetailSectionBasic")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">{t("adminUsersTableColId")}</p>
            <p className="font-mono text-sm break-all">{item.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("adminUsersTableColUsername")}</p>
            <p className="text-sm">{item.username}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("adminUsersDetailFieldStatus")}</p>
            <Badge variant={statusBadgeVariant}>
              {item.status === "disabled" ? t("adminUsersStatusDisabled") : t("adminUsersStatusActive")}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("adminUsersTableColCreatedAt")}</p>
            <p className="text-sm">{formatDateTimeByLocale(item.created_at, locale, item.created_at || "-", { hour12: false })}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("adminUsersTableColUpdatedAt")}</p>
            <p className="text-sm">{formatDateTimeByLocale(item.updated_at, locale, item.updated_at || "-", { hour12: false })}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("adminUsersDetailSectionEdit")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-user-email">{t("adminUsersDetailFieldEmail")}</Label>
              <Input
                id="admin-user-email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder={t("adminUsersDetailFieldEmailPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-user-phone">{t("adminUsersDetailFieldPhone")}</Label>
              <Input
                id="admin-user-phone"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder={t("adminUsersDetailFieldPhonePlaceholder")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="admin-user-avatar">{t("adminUsersDetailFieldAvatar")}</Label>
              <Input
                id="admin-user-avatar"
                value={form.avatar}
                onChange={(event) => setForm((prev) => ({ ...prev, avatar: event.target.value }))}
                placeholder={t("adminUsersDetailFieldAvatarPlaceholder")}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("adminUsersDetailSaveButton")}
            </Button>
            <Button type="button" variant="outline" onClick={fetchDetail} disabled={submitting}>
              {t("adminUsersDetailResetButton")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
