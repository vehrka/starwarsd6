import CharacterData from "./modules/actors/character-data.mjs";
import CharacterActor from "./modules/actors/character.mjs";
import NpcData from "./modules/actors/npc-data.mjs";
import NpcActor from "./modules/actors/npc.mjs";
import SkillData from "./modules/items/skill-data.mjs";
import SkillItem from "./modules/items/skill.mjs";
import WeaponData from "./modules/items/weapon-data.mjs";
import ArmorData from "./modules/items/armor-data.mjs";
import EquipmentData from "./modules/items/equipment-data.mjs";
import CharacterSheet from "./modules/apps/character-sheet.mjs";
import NpcSheet from "./modules/apps/npc-sheet.mjs";
import SkillSheet from "./modules/apps/skill-sheet.mjs";
import ItemSheet from "./modules/apps/item-sheet.mjs";
import { rollExtraDie } from "./modules/helpers/dice.mjs";

Hooks.once("init", () => {
  CONFIG.Actor.documentClass = CharacterActor;
  CONFIG.Actor.dataModels = { character: CharacterData, npc: NpcData };
  CONFIG.Item.documentClass = SkillItem;
  CONFIG.Item.dataModels = {
    skill: SkillData,
    weapon: WeaponData,
    armor: ArmorData,
    equipment: EquipmentData
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
    types: ["weapon", "armor", "equipment"],
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
      c.actor?.unsetFlag("starwarsd6", "fpSpentThisRound");
    });
  });
});
