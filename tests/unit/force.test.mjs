import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateForceDiceBonus, applyDarkSidePoint } from "../../modules/helpers/force.mjs";

// ──────────────────────────────────────────────────────────────────────────────
// calculateForceDiceBonus
// ──────────────────────────────────────────────────────────────────────────────
describe("calculateForceDiceBonus()", () => {
  it("dsp=0 → no bonus", () => {
    expect(calculateForceDiceBonus(0)).toEqual({ bonusDice: 0, bonusPips: 0 });
  });

  it("dsp=-1 → no bonus (negative treated as 0)", () => {
    expect(calculateForceDiceBonus(-1)).toEqual({ bonusDice: 0, bonusPips: 0 });
  });

  it("dsp=1 → +0D+2 pips (2 pips, no full die)", () => {
    expect(calculateForceDiceBonus(1)).toEqual({ bonusDice: 0, bonusPips: 2 });
  });

  it("dsp=2 → +1D+1 pip (4 pips normalized: 1D+1pip)", () => {
    expect(calculateForceDiceBonus(2)).toEqual({ bonusDice: 1, bonusPips: 1 });
  });

  it("dsp=3 → +3D+0 pips", () => {
    expect(calculateForceDiceBonus(3)).toEqual({ bonusDice: 3, bonusPips: 0 });
  });

  it("dsp=5 → +5D+0 pips", () => {
    expect(calculateForceDiceBonus(5)).toEqual({ bonusDice: 5, bonusPips: 0 });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// applyDarkSidePoint
// ──────────────────────────────────────────────────────────────────────────────
describe("applyDarkSidePoint()", () => {
  function makeActor(darkSidePoints = 0) {
    return {
      system: { darkSidePoints },
      update: vi.fn().mockResolvedValue(undefined)
    };
  }

  beforeEach(() => {
    globalThis.ChatMessage = {
      getSpeaker: vi.fn().mockReturnValue({}),
      create: vi.fn().mockResolvedValue(undefined)
    };
  });

  it("calls actor.update with incremented darkSidePoints", async () => {
    const actor = makeActor(2);
    const rollFn = vi.fn().mockResolvedValue(5);
    await applyDarkSidePoint(actor, rollFn);
    expect(actor.update).toHaveBeenCalledOnce();
    expect(actor.update).toHaveBeenCalledWith({ "system.darkSidePoints": 3 });
  });

  it("always calls ChatMessage.create exactly once", async () => {
    const actor = makeActor(1);
    const rollFn = vi.fn().mockResolvedValue(5);
    await applyDarkSidePoint(actor, rollFn);
    expect(ChatMessage.create).toHaveBeenCalledOnce();
  });

  it("when rolled < newDsp → chat content includes 'consumed'", async () => {
    const actor = makeActor(2); // newDsp = 3, roll = 2 → 2 < 3 → consumed
    const rollFn = vi.fn().mockResolvedValue(2);
    await applyDarkSidePoint(actor, rollFn);
    const content = ChatMessage.create.mock.calls[0][0].content;
    expect(content).toMatch(/consumed/i);
  });

  it("when rolled >= newDsp → chat content includes 'resisted'", async () => {
    const actor = makeActor(2); // newDsp = 3, roll = 4 → 4 >= 3 → resisted
    const rollFn = vi.fn().mockResolvedValue(4);
    await applyDarkSidePoint(actor, rollFn);
    const content = ChatMessage.create.mock.calls[0][0].content;
    expect(content).toMatch(/resisted/i);
  });

  it("when rolled === newDsp → chat content includes 'resisted' (not consumed)", async () => {
    const actor = makeActor(2); // newDsp = 3, roll = 3 → 3 >= 3 → resisted
    const rollFn = vi.fn().mockResolvedValue(3);
    await applyDarkSidePoint(actor, rollFn);
    const content = ChatMessage.create.mock.calls[0][0].content;
    expect(content).toMatch(/resisted/i);
  });

  it("actor.update called exactly once", async () => {
    const actor = makeActor(0);
    const rollFn = vi.fn().mockResolvedValue(1);
    await applyDarkSidePoint(actor, rollFn);
    expect(actor.update).toHaveBeenCalledOnce();
  });
});
