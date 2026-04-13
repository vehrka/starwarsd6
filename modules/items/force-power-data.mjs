const { StringField, BooleanField } = foundry.data.fields;

export default class ForcePowerData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      controlDifficulty: new StringField({ initial: "", blank: true }),
      senseDifficulty:   new StringField({ initial: "", blank: true }),
      alterDifficulty:   new StringField({ initial: "", blank: true }),
      requiredPowers:    new StringField({ initial: "", blank: true }),
      canKeepUp:         new BooleanField({ initial: false }),
      keptUp:            new BooleanField({ initial: false }),
      darkSideWarning:   new BooleanField({ initial: false }),
      timeToUse:         new StringField({ initial: "", blank: true }),
      effect:            new StringField({ initial: "", blank: true })
    };
  }
}
