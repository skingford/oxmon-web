"use client"

import type { Dispatch, FormEvent, SetStateAction } from "react"
import { Loader2 } from "lucide-react"
import type { AppNamespaceTranslator } from "@/hooks/use-app-translations"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export type InstanceContactFormState = {
  patternsText: string
  contactName: string
  contactEmail: string
  contactPhone: string
  contactDingtalk: string
  contactWebhook: string
  description: string
  enabled: boolean
}

export function getDefaultInstanceContactFormState(): InstanceContactFormState {
  return {
    patternsText: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactDingtalk: "",
    contactWebhook: "",
    description: "",
    enabled: true,
  }
}

type InstanceContactFormDialogProps = {
  open: boolean
  mode: "create" | "edit"
  loading?: boolean
  submitting: boolean
  form: InstanceContactFormState
  onOpenChange: (open: boolean) => void
  onFormChange: Dispatch<SetStateAction<InstanceContactFormState>>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  t: AppNamespaceTranslator<"pages">
}

export function InstanceContactFormDialog({
  open,
  mode,
  loading = false,
  submitting,
  form,
  onOpenChange,
  onFormChange,
  onSubmit,
  t,
}: InstanceContactFormDialogProps) {
  const isEditing = mode === "edit"
  const disabled = loading || submitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("notifications.contactsDialogEditTitle") : t("notifications.contactsDialogCreateTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("notifications.contactsDialogEditDescription") : t("notifications.contactsDialogCreateDescription")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>{t("notifications.contactsDialogLoading")}</p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instance-contact-name">{t("notifications.contactsFieldName")}</Label>
                <Input
                  id="instance-contact-name"
                  value={form.contactName}
                  onChange={(event) => onFormChange((prev) => ({ ...prev, contactName: event.target.value }))}
                  placeholder={t("notifications.contactsFieldNamePlaceholder")}
                  disabled={disabled}
                />
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Label>{t("notifications.contactsFieldEnabled")}</Label>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{form.enabled ? t("notifications.statusEnabled") : t("notifications.statusDisabled")}</p>
                      <p className="text-xs text-muted-foreground">{t("notifications.contactsFieldEnabledHint")}</p>
                    </div>
                    <Switch
                      checked={form.enabled}
                      onCheckedChange={(checked) => onFormChange((prev) => ({ ...prev, enabled: checked }))}
                      disabled={disabled}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t("notifications.contactsFieldDefaultStatus")}</Label>
                  <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                    {t("notifications.contactsFieldDefaultStatusHint")}
                  </div>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="instance-contact-patterns">{t("notifications.contactsFieldPatterns")}</Label>
                <Textarea
                  id="instance-contact-patterns"
                  rows={4}
                  value={form.patternsText}
                  onChange={(event) => onFormChange((prev) => ({ ...prev, patternsText: event.target.value }))}
                  placeholder={t("notifications.contactsFieldPatternsPlaceholder")}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">{t("notifications.contactsFieldPatternsHint")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instance-contact-email">{t("notifications.contactsFieldEmail")}</Label>
                <Input
                  id="instance-contact-email"
                  value={form.contactEmail}
                  onChange={(event) => onFormChange((prev) => ({ ...prev, contactEmail: event.target.value }))}
                  placeholder={t("notifications.contactsFieldEmailPlaceholder")}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instance-contact-phone">{t("notifications.contactsFieldPhone")}</Label>
                <Input
                  id="instance-contact-phone"
                  value={form.contactPhone}
                  onChange={(event) => onFormChange((prev) => ({ ...prev, contactPhone: event.target.value }))}
                  placeholder={t("notifications.contactsFieldPhonePlaceholder")}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instance-contact-dingtalk">{t("notifications.contactsFieldDingtalk")}</Label>
                <Input
                  id="instance-contact-dingtalk"
                  value={form.contactDingtalk}
                  onChange={(event) => onFormChange((prev) => ({ ...prev, contactDingtalk: event.target.value }))}
                  placeholder={t("notifications.contactsFieldDingtalkPlaceholder")}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instance-contact-webhook">{t("notifications.contactsFieldWebhook")}</Label>
                <Input
                  id="instance-contact-webhook"
                  value={form.contactWebhook}
                  onChange={(event) => onFormChange((prev) => ({ ...prev, contactWebhook: event.target.value }))}
                  placeholder={t("notifications.contactsFieldWebhookPlaceholder")}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="instance-contact-description">{t("notifications.contactsFieldDescription")}</Label>
                <Textarea
                  id="instance-contact-description"
                  rows={3}
                  value={form.description}
                  onChange={(event) => onFormChange((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder={t("notifications.contactsFieldDescriptionPlaceholder")}
                  disabled={disabled}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={disabled}>
                {t("notifications.dialogCancel")}
              </Button>
              <Button type="submit" disabled={disabled}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isEditing ? t("notifications.contactsDialogUpdateSubmit") : t("notifications.contactsDialogCreateSubmit")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
