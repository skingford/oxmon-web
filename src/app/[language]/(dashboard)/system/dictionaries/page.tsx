"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { ApiRequestError, api, getApiErrorMessage } from "@/lib/api"
import {
  CreateDictionaryRequest,
  DictionaryItem,
  DictionaryTypeSummary,
  UpdateDictionaryRequest,
} from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  BookText,
  FilterX,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

type DictionaryFormState = {
  dictType: string
  dictKey: string
  dictLabel: string
  dictValue: string
  sortOrder: string
  enabled: boolean
  description: string
  extraJson: string
}

type DictionarySortMode =
  | "sort_order_asc"
  | "sort_order_desc"
  | "updated_at_desc"
  | "updated_at_asc"
  | "dict_key_asc"
  | "dict_key_desc"

const DEFAULT_DICTIONARY_SORT_MODE: DictionarySortMode = "sort_order_asc"

function getInitialDictionaryForm(dictType: string): DictionaryFormState {
  return {
    dictType,
    dictKey: "",
    dictLabel: "",
    dictValue: "",
    sortOrder: "",
    enabled: true,
    description: "",
    extraJson: "",
  }
}

function getEditFormFromItem(item: DictionaryItem): DictionaryFormState {
  return {
    dictType: item.dict_type,
    dictKey: item.dict_key,
    dictLabel: item.dict_label,
    dictValue: item.dict_value || "",
    sortOrder: String(item.sort_order),
    enabled: item.enabled,
    description: item.description || "",
    extraJson: item.extra_json || "",
  }
}

function normalizeNullableText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function parseOptionalSortOrder(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return undefined
  }

  return parsed
}

function formatDateTime(value: string, locale: "zh" | "en") {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export default function SystemDictionariesPage() {
  const { t, locale } = useAppTranslations("system")

  const [typeSummaries, setTypeSummaries] = useState<DictionaryTypeSummary[]>([])
  const [selectedType, setSelectedType] = useState("")
  const [items, setItems] = useState<DictionaryItem[]>([])

  const [loadingTypes, setLoadingTypes] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [enabledOnly, setEnabledOnly] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [sortMode, setSortMode] = useState<DictionarySortMode>(DEFAULT_DICTIONARY_SORT_MODE)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createForm, setCreateForm] = useState<DictionaryFormState>(() => getInitialDictionaryForm(""))

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DictionaryItem | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editForm, setEditForm] = useState<DictionaryFormState>(() => getInitialDictionaryForm(""))

  const [deleteTarget, setDeleteTarget] = useState<DictionaryItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingEnabledId, setTogglingEnabledId] = useState<string | null>(null)

  const getStatusAwareMessage = (
    error: unknown,
    fallback: string,
    statusMessages?: Partial<Record<number, string>>
  ) => {
    if (error instanceof ApiRequestError && statusMessages?.[error.status]) {
      return statusMessages[error.status] as string
    }

    return getApiErrorMessage(error, fallback)
  }

  const fetchDictionaryTypes = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoadingTypes(true)
      }

      try {
        const data = await api.listDictionaryTypes()
        const sortedTypes = data
          .slice()
          .sort((left, right) => left.dict_type.localeCompare(right.dict_type))

        setTypeSummaries(sortedTypes)
        setSelectedType((previous) => {
          if (previous && sortedTypes.some((typeSummary) => typeSummary.dict_type === previous)) {
            return previous
          }

          return sortedTypes[0]?.dict_type || ""
        })

        return sortedTypes
      } catch (error) {
        toast.error(getApiErrorMessage(error, t("dictionaryToastFetchTypesError")))
        setTypeSummaries([])
        setSelectedType("")
        return []
      } finally {
        if (!silent) {
          setLoadingTypes(false)
        }
      }
    },
    [t]
  )

  const fetchDictionaryItems = useCallback(
    async (dictType: string, silent = false) => {
      if (!dictType) {
        setItems([])
        return []
      }

      if (!silent) {
        setLoadingItems(true)
      }

      try {
        const data = await api.listDictionariesByType(dictType, enabledOnly)
        setItems(data)
        return data
      } catch (error) {
        toast.error(getApiErrorMessage(error, t("dictionaryToastFetchItemsError")))
        setItems([])
        return []
      } finally {
        if (!silent) {
          setLoadingItems(false)
        }
      }
    },
    [enabledOnly, t]
  )

  useEffect(() => {
    fetchDictionaryTypes()
  }, [fetchDictionaryTypes])

  useEffect(() => {
    if (!selectedType) {
      setItems([])
      setLoadingItems(false)
      return
    }

    fetchDictionaryItems(selectedType)
  }, [fetchDictionaryItems, selectedType])

  const selectedTypeSummary = useMemo(() => {
    return typeSummaries.find((summary) => summary.dict_type === selectedType) || null
  }, [selectedType, typeSummaries])

  const stats = useMemo(() => {
    const total = items.length
    const enabled = items.filter((item) => item.enabled).length
    const system = items.filter((item) => item.is_system).length

    return {
      total,
      enabled,
      system,
    }
  }, [items])

  const filteredItems = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    const matchedItems = keyword
      ? items.filter((item) => {
          const searchable = [
            item.dict_key,
            item.dict_label,
            item.dict_value || "",
            item.description || "",
          ]
            .join(" ")
            .toLowerCase()

          return searchable.includes(keyword)
        })
      : items

    return matchedItems.slice().sort((left, right) => {
      if (sortMode === "sort_order_asc") {
        if (left.sort_order !== right.sort_order) {
          return left.sort_order - right.sort_order
        }

        return left.dict_key.localeCompare(right.dict_key)
      }

      if (sortMode === "sort_order_desc") {
        if (left.sort_order !== right.sort_order) {
          return right.sort_order - left.sort_order
        }

        return right.dict_key.localeCompare(left.dict_key)
      }

      if (sortMode === "updated_at_desc") {
        const leftTime = new Date(left.updated_at).getTime() || 0
        const rightTime = new Date(right.updated_at).getTime() || 0

        if (leftTime !== rightTime) {
          return rightTime - leftTime
        }

        return left.dict_key.localeCompare(right.dict_key)
      }

      if (sortMode === "updated_at_asc") {
        const leftTime = new Date(left.updated_at).getTime() || 0
        const rightTime = new Date(right.updated_at).getTime() || 0

        if (leftTime !== rightTime) {
          return leftTime - rightTime
        }

        return left.dict_key.localeCompare(right.dict_key)
      }

      if (sortMode === "dict_key_desc") {
        return right.dict_key.localeCompare(left.dict_key)
      }

      return left.dict_key.localeCompare(right.dict_key)
    })
  }, [items, searchKeyword, sortMode])

  const hasActiveFilters =
    Boolean(searchKeyword.trim()) ||
    enabledOnly ||
    sortMode !== DEFAULT_DICTIONARY_SORT_MODE

  const handleResetFilters = () => {
    setSearchKeyword("")
    setEnabledOnly(false)
    setSortMode(DEFAULT_DICTIONARY_SORT_MODE)
  }

  const openCreateDialog = () => {
    setCreateForm(getInitialDictionaryForm(selectedType))
    setIsCreateDialogOpen(true)
  }

  const handleRefresh = async () => {
    setRefreshing(true)

    const latestTypes = await fetchDictionaryTypes(true)
    const targetType =
      selectedType && latestTypes.some((item) => item.dict_type === selectedType)
        ? selectedType
        : latestTypes[0]?.dict_type || ""

    if (targetType) {
      await fetchDictionaryItems(targetType, true)
      setSelectedType(targetType)
    } else {
      setItems([])
    }

    setRefreshing(false)
  }

  const handleCreateDictionary = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const dictType = createForm.dictType.trim()
    const dictKey = createForm.dictKey.trim()
    const dictLabel = createForm.dictLabel.trim()

    if (!dictType) {
      toast.error(t("dictionaryToastTypeRequired"))
      return
    }

    if (!dictKey) {
      toast.error(t("dictionaryToastKeyRequired"))
      return
    }

    if (!dictLabel) {
      toast.error(t("dictionaryToastLabelRequired"))
      return
    }

    const sortOrder = parseOptionalSortOrder(createForm.sortOrder)

    if (sortOrder === undefined) {
      toast.error(t("dictionaryToastSortOrderInvalid"))
      return
    }

    const extraJson = createForm.extraJson.trim()

    if (extraJson) {
      try {
        JSON.parse(extraJson)
      } catch {
        toast.error(t("dictionaryToastExtraJsonInvalid"))
        return
      }
    }

    const payload: CreateDictionaryRequest = {
      dict_type: dictType,
      dict_key: dictKey,
      dict_label: dictLabel,
      enabled: createForm.enabled,
    }

    const dictValue = createForm.dictValue.trim()

    if (dictValue) {
      payload.dict_value = dictValue
    }

    if (sortOrder !== null) {
      payload.sort_order = sortOrder
    }

    const description = createForm.description.trim()

    if (description) {
      payload.description = description
    }

    if (extraJson) {
      payload.extra_json = extraJson
    }

    setCreateSubmitting(true)

    try {
      await api.createDictionary(payload)
      toast.success(t("dictionaryToastCreateSuccess"))
      setIsCreateDialogOpen(false)
      setCreateForm(getInitialDictionaryForm(dictType))

      await fetchDictionaryTypes(true)
      setSelectedType(dictType)
      await fetchDictionaryItems(dictType, true)
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, t("dictionaryToastCreateError"), {
          409: t("dictionaryToastCreateConflict"),
        })
      )
    } finally {
      setCreateSubmitting(false)
    }
  }

  const openEditDialog = (item: DictionaryItem) => {
    setEditingItem(item)
    setEditForm(getEditFormFromItem(item))
    setIsEditDialogOpen(true)
  }

  const handleUpdateDictionary = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingItem) {
      return
    }

    const dictLabel = editForm.dictLabel.trim()

    if (!dictLabel) {
      toast.error(t("dictionaryToastLabelRequired"))
      return
    }

    const sortOrder = parseOptionalSortOrder(editForm.sortOrder)

    if (sortOrder === undefined) {
      toast.error(t("dictionaryToastSortOrderInvalid"))
      return
    }

    const extraJsonValue = editForm.extraJson.trim()

    if (extraJsonValue) {
      try {
        JSON.parse(extraJsonValue)
      } catch {
        toast.error(t("dictionaryToastExtraJsonInvalid"))
        return
      }
    }

    const payload: UpdateDictionaryRequest = {
      dict_label: dictLabel,
      dict_value: normalizeNullableText(editForm.dictValue),
      sort_order: sortOrder,
      enabled: editForm.enabled,
      description: normalizeNullableText(editForm.description),
      extra_json: normalizeNullableText(editForm.extraJson),
    }

    setEditSubmitting(true)

    try {
      await api.updateDictionary(editingItem.id, payload)
      toast.success(t("dictionaryToastUpdateSuccess"))
      setIsEditDialogOpen(false)
      setEditingItem(null)
      await fetchDictionaryItems(selectedType, true)
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, t("dictionaryToastUpdateError"), {
          404: t("dictionaryToastUpdateNotFound"),
        })
      )
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleToggleItemEnabled = async (item: DictionaryItem, enabled: boolean) => {
    if (item.enabled === enabled) {
      return
    }

    setTogglingEnabledId(item.id)

    try {
      const updatedItem = await api.updateDictionary(item.id, { enabled })

      setItems((previous) =>
        previous.map((previousItem) =>
          previousItem.id === item.id ? { ...previousItem, ...updatedItem } : previousItem
        )
      )

      toast.success(t("dictionaryToastUpdateSuccess"))
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, t("dictionaryToastUpdateError"), {
          404: t("dictionaryToastUpdateNotFound"),
        })
      )
    } finally {
      setTogglingEnabledId(null)
    }
  }

  const handleDeleteDictionary = async () => {
    if (!deleteTarget) {
      return
    }

    if (deleteTarget.is_system) {
      toast.error(t("dictionaryToastSystemItemUndeletable"))
      setDeleteTarget(null)
      return
    }

    const targetId = deleteTarget.id

    setDeletingId(targetId)

    try {
      await api.deleteDictionary(targetId)
      toast.success(t("dictionaryToastDeleteSuccess"))
      setDeleteTarget(null)
      await fetchDictionaryItems(selectedType, true)
      await fetchDictionaryTypes(true)
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, t("dictionaryToastDeleteError"), {
          403: t("dictionaryToastDeleteForbidden"),
          404: t("dictionaryToastDeleteNotFound"),
        })
      )
    } finally {
      setDeletingId(null)
    }
  }

  const isInitialLoading = loadingTypes && !selectedType

  return (
    <div className="space-y-6 px-8 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("dictionaryTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("dictionaryDescription")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("dictionaryButtonRefresh")}
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t("dictionaryButtonCreate")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookText className="h-4 w-4" />
              {t("dictionaryTypeLabel")}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t("dictionaryStatsTotal", { count: stats.total })}</Badge>
              <Badge variant="secondary">{t("dictionaryStatsEnabled", { count: stats.enabled })}</Badge>
              <Badge variant="secondary">{t("dictionaryStatsSystem", { count: stats.system })}</Badge>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="space-y-2">
              <Label>{t("dictionaryTypeLabel")}</Label>
              <Select
                value={selectedType || undefined}
                onValueChange={(value) => setSelectedType(value)}
                disabled={loadingTypes || typeSummaries.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingTypes ? t("dictionaryLoading") : t("dictionaryTypePlaceholder")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {typeSummaries.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      {t("dictionaryTypeEmpty")}
                    </SelectItem>
                  ) : (
                    typeSummaries.map((typeSummary) => (
                      <SelectItem key={typeSummary.dict_type} value={typeSummary.dict_type}>
                        {typeSummary.dict_type} ({typeSummary.count})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 xl:col-span-2">
              <Label>{t("dictionarySearchPlaceholder")}</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder={t("dictionarySearchPlaceholder")}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("dictionarySortLabel")}</Label>
              <Select
                value={sortMode}
                onValueChange={(value) => setSortMode(value as DictionarySortMode)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("dictionarySortPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sort_order_asc">{t("dictionarySortOrderAsc")}</SelectItem>
                  <SelectItem value="sort_order_desc">{t("dictionarySortOrderDesc")}</SelectItem>
                  <SelectItem value="updated_at_desc">{t("dictionarySortUpdatedDesc")}</SelectItem>
                  <SelectItem value="updated_at_asc">{t("dictionarySortUpdatedAsc")}</SelectItem>
                  <SelectItem value="dict_key_asc">{t("dictionarySortKeyAsc")}</SelectItem>
                  <SelectItem value="dict_key_desc">{t("dictionarySortKeyDesc")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex h-full items-end">
              <div className="flex h-10 w-full items-center justify-between rounded-md border px-3">
                <p className="text-sm">{t("dictionaryEnabledOnlyShort")}</p>
                <Switch checked={enabledOnly} onCheckedChange={setEnabledOnly} />
              </div>
            </div>

            <div className="flex h-full items-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
                className="h-10 w-full"
              >
                <FilterX className="mr-2 h-4 w-4" />
                {t("dictionaryResetFilters")}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dictionaryTableTitle")}</CardTitle>
          <CardDescription>
            {t("dictionaryTableDescription", {
              type: selectedTypeSummary?.dict_type || "-",
            })}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dictionaryTableColKey")}</TableHead>
                <TableHead>{t("dictionaryTableColLabel")}</TableHead>
                <TableHead>{t("dictionaryTableColValue")}</TableHead>
                <TableHead>{t("dictionaryTableColSort")}</TableHead>
                <TableHead>{t("dictionaryTableColStatus")}</TableHead>
                <TableHead>{t("dictionaryTableColSystem")}</TableHead>
                <TableHead>{t("dictionaryTableColUpdatedAt")}</TableHead>
                <TableHead className="text-right">{t("dictionaryTableColActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isInitialLoading || loadingItems ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={8} className="h-14 text-muted-foreground">
                      {t("dictionaryLoading")}
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-36 text-center text-muted-foreground">
                    <div className="space-y-1">
                      <p>{t("dictionaryEmpty")}</p>
                      <p className="text-xs">{t("dictionaryEmptyHint")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{item.dict_key}</p>
                        <p className="font-mono text-xs text-muted-foreground">{item.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.dict_label}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{item.dict_value || "-"}</TableCell>
                    <TableCell>{item.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.enabled}
                          onCheckedChange={(checked) => handleToggleItemEnabled(item, checked)}
                          disabled={togglingEnabledId === item.id}
                        />
                        <Badge variant={item.enabled ? "secondary" : "outline"}>
                          {togglingEnabledId === item.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : null}
                          {item.enabled ? t("dictionaryStatusEnabled") : t("dictionaryStatusDisabled")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_system ? "secondary" : "outline"}>
                        {item.is_system ? t("dictionarySystemBuiltIn") : t("dictionarySystemCustom")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(item.updated_at, locale)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                          title={t("dictionaryActionEdit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(item)}
                          title={
                            item.is_system
                              ? t("dictionaryToastSystemItemUndeletable")
                              : t("dictionaryActionDelete")
                          }
                          disabled={item.is_system}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)

          if (!open) {
            setCreateForm(getInitialDictionaryForm(selectedType))
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("dictionaryCreateDialogTitle")}</DialogTitle>
            <DialogDescription>{t("dictionaryCreateDialogDescription")}</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateDictionary}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dictionary-create-type">{t("dictionaryFieldType")}</Label>
                <Input
                  id="dictionary-create-type"
                  value={createForm.dictType}
                  onChange={(event) =>
                    setCreateForm((previous) => ({
                      ...previous,
                      dictType: event.target.value,
                    }))
                  }
                  list="dictionary-type-options"
                  placeholder={t("dictionaryTypePlaceholder")}
                />
                <datalist id="dictionary-type-options">
                  {typeSummaries.map((typeSummary) => (
                    <option key={typeSummary.dict_type} value={typeSummary.dict_type} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dictionary-create-key">{t("dictionaryFieldKey")}</Label>
                <Input
                  id="dictionary-create-key"
                  value={createForm.dictKey}
                  onChange={(event) =>
                    setCreateForm((previous) => ({
                      ...previous,
                      dictKey: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dictionary-create-label">{t("dictionaryFieldLabel")}</Label>
                <Input
                  id="dictionary-create-label"
                  value={createForm.dictLabel}
                  onChange={(event) =>
                    setCreateForm((previous) => ({
                      ...previous,
                      dictLabel: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dictionary-create-value">{t("dictionaryFieldValue")}</Label>
                <Input
                  id="dictionary-create-value"
                  value={createForm.dictValue}
                  onChange={(event) =>
                    setCreateForm((previous) => ({
                      ...previous,
                      dictValue: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dictionary-create-sort">{t("dictionaryFieldSortOrder")}</Label>
                <Input
                  id="dictionary-create-sort"
                  value={createForm.sortOrder}
                  onChange={(event) =>
                    setCreateForm((previous) => ({
                      ...previous,
                      sortOrder: event.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>{t("dictionaryFieldEnabled")}</Label>
                <div className="flex h-10 items-center justify-between rounded-md border px-3">
                  <span className="text-sm">
                    {createForm.enabled ? t("dictionaryStatusEnabled") : t("dictionaryStatusDisabled")}
                  </span>
                  <Switch
                    checked={createForm.enabled}
                    onCheckedChange={(checked) =>
                      setCreateForm((previous) => ({
                        ...previous,
                        enabled: checked,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dictionary-create-description">{t("dictionaryFieldDescription")}</Label>
              <Textarea
                id="dictionary-create-description"
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dictionary-create-extra-json">{t("dictionaryFieldExtraJson")}</Label>
              <Textarea
                id="dictionary-create-extra-json"
                value={createForm.extraJson}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    extraJson: event.target.value,
                  }))
                }
                rows={3}
                placeholder='{"key":"value"}'
              />
              <p className="text-xs text-muted-foreground">{t("dictionaryFieldExtraJsonHint")}</p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createSubmitting}
              >
                {t("dictionaryDialogCancel")}
              </Button>
              <Button type="submit" disabled={createSubmitting}>
                {createSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {createSubmitting ? t("dictionaryDialogCreating") : t("dictionaryDialogCreateSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)

          if (!open) {
            setEditingItem(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("dictionaryEditDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("dictionaryEditDialogDescription", { key: editingItem?.dict_key || "-" })}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleUpdateDictionary}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("dictionaryFieldType")}</Label>
                <Input value={editForm.dictType} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>{t("dictionaryFieldKey")}</Label>
                <Input value={editForm.dictKey} readOnly className="bg-muted" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dictionary-edit-label">{t("dictionaryFieldLabel")}</Label>
                <Input
                  id="dictionary-edit-label"
                  value={editForm.dictLabel}
                  onChange={(event) =>
                    setEditForm((previous) => ({
                      ...previous,
                      dictLabel: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dictionary-edit-value">{t("dictionaryFieldValue")}</Label>
                <Input
                  id="dictionary-edit-value"
                  value={editForm.dictValue}
                  onChange={(event) =>
                    setEditForm((previous) => ({
                      ...previous,
                      dictValue: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dictionary-edit-sort">{t("dictionaryFieldSortOrder")}</Label>
                <Input
                  id="dictionary-edit-sort"
                  value={editForm.sortOrder}
                  onChange={(event) =>
                    setEditForm((previous) => ({
                      ...previous,
                      sortOrder: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("dictionaryFieldEnabled")}</Label>
                <div className="flex h-10 items-center justify-between rounded-md border px-3">
                  <span className="text-sm">
                    {editForm.enabled ? t("dictionaryStatusEnabled") : t("dictionaryStatusDisabled")}
                  </span>
                  <Switch
                    checked={editForm.enabled}
                    onCheckedChange={(checked) =>
                      setEditForm((previous) => ({
                        ...previous,
                        enabled: checked,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dictionary-edit-description">{t("dictionaryFieldDescription")}</Label>
              <Textarea
                id="dictionary-edit-description"
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dictionary-edit-extra-json">{t("dictionaryFieldExtraJson")}</Label>
              <Textarea
                id="dictionary-edit-extra-json"
                value={editForm.extraJson}
                onChange={(event) =>
                  setEditForm((previous) => ({
                    ...previous,
                    extraJson: event.target.value,
                  }))
                }
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{t("dictionaryFieldExtraJsonHint")}</p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={editSubmitting}
              >
                {t("dictionaryDialogCancel")}
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editSubmitting ? t("dictionaryDialogUpdating") : t("dictionaryDialogUpdateSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dictionaryDeleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dictionaryDeleteDialogDescription", { key: deleteTarget?.dict_key || "-" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>
              {t("dictionaryDialogCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDictionary}
              disabled={Boolean(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("dictionaryDeleteDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
