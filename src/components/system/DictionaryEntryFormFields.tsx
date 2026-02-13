"use client"

import { Dispatch, SetStateAction } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export type DictionaryEntryFormState = {
  dictType: string
  dictKey: string
  dictLabel: string
  dictValue: string
  sortOrder: string
  enabled: boolean
  description: string
  extraJson: string
}

type DictionaryEntryFormLabels = {
  label: string
  value: string
  sortOrder: string
  enabled: string
  statusEnabled: string
  statusDisabled: string
  description: string
  extraJson: string
  extraJsonHint: string
}

type DictionaryEntryFormFieldsProps = {
  form: DictionaryEntryFormState
  setForm: Dispatch<SetStateAction<DictionaryEntryFormState>>
  idPrefix: string
  labels: DictionaryEntryFormLabels
  sortPlaceholder?: string
  extraJsonPlaceholder?: string
}

export function DictionaryEntryFormFields({
  form,
  setForm,
  idPrefix,
  labels,
  sortPlaceholder,
  extraJsonPlaceholder,
}: DictionaryEntryFormFieldsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-label`}>{labels.label}</Label>
          <Input
            id={`${idPrefix}-label`}
            value={form.dictLabel}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                dictLabel: event.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-value`}>{labels.value}</Label>
          <Input
            id={`${idPrefix}-value`}
            value={form.dictValue}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                dictValue: event.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-sort`}>{labels.sortOrder}</Label>
          <Input
            id={`${idPrefix}-sort`}
            value={form.sortOrder}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                sortOrder: event.target.value,
              }))
            }
            placeholder={sortPlaceholder}
          />
        </div>

        <div className="space-y-2">
          <Label>{labels.enabled}</Label>
          <div className="flex h-10 items-center justify-between rounded-md border px-3">
            <span className="text-sm">
              {form.enabled ? labels.statusEnabled : labels.statusDisabled}
            </span>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>{labels.description}</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              description: event.target.value,
            }))
          }
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-extra-json`}>{labels.extraJson}</Label>
        <Textarea
          id={`${idPrefix}-extra-json`}
          value={form.extraJson}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              extraJson: event.target.value,
            }))
          }
          rows={3}
          placeholder={extraJsonPlaceholder}
        />
        <p className="text-xs text-muted-foreground">{labels.extraJsonHint}</p>
      </div>
    </>
  )
}
