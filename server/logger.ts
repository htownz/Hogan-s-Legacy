import pino from "pino";

function hasPinoPretty(): boolean {
  try {
    require.resolve("pino-pretty");
    return true;
  } catch {
    return false;
  }
}

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(process.env.NODE_ENV !== "production" && hasPinoPretty() && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
});

/** Create a child logger scoped to a module name */
export function createLogger(module: string) {
  return logger.child({ module });
}
