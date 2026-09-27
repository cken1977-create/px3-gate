import { evaluateGate } from "../lib/gate.ts";
import {
  demoAssignment,
  demoCredentials,
  demoPack,
  demoPeople,
} from "../lib/demo-scenario.ts";
import { BlockScreen } from "./block-screen";

export default function Home() {
  const evaluation = evaluateGate({
    assignment: demoAssignment,
    pack: demoPack,
    credentials: demoCredentials["p-ray"] ?? [],
    clock: {
      nowIso: "2026-09-27T12:00:00.000Z",
      deviceTime: "2026-09-27T12:00:00.000Z",
      lastServerTime: "2026-09-27T12:00:00.000Z",
      skewMs: 0,
    },
    eligibleSwapCount: 1,
  });

  return (
    <main className="mx-auto min-h-full max-w-lg px-4 py-10">
      <BlockScreen
        evaluation={evaluation}
        people={demoPeople}
        assignedPersonId="p-ray"
        jobLine="Lease 14 / sour · Example operator (owner-asserted pack)"
        packLine={"Pack " + demoPack.id + " v" + demoPack.version}
      />
    </main>
  );
}
