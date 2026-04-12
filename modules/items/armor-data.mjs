const { NumberField, BooleanField } = foundry.data.fields;

export default class ArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      armorBonus: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      equipped:   new BooleanField({ initial: false })
    };
  }
}
