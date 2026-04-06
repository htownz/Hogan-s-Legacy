/**
 * Creates .env.policy-intel from the example if it does not exist.
 * Docker Compose only reads .env.policy-intel — not *.example.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dst = path.join(root, ".env.policy-intel");
const src = path.join(root, ".env.policy-intel.example");

if (fs.existsSync(dst)) {
  console.log(".env.policy-intel already exists — not overwriting.");
  console.log("Edit that file and add your API keys, then run Docker Compose.");
  process.exit(0);
}

if (!fs.existsSync(src)) {
  console.error("Missing .env.policy-intel.example");
  process.exit(1);
}

fs.copyFileSync(src, dst);
console.log("Created .env.policy-intel from .env.policy-intel.example");
console.log("");
console.log("Next steps:");
console.log("  1. Open .env.policy-intel and paste OPENAI_API_KEY, ANTHROPIC_API_KEY,");
console.log("     LEGISCAN_API_KEY, OPENSTATES_API_KEY (and anything else you need).");
console.log("  2. Run: docker compose -f docker-compose.policy-intel.yml up --build");
console.log("");
