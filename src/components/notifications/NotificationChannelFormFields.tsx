"use client"

import { Dispatch, SetStateAction, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { JsonTextarea } from "@/components/ui/json-textarea"
import {
  CHANNEL_TYPE_OPTIONS,
  getChannelConfigSchema,
  getDefaultChannelConfigFormValues,
  type ChannelConfigFieldSchema,
  type ChannelConfigFormValues,
} from "@/lib/notifications/channel-utils"

export type NotificationChannelFormState = {
  name: string
  channelType: string
  description: string
  minSeverity: string
  enabled: boolean
  recipientsInput: string
  configJson: string
  configFormValues: ChannelConfigFormValues
}

type NotificationChannelFormFieldsProps = {
  form: NotificationChannelFormState
  setForm: Dispatch<SetStateAction<NotificationChannelFormState>>
  idPrefix: string
  isEditing: boolean
  severityOptions: readonly string[]
  getSeverityLabel: (severity: string) => string
  t: AppNamespaceTranslator<"pages">
}

export function NotificationChannelFormFields({
  form,
  setForm,
  idPrefix,
  isEditing,
  severityOptions,
  getSeverityLabel,
  t,
}: NotificationChannelFormFieldsProps) {
  const normalizedType = form.channelType.trim().toLowerCase()
  const isBuiltInType = CHANNEL_TYPE_OPTIONS.includes(normalizedType as (typeof CHANNEL_TYPE_OPTIONS)[number])
  const isDingTalkType = normalizedType === "dingtalk"
  const typeSelectValue = isBuiltInType ? normalizedType : "__custom__"
  const configSchema = getChannelConfigSchema(form.channelType)

  const updateConfigFieldValue = (key: string, value: string | boolean) => {
    setForm((previous) => ({
      ...previous,
      configFormValues: {
        ...previous.configFormValues,
        [key]: value,
      },
    }))
  }

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
          <Select
            value={typeSelectValue}
            disabled={isEditing}
            onValueChange={(value) =>
              setForm((previous) => ({
                ...previous,
                channelType: value === "__custom__" ? previous.channelType : value,
                configJson: value === "__custom__" ? previous.configJson : "{}",
                configFormValues:
                  value === "__custom__"
                    ? previous.configFormValues
                    : getDefaultChannelConfigFormValues(value),
              }))
            }>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("notifications.fieldTypePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">{t("notifications.typeEmail")}</SelectItem>
              <SelectItem value="dingtalk">{t("notifications.typeDingTalk")}</SelectItem>
              <SelectItem value="webhook">{t("notifications.typeWebhook")}</SelectItem>
              <SelectItem value="slack">{t("notifications.typeSlack")}</SelectItem>
              <SelectItem value="sms">{t("notifications.typeSms")}</SelectItem>
              <SelectItem value="__custom__">{t("notifications.typeCustomInput")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!isBuiltInType ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-custom-type`}>{t("notifications.fieldCustomType")}</Label>
          <Input
            id={`${idPrefix}-custom-type`}
            disabled={isEditing}
            value={form.channelType}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                channelType: event.target.value,
              }))
            }
            placeholder={t("notifications.fieldTypePlaceholder")}
          />
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

      {!isDingTalkType ? (
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
      ) : null}

      <div className="space-y-2">
        <Label>{t("notifications.fieldConfigJson")}</Label>
        {configSchema.length > 0 ? (
          <div className="space-y-4 rounded-md border p-4">
            <p className="text-xs text-muted-foreground">{t("notifications.fieldConfigAutoHint")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {configSchema.map((field) => (
                <ConfigFieldInput
                  key={field.key}
                  field={field}
                  idPrefix={idPrefix}
                  value={form.configFormValues[field.key]}
                  t={t}
                  onChange={updateConfigFieldValue}
                />
              ))}
            </div>
          </div>
        ) : (
          <JsonTextarea
            id={`${idPrefix}-config`}
            value={form.configJson}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                configJson: value,
              }))
            }
            placeholder={t("notifications.fieldConfigPlaceholder")}
            className="min-h-[160px]"
          />
        )}
      </div>
    </>
  )
}

type ConfigFieldInputProps = {
  field: ChannelConfigFieldSchema
  idPrefix: string
  value: string | boolean | undefined
  t: AppNamespaceTranslator<"pages">
  onChange: (key: string, value: string | boolean) => void
}

function ConfigFieldInput({ field, idPrefix, value, t, onChange }: ConfigFieldInputProps) {
  const inputId = `${idPrefix}-config-${field.key}`
  const [showPassword, setShowPassword] = useState(false)
  const shouldTakeFullRow = field.key === "webhook_url" || field.key === "secret"
  const fieldContainerClassName = shouldTakeFullRow ? "min-w-0 space-y-2 sm:col-span-2" : "min-w-0 space-y-2"

  if (field.type === "boolean") {
    return (
      <div className={fieldContainerClassName}>
        <Label htmlFor={inputId}>{t(field.labelKey)}</Label>
        <div className="flex h-10 items-center rounded-md border px-3">
          <Switch
            id={inputId}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(field.key, checked)}
          />
          <span className="ml-3 text-sm text-muted-foreground">
            {Boolean(value) ? t("notifications.configBooleanEnabled") : t("notifications.configBooleanDisabled")}
          </span>
        </div>
      </div>
    )
  }

  if (field.type === "textarea") {
    return (
      <div className="min-w-0 space-y-2 sm:col-span-2">
        <Label htmlFor={inputId}>{t(field.labelKey)}</Label>
        <Textarea
          id={inputId}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(field.key, event.target.value)}
          placeholder={t(field.placeholderKey)}
          className="min-h-[84px]"
        />
        {field.key === "at_user_ids" ? (
          <p className="text-xs text-muted-foreground">{t("notifications.configFieldDingTalkAtUserIdsHint")}</p>
        ) : null}
      </div>
    )
  }

  if (field.type === "password") {
    return (
      <div className={fieldContainerClassName}>
        <Label htmlFor={inputId}>{t(field.labelKey)}</Label>
        <div className="relative">
          <Input
            id={inputId}
            type={showPassword ? "text" : "password"}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(field.key, event.target.value)}
            placeholder={t(field.placeholderKey)}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={fieldContainerClassName}>
      <Label htmlFor={inputId}>{t(field.labelKey)}</Label>
      <Input
        id={inputId}
        type={field.type}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(field.key, event.target.value)}
        placeholder={t(field.placeholderKey)}
      />
    </div>
  )
}
