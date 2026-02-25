"use client"

import { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

type FilterToolbarSearchProps = {
  value: string
  onValueChange: (value: string) => void
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  placeholder: string
  label?: string
  fieldClassName?: string
  inputClassName?: string
  trailing?: ReactNode
  trailingWrapperClassName?: string
}

type FilterToolbarProps = {
  search: FilterToolbarSearchProps
  className?: string
  children?: ReactNode
}

export function FilterToolbar({ search, className, children }: FilterToolbarProps) {
  const hasLabel = Boolean(search.label)

  return (
    <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-4", className)}>
      <div className={cn(hasLabel ? "space-y-2" : undefined, search.fieldClassName)}>
        {hasLabel ? <Label>{search.label}</Label> : null}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search.value}
            onChange={(event) => search.onValueChange(event.target.value)}
            onKeyDown={search.onKeyDown}
            placeholder={search.placeholder}
            className={cn(
              hasLabel ? "h-10 pl-9" : "pl-9",
              search.trailing ? "pr-9" : undefined,
              search.inputClassName
            )}
          />
          {search.trailing ? (
            <div
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                search.trailingWrapperClassName
              )}
            >
              {search.trailing}
            </div>
          ) : null}
        </div>
      </div>

      {children}
    </div>
  )
}
