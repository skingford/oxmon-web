"use client"

import { Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type CloudInstancesFiltersCardProps = {
  searchKeyword: string
  providerFilter: string
  regionFilter: string
  statusFilter: string
  providerOptions: string[]
  regionOptions: string[]
  statusOptions: string[]
  onSearchKeywordChange: (value: string) => void
  onProviderFilterChange: (value: string) => void
  onRegionFilterChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  getStatusLabel: (status: string) => string
  texts: {
    title: string
    description: string
    filterSearch: string
    filterSearchPlaceholder: string
    filterProvider: string
    filterProviderAll: string
    filterRegion: string
    filterRegionAll: string
    filterStatus: string
    filterStatusAll: string
  }
}

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
          <Select value={providerFilter} onValueChange={onProviderFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder={texts.filterProviderAll} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{texts.filterProviderAll}</SelectItem>
              {providerOptions.map((provider) => (
                <SelectItem key={provider} value={provider}>{provider}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 space-y-2">
          <Label>{texts.filterRegion}</Label>
          <Select value={regionFilter} onValueChange={onRegionFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder={texts.filterRegionAll} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{texts.filterRegionAll}</SelectItem>
              {regionOptions.map((region) => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 space-y-2">
          <Label>{texts.filterStatus}</Label>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder={texts.filterStatusAll} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{texts.filterStatusAll}</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>{getStatusLabel(status)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
  )
}
