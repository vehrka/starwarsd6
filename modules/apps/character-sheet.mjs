import { rollWithWildDie } from "../helpers/dice.mjs";
import RollDialog from "./roll-dialog.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;

const ATTRIBUTE_KEYS = ["DEX", "KNO", "MEC", "PER", "STR", "TEC"];

export default class CharacterSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["starwarsd6", "sheet", "actor", "character"],
    position: { width: 650, height: 600 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      rollSkill: CharacterSheet.#rollSkill,
      rollAttribute: CharacterSheet.#rollAttribute
    }
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
    context.weapons = this.document.items
      .filter(i => i.type === "weapon")
      .map(i => ({
        id: i.id,
        name: i.name,
        damageDice: i.system.damageDice,
        damagePips: i.system.damagePips,
        attackSkill: i.system.attackSkill,
        range: i.system.range
      }));
    context.armors = this.document.items
      .filter(i => i.type === "armor")
      .map(i => ({
        id: i.id,
        name: i.name,
        armorBonus: i.system.armorBonus
      }));
    context.equipment = this.document.items
      .filter(i => i.type === "equipment")
      .map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.system.quantity,
        description: i.system.description
      }));
    return context;
  }

  /**
   * Handle a click on a skill's roll button.
   * @this {CharacterSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target  Element with data-action="rollSkill"
   */
  static async #rollSkill(event, target) {
    const skillId = target.dataset.skillId;
    const skill = this.document.items.get(skillId);
    if (!skill) return;

    const result = await RollDialog.prompt();
    if (result === null) return; // cancelled

    const { numActions } = result;
    const penalty = numActions - 1;
    const rollResult = await rollWithWildDie(skill.system.dicePool, skill.system.pips, penalty);

    await CharacterSheet.#postRollToChat(this.document, skill.name, rollResult, numActions);
  }

  /**
   * Handle a click on an attribute's roll button.
   * @this {CharacterSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target  Element with data-action="rollAttribute"
   */
  static async #rollAttribute(event, target) {
    const attributeKey = target.dataset.attributeKey;
    const attr = this.document.system[attributeKey];
    if (!attr) return;

    const result = await RollDialog.prompt();
    if (result === null) return;

    const { numActions } = result;
    const penalty = numActions - 1;
    const attrLabel = game.i18n.localize(`STARWARSD6.Attribute.${attributeKey}`);
    const rollResult = await rollWithWildDie(attr.dice, attr.pips, penalty);

    await CharacterSheet.#postRollToChat(this.document, attrLabel, rollResult, numActions);
  }

  /**
   * Post a roll result to the chat log.
   * @param {Actor} actor
   * @param {string} label  — Skill or attribute name
   * @param {RollResult} result
   * @param {number} numActions
   */
  static async #postRollToChat(actor, label, result, numActions) {
    const speaker = ChatMessage.getSpeaker({ actor });
    const effectiveDice = result.normalDice.length + 1; // normal + wild
    const penaltyNote = numActions > 1
      ? ` (${numActions} ${game.i18n.localize("STARWARSD6.Roll.Actions")}, −${numActions - 1}D)`
      : "";

    // Build wild die display
    const wildStr = result.wildRolls.length > 1
      ? result.wildRolls.map((v, i) => i === 0 ? `<b>${v}</b>` : `→${v}`).join(" ")
      : `<b>${result.wildRolls[0]}</b>`;

    const complications = result.isComplication
      ? `<span class="complication"> ⚠ ${game.i18n.localize("STARWARSD6.Roll.Complication")}</span>`
      : "";
    const explosion = result.wildRolls.length > 1
      ? `<span class="explosion"> 💥 ${game.i18n.localize("STARWARSD6.Roll.Explosion")}</span>`
      : "";

    const normalStr = result.normalDice.length > 0
      ? `Normal: [${result.normalDice.join(", ")}] | ` : "";
    const pipsStr = result.pips > 0 ? ` +${result.pips} pips` : "";
    const content = `
      <div class="starwarsd6 roll-result">
        <h3>${label}${penaltyNote}</h3>
        <div class="roll-formula">${effectiveDice}D${pipsStr}</div>
        <div class="roll-dice">${normalStr}Wild: ${wildStr}${explosion}${complications}</div>
        <div class="roll-total"><strong>${game.i18n.localize("STARWARSD6.Roll.Total")}: ${result.total}</strong></div>
      </div>`;

    await ChatMessage.create({ speaker, content });
  }
}
