import { rollWithWildDie } from "../helpers/dice.mjs";
import { applyDamage, removeOneMark } from "../helpers/damage.mjs";
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
      rollAttribute: CharacterSheet.#rollAttribute,
      rollAttack: CharacterSheet.#rollAttack,
      markHitBox: CharacterSheet.#markHitBox,
      deleteItem: CharacterSheet.#deleteItem,
      toggleEquipped: CharacterSheet.#toggleEquipped
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
        range: i.system.range,
        equipped: i.system.equipped
      }));
    context.armors = this.document.items
      .filter(i => i.type === "armor")
      .map(i => ({
        id: i.id,
        name: i.name,
        armorBonus: i.system.armorBonus,
        equipped: i.system.equipped
      }));
    context.equipment = this.document.items
      .filter(i => i.type === "equipment")
      .map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.system.quantity,
        description: i.system.description
      }));

    // Combat tab data
    const sys = this.document.system;
    const hitBoxes = sys.hitBoxes;
    context.combatData = {
      rangedDefense:   sys.rangedDefense,
      meleeDefense:    sys.meleeDefense,
      brawlingDefense: sys.brawlingDefense,
      penaltyDice:     sys.penaltyDice,
      penaltyPips:     sys.penaltyPips,
      hitBoxes,
      stunMarks:       sys.stunMarks,
      woundMarks:      sys.woundMarks,
      incapMarks:      sys.incapMarks,
      mortalMarks:     sys.mortalMarks,
      stunBoxes:       CharacterSheet.#buildBoxArray(hitBoxes, sys.stunMarks),
      woundBoxes:      CharacterSheet.#buildBoxArray(hitBoxes, sys.woundMarks),
      incapBoxes:      CharacterSheet.#buildBoxArray(hitBoxes, sys.incapMarks),
      mortalBoxes:     CharacterSheet.#buildBoxArray(hitBoxes, sys.mortalMarks),
      damageBase:      sys.damageBase,
      thresholdStun:   `< ${sys.damageBase}`,
      thresholdWound:  `${sys.damageBase}\u2013${2 * sys.damageBase - 1}`,
      thresholdIncap:  `${2 * sys.damageBase}\u2013${3 * sys.damageBase - 1}`,
      thresholdMortal: `${3 * sys.damageBase}+`,
      weapons:         context.weapons
    };

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
   * Handle a click on a weapon's attack roll button.
   * @this {CharacterSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target  Element with data-action="rollAttack" data-weapon-id="..."
   */
  static async #rollAttack(event, target) {
    const weaponId = target.dataset.weaponId;
    const weapon = this.document.items.get(weaponId);
    if (!weapon) return;

    const attackSkillName = weapon.system.attackSkill.toLowerCase();
    const skillItem = this.document.items.find(
      i => i.type === "skill" && i.name.toLowerCase() === attackSkillName
    );

    const skillDice = skillItem ? skillItem.system.dicePool : this.document.system.DEX.dice;
    const skillPips = skillItem ? skillItem.system.pips : this.document.system.DEX.pips;

    const dialogResult = await RollDialog.prompt();
    if (dialogResult === null) return;

    const { numActions } = dialogResult;
    const penaltyDice = this.document.system.penaltyDice;
    const penaltyPips = this.document.system.penaltyPips;
    const totalPenalty = penaltyDice + (numActions - 1);

    const rollResult = await rollWithWildDie(skillDice, skillPips, totalPenalty);
    rollResult.total = Math.max(0, rollResult.total - penaltyPips);

    // Determine defense type for chat display
    const RANGED_SKILLS = ["blaster", "starship gunnery", "starfighter piloting"];
    const MELEE_SKILLS = ["melee combat"];
    let defenseLabel, defenseValue;
    if (RANGED_SKILLS.includes(attackSkillName)) {
      defenseLabel = game.i18n.localize("STARWARSD6.Combat.RangedDefense");
      defenseValue = this.document.system.rangedDefense;
    } else if (MELEE_SKILLS.includes(attackSkillName)) {
      defenseLabel = game.i18n.localize("STARWARSD6.Combat.MeleeDefense");
      defenseValue = this.document.system.meleeDefense;
    } else {
      defenseLabel = game.i18n.localize("STARWARSD6.Combat.BrawlingDefense");
      defenseValue = this.document.system.brawlingDefense;
    }

    await CharacterSheet.#postAttackToChat(this.document, weapon.name, rollResult, numActions, defenseLabel, defenseValue);
  }

  /**
   * Handle a click on a hit-box button.
   * - Alt+click:       apply one mark of damage (cascade overflow to next tier)
   * - Shift+Alt+click: remove one mark from this tier (undo, no cascade)
   * - Plain click:     ignored (prevents accidental marks)
   * @this {CharacterSheet}
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

  /**
   * Post an attack roll result to chat, showing roll total vs. defense value.
   * @param {Actor} actor
   * @param {string} weaponName
   * @param {RollResult} result
   * @param {number} numActions
   * @param {string} defenseLabel
   * @param {number} defenseValue
   */
  /**
   * Delete an item from the actor's inventory.
   * @this {CharacterSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target  Element with data-action="deleteItem" data-item-id="..."
   */
  static async #deleteItem(event, target) {
    const itemId = target.closest("[data-item-id]").dataset.itemId;
    const item = this.document.items.get(itemId);
    if (!item) return;
    await item.delete();
  }

  /**
   * Toggle the equipped state of a weapon or armor item.
   * @this {CharacterSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target  Element with data-action="toggleEquipped" data-item-id="..."
   */
  static async #toggleEquipped(event, target) {
    const itemId = target.closest("[data-item-id]").dataset.itemId;
    const item = this.document.items.get(itemId);
    if (!item) return;
    await item.update({ "system.equipped": !item.system.equipped });
  }

  /**
   * Post an attack roll result to chat, showing roll total vs. defense value.
   * @param {Actor} actor
   * @param {string} weaponName
   * @param {RollResult} result
   * @param {number} numActions
   * @param {string} defenseLabel
   * @param {number} defenseValue
   */
  static async #postAttackToChat(actor, weaponName, result, numActions, defenseLabel, defenseValue) {
    const speaker = ChatMessage.getSpeaker({ actor });
    const effectiveDice = result.normalDice.length + 1;
    const penaltyNote = numActions > 1
      ? ` (${numActions} ${game.i18n.localize("STARWARSD6.Roll.Actions")}, −${numActions - 1}D)`
      : "";

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

    const hit = result.total >= defenseValue
      ? `<span class="hit">${game.i18n.localize("STARWARSD6.Combat.Hit")}</span>`
      : `<span class="miss">${game.i18n.localize("STARWARSD6.Combat.Miss")}</span>`;

    const content = `
      <div class="starwarsd6 roll-result">
        <h3>${game.i18n.localize("STARWARSD6.Combat.AttackRoll")}: ${weaponName}${penaltyNote}</h3>
        <div class="roll-formula">${effectiveDice}D${pipsStr}</div>
        <div class="roll-dice">${normalStr}Wild: ${wildStr}${explosion}${complications}</div>
        <div class="roll-total"><strong>${game.i18n.localize("STARWARSD6.Roll.Total")}: ${result.total}</strong></div>
        <div class="roll-defense">${defenseLabel}: ${defenseValue} — ${hit}</div>
      </div>`;

    await ChatMessage.create({ speaker, content });
  }
}
