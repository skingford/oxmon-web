"use client"

import { useEffect, useState } from "react"
import { api, getApiErrorMessage } from "@/lib/api"
import { ChannelOverview, CreateChannelRequest } from "@/types/api"
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
import { 
  Loader2, 
  Mail, 
  Bell, 
  Webhook, 
  Plus, 
  Trash2, 
  Edit2, 
  Share2, 
  Radio, 
  Smartphone,
  Send,
  Users,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function NotificationsPage() {
  const [channels, setChannels] = useState<ChannelOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null)
  const [channelForm, setChannelForm] = useState<CreateChannelRequest>({
    name: "",
    channel_type: "email",
    description: "",
    min_severity: "info",
    enabled: true,
    config_json: "{}",
    recipients: []
  })

  const fetchChannels = async () => {
    setLoading(true)
    try {
      const response = await api.listChannels({ limit: 100 })
      setChannels(response)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load notification channels"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  const handleTestChannel = async (id: string) => {
    setTestingId(id)
    try {
      await api.testChannel(id)
      toast.success("Test notification sent successfully")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Test notification failed"))
    } finally {
      setTestingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this channel?")) return
    try {
      await api.deleteChannelConfig(id)
      toast.success("Channel deleted")
      fetchChannels()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Delete failed"))
    }
  }

  const handleToggle = async (channel: ChannelOverview) => {
    try {
      await api.updateChannelConfig(channel.id, { ...channel, enabled: !channel.enabled })
      toast.success(`Channel ${!channel.enabled ? 'enabled' : 'disabled'}`)
      fetchChannels()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update channel status"))
    }
  }

  const handleOpenCreate = () => {
    setEditingChannelId(null)
    setChannelForm({
      name: "",
      channel_type: "email",
      description: "",
      min_severity: "info",
      enabled: true,
      config_json: "{}",
      recipients: []
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (channel: ChannelOverview) => {
    setEditingChannelId(channel.id)
    setChannelForm({
      name: channel.name,
      channel_type: channel.channel_type,
      description: channel.description || "",
      min_severity: channel.min_severity,
      enabled: channel.enabled,
      config_json: JSON.stringify((channel as any).config || {}, null, 2),
      recipients: channel.recipients
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingChannelId) {
        await api.updateChannelConfig(editingChannelId, channelForm)
        toast.success("Notification channel updated")
      } else {
        await api.createChannelConfig(channelForm)
        toast.success("Notification channel created")
      }
      setIsDialogOpen(false)
      fetchChannels()
    } catch (error) {
      toast.error(getApiErrorMessage(error, editingChannelId ? "Update failed" : "Create failed"))
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "email": return <Mail className="h-4 w-4" />
      case "webhook": return <Webhook className="h-4 w-4" />
      case "slack": return <Share2 className="h-4 w-4" />
      case "sms": return <Smartphone className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold tracking-tight">Active Channels</h2>
           <p className="text-muted-foreground text-sm">Manage where and how system alerts are delivered.</p>
        </div>
        <Button onClick={handleOpenCreate} className="h-10 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40">
          <Plus className="h-4 w-4 mr-2" /> New Endpoint
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="glass-card !border-white/10 sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingChannelId ? "Edit Endpoint" : "Configure Channel"}</DialogTitle>
              <DialogDescription>
                {editingChannelId ? "Update existing terminal parameters." : "Define a new communication terminal for incident routing."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Channel Name</Label>
                  <Input 
                    placeholder="e.g. SRE Email List" 
                    value={channelForm.name}
                    onChange={e => setChannelForm({...channelForm, name: e.target.value})}
                    className="glass-card border-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={channelForm.channel_type} onValueChange={v => setChannelForm({...channelForm, channel_type: v})}>
                    <SelectTrigger className="glass-card border-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Minimum Severity</Label>
                <Select value={channelForm.min_severity} onValueChange={v => setChannelForm({...channelForm, min_severity: v})}>
                  <SelectTrigger className="glass-card border-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="info">Info (All Alerts)</SelectItem>
                    <SelectItem value="warning">Warning & Above</SelectItem>
                    <SelectItem value="critical">Critical Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recipients (Comma separated)</Label>
                <Textarea 
                  placeholder="admin@example.com, tech@example.com"
                  value={channelForm.recipients?.join(", ")}
                  onChange={e => setChannelForm({...channelForm, recipients: e.target.value.split(",").map(r => r.trim()).filter(Boolean)})}
                  className="glass-card border-white/5 h-20"
                />
              </div>
              <div className="space-y-2">
                <Label>Configuration (JSON)</Label>
                <Textarea 
                  placeholder='{"url": "...", "method": "POST"}'
                  value={channelForm.config_json}
                  onChange={e => setChannelForm({...channelForm, config_json: e.target.value})}
                  className="glass-card border-white/5 font-mono text-xs h-24"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-white">
                {editingChannelId ? "Update Endpoint" : "Save Channel"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="py-4">Endpoint</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[200px]">Recipients</TableHead>
              <TableHead className="text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className="border-white/5 animate-pulse">
                  <TableCell colSpan={6} className="h-20 bg-white/5 rounded-lg m-2" />
                </TableRow>
              ))
            ) : channels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic">
                  No notification channels discovered in system registry.
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence mode="popLayout">
                {channels.map((channel, i) => (
                  <motion.tr 
                    key={channel.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group border-white/5 hover:bg-white/5 transition-all"
                  >
                    <TableCell className="py-5 font-bold">
                      <div className="flex flex-col">
                        <span>{channel.name}</span>
                        <span className="text-[10px] text-muted-foreground font-normal line-clamp-1">{channel.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 glass rounded-md border-white/5 text-primary">
                           {getChannelIcon(channel.channel_type)}
                        </div>
                        <span className="capitalize text-xs font-semibold">{channel.channel_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize text-[10px] px-2 h-5 tracking-wide ${
                         channel.min_severity === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                         channel.min_severity === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                         'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {channel.min_severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={channel.enabled} 
                          onCheckedChange={() => handleToggle(channel)}
                          className="data-[state=checked]:bg-emerald-500" 
                        />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${channel.enabled ? "text-emerald-500" : "text-muted-foreground opacity-50"}`}>
                          {channel.enabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {channel.recipients.slice(0, 2).map((r, i) => (
                          <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 glass border-white/5 font-mono text-muted-foreground whitespace-nowrap">
                            {r}
                          </Badge>
                        ))}
                        {channel.recipients.length > 2 && (
                          <span className="text-[9px] text-muted-foreground">+{channel.recipients.length - 2} more</span>
                        )}
                        {channel.recipients.length === 0 && (
                          <XCircle className="h-3 w-3 text-red-500/40" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1 items-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenEdit(channel)}
                          className="h-8 w-8 hover:bg-white/5"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleTestChannel(channel.id)}
                          disabled={testingId === channel.id || !channel.enabled}
                          className="h-8 w-8 hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                          title="Send test notification"
                        >
                          {testingId === channel.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(channel.id)}
                          className="h-8 w-8 text-red-500/60 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
