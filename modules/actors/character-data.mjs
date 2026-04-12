const { NumberField, SchemaField, BooleanField } = foundry.data.fields;

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
      stunMarks:   new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      woundMarks:  new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      incapMarks:  new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      mortalMarks: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
    };
  }

  prepareDerivedData() {
    for (const key of ["DEX", "KNO", "MEC", "PER", "STR", "TEC"]) {
      const attr = this[key];
      attr.baseValue = Math.floor(3.5 * attr.dice) + attr.pips;
    }
    this.hitBoxes = this.STR.dice;
  }
}
