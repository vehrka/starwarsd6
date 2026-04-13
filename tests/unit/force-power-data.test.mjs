import { describe, it, expect } from "vitest";
import ForcePowerData from "../../modules/items/force-power-data.mjs";

function schema() {
  return ForcePowerData.defineSchema();
}

describe("ForcePowerData.defineSchema()", () => {
  it("has all nine required fields", () => {
    const s = schema();
    expect(s).toHaveProperty("controlDifficulty");
    expect(s).toHaveProperty("senseDifficulty");
    expect(s).toHaveProperty("alterDifficulty");
    expect(s).toHaveProperty("requiredPowers");
    expect(s).toHaveProperty("canKeepUp");
    expect(s).toHaveProperty("keptUp");
    expect(s).toHaveProperty("darkSideWarning");
    expect(s).toHaveProperty("timeToUse");
    expect(s).toHaveProperty("effect");
  });

  it("has exactly nine fields", () => {
    expect(Object.keys(schema())).toHaveLength(9);
  });

  it("string fields have blank: true (empty string allowed)", () => {
    const s = schema();
    for (const key of ["controlDifficulty", "senseDifficulty", "alterDifficulty",
                        "requiredPowers", "timeToUse", "effect"]) {
      expect(s[key].blank).toBe(true);
    }
  });

  it("string fields have initial: ''", () => {
    const s = schema();
    for (const key of ["controlDifficulty", "senseDifficulty", "alterDifficulty",
                        "requiredPowers", "timeToUse", "effect"]) {
      expect(s[key].initial).toBe("");
    }
  });

  it("boolean fields have initial: false", () => {
    const s = schema();
    for (const key of ["canKeepUp", "keptUp", "darkSideWarning"]) {
      expect(s[key].initial).toBe(false);
    }
  });
});
