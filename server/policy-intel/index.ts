import { createPolicyIntelApp } from "./app";
import { startScheduler } from "./scheduler";

// ── Global crash guards ────────────────────────────────────────────────────
// Prevent intermittent Drizzle TypeError (orderSelectedFields) from killing
// the process.  Log and continue so Docker doesn't enter a restart loop.
process.on("uncaughtException", (err) => {
  console.error("[policy-intel] uncaughtException:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[policy-intel] unhandledRejection:", reason);
});

const port = Number(process.env.POLICY_INTEL_PORT || 5050);
const host = process.env.HOST || "0.0.0.0";

const app = createPolicyIntelApp();

app.listen(port, host, () => {
  console.log(`[policy-intel] listening on http://${host}:${port}`);
  startScheduler();
});
