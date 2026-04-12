import CharacterData from "./modules/actors/character-data.mjs";
import CharacterActor from "./modules/actors/character.mjs";
import SkillData from "./modules/items/skill-data.mjs";
import SkillItem from "./modules/items/skill.mjs";
import WeaponData from "./modules/items/weapon-data.mjs";
import ArmorData from "./modules/items/armor-data.mjs";
import EquipmentData from "./modules/items/equipment-data.mjs";
import CharacterSheet from "./modules/apps/character-sheet.mjs";
import SkillSheet from "./modules/apps/skill-sheet.mjs";
import ItemSheet from "./modules/apps/item-sheet.mjs";

Hooks.once("init", () => {
  CONFIG.Actor.documentClass = CharacterActor;
  CONFIG.Actor.dataModels = { character: CharacterData };
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
});
