const { NumberField, StringField } = foundry.data.fields;

export default class EquipmentData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new StringField({ initial: "", blank: true }),
      quantity:    new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 1 })
    };
  }
}
