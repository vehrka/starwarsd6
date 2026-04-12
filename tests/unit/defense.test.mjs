import { describe, it, expect } from "vitest";
import {
  calculateRangedDefense,
  calculateMeleeDefense,
  calculateBrawlingDefense
} from "../../modules/helpers/defense.mjs";

/**
 * Build a mock actor with the given skill items and system values.
 * @param {Object} system  — actor.system fields (DEX, armorBonus, weaponBonus)
 * @param {Array}  items   — array of mock item objects
 */
function makeActor(system = {}, items = []) {
  return {
    system: {
      DEX: { dice: 2, pips: 0 },
      armorBonus: 0,
      weaponBonus: 0,
      ...system
    },
    items: {
      find: (predicate) => items.find(predicate) ?? null
    }
  };
}

function makeSkill(name, dicePool, pips) {
  return { type: "skill", name, system: { dicePool, pips } };
}

// ──────────────────────────────────────────────────────────────────────────────
// calculateRangedDefense
// ──────────────────────────────────────────────────────────────────────────────
describe("calculateRangedDefense()", () => {
  it("uses Dodge skill when present: floor(3.5*3)+1 + 0 armorBonus = 11", () => {
    const dodge = makeSkill("Dodge", 3, 1);
    const actor = makeActor({}, [dodge]);
    expect(calculateRangedDefense(actor)).toBe(11); // floor(10.5)+1 = 11
  });

  it("falls back to DEX when Dodge skill is absent", () => {
    // DEX 3D+2
    const actor = makeActor({ DEX: { dice: 3, pips: 2 } }, []);
    expect(calculateRangedDefense(actor)).toBe(12); // floor(10.5)+2 = 12
  });

  it("adds armorBonus to result", () => {
    const dodge = makeSkill("Dodge", 3, 0);
    const actor = makeActor({ armorBonus: 2 }, [dodge]);
    expect(calculateRangedDefense(actor)).toBe(12); // floor(10.5)+0+2 = 12
  });

  it("uses case-insensitive skill name match: 'DODGE' still found", () => {
    const dodge = makeSkill("DODGE", 2, 0);
    const actor = makeActor({ DEX: { dice: 4, pips: 0 } }, [dodge]);
    // dodge 2D+0 → floor(7)+0 = 7; not DEX 4D = 14
    expect(calculateRangedDefense(actor)).toBe(7);
  });

  it("ignores non-skill items when searching for Dodge", () => {
    const weapon = { type: "weapon", name: "Dodge Blaster", system: {} };
    const actor = makeActor({ DEX: { dice: 2, pips: 1 } }, [weapon]);
    expect(calculateRangedDefense(actor)).toBe(8); // fallback DEX 2D+1 = floor(7)+1 = 8
  });

  it("1D+0 DEX fallback: floor(3.5)+0 = 3", () => {
    const actor = makeActor({ DEX: { dice: 1, pips: 0 } }, []);
    expect(calculateRangedDefense(actor)).toBe(3);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// calculateMeleeDefense
// ──────────────────────────────────────────────────────────────────────────────
describe("calculateMeleeDefense()", () => {
  it("uses Melee Parry skill when present", () => {
    const skill = makeSkill("Melee Parry", 4, 1);
    const actor = makeActor({}, [skill]);
    expect(calculateMeleeDefense(actor)).toBe(15); // floor(14)+1 = 15
  });

  it("falls back to DEX when Melee Parry absent", () => {
    const actor = makeActor({ DEX: { dice: 3, pips: 0 } }, []);
    expect(calculateMeleeDefense(actor)).toBe(10); // floor(10.5) = 10
  });

  it("adds weaponBonus to result", () => {
    const skill = makeSkill("Melee Parry", 2, 0);
    const actor = makeActor({ weaponBonus: 3 }, [skill]);
    expect(calculateMeleeDefense(actor)).toBe(10); // floor(7)+0+3 = 10
  });

  it("case-insensitive: 'melee parry' (lowercase) matches 'Melee Parry'", () => {
    const skill = makeSkill("melee parry", 3, 2);
    const actor = makeActor({}, [skill]);
    expect(calculateMeleeDefense(actor)).toBe(12); // floor(10.5)+2 = 12
  });

  it("does NOT use armorBonus (weaponBonus only)", () => {
    const skill = makeSkill("Melee Parry", 2, 0);
    const actor = makeActor({ armorBonus: 5, weaponBonus: 0 }, [skill]);
    expect(calculateMeleeDefense(actor)).toBe(7); // floor(7)+0+0 = 7 (no armor)
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// calculateBrawlingDefense
// ──────────────────────────────────────────────────────────────────────────────
describe("calculateBrawlingDefense()", () => {
  it("uses Brawling Parry skill when present", () => {
    const skill = makeSkill("Brawling Parry", 3, 0);
    const actor = makeActor({}, [skill]);
    expect(calculateBrawlingDefense(actor)).toBe(10); // floor(10.5) = 10
  });

  it("falls back to DEX when Brawling Parry absent", () => {
    const actor = makeActor({ DEX: { dice: 2, pips: 2 } }, []);
    expect(calculateBrawlingDefense(actor)).toBe(9); // floor(7)+2 = 9
  });

  it("does NOT apply armorBonus or weaponBonus", () => {
    const skill = makeSkill("Brawling Parry", 3, 1);
    const actor = makeActor({ armorBonus: 4, weaponBonus: 2 }, [skill]);
    expect(calculateBrawlingDefense(actor)).toBe(11); // floor(10.5)+1 = 11 (no bonuses)
  });

  it("case-insensitive: 'BRAWLING PARRY' matches", () => {
    const skill = makeSkill("BRAWLING PARRY", 2, 1);
    const actor = makeActor({ DEX: { dice: 4, pips: 0 } }, [skill]);
    // brawling parry 2D+1 = floor(7)+1 = 8; not DEX 4D = 14
    expect(calculateBrawlingDefense(actor)).toBe(8);
  });
});
