import type { OverrideReasonCode } from "./domain";

export type BlockChoice =
  | { type: "swap"; toPersonId: string }
  | { type: "exception"; whoAtOperator: string; expiresAt: string }
  | {
      type: "override";
      reasonCode: OverrideReasonCode;
      reasonText: string;
      swapConsidered: boolean;
      eligibleSwapCount: number;
    }
  | { type: "false_block"; note: string }
  | { type: "cancel" };

export function exportKindFor(
  choice: BlockChoice,
): "compliant_packet" | "internal_exception_log" | "none" {
  if (choice.type === "swap" || choice.type === "exception") return "compliant_packet";
  if (choice.type === "override") return "internal_exception_log";
  return "none";
}
