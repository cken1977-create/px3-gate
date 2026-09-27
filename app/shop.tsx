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

  function evFor(personId: string) {
    return evaluateGate({
      assignment: { ...demoAssignment, personId },
      pack: demoPack,
      credentials: credentials.filter((c) => c.personId === personId),
      clock: {
        nowIso: new Date().toISOString(),
        deviceTime: new Date().toISOString(),
        lastServerTime: new Date().toISOString(),
        skewMs: 0,
      },
      eligibleSwapCount: people.filter((p) => p.id !== personId).length,
    });
  }

  const evaluation = selected ? evFor(selected.id) : null;
  const blocked = people.filter((p) => {
    const r = evFor(p.id).result;
    return r === "blocked" || r === "unknown";
  }).length;

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

  return (
    <main className="px-4 pb-8">
      <header className="mb-8">
        <p>PX3 Shop</p>
        <h1>Crew wallet</h1>
        <p className="mt-2 text-sm text-stone-500">Owner device. Events stay in this browser.</p>
        <dl className="yk-meter">
          <div><dt>Pack</dt><dd>v{demoPack.version} asserted</dd></div>
          <div><dt>Cabinet</dt><dd>{people.length} hands</dd></div>
          <div><dt>Gate</dt><dd>{blocked} blocked</dd></div>
          <div><dt>Stage</dt><dd>seed</dd></div>
        </dl>
      </header>

      <section className="mb-8 flex flex-col gap-2">
        <h2 className="text-xl">Hands</h2>
        {people.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId(p.id)}
            className={p.id === selected?.id ? "yk-row yk-row-on" : "yk-row"}
          >
            <span>{p.name}{p.sse ? " · SSE" : ""}</span>
            <span className="yk-pill">{evFor(p.id).result}</span>
          </button>
        ))}
      </section>

      <section className="mb-8 flex flex-col gap-2">
        <h2 className="text-xl">Add hand</h2>
        <input className="min-h-12 rounded border px-3" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="min-h-12 rounded border px-3" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-stone-500">
          <input type="checkbox" checked={sse} onChange={(e) => setSse(e.target.checked)} />
          Short service employee
        </label>
        <button type="button" className="px-gold min-h-12 rounded-lg px-4 text-left" onClick={addPerson}>Save hand</button>
      </section>

      {selected ? (
        <section className="mb-8 flex flex-col gap-2">
          <h2 className="text-xl">Card for {selected.name}</h2>
          <select className="min-h-12 rounded border px-3" value={cardType} onChange={(e) => setCardType(e.target.value as CredentialType)}>
            {CARD_TYPES.map((c) => <option key={c.type} value={c.type}>{c.label}</option>)}
          </select>
          <input type="date" className="min-h-12 rounded border px-3" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-stone-500">
            <input type="checkbox" checked={hasPhoto} onChange={(e) => setHasPhoto(e.target.checked)} />
            Photo of card (documented). Off = asserted.
          </label>
          <button type="button" className="yk-row min-h-12 px-4 text-left" onClick={saveCard}>Save card</button>
          <ul className="text-sm text-stone-500">
            {selectedCreds.map((c) => <li key={c.id}>{c.type} · {c.state} · {c.expiresOn ?? "no expiry"}</li>)}
          </ul>
        </section>
      ) : null}

      {evaluation && selected && (evaluation.result === "ok" || evaluation.result === "expiring") ? (
        <section className="bg-emerald-50 rounded-lg border p-4">
          <p className="serif text-2xl">{selected.name} can roll</p>
        </section>
      ) : null}

      {evaluation && selected && evaluation.result !== "ok" && evaluation.result !== "expiring" ? (
        <BlockScreen
          evaluation={evaluation}
          people={people.map((p) => ({ id: p.id, name: p.name }))}
          assignedPersonId={selected.id}
          jobLine="Lease 14 / sour · owner-asserted pack"
          packLine={"Pack " + demoPack.id + " v" + demoPack.version}
        />
      ) : null}
    </main>
  );
}
