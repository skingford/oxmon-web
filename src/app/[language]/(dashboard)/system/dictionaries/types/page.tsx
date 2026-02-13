"use client"

import { FormEvent, useCallback, useMemo, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import {
  CreateDictionaryTypeRequest,
  DictionaryTypeSummary,
  UpdateDictionaryTypeRequest,
} from "@/types/api"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { useDictionaryTypes } from "@/hooks/use-dictionary-types"
import {
  DictionaryTypeFormFields,
  DictionaryTypeFormState,
} from "@/components/system/DictionaryTypeFormFields"
import { getStatusAwareMessage } from "@/lib/api-error-utils"
import { normalizeNullableText, parseOptionalSortOrder } from "@/lib/dictionary-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/ui/filter-toolbar"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"

type DictionaryTypeSortMode =
  | "count_desc"
  | "count_asc"
  | "label_asc"
  | "type_asc"

const DEFAULT_TYPE_SORT_MODE: DictionaryTypeSortMode = "count_desc"

function getInitialDictionaryTypeForm(
  dictType = "",
  dictTypeLabel = ""
): DictionaryTypeFormState {
  return {
    dictType,
    dictTypeLabel,
    sortOrder: "",
    description: "",
  }
}

export default function SystemDictionaryTypesPage() {
  const { t } = useAppTranslations("system")

  const [refreshing, setRefreshing] = useState(false)

  const [typeKeyword, setTypeKeyword] = useState("")
  const [typeSortMode, setTypeSortMode] = useState<DictionaryTypeSortMode>(DEFAULT_TYPE_SORT_MODE)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createForm, setCreateForm] = useState<DictionaryTypeFormState>(() =>
    getInitialDictionaryTypeForm()
  )

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<DictionaryTypeSummary | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editForm, setEditForm] = useState<DictionaryTypeFormState>(() =>
    getInitialDictionaryTypeForm()
  )

  const [deleteTarget, setDeleteTarget] = useState<DictionaryTypeSummary | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const handleTypeFetchError = useCallback(
    (error: unknown) => {
      toast.error(getApiErrorMessage(error, t("dictionaryToastFetchTypesError")))
    },
    [t]
  )

  const {
    typeSummaries,
    selectedType,
    setSelectedType,
    loadingTypes,
    fetchDictionaryTypes,
  } = useDictionaryTypes({
    onError: handleTypeFetchError,
  })

  const filteredTypeSummaries = useMemo(() => {
    const keyword = typeKeyword.trim().toLowerCase()

    const matchedTypes = keyword
      ? typeSummaries.filter((typeSummary) => {
          const searchable = `${typeSummary.dict_type} ${typeSummary.dict_type_label}`.toLowerCase()
          return searchable.includes(keyword)
        })
      : typeSummaries

    return matchedTypes.slice().sort((left, right) => {
      if (typeSortMode === "count_desc") {
        if (left.count !== right.count) {
          return right.count - left.count
        }

        return left.dict_type.localeCompare(right.dict_type)
      }

      if (typeSortMode === "count_asc") {
        if (left.count !== right.count) {
          return left.count - right.count
        }

        return left.dict_type.localeCompare(right.dict_type)
      }

      if (typeSortMode === "label_asc") {
        return left.dict_type_label.localeCompare(right.dict_type_label)
      }

      return left.dict_type.localeCompare(right.dict_type)
    })
  }, [typeKeyword, typeSortMode, typeSummaries])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDictionaryTypes(true)
    setRefreshing(false)
  }

  const openCreateDialog = () => {
    setCreateForm(getInitialDictionaryTypeForm())
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (typeSummary: DictionaryTypeSummary) => {
    setSelectedType(typeSummary.dict_type)
    setEditingType(typeSummary)
    setEditForm(getInitialDictionaryTypeForm(typeSummary.dict_type, typeSummary.dict_type_label))
    setIsEditDialogOpen(true)
  }

  const handleCreateDictionaryType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const dictType = createForm.dictType.trim()
    const dictTypeLabel = createForm.dictTypeLabel.trim()

    if (!dictType) {
      toast.error(t("dictionaryToastTypeRequired"))
      return
    }

    if (!dictTypeLabel) {
      toast.error(t("dictionaryToastTypeLabelRequired"))
      return
    }

    const sortOrder = parseOptionalSortOrder(createForm.sortOrder)

    if (sortOrder === undefined) {
      toast.error(t("dictionaryToastSortOrderInvalid"))
      return
    }

    const payload: CreateDictionaryTypeRequest = {
      dict_type: dictType,
      dict_type_label: dictTypeLabel,
    }

    if (sortOrder !== null) {
      payload.sort_order = sortOrder
    }

    const description = normalizeNullableText(createForm.description)
    if (description !== null) {
      payload.description = description
    }

    setCreateSubmitting(true)

    try {
      await api.createDictionaryType(payload)
      toast.success(t("dictionaryTypeToastCreateSuccess"))
      setIsCreateDialogOpen(false)
      setCreateForm(getInitialDictionaryTypeForm())

      const latestTypes = await fetchDictionaryTypes(true)
      const targetType = latestTypes.some((item) => item.dict_type === dictType)
        ? dictType
        : latestTypes[0]?.dict_type || ""

      if (targetType) {
        setSelectedType(targetType)
      }
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, t("dictionaryTypeToastCreateError"), {
          409: t("dictionaryTypeToastCreateConflict"),
        })
      )
    } finally {
      setCreateSubmitting(false)
    }
  }

  const handleUpdateDictionaryType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingType) {
      return
    }

    const dictTypeLabel = editForm.dictTypeLabel.trim()

    if (!dictTypeLabel) {
      toast.error(t("dictionaryToastTypeLabelRequired"))
      return
    }

    const sortOrder = parseOptionalSortOrder(editForm.sortOrder)

    if (sortOrder === undefined) {
      toast.error(t("dictionaryToastSortOrderInvalid"))
      return
    }

    const payload: UpdateDictionaryTypeRequest = {
      dict_type_label: dictTypeLabel,
    }

    if (sortOrder !== null) {
      payload.sort_order = sortOrder
    }

    const description = normalizeNullableText(editForm.description)
    if (description !== null) {
      payload.description = description
    }

    setEditSubmitting(true)

    try {
      await api.updateDictionaryType(editingType.dict_type, payload)
      toast.success(t("dictionaryTypeToastUpdateSuccess"))
      setIsEditDialogOpen(false)
      setEditingType(null)

      const latestTypes = await fetchDictionaryTypes(true)
      const targetType = latestTypes.some((item) => item.dict_type === editingType.dict_type)
        ? editingType.dict_type
        : latestTypes[0]?.dict_type || ""

      if (targetType) {
        setSelectedType(targetType)
      }
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, t("dictionaryTypeToastUpdateError"), {
          404: t("dictionaryTypeToastUpdateNotFound"),
        })
      )
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDeleteDictionaryType = async () => {
    if (!deleteTarget) {
      return
    }

    if (deleteTarget.count > 0) {
      toast.error(t("dictionaryTypeToastDeleteConflict"))
      return
    }

    const dictType = deleteTarget.dict_type

    setDeleteSubmitting(true)

    try {
      await api.deleteDictionaryType(dictType)
      toast.success(t("dictionaryTypeToastDeleteSuccess"))
      setDeleteTarget(null)

      const latestTypes = await fetchDictionaryTypes(true)
      const targetType =
        selectedType === dictType
          ? latestTypes[0]?.dict_type || ""
          : latestTypes.some((item) => item.dict_type === selectedType)
            ? selectedType
            : latestTypes[0]?.dict_type || ""

      setSelectedType(targetType)
    } catch (error) {
      toast.error(
        getStatusAwareMessage(error, t("dictionaryTypeToastDeleteError"), {
          404: t("dictionaryTypeToastDeleteNotFound"),
          409: t("dictionaryTypeToastDeleteConflict"),
        })
      )
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 px-8 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("dictionaryTypeTableTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("dictionaryTypeTableDescription")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("dictionaryButtonRefresh")}
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t("dictionaryButtonCreateType")}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <FilterToolbar
            className="gap-4 xl:grid-cols-3"
            search={{
              value: typeKeyword,
              onValueChange: setTypeKeyword,
              placeholder: t("dictionaryTypeSearchPlaceholder"),
              label: t("dictionaryTypeSearchPlaceholder"),
              inputClassName: "h-10",
            }}
          >
            <div className="space-y-2">
              <Label>{t("dictionaryTypeSortLabel")}</Label>
              <Select
                value={typeSortMode}
                onValueChange={(value) => setTypeSortMode(value as DictionaryTypeSortMode)}
              >
                <SelectTrigger className="h-10 w-full bg-background">
                  <SelectValue placeholder={t("dictionaryTypeSortLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count_desc">{t("dictionaryTypeSortCountDesc")}</SelectItem>
                  <SelectItem value="count_asc">{t("dictionaryTypeSortCountAsc")}</SelectItem>
                  <SelectItem value="label_asc">{t("dictionaryTypeSortLabelAsc")}</SelectItem>
                  <SelectItem value="type_asc">{t("dictionaryTypeSortTypeAsc")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="invisible">{t("dictionaryTypeTableStats", { visible: 0, total: 0 })}</Label>
              <div className="flex h-10 w-full items-center rounded-md border bg-background px-3">
                <p className="text-sm text-muted-foreground">
                  {t("dictionaryTypeTableStats", {
                    visible: filteredTypeSummaries.length,
                    total: typeSummaries.length,
                  })}
                </p>
              </div>
            </div>
          </FilterToolbar>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dictionaryTypeTableColType")}</TableHead>
                <TableHead>{t("dictionaryTypeTableColCount")}</TableHead>
                <TableHead>{t("dictionaryTypeTableColCurrent")}</TableHead>
                <TableHead className="text-right">{t("dictionaryTableColActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTypes ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-14 text-muted-foreground">
                    {t("dictionaryLoading")}
                  </TableCell>
                </TableRow>
              ) : filteredTypeSummaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {t("dictionaryTypeTableEmpty")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTypeSummaries.map((typeSummary) => {
                  const isCurrent = selectedType === typeSummary.dict_type
                  const deleteDisabled = typeSummary.count > 0

                  return (
                    <TableRow
                      key={typeSummary.dict_type}
                      className={`cursor-pointer ${isCurrent ? "bg-muted/40" : ""}`}
                      onClick={() => setSelectedType(typeSummary.dict_type)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{typeSummary.dict_type_label}</p>
                          <p className="font-mono text-xs text-muted-foreground">{typeSummary.dict_type}</p>
                        </div>
                      </TableCell>
                      <TableCell>{typeSummary.count}</TableCell>
                      <TableCell>
                        {isCurrent ? <Badge variant="secondary">{t("dictionaryTypeCurrent")}</Badge> : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(event) => {
                              event.stopPropagation()
                              openEditDialog(typeSummary)
                            }}
                            title={t("dictionaryTypeActionEdit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={(event) => {
                              event.stopPropagation()
                              setDeleteTarget(typeSummary)
                            }}
                            disabled={deleteDisabled}
                            title={
                              deleteDisabled
                                ? t("dictionaryTypeDeleteDisabledWithItems", { count: typeSummary.count })
                                : t("dictionaryTypeActionDelete")
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
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
            setCreateForm(getInitialDictionaryTypeForm())
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("dictionaryTypeCreateDialogTitle")}</DialogTitle>
            <DialogDescription>{t("dictionaryTypeCreateDialogDescription")}</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateDictionaryType}>
            <DictionaryTypeFormFields
              form={createForm}
              setForm={setCreateForm}
              idPrefix="dictionary-type-create"
              labels={{
                type: t("dictionaryFieldType"),
                typeLabel: t("dictionaryTypeFieldLabel"),
                sortOrder: t("dictionaryFieldSortOrder"),
                description: t("dictionaryFieldDescription"),
              }}
              typePlaceholder="channel_type"
              sortPlaceholder="0"
            />

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
            setEditingType(null)
            setEditForm(getInitialDictionaryTypeForm())
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("dictionaryTypeEditDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("dictionaryTypeEditDialogDescription", { type: editForm.dictType || "-" })}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleUpdateDictionaryType}>
            <DictionaryTypeFormFields
              form={editForm}
              setForm={setEditForm}
              idPrefix="dictionary-type-edit"
              labels={{
                type: t("dictionaryFieldType"),
                typeLabel: t("dictionaryTypeFieldLabel"),
                sortOrder: t("dictionaryFieldSortOrder"),
                description: t("dictionaryFieldDescription"),
              }}
              typeReadOnly
              sortPlaceholder={t("dictionaryTypeEditSortHint")}
              descriptionPlaceholder={t("dictionaryTypeEditDescriptionHint")}
            />

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
            <AlertDialogTitle>{t("dictionaryTypeDeleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dictionaryTypeDeleteDialogDescription", {
                type: deleteTarget
                  ? `${deleteTarget.dict_type_label} (${deleteTarget.dict_type})`
                  : "-",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>
              {t("dictionaryDialogCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDictionaryType}
              disabled={deleteSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("dictionaryTypeDeleteDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
