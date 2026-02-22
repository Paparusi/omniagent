import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  restoreStateDirEnv,
  setStateDirEnv,
  snapshotStateDirEnv,
  withStateDirEnv,
} from "./state-dir-env.js";

type EnvSnapshot = {
  omniagent?: string;
  legacy?: string;
};

function snapshotCurrentStateDirVars(): EnvSnapshot {
  return {
    omniagent: process.env.OMNIAGENT_STATE_DIR,
    legacy: process.env.CLAWDBOT_STATE_DIR,
  };
}

function expectStateDirVars(snapshot: EnvSnapshot) {
  expect(process.env.OMNIAGENT_STATE_DIR).toBe(snapshot.omniagent);
  expect(process.env.CLAWDBOT_STATE_DIR).toBe(snapshot.legacy);
}

async function expectPathMissing(filePath: string) {
  await expect(fs.stat(filePath)).rejects.toThrow();
}

describe("state-dir-env helpers", () => {
  it("set/snapshot/restore round-trips OMNIAGENT_STATE_DIR", () => {
    const prev = snapshotCurrentStateDirVars();
    const snapshot = snapshotStateDirEnv();

    setStateDirEnv("/tmp/omniagent-state-dir-test");
    expect(process.env.OMNIAGENT_STATE_DIR).toBe("/tmp/omniagent-state-dir-test");
    expect(process.env.CLAWDBOT_STATE_DIR).toBeUndefined();

    restoreStateDirEnv(snapshot);
    expectStateDirVars(prev);
  });

  it("withStateDirEnv sets env for callback and cleans up temp root", async () => {
    const prev = snapshotCurrentStateDirVars();

    let capturedTempRoot = "";
    let capturedStateDir = "";
    await withStateDirEnv("omniagent-state-dir-env-", async ({ tempRoot, stateDir }) => {
      capturedTempRoot = tempRoot;
      capturedStateDir = stateDir;
      expect(process.env.OMNIAGENT_STATE_DIR).toBe(stateDir);
      expect(process.env.CLAWDBOT_STATE_DIR).toBeUndefined();
      await fs.writeFile(path.join(stateDir, "probe.txt"), "ok", "utf8");
    });

    expectStateDirVars(prev);
    await expectPathMissing(capturedStateDir);
    await expectPathMissing(capturedTempRoot);
  });

  it("withStateDirEnv restores env and cleans temp root when callback throws", async () => {
    const prev = snapshotCurrentStateDirVars();

    let capturedTempRoot = "";
    let capturedStateDir = "";
    await expect(
      withStateDirEnv("omniagent-state-dir-env-", async ({ tempRoot, stateDir }) => {
        capturedTempRoot = tempRoot;
        capturedStateDir = stateDir;
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expectStateDirVars(prev);
    await expectPathMissing(capturedStateDir);
    await expectPathMissing(capturedTempRoot);
  });
});
