## Phase 3 — Item Types: Weapon, Armor, Equipment

**Goal:** Three new item types with DataModels and basic sheets. Weapons and armor provide data that combat needs.

**Complexity:** M | **Dependencies:** Phase 1

### Files to create:
- `modules/items/weapon-data.mjs` — `WeaponData`
- `modules/items/weapon.mjs`
- `modules/items/armor-data.mjs` — `ArmorData`
- `modules/items/armor.mjs`
- `modules/items/equipment-data.mjs` — `EquipmentData`
- `modules/items/equipment.mjs`
- `modules/apps/item-sheet.mjs` — shared `ItemSheet`, switches on `this.document.type`
- `templates/items/weapon-sheet.hbs`, `armor-sheet.hbs`, `equipment-sheet.hbs`

### DataModel schemas:

**WeaponData:**
```js
{
  damageDice: NumberField({ integer: true, min: 1, initial: 4 }),
  damagePips: NumberField({ integer: true, min: 0, max: 2, initial: 0 }),
  attackSkill: StringField({ initial: "blaster" }),
  weaponBonus: NumberField({ integer: true, min: 0, initial: 0 }), // melee parry bonus
  range: StringField({ initial: "short" })
}
```

**ArmorData:** `{ armorBonus: NumberField({ integer: true, min: 0, initial: 0 }) }`

**EquipmentData:** `{ description: StringField, quantity: NumberField({ min: 0, initial: 1 }) }`

### Files to modify:
- `starwarsd6.mjs` — register all three DataModels, document classes, `ItemSheet`
- `system.json` — add `weapon`, `armor`, `equipment` to `documentTypes.Item`
- `lang/en.json` — item type labels, field labels
- `templates/actors/character-sheet.hbs` — add inventory tab listing actor's weapons/armor/equipment

**Testing:** Create weapon (damage 4D+1, attackSkill blaster), armor (armorBonus 2). Assign to character. Open inventory tab — both appear. Open weapon sheet — all fields editable.

**Ref:** `ref/dnd5e/module/data/item/weapon.mjs`; `ref/dnd5e/module/data/item/equipment.mjs`.
