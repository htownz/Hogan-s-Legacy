import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Clock3, Bot } from "lucide-react";

interface PolicyIntelAutomationEventsResponse {
  generatedAt: string;
  statusFilter: "all" | "success" | "error";
  events: Array<{
    eventId: string;
    jobName: string;
    status: "success" | "error";
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    summary: Record<string, unknown>;
    error?: string;
  }>;
}

interface PolicyIntelAutomationJobsResponse {
  jobs: Array<{
    name: string;
    enabled: boolean;
    running: boolean;
  }>;
}

interface PolicyIntelAutomationTriggerResult {
  triggered: boolean;
  message?: string;
  record?: {
    jobName: string;
    status: "success" | "error";
    durationMs: number;
  };
}

interface TriggerJobRequest {
  jobName: string;
  force?: boolean;
}

interface PolicyIntelAutomationActivityCardProps {
  className?: string;
  dark?: boolean;
  limit?: number;
}

function formatDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) return "-";
  if (durationMs < 1000) return `${durationMs}ms`;
  const seconds = durationMs / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export function PolicyIntelAutomationActivityCard({
  className = "",
  dark = false,
  limit = 5,
}: PolicyIntelAutomationActivityCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string>("all");

  const { data: jobsData } = useQuery<PolicyIntelAutomationJobsResponse>({
    queryKey: ["/api/integrations/policy-intel/automation/jobs"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/policy-intel/automation/jobs", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Automation jobs request failed (${res.status})`);
      }
      return res.json();
    },
    retry: 0,
    refetchInterval: 60_000,
  });

  const { data, isLoading, isError, isFetching, refetch } = useQuery<PolicyIntelAutomationEventsResponse>({
    queryKey: ["/api/integrations/policy-intel/automation/events", limit, statusFilter, selectedJob],
    queryFn: async () => {
      const jobsQuery = selectedJob !== "all" ? `&jobs=${encodeURIComponent(selectedJob)}` : "";
      const res = await fetch(
        `/api/integrations/policy-intel/automation/events?limit=${limit}&status=${statusFilter}${jobsQuery}`,
        {
        credentials: "include",
        },
      );
      if (!res.ok) {
        throw new Error(`Automation events request failed (${res.status})`);
      }
      return res.json();
    },
    retry: 0,
    refetchInterval: 30_000,
  });

  const cardClass = dark
    ? "bg-[#1e2334] border-gray-700 text-white"
    : "bg-white/80 backdrop-blur-sm border border-white/40";

  const selectedEvent = useMemo(
    () => data?.events.find((event) => event.eventId === selectedEventId) ?? data?.events?.[0] ?? null,
    [data, selectedEventId],
  );

  const availableJobs = jobsData?.jobs?.filter((job) => job.enabled !== false) ?? [];

  const rerunMutation = useMutation({
    mutationFn: async ({ jobName, force = false }: TriggerJobRequest) => {
      const res = await fetch(`/api/integrations/policy-intel/automation/jobs/${encodeURIComponent(jobName)}/run`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ force }),
      });

      const body = (await res.json()) as PolicyIntelAutomationTriggerResult;
      if (!res.ok && res.status !== 429) {
        throw new Error(body.message || `Automation run failed (${res.status})`);
      }
      return body;
    },
    onSuccess: (result) => {
      if (!result.triggered) {
        toast({
          title: "Automation run skipped",
          description: result.message || "The selected automation job did not run.",
        });
      } else {
        toast({
          title: "Automation run started",
          description: `${result.record?.jobName || "Selected job"} triggered successfully.`,
        });
      }
      void queryClient.invalidateQueries({ queryKey: ["/api/integrations/policy-intel/automation/events"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/integrations/policy-intel/automation/status"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/integrations/policy-intel/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Automation run failed",
        description: error?.message || "Unable to trigger selected automation job.",
      });
    },
  });

  return (
    <Card className={`${cardClass} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-500" />
              Automation Activity
            </CardTitle>
            <CardDescription className={dark ? "text-gray-300" : "text-gray-600"}>
              Latest AI run outcomes
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className={dark ? "border-gray-600 hover:bg-gray-700" : ""}
            onClick={() => refetch()}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className={
              selectedJob === "all"
                ? "bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-500"
                : dark
                  ? "border-gray-600 hover:bg-gray-700"
                  : ""
            }
            onClick={() => {
              setSelectedJob("all");
              setSelectedEventId(null);
            }}
          >
            jobs: all
          </Button>
          {availableJobs.slice(0, 4).map((job) => (
            <Button
              key={job.name}
              size="sm"
              variant="outline"
              className={
                selectedJob === job.name
                  ? "bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-500"
                  : dark
                    ? "border-gray-600 hover:bg-gray-700"
                    : ""
              }
              onClick={() => {
                setSelectedJob(job.name);
                setSelectedEventId(null);
              }}
            >
              {job.name}
            </Button>
          ))}

          {(["all", "success", "error"] as const).map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant="outline"
              className={
                statusFilter === filter
                  ? "bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-500"
                  : dark
                    ? "border-gray-600 hover:bg-gray-700"
                    : ""
              }
              onClick={() => {
                setStatusFilter(filter);
                setSelectedEventId(null);
              }}
            >
              status: {filter}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            className={dark ? "border-gray-600 hover:bg-gray-700" : ""}
            onClick={() => {
              if (selectedEvent?.jobName) {
                rerunMutation.mutate({ jobName: selectedEvent.jobName, force: false });
              }
            }}
            disabled={!selectedEvent?.jobName || rerunMutation.isPending}
          >
            {rerunMutation.isPending ? "Running..." : "Run selected"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={dark ? "border-gray-600 hover:bg-gray-700" : ""}
            onClick={() => {
              if (selectedEvent?.jobName) {
                rerunMutation.mutate({ jobName: selectedEvent.jobName, force: true });
              }
            }}
            disabled={!selectedEvent?.jobName || rerunMutation.isPending}
          >
            {rerunMutation.isPending ? "Forcing..." : "Force run"}
          </Button>
        </div>

        {isLoading ? (
          <div className={dark ? "text-gray-300" : "text-gray-600"}>Loading automation history...</div>
        ) : isError ? (
          <div className="text-red-500">Automation history unavailable</div>
        ) : !data?.events?.length ? (
          <div className={dark ? "text-gray-300" : "text-gray-600"}>No automation runs recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {data.events.map((event) => {
              const finishedAt = new Date(event.finishedAt);
              const finishedLabel = Number.isNaN(finishedAt.getTime())
                ? event.finishedAt
                : finishedAt.toLocaleTimeString();

              return (
                <div
                  key={event.eventId}
                  className={`rounded-md p-2 bg-black/5 flex items-center justify-between gap-2 cursor-pointer border ${
                    selectedEvent?.eventId === event.eventId ? "border-cyan-500" : "border-transparent"
                  }`}
                  onClick={() => setSelectedEventId(event.eventId)}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{event.jobName}</div>
                    <div className={`text-xs flex items-center gap-1 ${dark ? "text-gray-300" : "text-gray-600"}`}>
                      <Clock3 className="w-3 h-3" />
                      {finishedLabel} · {formatDuration(event.durationMs)}
                    </div>
                  </div>
                  <Badge className={event.status === "success" ? "bg-emerald-600" : "bg-rose-600"}>
                    {event.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && !isError && selectedEvent && (
          <div className="mt-3 pt-3 border-t border-black/10">
            <div className="text-sm font-semibold mb-1">Run Details</div>
            <div className={`text-xs mb-2 ${dark ? "text-gray-300" : "text-gray-600"}`}>
              {selectedEvent.jobName} • {new Date(selectedEvent.startedAt).toLocaleString()} to {new Date(selectedEvent.finishedAt).toLocaleString()}
            </div>

            {selectedEvent.error && (
              <div className="text-xs rounded-md p-2 bg-rose-600/20 text-rose-200 mb-2">{selectedEvent.error}</div>
            )}

            <div className="space-y-1">
              {Object.entries(selectedEvent.summary || {}).slice(0, 6).map(([key, value]) => (
                <div key={key} className="text-xs flex items-center justify-between gap-2 rounded-md p-2 bg-black/5">
                  <span className={dark ? "text-gray-300" : "text-gray-600"}>{key}</span>
                  <span className="font-semibold truncate max-w-[60%]">
                    {typeof value === "string" || typeof value === "number" || typeof value === "boolean"
                      ? String(value)
                      : JSON.stringify(value)}
                  </span>
                </div>
              ))}
              {Object.keys(selectedEvent.summary || {}).length === 0 && (
                <div className={dark ? "text-gray-300 text-xs" : "text-gray-600 text-xs"}>No summary metrics available.</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
