import { describe, it, expect, vi } from "vitest";
import { rollWithWildDie } from "../../modules/helpers/dice.mjs";

// Helper: mock roll function returning fixed values in sequence
function makeMockRoll(sequence) {
  const results = [...sequence];
  return vi.fn(async () => {
    const val = results.shift();
    if (val === undefined) throw new Error("Mock roll sequence exhausted");
    return val;
  });
}

// Simulate the penalty calculation used in #rollSkill / #rollAttribute / #rollAttack / #rollForceSkill:
//   penalty = (numActions - 1) + keepUpPenalty + penaltyDice
//   total   = Math.max(0, rollResult.total - penaltyPips)
async function simulateRoll({ dice, pips, numActions, keepUpPenalty, penaltyDice, penaltyPips, rollSequence }) {
  const penalty = (numActions - 1) + keepUpPenalty + penaltyDice;
  const mock = makeMockRoll(rollSequence);
  const result = await rollWithWildDie(dice, pips, penalty, mock);
  result.total = Math.max(0, result.total - penaltyPips);
  return result;
}

describe("wound penalty application to skill/attribute rolls", () => {
  describe("penaltyDice reduces dice pool", () => {
    it("1 wound mark (−1D) reduces effective dice by 1", async () => {
      // 3D base, 1D wound penalty → effective = 2D: 1 normal + 1 wild
      const result = await simulateRoll({
        dice: 3, pips: 0, numActions: 1, keepUpPenalty: 0,
        penaltyDice: 1, penaltyPips: 0,
        rollSequence: [4, 5] // normal: [4], wild: 5
      });
      expect(result.normalDice).toHaveLength(1);
      expect(result.total).toBe(9); // 4+5
    });

    it("2 incap marks (−4D) reduces effective dice by 4", async () => {
      // 5D base, 4D penalty → effective = 1D: only wild die
      const result = await simulateRoll({
        dice: 5, pips: 0, numActions: 1, keepUpPenalty: 0,
        penaltyDice: 4, penaltyPips: 0,
        rollSequence: [3] // wild only
      });
      expect(result.normalDice).toHaveLength(0);
      expect(result.total).toBe(3);
    });

    it("penalty larger than dice pool floors at 1D (only wild die)", async () => {
      // 2D base, 5D penalty → effective = max(1, 2-5) = 1D
      const result = await simulateRoll({
        dice: 2, pips: 0, numActions: 1, keepUpPenalty: 0,
        penaltyDice: 5, penaltyPips: 0,
        rollSequence: [4] // wild only
      });
      expect(result.normalDice).toHaveLength(0);
      expect(result.total).toBe(4);
    });
  });

  describe("penaltyPips subtracted from total", () => {
    it("1 stun mark (−1 pip) subtracts 1 from total", async () => {
      // 2D, wild=5, normal=3 → raw total=8, minus 1 pip → 7
      const result = await simulateRoll({
        dice: 2, pips: 0, numActions: 1, keepUpPenalty: 0,
        penaltyDice: 0, penaltyPips: 1,
        rollSequence: [3, 5]
      });
      expect(result.total).toBe(7); // 3+5−1
    });

    it("penaltyPips cannot reduce total below 0", async () => {
      // 1D, wild=1 → raw total=1, minus 5 pips → clamped to 0
      const result = await simulateRoll({
        dice: 1, pips: 0, numActions: 1, keepUpPenalty: 0,
        penaltyDice: 0, penaltyPips: 5,
        rollSequence: [1]
      });
      expect(result.total).toBe(0);
    });
  });

  describe("combined penalties stack correctly", () => {
    it("multiple actions + keepUpPenalty + penaltyDice all reduce dice pool", async () => {
      // 6D base, 2 actions (−1D), 1 kept-up power (−1D), 1 wound mark (−1D) → effective = 3D
      // 3D: 2 normal + 1 wild
      const result = await simulateRoll({
        dice: 6, pips: 0, numActions: 2, keepUpPenalty: 1,
        penaltyDice: 1, penaltyPips: 0,
        rollSequence: [3, 4, 5] // normal: [3,4], wild: 5
      });
      expect(result.normalDice).toHaveLength(2);
      expect(result.total).toBe(12); // 3+4+5
    });

    it("penaltyDice and penaltyPips both apply in same roll", async () => {
      // 3D base, 1D wound (−1D dice), 1 stun (−1 pip) → effective = 2D
      // 2D: 1 normal + 1 wild → 4+5=9, minus 1 pip → 8
      const result = await simulateRoll({
        dice: 3, pips: 0, numActions: 1, keepUpPenalty: 0,
        penaltyDice: 1, penaltyPips: 1,
        rollSequence: [4, 5]
      });
      expect(result.total).toBe(8); // 4+5−1
    });

    it("skill pips and penaltyPips interact correctly", async () => {
      // 2D+2 pips, 1 stun (−1 pip) → effective = 2D, raw = 3+5+2=10, minus 1 → 9
      const result = await simulateRoll({
        dice: 2, pips: 2, numActions: 1, keepUpPenalty: 0,
        penaltyDice: 0, penaltyPips: 1,
        rollSequence: [3, 5]
      });
      expect(result.total).toBe(9); // 3+5+2−1
    });
  });

  describe("no penalties — baseline unchanged", () => {
    it("no penalties: roll is unmodified", async () => {
      const result = await simulateRoll({
        dice: 3, pips: 1, numActions: 1, keepUpPenalty: 0,
        penaltyDice: 0, penaltyPips: 0,
        rollSequence: [2, 3, 4] // normal: [2,3], wild: 4
      });
      expect(result.total).toBe(10); // 2+3+4+1
      expect(result.normalDice).toHaveLength(2);
    });
  });
});
