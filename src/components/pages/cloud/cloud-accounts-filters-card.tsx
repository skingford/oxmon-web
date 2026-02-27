"use client";

import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";

type EnabledFilter = "all" | "enabled" | "disabled";

type CloudAccountsFiltersCardProps = {
  searchKeyword: string;
  providerFilter: string;
  enabledFilter: EnabledFilter;
  providerOptions: string[];
  onSearchKeywordChange: (value: string) => void;
  onProviderFilterChange: (value: string) => void;
  onEnabledFilterChange: (value: EnabledFilter) => void;
  texts: {
    title: string;
    description: string;
    filterSearch: string;
    filterSearchPlaceholder: string;
    filterProvider: string;
    filterProviderAll: string;
    filterStatus: string;
    filterStatusAll: string;
    filterStatusEnabled: string;
    filterStatusDisabled: string;
  };
};

export function CloudAccountsFiltersCard({
  searchKeyword,
  providerFilter,
  enabledFilter,
  providerOptions,
  onSearchKeywordChange,
  onProviderFilterChange,
  onEnabledFilterChange,
  texts,
}: CloudAccountsFiltersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{texts.title}</CardTitle>
        <CardDescription>{texts.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="cloud-account-search">{texts.filterSearch}</Label>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="cloud-account-search"
              className="pl-9"
              value={searchKeyword}
              onChange={(event) => onSearchKeywordChange(event.target.value)}
              placeholder={texts.filterSearchPlaceholder}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{texts.filterProvider}</Label>
          <SearchableCombobox
            value={providerFilter}
            options={[
              { value: "all", label: texts.filterProviderAll },
              ...providerOptions.map((provider) => ({
                value: provider,
                label: provider,
              })),
            ]}
            onValueChange={onProviderFilterChange}
            placeholder={texts.filterProviderAll}
          />
        </div>
        <div className="space-y-2">
          <Label>{texts.filterStatus}</Label>
          <SearchableCombobox
            value={enabledFilter}
            options={[
              { value: "all", label: texts.filterStatusAll },
              { value: "enabled", label: texts.filterStatusEnabled },
              { value: "disabled", label: texts.filterStatusDisabled },
            ]}
            onValueChange={(value) =>
              onEnabledFilterChange(value as EnabledFilter)
            }
            placeholder={texts.filterStatusAll}
          />
        </div>
      </CardContent>
    </Card>
  );
}
