"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  Search, 
  Trash2, 
  Clock, 
  ShieldOff, 
  Calendar as CalendarIcon, 
  Filter, 
  RefreshCw,
  MoreHorizontal,
  AlertTriangle,
  Server,
  Database
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { api, getApiErrorMessage } from "@/lib/api"
import { SilenceWindow } from "@/types/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
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
import { Badge } from "@/components/ui/badge"

export default function SilenceWindowsPage() {
  const [windows, setWindows] = useState<SilenceWindow[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newWindow, setNewWindow] = useState({
    name: "",
    agent_pattern: "*",
    metric_pattern: "*",
    start_time: "",
    end_time: ""
  })

  useEffect(() => {
    fetchWindows()
  }, [])

  const fetchWindows = async () => {
    try {
      const data = await api.listSilenceWindows({ limit: 100 })
      setWindows(data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load silence windows"))
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newWindow.name || !newWindow.start_time || !newWindow.end_time) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      // API expectation for timestamps might vary, ensuring ISO strings
      const payload = {
        ...newWindow,
        start_time: new Date(newWindow.start_time).toISOString(),
        end_time: new Date(newWindow.end_time).toISOString()
      }
      await api.createSilenceWindow(payload)
      toast.success("Silence window created successfully")
      setIsDialogOpen(false)
      fetchWindows()
      setNewWindow({
        name: "",
        agent_pattern: "*",
        metric_pattern: "*",
        start_time: "",
        end_time: ""
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create silence window"))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this silence window?")) return

    try {
      await api.deleteSilenceWindow(id)
      toast.success("Silence window deleted")
      fetchWindows()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Delete failed"))
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  const isActive = (win: SilenceWindow) => {
    const now = new Date()
    return now >= new Date(win.start_time) && now <= new Date(win.end_time)
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient">Silence Windows</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create maintenance windows to temporarily suppress alerts for specific agents or metrics.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 active:scale-95">
              <Plus className="mr-2 h-4 w-4" /> Create Window
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card !border-white/10 sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Silence Window</DialogTitle>
              <DialogDescription>Define suppress rules and duration for this maintenance window.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Window Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Scheduled DB Maintenance" 
                  value={newWindow.name}
                  onChange={e => setNewWindow({...newWindow, name: e.target.value})}
                  className="glass-card border-white/5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent_pattern">Agent Pattern</Label>
                  <Input 
                    id="agent_pattern" 
                    placeholder="*" 
                    value={newWindow.agent_pattern}
                    onChange={e => setNewWindow({...newWindow, agent_pattern: e.target.value})}
                    className="glass-card border-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metric_pattern">Metric Pattern</Label>
                  <Input 
                    id="metric_pattern" 
                    placeholder="*" 
                    value={newWindow.metric_pattern}
                    onChange={e => setNewWindow({...newWindow, metric_pattern: e.target.value})}
                    className="glass-card border-white/5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input 
                    id="start_time" 
                    type="datetime-local" 
                    value={newWindow.start_time}
                    onChange={e => setNewWindow({...newWindow, start_time: e.target.value})}
                    className="glass-card border-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input 
                    id="end_time" 
                    type="datetime-local" 
                    value={newWindow.end_time}
                    onChange={e => setNewWindow({...newWindow, end_time: e.target.value})}
                    className="glass-card border-white/5"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">Create Schedule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="glass border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-[250px]">Window Name</TableHead>
                <TableHead>Targets</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5 animate-pulse">
                    <TableCell colSpan={5} className="h-16 bg-white/5" />
                  </TableRow>
                ))
              ) : windows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldOff className="h-8 w-8 opacity-20" />
                      <p>No active or scheduled silence windows found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence mode="popLayout">
                  {windows.map((win) => (
                    <motion.tr 
                      key={win.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="group border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="font-semibold">
                        <div className="flex flex-col">
                          <span>{win.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">{win.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="glass border-blue-500/20 text-blue-400 gap-1.5 font-mono text-[10px]">
                            <Server className="h-3 w-3" /> {win.agent_pattern}
                          </Badge>
                          <Badge variant="outline" className="glass border-purple-500/20 text-purple-400 gap-1.5 font-mono text-[10px]">
                            <Database className="h-3 w-3" /> {win.metric_pattern}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> {new Date(win.start_time).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-px bg-muted-foreground/30 ml-1.5" /> 
                            {new Date(win.end_time).toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isActive(win) ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/20 animate-pulse-slow">
                            Active Suppressing
                          </Badge>
                        ) : new Date(win.start_time) > new Date() ? (
                          <Badge variant="outline" className="text-amber-400 border-amber-500/20">
                            Scheduled
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground border-white/5">
                            Expired
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(win.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>
    </motion.div>
  )
}
