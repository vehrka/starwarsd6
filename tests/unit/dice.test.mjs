import { describe, it, expect, vi } from "vitest";
import { rollWithWildDie } from "../../modules/helpers/dice.mjs";

// Helper: create a mock roll function that returns values from a sequence
function makeMockRoll(sequence) {
  const results = [...sequence];
  return vi.fn(async () => {
    const val = results.shift();
    if (val === undefined) throw new Error("Mock roll sequence exhausted");
    return val;
  });
}

describe("rollWithWildDie()", () => {
  describe("basic rolls (no penalty, no explosion, no complication)", () => {
    it("rolls (effective-1) normal dice + 1 wild die", async () => {
      // dice=3, effective=3: 2 normal + 1 wild
      const mock = makeMockRoll([3, 4, 5]); // normal: 3,4 | wild: 5
      const result = await rollWithWildDie(3, 0, 0, mock);
      expect(mock).toHaveBeenCalledTimes(3);
      expect(result.normalDice).toEqual([3, 4]);
      expect(result.wildRolls).toEqual([5]);
      expect(result.total).toBe(12); // 3+4+5+0
      expect(result.isComplication).toBe(false);
    });

    it("adds pips to total", async () => {
      const mock = makeMockRoll([3, 4]); // normal: 3 | wild: 4
      const result = await rollWithWildDie(2, 2, 0, mock);
      expect(result.total).toBe(9); // 3+4+2
      expect(result.pips).toBe(2);
    });

    it("1D (dice=1): only wild die rolls, no normal dice", async () => {
      const mock = makeMockRoll([4]); // wild only
      const result = await rollWithWildDie(1, 0, 0, mock);
      expect(mock).toHaveBeenCalledTimes(1);
      expect(result.normalDice).toEqual([]);
      expect(result.wildRolls).toEqual([4]);
      expect(result.total).toBe(4);
    });
  });

  describe("wild die = 1 (complication)", () => {
    it("sets isComplication=true when wild die is 1", async () => {
      const mock = makeMockRoll([3, 1]); // normal: 3 | wild: 1
      const result = await rollWithWildDie(2, 0, 0, mock);
      expect(result.isComplication).toBe(true);
      expect(result.wildRolls).toEqual([1]);
      expect(result.total).toBe(4); // 3+1+0 = 4 (add 1 normally per house rule)
    });

    it("complication on 1D: wild die only, total=1", async () => {
      const mock = makeMockRoll([1]);
      const result = await rollWithWildDie(1, 0, 0, mock);
      expect(result.isComplication).toBe(true);
      expect(result.total).toBe(1);
    });
  });

  describe("wild die = 6 (explosion / chain)", () => {
    it("chains when wild die shows 6, stops on non-6", async () => {
      // dice=3: normal=[3,4], wild chain=[6,6,3]
      const mock = makeMockRoll([3, 4, 6, 6, 3]);
      const result = await rollWithWildDie(3, 0, 0, mock);
      expect(result.wildRolls).toEqual([6, 6, 3]);
      expect(result.total).toBe(3 + 4 + 6 + 6 + 3 + 0); // 22
      expect(result.isComplication).toBe(false);
    });

    it("single explosion: wild=6 then non-6", async () => {
      const mock = makeMockRoll([2, 6, 4]); // normal:2, wild:6→4
      const result = await rollWithWildDie(2, 0, 0, mock);
      expect(result.wildRolls).toEqual([6, 4]);
      expect(result.total).toBe(2 + 6 + 4); // 12
    });

    it("isComplication is false when wild starts with 6 (not 1)", async () => {
      const mock = makeMockRoll([6, 3]); // 1D: wild=6→3
      const result = await rollWithWildDie(1, 0, 0, mock);
      expect(result.isComplication).toBe(false);
    });
  });

  describe("multiple action penalty", () => {
    it("reduces effective dice by penalty (2 actions = -1D)", async () => {
      // dice=3, penalty=1, effective=2: 1 normal + 1 wild
      const mock = makeMockRoll([4, 5]);
      const result = await rollWithWildDie(3, 0, 1, mock);
      expect(mock).toHaveBeenCalledTimes(2);
      expect(result.normalDice).toEqual([4]);
      expect(result.wildRolls).toEqual([5]);
    });

    it("effective minimum is 1 (only wild die) even with heavy penalty", async () => {
      // dice=2, penalty=5, effective=max(1,2-5)=1: 0 normal + 1 wild
      const mock = makeMockRoll([4]);
      const result = await rollWithWildDie(2, 0, 5, mock);
      expect(mock).toHaveBeenCalledTimes(1);
      expect(result.normalDice).toEqual([]);
      expect(result.wildRolls).toEqual([4]);
    });

    it("penalty=0 (1 action) produces no reduction", async () => {
      const mock = makeMockRoll([3, 4, 5]); // dice=3, penalty=0
      const result = await rollWithWildDie(3, 0, 0, mock);
      expect(result.normalDice).toHaveLength(2);
    });
  });
});
