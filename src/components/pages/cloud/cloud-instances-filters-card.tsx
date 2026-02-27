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

type CloudInstancesFiltersCardProps = {
  searchKeyword: string;
  providerFilter: string;
  regionFilter: string;
  statusFilter: string;
  providerOptions: string[];
  regionOptions: string[];
  statusOptions: string[];
  onSearchKeywordChange: (value: string) => void;
  onProviderFilterChange: (value: string) => void;
  onRegionFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  getStatusLabel: (status: string) => string;
  texts: {
    title: string;
    description: string;
    filterSearch: string;
    filterSearchPlaceholder: string;
    filterProvider: string;
    filterProviderAll: string;
    filterRegion: string;
    filterRegionAll: string;
    filterStatus: string;
    filterStatusAll: string;
  };
};

export function CloudInstancesFiltersCard({
  searchKeyword,
  providerFilter,
  regionFilter,
  statusFilter,
  providerOptions,
  regionOptions,
  statusOptions,
  onSearchKeywordChange,
  onProviderFilterChange,
  onRegionFilterChange,
  onStatusFilterChange,
  getStatusLabel,
  texts,
}: CloudInstancesFiltersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{texts.title}</CardTitle>
        <CardDescription>{texts.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 space-y-2">
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

        <div className="min-w-0 space-y-2">
          <Label>{texts.filterRegion}</Label>
          <SearchableCombobox
            value={regionFilter}
            options={[
              { value: "all", label: texts.filterRegionAll },
              ...regionOptions.map((region) => ({
                value: region,
                label: region,
              })),
            ]}
            onValueChange={onRegionFilterChange}
            placeholder={texts.filterRegionAll}
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label>{texts.filterStatus}</Label>
          <SearchableCombobox
            value={statusFilter}
            options={[
              { value: "all", label: texts.filterStatusAll },
              ...statusOptions.map((status) => ({
                value: status,
                label: getStatusLabel(status),
              })),
            ]}
            onValueChange={onStatusFilterChange}
            placeholder={texts.filterStatusAll}
          />
        </div>

        <div className="min-w-0 space-y-2">
          <Label htmlFor="cloud-instance-search">{texts.filterSearch}</Label>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="cloud-instance-search"
              className="pl-9"
              value={searchKeyword}
              onChange={(event) => onSearchKeywordChange(event.target.value)}
              placeholder={texts.filterSearchPlaceholder}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
