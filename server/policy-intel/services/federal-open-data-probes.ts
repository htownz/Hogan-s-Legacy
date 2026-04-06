/**
 * Lightweight connectivity checks for optional federal open-data APIs listed in
 * `.env.policy-intel.example`. Does not persist data — verifies keys and reachability.
 */
import axios from "axios";

export interface FederalProbeResult {
  configured: boolean;
  reachable: boolean;
  httpStatus?: number;
  message: string;
}

export interface AwsCredentialStatus {
  configured: boolean;
  message: string;
}

function trimEnv(name: string): string {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

export async function probeCongressGov(): Promise<FederalProbeResult> {
  const key = trimEnv("CONGRESS_API_KEY");
  if (!key) {
    return { configured: false, reachable: false, message: "CONGRESS_API_KEY not set" };
  }
  try {
    const res = await axios.get("https://api.congress.gov/v3/bill", {
      params: { limit: 1, format: "json" },
      headers: { "X-API-Key": key },
      timeout: 15_000,
      validateStatus: () => true,
    });
    const ok = res.status >= 200 && res.status < 300;
    return {
      configured: true,
      reachable: ok,
      httpStatus: res.status,
      message: ok ? "Congress.gov API accepted the key" : `HTTP ${res.status} from Congress.gov`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      configured: true,
      reachable: false,
      message: `Request failed: ${msg}`,
    };
  }
}

export async function probeFec(): Promise<FederalProbeResult> {
  const key = trimEnv("FEC_API_KEY");
  if (!key) {
    return { configured: false, reachable: false, message: "FEC_API_KEY not set" };
  }
  try {
    const res = await axios.get("https://api.open.fec.gov/v1/candidates/", {
      params: { api_key: key, per_page: 1, state: "TX" },
      timeout: 15_000,
      validateStatus: () => true,
    });
    const ok = res.status >= 200 && res.status < 300;
    return {
      configured: true,
      reachable: ok,
      httpStatus: res.status,
      message: ok ? "OpenFEC API accepted the key" : `HTTP ${res.status} from OpenFEC`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      configured: true,
      reachable: false,
      message: `Request failed: ${msg}`,
    };
  }
}

export async function probeProPublicaCongress(): Promise<FederalProbeResult> {
  const key = trimEnv("PROPUBLICA_API_KEY");
  if (!key) {
    return { configured: false, reachable: false, message: "PROPUBLICA_API_KEY not set" };
  }
  try {
    const res = await axios.get(
      "https://api.propublica.org/congress/v1/members/senate/TX/current.json",
      {
        headers: { "X-API-Key": key },
        timeout: 15_000,
        validateStatus: () => true,
      },
    );
    const ok = res.status >= 200 && res.status < 300;
    return {
      configured: true,
      reachable: ok,
      httpStatus: res.status,
      message: ok
        ? "ProPublica Congress API accepted the key"
        : `HTTP ${res.status} from ProPublica (endpoint may have changed or key invalid)`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      configured: true,
      reachable: false,
      message: `Request failed: ${msg}`,
    };
  }
}

export function getAwsEnvStatus(): AwsCredentialStatus {
  const region = trimEnv("AWS_REGION");
  const id = trimEnv("AWS_ACCESS_KEY_ID");
  const secret = trimEnv("AWS_SECRET_ACCESS_KEY");
  if (!id && !secret) {
    return { configured: false, message: "AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY not set" };
  }
  if (!id || !secret) {
    return { configured: false, message: "Set both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (or leave both empty)" };
  }
  return {
    configured: true,
    message: region
      ? `AWS credentials present (region ${region}); policy-intel does not call S3 yet`
      : "AWS credentials present; consider setting AWS_REGION",
  };
}

export async function runFederalIntegrationProbes(): Promise<{
  checkedAt: string;
  congressGov: FederalProbeResult;
  openFec: FederalProbeResult;
  proPublica: FederalProbeResult;
  aws: AwsCredentialStatus;
}> {
  const [congressGov, openFec, proPublica] = await Promise.all([
    probeCongressGov(),
    probeFec(),
    probeProPublicaCongress(),
  ]);

  return {
    checkedAt: new Date().toISOString(),
    congressGov,
    openFec,
    proPublica,
    aws: getAwsEnvStatus(),
  };
}
