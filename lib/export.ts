import type { Override } from "./domain.ts";
export type PacketKind = "compliant_packet" | "internal_exception_log";
export function assertCompliantPacketClean(input: {
  kind: PacketKind;
  overrides: Override[];
}): void {
  if (input.kind === "compliant_packet" && input.overrides.length > 0) {
    throw new Error("CONSTITUTION: compliant_packet must not contain override rows.");
  }
}
