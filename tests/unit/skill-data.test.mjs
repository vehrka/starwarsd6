import { describe, it, expect } from "vitest";
import SkillData from "../../modules/items/skill-data.mjs";

// Build a minimal SkillData instance for testing prepareDerivedData().
// Sets up `this.parent.actor.system` to simulate an embedded skill on a character.
function makeSkillData({ attribute = "DEX", rank = 0, isForce = false,
                         forceDice = 1, forcePips = 0,
                         actorSystem = null } = {}) {
  const instance = Object.create(SkillData.prototype);
  instance.attribute = attribute;
  instance.rank = rank;
  instance.isForce = isForce;
  instance.forceDice = forceDice;
  instance.forcePips = forcePips;
  // Default actor system with all attributes at 2D+0
  const defaultSystem = {
    DEX: { dice: 2, pips: 0 },
    KNO: { dice: 2, pips: 0 },
    MEC: { dice: 2, pips: 0 },
    PER: { dice: 2, pips: 0 },
    STR: { dice: 2, pips: 0 },
    TEC: { dice: 2, pips: 0 }
  };
  instance.parent = {
    actor: { system: actorSystem ?? defaultSystem }
  };
  return instance;
}

describe("SkillData.prepareDerivedData()", () => {
  describe("regular skill (isForce = false)", () => {
    it("dicePool = parentAttr.dice + rank when rank is 0", () => {
      const skill = makeSkillData({ attribute: "DEX", rank: 0 });
      skill.prepareDerivedData();
      expect(skill.dicePool).toBe(2); // 2+0
    });

    it("dicePool = parentAttr.dice + rank when rank > 0", () => {
      const skill = makeSkillData({ attribute: "DEX", rank: 2 });
      skill.prepareDerivedData();
      expect(skill.dicePool).toBe(4); // 2+2
    });

    it("inherits pips from parent attribute", () => {
      const skill = makeSkillData({
        attribute: "STR",
        rank: 1,
        actorSystem: { STR: { dice: 3, pips: 2 } }
      });
      skill.prepareDerivedData();
      expect(skill.pips).toBe(2);
    });

    it("uses the correct parent attribute (KNO, not DEX)", () => {
      const skill = makeSkillData({
        attribute: "KNO",
        rank: 1,
        actorSystem: {
          DEX: { dice: 2, pips: 0 },
          KNO: { dice: 4, pips: 1 }
        }
      });
      skill.prepareDerivedData();
      expect(skill.dicePool).toBe(5); // 4+1
      expect(skill.pips).toBe(1);
    });

    it("does not set dicePool when parent actor is missing", () => {
      const skill = makeSkillData({ attribute: "DEX", rank: 1 });
      skill.parent = null;
      skill.prepareDerivedData();
      expect(skill.dicePool).toBeUndefined();
    });

    it("does not set dicePool when parent attribute key is not in actor system", () => {
      const skill = makeSkillData({
        attribute: "INVALID",
        rank: 1,
        actorSystem: { DEX: { dice: 2, pips: 0 } }
      });
      skill.prepareDerivedData();
      expect(skill.dicePool).toBeUndefined();
    });
  });

  describe("Force skill (isForce = true)", () => {
    it("dicePool = forceDice (ignores parent attribute)", () => {
      const skill = makeSkillData({
        isForce: true,
        forceDice: 2,
        forcePips: 0,
        // Even with a valid actor, Force skills must NOT look up a parent attribute
        actorSystem: { DEX: { dice: 5, pips: 2 } }
      });
      skill.prepareDerivedData();
      expect(skill.dicePool).toBe(2);
    });

    it("pips = forcePips", () => {
      const skill = makeSkillData({ isForce: true, forceDice: 3, forcePips: 1 });
      skill.prepareDerivedData();
      expect(skill.pips).toBe(1);
    });

    it("Force skill with no parent actor still derives correctly", () => {
      const skill = makeSkillData({ isForce: true, forceDice: 1, forcePips: 2 });
      skill.parent = null;
      skill.prepareDerivedData();
      expect(skill.dicePool).toBe(1);
      expect(skill.pips).toBe(2);
    });

    it("Force skill rank is irrelevant — dicePool does not include it", () => {
      const skill = makeSkillData({ isForce: true, forceDice: 2, forcePips: 0, rank: 99 });
      skill.prepareDerivedData();
      expect(skill.dicePool).toBe(2); // rank=99 must NOT be added
    });
  });
});
