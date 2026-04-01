import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bot, Link2, RefreshCw } from "lucide-react";

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

interface PolicyIntelAutomationStatus {
  aiSupport: {
    providersConfigured: Array<"openai" | "anthropic">;
    briefingProvider: "anthropic" | "template";
    transcriptionProvider: "openai" | "unavailable";
    enhancedBriefingEnabled: boolean;
  };
  automation: {
    intelBriefing: {
      running: boolean;
      lastRun: {
        status: "success" | "error";
        finishedAt: string;
      } | null;
    };
    manualTriggerCooldownMs: number;
  };
}

interface PolicyIntelAutomationTriggerResult {
  triggered: boolean;
  message?: string;
}

export function PolicyIntelBridgeWidget({ className = "", dark = false, compact = true }: PolicyIntelBridgeWidgetProps) {
  const queryClient = useQueryClient();
  const [automationMessage, setAutomationMessage] = useState<string>("");

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

  const {
    data: automation,
    isLoading: automationLoading,
    refetch: refetchAutomation,
  } = useQuery<PolicyIntelAutomationStatus>({
    queryKey: ["/api/integrations/policy-intel/automation/status"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/policy-intel/automation/status", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Automation status request failed (${res.status})`);
      }
      return res.json();
    },
    retry: 0,
    refetchInterval: 60_000,
  });

  const triggerAutomation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/integrations/policy-intel/automation/intel-briefing/run", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const body = (await res.json()) as PolicyIntelAutomationTriggerResult;
      if (!res.ok && res.status !== 429) {
        throw new Error(body.message || `Automation trigger failed (${res.status})`);
      }
      return body;
    },
    onSuccess: (result) => {
      setAutomationMessage(result.triggered ? "Intel briefing automation started." : result.message || "Trigger skipped.");
      void queryClient.invalidateQueries({ queryKey: ["/api/integrations/policy-intel/status"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/integrations/policy-intel/automation/status"] });
    },
    onError: (error: any) => {
      setAutomationMessage(error?.message || "Automation trigger failed");
    },
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
              refetchAutomation();
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

            <div className="rounded-md p-2 bg-black/5">
              <div className={dark ? "text-gray-300 text-xs" : "text-gray-600 text-xs"}>AI Briefing</div>
              <div className="font-semibold uppercase">
                {automation?.aiSupport?.briefingProvider || (automationLoading ? "loading" : "template")}
              </div>
            </div>

            <div className="rounded-md p-2 bg-black/5">
              <div className={dark ? "text-gray-300 text-xs" : "text-gray-600 text-xs"}>Auto Run</div>
              <div className="font-semibold">
                {automation?.automation?.intelBriefing?.running
                  ? "running"
                  : automation?.automation?.intelBriefing?.lastRun?.status || "idle"}
              </div>
            </div>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between gap-3">
            <div className={`text-xs ${dark ? "text-gray-300" : "text-gray-600"}`}>
              {automation?.aiSupport?.enhancedBriefingEnabled
                ? "Enhanced AI briefing is enabled"
                : "Template fallback active (no Anthropic key)"}
            </div>
            <Button
              size="sm"
              variant="outline"
              className={dark ? "border-gray-600 hover:bg-gray-700" : ""}
              onClick={() => triggerAutomation.mutate()}
              disabled={triggerAutomation.isPending || automation?.automation?.intelBriefing?.running}
            >
              <Bot className={`w-4 h-4 mr-2 ${triggerAutomation.isPending ? "animate-pulse" : ""}`} />
              Run Intel Automation
            </Button>
          </div>
        )}

        {automationMessage && !isLoading && !isError && (
          <div className={`mt-2 text-xs ${dark ? "text-gray-300" : "text-gray-600"}`}>{automationMessage}</div>
        )}
      </CardContent>
    </Card>
  );
}
