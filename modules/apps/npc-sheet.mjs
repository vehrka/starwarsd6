import { rollWithWildDie } from "../helpers/dice.mjs";
import { applyDamage, removeOneMark } from "../helpers/damage.mjs";
import { calculateNpcDefense } from "../helpers/defense.mjs";
import RollDialog from "./roll-dialog.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;

const ATTRIBUTE_KEYS = ["DEX", "KNO", "MEC", "PER", "STR", "TEC"];

export default class NpcSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["starwarsd6", "sheet", "actor", "npc"],
    position: { width: 480, height: 520 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      editImage:     NpcSheet.#editImage,
      markHitBox:    NpcSheet.#markHitBox,
      rollAttribute: NpcSheet.#rollAttribute,
      rollSkill:     NpcSheet.#rollSkill,
      rollAttack:    NpcSheet.#rollAttack,
      deleteItem:    NpcSheet.#deleteItem
    }
  };

  static PARTS = {
    sheet: { template: "systems/starwarsd6/templates/actors/npc-sheet.hbs" }
  };

  get title() { return this.document.name; }

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
    const sys = this.document.system;
    const hitBoxes = sys.hitBoxes;
    context.system = sys;
    context.attributeGroups = ATTRIBUTE_KEYS.map(key => ({
      key,
      label: `STARWARSD6.Attribute.${key}`,
      dice: sys[key].dice,
      pips: sys[key].pips,
      baseValue: sys[key].baseValue,
      skills: this.document.items
        .filter(i => i.type === "skill" && i.system.attribute === key)
        .map(skill => ({
          id: skill.id,
          name: skill.name,
          dicePool: skill.system.dicePool,
          pips: skill.system.pips
        }))
    }));
    context.weapons = this.document.items
      .filter(i => i.type === "weapon")
      .map(i => {
        const skillName = i.system.attackSkill.toLowerCase();
        const skillItem = this.document.items.find(
          s => s.type === "skill" && s.name.toLowerCase() === skillName
        );
        const attrKey   = skillItem?.system.attribute ?? "DEX";
        const attr      = sys[attrKey] ?? sys.DEX;
        const skillDice = attr.dice + (skillItem?.system.rank ?? 0);
        const skillPips = attr.pips;
        const attackSkillDisplay = skillPips > 0 ? `${skillDice}D+${skillPips}` : `${skillDice}D`;
        return {
          id: i.id,
          name: i.name,
          damageDice: i.system.damageDice,
          damagePips: i.system.damagePips,
          attackSkill: i.system.attackSkill,
          attackSkillDisplay,
          skillDice,
          skillPips,
          range: i.system.range
        };
      });
    const defense = calculateNpcDefense(this.document);
    context.combatData = {
      hitBoxes,
      defense,
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

  static async #editImage(_event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document._source, attr);
    const fp = new foundry.applications.apps.FilePicker.implementation({
      current, type: "image",
      callback: path => this.document.update({ [attr]: path })
    });
    fp.browse(current);
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

  /**
   * Handle a click on an attribute's roll button.
   * @this {NpcSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target  Element with data-action="rollAttribute" data-attribute-key="..."
   */
  static async #rollAttribute(event, target) {
    const attributeKey = target.dataset.attributeKey;
    const attr = this.document.system[attributeKey];
    if (!attr) return;

    const defaultDifficulty = Math.ceil(3.5 * attr.dice);
    const result = await RollDialog.prompt({ showDifficulty: true, defaultDifficulty });
    if (result === null) return;

    const { numActions, difficulty } = result;
    const penaltyDice = this.document.system.penaltyDice;
    const penaltyPips = this.document.system.penaltyPips;
    const penalty = (numActions - 1) + penaltyDice;

    const rollResult = await rollWithWildDie(attr.dice, attr.pips, penalty);
    rollResult.total = Math.max(0, rollResult.total - penaltyPips);

    const attrLabel = game.i18n.localize(`STARWARSD6.Attribute.${attributeKey}`);
    await NpcSheet.#postRollToChat(
      this.document, attrLabel, rollResult, numActions,
      { penaltyDice, penaltyPips, difficulty }
    );
  }

  /**
   * Handle a click on a skill's roll button.
   * @this {NpcSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target  Element with data-action="rollSkill" data-skill-id="..."
   */
  static async #rollSkill(event, target) {
    const skillId = target.dataset.skillId;
    const skill = this.document.items.get(skillId);
    if (!skill) return;

    const defaultDifficulty = Math.ceil(3.5 * skill.system.dicePool);
    const result = await RollDialog.prompt({ showDifficulty: true, defaultDifficulty });
    if (result === null) return;

    const { numActions, difficulty } = result;
    const penaltyDice = this.document.system.penaltyDice;
    const penaltyPips = this.document.system.penaltyPips;
    const penalty = (numActions - 1) + penaltyDice;

    const rollResult = await rollWithWildDie(skill.system.dicePool, skill.system.pips, penalty);
    rollResult.total = Math.max(0, rollResult.total - penaltyPips);

    await NpcSheet.#postRollToChat(
      this.document, skill.name, rollResult, numActions,
      { penaltyDice, penaltyPips, difficulty }
    );
  }

  /**
   * Handle a click on a weapon's attack roll button.
   * @this {NpcSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target  Element with data-action="rollAttack" data-weapon-id="..."
   */
  static async #rollAttack(event, target) {
    const weaponId = target.dataset.weaponId;
    const weapon = this.document.items.get(weaponId);
    if (!weapon) return;

    const attackSkillName = weapon.system.attackSkill.toLowerCase();
    const skillDice = parseInt(target.dataset.skillDice) || this.document.system.DEX.dice;
    const skillPips  = parseInt(target.dataset.skillPips) || 0;

    const targets = [...game.user.targets];
    const targetToken = targets[0];
    const targetActor = targetToken?.actor ?? null;
    const noTarget = !targetActor;

    // Compute defense pre-fill before opening dialog
    const RANGED_SKILLS = ["blaster", "starship gunnery", "starfighter piloting"];
    const MELEE_SKILLS  = ["melee combat"];
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

    const dialogResult = await RollDialog.prompt({ showDifficulty: true, defaultDifficulty: rawDefenseValue });
    if (dialogResult === null) return;

    const { numActions, difficulty } = dialogResult;
    const penaltyDice = this.document.system.penaltyDice;
    const penaltyPips = this.document.system.penaltyPips;
    const totalPenalty = penaltyDice + (numActions - 1);

    const rollResult = await rollWithWildDie(skillDice, skillPips, totalPenalty);
    rollResult.total = Math.max(0, rollResult.total - penaltyPips);

    const defenseValue = Number.isFinite(difficulty) && difficulty > 0 ? difficulty : 0;
    const isHit = rollResult.total >= defenseValue;
    await NpcSheet.#postAttackToChat(
      this.document, weapon, rollResult, numActions, defenseLabel, defenseValue,
      targetActor, isHit, targetToken?.id ?? null,
      { penaltyDice, penaltyPips }
    );
  }

  /**
   * Delete an item from the actor's inventory.
   * @this {NpcSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target  Element with data-action="deleteItem"
   */
  static async #deleteItem(event, target) {
    const itemId = target.closest("[data-item-id]").dataset.itemId;
    const item = this.document.items.get(itemId);
    if (!item) return;
    await item.delete();
  }

  /**
   * Build penalty lines for the chat card body.
   * @param {number} numActions
   * @param {number} keepUpPenalty  Always 0 for NPCs; kept for body compatibility.
   * @param {number} [penaltyDice=0]
   * @param {number} [penaltyPips=0]
   * @returns {string}
   */
  static #buildPenaltyLines(numActions, keepUpPenalty, penaltyDice = 0, penaltyPips = 0) {
    const lines = [];
    if (numActions > 1)    lines.push(`${game.i18n.localize("STARWARSD6.Roll.Actions")}: ${numActions} (−${numActions - 1}D)`);
    if (keepUpPenalty > 0) lines.push(`${game.i18n.localize("STARWARSD6.Force.KeepUpPenaltyNote")}: −${keepUpPenalty}D`);
    if (penaltyDice > 0)   lines.push(`${game.i18n.localize("STARWARSD6.Combat.PenaltyDice")}: −${penaltyDice}D`);
    if (penaltyPips > 0)   lines.push(`${game.i18n.localize("STARWARSD6.Combat.PenaltyPips")}: −${penaltyPips}`);
    if (!lines.length) return "";
    return `<div class="roll-penalties">${lines.join(" · ")}</div>`;
  }

  /**
   * Post a roll result to the chat log.
   * @param {Actor} actor
   * @param {string} label
   * @param {RollResult} result
   * @param {number} numActions
   * @param {object} [options={}]
   * @param {number} [options.penaltyDice=0]
   * @param {number} [options.penaltyPips=0]
   * @param {number|null} [options.difficulty=null]
   */
  static async #postRollToChat(actor, label, result, numActions, { penaltyDice = 0, penaltyPips = 0, difficulty = null } = {}) {
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

    const penaltyStr = NpcSheet.#buildPenaltyLines(numActions, 0, penaltyDice, penaltyPips);

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
   * Post an attack roll result to chat.
   * @param {Actor} actor
   * @param {Item} weapon
   * @param {RollResult} result
   * @param {number} numActions
   * @param {string} defenseLabel
   * @param {number} defenseValue
   * @param {Actor|null} targetActor
   * @param {boolean} isHit
   * @param {string|null} targetTokenId
   * @param {object} [options={}]
   * @param {number} [options.penaltyDice=0]
   * @param {number} [options.penaltyPips=0]
   */
  static async #postAttackToChat(actor, weapon, result, numActions, defenseLabel, defenseValue, targetActor, isHit, targetTokenId = null, { penaltyDice = 0, penaltyPips = 0 } = {}) {
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

    const penaltyStr = NpcSheet.#buildPenaltyLines(numActions, 0, penaltyDice, penaltyPips);

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
}
