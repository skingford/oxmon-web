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
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use() or await in async component
  // Since this is a client component, we use the useParams hook or unwrap the promise
  // safely. Next.js 15+ convention for params is async props, but useParams is safer for client components
  // if we don't want to make the component async.
  // Actually, for client components in Next 15, `params` prop is a Promise.
  // Let's use `useParams` for simplicity in client component.
  
  const { id } = use(params);
  
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

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Agent: {id}</h2>
            <p className="text-muted-foreground">
              Latest metrics from this agent.
            </p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={fetchMetrics}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center h-64 items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : metrics.length === 0 ? (
        <div className="text-center text-muted-foreground h-64 flex items-center justify-center">
          No metrics available.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.metric_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  {new Date(metric.timestamp).toLocaleString()}
                </p>
                {metric.labels && Object.keys(metric.labels).length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {Object.entries(metric.labels).map(([k, v]) => (
                      <span key={k} className="mr-2 px-1 bg-secondary rounded">
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
