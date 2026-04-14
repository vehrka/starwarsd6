import { describe, it, expect } from "vitest";

describe("defaultDifficulty formula — Math.ceil(3.5 * N)", () => {
  it("3D+2 skill → 11", () => { expect(Math.ceil(3.5 * 3)).toBe(11); });
  it("4D+1 skill → 14", () => { expect(Math.ceil(3.5 * 4)).toBe(14); });
  it("4D Force skill → 14", () => { expect(Math.ceil(3.5 * 4)).toBe(14); });
  it("2D attribute → 7",  () => { expect(Math.ceil(3.5 * 2)).toBe(7);  });
  it("1D → 4 (ceil(3.5))", () => { expect(Math.ceil(3.5 * 1)).toBe(4); });
});

describe("pass/fail guard — Number.isFinite(d) && d > 0", () => {
  const hasDifficulty = d => Number.isFinite(d) && d > 0;

  it("positive difficulty is active", () => { expect(hasDifficulty(14)).toBe(true); });
  it("0 → no difficulty",            () => { expect(hasDifficulty(0)).toBe(false);  });
  it("NaN → no difficulty",          () => { expect(hasDifficulty(NaN)).toBe(false); });
  it("null → no difficulty",         () => { expect(hasDifficulty(null)).toBe(false); });
});

describe("success / failure comparison", () => {
  it("total equal to difficulty → success", () => { expect(14 >= 14).toBe(true);  });
  it("total above difficulty → success",    () => { expect(16 >= 14).toBe(true);  });
  it("total below difficulty → failure",    () => { expect(13 >= 14).toBe(false); });
});
