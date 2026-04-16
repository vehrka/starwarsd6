import { describe, it, expect } from "vitest";

// Mirrors the pre-fill logic extracted from #rollAttack
function computeDefensePreFill(noTarget, attackSkillName, skillDice, targetActor) {
  const RANGED_SKILLS = ["blaster", "starship gunnery", "starfighter piloting"];
  const MELEE_SKILLS = ["melee combat"];
  if (noTarget) return Math.ceil(3.5 * skillDice);
  if (RANGED_SKILLS.includes(attackSkillName)) return targetActor.system.rangedDefense;
  if (MELEE_SKILLS.includes(attackSkillName)) return targetActor.system.meleeDefense;
  return targetActor.system.brawlingDefense;
}

// Mirrors the effective difficulty guard after dialog
function effectiveDifficulty(dialogDifficulty) {
  return Number.isFinite(dialogDifficulty) && dialogDifficulty > 0 ? dialogDifficulty : 0;
}

const mockTarget = { system: { rangedDefense: 12, meleeDefense: 9, brawlingDefense: 7 } };

describe("defense pre-fill for RollDialog", () => {
  it("no target → ceil(3.5 × skillDice)", () => {
    expect(computeDefensePreFill(true, "blaster", 4, null)).toBe(14);
  });
  it("targeted blaster → rangedDefense", () => {
    expect(computeDefensePreFill(false, "blaster", 4, mockTarget)).toBe(12);
  });
  it("targeted melee combat → meleeDefense", () => {
    expect(computeDefensePreFill(false, "melee combat", 3, mockTarget)).toBe(9);
  });
  it("targeted brawling parry → brawlingDefense", () => {
    expect(computeDefensePreFill(false, "brawling parry", 3, mockTarget)).toBe(7);
  });
  it("starship gunnery → rangedDefense", () => {
    expect(computeDefensePreFill(false, "starship gunnery", 3, mockTarget)).toBe(12);
  });
  it("starfighter piloting → rangedDefense", () => {
    expect(computeDefensePreFill(false, "starfighter piloting", 3, mockTarget)).toBe(12);
  });
});

describe("effectiveDifficulty — dialog result guard", () => {
  it("positive number passes through", () => { expect(effectiveDifficulty(16)).toBe(16); });
  it("0 → 0",                          () => { expect(effectiveDifficulty(0)).toBe(0); });
  it("NaN → 0",                        () => { expect(effectiveDifficulty(NaN)).toBe(0); });
  it("null → 0",                        () => { expect(effectiveDifficulty(null)).toBe(0); });
  it("adjusted value used for isHit",  () => { expect(14 >= effectiveDifficulty(16)).toBe(false); });
  it("edited lower value — hit",       () => { expect(14 >= effectiveDifficulty(10)).toBe(true); });
});
