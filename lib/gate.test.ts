import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Assignment, Credential, SitePack } from "./domain.ts";
import { assertCompliantPacketClean } from "./export.ts";
import { evaluateGate } from "./gate.ts";

const pack: SitePack = {
  id: "pack-1",
  version: 1,
  items: [{ credentialType: "h2s", minState: "documented", required: true }],
};
const assignment: Assignment = { id: "asg-1", jobId: "job-1", personId: "p-1" };
const clock = {
  nowIso: "2026-09-27T12:00:00.000Z",
  deviceTime: "2026-09-27T12:00:00.000Z",
  lastServerTime: "2026-09-27T12:00:00.000Z",
  skewMs: 0,
};

describe("evaluateGate", () => {
  it("blocks a missing H2S card", () => {
    const ev = evaluateGate({ assignment, pack, credentials: [], clock });
    assert.equal(ev.result, "blocked");
  });
  it("passes a current documented H2S card", () => {
    const cred: Credential = {
      id: "c-1", personId: "p-1", type: "h2s",
      expiresOn: "2027-03-12", state: "documented",
    };
    const ev = evaluateGate({ assignment, pack, credentials: [cred], clock });
    assert.equal(ev.result, "ok");
  });
  it("returns unknown when clock is untrusted", () => {
    const ev = evaluateGate({
      assignment, pack, credentials: [],
      clock: {
        nowIso: "2026-09-27T12:00:00.000Z",
        deviceTime: "2026-09-27T12:00:00.000Z",
        neverSynced: true,
        deviceClockUntrusted: true,
      },
    });
    assert.equal(ev.result, "unknown");
  });
});

describe("compliant packet", () => {
  it("refuses override rows", () => {
    assert.throws(() =>
      assertCompliantPacketClean({
        kind: "compliant_packet",
        overrides: [{
          assignmentId: "asg-1",
          reasonCode: "chose_to_roll",
          reasonText: "need the day-rate",
          swapConsidered: false,
          eligibleSwapCount: 0,
          createdAt: "2026-09-27T12:00:00.000Z",
        }],
      }),
    );
  });
});
