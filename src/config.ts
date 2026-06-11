export interface ServerConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

const API_KEY_HINT =
  "Set the PROMPTY_API_KEY environment variable. Create a key at https://www.prompty.tools/dashboard/api-keys";

/**
 * Reads server configuration from environment variables.
 *
 * @throws {Error} If PROMPTY_API_KEY is missing or PROMPTY_TIMEOUT_MS is not
 *   a positive integer.
 */
export function loadConfig(env: Record<string, string | undefined>): ServerConfig {
  const apiKey = env.PROMPTY_API_KEY?.trim();
  if (apiKey === undefined || apiKey === "") {
    throw new Error(`PROMPTY_API_KEY is required. ${API_KEY_HINT}`);
  }

  const config: ServerConfig = { apiKey };

  const baseUrl = env.PROMPTY_BASE_URL?.trim();
  if (baseUrl !== undefined && baseUrl !== "") {
    config.baseUrl = baseUrl;
  }

  const rawTimeout = env.PROMPTY_TIMEOUT_MS?.trim();
  if (rawTimeout !== undefined && rawTimeout !== "") {
    if (!/^\d+$/.test(rawTimeout)) {
      throw new Error(
        `PROMPTY_TIMEOUT_MS must be a positive integer (milliseconds), got "${rawTimeout}"`,
      );
    }
    config.timeoutMs = Number(rawTimeout);
  }

  return config;
}
