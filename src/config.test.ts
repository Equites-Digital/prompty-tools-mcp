import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("returns the API key from PROMPTY_API_KEY", () => {
    expect(loadConfig({ PROMPTY_API_KEY: "pk_test" })).toEqual({ apiKey: "pk_test" });
  });

  it("trims surrounding whitespace from values", () => {
    const config = loadConfig({
      PROMPTY_API_KEY: "  pk_test  ",
      PROMPTY_BASE_URL: " https://example.test/api/v1 ",
    });
    expect(config).toEqual({
      apiKey: "pk_test",
      baseUrl: "https://example.test/api/v1",
    });
  });

  it("throws with a dashboard hint when PROMPTY_API_KEY is missing", () => {
    expect(() => loadConfig({})).toThrowError(
      /PROMPTY_API_KEY is required.*dashboard\/api-keys/,
    );
  });

  it("throws when PROMPTY_API_KEY is empty or blank", () => {
    expect(() => loadConfig({ PROMPTY_API_KEY: "" })).toThrowError(/PROMPTY_API_KEY/);
    expect(() => loadConfig({ PROMPTY_API_KEY: "   " })).toThrowError(/PROMPTY_API_KEY/);
  });

  it("includes baseUrl only when PROMPTY_BASE_URL is set and non-empty", () => {
    expect(loadConfig({ PROMPTY_API_KEY: "pk_test", PROMPTY_BASE_URL: "" })).toEqual({
      apiKey: "pk_test",
    });
    expect(
      loadConfig({ PROMPTY_API_KEY: "pk_test", PROMPTY_BASE_URL: "http://localhost:3000/api/v1" }),
    ).toEqual({ apiKey: "pk_test", baseUrl: "http://localhost:3000/api/v1" });
  });

  it("parses PROMPTY_TIMEOUT_MS into a number", () => {
    expect(loadConfig({ PROMPTY_API_KEY: "pk_test", PROMPTY_TIMEOUT_MS: "5000" })).toEqual({
      apiKey: "pk_test",
      timeoutMs: 5000,
    });
  });

  it("ignores an empty PROMPTY_TIMEOUT_MS", () => {
    expect(loadConfig({ PROMPTY_API_KEY: "pk_test", PROMPTY_TIMEOUT_MS: " " })).toEqual({
      apiKey: "pk_test",
    });
  });

  it.each(["abc", "-1", "1.5", "1e3"])(
    "rejects non-integer PROMPTY_TIMEOUT_MS %j",
    (raw) => {
      expect(() =>
        loadConfig({ PROMPTY_API_KEY: "pk_test", PROMPTY_TIMEOUT_MS: raw }),
      ).toThrowError(/PROMPTY_TIMEOUT_MS must be a positive integer/);
    },
  );
});
