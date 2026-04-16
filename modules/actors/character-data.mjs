import { calculateRangedDefense, calculateMeleeDefense, calculateBrawlingDefense } from "../helpers/defense.mjs";
import { calculateDamageThresholds } from "../helpers/damage.mjs";
import { calculateForceDiceBonus } from "../helpers/force.mjs";

const { NumberField, SchemaField, BooleanField, StringField, ArrayField } = foundry.data.fields;

function attributeField() {
  return new SchemaField({
    dice: new NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 2 }),
    pips: new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 0 })
  });
}

export default class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      DEX: attributeField(),
      KNO: attributeField(),
      MEC: attributeField(),
      PER: attributeField(),
      STR: attributeField(),
      TEC: attributeField(),
      move: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 10 }),
      forceSensitive: new BooleanField({ initial: false }),
      characterPoints: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      forcePoints: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      darkSidePoints: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      forceSkills: new SchemaField({
        control: new SchemaField({
          dice: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
          pips: new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 0 })
        }),
        sense: new SchemaField({
          dice: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
          pips: new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 0 })
        }),
        alter: new SchemaField({
          dice: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
          pips: new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 0 })
        })
      }),
      keptUpPowers: new ArrayField(new StringField({ required: true, nullable: false, initial: "" })),
      characterType: new StringField({ required: false, initial: "" }),
      height:        new StringField({ required: false, initial: "" }),
      weight:        new StringField({ required: false, initial: "" }),
      sex:           new StringField({ required: false, initial: "" }),
      age:           new StringField({ required: false, initial: "" }),
      description:   new StringField({ required: false, initial: "" }),
      stunMarks:   new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      woundMarks:  new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      incapMarks:  new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      mortalMarks: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
    };
  }

  prepareDerivedData() {
    for (const key of ["DEX", "KNO", "MEC", "PER", "STR", "TEC"]) {
      const attr = this[key];
      attr.baseValue = Math.floor(3.5 * attr.dice) + attr.pips;
    }
    this.hitBoxes = this.STR.dice;
    const { base } = calculateDamageThresholds(this.STR.dice, this.STR.pips);
    this.damageBase = base;

    // Wound penalties
    this.penaltyDice = this.woundMarks * 1 + this.incapMarks * 2 + this.mortalMarks * 3;
    this.penaltyPips = this.stunMarks * 1;

    // Force derived values
    this.forceRollBonus = calculateForceDiceBonus(this.darkSidePoints);

    // Defense values — require actor context (this.parent is the Actor document)
    if (this.parent) {
      // Derive bonuses from equipped items — must run before defense calculations
      this.armorBonus = this.parent.items
        .filter(i => i.type === "armor" && i.system.equipped)
        .reduce((sum, i) => sum + i.system.armorBonus, 0);
      this.weaponBonus = this.parent.items
        .filter(i => i.type === "weapon" && i.system.equipped)
        .reduce((sum, i) => sum + i.system.weaponBonus, 0);
      this.keepUpPenalty = this.parent.items
        .filter(i => i.type === "forcePower" && i.system.canKeepUp && i.system.keptUp)
        .length;
      this.rangedDefense   = calculateRangedDefense(this.parent);
      this.meleeDefense    = calculateMeleeDefense(this.parent);
      this.brawlingDefense = calculateBrawlingDefense(this.parent);
    } else {
      this.armorBonus      = 0;
      this.weaponBonus     = 0;
      this.keepUpPenalty   = 0;
      this.rangedDefense   = 0;
      this.meleeDefense    = 0;
      this.brawlingDefense = 0;
    }
  }
}
