const { HandlebarsApplicationMixin } = foundry.applications.api;

const ATTRIBUTE_KEYS = ["DEX", "KNO", "MEC", "PER", "STR", "TEC"];

export default class CharacterSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["starwarsd6", "sheet", "actor", "character"],
    position: { width: 650, height: 600 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    sheet: { template: "systems/starwarsd6/templates/actors/character-sheet.hbs" }
  };

  // Instance property — declares default active tab per group
  tabGroups = { primary: "attributes" };

  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelectorAll("[data-item-id]").forEach(row => {
      row.addEventListener("dblclick", () => {
        const item = this.document.items.get(row.dataset.itemId);
        item?.sheet.render(true);
      });
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    // Expose current active tab to template — ApplicationV2 core doesn't inject this automatically
    context.tabs = this.tabGroups;
    // Attributes tab data
    context.attributeEntries = ATTRIBUTE_KEYS.map(key => ({
      key,
      label: `STARWARSD6.Attribute.${key}`,
      dice: this.document.system[key].dice,
      pips: this.document.system[key].pips,
      baseValue: this.document.system[key].baseValue
    }));
    // Extra stats
    context.system = this.document.system;
    // Skills tab data — grouped by parent attribute
    context.attributeGroups = ATTRIBUTE_KEYS.map(key => ({
      key,
      label: `STARWARSD6.Attribute.${key}`,
      skills: this.document.items
        .filter(i => i.type === "skill" && !i.system.isForce && i.system.attribute === key)
        .map(skill => ({
          id: skill.id,
          name: skill.name,
          dicePool: skill.system.dicePool,
          pips: skill.system.pips,
          rank: skill.system.rank
        }))
    }));
    context.forceSkills = this.document.items
      .filter(i => i.type === "skill" && i.system.isForce)
      .map(skill => ({
        id: skill.id,
        name: skill.name,
        dicePool: skill.system.dicePool,
        pips: skill.system.pips
      }));
    return context;
  }
}
