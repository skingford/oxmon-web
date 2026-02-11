"use client"

import { useEffect, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import { ChannelOverview } from "@/types/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Mail, Bell, Webhook, Plus, Trash2, Edit2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export default function NotificationsPage() {
  const [channels, setChannels] = useState<ChannelOverview[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChannels = async () => {
    try {
      const response = await api.listChannels({ limit: 100 })
      setChannels(response)
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, "Failed to load notification channels"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  const getChannelIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "email": return <Mail className="h-4 w-4" />
      case "webhook": return <Webhook className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Manage your notification channels and recipients.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Channel
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
            <CardDescription>
              Configure where and how you receive alerts based on severity levels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Min Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell className="font-medium">
                      <div>
                        {channel.name}
                        {channel.description && (
                          <p className="text-xs text-muted-foreground font-normal">{channel.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getChannelIcon(channel.channel_type)}
                        <span className="capitalize">{channel.channel_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {channel.min_severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={channel.enabled} />
                        {channel.enabled ? (
                          <span className="text-xs text-green-500 font-medium">Enabled</span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">Disabled</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {channel.recipients.map((r, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                            {r}
                          </Badge>
                        ))}
                        {channel.recipients.length === 0 && (
                          <span className="text-xs text-muted-foregrounditalic">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {channels.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No notification channels configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
