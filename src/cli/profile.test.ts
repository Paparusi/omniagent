import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "omniagent",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "omniagent", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "omniagent", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "omniagent", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "omniagent", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "omniagent", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "omniagent", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it.each([
    ["--dev first", ["node", "omniagent", "--dev", "--profile", "work", "status"]],
    ["--profile first", ["node", "omniagent", "--profile", "work", "--dev", "status"]],
  ])("rejects combining --dev with --profile (%s)", (_name, argv) => {
    const res = parseCliProfileArgs(argv);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".omniagent-dev");
    expect(env.OMNIAGENT_PROFILE).toBe("dev");
    expect(env.OMNIAGENT_STATE_DIR).toBe(expectedStateDir);
    expect(env.OMNIAGENT_CONFIG_PATH).toBe(path.join(expectedStateDir, "omniagent.json"));
    expect(env.OMNIAGENT_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      OMNIAGENT_STATE_DIR: "/custom",
      OMNIAGENT_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.OMNIAGENT_STATE_DIR).toBe("/custom");
    expect(env.OMNIAGENT_GATEWAY_PORT).toBe("19099");
    expect(env.OMNIAGENT_CONFIG_PATH).toBe(path.join("/custom", "omniagent.json"));
  });

  it("uses OMNIAGENT_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      OMNIAGENT_HOME: "/srv/omniagent-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/omniagent-home");
    expect(env.OMNIAGENT_STATE_DIR).toBe(path.join(resolvedHome, ".omniagent-work"));
    expect(env.OMNIAGENT_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".omniagent-work", "omniagent.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it.each([
    {
      name: "no profile is set",
      cmd: "omniagent doctor --fix",
      env: {},
      expected: "omniagent doctor --fix",
    },
    {
      name: "profile is default",
      cmd: "omniagent doctor --fix",
      env: { OMNIAGENT_PROFILE: "default" },
      expected: "omniagent doctor --fix",
    },
    {
      name: "profile is Default (case-insensitive)",
      cmd: "omniagent doctor --fix",
      env: { OMNIAGENT_PROFILE: "Default" },
      expected: "omniagent doctor --fix",
    },
    {
      name: "profile is invalid",
      cmd: "omniagent doctor --fix",
      env: { OMNIAGENT_PROFILE: "bad profile" },
      expected: "omniagent doctor --fix",
    },
    {
      name: "--profile is already present",
      cmd: "omniagent --profile work doctor --fix",
      env: { OMNIAGENT_PROFILE: "work" },
      expected: "omniagent --profile work doctor --fix",
    },
    {
      name: "--dev is already present",
      cmd: "omniagent --dev doctor",
      env: { OMNIAGENT_PROFILE: "dev" },
      expected: "omniagent --dev doctor",
    },
  ])("returns command unchanged when $name", ({ cmd, env, expected }) => {
    expect(formatCliCommand(cmd, env)).toBe(expected);
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("omniagent doctor --fix", { OMNIAGENT_PROFILE: "work" })).toBe(
      "omniagent --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("omniagent doctor --fix", { OMNIAGENT_PROFILE: "  jbomniagent  " })).toBe(
      "omniagent --profile jbomniagent doctor --fix",
    );
  });

  it("handles command with no args after omniagent", () => {
    expect(formatCliCommand("omniagent", { OMNIAGENT_PROFILE: "test" })).toBe(
      "omniagent --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm omniagent doctor", { OMNIAGENT_PROFILE: "work" })).toBe(
      "pnpm omniagent --profile work doctor",
    );
  });
});
