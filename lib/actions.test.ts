import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { exportKindFor } from "./actions";

describe("export kinds", () => {
  it("override never maps to a compliant packet", () => {
    assert.equal(
      exportKindFor({
        type: "override",
        reasonCode: "chose_to_roll",
        reasonText: "day-rate",
        swapConsidered: true,
        eligibleSwapCount: 1,
      }),
      "internal_exception_log",
    );
  });
});
