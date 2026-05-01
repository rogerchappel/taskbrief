import { describe, expect, it } from "vitest";

import { validateWave1Policy, wave1TurnTakingPolicy, wave1TurnTransitions } from "../../src/voice/turnTaking.js";

describe("wave1TurnTakingPolicy", () => {
  it("satisfies timing and threshold invariants", () => {
    expect(validateWave1Policy(wave1TurnTakingPolicy)).toEqual([]);
  });

  it("covers the main conversational lifecycle", () => {
    expect(wave1TurnTransitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "idle", event: "ptt.down", to: "arming" }),
        expect.objectContaining({ from: "user_hold", event: "timeout", to: "thinking" }),
        expect.objectContaining({ from: "assistant_preparing", event: "output.started", to: "assistant_speaking" }),
        expect.objectContaining({ from: "assistant_ducked", event: "output.interrupted", to: "interrupted" }),
      ]),
    );
  });
});
