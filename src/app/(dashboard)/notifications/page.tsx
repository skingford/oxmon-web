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
import { Loader2, Mail, Bell, Webhook, Plus, Trash2, Edit2, Share2, Radio, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion"

export default function NotificationsPage() {
  const [channels, setChannels] = useState<ChannelOverview[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChannels = async () => {
    setLoading(true)
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
      case "slack": return <Share2 className="h-4 w-4" />
      case "sms": return <Smartphone className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gradient">Notification Control</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Delegate infrastructure alerts to your preferred communication channels.
          </p>
        </div>
        <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 h-11 px-6">
          <Plus className="h-4 w-4 mr-2" />
          Add Endpoint
        </Button>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Radio className="h-5 w-5" />
             </div>
             <div>
                <CardTitle>Broadcast Terminals</CardTitle>
                <CardDescription>
                  Configure automated dispatch rules for incident escalation.
                </CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="py-4">Endpoint Name</TableHead>
                  <TableHead>Dispatch Type</TableHead>
                  <TableHead>Filter Severity</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Target Recipients</TableHead>
                  <TableHead className="text-right">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center text-primary">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : channels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic font-medium">
                        No broadcast endpoints configured.
                      </TableCell>
                    </TableRow>
                  ) : (
                    channels.map((channel, i) => (
                      <motion.tr 
                        key={channel.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="group hover:bg-muted/30 transition-colors border-b last:border-0"
                      >
                        <TableCell className="py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight">{channel.name}</span>
                            {channel.description && (
                              <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">{channel.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 group-hover:text-primary transition-colors">
                            <div className="p-1.5 glass rounded-md">
                               {getChannelIcon(channel.channel_type)}
                            </div>
                            <span className="capitalize text-xs font-bold tracking-tight">{channel.channel_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`capitalize text-[10px] px-2 h-5 ${
                             channel.min_severity === 'critical' ? 'border-red-500/50 text-red-500' :
                             channel.min_severity === 'warning' ? 'border-amber-500/50 text-amber-500' :
                             'border-blue-500/50 text-blue-500'
                          }`}>
                            {channel.min_severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Switch checked={channel.enabled} className="data-[state=checked]:bg-emerald-500" />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${channel.enabled ? "text-emerald-500" : "text-muted-foreground"}`}>
                              {channel.enabled ? "Active" : "Standby"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {channel.recipients.map((r, i) => (
                              <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 glass border-white/5 font-mono text-muted-foreground whitespace-nowrap">
                                {r}
                              </Badge>
                            ))}
                            {channel.recipients.length === 0 && (
                              <span className="text-[10px] text-muted-foreground italic">Null pointers</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5 transition-all">
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/60 hover:text-red-600 hover:bg-red-500/10 transition-all">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
