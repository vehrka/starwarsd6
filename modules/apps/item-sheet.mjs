const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class ItemSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["starwarsd6", "sheet", "item"],
    position: { width: 420, height: "auto" },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    sheet: { template: "systems/starwarsd6/templates/items/item-sheet.hbs" }
  };

  get title() { return this.document.name; }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.document;
    context.system = this.document.system;
    return context;
  }
}
