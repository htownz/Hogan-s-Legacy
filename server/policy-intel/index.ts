import { createPolicyIntelApp } from "./app";
import { startScheduler } from "./scheduler";

const port = Number(process.env.POLICY_INTEL_PORT || 5050);
const host = process.env.HOST || "0.0.0.0";

const app = createPolicyIntelApp();

app.listen(port, host, () => {
  console.log(`[policy-intel] listening on http://${host}:${port}`);
  startScheduler();
});
