"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type SearchableComboboxOption = {
  value: string;
  label: string;
  subtitle?: string;
};

type SearchableComboboxProps = {
  inputId?: string;
  value: string;
  options: SearchableComboboxOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  inputClassName?: string;
  panelClassName?: string;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  clearSearchOnClose?: boolean;
  clearSearchOnSelect?: boolean;
  disableClientFilter?: boolean;
};

function highlightLabel(text: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return text;

  const lower = text.toLowerCase();
  const start = lower.indexOf(normalizedQuery);
  if (start < 0) return text;

  const end = start + normalizedQuery.length;
  return (
    <>
      {text.slice(0, start)}
      <span className="rounded bg-primary/15 px-0.5 text-foreground">
        {text.slice(start, end)}
      </span>
      {text.slice(end)}
    </>
  );
}

export function SearchableCombobox({
  inputId,
  value,
  options,
  onValueChange,
  placeholder,
  emptyText = "No options",
  disabled,
  maxLength = 120,
  className,
  inputClassName,
  panelClassName,
  searchValue,
  onSearchValueChange,
  clearSearchOnClose = false,
  clearSearchOnSelect = false,
  disableClientFilter = false,
}: SearchableComboboxProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [innerSearch, setInnerSearch] = useState("");

  const currentSearchValue =
    searchValue !== undefined ? searchValue : innerSearch;

  const selectedOption = useMemo(
    () => options.find((item) => item.value === value) || null,
    [options, value],
  );

  const inputDisplayValue = open
    ? currentSearchValue
    : selectedOption?.label || value || "";

  const setSearchValue = (next: string) => {
    if (onSearchValueChange) {
      onSearchValueChange(next);
      return;
    }
    setInnerSearch(next);
  };

  const filteredOptions = useMemo(() => {
    if (disableClientFilter) {
      return options;
    }

    const keyword = currentSearchValue.trim().toLowerCase();
    if (!keyword) {
      return options;
    }

    return options.filter((item) => {
      const label = item.label.toLowerCase();
      const valueText = item.value.toLowerCase();
      const subtitle = (item.subtitle || "").toLowerCase();
      return (
        label.includes(keyword) ||
        valueText.includes(keyword) ||
        subtitle.includes(keyword)
      );
    });
  }, [currentSearchValue, disableClientFilter, options]);

  useEffect(() => {
    if (!open) {
      if (clearSearchOnClose && currentSearchValue) {
        setSearchValue("");
      }
      return;
    }

    const handlePointerDownOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    window.addEventListener("mousedown", handlePointerDownOutside);
    return () => {
      window.removeEventListener("mousedown", handlePointerDownOutside);
    };
  }, [clearSearchOnClose, currentSearchValue, open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [currentSearchValue, options.length]);

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <Input
        id={inputId}
        value={inputDisplayValue}
        onChange={(event) => {
          setSearchValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        placeholder={placeholder}
        className={cn("h-10", inputClassName)}
        disabled={disabled}
        maxLength={maxLength}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((prev) =>
              Math.min(prev + 1, Math.max(filteredOptions.length - 1, 0)),
            );
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
            return;
          }

          if (event.key === "Enter") {
            event.preventDefault();
            const target = filteredOptions[activeIndex] ?? filteredOptions[0];
            if (!target) return;

            onValueChange(target.value);
            if (clearSearchOnSelect) {
              setSearchValue("");
            }
            setOpen(false);
            return;
          }

          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      />

      {open ? (
        <div
          className={cn(
            "absolute top-[calc(100%+4px)] z-[1000] w-full rounded-md border border-border/80 bg-popover shadow-xl",
            panelClassName,
          )}
        >
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "w-full rounded-sm px-2 py-1.5 text-left text-sm",
                    index === activeIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50",
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    onValueChange(option.value);
                    if (clearSearchOnSelect) {
                      setSearchValue("");
                    }
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span>
                      {highlightLabel(option.label, currentSearchValue)}
                    </span>
                    {option.subtitle ? (
                      <span className="text-xs text-muted-foreground">
                        {highlightLabel(option.subtitle, currentSearchValue)}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
