"use client";

import { useEffect, useMemo, useState } from "react";
import { BlockScreen } from "./block-screen";
import { evaluateGate } from "../lib/gate";
import type { CredentialType } from "../lib/domain";
import {
  appendEvent,
  CARD_TYPES,
  loadEvents,
  newId,
  replay,
  seedIfEmpty,
  stateAfterPhoto,
  type PersonRecord,
} from "../lib/store";
import { demoAssignment, demoPack } from "../lib/demo-scenario";

export function Shop() {
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [credentials, setCredentials] = useState<ReturnType<typeof replay>["credentials"]>([]);
  const [selectedId, setSelectedId] = useState("p-ray");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sse, setSse] = useState(false);
  const [cardType, setCardType] = useState<CredentialType>("h2s");
  const [expiresOn, setExpiresOn] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);

  function refresh() {
    const snap = replay(loadEvents());
    setPeople(snap.people);
    setCredentials(snap.credentials);
  }

  useEffect(() => {
    seedIfEmpty();
    refresh();
  }, []);

  const selected = people.find((p) => p.id === selectedId) ?? people[0];
  const selectedCreds = credentials.filter((c) => c.personId === selected?.id);

  const evaluation = useMemo(() => {
    if (!selected) return null;
    return evaluateGate({
      assignment: { ...demoAssignment, personId: selected.id },
      pack: demoPack,
      credentials: selectedCreds,
      clock: {
        nowIso: new Date().toISOString(),
        deviceTime: new Date().toISOString(),
        lastServerTime: new Date().toISOString(),
        skewMs: 0,
      },
      eligibleSwapCount: people.filter((p) => p.id !== selected.id).length,
    });
  }, [selected, selectedCreds, people]);

  function addPerson() {
    if (!name.trim()) return;
    const person: PersonRecord = { id: newId("p"), name: name.trim(), phone: phone.trim(), sse };
    appendEvent({ id: newId("ev"), at: new Date().toISOString(), type: "person_added", person });
    setName("");
    setPhone("");
    setSse(false);
    setSelectedId(person.id);
    refresh();
  }

  function saveCard() {
    if (!selected || !expiresOn) return;
    appendEvent({
      id: newId("ev"),
      at: new Date().toISOString(),
      type: "credential_set",
      credential: {
        id: newId("c"),
        personId: selected.id,
        type: cardType,
        expiresOn,
        state: stateAfterPhoto(hasPhoto),
      },
    });
    setHasPhoto(false);
    refresh();
  }

  const swaps = people.map((p) => ({ id: p.id, name: p.name }));

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col gap-8 px-4 py-10">
      <header>
        <p className="text-xs font-semibold tracking-widest text-stone-500">PX3 SHOP</p>
        <h1 className="text-2xl font-semibold">Crew wallet</h1>
        <p className="text-sm text-stone-600">Owner device. Events in this browser.</p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Hands</h2>
        {people.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId(p.id)}
            className={`min-h-12 rounded-lg border px-4 py-3 text-left ${p.id === selected?.id ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white"}`}
          >
            {p.name}{p.sse ? " · SSE" : ""}
          </button>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Add hand</h2>
        <input className="min-h-12 rounded border border-stone-300 px-3" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="min-h-12 rounded border border-stone-300 px-3" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sse} onChange={(e) => setSse(e.target.checked)} />
          Short service employee
        </label>
        <p className="text-xs text-stone-500">W-9 can wait.</p>
        <button type="button" className="min-h-12 rounded-lg bg-stone-900 px-4 text-left text-white" onClick={addPerson}>Save hand</button>
      </section>

      {selected ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Card for {selected.name}</h2>
          <select className="min-h-12 rounded border border-stone-300 px-3" value={cardType} onChange={(e) => setCardType(e.target.value as CredentialType)}>
            {CARD_TYPES.map((c) => (
              <option key={c.type} value={c.type}>{c.label}</option>
            ))}
          </select>
          <input type="date" className="min-h-12 rounded border border-stone-300 px-3" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasPhoto} onChange={(e) => setHasPhoto(e.target.checked)} />
            Photo of card (documented). Off = asserted.
          </label>
          <button type="button" className="min-h-12 rounded-lg bg-stone-900 px-4 text-left text-white" onClick={saveCard}>Save card</button>
          <ul className="text-sm text-stone-700">
            {selectedCreds.map((c) => (
              <li key={c.id}>{c.type} · {c.state} · {c.expiresOn ?? "no expiry"}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {evaluation && selected && (evaluation.result === "ok" || evaluation.result === "expiring") ? (
        <section className="rounded-lg border border-emerald-700 bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-950">{selected.name} can roll</p>
        </section>
      ) : null}

      {evaluation && selected && evaluation.result !== "ok" && evaluation.result !== "expiring" ? (
        <BlockScreen
          evaluation={evaluation}
          people={swaps}
          assignedPersonId={selected.id}
          jobLine="Lease 14 / sour · Example operator (owner-asserted pack)"
          packLine={"Pack " + demoPack.id + " v" + demoPack.version}
        />
      ) : null}
    </main>
  );
}
