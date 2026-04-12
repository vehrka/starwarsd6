const { NumberField, StringField } = foundry.data.fields;

export default class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      damageDice:  new NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 4 }),
      damagePips:  new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 0 }),
      attackSkill: new StringField({ required: true, initial: "blaster", blank: false }),
      weaponBonus: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      range:       new StringField({ required: true, initial: "short", blank: false })
    };
  }
}
