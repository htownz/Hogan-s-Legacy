import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Link2, RefreshCw } from "lucide-react";

interface PolicyIntelBridgeStatus {
  connected: boolean;
  checkedAt: string;
  latencyMs: number;
  tokenConfigured: boolean;
  forecastDrift?: {
    trend?: string;
    driftAlert?: boolean;
    latestAccuracy?: number | null;
  } | null;
  replay?: {
    status?: string;
  } | null;
  failures?: Array<{ call: string; error: string }>;
  cached?: boolean;
}

interface PolicyIntelBridgeWidgetProps {
  className?: string;
  dark?: boolean;
  compact?: boolean;
}

export function PolicyIntelBridgeWidget({ className = "", dark = false, compact = true }: PolicyIntelBridgeWidgetProps) {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<PolicyIntelBridgeStatus>({
    queryKey: ["/api/integrations/policy-intel/status"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/policy-intel/status", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Bridge request failed (${res.status})`);
      }
      return res.json();
    },
    retry: 0,
    refetchInterval: 60_000,
  });

  const cardClass = dark
    ? "bg-[#1e2334] border-gray-700 text-white"
    : "bg-white/80 backdrop-blur-sm border border-white/40";

  return (
    <Card className={`${cardClass} ${className}`}>
      <CardHeader className={compact ? "pb-3" : "pb-4"}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="w-4 h-4 text-cyan-500" />
              Policy Intel Bridge
            </CardTitle>
            <CardDescription className={dark ? "text-gray-300" : "text-gray-600"}>
              Main app integration status
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className={dark ? "border-gray-600 hover:bg-gray-700" : ""}
            onClick={() => {
              refetch();
            }}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className={dark ? "text-gray-300" : "text-gray-600"}>Checking connection...</div>
        ) : isError ? (
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            Integration bridge unavailable
          </div>
        ) : (
          <div className={compact ? "grid grid-cols-2 md:grid-cols-4 gap-3" : "grid grid-cols-2 gap-3"}>
            <div className="rounded-md p-2 bg-black/5">
              <div className={dark ? "text-gray-300 text-xs" : "text-gray-600 text-xs"}>Connection</div>
              <Badge className={data?.connected ? "bg-emerald-600" : "bg-rose-600"}>
                {data?.connected ? "Connected" : "Down"}
              </Badge>
            </div>
            <div className="rounded-md p-2 bg-black/5">
              <div className={dark ? "text-gray-300 text-xs" : "text-gray-600 text-xs"}>Latency</div>
              <div className="font-semibold">{data?.latencyMs ?? "-"} ms</div>
            </div>
            <div className="rounded-md p-2 bg-black/5">
              <div className={dark ? "text-gray-300 text-xs" : "text-gray-600 text-xs"}>Forecast</div>
              <div className="font-semibold uppercase">{data?.forecastDrift?.trend || "unknown"}</div>
            </div>
            <div className="rounded-md p-2 bg-black/5">
              <div className={dark ? "text-gray-300 text-xs" : "text-gray-600 text-xs"}>Replay</div>
              <div className="font-semibold">{data?.replay?.status || "none"}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
