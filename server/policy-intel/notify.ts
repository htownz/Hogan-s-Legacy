/**
 * Notification module — Slack webhook integration.
 *
 * Set SLACK_WEBHOOK_URL in environment to enable.
 * Messages are fire-and-forget; failures are logged but never block callers.
 */

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL ?? "";

/**
 * Send a message to the configured Slack webhook.
 * Returns true if the message was sent, false if not configured.
 */
export async function notifySlack(
  title: string,
  body: string,
  opts?: { color?: string; fields?: Array<{ title: string; value: string; short?: boolean }> },
): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) return false;

  try {
    const attachment: Record<string, unknown> = {
      color: opts?.color ?? "#3498db",
      title,
      text: body,
      ts: Math.floor(Date.now() / 1000),
    };
    if (opts?.fields) attachment.fields = opts.fields;

    const resp = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachments: [attachment] }),
    });

    if (!resp.ok) {
      console.error(`[notify] Slack webhook returned ${resp.status}: ${await resp.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[notify] Slack webhook failed:", err);
    return false;
  }
}

/**
 * Send a high-priority alert notification to Slack.
 */
export async function notifyHighPriorityAlert(alert: {
  id: number;
  title: string;
  relevanceScore: number;
  whyItMatters?: string | null;
  watchlistName?: string;
}): Promise<boolean> {
  const color = alert.relevanceScore >= 80 ? "#e74c3c" : "#e67e22";
  return notifySlack(
    `🚨 High-Priority Alert: ${alert.title}`,
    alert.whyItMatters?.slice(0, 300) ?? "No summary available",
    {
      color,
      fields: [
        { title: "Score", value: String(alert.relevanceScore), short: true },
        { title: "Watchlist", value: alert.watchlistName ?? "Unknown", short: true },
        { title: "Alert ID", value: String(alert.id), short: true },
      ],
    },
  );
}
