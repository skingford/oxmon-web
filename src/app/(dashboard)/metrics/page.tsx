"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  Activity, 
  Filter, 
  Server, 
  Database,
  BarChart3,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  LineChart as LineChartIcon,
  Table as TableIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { api, getApiErrorMessage } from "@/lib/api"
import { MetricDataPointResponse, MetricSummaryResponse } from "@/types/api"
import { toast } from "sonner"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useSearchParams } from "next/navigation"

export default function MetricsPage() {
  const searchParams = useSearchParams()
  const [agents, setAgents] = useState<string[]>([])
  const [metricNames, setMetricNames] = useState<string[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>(searchParams.get("agent_id") || "")
  const [selectedMetric, setSelectedMetric] = useState<string>(searchParams.get("metric_name") || "")
  const [dataPoints, setDataPoints] = useState<MetricDataPointResponse[]>([])
  const [summary, setSummary] = useState<MetricSummaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingOptions, setFetchingOptions] = useState(true)

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [agentList, metricList] = await Promise.all([
          api.getMetricAgents(),
          api.getMetricNames()
        ])
        setAgents(agentList)
        setMetricNames(metricList)
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to load filter options"))
      } finally {
        setFetchingOptions(false)
      }
    }
    loadOptions()
  }, [])

  useEffect(() => {
    if (!fetchingOptions && selectedAgent && selectedMetric) {
      handleQuery()
    }
  }, [fetchingOptions, selectedAgent, selectedMetric])

  const handleQuery = async () => {
    if (!selectedAgent || !selectedMetric) {
      toast.error("Please select an agent and a metric")
      return
    }

    setLoading(true)
    try {
      const [points, stats] = await Promise.all([
        api.queryAllMetrics({ 
          agent_id__eq: selectedAgent, 
          metric_name__eq: selectedMetric,
          limit: 100 
        }),
        api.getMetricSummary({ 
          agent_id: selectedAgent, 
          metric_name: selectedMetric 
        })
      ])
      setDataPoints(points)
      setSummary(stats)
      toast.success(`Found ${points.length} data points`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Query failed"))
    } finally {
      setLoading(false)
    }
  }

  const chartData = dataPoints
    .map(p => ({
      time: new Date(p.created_at).toLocaleTimeString(),
      value: p.value,
      fullTime: new Date(p.created_at).toLocaleString()
    }))
    .reverse()

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8"
    >
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gradient">Metrics Explorer</h1>
        <p className="text-muted-foreground mt-1 text-sm">Deep dive into raw performance metrics and telemetry data.</p>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="glass overflow-hidden border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Dataset Filters
            </CardTitle>
            <CardDescription>Select a target agent and metric to begin exploration.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2 text-[13px] font-medium text-muted-foreground">
                <label className="flex items-center gap-2">
                  <Server className="h-3.5 w-3.5" /> Agent ID
                </label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="glass-card h-11 border-white/5 transition-all focus:ring-primary/50">
                    <SelectValue placeholder="Select Agent" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10">
                    {agents.map(id => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-[13px] font-medium text-muted-foreground">
                <label className="flex items-center gap-2">
                  <Database className="h-3.5 w-3.5" /> Metric Name
                </label>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="glass-card h-11 border-white/5 transition-all focus:ring-primary/50">
                    <SelectValue placeholder="Select Metric" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10">
                    {metricNames.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleQuery} 
                disabled={loading || fetchingOptions}
                className="h-11 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 active:scale-95 bg-primary hover:bg-primary/90 text-white"
              >
                {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Explore Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {summary && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Minimum", value: summary.min.toFixed(2), icon: TrendingDown, color: "text-blue-500" },
            { label: "Maximum", value: summary.max.toFixed(2), icon: TrendingUp, color: "text-red-500" },
            { label: "Average", value: summary.avg.toFixed(2), icon: Activity, color: "text-green-500" },
            { label: "Points", value: summary.count, icon: BarChart3, color: "text-purple-500" }
          ].map((stat, i) => (
            <Card key={i} className="glass border-white/5 p-4 relative group overflow-hidden">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                  <stat.icon className={`h-3 w-3 ${stat.color}`} />
                  {stat.label}
                </span>
                <span className="text-xl font-bold tracking-tight">{stat.value}</span>
              </div>
              <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <stat.icon size={64} />
              </div>
            </Card>
          ))}
        </motion.div>
      )}

      {dataPoints.length > 0 ? (
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="visual" className="w-full space-y-6">
            <TabsList className="glass p-1 h-12">
              <TabsTrigger value="visual" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full">
                <LineChartIcon className="h-4 w-4" /> Visual Explorer
              </TabsTrigger>
              <TabsTrigger value="raw" className="flex items-center gap-2 px-6 data-[state=active]:glass h-full">
                <TableIcon className="h-4 w-4" /> Raw Data Table
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="focus-visible:outline-none focus-visible:ring-0">
              <Card className="glass border-white/10 p-6 overflow-hidden">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(var(--border), 0.3)" />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} 
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="glass p-3 border-white/10 rounded-lg shadow-xl">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">{payload[0].payload.fullTime}</p>
                                <p className="text-lg font-bold text-primary">{payload[0].value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="var(--color-primary)" 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        strokeWidth={3}
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="raw" className="focus-visible:outline-none focus-visible:ring-0">
              <Card className="glass border-white/10 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Labels</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {dataPoints.map((point, i) => (
                        <motion.tr 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.01 }}
                          className="group border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <TableCell className="text-sm font-medium">
                            {new Date(point.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono glass border-primary/20 text-primary">
                              {point.value}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(point.labels || {}).map(([k, v]) => (
                                <span key={k} className="text-[10px] bg-muted px-2 py-0.5 rounded-full border border-white/5 text-muted-foreground">
                                  {k}:{v}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      ) : (
        !loading && !fetchingOptions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center space-y-4"
          >
            <div className="p-6 rounded-full glass border-white/5 bg-white/5">
              <LineChartIcon size={48} className="text-muted-foreground/30" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">No Data Visualized</h3>
              <p className="text-muted-foreground max-w-[400px]">Use the filters above to query historical metric data and view trends over time.</p>
            </div>
          </motion.div>
        )
      )}
    </motion.div>
  )
}
