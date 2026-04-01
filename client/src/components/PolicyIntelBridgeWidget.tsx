import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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

interface PolicyIntelAutomationEvents {
  events: Array<{
    eventId: string;
    jobName: string;
    status: "success" | "error";
    finishedAt: string;
    durationMs: number;
  }>;
}

export function PolicyIntelBridgeWidget({ className = "", dark = false, compact = true }: PolicyIntelBridgeWidgetProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [automationMessage, setAutomationMessage] = useState<string>("");
  const automationInitializedRef = useRef(false);
  const lastEventIdRef = useRef<string | null>(null);

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

  const {
    data: automationEvents,
    refetch: refetchAutomationEvents,
  } = useQuery<PolicyIntelAutomationEvents>({
    queryKey: ["/api/integrations/policy-intel/automation/events"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/policy-intel/automation/events?limit=5", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Automation events request failed (${res.status})`);
      }
      return res.json();
    },
    retry: 0,
    refetchInterval: 30_000,
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
      void queryClient.invalidateQueries({ queryKey: ["/api/integrations/policy-intel/automation/events"] });
    },
    onError: (error: any) => {
      setAutomationMessage(error?.message || "Automation trigger failed");
    },
  });

  const cardClass = dark
    ? "bg-[#1e2334] border-gray-700 text-white"
    : "bg-white/80 backdrop-blur-sm border border-white/40";

  useEffect(() => {
    const latest = automationEvents?.events?.[0];
    if (!latest?.eventId) return;

    if (!automationInitializedRef.current) {
      automationInitializedRef.current = true;
      lastEventIdRef.current = latest.eventId;
      return;
    }

    if (latest.eventId === lastEventIdRef.current) {
      return;
    }

    lastEventIdRef.current = latest.eventId;
    const finishedAt = new Date(latest.finishedAt);
    const finishedLabel = Number.isNaN(finishedAt.getTime())
      ? latest.finishedAt
      : finishedAt.toLocaleTimeString();

    toast({
      title: latest.status === "success" ? "AI automation completed" : "AI automation reported an error",
      description: `${latest.jobName} finished at ${finishedLabel} (${latest.durationMs}ms).`,
    });
  }, [automationEvents, toast]);

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
              refetchAutomationEvents();
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

        {!isLoading && !isError && automationEvents?.events?.[0] && (
          <div className={`mt-2 text-xs ${dark ? "text-gray-300" : "text-gray-600"}`}>
            Latest automation event: {automationEvents.events[0].jobName} {automationEvents.events[0].status} at {new Date(automationEvents.events[0].finishedAt).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
