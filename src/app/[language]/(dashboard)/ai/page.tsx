"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { buildTranslatedPaginationTextBundle } from "@/lib/pagination-summary";
import type { AIAccountResponse } from "@/types/api";
import { formatDateTimeByLocale } from "@/lib/date-time";
import {
  toastApiError,
  toastCreated,
  toastDeleted,
  toastSaved,
} from "@/lib/toast";
import { useAppTranslations } from "@/hooks/use-app-translations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SensitiveInput } from "@/components/ui/sensitive-input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useClientPagination } from "@/hooks/use-client-pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2, Plus, RefreshCw } from "lucide-react";

type FormState = {
  config_key: string;
  provider: string;
  display_name: string;
  description: string;
  api_key: string;
  model: string;
  base_url: string;
  api_mode: string;
  timeout_secs: string;
  max_tokens: string;
  temperature: string;
  collection_interval_secs: string;
  enabled: boolean;
};

const EMPTY_FORM: FormState = {
  config_key: "",
  provider: "",
  display_name: "",
  description: "",
  api_key: "",
  model: "",
  base_url: "",
  api_mode: "",
  timeout_secs: "",
  max_tokens: "",
  temperature: "",
  collection_interval_secs: "",
  enabled: true,
};
const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

function normalizeNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseOptionalInteger(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { valid: true, value: null as number | null };
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return { valid: false, value: null as number | null };
  }

  return { valid: true, value: parsed };
}

function parseOptionalFloat(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { valid: true, value: null as number | null };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { valid: false, value: null as number | null };
  }

  return { valid: true, value: parsed };
}

export default function AIAccountsPage() {
  const { t, locale } = useAppTranslations("ai");
  const [items, setItems] = useState<AIAccountResponse[]>([]);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AIAccountResponse | null>(null);
  const [editingLoadingId, setEditingLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AIAccountResponse | null>(
    null,
  );
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    [items],
  );
  const tablePagination = useClientPagination({
    items: sortedItems,
    pageSize,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.listAIAccounts();
      setItems(data);
    } catch (error) {
      toastApiError(error, t("accounts.toastFetchError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = async (item: AIAccountResponse) => {
    setEditingLoadingId(item.id);
    try {
      const detail = await api.getAIAccountById(item.id);
      setEditing(detail);
      setForm({
        config_key: detail.config_key,
        provider: detail.provider,
        display_name: detail.display_name,
        description: detail.description || "",
        api_key: detail.api_key || "",
        model: detail.model || "",
        base_url: detail.base_url || "",
        api_mode: detail.api_mode || "",
        timeout_secs: detail.timeout_secs == null ? "" : String(detail.timeout_secs),
        max_tokens: detail.max_tokens == null ? "" : String(detail.max_tokens),
        temperature: detail.temperature == null ? "" : String(detail.temperature),
        collection_interval_secs:
          detail.collection_interval_secs == null
            ? ""
            : String(detail.collection_interval_secs),
        enabled: detail.enabled,
      });
      setDialogOpen(true);
    } catch (error) {
      toastApiError(error, t("accounts.toastFetchError"));
    } finally {
      setEditingLoadingId(null);
    }
  };

  const submit = async () => {
    const configKey = form.config_key.trim();
    const provider = form.provider.trim();
    const displayName = form.display_name.trim();
    const apiKey = form.api_key.trim();
    const timeoutSecs = parseOptionalInteger(form.timeout_secs);
    const maxTokens = parseOptionalInteger(form.max_tokens);
    const temperature = parseOptionalFloat(form.temperature);
    const collectionIntervalSecs = parseOptionalInteger(form.collection_interval_secs);

    if (!configKey)
      return void toastApiError(
        new Error(""),
        t("accounts.toastConfigKeyRequired"),
      );
    if (!provider)
      return void toastApiError(
        new Error(""),
        t("accounts.toastProviderRequired"),
      );
    if (!displayName)
      return void toastApiError(
        new Error(""),
        t("accounts.toastDisplayNameRequired"),
      );
    if (!editing && !apiKey) {
      return void toastApiError(
        new Error(""),
        t("accounts.toastApiKeyRequired"),
      );
    }
    if (
      !timeoutSecs.valid ||
      !maxTokens.valid ||
      !temperature.valid ||
      !collectionIntervalSecs.valid
    ) {
      return void toastApiError(
        new Error(""),
        t("accounts.toastNumberInvalid"),
      );
    }

    setSubmitting(true);
    try {
      if (editing) {
        await api.updateAIAccount(editing.id, {
          display_name: displayName,
          description: normalizeNullableString(form.description),
          api_key: normalizeNullableString(form.api_key),
          model: normalizeNullableString(form.model),
          base_url: normalizeNullableString(form.base_url),
          api_mode: normalizeNullableString(form.api_mode),
          timeout_secs: timeoutSecs.value,
          max_tokens: maxTokens.value,
          temperature: temperature.value,
          collection_interval_secs: collectionIntervalSecs.value,
          enabled: form.enabled,
        });
        toastSaved(t("accounts.toastUpdateSuccess"));
      } else {
        await api.createAIAccount({
          config_key: configKey,
          provider,
          display_name: displayName,
          description: normalizeNullableString(form.description),
          api_key: apiKey,
          model: normalizeNullableString(form.model),
          base_url: normalizeNullableString(form.base_url),
          api_mode: normalizeNullableString(form.api_mode),
          timeout_secs: timeoutSecs.value,
          max_tokens: maxTokens.value,
          temperature: temperature.value,
          collection_interval_secs: collectionIntervalSecs.value,
          enabled: form.enabled,
        });
        toastCreated(t("accounts.toastCreateSuccess"));
      }
      setDialogOpen(false);
      await fetchData();
    } catch (error) {
      toastApiError(
        error,
        editing
          ? t("accounts.toastUpdateError")
          : t("accounts.toastCreateError"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteAIAccount(deleteTarget.id);
      toastDeleted(t("accounts.toastDeleteSuccess"));
      setDeleteTarget(null);
      await fetchData();
    } catch (error) {
      toastApiError(error, t("accounts.toastDeleteError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("accounts.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("accounts.description")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void fetchData()}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            {t("accounts.refreshButton")}
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("accounts.createButton")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("accounts.tableTitle")}</CardTitle>
          <CardDescription>{t("accounts.tableDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("accounts.colName")}</TableHead>
                <TableHead>{t("accounts.colKey")}</TableHead>
                <TableHead>{t("accounts.colProvider")}</TableHead>
                <TableHead>{t("accounts.colStatus")}</TableHead>
                <TableHead>{t("accounts.colUpdatedAt")}</TableHead>
                <TableHead className="text-right">
                  {t("accounts.colActions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("accounts.tableLoading")}
                  </TableCell>
                </TableRow>
              ) : sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("accounts.tableEmpty")}
                  </TableCell>
                </TableRow>
              ) : (
                tablePagination.paginatedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="font-medium">{item.display_name}</div>
                        {item.description ? (
                          <div className="max-w-[320px] truncate text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.config_key}
                    </TableCell>
                    <TableCell>{item.provider || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={item.enabled ? "default" : "secondary"}>
                        {item.enabled
                          ? t("accounts.statusEnabled")
                          : t("accounts.statusDisabled")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTimeByLocale(item.updated_at, locale, item.updated_at || "-")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void openEdit(item)}
                          disabled={editingLoadingId === item.id}
                        >
                          {editingLoadingId === item.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {t("accounts.actionEdit")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteTarget(item)}
                        >
                          {t("accounts.actionDelete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!loading && sortedItems.length > 0 ? (
            <PaginationControls
              className="mt-4"
              pageSize={pageSize}
              pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
              onPageSizeChange={(nextPageSize) => {
                if (
                  !PAGE_SIZE_OPTIONS.includes(
                    nextPageSize as (typeof PAGE_SIZE_OPTIONS)[number],
                  )
                ) {
                  return;
                }

                setPageSize(nextPageSize);
                tablePagination.setPage(1);
              }}
              {...buildTranslatedPaginationTextBundle({
                t,
                summaryKey: "accounts.paginationSummary",
                total: tablePagination.totalRows,
                start: tablePagination.startIndex,
                end: tablePagination.endIndex,
                pageKey: "accounts.paginationPage",
                currentPage: tablePagination.currentPage,
                totalPages: tablePagination.totalPages,
                prevKey: "accounts.paginationPrev",
                nextKey: "accounts.paginationNext",
              })}
              pageSizePlaceholder={t("accounts.pageSizePlaceholder")}
              onPrevPage={() =>
                tablePagination.setPage((prev) => Math.max(1, prev - 1))
              }
              onNextPage={() =>
                tablePagination.setPage((prev) =>
                  Math.min(tablePagination.totalPages, prev + 1),
                )
              }
              prevDisabled={
                tablePagination.currentPage <= 1 ||
                tablePagination.totalRows === 0
              }
              nextDisabled={
                tablePagination.currentPage >= tablePagination.totalPages ||
                tablePagination.totalRows === 0
              }
              pageSizeOptionLabel={(value) =>
                locale === "zh" ? `${value} / 页` : `${value} / page`
              }
            />
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? t("accounts.dialogEditTitle")
                : t("accounts.dialogCreateTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("accounts.dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-4 rounded-md border p-4">
              <p className="text-sm font-medium">{t("accounts.sectionBasic")}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("accounts.fieldConfigKey")}</Label>
                  <Input
                    value={form.config_key}
                    disabled={Boolean(editing)}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, config_key: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("accounts.fieldProvider")}</Label>
                  <Input
                    value={form.provider}
                    disabled={Boolean(editing)}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, provider: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("accounts.fieldDisplayName")}</Label>
                  <Input
                    value={form.display_name}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, display_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("accounts.fieldDescription")}</Label>
                  <Input
                    value={form.description}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, description: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("accounts.fieldCollectionIntervalSecs")}</Label>
                  <Input
                    inputMode="numeric"
                    value={form.collection_interval_secs}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        collection_interval_secs: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3 sm:col-span-2">
                  <Label>{t("accounts.fieldEnabled")}</Label>
                  <Switch
                    checked={form.enabled}
                    onCheckedChange={(checked) =>
                      setForm((s) => ({ ...s, enabled: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-md border p-4">
              <p className="text-sm font-medium">{t("accounts.sectionModelConfig")}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("accounts.fieldBaseUrl")}</Label>
                  <Input
                    value={form.base_url}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, base_url: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("accounts.fieldApiKey")}</Label>
                  <SensitiveInput
                    value={form.api_key}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, api_key: e.target.value }))
                    }
                    showLabel={t("accounts.showApiKey")}
                    hideLabel={t("accounts.hideApiKey")}
                    copyLabel={locale === "zh" ? "复制 API Key" : "Copy API Key"}
                    copiedMessage={locale === "zh" ? "已复制 API Key" : "Copied API Key"}
                    enableCopy
                    resetKey={dialogOpen}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("accounts.fieldModel")}</Label>
                  <Input
                    value={form.model}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, model: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("accounts.fieldApiMode")}</Label>
                  <Input
                    value={form.api_mode}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, api_mode: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("accounts.fieldTimeoutSecs")}</Label>
                  <Input
                    inputMode="numeric"
                    value={form.timeout_secs}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, timeout_secs: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("accounts.fieldMaxTokens")}</Label>
                  <Input
                    inputMode="numeric"
                    value={form.max_tokens}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, max_tokens: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("accounts.fieldTemperature")}</Label>
                  <Input
                    value={form.temperature}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, temperature: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              {t("accounts.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editing
                ? t("accounts.submitUpdate")
                : t("accounts.submitCreate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("accounts.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("accounts.deleteConfirmDescription", {
                name: deleteTarget?.display_name || "-",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("accounts.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("accounts.deleteConfirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
