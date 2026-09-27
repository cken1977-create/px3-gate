"use client";

import { useMemo, useState } from "react";
import type { BlockChoice } from "../lib/actions";
import { exportKindFor } from "../lib/actions";
import type { GateEvaluation, OverrideReasonCode } from "../lib/domain";

type Person = { id: string; name: string };

const REASONS: { code: OverrideReasonCode; label: string }[] = [
  { code: "pack_wrong", label: "Pack is wrong — they don't actually need this" },
  { code: "cert_in_progress", label: "Card is in progress — class scheduled" },
  { code: "operator_verbally_ok_unrecorded", label: "Company man said OK (not written yet)" },
  { code: "chose_to_roll", label: "I know. I'm rolling him anyway" },
];

type Panel = "menu" | "swap" | "exception" | "override" | "false_block";

export function BlockScreen(props: {
  evaluation: GateEvaluation;
  people: Person[];
  assignedPersonId: string;
  jobLine: string;
  packLine: string;
}) {
  const [panel, setPanel] = useState<Panel>("menu");
  const [log, setLog] = useState<string | null>(null);
  const assigned = props.people.find((p) => p.id === props.assignedPersonId);
  const swaps = useMemo(
    () => props.people.filter((p) => p.id !== props.assignedPersonId),
    [props.people, props.assignedPersonId],
  );

  function commit(choice: BlockChoice) {
    const exportKind = exportKindFor(choice);
    setLog(JSON.stringify({
      choice,
      export: exportKind,
      evaluation: props.evaluation.result,
      note:
        exportKind === "internal_exception_log"
          ? "Will not appear on a compliant packet."
          : exportKind === "compliant_packet"
            ? "May appear on a compliant packet."
            : "No packet.",
    }, null, 2));
    setPanel("menu");
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-widest text-stone-500">PX3 GATE</p>
        <h1 className="text-2xl font-semibold text-stone-900">
          {assigned?.name ?? "Hand"} cannot roll
        </h1>
        <p className="text-stone-600">{props.jobLine}</p>
      </header>

      <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        This pack is what you said this operator wants. It is not the operator’s list. {props.packLine}
      </p>

      <ul className="flex flex-col gap-1 text-sm text-stone-800">
        {props.evaluation.reasons.map((r) => (
          <li key={r.code + r.detail}>
            <span className="font-medium uppercase">{r.code}</span>
            {" — "}
            {r.detail}
          </li>
        ))}
      </ul>

      {panel === "menu" ? (
        <div className="flex flex-col gap-2">
          <button type="button" className="min-h-12 rounded-lg border border-stone-900 bg-stone-900 px-4 py-3 text-left text-white" onClick={() => setPanel("swap")}>
            Swap hand ({props.evaluation.eligibleSwapCount} current)
          </button>
          <button type="button" className="min-h-12 rounded-lg border border-stone-900 bg-stone-900 px-4 py-3 text-left text-white" onClick={() => setPanel("exception")}>
            Operator exception
          </button>
          <button type="button" className="min-h-12 rounded-lg border border-red-800 bg-red-800 px-4 py-3 text-left text-white" onClick={() => setPanel("override")}>
            Override — dirty record, not a clean ticket
          </button>
          <button type="button" className="min-h-12 rounded-lg border border-stone-900 bg-stone-900 px-4 py-3 text-left text-white" onClick={() => setPanel("false_block")}>
            This is wrong — his card is current
          </button>
          <button type="button" className="min-h-12 rounded-lg border border-stone-300 bg-white px-4 py-3 text-left" onClick={() => commit({ type: "cancel" })}>
            Cancel assignment
          </button>
        </div>
      ) : null}

      {panel === "swap" ? (
        <div className="flex flex-col gap-3">
          <button type="button" className="text-left text-sm text-stone-500" onClick={() => setPanel("menu")}>Back</button>
          <h2 className="text-lg font-semibold">Who is current for this pack?</h2>
          {swaps.map((p) => (
            <button key={p.id} type="button" className="min-h-12 rounded-lg border border-stone-900 bg-stone-900 px-4 py-3 text-left text-white" onClick={() => commit({ type: "swap", toPersonId: p.id })}>
              Send {p.name} instead
            </button>
          ))}
        </div>
      ) : null}

      {panel === "exception" ? (
        <ExceptionForm onBack={() => setPanel("menu")} onSave={(whoAtOperator, expiresAt) => commit({ type: "exception", whoAtOperator, expiresAt })} />
      ) : null}

      {panel === "override" ? (
        <OverrideForm eligibleSwapCount={props.evaluation.eligibleSwapCount} onBack={() => setPanel("menu")} onSave={(choice) => commit(choice)} />
      ) : null}

      {panel === "false_block" ? (
        <div className="flex flex-col gap-3">
          <button type="button" className="text-left text-sm text-stone-500" onClick={() => setPanel("menu")}>Back</button>
          <h2 className="text-lg font-semibold">Fix the credential record</h2>
          <p className="text-sm text-stone-600">Writes PackFailure(false_block). Card editor is stubbed.</p>
          <button type="button" className="min-h-12 rounded-lg border border-stone-900 bg-stone-900 px-4 py-3 text-left text-white" onClick={() => commit({ type: "false_block", note: "Owner says card is current" })}>
            Mark false block and open Ray’s H2S card
          </button>
        </div>
      ) : null}

      {log ? <pre className="overflow-auto rounded-lg bg-stone-900 p-3 text-xs text-stone-100">{log}</pre> : null}
    </div>
  );
}

function ExceptionForm(props: { onBack: () => void; onSave: (who: string, expiresAt: string) => void }) {
  const [who, setWho] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <button type="button" className="text-left text-sm text-stone-500" onClick={props.onBack}>Back</button>
      <h2 className="text-lg font-semibold">Written operator exception</h2>
      <input className="min-h-12 rounded border border-stone-300 px-3" placeholder="Who at the operator said yes" value={who} onChange={(e) => setWho(e.target.value)} />
      <input type="date" className="min-h-12 rounded border border-stone-300 px-3" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      <button type="button" className="min-h-12 rounded-lg border border-stone-900 bg-stone-900 px-4 py-3 text-left text-white" onClick={() => who && expiresAt && props.onSave(who, expiresAt)}>
        Record exception
      </button>
    </div>
  );
}

function OverrideForm(props: {
  eligibleSwapCount: number;
  onBack: () => void;
  onSave: (choice: Extract<BlockChoice, { type: "override" }>) => void;
}) {
  const [code, setCode] = useState<OverrideReasonCode>("chose_to_roll");
  const [text, setText] = useState("");
  const [pin, setPin] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <button type="button" className="text-left text-sm text-stone-500" onClick={props.onBack}>Back</button>
      <h2 className="text-lg font-semibold">Override — dirty document</h2>
      <p className="text-sm text-red-800">This will never print on a compliant packet.</p>
      {REASONS.map((r) => (
        <label key={r.code} className="flex items-start gap-2 text-sm">
          <input type="radio" name="reason" checked={code === r.code} onChange={() => setCode(r.code)} />
          {r.label}
        </label>
      ))}
      <textarea className="min-h-20 rounded border border-stone-300 p-2 text-sm" placeholder="What happened" value={text} onChange={(e) => setText(e.target.value)} />
      <input inputMode="numeric" className="min-h-12 rounded border border-stone-300 px-3" placeholder="Owner PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
      <button
        type="button"
        className="min-h-12 rounded-lg border border-red-800 bg-red-800 px-4 py-3 text-left text-white"
        onClick={() => {
          if (pin.length < 4 || !text.trim()) return;
          props.onSave({
            type: "override",
            reasonCode: code,
            reasonText: text.trim(),
            swapConsidered: props.eligibleSwapCount > 0,
            eligibleSwapCount: props.eligibleSwapCount,
          });
        }}
      >
        Record override
      </button>
    </div>
  );
}
