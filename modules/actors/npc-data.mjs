import { calculateDamageThresholds } from "../helpers/damage.mjs";

const { NumberField, SchemaField, StringField } = foundry.data.fields;

function attributeField() {
  return new SchemaField({
    dice: new NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 2 }),
    pips: new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 0 })
  });
}

export default class NpcData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      DEX:             attributeField(),
      KNO:             attributeField(),
      MEC:             attributeField(),
      PER:             attributeField(),
      STR:             attributeField(),
      TEC:             attributeField(),
      rangedDefense:   new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 10 }),
      meleeDefense:    new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 10 }),
      brawlingDefense: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 10 }),
      damageDice:      new NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 4 }),
      damagePips:      new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 0 }),
      stunMarks:       new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      woundMarks:      new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      incapMarks:      new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      mortalMarks:     new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      notes:           new StringField({ required: true, nullable: false, initial: "" })
    };
  }

  prepareDerivedData() {
    const ATTR_KEYS = ["DEX", "KNO", "MEC", "PER", "STR", "TEC"];
    for (const key of ATTR_KEYS) {
      const attr = this[key];
      attr.baseValue = Math.floor(3.5 * attr.dice) + attr.pips;
    }
    this.hitBoxes = this.STR.dice;
    const { base } = calculateDamageThresholds(this.STR.dice, this.STR.pips);
    this.damageBase = base;
    this.penaltyDice = this.woundMarks + (this.incapMarks * 2) + (this.mortalMarks * 3);
    this.penaltyPips = this.stunMarks;
  }
}
