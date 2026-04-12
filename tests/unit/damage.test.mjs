import { describe, it, expect, vi } from "vitest";
import {
  calculateDamageThresholds,
  resolveDamageTier,
  applyDamage
} from "../../modules/helpers/damage.mjs";

/**
 * Build a mock actor for applyDamage tests.
 */
function makeActor(system = {}) {
  const actor = {
    system: {
      hitBoxes: 3,
      stunMarks: 0,
      woundMarks: 0,
      incapMarks: 0,
      mortalMarks: 0,
      ...system
    },
    update: vi.fn().mockResolvedValue(undefined)
  };
  return actor;
}

// ──────────────────────────────────────────────────────────────────────────────
// calculateDamageThresholds
// ──────────────────────────────────────────────────────────────────────────────
describe("calculateDamageThresholds()", () => {
  it("base = floor(3.5 * strDice) + strPips for 3D+0", () => {
    expect(calculateDamageThresholds(3, 0)).toEqual({ base: 10 }); // floor(10.5) = 10
  });

  it("adds pips: 3D+2 → floor(10.5)+2 = 12", () => {
    expect(calculateDamageThresholds(3, 2)).toEqual({ base: 12 });
  });

  it("1D+0 → floor(3.5) = 3", () => {
    expect(calculateDamageThresholds(1, 0)).toEqual({ base: 3 });
  });

  it("2D+1 → floor(7)+1 = 8", () => {
    expect(calculateDamageThresholds(2, 1)).toEqual({ base: 8 });
  });

  it("4D+2 → floor(14)+2 = 16", () => {
    expect(calculateDamageThresholds(4, 2)).toEqual({ base: 16 });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// resolveDamageTier
// ──────────────────────────────────────────────────────────────────────────────
describe("resolveDamageTier()", () => {
  // base = 10 (3D STR)
  const base = 10;

  it("below base → stun", () => {
    expect(resolveDamageTier(9, base)).toBe("stun");
    expect(resolveDamageTier(0, base)).toBe("stun");
  });

  it("at base → wound", () => {
    expect(resolveDamageTier(10, base)).toBe("wound");
  });

  it("between base and 2*base → wound", () => {
    expect(resolveDamageTier(15, base)).toBe("wound");
    expect(resolveDamageTier(19, base)).toBe("wound");
  });

  it("at 2*base → incap", () => {
    expect(resolveDamageTier(20, base)).toBe("incap");
  });

  it("between 2*base and 3*base → incap", () => {
    expect(resolveDamageTier(25, base)).toBe("incap");
    expect(resolveDamageTier(29, base)).toBe("incap");
  });

  it("at 3*base → mortal", () => {
    expect(resolveDamageTier(30, base)).toBe("mortal");
  });

  it("above 3*base → mortal", () => {
    expect(resolveDamageTier(50, base)).toBe("mortal");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// applyDamage — basic marking
// ──────────────────────────────────────────────────────────────────────────────
describe("applyDamage() — basic marking", () => {
  it("increments stunMarks by 1", async () => {
    const actor = makeActor({ hitBoxes: 3, stunMarks: 0 });
    await applyDamage(actor, "stun");
    expect(actor.update).toHaveBeenCalledOnce();
    expect(actor.update).toHaveBeenCalledWith(expect.objectContaining({
      "system.stunMarks": 1
    }));
  });

  it("increments woundMarks by 1", async () => {
    const actor = makeActor({ hitBoxes: 3, woundMarks: 1 });
    await applyDamage(actor, "wound");
    expect(actor.update).toHaveBeenCalledWith(expect.objectContaining({
      "system.woundMarks": 2
    }));
  });

  it("increments incapMarks by 1", async () => {
    const actor = makeActor({ hitBoxes: 3 });
    await applyDamage(actor, "incap");
    expect(actor.update).toHaveBeenCalledWith(expect.objectContaining({
      "system.incapMarks": 1
    }));
  });

  it("increments mortalMarks by 1", async () => {
    const actor = makeActor({ hitBoxes: 3 });
    await applyDamage(actor, "mortal");
    expect(actor.update).toHaveBeenCalledWith(expect.objectContaining({
      "system.mortalMarks": 1
    }));
  });

  it("calls actor.update() exactly once", async () => {
    const actor = makeActor({ hitBoxes: 3 });
    await applyDamage(actor, "stun");
    expect(actor.update).toHaveBeenCalledOnce();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// applyDamage — overflow cascade
// ──────────────────────────────────────────────────────────────────────────────
describe("applyDamage() — overflow cascade", () => {
  it("stun overflow: filling last stun box cascades to wound", async () => {
    // hitBoxes=3, stunMarks=2 → adding 1 stun → stunMarks reaches 3 → cascade to wound
    const actor = makeActor({ hitBoxes: 3, stunMarks: 2, woundMarks: 0 });
    await applyDamage(actor, "stun");
    const call = actor.update.mock.calls[0][0];
    expect(call["system.stunMarks"]).toBe(3);
    expect(call["system.woundMarks"]).toBe(1);
  });

  it("wound overflow: filling last wound box cascades to incap", async () => {
    const actor = makeActor({ hitBoxes: 3, woundMarks: 2, incapMarks: 0 });
    await applyDamage(actor, "wound");
    const call = actor.update.mock.calls[0][0];
    expect(call["system.woundMarks"]).toBe(3);
    expect(call["system.incapMarks"]).toBe(1);
  });

  it("incap overflow: filling last incap box cascades to mortal", async () => {
    const actor = makeActor({ hitBoxes: 3, incapMarks: 2, mortalMarks: 0 });
    await applyDamage(actor, "incap");
    const call = actor.update.mock.calls[0][0];
    expect(call["system.incapMarks"]).toBe(3);
    expect(call["system.mortalMarks"]).toBe(1);
  });

  it("chain cascade: stun overflow fills wound which cascades to incap", async () => {
    // hitBoxes=2, stunMarks=1, woundMarks=1 → stun+1=2 (overflow) → wound+1=2 (overflow) → incap+1
    const actor = makeActor({ hitBoxes: 2, stunMarks: 1, woundMarks: 1, incapMarks: 0 });
    await applyDamage(actor, "stun");
    const call = actor.update.mock.calls[0][0];
    expect(call["system.stunMarks"]).toBe(2);
    expect(call["system.woundMarks"]).toBe(2);
    expect(call["system.incapMarks"]).toBe(1);
  });

  it("mortalMarks capped at hitBoxes", async () => {
    const actor = makeActor({ hitBoxes: 3, mortalMarks: 3 });
    await applyDamage(actor, "mortal");
    const call = actor.update.mock.calls[0][0];
    expect(call["system.mortalMarks"]).toBe(3); // capped, not 4
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// applyDamage — invalid tier
// ──────────────────────────────────────────────────────────────────────────────
describe("applyDamage() — invalid tier", () => {
  it("throws for unknown tier", async () => {
    const actor = makeActor();
    await expect(applyDamage(actor, "unknown")).rejects.toThrow('applyDamage: unknown tier "unknown"');
  });
});
