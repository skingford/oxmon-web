"use client"

import { Dispatch, SetStateAction } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type DictionaryTypeFormState = {
  dictType: string
  dictTypeLabel: string
  sortOrder: string
  description: string
}

type DictionaryTypeFormLabels = {
  type: string
  typeLabel: string
  sortOrder: string
  description: string
}

type DictionaryTypeFormFieldsProps = {
  form: DictionaryTypeFormState
  setForm: Dispatch<SetStateAction<DictionaryTypeFormState>>
  idPrefix: string
  labels: DictionaryTypeFormLabels
  typeReadOnly?: boolean
  typePlaceholder?: string
  sortPlaceholder?: string
  descriptionPlaceholder?: string
}

export function DictionaryTypeFormFields({
  form,
  setForm,
  idPrefix,
  labels,
  typeReadOnly = false,
  typePlaceholder,
  sortPlaceholder,
  descriptionPlaceholder,
}: DictionaryTypeFormFieldsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-type`}>{labels.type}</Label>
          <Input
            id={`${idPrefix}-type`}
            value={form.dictType}
            readOnly={typeReadOnly}
            className={typeReadOnly ? "bg-muted" : undefined}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                dictType: event.target.value,
              }))
            }
            placeholder={typePlaceholder}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-label`}>{labels.typeLabel}</Label>
          <Input
            id={`${idPrefix}-label`}
            value={form.dictTypeLabel}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                dictTypeLabel: event.target.value,
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
            type="number"
            inputMode="numeric"
            step={1}
            min={0}
            value={form.sortOrder}
            onChange={(event) =>
              setForm((previous) => {
                const nextValue = event.target.value

                if (!/^\d*$/.test(nextValue)) {
                  return previous
                }

                return {
                  ...previous,
                  sortOrder: nextValue,
                }
              })
            }
            placeholder={sortPlaceholder}
          />
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
            placeholder={descriptionPlaceholder}
          />
        </div>
      </div>
    </>
  )
}
