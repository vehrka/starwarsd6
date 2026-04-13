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
      STR:             attributeField(),
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
    const attr = this.STR;
    attr.baseValue = Math.floor(3.5 * attr.dice) + attr.pips;
    this.hitBoxes = attr.dice;
    const { base } = calculateDamageThresholds(attr.dice, attr.pips);
    this.damageBase = base;
  }
}
