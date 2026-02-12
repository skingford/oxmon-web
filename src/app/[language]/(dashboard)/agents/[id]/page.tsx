"use client";

import { useEffect, useState, use } from "react";
import { api } from "@/lib/api";
import { LatestMetric } from "@/types/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, RefreshCw, Activity, Clock, Database, Tag, ShieldCheck, Server } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { withLocalePrefix } from "@/components/app-locale";
import { useAppLocale } from "@/hooks/use-app-locale";
import { Badge } from "@/components/ui/badge";

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use() or await in async component
  // Since this is a client component, we use the useParams hook or unwrap the promise
  // safely. Next.js 15+ convention for params is async props, but useParams is safer for client components
  // if we don't want to make the component async.
  // Actually, for client components in Next 15, `params` prop is a Promise.
  // Let's use `useParams` for simplicity in client component.
  
  const { id } = use(params);
  const locale = useAppLocale();
  
  const [metrics, setMetrics] = useState<LatestMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      const data = await api.getAgentLatestMetrics(id, token);
      setMetrics(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [id]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild className="glass hover:bg-primary/10 hover:text-primary transition-all active:scale-95">
            <Link href={withLocalePrefix("/agents", locale)}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-5 w-5 text-primary" />
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest glass border-white/5 bg-white/5">Compute Node</Badge>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-gradient">Agent: {id}</h2>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> Real-time telemetry and state synchronization.
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchMetrics} 
          disabled={loading}
          className="glass h-11 px-6 gap-2 shadow-lg shadow-black/5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Synchronize Data
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-96 gap-4"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium animate-pulse">Establishing secure handshake...</p>
          </motion.div>
        ) : metrics.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center h-96 flex flex-col items-center justify-center gap-4 bg-muted/20 rounded-3xl border border-dashed border-white/10"
          >
            <Activity className="h-12 w-12 text-muted-foreground/20" />
            <div className="space-y-1">
              <p className="text-xl font-bold tracking-tight">Telemetry Void</p>
              <p className="text-muted-foreground text-sm">No performance metrics found for this node.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            variants={containerVariants}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {metrics.map((metric, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="glass-card border-none shadow-xl group overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <Activity size={80} />
                  </div>
                  <CardHeader className="pb-2">
                     <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2 mb-1">
                        <Activity className="h-3 w-3 text-primary" /> Metric Shard
                     </span>
                    <CardTitle className="text-lg font-bold tracking-tight">
                      {metric.metric_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-2">
                       <span className="text-4xl font-black tracking-tighter text-primary">{metric.value}</span>
                       <span className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Value</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-y border-white/5">
                       <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(metric.timestamp).toLocaleTimeString()}
                       </div>
                       <Badge variant="outline" className="text-[9px] glass border-emerald-500/20 text-emerald-500">Normal</Badge>
                    </div>

                    {metric.labels && Object.keys(metric.labels).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(metric.labels).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-1 glass px-2 py-0.5 rounded-md border-white/5">
                            <Tag className="h-2.5 w-2.5 text-primary/70" />
                            <span className="text-[10px] font-mono text-muted-foreground">{k}:{v}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2">
                      <Button variant="ghost" size="sm" asChild className="w-full text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 transition-all">
                        <Link href={`${withLocalePrefix("/metrics", locale)}?agent_id=${encodeURIComponent(id)}&metric_name=${encodeURIComponent(metric.metric_name)}`}>
                          Explore History
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
