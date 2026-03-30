/**
 * Policy Intel — Prometheus Metrics Collector
 *
 * Lightweight, zero-dependency Prometheus text format exporter.
 * Modeled after Hogan's monitoring/ stack but built for Node/TypeScript.
 *
 * Exposes counters, gauges, and histograms that Prometheus scrapes
 * via the /metrics endpoint.
 */

// ── Metric Types ─────────────────────────────────────────────────────────────

interface CounterData {
  type: "counter";
  help: string;
  values: Map<string, number>; // label-key -> value
}

interface GaugeData {
  type: "gauge";
  help: string;
  values: Map<string, number>;
}

interface HistogramData {
  type: "histogram";
  help: string;
  buckets: number[];
  observations: Map<string, { buckets: number[]; sum: number; count: number }>;
}

type MetricData = CounterData | GaugeData | HistogramData;

// ── Registry ─────────────────────────────────────────────────────────────────

class MetricsRegistry {
  private metrics = new Map<string, MetricData>();
  private startTime = Date.now();

  // ── Counter ──

  counter(name: string, help: string): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, { type: "counter", help, values: new Map() });
    }
  }

  inc(name: string, labels: Record<string, string> = {}, value = 1): void {
    const m = this.metrics.get(name);
    if (!m || m.type !== "counter") return;
    const key = labelKey(labels);
    m.values.set(key, (m.values.get(key) ?? 0) + value);
  }

  // ── Gauge ──

  gauge(name: string, help: string): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, { type: "gauge", help, values: new Map() });
    }
  }

  set(name: string, labels: Record<string, string>, value: number): void {
    const m = this.metrics.get(name);
    if (!m || m.type !== "gauge") return;
    m.values.set(labelKey(labels), value);
  }

  // ── Histogram ──

  histogram(name: string, help: string, buckets: number[]): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        type: "histogram",
        help,
        buckets: [...buckets].sort((a, b) => a - b),
        observations: new Map(),
      });
    }
  }

  observe(name: string, labels: Record<string, string>, value: number): void {
    const m = this.metrics.get(name);
    if (!m || m.type !== "histogram") return;
    const key = labelKey(labels);
    let obs = m.observations.get(key);
    if (!obs) {
      obs = { buckets: new Array(m.buckets.length).fill(0), sum: 0, count: 0 };
      m.observations.set(key, obs);
    }
    obs.sum += value;
    obs.count += 1;
    for (let i = 0; i < m.buckets.length; i++) {
      if (value <= m.buckets[i]) obs.buckets[i]++;
    }
  }

  // ── Serialize to Prometheus text format ──

  serialize(): string {
    const lines: string[] = [];

    // Process uptime
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    lines.push("# HELP policy_intel_uptime_seconds Seconds since service start");
    lines.push("# TYPE policy_intel_uptime_seconds gauge");
    lines.push(`policy_intel_uptime_seconds ${uptimeSeconds}`);
    lines.push("");

    this.metrics.forEach((m, name) => {
      lines.push(`# HELP ${name} ${m.help}`);
      lines.push(`# TYPE ${name} ${m.type}`);

      if (m.type === "counter" || m.type === "gauge") {
        m.values.forEach((val, lk) => {
          const labelStr = lk ? `{${lk}}` : "";
          lines.push(`${name}${labelStr} ${val}`);
        });
      } else if (m.type === "histogram") {
        m.observations.forEach((obs, lk) => {
          const prefix = lk ? `,${lk}` : "";
          let cumulative = 0;
          for (let i = 0; i < m.buckets.length; i++) {
            cumulative += obs.buckets[i];
            lines.push(`${name}_bucket{le="${m.buckets[i]}"${prefix}} ${cumulative}`);
          }
          lines.push(`${name}_bucket{le="+Inf"${prefix}} ${obs.count}`);
          lines.push(`${name}_sum{${lk}} ${obs.sum}`);
          lines.push(`${name}_count{${lk}} ${obs.count}`);
        });
      }
      lines.push("");
    });

    return lines.join("\n");
  }
}

function labelKey(labels: Record<string, string>): string {
  const entries = Object.entries(labels);
  if (entries.length === 0) return "";
  return entries.map(([k, v]) => `${k}="${v}"`).join(",");
}

// ── Singleton ────────────────────────────────────────────────────────────────

export const metrics = new MetricsRegistry();

// ── Register all Policy Intel metrics ────────────────────────────────────────

// Pipeline
metrics.counter("policy_intel_pipeline_runs_total", "Total agent pipeline executions");
metrics.counter("policy_intel_pipeline_actions_total", "Pipeline actions by type (escalate/watch/archive)");
metrics.histogram("policy_intel_pipeline_score", "Distribution of pipeline scores", [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
metrics.histogram("policy_intel_pipeline_confidence", "Distribution of pipeline confidence", [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]);
metrics.histogram("policy_intel_pipeline_duration_ms", "Pipeline execution time in ms", [1, 5, 10, 25, 50, 100, 250, 500]);

// Regime
metrics.counter("policy_intel_regime_detections_total", "Regime detections by type");
metrics.gauge("policy_intel_regime_current", "Current detected regime (1=active)");

// Agent scores
metrics.histogram("policy_intel_agent_score", "Individual agent score distribution", [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]);

// Alerts
metrics.counter("policy_intel_alerts_created_total", "Total alerts created");
metrics.counter("policy_intel_alerts_skipped_total", "Alerts skipped (duplicate or cooldown)");
metrics.histogram("policy_intel_alert_score", "Distribution of alert relevance scores", [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);

// Documents
metrics.counter("policy_intel_docs_processed_total", "Total source documents processed for alerts");
metrics.counter("policy_intel_docs_matched_total", "Documents that matched at least one watchlist");

// Jobs
metrics.counter("policy_intel_jobs_total", "Scheduled jobs executed");
metrics.counter("policy_intel_jobs_errors_total", "Scheduled job errors");
metrics.histogram("policy_intel_job_duration_seconds", "Job execution duration", [1, 5, 10, 30, 60, 120, 300, 600]);

// HTTP
metrics.counter("policy_intel_http_requests_total", "HTTP requests by method and route");
metrics.histogram("policy_intel_http_duration_ms", "HTTP request duration in ms", [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]);
