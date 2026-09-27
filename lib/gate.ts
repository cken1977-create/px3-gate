import {
  type Assignment,
  type Credential,
  type CredentialState,
  type GateEvaluation,
  type GateReason,
  type GateResult,
  type SitePack,
  SKEW_THRESHOLD_MS,
  WARN_WINDOW_DAYS,
} from "./domain.ts";

const STATE_RANK: Record<CredentialState, number> = {
  asserted: 0,
  documented: 1,
  verified: 2,
};

function startOfDay(iso: string): number {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function daysUntil(expiresOn: string, nowIso: string): number {
  return (startOfDay(expiresOn) - startOfDay(nowIso)) / 86_400_000;
}

export type ClockInput = {
  nowIso: string;
  deviceTime: string;
  lastServerTime?: string;
  skewMs?: number;
  neverSynced?: boolean;
  deviceClockUntrusted?: boolean;
};

export function evaluateGate(input: {
  assignment: Assignment;
  pack: SitePack;
  credentials: Credential[];
  clock: ClockInput;
  eligibleSwapCount?: number;
}): GateEvaluation {
  const { assignment, pack, credentials, clock } = input;
  const reasons: GateReason[] = [];
  const skewTooHigh =
    clock.skewMs !== undefined && Math.abs(clock.skewMs) > SKEW_THRESHOLD_MS;
  const untrustedOffline =
    Boolean(clock.neverSynced || clock.deviceClockUntrusted) &&
    !clock.lastServerTime;

  if (skewTooHigh || untrustedOffline) {
    return {
      assignmentId: assignment.id,
      evaluatedAt: clock.nowIso,
      packId: pack.id,
      packVersion: pack.version,
      result: "unknown",
      reasons: [{
        credentialType: "custom",
        code: "clock_unknown",
        detail: "Cannot evaluate: clock or sync is untrusted.",
      }],
      eligibleSwapCount: input.eligibleSwapCount ?? 0,
      deviceTime: clock.deviceTime,
      lastServerTime: clock.lastServerTime,
      skewMs: clock.skewMs,
    };
  }

  for (const item of pack.items.filter((i) => i.required)) {
    const cred = credentials.find((c) => c.type === item.credentialType);
    if (!cred) {
      reasons.push({
        credentialType: item.credentialType,
        code: "missing",
        detail: `No ${item.credentialType} on file.`,
      });
      continue;
    }
    if (cred.expiresOn && daysUntil(cred.expiresOn, clock.nowIso) < 0) {
      reasons.push({
        credentialType: item.credentialType,
        code: "expired",
        detail: `${item.credentialType} expired ${cred.expiresOn}.`,
      });
      continue;
    }
    if (STATE_RANK[cred.state] < STATE_RANK[item.minState]) {
      reasons.push({
        credentialType: item.credentialType,
        code: "state_too_weak",
        detail: `${item.credentialType} is ${cred.state}; pack wants ${item.minState}.`,
      });
      continue;
    }
    if (cred.expiresOn && daysUntil(cred.expiresOn, clock.nowIso) <= WARN_WINDOW_DAYS) {
      reasons.push({
        credentialType: item.credentialType,
        code: "expiring",
        detail: `${item.credentialType} expires ${cred.expiresOn}.`,
      });
    }
  }

  const blocked = reasons.some((r) => r.code !== "expiring");
  const expiring = reasons.some((r) => r.code === "expiring");
  let result: GateResult = "ok";
  if (blocked) result = "blocked";
  else if (expiring) result = "expiring";

  return {
    assignmentId: assignment.id,
    evaluatedAt: clock.nowIso,
    packId: pack.id,
    packVersion: pack.version,
    result,
    reasons,
    eligibleSwapCount: input.eligibleSwapCount ?? 0,
    deviceTime: clock.deviceTime,
    lastServerTime: clock.lastServerTime,
    skewMs: clock.skewMs,
  };
}
