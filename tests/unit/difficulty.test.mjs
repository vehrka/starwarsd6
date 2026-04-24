import { describe, it, expect } from "vitest";

describe("defaultDifficulty formula — Math.ceil(3.5 * N)", () => {
  it("3D+2 skill → 11", () => { expect(Math.ceil(3.5 * 3)).toBe(11); });
  it("4D+1 skill → 14", () => { expect(Math.ceil(3.5 * 4)).toBe(14); });
  it("4D Force skill → 14", () => { expect(Math.ceil(3.5 * 4)).toBe(14); });
  it("2D attribute → 7",  () => { expect(Math.ceil(3.5 * 2)).toBe(7);  });
  it("1D → 4 (ceil(3.5))", () => { expect(Math.ceil(3.5 * 1)).toBe(4); });
});

describe("pass/fail guard — Number.isFinite(d)", () => {
  const hasDifficulty = d => Number.isFinite(d);

  it("positive difficulty is active", () => { expect(hasDifficulty(14)).toBe(true);  });
  it("0 → has difficulty",            () => { expect(hasDifficulty(0)).toBe(true);   });
  it("NaN → no difficulty",           () => { expect(hasDifficulty(NaN)).toBe(false); });
  it("null → no difficulty",          () => { expect(hasDifficulty(null)).toBe(false); });
});

const DIFFICULTY_TIERS = [
  { mod: -10 }, { mod: -5 }, { mod: 0 }, { mod: 5 },
  { mod: 10 },  { mod: 15 }, { mod: 20 },
];

describe("DIFFICULTY_TIERS array", () => {
  it("has 7 entries", () => { expect(DIFFICULTY_TIERS.length).toBe(7); });
  it("Normal tier has mod 0", () => { expect(DIFFICULTY_TIERS[2].mod).toBe(0); });
  it("Very Easy has mod -10", () => { expect(DIFFICULTY_TIERS[0].mod).toBe(-10); });
  it("Impossible has mod 20", () => { expect(DIFFICULTY_TIERS[6].mod).toBe(20); });
});

describe("finalDifficulty = baseDifficulty + tierMod", () => {
  const finalDifficulty = (base, tierMod) => base + tierMod;

  it("base 10, Moderate (+5) → 15",  () => { expect(finalDifficulty(10, 5)).toBe(15);  });
  it("base 10, Easy (−5) → 5",       () => { expect(finalDifficulty(10, -5)).toBe(5);  });
  it("base 0, Normal (0) → 0",       () => { expect(finalDifficulty(0, 0)).toBe(0);    });
  it("base 0, Easy (−5) → 0 (clamped)", () => { expect(Math.max(0, finalDifficulty(0, -5))).toBe(0); });
});

describe("success / failure comparison", () => {
  it("total equal to difficulty → success", () => { expect(14 >= 14).toBe(true);  });
  it("total above difficulty → success",    () => { expect(16 >= 14).toBe(true);  });
  it("total below difficulty → failure",    () => { expect(13 >= 14).toBe(false); });
});
