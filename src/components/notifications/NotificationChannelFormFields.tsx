"use client"

import { Dispatch, SetStateAction } from "react"
import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export type NotificationChannelFormState = {
  name: string
  channelType: string
  systemConfigId: string
  description: string
  minSeverity: string
  enabled: boolean
  recipientsInput: string
  configJson: string
}

export type NotificationSystemConfigOption = {
  id: string
  displayName: string
  configKey: string
  enabled: boolean
}

type NotificationChannelFormFieldsProps = {
  form: NotificationChannelFormState
  setForm: Dispatch<SetStateAction<NotificationChannelFormState>>
  idPrefix: string
  isEditing: boolean
  severityOptions: readonly string[]
  systemConfigOptions: NotificationSystemConfigOption[]
  shouldRequireSystemConfig: (channelType: string) => boolean
  getSeverityLabel: (severity: string) => string
  t: AppNamespaceTranslator<"pages">
}

export function NotificationChannelFormFields({
  form,
  setForm,
  idPrefix,
  isEditing,
  severityOptions,
  systemConfigOptions,
  shouldRequireSystemConfig,
  getSeverityLabel,
  t,
}: NotificationChannelFormFieldsProps) {
  const requireSystemConfig = shouldRequireSystemConfig(form.channelType)
  const selectedSystemConfig = form.systemConfigId
    ? systemConfigOptions.find((item) => item.id === form.systemConfigId) || null
    : null

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${idPrefix}-name`}>{t("notifications.fieldName")}</Label>
          <Input
            id={`${idPrefix}-name`}
            value={form.name}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
            placeholder={t("notifications.fieldNamePlaceholder")}
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${idPrefix}-type`}>{t("notifications.fieldType")}</Label>
          <Input
            id={`${idPrefix}-type`}
            value={form.channelType}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                channelType: event.target.value,
                systemConfigId: shouldRequireSystemConfig(event.target.value)
                  ? previous.systemConfigId
                  : "",
              }))
            }
            placeholder={t("notifications.fieldTypePlaceholder")}
          />
        </div>
      </div>

      {requireSystemConfig ? (
        <div className="space-y-2">
          <Label>{t("notifications.fieldSystemConfig")}</Label>
          <Select
            value={form.systemConfigId}
            onValueChange={(value) =>
              setForm((previous) => ({
                ...previous,
                systemConfigId: value,
              }))
            }
          >
            <SelectTrigger className="h-10 w-full bg-background">
              <SelectValue placeholder={t("notifications.fieldSystemConfigPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {systemConfigOptions.length === 0 ? (
                <SelectItem value="__empty__" disabled>
                  {t("notifications.fieldSystemConfigEmpty")}
                </SelectItem>
              ) : (
                systemConfigOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.displayName} ({item.configKey}){item.enabled ? "" : ` · ${t("notifications.systemConfigDisabledTag")}`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedSystemConfig && !selectedSystemConfig.enabled ? (
            <p className="text-xs text-amber-600">
              {t("notifications.systemConfigDisabledWarning")}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label>{t("notifications.fieldSeverity")}</Label>
          <Select
            value={form.minSeverity}
            onValueChange={(value) =>
              setForm((previous) => ({
                ...previous,
                minSeverity: value,
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {severityOptions.map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {getSeverityLabel(severity)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isEditing ? (
          <div className="min-w-0 space-y-2">
            <Label>{t("notifications.fieldEnabled")}</Label>
            <div className="flex h-10 items-center rounded-md border px-3">
              <Switch
                checked={form.enabled}
                onCheckedChange={(checked) =>
                  setForm((previous) => ({
                    ...previous,
                    enabled: checked,
                  }))
                }
              />
              <span className="ml-3 text-sm text-muted-foreground">
                {form.enabled ? t("notifications.statusEnabled") : t("notifications.statusDisabled")}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>{t("notifications.fieldDescription")}</Label>
        <Input
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              description: event.target.value,
            }))
          }
          placeholder={t("notifications.fieldDescriptionPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-recipients`}>{t("notifications.fieldRecipients")}</Label>
        <Textarea
          id={`${idPrefix}-recipients`}
          value={form.recipientsInput}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              recipientsInput: event.target.value,
            }))
          }
          placeholder={t("notifications.fieldRecipientsPlaceholder")}
          className="min-h-[96px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-config`}>{t("notifications.fieldConfigJson")}</Label>
        <Textarea
          id={`${idPrefix}-config`}
          value={form.configJson}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              configJson: event.target.value,
            }))
          }
          placeholder={t("notifications.fieldConfigPlaceholder")}
          className="min-h-[160px] font-mono text-xs"
        />
      </div>
    </>
  )
}
