"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, getApiErrorMessage } from "@/lib/api";
import { clearAuthToken } from "@/lib/auth-token";
import {
  clearGlobalConfigCache,
  writeGlobalConfigCache,
} from "@/lib/global-config-cache";
import { encryptPasswordWithPublicKey } from "@/lib/password-encryption";
import {
  CreateSystemConfigRequest,
  RuntimeConfig,
  StorageInfo,
  SystemConfigResponse,
  UpdateSystemConfigRequest,
} from "@/types/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  toast,
  toastActionSuccess,
  toastApiError,
  toastCreated,
  toastDeleted,
  toastSaved,
} from "@/lib/toast";
import {
  BookText,
  FilterX,
  Loader2,
  Plus,
  Settings,
  HardDrive,
  Shield,
  RefreshCw,
  Server,
  Tag,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppTranslations } from "@/hooks/use-app-translations";
import {
  SystemConfigFormFields,
  SystemConfigFormState,
} from "@/components/system/SystemConfigFormFields";
import {
  getInitialSystemConfigForm,
  getSystemConfigFormFromItem,
} from "@/lib/system/system-config-form";
import { withLocalePrefix } from "@/components/app-locale";
import { motion } from "framer-motion";
import { RuntimeConfigCard } from "@/components/pages/system/runtime-config-card";
import { StorageManagementCard } from "@/components/pages/system/storage-management-card";
import { SecuritySettingsCard } from "@/components/pages/system/security-settings-card";
import { DictionaryQuickLinksCard } from "@/components/pages/system/dictionary-quick-links-card";

type SystemConfigStatusFilter = "all" | "enabled" | "disabled";

export default function SystemPage() {
  const { t, locale } = useAppTranslations("system");
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [systemConfigs, setSystemConfigs] = useState<SystemConfigResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const [isSystemConfigDialogOpen, setIsSystemConfigDialogOpen] =
    useState(false);
  const [editingSystemConfig, setEditingSystemConfig] =
    useState<SystemConfigResponse | null>(null);
  const [systemConfigForm, setSystemConfigForm] =
    useState<SystemConfigFormState>(getInitialSystemConfigForm);
  const [systemConfigSubmitting, setSystemConfigSubmitting] = useState(false);
  const [systemConfigDeleteTarget, setSystemConfigDeleteTarget] =
    useState<SystemConfigResponse | null>(null);
  const [deletingSystemConfigId, setDeletingSystemConfigId] = useState<
    string | null
  >(null);
  const [togglingSystemConfigId, setTogglingSystemConfigId] = useState<
    string | null
  >(null);
  const [systemConfigSearchKeyword, setSystemConfigSearchKeyword] =
    useState("");
  const [systemConfigTypeFilter, setSystemConfigTypeFilter] = useState("all");
  const [systemConfigStatusFilter, setSystemConfigStatusFilter] =
    useState<SystemConfigStatusFilter>("all");
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
  });
  const [changing, setChanging] = useState(false);

  const fetchData = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [configData, storageData, systemConfigRows] = await Promise.all([
        api.getSystemConfig(),
        api.getStorageInfo(),
        api.listSystemConfigs(),
      ]);
      setConfig(configData);
      setStorage(storageData);
      setSystemConfigs(systemConfigRows);
      writeGlobalConfigCache({
        runtimeConfig: configData,
        systemConfigs: systemConfigRows,
      });
    } catch (error) {
      toastApiError(error, t("toastFetchError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmCleanup = async () => {
    setCleaning(true);
    try {
      await api.triggerCleanup();
      toastActionSuccess(t("toastCleanupSuccess"));
      const storageData = await api.getStorageInfo();
      setStorage(storageData);
      setIsCleanupDialogOpen(false);
    } catch (error) {
      toastApiError(error, t("toastCleanupError"));
    } finally {
      setCleaning(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      toast.error(t("toastPasswordRequired"));
      return;
    }
    setChanging(true);
    try {
      const publicKeyResponse = await api.getAuthPublicKey();

      if (publicKeyResponse.algorithm !== "RSA-OAEP-SHA256") {
        throw new Error(
          `Unsupported login encryption algorithm: ${publicKeyResponse.algorithm}`,
        );
      }

      const [encryptedCurrentPassword, encryptedNewPassword] =
        await Promise.all([
          encryptPasswordWithPublicKey(
            publicKeyResponse.public_key,
            passwordForm.current_password,
          ),
          encryptPasswordWithPublicKey(
            publicKeyResponse.public_key,
            passwordForm.new_password,
          ),
        ]);

      await api.changePassword({
        encrypted_current_password: encryptedCurrentPassword,
        encrypted_new_password: encryptedNewPassword,
      });
      toastActionSuccess(t("toastPasswordSuccess"));
      clearAuthToken();
      clearGlobalConfigCache();
      setIsPasswordDialogOpen(false);
      setPasswordForm({ current_password: "", new_password: "" });
      window.setTimeout(() => {
        window.location.replace(withLocalePrefix("/login", locale));
      }, 300);
    } catch (error) {
      toastApiError(error, t("toastPasswordError"));
    } finally {
      setChanging(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return t("uptimeFormat", { days, hours });
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatConfigJsonPreview = (value: unknown) => {
    if (typeof value === "string") {
      return value;
    }

    try {
      return JSON.stringify(value ?? {});
    } catch {
      return "{}";
    }
  };

  const systemConfigStats = useMemo(() => {
    const total = systemConfigs.length;
    const enabled = systemConfigs.filter((item) => item.enabled).length;
    const disabled = total - enabled;

    return { total, enabled, disabled };
  }, [systemConfigs]);

  const availableSystemConfigTypes = useMemo(() => {
    return Array.from(
      new Set(systemConfigs.map((item) => item.config_type)),
    ).sort((a, b) => a.localeCompare(b));
  }, [systemConfigs]);

  const filteredSystemConfigs = useMemo(() => {
    const keyword = systemConfigSearchKeyword.trim().toLowerCase();

    return systemConfigs
      .filter((item) => {
        if (
          systemConfigTypeFilter !== "all" &&
          item.config_type !== systemConfigTypeFilter
        ) {
          return false;
        }

        if (systemConfigStatusFilter === "enabled" && !item.enabled) {
          return false;
        }

        if (systemConfigStatusFilter === "disabled" && item.enabled) {
          return false;
        }

        if (!keyword) {
          return true;
        }

        return [
          item.display_name,
          item.config_key,
          item.config_type,
          item.description || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      })
      .sort((left, right) => {
        const leftTime = new Date(left.updated_at).getTime() || 0;
        const rightTime = new Date(right.updated_at).getTime() || 0;
        return rightTime - leftTime;
      });
  }, [
    systemConfigs,
    systemConfigSearchKeyword,
    systemConfigStatusFilter,
    systemConfigTypeFilter,
  ]);

  const systemConfigTypeOptions = useMemo(() => {
    const optionSet = new Set<string>([
      "email",
      "sms",
      ...availableSystemConfigTypes,
    ]);
    const currentType = systemConfigForm.configType.trim();

    if (currentType) {
      optionSet.add(currentType);
    }

    return Array.from(optionSet).sort((a, b) => a.localeCompare(b));
  }, [availableSystemConfigTypes, systemConfigForm.configType]);

  const hasActiveSystemConfigFilters =
    Boolean(systemConfigSearchKeyword.trim()) ||
    systemConfigTypeFilter !== "all" ||
    systemConfigStatusFilter !== "all";

  const openCreateSystemConfigDialog = () => {
    setEditingSystemConfig(null);
    setSystemConfigForm(getInitialSystemConfigForm());
    setIsSystemConfigDialogOpen(true);
  };

  const openEditSystemConfigDialog = (item: SystemConfigResponse) => {
    setEditingSystemConfig(item);
    setSystemConfigForm(getSystemConfigFormFromItem(item));
    setIsSystemConfigDialogOpen(true);
  };

  const handleResetSystemConfigFilters = () => {
    setSystemConfigSearchKeyword("");
    setSystemConfigTypeFilter("all");
    setSystemConfigStatusFilter("all");
  };

  const handleSubmitSystemConfig = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const displayName = systemConfigForm.displayName.trim();
    const configKey = systemConfigForm.configKey.trim();
    const configType = systemConfigForm.configType.trim().toLowerCase();
    const description = systemConfigForm.description.trim();
    const configJsonInput = systemConfigForm.configJson.trim();

    if (!displayName) {
      toast.error(t("systemConfigToastDisplayNameRequired"));
      return;
    }

    if (!editingSystemConfig && !configKey) {
      toast.error(t("systemConfigToastConfigKeyRequired"));
      return;
    }

    if (!editingSystemConfig && !configType) {
      toast.error(t("systemConfigToastConfigTypeRequired"));
      return;
    }

    if (!configJsonInput) {
      toast.error(t("systemConfigToastConfigJsonRequired"));
      return;
    }

    let normalizedConfigJson = "{}";

    try {
      normalizedConfigJson = JSON.stringify(JSON.parse(configJsonInput));
    } catch {
      toast.error(t("systemConfigToastConfigJsonInvalid"));
      return;
    }

    setSystemConfigSubmitting(true);

    try {
      if (editingSystemConfig) {
        const payload: UpdateSystemConfigRequest = {
          display_name: displayName,
          description: description || null,
          config_json: normalizedConfigJson,
          enabled: systemConfigForm.enabled,
        };

        await api.updateSystemConfig(editingSystemConfig.id, payload);
        toastSaved(t("systemConfigToastUpdateSuccess"));
      } else {
        const payload: CreateSystemConfigRequest = {
          config_key: configKey,
          config_type: configType,
          display_name: displayName,
          description: description || null,
          config_json: normalizedConfigJson,
        };

        await api.createSystemConfig(payload);
        toastCreated(t("systemConfigToastCreateSuccess"));
      }

      setIsSystemConfigDialogOpen(false);
      setEditingSystemConfig(null);
      setSystemConfigForm(getInitialSystemConfigForm());
      await fetchData(true);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          editingSystemConfig
            ? t("systemConfigToastUpdateError")
            : t("systemConfigToastCreateError"),
        ),
      );
    } finally {
      setSystemConfigSubmitting(false);
    }
  };

  const handleToggleSystemConfigEnabled = async (
    item: SystemConfigResponse,
    enabled: boolean,
  ) => {
    if (item.enabled === enabled) {
      return;
    }

    setTogglingSystemConfigId(item.id);

    try {
      await api.updateSystemConfig(item.id, { enabled });
      await fetchData(true);
      toast.success(
        enabled
          ? t("systemConfigToastEnableSuccess")
          : t("systemConfigToastDisableSuccess"),
      );
    } catch (error) {
      toastApiError(error, t("systemConfigToastToggleError"));
    } finally {
      setTogglingSystemConfigId(null);
    }
  };

  const handleDeleteSystemConfig = async () => {
    if (!systemConfigDeleteTarget) {
      return;
    }

    setDeletingSystemConfigId(systemConfigDeleteTarget.id);

    try {
      await api.deleteSystemConfig(systemConfigDeleteTarget.id);
      toastDeleted(t("systemConfigToastDeleteSuccess"));
      setSystemConfigDeleteTarget(null);
      await fetchData(true);
    } catch (error) {
      toastApiError(error, t("systemConfigToastDeleteError"));
    } finally {
      setDeletingSystemConfigId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-8 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {t("btnRefresh")}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
                {/* Runtime Configuration */}
        <RuntimeConfigCard config={config} />

        {/* Storage Management */}
        <StorageManagementCard storage={storage} onCleanupClick={() => setIsCleanupDialogOpen(true)} />


        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="md:col-span-2"
        >
          <Card>
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t("systemConfigTitle")}
                </CardTitle>
                <CardDescription>
                  {t("systemConfigDescription")}
                </CardDescription>
              </div>
              <Button onClick={openCreateSystemConfigDialog}>
                <Plus className="mr-2 h-4 w-4" />
                {t("systemConfigButtonCreate")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>
                  {t("systemConfigStatsTotal", {
                    count: systemConfigStats.total,
                  })}
                </span>
                <span>
                  {t("systemConfigStatsEnabled", {
                    count: systemConfigStats.enabled,
                  })}
                </span>
                <span>
                  {t("systemConfigStatsDisabled", {
                    count: systemConfigStats.disabled,
                  })}
                </span>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_200px_200px_auto]">
                <Input
                  value={systemConfigSearchKeyword}
                  onChange={(event) =>
                    setSystemConfigSearchKeyword(event.target.value)
                  }
                  placeholder={t("systemConfigSearchPlaceholder")}
                />

                <SearchableCombobox
                  value={systemConfigTypeFilter}
                  options={[
                    { value: "all", label: t("systemConfigFilterTypeAll") },
                    ...availableSystemConfigTypes.map((type) => ({
                      value: type,
                      label: type,
                    })),
                  ]}
                  onValueChange={setSystemConfigTypeFilter}
                  placeholder={t("systemConfigFilterType")}
                  clearSearchOnClose
                  clearSearchOnSelect
                />

                <Select
                  value={systemConfigStatusFilter}
                  onValueChange={(value) =>
                    setSystemConfigStatusFilter(
                      value as SystemConfigStatusFilter,
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("systemConfigFilterStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("systemConfigFilterStatusAll")}
                    </SelectItem>
                    <SelectItem value="enabled">
                      {t("systemConfigFilterStatusEnabled")}
                    </SelectItem>
                    <SelectItem value="disabled">
                      {t("systemConfigFilterStatusDisabled")}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={handleResetSystemConfigFilters}
                  disabled={!hasActiveSystemConfigFilters}
                >
                  <FilterX className="mr-2 h-4 w-4" />
                  {t("systemConfigClearFilters")}
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("systemConfigColDisplayName")}</TableHead>
                      <TableHead>{t("systemConfigColKeyType")}</TableHead>
                      <TableHead>{t("systemConfigColConfigJson")}</TableHead>
                      <TableHead>{t("systemConfigColStatus")}</TableHead>
                      <TableHead>{t("systemConfigColUpdatedAt")}</TableHead>
                      <TableHead className="text-right">
                        {t("dictionaryTableColActions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSystemConfigs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          {t("systemConfigEmpty")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSystemConfigs.map((item) => {
                        const jsonPreview = formatConfigJsonPreview(
                          item.config_json,
                        );
                        const toggling = togglingSystemConfigId === item.id;

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {item.display_name}
                                </p>
                                {item.description ? (
                                  <p className="line-clamp-2 text-xs text-muted-foreground">
                                    {item.description}
                                  </p>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-mono text-xs">
                                  {item.config_key}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.config_type}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[260px]">
                              <p
                                className="truncate font-mono text-xs"
                                title={jsonPreview}
                              >
                                {jsonPreview}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    item.enabled ? "success" : "secondary"
                                  }
                                >
                                  {item.enabled
                                    ? t("systemConfigFilterStatusEnabled")
                                    : t("systemConfigFilterStatusDisabled")}
                                </Badge>
                                <Switch
                                  checked={item.enabled}
                                  disabled={toggling}
                                  aria-label={`${t("systemConfigFieldEnabled")} ${item.display_name}`}
                                  onCheckedChange={(checked) =>
                                    handleToggleSystemConfigEnabled(
                                      item,
                                      checked,
                                    )
                                  }
                                />
                                {toggling ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDateTime(item.updated_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    openEditSystemConfigDialog(item)
                                  }
                                  title={t("systemConfigActionEdit")}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setSystemConfigDeleteTarget(item)
                                  }
                                  title={t("systemConfigActionDelete")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

                {/* Security Settings */}
        <SecuritySettingsCard onChangePasswordClick={() => setIsPasswordDialogOpen(true)} />

        {/* Dictionary Quick Links */}
        <DictionaryQuickLinksCard locale={locale} />
      </div>

      <Dialog
        open={isSystemConfigDialogOpen}
        onOpenChange={(open) => {
          setIsSystemConfigDialogOpen(open);

          if (!open) {
            setEditingSystemConfig(null);
            setSystemConfigForm(getInitialSystemConfigForm());
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSystemConfig
                ? t("systemConfigDialogEditTitle")
                : t("systemConfigDialogCreateTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingSystemConfig
                ? t("systemConfigDialogEditDescription")
                : t("systemConfigDialogCreateDescription")}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmitSystemConfig}>
            <SystemConfigFormFields
              form={systemConfigForm}
              setForm={setSystemConfigForm}
              idPrefix="system-config"
              isEditing={Boolean(editingSystemConfig)}
              configTypeOptions={systemConfigTypeOptions}
              t={t}
            />

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsSystemConfigDialogOpen(false)}
                disabled={systemConfigSubmitting}
              >
                {t("btnCancel")}
              </Button>
              <Button type="submit" disabled={systemConfigSubmitting}>
                {systemConfigSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingSystemConfig
                  ? t("systemConfigDialogUpdateSubmit")
                  : t("systemConfigDialogCreateSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(systemConfigDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setSystemConfigDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("systemConfigDeleteDialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  {t("systemConfigDeleteDialogDescription", {
                    name: systemConfigDeleteTarget?.display_name || "-",
                    key: systemConfigDeleteTarget?.config_key || "-",
                  })}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingSystemConfigId)}>
              {t("btnCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSystemConfig}
              disabled={Boolean(deletingSystemConfigId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingSystemConfigId ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("systemConfigDeleteDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {t("dialogPasswordTitle")}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              {t("dialogPasswordDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="old-password"
                className="font-medium text-gray-900"
              >
                {t("fieldOldPassword")}
              </Label>
              <Input
                id="old-password"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    current_password: e.target.value,
                  })
                }
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="new-password"
                className="font-medium text-gray-900"
              >
                {t("fieldNewPassword")}
              </Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    new_password: e.target.value,
                  })
                }
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
              disabled={changing}
            >
              {t("btnCancel")}
            </Button>
            <Button onClick={handleChangePassword} disabled={changing}>
              {changing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("btnSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleanup Confirmation Dialog */}
      <AlertDialog
        open={isCleanupDialogOpen}
        onOpenChange={setIsCleanupDialogOpen}
      >
        <AlertDialogContent className="bg-white border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">
              {t("btnCleanup")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600">
              {t("confirmCleanup")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cleaning}>
              {t("btnCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCleanup}
              disabled={cleaning}
            >
              {cleaning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("btnCleanup")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
