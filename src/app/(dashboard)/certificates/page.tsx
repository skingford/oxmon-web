"use client"

import { useEffect, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import { CertificateDetails } from "@/types/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, ShieldCheck, ShieldAlert, ExternalLink, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function CertificatesPage() {
  const [certs, setCerts] = useState<CertificateDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchCerts = async () => {
    try {
      const response = await api.getCertificates({ limit: 100 })
      setCerts(response)
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, "Failed to load certificates"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCerts()
  }, [])

  const filteredCerts = certs.filter(cert => 
    cert.domain.toLowerCase().includes(search.toLowerCase()) ||
    cert.issuer_cn?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (cert: CertificateDetails) => {
    if (!cert.chain_valid) {
      return <Badge variant="destructive">Invalid Chain</Badge>
    }
    
    const expiry = new Date(cert.not_after)
    const now = new Date()
    const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24))
    
    if (daysToExpiry < 0) {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (daysToExpiry < 15) {
      return <Badge variant="warning">Expiring in {daysToExpiry}d</Badge>
    }
    return <Badge variant="success">Valid ({daysToExpiry}d)</Badge>
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Certificates Monitoring</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monitored Domains</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search domains..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issuer</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCerts.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {cert.chain_valid ? (
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                      )}
                      {cert.domain}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(cert)}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={cert.issuer_cn || ""}>
                    {cert.issuer_cn || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {new Date(cert.not_after).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(cert.last_checked).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`https://${cert.domain}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCerts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No certificates found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
