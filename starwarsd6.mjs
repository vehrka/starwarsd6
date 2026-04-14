import CharacterData from "./modules/actors/character-data.mjs";
import CharacterActor from "./modules/actors/character.mjs";
import NpcData from "./modules/actors/npc-data.mjs";
import NpcActor from "./modules/actors/npc.mjs";
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
import { rollExtraDie, rollDamage } from "./modules/helpers/dice.mjs";
import { applyDamage, resolveDamageTier } from "./modules/helpers/damage.mjs";
import { handleSocketMessage, requestApplyDamage } from "./modules/helpers/socket.mjs";

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

  // CP spend: attach click listener to "Spend CP" buttons on chat cards
  Hooks.on("renderChatMessageHTML", (message, html) => {
    html.querySelectorAll(".spend-cp-btn:not([disabled])").forEach(btn => {
      btn.addEventListener("click", async () => {
        const actorId = btn.dataset.actorId;
        const actor = game.actors.get(actorId);
        if (!actor) return;
        if (actor.system.characterPoints <= 0) return;

        // Roll 1 extra d6
        const extraValue = await rollExtraDie();

        // Decrement CP and set FP-spent flag (mutual exclusivity)
        await actor.update({ "system.characterPoints": actor.system.characterPoints - 1 });
        await actor.setFlag("starwarsd6", "fpSpentThisRound", true);

        // Update the chat message: add extra die to total, disable button
        const msgId = btn.closest("[data-message-id]").dataset.messageId;
        const chatMsg = game.messages.get(msgId);
        if (!chatMsg) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(chatMsg.content, "text/html");
        const totalEl = doc.querySelector(".total-value");
        if (totalEl) {
          const newTotal = parseInt(totalEl.textContent) + extraValue;
          totalEl.textContent = newTotal;
          const totalRow = doc.querySelector(".roll-total");
          if (totalRow) {
            const extraNote = doc.createElement("span");
            extraNote.className = "extra-die";
            extraNote.textContent = ` +${extraValue} ${game.i18n.localize("STARWARSD6.Roll.ExtraDie")}`;
            totalRow.appendChild(extraNote);
          }
        }
        // Disable the CP button
        const cpBtn = doc.querySelector(".spend-cp-btn");
        if (cpBtn) cpBtn.setAttribute("disabled", "disabled");

        await chatMsg.update({ content: doc.body.innerHTML });
      });
    });
  });

  // Clear fpSpentThisRound for all combatants when the round advances
  Hooks.on("combatRound", (combat, _updateData, _options) => {
    combat.combatants.forEach(c => {
      c.actor?.setFlag("starwarsd6", "fpSpentThisRound", false);
    });
  });

  // Roll Damage button — appears on attack chat cards when the roll is a hit with a target
  Hooks.on("renderChatMessageHTML", (message, html) => {
    html.querySelectorAll(".roll-damage-btn:not([disabled])").forEach(btn => {
      btn.addEventListener("click", async () => {
        const targetActorId = btn.dataset.targetActorId;
        const damageDice    = parseInt(btn.dataset.damageDice);
        const damagePips    = parseInt(btn.dataset.damagePips);
        const damageBase    = parseInt(btn.dataset.damageBase);

        const damageTotal = await rollDamage(damageDice, damagePips);
        const tier = resolveDamageTier(damageTotal, damageBase);

        // Disable button immediately to prevent double-click
        btn.disabled = true;

        // Update chat message in place — same DOMParser pattern as the CP spend above
        const msgId = btn.closest("[data-message-id]").dataset.messageId;
        const chatMsg = game.messages.get(msgId);
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
                      data-tier="${tier}">
                ${game.i18n.localize("STARWARSD6.Combat.MarkHitBox")}
              </button>
            </div>`;
          resultEl.appendChild(dmgSection);
        }

        await chatMsg.update({ content: doc.body.innerHTML });
      });
    });

    // Mark Hit Box button — GM applies damage directly; non-GM sends socket request
    html.querySelectorAll(".mark-hit-box-btn:not([disabled])").forEach(btn => {
      btn.addEventListener("click", async () => {
        const targetActorId = btn.dataset.targetActorId;
        const tier = btn.dataset.tier;

        // Disable immediately to prevent double-click
        btn.disabled = true;

        if (game.user.isGM) {
          const actor = game.actors.get(targetActorId);
          if (actor) await applyDamage(actor, tier);
        } else {
          requestApplyDamage(targetActorId, tier);
        }

        // Persist disabled state in stored message content
        const msgId = btn.closest("[data-message-id]").dataset.messageId;
        const chatMsg = game.messages.get(msgId);
        if (!chatMsg) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(chatMsg.content, "text/html");
        const markBtn = doc.querySelector(".mark-hit-box-btn");
        if (markBtn) markBtn.setAttribute("disabled", "disabled");
        await chatMsg.update({ content: doc.body.innerHTML });
      });
    });
  });
});

// Register socket handler in "ready" — game.socket is not available in "init"
Hooks.once("ready", () => {
  game.socket.on("system.starwarsd6", handleSocketMessage);
});
