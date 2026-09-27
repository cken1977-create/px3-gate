export type CredentialState = "asserted" | "documented" | "verified";
export type GateResult = "ok" | "expiring" | "blocked" | "unknown";
export type OverrideReasonCode =
  | "pack_wrong"
  | "cert_in_progress"
  | "operator_verbally_ok_unrecorded"
  | "chose_to_roll";
export type CredentialType =
  | "h2s"
  | "safeland"
  | "drivers_license"
  | "first_aid"
  | "twic"
  | "custom";

export type Assignment = { id: string; jobId: string; personId: string };
export type Credential = {
  id: string;
  personId: string;
  type: CredentialType;
  expiresOn?: string;
  state: CredentialState;
};
export type SitePackItem = {
  credentialType: CredentialType;
  minState: CredentialState;
  required: boolean;
};
export type SitePack = {
  id: string;
  version: number;
  items: SitePackItem[];
};
export type GateReason = {
  credentialType: CredentialType;
  code: "missing" | "expired" | "state_too_weak" | "expiring" | "clock_unknown";
  detail: string;
};
export type GateEvaluation = {
  assignmentId: string;
  evaluatedAt: string;
  packId: string;
  packVersion: number;
  result: GateResult;
  reasons: GateReason[];
  eligibleSwapCount: number;
  deviceTime: string;
  lastServerTime?: string;
  skewMs?: number;
};
export type Override = {
  assignmentId: string;
  reasonCode: OverrideReasonCode;
  reasonText: string;
  swapConsidered: boolean;
  eligibleSwapCount: number;
  createdAt: string;
};

export const WARN_WINDOW_DAYS = 14;
export const SKEW_THRESHOLD_MS = 30 * 60 * 1000;
