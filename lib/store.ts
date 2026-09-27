"use client";

import type { Credential, CredentialState, CredentialType } from "./domain";

export type PersonRecord = {
  id: string;
  name: string;
  phone: string;
  sse: boolean;
  w9CollectedAt?: string;
};

export type StoredEvent =
  | { id: string; at: string; type: "person_added"; person: PersonRecord }
  | { id: string; at: string; type: "credential_set"; credential: Credential };

const KEY = "px3.events.v1";

export function loadEvents(): StoredEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredEvent[]) : [];
  } catch {
    return [];
  }
}

export function appendEvent(event: StoredEvent): StoredEvent[] {
  const next = [...loadEvents(), event];
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function replay(events: StoredEvent[]): {
  people: PersonRecord[];
  credentials: Credential[];
} {
  const people: PersonRecord[] = [];
  const credentials: Credential[] = [];
  for (const e of events) {
    if (e.type === "person_added") people.push(e.person);
    if (e.type === "credential_set") {
      const i = credentials.findIndex(
        (c) => c.personId === e.credential.personId && c.type === e.credential.type,
      );
      if (i >= 0) credentials[i] = e.credential;
      else credentials.push(e.credential);
    }
  }
  return { people, credentials };
}

export function newId(prefix: string): string {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

export function seedIfEmpty(): StoredEvent[] {
  const existing = loadEvents();
  if (existing.length > 0) return existing;
  const now = new Date().toISOString();
  const seeded: StoredEvent[] = [
    { id: newId("ev"), at: now, type: "person_added", person: { id: "p-ray", name: "Ray", phone: "", sse: true } },
    { id: newId("ev"), at: now, type: "person_added", person: { id: "p-miguel", name: "Miguel", phone: "", sse: false } },
    { id: newId("ev"), at: now, type: "credential_set", credential: { id: "c-ray-h2s", personId: "p-ray", type: "h2s", expiresOn: "2026-08-01", state: "documented" } },
    { id: newId("ev"), at: now, type: "credential_set", credential: { id: "c-mig-h2s", personId: "p-miguel", type: "h2s", expiresOn: "2027-04-15", state: "documented" } },
  ];
  window.localStorage.setItem(KEY, JSON.stringify(seeded));
  return seeded;
}

export const CARD_TYPES: { type: CredentialType; label: string }[] = [
  { type: "h2s", label: "H2S" },
  { type: "safeland", label: "SafeLand / equivalent" },
  { type: "drivers_license", label: "Driver license" },
  { type: "first_aid", label: "First aid" },
  { type: "twic", label: "TWIC" },
];

export function stateAfterPhoto(hasPhoto: boolean): CredentialState {
  return hasPhoto ? "documented" : "asserted";
}
