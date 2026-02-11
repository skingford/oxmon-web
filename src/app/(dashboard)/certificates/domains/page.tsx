"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Globe, Trash2, Shield, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Since there's no specific API for domain management in the snippets (only list_certificates),
// I'll implement a mock-up for domain management as planned in the PRD/Implementation plan.
// In a real scenario, we'd add addDomain/deleteDomain to api.ts.

export default function DomainsPage() {
  const [loading, setLoading] = useState(false)
  const [newDomain, setNewDomain] = useState("")

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomain) return
    
    setLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800))
      toast.success(`Domain ${newDomain} added for monitoring`)
      setNewDomain("")
    } catch (error) {
      toast.error("Failed to add domain")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domains Management</h1>
          <p className="text-muted-foreground">Add or remove domains for automated SSL monitoring.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add New Domain</CardTitle>
            <CardDescription>Enter a domain name to start monitoring its certificate.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDomain} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain Name</Label>
                <div className="flex gap-2">
                  <Input 
                    id="domain" 
                    placeholder="example.com" 
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Monitoring Policy</CardTitle>
            </div>
            <CardDescription>How certificates are checked.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              The system automatically checks certificates for all added domains every 24 hours.
            </p>
            <ul className="list-disc pl-4 space-y-2">
              <li>Automatic discovery of subject alternative names (SAN).</li>
              <li>Verification of full certificate chain.</li>
              <li>Alerts are sent 15 days before expiry by default.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Domains</CardTitle>
          <CardDescription>Currently monitored external domains.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md divide-y">
            {[ "google.com", "github.com", "microsoft.com" ].map((domain) => (
              <div key={domain} className="flex items-center justify-between p-4 bg-muted/30">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{domain}</span>
                </div>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
