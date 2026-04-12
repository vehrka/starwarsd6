import { describe, it, expect } from "vitest";
import CharacterData from "../../modules/actors/character-data.mjs";

// Build a minimal instance without going through DataModel construction.
// We only need the fields that prepareDerivedData() reads and writes.
function makeCharacterData(overrides = {}) {
  const instance = Object.create(CharacterData.prototype);
  // Default attribute values (matches DataModel initial values)
  instance.DEX = { dice: 2, pips: 0 };
  instance.KNO = { dice: 2, pips: 0 };
  instance.MEC = { dice: 2, pips: 0 };
  instance.PER = { dice: 2, pips: 0 };
  instance.STR = { dice: 2, pips: 0 };
  instance.TEC = { dice: 2, pips: 0 };
  // Apply overrides
  Object.assign(instance, overrides);
  return instance;
}

describe("CharacterData.prepareDerivedData()", () => {
  describe("baseValue derivation", () => {
    it("computes baseValue = floor(3.5 * dice) + pips for whole-die attribute", () => {
      const data = makeCharacterData({ DEX: { dice: 3, pips: 0 } });
      data.prepareDerivedData();
      expect(data.DEX.baseValue).toBe(10); // floor(3.5*3)+0 = 10
    });

    it("adds pips to baseValue", () => {
      const data = makeCharacterData({ DEX: { dice: 3, pips: 2 } });
      data.prepareDerivedData();
      expect(data.DEX.baseValue).toBe(12); // floor(3.5*3)+2 = 12
    });

    it("floors fractional result: 1D = floor(3.5) = 3", () => {
      const data = makeCharacterData({ KNO: { dice: 1, pips: 0 } });
      data.prepareDerivedData();
      expect(data.KNO.baseValue).toBe(3);
    });

    it("floors fractional result: 2D = floor(7.0) = 7", () => {
      const data = makeCharacterData({ KNO: { dice: 2, pips: 0 } });
      data.prepareDerivedData();
      expect(data.KNO.baseValue).toBe(7);
    });

    it("computes baseValue for all six attributes independently", () => {
      const data = makeCharacterData({
        DEX: { dice: 3, pips: 1 },
        STR: { dice: 4, pips: 2 }
      });
      data.prepareDerivedData();
      expect(data.DEX.baseValue).toBe(11); // floor(10.5)+1 = 11
      expect(data.STR.baseValue).toBe(16); // floor(14.0)+2 = 16
    });
  });

  describe("hitBoxes derivation", () => {
    it("derives hitBoxes = STR.dice (pips ignored)", () => {
      const data = makeCharacterData({ STR: { dice: 3, pips: 2 } });
      data.prepareDerivedData();
      expect(data.hitBoxes).toBe(3);
    });

    it("hitBoxes = 1 at minimum STR 1D", () => {
      const data = makeCharacterData({ STR: { dice: 1, pips: 0 } });
      data.prepareDerivedData();
      expect(data.hitBoxes).toBe(1);
    });

    it("hitBoxes matches STR dice regardless of pips", () => {
      const data = makeCharacterData({ STR: { dice: 5, pips: 1 } });
      data.prepareDerivedData();
      expect(data.hitBoxes).toBe(5);
    });
  });
});
