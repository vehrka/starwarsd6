import { describe, it, expect } from "vitest";
import WeaponData from "../../modules/items/weapon-data.mjs";
import ArmorData from "../../modules/items/armor-data.mjs";
import EquipmentData from "../../modules/items/equipment-data.mjs";

function schema(DataClass) {
  return DataClass.defineSchema();
}

describe("WeaponData.defineSchema()", () => {
  it("has all required fields", () => {
    const s = schema(WeaponData);
    expect(s).toHaveProperty("damageDice");
    expect(s).toHaveProperty("damagePips");
    expect(s).toHaveProperty("attackSkill");
    expect(s).toHaveProperty("weaponBonus");
    expect(s).toHaveProperty("range");
  });

  it("damageDice has initial=4, min=1", () => {
    const { damageDice } = schema(WeaponData);
    expect(damageDice.initial).toBe(4);
    expect(damageDice.min).toBe(1);
  });

  it("damagePips has initial=0, max=2", () => {
    const { damagePips } = schema(WeaponData);
    expect(damagePips.initial).toBe(0);
    expect(damagePips.max).toBe(2);
  });

  it("attackSkill has initial='blaster'", () => {
    const { attackSkill } = schema(WeaponData);
    expect(attackSkill.initial).toBe("blaster");
  });

  it("weaponBonus has initial=0, min=0", () => {
    const { weaponBonus } = schema(WeaponData);
    expect(weaponBonus.initial).toBe(0);
    expect(weaponBonus.min).toBe(0);
  });

  it("range has initial='short'", () => {
    const { range } = schema(WeaponData);
    expect(range.initial).toBe("short");
  });

  it("has no prepareDerivedData override (no derivation needed)", () => {
    const instance = Object.create(WeaponData.prototype);
    expect(() => instance.prepareDerivedData?.()).not.toThrow();
  });
});

describe("ArmorData.defineSchema()", () => {
  it("has armorBonus field", () => {
    const s = schema(ArmorData);
    expect(s).toHaveProperty("armorBonus");
  });

  it("armorBonus has initial=0, min=0", () => {
    const { armorBonus } = schema(ArmorData);
    expect(armorBonus.initial).toBe(0);
    expect(armorBonus.min).toBe(0);
  });

  it("has exactly one field (no extra fields)", () => {
    const s = schema(ArmorData);
    expect(Object.keys(s)).toHaveLength(1);
  });
});

describe("EquipmentData.defineSchema()", () => {
  it("has description and quantity fields", () => {
    const s = schema(EquipmentData);
    expect(s).toHaveProperty("description");
    expect(s).toHaveProperty("quantity");
  });

  it("quantity has initial=1, min=0", () => {
    const { quantity } = schema(EquipmentData);
    expect(quantity.initial).toBe(1);
    expect(quantity.min).toBe(0);
  });

  it("description has blank:true (allows empty string)", () => {
    const { description } = schema(EquipmentData);
    expect(description.blank).toBe(true);
  });

  it("has exactly two fields", () => {
    const s = schema(EquipmentData);
    expect(Object.keys(s)).toHaveLength(2);
  });
});
