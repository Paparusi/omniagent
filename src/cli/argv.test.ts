import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it.each([
    {
      name: "help flag",
      argv: ["node", "omniagent", "--help"],
      expected: true,
    },
    {
      name: "version flag",
      argv: ["node", "omniagent", "-V"],
      expected: true,
    },
    {
      name: "normal command",
      argv: ["node", "omniagent", "status"],
      expected: false,
    },
    {
      name: "root -v alias",
      argv: ["node", "omniagent", "-v"],
      expected: true,
    },
    {
      name: "root -v alias with profile",
      argv: ["node", "omniagent", "--profile", "work", "-v"],
      expected: true,
    },
    {
      name: "subcommand -v should not be treated as version",
      argv: ["node", "omniagent", "acp", "-v"],
      expected: false,
    },
    {
      name: "root -v alias with equals profile",
      argv: ["node", "omniagent", "--profile=work", "-v"],
      expected: true,
    },
    {
      name: "subcommand path after global root flags should not be treated as version",
      argv: ["node", "omniagent", "--dev", "skills", "list", "-v"],
      expected: false,
    },
  ])("detects help/version flags: $name", ({ argv, expected }) => {
    expect(hasHelpOrVersion(argv)).toBe(expected);
  });

  it.each([
    {
      name: "single command with trailing flag",
      argv: ["node", "omniagent", "status", "--json"],
      expected: ["status"],
    },
    {
      name: "two-part command",
      argv: ["node", "omniagent", "agents", "list"],
      expected: ["agents", "list"],
    },
    {
      name: "terminator cuts parsing",
      argv: ["node", "omniagent", "status", "--", "ignored"],
      expected: ["status"],
    },
  ])("extracts command path: $name", ({ argv, expected }) => {
    expect(getCommandPath(argv, 2)).toEqual(expected);
  });

  it.each([
    {
      name: "returns first command token",
      argv: ["node", "omniagent", "agents", "list"],
      expected: "agents",
    },
    {
      name: "returns null when no command exists",
      argv: ["node", "omniagent"],
      expected: null,
    },
  ])("returns primary command: $name", ({ argv, expected }) => {
    expect(getPrimaryCommand(argv)).toBe(expected);
  });

  it.each([
    {
      name: "detects flag before terminator",
      argv: ["node", "omniagent", "status", "--json"],
      flag: "--json",
      expected: true,
    },
    {
      name: "ignores flag after terminator",
      argv: ["node", "omniagent", "--", "--json"],
      flag: "--json",
      expected: false,
    },
  ])("parses boolean flags: $name", ({ argv, flag, expected }) => {
    expect(hasFlag(argv, flag)).toBe(expected);
  });

  it.each([
    {
      name: "value in next token",
      argv: ["node", "omniagent", "status", "--timeout", "5000"],
      expected: "5000",
    },
    {
      name: "value in equals form",
      argv: ["node", "omniagent", "status", "--timeout=2500"],
      expected: "2500",
    },
    {
      name: "missing value",
      argv: ["node", "omniagent", "status", "--timeout"],
      expected: null,
    },
    {
      name: "next token is another flag",
      argv: ["node", "omniagent", "status", "--timeout", "--json"],
      expected: null,
    },
    {
      name: "flag appears after terminator",
      argv: ["node", "omniagent", "--", "--timeout=99"],
      expected: undefined,
    },
  ])("extracts flag values: $name", ({ argv, expected }) => {
    expect(getFlagValue(argv, "--timeout")).toBe(expected);
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "omniagent", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "omniagent", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "omniagent", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it.each([
    {
      name: "missing flag",
      argv: ["node", "omniagent", "status"],
      expected: undefined,
    },
    {
      name: "missing value",
      argv: ["node", "omniagent", "status", "--timeout"],
      expected: null,
    },
    {
      name: "valid positive integer",
      argv: ["node", "omniagent", "status", "--timeout", "5000"],
      expected: 5000,
    },
    {
      name: "invalid integer",
      argv: ["node", "omniagent", "status", "--timeout", "nope"],
      expected: undefined,
    },
  ])("parses positive integer flag values: $name", ({ argv, expected }) => {
    expect(getPositiveIntFlagValue(argv, "--timeout")).toBe(expected);
  });

  it("builds parse argv from raw args", () => {
    const cases = [
      {
        rawArgs: ["node", "omniagent", "status"],
        expected: ["node", "omniagent", "status"],
      },
      {
        rawArgs: ["node-22", "omniagent", "status"],
        expected: ["node-22", "omniagent", "status"],
      },
      {
        rawArgs: ["node-22.2.0.exe", "omniagent", "status"],
        expected: ["node-22.2.0.exe", "omniagent", "status"],
      },
      {
        rawArgs: ["node-22.2", "omniagent", "status"],
        expected: ["node-22.2", "omniagent", "status"],
      },
      {
        rawArgs: ["node-22.2.exe", "omniagent", "status"],
        expected: ["node-22.2.exe", "omniagent", "status"],
      },
      {
        rawArgs: ["/usr/bin/node-22.2.0", "omniagent", "status"],
        expected: ["/usr/bin/node-22.2.0", "omniagent", "status"],
      },
      {
        rawArgs: ["nodejs", "omniagent", "status"],
        expected: ["nodejs", "omniagent", "status"],
      },
      {
        rawArgs: ["node-dev", "omniagent", "status"],
        expected: ["node", "omniagent", "node-dev", "omniagent", "status"],
      },
      {
        rawArgs: ["omniagent", "status"],
        expected: ["node", "omniagent", "status"],
      },
      {
        rawArgs: ["bun", "src/entry.ts", "status"],
        expected: ["bun", "src/entry.ts", "status"],
      },
    ] as const;

    for (const testCase of cases) {
      const parsed = buildParseArgv({
        programName: "omniagent",
        rawArgs: [...testCase.rawArgs],
      });
      expect(parsed).toEqual([...testCase.expected]);
    }
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "omniagent",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "omniagent", "status"]);
  });

  it("decides when to migrate state", () => {
    const nonMutatingArgv = [
      ["node", "omniagent", "status"],
      ["node", "omniagent", "health"],
      ["node", "omniagent", "sessions"],
      ["node", "omniagent", "config", "get", "update"],
      ["node", "omniagent", "config", "unset", "update"],
      ["node", "omniagent", "models", "list"],
      ["node", "omniagent", "models", "status"],
      ["node", "omniagent", "memory", "status"],
      ["node", "omniagent", "agent", "--message", "hi"],
    ] as const;
    const mutatingArgv = [
      ["node", "omniagent", "agents", "list"],
      ["node", "omniagent", "message", "send"],
    ] as const;

    for (const argv of nonMutatingArgv) {
      expect(shouldMigrateState([...argv])).toBe(false);
    }
    for (const argv of mutatingArgv) {
      expect(shouldMigrateState([...argv])).toBe(true);
    }
  });

  it.each([
    { path: ["status"], expected: false },
    { path: ["config", "get"], expected: false },
    { path: ["models", "status"], expected: false },
    { path: ["agents", "list"], expected: true },
  ])("reuses command path for migrate state decisions: $path", ({ path, expected }) => {
    expect(shouldMigrateStateFromPath(path)).toBe(expected);
  });
});
