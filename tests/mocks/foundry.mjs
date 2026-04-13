// Stub field classes — they only need to be constructable; we don't test defineSchema()
class FieldStub {
  constructor(options = {}) { Object.assign(this, options); }
}

export const foundryMock = {
  data: {
    fields: {
      NumberField: FieldStub,
      StringField: FieldStub,
      BooleanField: FieldStub,
      SchemaField: FieldStub,
      ArrayField: FieldStub
    }
  },
  abstract: {
    // TypeDataModel must be a real class so DataModel subclasses can extend it.
    // prepareDerivedData() is intentionally a no-op here — subclasses override it.
    TypeDataModel: class TypeDataModel {
      prepareDerivedData() {}
    }
  }
};
