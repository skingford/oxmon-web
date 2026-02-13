"use client"

import { Dispatch, SetStateAction } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export type SystemConfigFormState = {
  configKey: string
  configType: string
  provider: string
  displayName: string
  description: string
  configJson: string
  enabled: boolean
}

type SystemConfigFormFieldsProps = {
  form: SystemConfigFormState
  setForm: Dispatch<SetStateAction<SystemConfigFormState>>
  idPrefix: string
  isEditing: boolean
  providerReadOnly: boolean
  t: (path: string, values?: Record<string, string | number>) => string
}

export function SystemConfigFormFields({
  form,
  setForm,
  idPrefix,
  isEditing,
  providerReadOnly,
  t,
}: SystemConfigFormFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-display-name`}>{t("systemConfigFieldDisplayName")}</Label>
          <Input
            id={`${idPrefix}-display-name`}
            value={form.displayName}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                displayName: event.target.value,
              }))
            }
            placeholder={t("systemConfigFieldDisplayNamePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-config-key`}>{t("systemConfigFieldConfigKey")}</Label>
          <Input
            id={`${idPrefix}-config-key`}
            value={form.configKey}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                configKey: event.target.value,
              }))
            }
            placeholder={t("systemConfigFieldConfigKeyPlaceholder")}
            disabled={isEditing}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-config-type`}>{t("systemConfigFieldConfigType")}</Label>
          <Select
            value={form.configType}
            onValueChange={(value) =>
              setForm((previous) => ({
                ...previous,
                configType: value,
                provider: value === "sms" ? previous.provider : "",
              }))
            }
            disabled={isEditing}
          >
            <SelectTrigger id={`${idPrefix}-config-type`} className="h-10 w-full bg-background">
              <SelectValue placeholder={t("systemConfigFieldConfigTypePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">email</SelectItem>
              <SelectItem value="sms">sms</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-provider`}>{t("systemConfigFieldProvider")}</Label>
          <Input
            id={`${idPrefix}-provider`}
            value={form.provider}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                provider: event.target.value,
              }))
            }
            placeholder={t("systemConfigFieldProviderPlaceholder")}
            disabled={providerReadOnly}
          />
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Label>{t("systemConfigFieldEnabled")}</Label>
          <div className="flex h-10 items-center justify-between rounded-md border px-3">
            <p className="text-sm text-muted-foreground">{t("systemConfigFieldEnabled")}</p>
            <Switch
              checked={form.enabled}
              onCheckedChange={(checked) =>
                setForm((previous) => ({
                  ...previous,
                  enabled: checked,
                }))
              }
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>{t("systemConfigFieldDescription")}</Label>
        <Input
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              description: event.target.value,
            }))
          }
          placeholder={t("systemConfigFieldDescriptionPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-config-json`}>{t("systemConfigFieldConfigJson")}</Label>
        <Textarea
          id={`${idPrefix}-config-json`}
          value={form.configJson}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              configJson: event.target.value,
            }))
          }
          placeholder={t("systemConfigFieldConfigJsonPlaceholder")}
          className="min-h-[180px] font-mono text-xs"
        />
      </div>
    </>
  )
}
