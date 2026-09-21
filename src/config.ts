export interface AppConfig {
  port: number;
  region: string;
  logLevel: "debug" | "info" | "warn" | "error";
  metricsEnabled: boolean;
  metricsPort?: number;
}

export class ConfigError extends Error {}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? 3000);
  const region = env.APP_REGION ?? "eu";
  const logLevel = (env.LOG_LEVEL ?? "info") as AppConfig["logLevel"];
  const metricsEnabled = (env.METRICS_ENABLED ?? "false").toLowerCase() === "true";

  if (!["debug", "info", "warn", "error"].includes(logLevel)) {
    throw new ConfigError(`LOG_LEVEL must be one of debug|info|warn|error, got "${logLevel}"`);
  }

  let metricsPort: number | undefined;
  if (metricsEnabled) {
    if (!env.METRICS_PORT) {
      throw new ConfigError("METRICS_PORT is required when METRICS_ENABLED=true");
    }
    metricsPort = Number(env.METRICS_PORT);
    if (!Number.isInteger(metricsPort) || metricsPort <= 0 || metricsPort === port) {
      throw new ConfigError(`METRICS_PORT must be a positive integer different from PORT, got "${env.METRICS_PORT}"`);
    }
  }

  return { port, region, logLevel, metricsEnabled, metricsPort };
}
