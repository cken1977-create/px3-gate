import type { Assignment, Credential, SitePack } from "./domain.ts";

export type DemoPerson = { id: string; name: string };

export const demoPack: SitePack = {
  id: "pack-pioneer-sour",
  version: 1,
  items: [{ credentialType: "h2s", minState: "documented", required: true }],
};

export const demoAssignment: Assignment = {
  id: "asg-demo",
  jobId: "job-lease-14",
  personId: "p-ray",
};

export const demoPeople: DemoPerson[] = [
  { id: "p-ray", name: "Ray" },
  { id: "p-miguel", name: "Miguel" },
];

export const demoCredentials: Record<string, Credential[]> = {
  "p-ray": [{
    id: "c-ray-h2s", personId: "p-ray", type: "h2s",
    expiresOn: "2026-08-01", state: "documented",
  }],
  "p-miguel": [{
    id: "c-mig-h2s", personId: "p-miguel", type: "h2s",
    expiresOn: "2027-04-15", state: "documented",
  }],
};
