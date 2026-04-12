const { NumberField, StringField, BooleanField } = foundry.data.fields;

export default class SkillData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      attribute: new StringField({ required: true, initial: "DEX", blank: false }),
      rank: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      isForce: new BooleanField({ initial: false }),
      // Force-only fields (ignored when isForce=false):
      forceDice: new NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 1 }),
      forcePips: new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 0 })
    };
  }

  prepareDerivedData() {
    if (this.isForce) {
      this.dicePool = this.forceDice;
      this.pips = this.forcePips;
      return;
    }
    const actor = this.parent?.actor;
    if (!actor) return;
    const parentAttr = actor.system?.[this.attribute];
    if (!parentAttr) return;
    this.dicePool = parentAttr.dice + this.rank;
    this.pips = parentAttr.pips;
  }
}
