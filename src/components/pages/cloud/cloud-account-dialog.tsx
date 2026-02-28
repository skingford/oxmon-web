"use client"

import { memo, useCallback, useState, type FormEvent } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export type CloudAccountFormState = {
  configKey: string
  provider: string
  displayName: string
  accountName: string
  description: string
  secretId: string
  secretKey: string
  regionsText: string
  collectionIntervalSecs: string
  enabled: boolean
}

type CloudAccountDialogProps = {
  open: boolean
  isEditing: boolean
  locale: "zh" | "en"
  providerSelectValue: string
  form: CloudAccountFormState
  formSubmitting: boolean
  editingDialogLoading: boolean
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  setForm: React.Dispatch<React.SetStateAction<CloudAccountFormState>>
  t: (path: string, values?: Record<string, string | number>) => string
}

const BUILT_IN_CLOUD_PROVIDERS = ["tencent", "alibaba"] as const

export const CloudAccountDialog = memo(function CloudAccountDialog({
  open,
  isEditing,
  locale,
  providerSelectValue,
  form,
  formSubmitting,
  editingDialogLoading,
  onOpenChange,
  onCancel,
  onSubmit,
  setForm,
  t,
}: CloudAccountDialogProps) {
  const [showSecretKey, setShowSecretKey] = useState(false)

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setShowSecretKey(false)
    }
    onOpenChange(nextOpen)
  }, [onOpenChange])

  const handleCancel = useCallback(() => {
    setShowSecretKey(false)
    onCancel()
  }, [onCancel])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("cloud.accounts.dialogEditTitle") : t("cloud.accounts.dialogCreateTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("cloud.accounts.dialogEditDescription") : t("cloud.accounts.dialogCreateDescription")}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-4">
            <div className="space-y-4 rounded-md border p-4">
              <p className="text-sm font-medium">{locale === "zh" ? "基础配置" : "Basic Config"}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cloud-config-key">{t("cloud.accounts.fieldConfigKey")}</Label>
                  <Input
                    id="cloud-config-key"
                    value={form.configKey}
                    onChange={(event) => setForm((prev) => ({ ...prev, configKey: event.target.value }))}
                    placeholder={t("cloud.accounts.fieldConfigKeyPlaceholder")}
                    disabled={isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cloud-provider">{t("cloud.accounts.fieldProvider")}</Label>
                  {isEditing ? (
                    <Input
                      id="cloud-provider"
                      value={form.provider}
                      onChange={(event) => setForm((prev) => ({ ...prev, provider: event.target.value }))}
                      placeholder={t("cloud.accounts.fieldProviderPlaceholder")}
                      disabled
                    />
                  ) : (
                    <>
                      <Select
                        value={providerSelectValue}
                        onValueChange={(value) => {
                          if (value === "__custom__") {
                            setForm((prev) => ({
                              ...prev,
                              provider: "",
                            }))
                            return
                          }
                          setForm((prev) => ({
                            ...prev,
                            provider: value,
                          }))
                        }}
                      >
                        <SelectTrigger id="cloud-provider" className="w-full">
                          <SelectValue placeholder={t("cloud.accounts.fieldProviderPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tencent">Tencent</SelectItem>
                          <SelectItem value="alibaba">Alibaba / Aliyun</SelectItem>
                          <SelectItem value="__custom__">{locale === "zh" ? "自定义" : "Custom"}</SelectItem>
                        </SelectContent>
                      </Select>
                      {providerSelectValue === "__custom__" ? (
                        <Input
                          value={form.provider}
                          onChange={(event) => {
                            setForm((prev) => ({
                              ...prev,
                              provider: event.target.value,
                            }))
                          }}
                          placeholder={t("cloud.accounts.fieldProviderPlaceholder")}
                        />
                      ) : null}
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cloud-display-name">{t("cloud.accounts.fieldDisplayName")}</Label>
                  <Input
                    id="cloud-display-name"
                    value={form.displayName}
                    onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                    placeholder={t("cloud.accounts.fieldDisplayNamePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cloud-collection-interval">
                    {locale === "zh" ? "采集间隔（秒）" : "Collection Interval (seconds)"}
                  </Label>
                  <Input
                    id="cloud-collection-interval"
                    type="number"
                    min={1}
                    step={1}
                    value={form.collectionIntervalSecs}
                    onChange={(event) => setForm((prev) => ({ ...prev, collectionIntervalSecs: event.target.value }))}
                    placeholder="300"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{t("cloud.accounts.fieldEnabled")}</p>
                      <p className="text-xs text-muted-foreground">
                        {form.enabled ? t("cloud.accounts.statusEnabled") : t("cloud.accounts.statusDisabled")}
                      </p>
                    </div>
                    <Switch
                      checked={form.enabled}
                      onCheckedChange={(checked) => setForm((prev) => ({ ...prev, enabled: checked }))}
                      disabled={false}
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cloud-description">{t("cloud.accounts.fieldDescription")}</Label>
                  <Textarea
                    id="cloud-description"
                    rows={3}
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder={t("cloud.accounts.fieldDescriptionPlaceholder")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-md border p-4">
              <p className="text-sm font-medium">{locale === "zh" ? "云配置" : "Cloud Config"}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cloud-account-name">
                    {locale === "zh" ? "云账号名称" : "Account Name"}
                  </Label>
                  <Input
                    id="cloud-account-name"
                    value={form.accountName}
                    onChange={(event) => setForm((prev) => ({ ...prev, accountName: event.target.value }))}
                    placeholder={locale === "zh" ? "例如：生产主账号" : "e.g. Production Main Account"}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cloud-secret-id">
                    {locale === "zh" ? "SecretId / AccessKey ID" : "SecretId / AccessKey ID"}
                  </Label>
                  <Input
                    id="cloud-secret-id"
                    value={form.secretId}
                    onChange={(event) => setForm((prev) => ({ ...prev, secretId: event.target.value }))}
                    placeholder={locale === "zh" ? "请输入密钥 ID" : "Enter key ID"}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cloud-secret-key">
                    {locale === "zh" ? "SecretKey / AccessKey Secret" : "SecretKey / AccessKey Secret"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="cloud-secret-key"
                      type={showSecretKey ? "text" : "password"}
                      value={form.secretKey}
                      onChange={(event) => setForm((prev) => ({ ...prev, secretKey: event.target.value }))}
                      placeholder={locale === "zh" ? "请输入密钥 Secret" : "Enter key secret"}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                      onClick={() => setShowSecretKey((prev) => !prev)}
                      aria-label={showSecretKey
                        ? locale === "zh" ? "隐藏密钥" : "Hide secret"
                        : locale === "zh" ? "显示密钥" : "Show secret"}
                      aria-pressed={showSecretKey}
                    >
                      {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cloud-regions">
                    {locale === "zh" ? "地域列表" : "Regions"}
                  </Label>
                  <Input
                    id="cloud-regions"
                    value={form.regionsText}
                    onChange={(event) => setForm((prev) => ({ ...prev, regionsText: event.target.value }))}
                    placeholder={locale === "zh" ? "例如：ap-shanghai, ap-guangzhou" : "e.g. ap-shanghai, ap-guangzhou"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {locale === "zh" ? "多个地域可用逗号或换行分隔" : "Separate multiple regions with commas or new lines"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={formSubmitting}>
              {t("cloud.accounts.dialogCancel")}
            </Button>
            <Button type="submit" disabled={formSubmitting || editingDialogLoading}>
              {formSubmitting || editingDialogLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? t("cloud.accounts.dialogUpdateSubmit") : t("cloud.accounts.dialogCreateSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})

CloudAccountDialog.displayName = "CloudAccountDialog"
