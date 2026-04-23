import CharacterData from "./modules/actors/character-data.mjs";
import CharacterActor from "./modules/actors/character.mjs";
import NpcData from "./modules/actors/npc-data.mjs";
import SkillData from "./modules/items/skill-data.mjs";
import SkillItem from "./modules/items/skill.mjs";
import WeaponData from "./modules/items/weapon-data.mjs";
import ArmorData from "./modules/items/armor-data.mjs";
import EquipmentData from "./modules/items/equipment-data.mjs";
import ForcePowerData from "./modules/items/force-power-data.mjs";
import ForcePowerItem from "./modules/items/force-power.mjs";
import CharacterSheet from "./modules/apps/character-sheet.mjs";
import NpcSheet from "./modules/apps/npc-sheet.mjs";
import SkillSheet from "./modules/apps/skill-sheet.mjs";
import ItemSheet from "./modules/apps/item-sheet.mjs";
import { rollDamage, rollExtraDie } from "./modules/helpers/dice.mjs";
import { showRollAnimation } from "./modules/helpers/dsn.mjs";
import { applyDamage, resolveDamageTier } from "./modules/helpers/damage.mjs";
import { handleSocketMessage, requestApplyDamage } from "./modules/helpers/socket.mjs";

/**
 * Resolve a target actor from a token ID (handles unlinked tokens) with actor ID fallback.
 * @param {string} tokenId
 * @param {string} actorId
 * @returns {Actor|null}
 */
function resolveTargetActor(tokenId, actorId) {
  if (tokenId) {
    const token = canvas.tokens?.get(tokenId);
    if (token?.actor) return token.actor;
  }
  return game.actors.get(actorId) ?? null;
}

Hooks.once("init", () => {
  CONFIG.Actor.documentClass = CharacterActor;
  CONFIG.Actor.dataModels = { character: CharacterData, npc: NpcData };
  CONFIG.Item.documentClass = SkillItem;
  CONFIG.Item.dataModels = {
    skill: SkillData,
    weapon: WeaponData,
    armor: ArmorData,
    equipment: EquipmentData,
    forcePower: ForcePowerData
  };

  const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;
  DocumentSheetConfig.unregisterSheet(Actor, "core", foundry.appv1.sheets.ActorSheet);
  DocumentSheetConfig.registerSheet(Actor, "starwarsd6", CharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "STARWARSD6.SheetClass.Character"
  });

  DocumentSheetConfig.registerSheet(Actor, "starwarsd6", NpcSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "STARWARSD6.SheetClass.NPC"
  });

  DocumentSheetConfig.unregisterSheet(Item, "core", foundry.appv1.sheets.ItemSheet);
  DocumentSheetConfig.registerSheet(Item, "starwarsd6", SkillSheet, {
    types: ["skill"],
    makeDefault: true,
    label: "STARWARSD6.SheetClass.Skill"
  });
  DocumentSheetConfig.registerSheet(Item, "starwarsd6", ItemSheet, {
    types: ["weapon", "armor", "equipment", "forcePower"],
    makeDefault: true,
    label: "STARWARSD6.SheetClass.Item"
  });

  // Roll Damage button — appears on attack chat cards when the roll is a hit with a target
  Hooks.on("renderChatMessageHTML", (message, html) => {
    html.querySelectorAll(".roll-damage-btn:not([disabled])").forEach(btn => {
      btn.addEventListener("click", async () => {
        const targetActorId = btn.dataset.targetActorId;
        const targetTokenId = btn.dataset.targetTokenId;
        const damageDice    = parseInt(btn.dataset.damageDice);
        const damagePips    = parseInt(btn.dataset.damagePips);
        const damageBase    = parseInt(btn.dataset.damageBase);

        const { total: damageTotal, roll: damageRoll } = await rollDamage(damageDice, damagePips);
        await showRollAnimation(damageRoll);
        const tier = resolveDamageTier(damageTotal, damageBase);

        // Disable button immediately to prevent double-click
        btn.disabled = true;

        const chatMsg = game.messages.get(message.id);
        if (!chatMsg) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(chatMsg.content, "text/html");

        // Disable the roll-damage-btn in stored content
        const dmgBtn = doc.querySelector(".roll-damage-btn");
        if (dmgBtn) dmgBtn.setAttribute("disabled", "disabled");

        // Append damage result section
        const resultEl = doc.querySelector(".starwarsd6.roll-result");
        if (resultEl) {
          const dmgSection = doc.createElement("div");
          dmgSection.className = "damage-result";
          const tierKey = tier.charAt(0).toUpperCase() + tier.slice(1);
          const tierLabel = game.i18n.localize(`STARWARSD6.Combat.${tierKey}`);
          dmgSection.innerHTML = `
            <div class="damage-total"><strong>${game.i18n.localize("STARWARSD6.Combat.DamageTotal")}: ${damageTotal}</strong>
              — <span class="damage-tier">${tierLabel}</span>
            </div>
            <div class="mark-hit-box-action">
              <button type="button" class="mark-hit-box-btn"
                      data-target-actor-id="${targetActorId}"
                      data-target-token-id="${targetTokenId}"
                      data-tier="${tier}">
                ${game.i18n.localize("STARWARSD6.Combat.MarkHitBox")}
              </button>
            </div>`;
          resultEl.appendChild(dmgSection);
        }

        await chatMsg.update({ content: doc.body.firstElementChild.outerHTML });
      });
    });

    // Mark Hit Box button — GM applies damage directly; non-GM sends socket request
    html.querySelectorAll(".mark-hit-box-btn:not([disabled])").forEach(btn => {
      btn.addEventListener("click", async () => {
        const targetActorId = btn.dataset.targetActorId;
        const targetTokenId = btn.dataset.targetTokenId;
        const tier = btn.dataset.tier;

        // Disable immediately to prevent double-click
        btn.disabled = true;

        if (game.user.isGM) {
          const actor = resolveTargetActor(targetTokenId, targetActorId);
          if (actor) await applyDamage(actor, tier);
        } else {
          requestApplyDamage(targetActorId, targetTokenId, tier);
        }

        // Persist disabled state in stored message content
        const chatMsg = game.messages.get(message.id);
        if (!chatMsg) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(chatMsg.content, "text/html");
        const markBtn = doc.querySelector(".mark-hit-box-btn");
        if (markBtn) markBtn.setAttribute("disabled", "disabled");
        await chatMsg.update({ content: doc.body.firstElementChild.outerHTML });
      });
    });

    // Spend CP button — repeatable per card; each click adds 1d6 to the roll total
    html.querySelectorAll(".spend-cp-btn:not([disabled])").forEach(btn => {
      btn.addEventListener("click", async () => {
        const actorId = btn.dataset.actorId;
        const actor = game.actors.get(actorId);
        if (!actor || actor.type !== "character") return;
        const cp = actor.system.characterPoints;
        if (cp <= 0) return;

        const dieFace = await rollExtraDie();

        const chatMsg = game.messages.get(message.id);
        if (!chatMsg) return;

        // Mutate stored content
        const parser = new DOMParser();
        const doc = parser.parseFromString(chatMsg.content, "text/html");
        const container = doc.querySelector(".starwarsd6.roll-result");
        if (!container) return;

        // Update stored total
        const totalSpan = container.querySelector(".total-value");
        const oldTotal = parseInt(totalSpan?.textContent) || 0;
        const newTotal = oldTotal + dieFace;
        if (totalSpan) totalSpan.textContent = String(newTotal);

        // Append new d6 to Normal dice list in stored content
        const rollDiceEl = container.querySelector(".roll-dice");
        if (rollDiceEl) {
          const diceHtml = rollDiceEl.innerHTML;
          if (/Normal:\s*\[/.test(diceHtml)) {
            rollDiceEl.innerHTML = diceHtml.replace(
              /Normal:\s*\[([^\]]*)\]/,
              (_, inner) => `Normal: [${inner}${inner.trim() ? ", " : ""}${dieFace}]`
            );
          } else {
            rollDiceEl.innerHTML = `Normal: [${dieFace}] | ` + diceHtml;
          }
        }

        // Recompute result label in stored content
        const difficulty = parseInt(container.dataset.difficulty);
        const rollType = container.dataset.rollType;
        const wasHit = Number.isFinite(difficulty) && difficulty > 0 && oldTotal >= difficulty;
        if (Number.isFinite(difficulty) && difficulty > 0) {
          const isSuccess = newTotal >= difficulty;
          if (rollType === "combat") {
            const span = container.querySelector(".roll-defense .hit, .roll-defense .miss");
            if (span) {
              span.className = isSuccess ? "hit" : "miss";
              span.textContent = game.i18n.localize(isSuccess ? "STARWARSD6.Combat.Hit" : "STARWARSD6.Combat.Miss");
            }
            // Inject damage button on MISS→HIT transition
            if (!wasHit && isSuccess) {
              const targetActorId = container.dataset.targetActorId;
              if (targetActorId) {
                const alreadyHasDmgBtn = container.querySelector(".roll-damage-btn");
                if (!alreadyHasDmgBtn) {
                  const dmgDiv = doc.createElement("div");
                  dmgDiv.className = "damage-action";
                  dmgDiv.innerHTML = `<button type="button" class="roll-damage-btn"
                    data-target-actor-id="${targetActorId}"
                    data-target-token-id="${container.dataset.targetTokenId}"
                    data-damage-dice="${container.dataset.damageDice}"
                    data-damage-pips="${container.dataset.damagePips}"
                    data-damage-base="${container.dataset.damageBase}">
                    ${game.i18n.localize("STARWARSD6.Combat.RollDamage")}
                  </button>`;
                  const cpBlock = container.querySelector(".cp-action");
                  if (cpBlock) container.insertBefore(dmgDiv, cpBlock);
                  else container.appendChild(dmgDiv);
                  // Mirror to live DOM — cloneNode required (separate DOM trees)
                  const liveContainer = html.querySelector(".starwarsd6.roll-result");
                  const liveCpBlock = liveContainer?.querySelector(".cp-action");
                  const liveDmgDiv = dmgDiv.cloneNode(true);
                  if (liveCpBlock) liveContainer.insertBefore(liveDmgDiv, liveCpBlock);
                  else liveContainer?.appendChild(liveDmgDiv);
                }
              }
            }
          } else {
            const span = container.querySelector(".roll-difficulty .success, .roll-difficulty .failure");
            if (span) {
              span.className = isSuccess ? "success" : "failure";
              span.textContent = game.i18n.localize(isSuccess ? "STARWARSD6.RollSuccess" : "STARWARSD6.RollFailure");
            }
          }
        }

        // Decrement CP
        const newCp = cp - 1;
        await actor.update({ "system.characterPoints": newCp });

        // Remove button block in stored content when CP exhausted
        if (newCp <= 0) {
          const block = container.querySelector(".cp-action");
          if (block) block.remove();
        }

        // Mirror mutations onto live DOM
        const liveContainer = html.querySelector(".starwarsd6.roll-result");
        if (liveContainer) {
          const liveTotal = liveContainer.querySelector(".total-value");
          if (liveTotal) liveTotal.textContent = String(newTotal);

          const liveDice = liveContainer.querySelector(".roll-dice");
          if (liveDice && rollDiceEl) liveDice.innerHTML = rollDiceEl.innerHTML;

          if (Number.isFinite(difficulty) && difficulty > 0) {
            if (rollType === "combat") {
              const storedSpan = container.querySelector(".roll-defense .hit, .roll-defense .miss");
              const liveSpan = liveContainer.querySelector(".roll-defense .hit, .roll-defense .miss");
              if (liveSpan && storedSpan) {
                liveSpan.className = storedSpan.className;
                liveSpan.textContent = storedSpan.textContent;
              }
            } else {
              const storedSpan = container.querySelector(".roll-difficulty .success, .roll-difficulty .failure");
              const liveSpan = liveContainer.querySelector(".roll-difficulty .success, .roll-difficulty .failure");
              if (liveSpan && storedSpan) {
                liveSpan.className = storedSpan.className;
                liveSpan.textContent = storedSpan.textContent;
              }
            }
          }

          if (newCp <= 0) {
            const liveBlock = liveContainer.querySelector(".cp-action");
            if (liveBlock) liveBlock.remove();
          }
        }

        await chatMsg.update({ content: doc.body.firstElementChild.outerHTML });
      });
    });
  });
});

// Register socket handler in "ready" — game.socket is not available in "init"
Hooks.once("ready", () => {
  game.socket.on("system.starwarsd6", handleSocketMessage);
});

Hooks.once("diceSoNiceReady", (dice3d) => {
  // Normal d6 — white background, black numbers
  dice3d.addColorset({
    name: "swd6-normal",
    description: "SW D6 Normal",
    category: "Star Wars D6",
    foreground: ["#000000"],
    background: ["#ffffff"],
    outline: "#cccccc",
    edge: "#aaaaaa",
    texture: "none",
    material: "plastic",
    visibility: "visible",
  });

  // PC wild die — pale green background, black numbers
  dice3d.addColorset({
    name: "swd6-pc-wild",
    description: "SW D6 PC Wild",
    category: "Star Wars D6",
    foreground: ["#000000"],
    background: ["#90ee90"],
    outline: "#4caf50",
    edge: "#4caf50",
    texture: "none",
    material: "plastic",
    visibility: "visible",
  });

  // NPC wild die — red background, white numbers
  dice3d.addColorset({
    name: "swd6-npc-wild",
    description: "SW D6 NPC Wild",
    category: "Star Wars D6",
    foreground: ["#ffffff"],
    background: ["#cc0000"],
    outline: "#880000",
    edge: "#880000",
    texture: "none",
    material: "plastic",
    visibility: "visible",
  });
});
