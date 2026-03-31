const TOKEN_LIKE_PATTERNS: RegExp[] = [
  /(Bearer\s+)[A-Za-z0-9._~+\/-]+/gi,
  /(api[_-]?key\s*[:=]\s*)[^\s,;]+/gi,
  /(token\s*[:=]\s*)[^\s,;]+/gi,
  /(secret\s*[:=]\s*)[^\s,;]+/gi,
  /(password\s*[:=]\s*)[^\s,;]+/gi,
];

const URL_SECRET_PATTERN = /([?&](?:api[_-]?key|token|secret|password)=)[^&#\s]*/gi;

export function redactSecrets(input: string): string {
  let output = input;

  for (const pattern of TOKEN_LIKE_PATTERNS) {
    output = output.replace(pattern, "$1[REDACTED]");
  }

  output = output.replace(URL_SECRET_PATTERN, "$1[REDACTED]");
  return output;
}

export function safeErrorMessage(error: unknown, fallback = "Unexpected server error"): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const sanitized = redactSecrets(raw).replace(/\s+/g, " ").trim();
  if (!sanitized) return fallback;
  return sanitized.length > 400 ? `${sanitized.slice(0, 400)}...` : sanitized;
}
