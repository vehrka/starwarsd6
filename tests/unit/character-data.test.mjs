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
  // Wound marks (needed by prepareDerivedData for penaltyDice/penaltyPips)
  instance.stunMarks  = 0;
  instance.woundMarks = 0;
  instance.incapMarks = 0;
  instance.mortalMarks = 0;
  // Force fields
  instance.forceSensitive = false;
  instance.darkSidePoints = 0;
  instance.forceSkills = {
    control: { dice: 0, pips: 0 },
    sense:   { dice: 0, pips: 0 },
    alter:   { dice: 0, pips: 0 }
  };
  instance.keptUpPowers = [];
  // Apply overrides
  Object.assign(instance, overrides);
  return instance;
}

// Build a mock parent actor for tests that exercise the if(this.parent) branch.
// data must be the CharacterData instance so actor.system points back to it
// (matching Foundry's real structure where actor.system === the DataModel).
function makeMockParent(data, items) {
  return { system: data, items };
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

  describe("forceRollBonus derivation", () => {
    it("darkSidePoints=0 → forceRollBonus = { bonusDice:0, bonusPips:0 }", () => {
      const data = makeCharacterData({ darkSidePoints: 0 });
      data.prepareDerivedData();
      expect(data.forceRollBonus).toEqual({ bonusDice: 0, bonusPips: 0 });
    });

    it("darkSidePoints=2 → forceRollBonus = { bonusDice:1, bonusPips:1 }", () => {
      const data = makeCharacterData({ darkSidePoints: 2 });
      data.prepareDerivedData();
      expect(data.forceRollBonus).toEqual({ bonusDice: 1, bonusPips: 1 });
    });

    it("darkSidePoints=4 → forceRollBonus = { bonusDice:4, bonusPips:0 }", () => {
      const data = makeCharacterData({ darkSidePoints: 4 });
      data.prepareDerivedData();
      expect(data.forceRollBonus).toEqual({ bonusDice: 4, bonusPips: 0 });
    });
  });

  describe("keepUpPenalty derivation", () => {
    it("no parent → keepUpPenalty = 0 (unit test context)", () => {
      const data = makeCharacterData({});
      data.prepareDerivedData();
      expect(data.keepUpPenalty).toBe(0);
    });

    it("parent with no forcePower items → keepUpPenalty = 0", () => {
      const data = makeCharacterData({});
      data.parent = makeMockParent(data, []);
      data.prepareDerivedData();
      expect(data.keepUpPenalty).toBe(0);
    });

    it("parent with 2 keptUp canKeepUp forcePower items → keepUpPenalty = 2", () => {
      const data = makeCharacterData({});
      data.parent = makeMockParent(data, [
        { type: "forcePower", system: { canKeepUp: true, keptUp: true, equipped: false, armorBonus: 0, weaponBonus: 0 } },
        { type: "forcePower", system: { canKeepUp: true, keptUp: true, equipped: false, armorBonus: 0, weaponBonus: 0 } },
        { type: "forcePower", system: { canKeepUp: true, keptUp: false, equipped: false, armorBonus: 0, weaponBonus: 0 } },
        { type: "forcePower", system: { canKeepUp: false, keptUp: false, equipped: false, armorBonus: 0, weaponBonus: 0 } },
        { type: "weapon",     system: { equipped: false, armorBonus: 0, weaponBonus: 0 } }
      ]);
      data.prepareDerivedData();
      expect(data.keepUpPenalty).toBe(2);
    });

    it("parent with 0 keptUp items → keepUpPenalty = 0", () => {
      const data = makeCharacterData({});
      data.parent = makeMockParent(data, [
        { type: "forcePower", system: { canKeepUp: true, keptUp: false, equipped: false, armorBonus: 0, weaponBonus: 0 } }
      ]);
      data.prepareDerivedData();
      expect(data.keepUpPenalty).toBe(0);
    });
  });
});
