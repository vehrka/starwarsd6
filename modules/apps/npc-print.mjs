import { calculateNpcDefense } from "../helpers/defense.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;

const ATTRIBUTE_KEYS = ["DEX", "PER", "KNO", "STR", "MEC", "TEC"];

function buildBoxArray(total, marked) {
  return Array.from({ length: total }, (_, i) => ({ marked: i < marked }));
}

export default class NpcPrintSheet extends HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    classes: ["starwarsd6", "print-sheet-window"],
    position: { width: 900, height: 700 },
    window: { resizable: true },
  };

  static PARTS = {
    sheet: { template: "systems/starwarsd6/templates/actors/npc-sheet-print.hbs" }
  };

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
  }

  get title() { return `${this.actor.name} — Print`; }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sys = this.actor.system;
    context.document = this.actor;
    context.system = sys;

    context.attributeGroups = ATTRIBUTE_KEYS.map(key => ({
      key,
      label: `STARWARSD6.Attribute.${key}`,
      dice: sys[key].dice,
      pips: sys[key].pips,
      skills: this.actor.items
        .filter(i => i.type === "skill" && i.system.attribute === key)
        .map(s => ({ name: s.name, dicePool: s.system.dicePool, pips: s.system.pips }))
    }));

    context.weapons = this.actor.items
      .filter(i => i.type === "weapon")
      .map(i => ({
        name: i.name,
        damageDice: i.system.damageDice,
        damagePips: i.system.damagePips,
        attackSkill: i.system.attackSkill,
        range: i.system.range
      }));

    const hitBoxes = sys.hitBoxes;
    context.combatData = {
      defense:         calculateNpcDefense(this.actor),
      thresholdStun:   `< ${sys.damageBase}`,
      thresholdWound:  `${sys.damageBase}–${2 * sys.damageBase - 1}`,
      thresholdIncap:  `${2 * sys.damageBase}–${3 * sys.damageBase - 1}`,
      thresholdMortal: `${3 * sys.damageBase}+`,
      stunBoxes:       buildBoxArray(hitBoxes, sys.stunMarks),
      woundBoxes:      buildBoxArray(hitBoxes, sys.woundMarks),
      incapBoxes:      buildBoxArray(hitBoxes, sys.incapMarks),
      mortalBoxes:     buildBoxArray(hitBoxes, sys.mortalMarks),
    };

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    if (options.isFirstRender) setTimeout(() => window.print(), 200);
  }
}
