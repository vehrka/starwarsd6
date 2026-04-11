const { NumberField, StringField } = foundry.data.fields;

export default class SkillData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      attribute: new StringField({ required: true, initial: "DEX", blank: false }),
      rank: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
    };
  }

  prepareDerivedData() {
    const actor = this.parent?.actor;
    if (!actor) return;
    const parentAttr = actor.system?.[this.attribute];
    if (!parentAttr) return;
    this.dicePool = parentAttr.dice + this.rank;
    this.pips = parentAttr.pips;
  }
}
