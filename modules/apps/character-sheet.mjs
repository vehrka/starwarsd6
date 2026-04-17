import { rollWithWildDie, rollDamage } from "../helpers/dice.mjs";
import { applyDamage, removeOneMark, resolveDamageTier } from "../helpers/damage.mjs";
import { applyDarkSidePoint } from "../helpers/force.mjs";
import { calculateNpcDefense } from "../helpers/defense.mjs";
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
      rollForceSkill: CharacterSheet.#rollForceSkill,
      addDarkSidePoint: CharacterSheet.#addDarkSidePoint,
      addKeptUpPower: CharacterSheet.#addKeptUpPower,
      removeKeptUpPower: CharacterSheet.#removeKeptUpPower,
      markHitBox: CharacterSheet.#markHitBox,
      deleteItem: CharacterSheet.#deleteItem,
      toggleEquipped: CharacterSheet.#toggleEquipped,
      toggleKeptUp: CharacterSheet.#toggleKeptUp,
      newRound: CharacterSheet.#newRound,
      incrementStat: CharacterSheet.#incrementStat,
      decrementStat: CharacterSheet.#decrementStat,
      editImage: CharacterSheet.#editImage
    }
  };

  static PARTS = {
    sheet: { template: "systems/starwarsd6/templates/actors/character-sheet.hbs" }
  };

  get title() { return this.document.name; }

  // Instance property — declares default active tab per group
  tabGroups = { primary: "attributes" };

  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelectorAll("li[data-item-id]").forEach(row => {
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
    // Extra stats
    context.system = this.document.system;
    // Attributes + skills tab data — grouped by attribute
    context.attributeGroups = ATTRIBUTE_KEYS.map(key => ({
      key,
      label: `STARWARSD6.Attribute.${key}`,
      dice: this.document.system[key].dice,
      pips: this.document.system[key].pips,
      baseValue: this.document.system[key].baseValue,
      skills: this.document.items
        .filter(i => i.type === "skill" && i.system.attribute === key)
        .map(skill => ({
          id: skill.id,
          name: skill.name,
          dicePool: skill.system.dicePool,
          pips: skill.system.pips,
          rank: skill.system.rank
        }))
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

    // Force tab data (only when force sensitive)
    const system = this.document.system;
    context.forceData = system.forceSensitive ? {
      skills: {
        control: { ...system.forceSkills.control, key: "control", label: game.i18n.localize("STARWARSD6.Force.Skill.control") },
        sense:   { ...system.forceSkills.sense,   key: "sense",   label: game.i18n.localize("STARWARSD6.Force.Skill.sense") },
        alter:   { ...system.forceSkills.alter,   key: "alter",   label: game.i18n.localize("STARWARSD6.Force.Skill.alter") }
      },
      forcePowers: this.document.items
        .filter(i => i.type === "forcePower")
        .map(i => ({
          id: i.id,
          name: i.name,
          controlDifficulty: i.system.controlDifficulty,
          senseDifficulty:   i.system.senseDifficulty,
          alterDifficulty:   i.system.alterDifficulty,
          canKeepUp:         i.system.canKeepUp,
          keptUp:            i.system.keptUp,
          darkSideWarning:   i.system.darkSideWarning
        })),
      keptUpPowerItems: this.document.items
        .filter(i => i.type === "forcePower" && i.system.canKeepUp && i.system.keptUp)
        .map(i => ({ id: i.id, name: i.name })),
      keptUpPowers: system.keptUpPowers.map((name, index) => ({ name, index })),
      dsp: system.darkSidePoints,
      forceRollBonus: system.forceRollBonus,
      keepUpPenalty: system.keepUpPenalty
    } : null;

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
      weapons:         context.weapons.map(w => {
        const skillItem = this.document.items.find(
          i => i.type === "skill" && i.name.toLowerCase() === w.attackSkill.toLowerCase()
        );
        const skillDice = skillItem ? skillItem.system.dicePool : sys.DEX.dice;
        const skillPips  = skillItem ? skillItem.system.pips     : sys.DEX.pips;
        const attackSkillDisplay = skillPips > 0 ? `${skillDice}D+${skillPips}` : `${skillDice}D`;
        return { ...w, attackSkillDisplay };
      })
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

    const fp = this.document.system.forcePoints;
    const fpSpent = !!this.document.getFlag("starwarsd6", "fpSpentThisRound");
    const defaultDifficulty = Math.ceil(3.5 * skill.system.dicePool);
    const result = await RollDialog.prompt({ canSpendFP: !fpSpent, hasFP: fp > 0, showDifficulty: true, defaultDifficulty });
    if (result === null) return; // cancelled

    const { numActions, useForcePoint, difficulty } = result;

    if (useForcePoint) {
      await this.document.update({ "system.forcePoints": Math.max(0, fp - 1) });
        await this.document.setFlag("starwarsd6", "fpSpentThisRound", true);
    }

    const keepUpPenalty = this.document.system.keepUpPenalty ?? 0;
    const penaltyDice = this.document.system.penaltyDice;
    const penaltyPips = this.document.system.penaltyPips;
    const penalty = (numActions - 1) + keepUpPenalty + penaltyDice;
    const rollResult = await rollWithWildDie(
      skill.system.dicePool, skill.system.pips, penalty,
      undefined,
      { doubled: useForcePoint }
    );
    rollResult.total = Math.max(0, rollResult.total - penaltyPips);

    await CharacterSheet.#postRollToChat(
      this.document, skill.name, rollResult, numActions,
      { keepUpPenalty, penaltyDice, penaltyPips, difficulty }
    );
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

    const fp = this.document.system.forcePoints;
    const fpSpent = !!this.document.getFlag("starwarsd6", "fpSpentThisRound");
    const defaultDifficulty = Math.ceil(3.5 * attr.dice);
    const result = await RollDialog.prompt({ canSpendFP: !fpSpent, hasFP: fp > 0, showDifficulty: true, defaultDifficulty });
    if (result === null) return;

    const { numActions, useForcePoint, difficulty } = result;

    if (useForcePoint) {
      await this.document.update({ "system.forcePoints": Math.max(0, fp - 1) });
        await this.document.setFlag("starwarsd6", "fpSpentThisRound", true);
    }

    const keepUpPenalty = this.document.system.keepUpPenalty ?? 0;
    const penaltyDice = this.document.system.penaltyDice;
    const penaltyPips = this.document.system.penaltyPips;
    const penalty = (numActions - 1) + keepUpPenalty + penaltyDice;
    const attrLabel = game.i18n.localize(`STARWARSD6.Attribute.${attributeKey}`);
    const rollResult = await rollWithWildDie(attr.dice, attr.pips, penalty, undefined, { doubled: useForcePoint });
    rollResult.total = Math.max(0, rollResult.total - penaltyPips);

    await CharacterSheet.#postRollToChat(
      this.document, attrLabel, rollResult, numActions,
      { keepUpPenalty, penaltyDice, penaltyPips, difficulty }
    );
  }

  /**
   * Build penalty lines for the chat card body.
   * Returns an HTML string with one line per active penalty source, or "" if none.
   * @param {number} numActions
   * @param {number} keepUpPenalty
   * @param {number} [penaltyDice=0]
   * @param {number} [penaltyPips=0]
   * @returns {string}
   */
  static #buildPenaltyLines(numActions, keepUpPenalty, penaltyDice = 0, penaltyPips = 0) {
    const lines = [];
    if (numActions > 1)     lines.push(`${game.i18n.localize("STARWARSD6.Roll.Actions")}: ${numActions} (−${numActions - 1}D)`);
    if (keepUpPenalty > 0)  lines.push(`${game.i18n.localize("STARWARSD6.Force.KeepUpPenaltyNote")}: −${keepUpPenalty}D`);
    if (penaltyDice > 0)    lines.push(`${game.i18n.localize("STARWARSD6.Combat.PenaltyDice")}: −${penaltyDice}D`);
    if (penaltyPips > 0)    lines.push(`${game.i18n.localize("STARWARSD6.Combat.PenaltyPips")}: −${penaltyPips}`);
    if (!lines.length) return "";
    return `<div class="roll-penalties">${lines.join(" · ")}</div>`;
  }

  /**
   * Post a roll result to the chat log.
   * @param {Actor} actor
   * @param {string} label  — Skill or attribute name
   * @param {RollResult} result
   * @param {number} numActions
   * @param {object} [options={}]
   * @param {number} [options.keepUpPenalty=0]
   */
  static async #postRollToChat(actor, label, result, numActions, { keepUpPenalty = 0, penaltyDice = 0, penaltyPips = 0, difficulty = null } = {}) {
    const speaker = ChatMessage.getSpeaker({ actor });
    const effectiveDice = result.normalDice.length + 1; // normal + wild

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

    const penaltyStr = CharacterSheet.#buildPenaltyLines(numActions, keepUpPenalty, penaltyDice, penaltyPips);

    const hasDifficulty = Number.isFinite(difficulty) && difficulty > 0;
    const difficultyStr = hasDifficulty
      ? (() => {
          const isSuccess = result.total >= difficulty;
          const outcomeLabel = isSuccess
            ? `<span class="success">${game.i18n.localize("STARWARSD6.RollSuccess")}</span>`
            : `<span class="failure">${game.i18n.localize("STARWARSD6.RollFailure")}</span>`;
          return `<div class="roll-difficulty">${game.i18n.localize("STARWARSD6.RollDifficulty")}: ${difficulty} — ${outcomeLabel}</div>`;
        })()
      : "";

    const content = `
      <div class="starwarsd6 roll-result">
        <h3>${label}</h3>
        <div class="roll-formula">${effectiveDice}D${pipsStr}</div>
        ${penaltyStr}
        <div class="roll-dice">${normalStr}Wild: ${wildStr}${explosion}${complications}</div>
        <div class="roll-total"><strong>${game.i18n.localize("STARWARSD6.Roll.Total")}: <span class="total-value">${result.total}</span></strong></div>
        ${difficultyStr}
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

    // Detect target — game.user.targets is a plain Set<Token>
    const targets = [...game.user.targets];
    const targetToken = targets[0];
    const targetActor = targetToken?.actor ?? null;
    const noTarget = !targetActor;

    const fp = this.document.system.forcePoints;
    const fpSpent = !!this.document.getFlag("starwarsd6", "fpSpentThisRound");

    // Compute defense pre-fill before opening dialog
    const RANGED_SKILLS = ["blaster", "starship gunnery", "starfighter piloting"];
    const MELEE_SKILLS = ["melee combat"];
    let defenseLabel, rawDefenseValue;
    if (noTarget) {
      defenseLabel = game.i18n.localize("STARWARSD6.Combat.Difficulty");
      rawDefenseValue = Math.ceil(3.5 * skillDice);
    } else if (targetActor.type === "npc") {
      defenseLabel = game.i18n.localize("STARWARSD6.Combat.Defense");
      rawDefenseValue = calculateNpcDefense(targetActor);
    } else if (RANGED_SKILLS.includes(attackSkillName)) {
      defenseLabel = game.i18n.localize("STARWARSD6.Combat.RangedDefense");
      rawDefenseValue = targetActor.system.rangedDefense;
    } else if (MELEE_SKILLS.includes(attackSkillName)) {
      defenseLabel = game.i18n.localize("STARWARSD6.Combat.MeleeDefense");
      rawDefenseValue = targetActor.system.meleeDefense;
    } else {
      defenseLabel = game.i18n.localize("STARWARSD6.Combat.BrawlingDefense");
      rawDefenseValue = targetActor.system.brawlingDefense;
    }

    const dialogResult = await RollDialog.prompt({
      canSpendFP: !fpSpent, hasFP: fp > 0,
      showDifficulty: true, defaultDifficulty: rawDefenseValue
    });
    if (dialogResult === null) return;

    const { numActions, useForcePoint, difficulty } = dialogResult;

    if (useForcePoint) {
      await this.document.update({ "system.forcePoints": Math.max(0, fp - 1) });
        await this.document.setFlag("starwarsd6", "fpSpentThisRound", true);
    }

    const penaltyDice = this.document.system.penaltyDice;
    const penaltyPips = this.document.system.penaltyPips;
    const keepUpPenalty = this.document.system.keepUpPenalty ?? 0;
    const totalPenalty = penaltyDice + (numActions - 1) + keepUpPenalty;

    const rollResult = await rollWithWildDie(skillDice, skillPips, totalPenalty, undefined, { doubled: useForcePoint });
    rollResult.total = Math.max(0, rollResult.total - penaltyPips);

    const defenseValue = Number.isFinite(difficulty) && difficulty > 0 ? difficulty : 0;
    const isHit = rollResult.total >= defenseValue;
    await CharacterSheet.#postAttackToChat(
      this.document, weapon, rollResult, numActions, defenseLabel, defenseValue,
      targetActor, isHit, targetToken?.id ?? null,
      { keepUpPenalty, penaltyDice, penaltyPips }
    );
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
   * Toggle the keptUp state of a forcePower item.
   * @this {CharacterSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target  Element with data-action="toggleKeptUp" data-item-id="..."
   */
  static async #toggleKeptUp(event, target) {
    const itemId = target.closest("[data-item-id]").dataset.itemId;
    const item = this.document.items.get(itemId);
    if (!item) return;
    await item.update({ "system.keptUp": !item.system.keptUp });
  }

  /**
   * Post an attack roll result to chat, showing roll total vs. defense value.
   * @param {Actor} actor
   * @param {Item} weapon
   * @param {RollResult} result
   * @param {number} numActions
   * @param {string} defenseLabel
   * @param {number} defenseValue
   * @param {Actor|null} targetActor
   * @param {boolean} isHit
   * @param {object} [options={}]
   * @param {number} [options.keepUpPenalty=0]
   * @param {number} [options.penaltyDice=0]
   * @param {number} [cpOptions.penaltyPips=0]
   */
  static async #postAttackToChat(actor, weapon, result, numActions, defenseLabel, defenseValue, targetActor, isHit, targetTokenId = null, { keepUpPenalty = 0, penaltyDice = 0, penaltyPips = 0 } = {}) {
    const speaker = ChatMessage.getSpeaker({ actor });
    const effectiveDice = result.normalDice.length + 1;

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

    const penaltyStr = CharacterSheet.#buildPenaltyLines(numActions, keepUpPenalty, penaltyDice, penaltyPips);

    const hitLabel = isHit
      ? `<span class="hit">${game.i18n.localize("STARWARSD6.Combat.Hit")}</span>`
      : `<span class="miss">${game.i18n.localize("STARWARSD6.Combat.Miss")}</span>`;

    const targetLine = targetActor
      ? `<div class="roll-target">${game.i18n.localize("STARWARSD6.Combat.Target")}: <strong>${targetActor.name}</strong></div>`
      : "";

    const rollDamageBtn = (isHit && targetActor)
      ? `<div class="damage-action">
           <button type="button" class="roll-damage-btn"
                   data-target-actor-id="${targetActor.id}"
                   data-target-token-id="${targetTokenId ?? ""}"
                   data-damage-dice="${weapon.system.damageDice}"
                   data-damage-pips="${weapon.system.damagePips}"
                   data-damage-base="${targetActor.system.damageBase}">
             ${game.i18n.localize("STARWARSD6.Combat.RollDamage")}
           </button>
         </div>`
      : "";

    const flags = (isHit && targetActor)
      ? { starwarsd6: {
          targetActorId: targetActor.id,
          targetTokenId: targetTokenId ?? null,
          damageDice: weapon.system.damageDice,
          damagePips: weapon.system.damagePips,
          damageBase: targetActor.system.damageBase
        }}
      : {};

    const content = `
      <div class="starwarsd6 roll-result">
        <h3>${game.i18n.localize("STARWARSD6.Combat.AttackRoll")}: ${weapon.name}</h3>
        ${targetLine}
        <div class="roll-formula">${effectiveDice}D${pipsStr}</div>
        ${penaltyStr}
        <div class="roll-dice">${normalStr}Wild: ${wildStr}${explosion}${complications}</div>
        <div class="roll-total"><strong>${game.i18n.localize("STARWARSD6.Roll.Total")}: <span class="total-value">${result.total}</span></strong></div>
        <div class="roll-defense">${defenseLabel}: ${defenseValue} — ${hitLabel}</div>
        ${rollDamageBtn}
      </div>`;

    await ChatMessage.create({ speaker, content, flags });
  }

  /**
   * Clear the fpSpentThisRound flag. Called by the "New Round" button in the sheet header.
   * @this {CharacterSheet}
   */
  static async #newRound(event, target) {
    await this.document.setFlag("starwarsd6", "fpSpentThisRound", false);
  }

  /**
   * Roll a Force skill (control/sense/alter) with DSP bonus, wound penalty, and keep-up penalty.
   * @this {CharacterSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target  Element with data-action="rollForceSkill" data-skill-key="..."
   */
  static async #rollForceSkill(event, target) {
    const skillKey = target.dataset.skillKey;
    const system = this.document.system;
    if (!system.forceSensitive) return;
    const skill = system.forceSkills[skillKey];
    if (!skill) return;

    const bonus = system.forceRollBonus;
    const totalDice = skill.dice + bonus.bonusDice;
    const totalPips = skill.pips + bonus.bonusPips; // may exceed 2, OK

    const fp = system.forcePoints;
    const fpSpent = !!this.document.getFlag("starwarsd6", "fpSpentThisRound");
    const result = await RollDialog.prompt({ canSpendFP: !fpSpent, hasFP: fp > 0, isForceRoll: true });
    if (result === null) return;

    const { numActions, useForcePoint, forceDifficultyModifier } = result;

    if (useForcePoint) {
      await this.document.update({ "system.forcePoints": Math.max(0, fp - 1) });
        await this.document.setFlag("starwarsd6", "fpSpentThisRound", true);
    }

    const keepUpPenalty = system.keepUpPenalty ?? 0;
    const penalty = (numActions - 1) + keepUpPenalty + system.penaltyDice;
    const rollResult = await rollWithWildDie(totalDice, totalPips, penalty, undefined, { doubled: useForcePoint });
    rollResult.total = Math.max(0, rollResult.total - system.penaltyPips);

    const label = game.i18n.localize(`STARWARSD6.Force.Skill.${skillKey}`);
    await CharacterSheet.#postForceRollToChat(
      this.document, label, rollResult, numActions, keepUpPenalty,
      bonus, forceDifficultyModifier,
      { penaltyDice: system.penaltyDice, penaltyPips: system.penaltyPips }
    );
  }

  /**
   * Post a Force skill roll result to chat.
   * @param {Actor} actor
   * @param {string} label
   * @param {RollResult} result
   * @param {number} numActions
   * @param {number} keepUpPenalty
   * @param {{ bonusDice: number, bonusPips: number }} bonus
   * @param {number} forceDifficultyModifier
   */
  static async #postForceRollToChat(actor, label, result, numActions, keepUpPenalty, bonus, forceDifficultyModifier, { penaltyDice = 0, penaltyPips = 0 } = {}) {
    const speaker = ChatMessage.getSpeaker({ actor });
    const effectiveDice = result.normalDice.length + 1;

    const wildStr = result.wildRolls.length > 1
      ? result.wildRolls.map((v, i) => i === 0 ? `<b>${v}</b>` : `→${v}`).join(" ")
      : `<b>${result.wildRolls[0]}</b>`;

    const complications = result.isComplication
      ? `<span class="complication"> &#9888; ${game.i18n.localize("STARWARSD6.Roll.Complication")}</span>`
      : "";
    const explosion = result.wildRolls.length > 1
      ? `<span class="explosion"> &#128165; ${game.i18n.localize("STARWARSD6.Roll.Explosion")}</span>`
      : "";

    const normalStr = result.normalDice.length > 0
      ? `Normal: [${result.normalDice.join(", ")}] | ` : "";
    const pipsStr = result.pips > 0 ? ` +${result.pips} pips` : "";

    const bonusStr = (bonus.bonusDice > 0 || bonus.bonusPips > 0)
      ? `<div class="force-bonus">${game.i18n.localize("STARWARSD6.Force.ChatDSPBonus")}: +${bonus.bonusDice}D+${bonus.bonusPips}</div>`
      : "";
    const diffModStr = forceDifficultyModifier > 0
      ? `<div class="force-diff-mod">${game.i18n.localize("STARWARSD6.Force.ChatDiffModifier")}: +${forceDifficultyModifier}</div>`
      : "";
    const penaltyStr = CharacterSheet.#buildPenaltyLines(numActions, keepUpPenalty, penaltyDice, penaltyPips);

    const content = `
      <div class="starwarsd6 roll-result">
        <h3>${label}</h3>
        <div class="roll-formula">${effectiveDice}D${pipsStr}</div>
        ${bonusStr}
        ${diffModStr}
        ${penaltyStr}
        <div class="roll-dice">${normalStr}Wild: ${wildStr}${explosion}${complications}</div>
        <div class="roll-total"><strong>${game.i18n.localize("STARWARSD6.Roll.Total")}: <span class="total-value">${result.total}</span></strong></div>
      </div>`;

    await ChatMessage.create({ speaker, content });
  }

  /**
   * Increment dark side points and trigger the conversion check.
   * @this {CharacterSheet}
   */
  static async #addDarkSidePoint(event, target) {
    await applyDarkSidePoint(this.document);
  }

  static async #incrementStat(event, target) {
    const field = target.dataset.field;
    const current = foundry.utils.getProperty(this.document.system, field) ?? 0;
    await this.document.update({ [`system.${field}`]: current + 1 });
  }

  static async #decrementStat(event, target) {
    const field = target.dataset.field;
    const current = foundry.utils.getProperty(this.document.system, field) ?? 0;
    await this.document.update({ [`system.${field}`]: Math.max(0, current - 1) });
  }

  /**
   * Add a kept-up power from the text input.
   * @this {CharacterSheet}
   */
  static async #addKeptUpPower(event, target) {
    const input = this.element.querySelector(".kept-up-power-input");
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;
    const current = this.document.system.keptUpPowers;
    await this.document.update({ "system.keptUpPowers": [...current, name] });
    input.value = "";
  }

  /**
   * Remove a kept-up power by index.
   * @this {CharacterSheet}
   */
  static async #removeKeptUpPower(event, target) {
    const index = parseInt(target.dataset.powerIndex);
    const current = this.document.system.keptUpPowers;
    await this.document.update({
      "system.keptUpPowers": current.filter((_, i) => i !== index)
    });
  }

  static async #editImage(_event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document._source, attr);
    const fp = new foundry.applications.apps.FilePicker.implementation({
      current,
      type: "image",
      callback: path => this.document.update({ [attr]: path })
    });
    fp.browse(current);
  }
}
