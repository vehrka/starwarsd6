import { applyDamage, removeOneMark } from "../helpers/damage.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class NpcSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["starwarsd6", "sheet", "actor", "npc"],
    position: { width: 480, height: 520 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      markHitBox: NpcSheet.#markHitBox
    }
  };

  static PARTS = {
    sheet: { template: "systems/starwarsd6/templates/actors/npc-sheet.hbs" }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sys = this.document.system;
    const hitBoxes = sys.hitBoxes;
    context.system = sys;
    context.combatData = {
      hitBoxes,
      stunBoxes:       NpcSheet.#buildBoxArray(hitBoxes, sys.stunMarks),
      woundBoxes:      NpcSheet.#buildBoxArray(hitBoxes, sys.woundMarks),
      incapBoxes:      NpcSheet.#buildBoxArray(hitBoxes, sys.incapMarks),
      mortalBoxes:     NpcSheet.#buildBoxArray(hitBoxes, sys.mortalMarks),
      damageBase:      sys.damageBase,
      thresholdStun:   `< ${sys.damageBase}`,
      thresholdWound:  `${sys.damageBase}\u2013${2 * sys.damageBase - 1}`,
      thresholdIncap:  `${2 * sys.damageBase}\u2013${3 * sys.damageBase - 1}`,
      thresholdMortal: `${3 * sys.damageBase}+`
    };
    return context;
  }

  /**
   * Build an array of hit-box state objects for template rendering.
   * @param {number} hitBoxes  Total boxes per tier
   * @param {number} marks     Currently marked count
   * @returns {{ index: number, marked: boolean }[]}
   */
  static #buildBoxArray(hitBoxes, marks) {
    return Array.from({ length: hitBoxes }, (_, i) => ({ index: i, marked: i < marks }));
  }

  /**
   * Handle a click on a hit-box button.
   * - Alt+click:       apply one mark of damage (cascade overflow to next tier)
   * - Shift+Alt+click: remove one mark from this tier (undo, no cascade)
   * - Plain click:     ignored (prevents accidental marks)
   * @this {NpcSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target  Element with data-action="markHitBox" data-tier="..."
   */
  static async #markHitBox(event, target) {
    if (!event.altKey) return;
    const tier = target.dataset.tier;
    if (event.shiftKey) {
      await removeOneMark(this.document, tier);
    } else {
      await applyDamage(this.document, tier);
    }
  }
}
