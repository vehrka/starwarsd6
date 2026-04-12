# PRP-feat005 — Item Types: Weapon, Armor, Equipment

## Goal

Add three new item types (`weapon`, `armor`, `equipment`) to the `starwarsd6` system:

- DataModels with the correct field schemas for each type
- Document classes (minimal, extending `Item`)
- A single shared `ItemSheet` ApplicationV2 sheet that selects its template based on item type
- Three Handlebars templates (one per type)
- An Inventory tab on the character sheet listing the actor's weapons, armor, and equipment
- Full registration in `starwarsd6.mjs` and `system.json`
- Localization keys in `lang/en.json`
- Vitest unit tests for the new DataModels
- `doc/implementation-plan.md` updated to mark Phase 3 complete

## Why

- Weapons and armor provide `damageDice/damagePips` and `armorBonus` values that Phase 4 (combat) needs
- Without item types, characters have no gear; the inventory tab is the first step toward usable play
- Follows the same pattern already established for `skill` items — low-risk, incremental extension

## What

### Success Criteria

- [ ] `weapon`, `armor`, `equipment` appear in Foundry's item-type dropdown when creating an Item
- [ ] Creating a weapon item stores `damageDice`, `damagePips`, `attackSkill`, `weaponBonus`, `range` with correct defaults
- [ ] Creating an armor item stores `armorBonus` (default 0)
- [ ] Creating an equipment item stores `description` and `quantity` (default 1)
- [ ] Double-clicking a weapon/armor/equipment item opens `ItemSheet` (not the core item sheet)
- [ ] Each item type's sheet renders the correct fields (no fields from other types bleed through)
- [ ] All fields are editable and persist on `submitOnChange`
- [ ] Character sheet has an "Inventory" tab listing the actor's weapons, armor, and equipment grouped by type
- [ ] All new user-visible strings are in `lang/en.json`; no raw i18n keys are visible
- [ ] Unit tests for WeaponData, ArmorData, EquipmentData pass (`npm test`)
- [ ] `doc/implementation-plan.md` Phase 3 marked ✓

---

## All Needed Context

### Documentation & References

```yaml
- url: https://foundryvtt.com/api/v13/modules.html
  why: v13 API — foundry.data.fields.*, foundry.abstract.TypeDataModel,
       DocumentSheetConfig.registerSheet, ApplicationV2 _configureRenderOptions

- file: modules/items/skill-data.mjs
  why: Exact DataModel pattern used in this project — destructure fields from foundry.data.fields,
       extend foundry.abstract.TypeDataModel, static defineSchema(), prepareDerivedData()
       COPY this pattern for WeaponData, ArmorData, EquipmentData

- file: modules/items/skill.mjs
  why: Minimal document class pattern — WeaponItem/ArmorItem/EquipmentItem follow the same template

- file: modules/apps/skill-sheet.mjs
  why: Exact ApplicationV2 sheet pattern — HandlebarsApplicationMixin, DEFAULT_OPTIONS, PARTS,
       _prepareContext. ItemSheet follows the same pattern but with dynamic template selection.

- file: starwarsd6.mjs
  why: Registration pattern — how dataModels, documentClass, DocumentSheetConfig.registerSheet
       are wired. Extend this for the three new types + ItemSheet.

- file: system.json
  why: documentTypes.Item — add "weapon", "armor", "equipment" entries here (required for Foundry
       to recognise the types; missing entry → type silently ignored)

- file: modules/apps/character-sheet.mjs
  why: _prepareContext pattern — add inventory data; _onRender dblclick pattern for items

- file: templates/actors/character-sheet.hbs
  why: Tab pattern (data-tab / data-group / tabGroups) — add a third "inventory" tab following
       the same CSS-driven show/hide pattern already used for attributes and skills tabs

- file: templates/items/skill-sheet.hbs
  why: Exact Handlebars template pattern for item sheets — header input[type=text], form-group divs

- file: lang/en.json
  why: Existing key style — follow STARWARSD6.Item.<Type>.<Field> naming convention

- file: tests/mocks/foundry.mjs
  why: Existing foundry mock — FieldStub and TypeDataModel base class. Reuse as-is for new tests.

- file: tests/unit/character-data.test.mjs
  why: Test pattern — Object.create(DataClass.prototype), assign fields manually, call
       prepareDerivedData() directly. Follow this exact structure for WeaponData tests.

- file: tests/unit/skill-data.test.mjs
  why: Test structure for item DataModels (no actor parent needed for WeaponData/ArmorData/EquipmentData)

- file: ref/dnd5e/module/data/item/weapon.mjs
  why: Reference for what weapon fields look like — our schema is much simpler (no templates/mixins),
       but the field types and options follow the same Foundry conventions

- file: ref/dnd5e/module/data/item/equipment.mjs
  why: Reference for equipment/armor field options
```

### Current Codebase Tree

```
fvtt-starwarsd6/
├── system.json                           ← ADD weapon/armor/equipment to documentTypes.Item
├── starwarsd6.mjs                        ← ADD imports + registration for 3 DataModels + ItemSheet
├── package.json                          ← exists, no change needed
├── vitest.config.mjs                     ← exists, no change needed
├── modules/
│   ├── actors/
│   │   ├── character-data.mjs            ← no change
│   │   └── character.mjs                 ← no change
│   ├── items/
│   │   ├── skill-data.mjs                ← no change
│   │   └── skill.mjs                     ← no change
│   └── apps/
│       ├── character-sheet.mjs           ← ADD inventory tab data to _prepareContext + tab nav
│       ├── skill-sheet.mjs               ← no change
│       └── roll-dialog.mjs               ← no change
├── templates/
│   ├── actors/
│   │   └── character-sheet.hbs           ← ADD inventory tab section + nav item
│   └── items/
│       └── skill-sheet.hbs               ← no change
├── styles/
│   └── starwarsd6.css                    ← ADD inventory tab styles
├── lang/
│   └── en.json                           ← ADD item type labels + field labels
└── tests/
    ├── setup.mjs                         ← no change
    ├── mocks/foundry.mjs                 ← no change
    └── unit/
        ├── character-data.test.mjs       ← no change
        ├── skill-data.test.mjs           ← no change
        └── dice.test.mjs                 ← no change
```

### Desired Codebase Tree (after feat005)

```
fvtt-starwarsd6/
├── system.json                           ← weapon/armor/equipment added
├── starwarsd6.mjs                        ← 3 new imports + ItemSheet import + registrations
├── modules/
│   ├── items/
│   │   ├── skill-data.mjs
│   │   ├── skill.mjs
│   │   ├── weapon-data.mjs               ← NEW: WeaponData
│   │   ├── weapon.mjs                    ← NEW: WeaponItem extends Item
│   │   ├── armor-data.mjs                ← NEW: ArmorData
│   │   ├── armor.mjs                     ← NEW: ArmorItem extends Item
│   │   ├── equipment-data.mjs            ← NEW: EquipmentData
│   │   └── equipment.mjs                 ← NEW: EquipmentItem extends Item
│   └── apps/
│       ├── character-sheet.mjs           ← inventory data in _prepareContext
│       ├── item-sheet.mjs                ← NEW: shared ItemSheet for weapon/armor/equipment
│       ├── skill-sheet.mjs
│       └── roll-dialog.mjs
├── templates/
│   ├── actors/
│   │   └── character-sheet.hbs           ← +inventory tab
│   └── items/
│       ├── skill-sheet.hbs
│       ├── weapon-sheet.hbs              ← NEW
│       ├── armor-sheet.hbs               ← NEW
│       └── equipment-sheet.hbs           ← NEW
├── styles/
│   └── starwarsd6.css                    ← +inventory tab styles
├── lang/
│   └── en.json                           ← +new keys
└── tests/
    └── unit/
        └── item-types.test.mjs           ← NEW: WeaponData, ArmorData, EquipmentData tests
```

---

## Known Gotchas & Critical Constraints

```js
// CRITICAL: system.json documentTypes.Item must include all three new types.
// Missing entry = Foundry ignores the type entirely — items can't be created.
// Pattern from existing:
//   "Item": { "skill": {}, "weapon": {}, "armor": {}, "equipment": {} }

// CRITICAL: CONFIG.Item.dataModels assignment is an object merge, not replacement.
// The existing code does: CONFIG.Item.dataModels = { skill: SkillData };
// You MUST change this to include all four types:
//   CONFIG.Item.dataModels = { skill: SkillData, weapon: WeaponData, armor: ArmorData, equipment: EquipmentData };
// Similarly CONFIG.Item.documentClass must handle all types. Since we have separate document classes,
// assign the most general one OR keep using the Item base. But the current code sets:
//   CONFIG.Item.documentClass = SkillItem;
// SkillItem is `class SkillItem extends Item {}` — it works for all types, but to be correct, use
// the base Item class. HOWEVER: changing documentClass would break SkillItem. The correct v13 approach
// for per-type document classes is to use CONFIG.Item.documentClasses (plural) — but this is complex.
// SIMPLEST CORRECT APPROACH: Keep CONFIG.Item.documentClass = SkillItem (no-op base class).
// WeaponItem, ArmorItem, EquipmentItem are also no-op base classes, so using SkillItem for all is fine.
// Do NOT try to set per-type document classes unless needed — none of the new types need custom behavior.

// CRITICAL: DocumentSheetConfig.registerSheet for ItemSheet covers weapon/armor/equipment:
//   DocumentSheetConfig.registerSheet(Item, "starwarsd6", ItemSheet, {
//     types: ["weapon", "armor", "equipment"],
//     makeDefault: true,
//     label: "STARWARSD6.SheetClass.Item"
//   });
// The existing SkillSheet registration already handles type: ["skill"].
// Do NOT unregister the core ItemSheet again (already done in feat003 registration block).

// CRITICAL: Dynamic template selection in ItemSheet.
// PARTS is a static property on ApplicationV2 — it cannot access instance data directly.
// The canonical v13 way to pick a template per item type is to override _configureRenderOptions():
//
//   async _configureRenderOptions(options) {
//     await super._configureRenderOptions(options);
//     const type = this.document.type;
//     const templates = {
//       weapon:    "systems/starwarsd6/templates/items/weapon-sheet.hbs",
//       armor:     "systems/starwarsd6/templates/items/armor-sheet.hbs",
//       equipment: "systems/starwarsd6/templates/items/equipment-sheet.hbs"
//     };
//     if (templates[type]) {
//       options.parts = { sheet: { template: templates[type] } };  // NOTE: wrong — see below
//     }
//   }
//
// ACTUALLY: options.parts is not how PARTS override works. The correct approach is to make
// PARTS a static getter that returns a placeholder, then override _preparePartContext to
// inject the correct template per-render. But that's also complex.
//
// SIMPLEST WORKING APPROACH (confirmed in v13 community practice):
// Override PARTS as a getter on the class prototype (not a static), using Object.defineProperty,
// OR use a single template with {{#if}} conditionals for each type.
//
// RECOMMENDED: Use ONE shared template "item-sheet.hbs" with type-conditional blocks.
// This is the simplest, no dynamic dispatch, one template to maintain:
//
//   static PARTS = {
//     sheet: { template: "systems/starwarsd6/templates/items/item-sheet.hbs" }
//   };
//
// In the template:
//   {{#if (eq item.type "weapon")}} ... weapon fields ... {{/if}}
//   {{#if (eq item.type "armor")}}  ... armor fields ...  {{/if}}
//   {{#if (eq item.type "equipment")}} ... equipment fields ... {{/if}}
//
// ALTERNATIVE if separate templates are strongly desired: define a static getter for PARTS
// that checks document type. This requires accessing this.document in a static context,
// which isn't possible. Use _configureRenderOptions to swap options.parts["sheet"].template:
//
//   async _configureRenderOptions(options) {
//     await super._configureRenderOptions(options);
//     const tpl = {
//       weapon:    "systems/starwarsd6/templates/items/weapon-sheet.hbs",
//       armor:     "systems/starwarsd6/templates/items/armor-sheet.hbs",
//       equipment: "systems/starwarsd6/templates/items/equipment-sheet.hbs"
//     }[this.document.type];
//     if (tpl) options.parts.sheet = { template: tpl };
//   }
//
// This DOES work in v13 — _configureRenderOptions receives the mutable options object before
// rendering and options.parts can be mutated. Use this approach to have separate template files
// as the feat spec requests.

// CRITICAL: options.parts in _configureRenderOptions is the resolved PARTS object for this
// render call. Mutating it does NOT affect static PARTS for future renders. Safe to use.

// CRITICAL: When context.item.type is used in HBS template, access it via the context object:
//   context.item = this.document;  (set in _prepareContext)
// Then in HBS: {{item.type}} works correctly.

// GOTCHA: WeaponData has no prepareDerivedData() needed — all fields are stored directly.
// ArmorData and EquipmentData also need no derivation. Only SkillData and CharacterData
// have prepareDerivedData(). Do not add empty prepareDerivedData() methods — YAGNI.

// GOTCHA: EquipmentData uses StringField for description (not a SchemaField).
// Initial value should be "" (empty string), blank: true.
// NumberField for quantity uses { required: true, nullable: false, integer: true, min: 0, initial: 1 }.

// GOTCHA: WeaponData.attackSkill is a StringField. Valid values include all skill names
// ("blaster", "melee combat", "brawling", etc.). Do NOT validate against a list in the DataModel
// — that is Phase 4 concern. Store as free text, initial: "blaster".

// GOTCHA: WeaponData.range is a StringField. Valid values: "engaged", "short", "medium", "long",
// "extreme". Store as free text (no validation), initial: "short".

// GOTCHA: WeaponData.weaponBonus is the melee parry bonus provided by the weapon (used for
// melee defense calculation in Phase 4). Not a damage bonus. Name is correct per the feat spec.

// CRITICAL: The inventory tab on the character sheet.
// Add a third tab "inventory" using the same pattern as "attributes" and "skills":
//   tabGroups = { primary: "attributes" };  ← default tab (no change)
//   Nav: data-action="tab" data-tab="inventory" data-group="primary"
//   Content: <section data-tab="inventory" data-group="primary" class="tab ...">
// In _prepareContext, add:
//   context.weapons = this.document.items.filter(i => i.type === "weapon")
//     .map(i => ({ id: i.id, name: i.name, damageDice: i.system.damageDice,
//                  damagePips: i.system.damagePips, attackSkill: i.system.attackSkill,
//                  range: i.system.range }));
//   context.armors = this.document.items.filter(i => i.type === "armor")
//     .map(i => ({ id: i.id, name: i.name, armorBonus: i.system.armorBonus }));
//   context.equipment = this.document.items.filter(i => i.type === "equipment")
//     .map(i => ({ id: i.id, name: i.name, quantity: i.system.quantity,
//                  description: i.system.description }));

// GOTCHA: The character sheet's _onRender already wires dblclick on [data-item-id] rows.
// No change needed there — the inventory tab rows can use the same data-item-id attribute.

// CRITICAL: Foundry globals — never import:
//   game, CONFIG, Hooks, Roll, Actor, Item, foundry (namespace is global)
// Destructure fields at module top level:
//   const { NumberField, StringField } = foundry.data.fields;
// Access sheet base class as:
//   const { HandlebarsApplicationMixin } = foundry.applications.api;
//   class ItemSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2)

// GOTCHA: Do not add a second unregisterSheet call for the core ItemSheet.
// starwarsd6.mjs already calls:
//   DocumentSheetConfig.unregisterSheet(Item, "core", foundry.appv1.sheets.ItemSheet);
// This unregisters the core sheet once; calling it again is a no-op but unnecessary.

// GOTCHA: Test for WeaponData/ArmorData/EquipmentData — these models have no prepareDerivedData,
// so unit tests focus on verifying that defineSchema() produces the expected field structure
// (field instances exist with correct options), and that defaults are correct.
// Since FieldStub is a no-op class, we test via the schema object returned by defineSchema().
// Pattern: call DataClass.defineSchema() directly, inspect keys and option values.
// Do NOT instantiate the DataModel class in tests (requires full Foundry runtime).

// GOTCHA: EquipmentData description field — use StringField({ initial: "", blank: true }).
// Without blank: true, StringField validates against empty string and throws.

// CRITICAL: npm test must still pass for ALL existing tests after adding new test file.
// Do not modify existing test files. The new tests/unit/item-types.test.mjs is an additive file.
```

---

## Implementation Blueprint

### Task 1 — CREATE `modules/items/weapon-data.mjs`

```js
const { NumberField, StringField } = foundry.data.fields;

export default class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      damageDice:  new NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 4 }),
      damagePips:  new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 0 }),
      attackSkill: new StringField({ required: true, initial: "blaster", blank: false }),
      weaponBonus: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      range:       new StringField({ required: true, initial: "short", blank: false })
    };
  }
  // No prepareDerivedData() — all fields stored directly
}
```

### Task 2 — CREATE `modules/items/weapon.mjs`

```js
export default class WeaponItem extends Item {}
```

### Task 3 — CREATE `modules/items/armor-data.mjs`

```js
const { NumberField } = foundry.data.fields;

export default class ArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      armorBonus: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
    };
  }
}
```

### Task 4 — CREATE `modules/items/armor.mjs`

```js
export default class ArmorItem extends Item {}
```

### Task 5 — CREATE `modules/items/equipment-data.mjs`

```js
const { NumberField, StringField } = foundry.data.fields;

export default class EquipmentData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new StringField({ initial: "", blank: true }),
      quantity:    new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 1 })
    };
  }
}
```

### Task 6 — CREATE `modules/items/equipment.mjs`

```js
export default class EquipmentItem extends Item {}
```

### Task 7 — CREATE `modules/apps/item-sheet.mjs`

Single sheet class for weapon, armor, and equipment. Uses `_configureRenderOptions` to select the correct template per item type.

```js
const { HandlebarsApplicationMixin } = foundry.applications.api;

// Fallback template (should never render — all three types have explicit templates)
const ITEM_TEMPLATES = {
  weapon:    "systems/starwarsd6/templates/items/weapon-sheet.hbs",
  armor:     "systems/starwarsd6/templates/items/armor-sheet.hbs",
  equipment: "systems/starwarsd6/templates/items/equipment-sheet.hbs"
};

export default class ItemSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["starwarsd6", "sheet", "item"],
    position: { width: 420, height: "auto" },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  // Base PARTS — overridden per-render in _configureRenderOptions
  static PARTS = {
    sheet: { template: "systems/starwarsd6/templates/items/weapon-sheet.hbs" }
  };

  async _configureRenderOptions(options) {
    await super._configureRenderOptions(options);
    const tpl = ITEM_TEMPLATES[this.document.type];
    if (tpl) options.parts.sheet = { template: tpl };
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.document;
    context.system = this.document.system;
    return context;
  }
}
```

**Note:** If `_configureRenderOptions` template swapping causes issues in testing or Foundry (e.g., PARTS is not mutable at that point), fall back to a single `templates/items/item-sheet.hbs` with `{{#if (eq item.type "weapon")}}` conditionals. That approach is guaranteed to work, though it requires one template instead of three.

### Task 8 — CREATE `templates/items/weapon-sheet.hbs`

```hbs
<div class="starwarsd6 sheet item weapon">
  <header class="sheet-header">
    <input type="text" name="name" value="{{item.name}}" placeholder="{{localize 'STARWARSD6.Item.Weapon.Name'}}" />
  </header>
  <section class="sheet-body">
    <div class="form-group">
      <label>{{localize "STARWARSD6.Item.Weapon.DamageDice"}}</label>
      <input type="number" name="system.damageDice" value="{{system.damageDice}}" min="1" />
    </div>
    <div class="form-group">
      <label>{{localize "STARWARSD6.Item.Weapon.DamagePips"}}</label>
      <input type="number" name="system.damagePips" value="{{system.damagePips}}" min="0" max="2" />
    </div>
    <div class="form-group">
      <label>{{localize "STARWARSD6.Item.Weapon.AttackSkill"}}</label>
      <input type="text" name="system.attackSkill" value="{{system.attackSkill}}" />
    </div>
    <div class="form-group">
      <label>{{localize "STARWARSD6.Item.Weapon.WeaponBonus"}}</label>
      <input type="number" name="system.weaponBonus" value="{{system.weaponBonus}}" min="0" />
    </div>
    <div class="form-group">
      <label>{{localize "STARWARSD6.Item.Weapon.Range"}}</label>
      <input type="text" name="system.range" value="{{system.range}}" />
    </div>
  </section>
</div>
```

### Task 9 — CREATE `templates/items/armor-sheet.hbs`

```hbs
<div class="starwarsd6 sheet item armor">
  <header class="sheet-header">
    <input type="text" name="name" value="{{item.name}}" placeholder="{{localize 'STARWARSD6.Item.Armor.Name'}}" />
  </header>
  <section class="sheet-body">
    <div class="form-group">
      <label>{{localize "STARWARSD6.Item.Armor.ArmorBonus"}}</label>
      <input type="number" name="system.armorBonus" value="{{system.armorBonus}}" min="0" />
    </div>
  </section>
</div>
```

### Task 10 — CREATE `templates/items/equipment-sheet.hbs`

```hbs
<div class="starwarsd6 sheet item equipment">
  <header class="sheet-header">
    <input type="text" name="name" value="{{item.name}}" placeholder="{{localize 'STARWARSD6.Item.Equipment.Name'}}" />
  </header>
  <section class="sheet-body">
    <div class="form-group">
      <label>{{localize "STARWARSD6.Item.Equipment.Quantity"}}</label>
      <input type="number" name="system.quantity" value="{{system.quantity}}" min="0" />
    </div>
    <div class="form-group">
      <label>{{localize "STARWARSD6.Item.Equipment.Description"}}</label>
      <textarea name="system.description" rows="4">{{system.description}}</textarea>
    </div>
  </section>
</div>
```

### Task 11 — MODIFY `starwarsd6.mjs`

Add imports for the three new DataModels, document classes, and `ItemSheet`. Update `CONFIG.Item.dataModels`, and add the `ItemSheet` sheet registration.

```js
// New imports (add after existing imports):
import WeaponData from "./modules/items/weapon-data.mjs";
import WeaponItem from "./modules/items/weapon.mjs";
import ArmorData from "./modules/items/armor-data.mjs";
import ArmorItem from "./modules/items/armor.mjs";
import EquipmentData from "./modules/items/equipment-data.mjs";
import EquipmentItem from "./modules/items/equipment.mjs";
import ItemSheet from "./modules/apps/item-sheet.mjs";

// Inside Hooks.once("init", () => { ... }):

// CHANGE the existing dataModels line from:
//   CONFIG.Item.dataModels = { skill: SkillData };
// TO:
CONFIG.Item.dataModels = {
  skill: SkillData,
  weapon: WeaponData,
  armor: ArmorData,
  equipment: EquipmentData
};

// ADD after the existing SkillSheet registerSheet block:
DocumentSheetConfig.registerSheet(Item, "starwarsd6", ItemSheet, {
  types: ["weapon", "armor", "equipment"],
  makeDefault: true,
  label: "STARWARSD6.SheetClass.Item"
});
```

**Note on document classes:** `CONFIG.Item.documentClass = SkillItem` stays unchanged. `WeaponItem`, `ArmorItem`, `EquipmentItem` are all `extends Item {}` no-ops, same as `SkillItem`. All four types work fine with the same `SkillItem` class set as the documentClass. The document class imports are added for completeness but the documentClass assignment stays as `SkillItem`. **Do not** attempt per-type document class configuration — it is not needed and adds unnecessary complexity.

Full updated `starwarsd6.mjs` structure:

```js
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
```

### Task 12 — MODIFY `system.json`

Add `weapon`, `armor`, `equipment` to `documentTypes.Item`:

```json
"documentTypes": {
  "Actor": {
    "character": {}
  },
  "Item": {
    "skill": {},
    "weapon": {},
    "armor": {},
    "equipment": {}
  }
}
```

### Task 13 — MODIFY `lang/en.json`

Add keys for item types, fields, and inventory tab. Append to the existing object:

```json
"STARWARSD6.Tab.Inventory": "Inventory",
"STARWARSD6.SheetClass.Item": "Star Wars D6 Item Sheet",
"STARWARSD6.Item.Weapon.Name": "Weapon Name",
"STARWARSD6.Item.Weapon.DamageDice": "Damage Dice",
"STARWARSD6.Item.Weapon.DamagePips": "Damage Pips",
"STARWARSD6.Item.Weapon.AttackSkill": "Attack Skill",
"STARWARSD6.Item.Weapon.WeaponBonus": "Weapon Bonus",
"STARWARSD6.Item.Weapon.Range": "Range",
"STARWARSD6.Item.Weapon.Damage": "Damage",
"STARWARSD6.Item.Armor.Name": "Armor Name",
"STARWARSD6.Item.Armor.ArmorBonus": "Armor Bonus",
"STARWARSD6.Item.Equipment.Name": "Equipment Name",
"STARWARSD6.Item.Equipment.Quantity": "Quantity",
"STARWARSD6.Item.Equipment.Description": "Description",
"STARWARSD6.Inventory.Weapons": "Weapons",
"STARWARSD6.Inventory.Armor": "Armor",
"STARWARSD6.Inventory.Equipment": "Equipment",
"STARWARSD6.Inventory.Empty": "None"
```

### Task 14 — MODIFY `modules/apps/character-sheet.mjs`

Add inventory data to `_prepareContext`. No other changes needed.

```js
// In _prepareContext, add AFTER the forceSkills block:
context.weapons = this.document.items
  .filter(i => i.type === "weapon")
  .map(i => ({
    id: i.id,
    name: i.name,
    damageDice: i.system.damageDice,
    damagePips: i.system.damagePips,
    attackSkill: i.system.attackSkill,
    range: i.system.range
  }));
context.armors = this.document.items
  .filter(i => i.type === "armor")
  .map(i => ({
    id: i.id,
    name: i.name,
    armorBonus: i.system.armorBonus
  }));
context.equipment = this.document.items
  .filter(i => i.type === "equipment")
  .map(i => ({
    id: i.id,
    name: i.name,
    quantity: i.system.quantity,
    description: i.system.description
  }));
```

### Task 15 — MODIFY `templates/actors/character-sheet.hbs`

Add "Inventory" nav item and tab section. Insert after the closing `</section>` of the Skills tab and before the closing `</div>`.

**Nav addition** (inside the `<nav class="sheet-tabs tabs" data-group="primary">` block):
```hbs
<a class="item {{#if (eq tabs.primary 'inventory')}}active{{/if}}"
   data-action="tab" data-tab="inventory" data-group="primary">
  {{localize "STARWARSD6.Tab.Inventory"}}
</a>
```

**Tab section addition** (after the skills `</section>` closing tag):
```hbs
{{!-- INVENTORY TAB --}}
<section class="tab {{#if (eq tabs.primary 'inventory')}}active{{/if}}"
         data-tab="inventory" data-group="primary">

  <h3>{{localize "STARWARSD6.Inventory.Weapons"}}</h3>
  {{#if weapons.length}}
    <table class="inventory-table">
      <thead>
        <tr>
          <th>{{localize "STARWARSD6.Skill.Name"}}</th>
          <th>{{localize "STARWARSD6.Item.Weapon.Damage"}}</th>
          <th>{{localize "STARWARSD6.Item.Weapon.AttackSkill"}}</th>
          <th>{{localize "STARWARSD6.Item.Weapon.Range"}}</th>
        </tr>
      </thead>
      <tbody>
        {{#each weapons as |weapon|}}
        <tr class="item-row" data-item-id="{{weapon.id}}">
          <td>{{weapon.name}}</td>
          <td>{{weapon.damageDice}}D{{#if weapon.damagePips}}+{{weapon.damagePips}}{{/if}}</td>
          <td>{{weapon.attackSkill}}</td>
          <td>{{weapon.range}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  {{else}}
    <p class="no-items">{{localize "STARWARSD6.Inventory.Empty"}}</p>
  {{/if}}

  <h3>{{localize "STARWARSD6.Inventory.Armor"}}</h3>
  {{#if armors.length}}
    <table class="inventory-table">
      <thead>
        <tr>
          <th>{{localize "STARWARSD6.Skill.Name"}}</th>
          <th>{{localize "STARWARSD6.Item.Armor.ArmorBonus"}}</th>
        </tr>
      </thead>
      <tbody>
        {{#each armors as |armor|}}
        <tr class="item-row" data-item-id="{{armor.id}}">
          <td>{{armor.name}}</td>
          <td>{{armor.armorBonus}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  {{else}}
    <p class="no-items">{{localize "STARWARSD6.Inventory.Empty"}}</p>
  {{/if}}

  <h3>{{localize "STARWARSD6.Inventory.Equipment"}}</h3>
  {{#if equipment.length}}
    <table class="inventory-table">
      <thead>
        <tr>
          <th>{{localize "STARWARSD6.Skill.Name"}}</th>
          <th>{{localize "STARWARSD6.Item.Equipment.Quantity"}}</th>
        </tr>
      </thead>
      <tbody>
        {{#each equipment as |eq|}}
        <tr class="item-row" data-item-id="{{eq.id}}">
          <td>{{eq.name}}</td>
          <td>{{eq.quantity}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  {{else}}
    <p class="no-items">{{localize "STARWARSD6.Inventory.Empty"}}</p>
  {{/if}}

</section>
```

### Task 16 — MODIFY `styles/starwarsd6.css`

Add inventory table styles (append to existing file):

```css
/* Inventory tab */
.starwarsd6.sheet .inventory-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1em;
}

.starwarsd6.sheet .inventory-table th,
.starwarsd6.sheet .inventory-table td {
  border: 1px solid #ccc;
  padding: 4px 8px;
  text-align: left;
}

.starwarsd6.sheet .inventory-table th {
  background: #2a2a2a;
  color: #fff;
}

.starwarsd6.sheet .no-items {
  color: #888;
  font-style: italic;
}

/* Item sheet body */
.starwarsd6.sheet.item .sheet-body {
  padding: 8px;
}

.starwarsd6.sheet.item .sheet-body .form-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.starwarsd6.sheet.item .sheet-body .form-group label {
  min-width: 120px;
  font-weight: bold;
  flex-shrink: 0;
}

.starwarsd6.sheet.item .sheet-body textarea {
  flex: 1;
  resize: vertical;
}
```

### Task 17 — CREATE `tests/unit/item-types.test.mjs`

Tests for the three new DataModels. Since none have `prepareDerivedData()`, tests verify `defineSchema()` returns the correct field keys and default values (via the FieldStub options stored on the instance).

```js
import { describe, it, expect } from "vitest";
import WeaponData from "../../modules/items/weapon-data.mjs";
import ArmorData from "../../modules/items/armor-data.mjs";
import EquipmentData from "../../modules/items/equipment-data.mjs";

// Helper: call defineSchema() and return the schema object
function schema(DataClass) {
  return DataClass.defineSchema();
}

describe("WeaponData.defineSchema()", () => {
  it("has all required fields", () => {
    const s = schema(WeaponData);
    expect(s).toHaveProperty("damageDice");
    expect(s).toHaveProperty("damagePips");
    expect(s).toHaveProperty("attackSkill");
    expect(s).toHaveProperty("weaponBonus");
    expect(s).toHaveProperty("range");
  });

  it("damageDice has initial=4, min=1", () => {
    const { damageDice } = schema(WeaponData);
    expect(damageDice.initial).toBe(4);
    expect(damageDice.min).toBe(1);
  });

  it("damagePips has initial=0, max=2", () => {
    const { damagePips } = schema(WeaponData);
    expect(damagePips.initial).toBe(0);
    expect(damagePips.max).toBe(2);
  });

  it("attackSkill has initial='blaster'", () => {
    const { attackSkill } = schema(WeaponData);
    expect(attackSkill.initial).toBe("blaster");
  });

  it("weaponBonus has initial=0, min=0", () => {
    const { weaponBonus } = schema(WeaponData);
    expect(weaponBonus.initial).toBe(0);
    expect(weaponBonus.min).toBe(0);
  });

  it("range has initial='short'", () => {
    const { range } = schema(WeaponData);
    expect(range.initial).toBe("short");
  });

  it("has no prepareDerivedData override (no derivation needed)", () => {
    // prepareDerivedData from base TypeDataModel stub should be the only one
    const instance = Object.create(WeaponData.prototype);
    // Should not throw when called with no data — base class no-op
    expect(() => instance.prepareDerivedData?.()).not.toThrow();
  });
});

describe("ArmorData.defineSchema()", () => {
  it("has armorBonus field", () => {
    const s = schema(ArmorData);
    expect(s).toHaveProperty("armorBonus");
  });

  it("armorBonus has initial=0, min=0", () => {
    const { armorBonus } = schema(ArmorData);
    expect(armorBonus.initial).toBe(0);
    expect(armorBonus.min).toBe(0);
  });

  it("has exactly one field (no extra fields)", () => {
    const s = schema(ArmorData);
    expect(Object.keys(s)).toHaveLength(1);
  });
});

describe("EquipmentData.defineSchema()", () => {
  it("has description and quantity fields", () => {
    const s = schema(EquipmentData);
    expect(s).toHaveProperty("description");
    expect(s).toHaveProperty("quantity");
  });

  it("quantity has initial=1, min=0", () => {
    const { quantity } = schema(EquipmentData);
    expect(quantity.initial).toBe(1);
    expect(quantity.min).toBe(0);
  });

  it("description has blank:true (allows empty string)", () => {
    const { description } = schema(EquipmentData);
    expect(description.blank).toBe(true);
  });

  it("has exactly two fields", () => {
    const s = schema(EquipmentData);
    expect(Object.keys(s)).toHaveLength(2);
  });
});
```

### Task 18 — UPDATE `doc/implementation-plan.md`

Two targeted changes only:

1. **Update current-state line** (line 4):
   - Find: `feat003 (skill sheet & data expansion) complete`
   - Replace with: `feat003 (skill sheet & data expansion) complete; feat004 (dice engine) complete; feat005 (item types) complete`

2. **Mark Phase 3 complete in the Phase Overview table**:
   - Find: `| 3 | Item Types | Weapons, armor, equipment | M | 1 |`
   - Replace with: `| 3 ✓ | Item Types | Weapons, armor, equipment | M | 1 |`

---

## Integration Points

```yaml
system.json:
  - documentTypes.Item: add "weapon": {}, "armor": {}, "equipment": {}
  - No other manifest changes needed

starwarsd6.mjs:
  - CONFIG.Item.dataModels: add WeaponData, ArmorData, EquipmentData keys
  - DocumentSheetConfig.registerSheet: add ItemSheet for ["weapon","armor","equipment"]
  - Do NOT change CONFIG.Item.documentClass

character-sheet.mjs:
  - _prepareContext: add context.weapons, context.armors, context.equipment
  - No changes to tabGroups, PARTS, DEFAULT_OPTIONS, or _onRender

character-sheet.hbs:
  - Add "Inventory" nav tab button
  - Add inventory <section> tab content block
  - Existing attributes and skills tabs: untouched
```

---

## Validation Loop

### Level 1 — Static File Checks

Run these grep checks after implementation:

```bash
# Verify new files exist
ls modules/items/weapon-data.mjs modules/items/weapon.mjs \
   modules/items/armor-data.mjs modules/items/armor.mjs \
   modules/items/equipment-data.mjs modules/items/equipment.mjs \
   modules/apps/item-sheet.mjs \
   templates/items/weapon-sheet.hbs \
   templates/items/armor-sheet.hbs \
   templates/items/equipment-sheet.hbs \
   tests/unit/item-types.test.mjs \
  && echo "OK: all new files exist" || echo "ERROR: missing file"

# Verify no Foundry globals imported (they are destructured, not imported)
grep -n "^import.*foundry\|^import.*NumberField\|^import.*StringField\|^import.*HandlebarsApplicationMixin" \
  modules/items/weapon-data.mjs modules/items/armor-data.mjs \
  modules/items/equipment-data.mjs modules/apps/item-sheet.mjs \
  && echo "ERROR: forbidden import found" || echo "OK: no forbidden imports"

# Verify DataModel field destructuring pattern
grep -n "foundry.data.fields" \
  modules/items/weapon-data.mjs \
  modules/items/armor-data.mjs \
  modules/items/equipment-data.mjs \
  && echo "OK: correct field destructuring" || echo "ERROR: missing destructuring"

# Verify system.json has all three new types
grep -n '"weapon"\|"armor"\|"equipment"' system.json \
  && echo "OK: item types in system.json" || echo "ERROR: missing from system.json"

# Verify starwarsd6.mjs imports and registers all three DataModels
grep -n "WeaponData\|ArmorData\|EquipmentData\|ItemSheet" starwarsd6.mjs \
  && echo "OK: all imports present" || echo "ERROR: missing import/registration"

# Verify CONFIG.Item.dataModels includes all four types
grep -n "weapon:\|armor:\|equipment:" starwarsd6.mjs \
  && echo "OK: dataModels updated" || echo "ERROR: dataModels not updated"

# Verify ItemSheet registration in starwarsd6.mjs
grep -n '"weapon", "armor", "equipment"\|ItemSheet' starwarsd6.mjs \
  && echo "OK: ItemSheet registered" || echo "ERROR: ItemSheet not registered"

# Verify inventory tab data in character-sheet.mjs
grep -n "weapons\|armors\|equipment" modules/apps/character-sheet.mjs \
  && echo "OK: inventory context added" || echo "ERROR: missing inventory context"

# Verify inventory tab in character-sheet.hbs
grep -n "inventory" templates/actors/character-sheet.hbs \
  && echo "OK: inventory tab in template" || echo "ERROR: missing inventory tab"

# Verify lang/en.json has new keys
grep -n "STARWARSD6.Tab.Inventory\|STARWARSD6.Inventory\|STARWARSD6.Item.Weapon" lang/en.json \
  && echo "OK: i18n keys added" || echo "ERROR: missing i18n keys"

# Verify no deprecated APIs
grep -rn "getData\|mergeObject\|Actors\.registerSheet\|Items\.registerSheet" \
  modules/apps/item-sheet.mjs \
  && echo "ERROR: deprecated API" || echo "OK: no deprecated APIs"

# Verify implementation-plan.md updated
grep -n "feat005\|3 ✓" doc/implementation-plan.md \
  && echo "OK: plan updated" || echo "ERROR: plan not updated"
```

### Level 2 — Run Unit Tests

```bash
# Run full test suite — ALL tests must pass (existing + new)
npm test
```

Expected output:
```
 ✓ tests/unit/character-data.test.mjs
 ✓ tests/unit/skill-data.test.mjs
 ✓ tests/unit/dice.test.mjs
 ✓ tests/unit/item-types.test.mjs

 Test Files  4 passed (4)
 Tests       N passed (N)
```

**If a test fails:**
- Read the assertion error carefully
- Fix the source DataModel (not the test expectations)
- Re-run `npm test`
- Do NOT mock `defineSchema()` — the tests call it directly

### Level 3 — Deploy and Functional Validation (Manual, in Foundry)

```bash
# NOTE: Do not run deploy.sh — the user deploys manually.
# Report the deploy step is needed and let the user run it.
```

Then in Foundry (user verifies):

1. **No init errors**: Open world → browser console clean
2. **Item creation**:
   - Create an Item → type dropdown shows weapon, armor, equipment (alongside skill)
   - Create weapon "DL-44 Blaster Pistol" → default fields: damageDice=4, damagePips=0, attackSkill="blaster", range="short"
   - Create armor "Stormtrooper Armor" → default armorBonus=0
   - Create equipment "Medpac" → quantity=1, description=""
3. **Item sheets**:
   - Double-click weapon → ItemSheet opens with weapon fields (damageDice, damagePips, attackSkill, weaponBonus, range)
   - Double-click armor → ItemSheet opens with armorBonus field only
   - Double-click equipment → ItemSheet opens with quantity and description
   - Edit weapon damageDice → close → reopen → value persists (submitOnChange working)
4. **Inventory tab**:
   - Open any character actor → "Inventory" tab visible in nav bar
   - Assign weapon and armor to the character (drag or create embedded items)
   - Click Inventory tab → weapons appear in Weapons table, armor in Armor table
   - Equipment items appear in Equipment table
   - Empty sections show "None" placeholder
   - Double-click inventory row → opens the item sheet

### Final Validation Checklist

- [ ] `ls modules/items/weapon-data.mjs modules/items/armor-data.mjs modules/items/equipment-data.mjs` — all exist
- [ ] `ls modules/apps/item-sheet.mjs` — exists
- [ ] `ls templates/items/weapon-sheet.hbs templates/items/armor-sheet.hbs templates/items/equipment-sheet.hbs` — all exist
- [ ] `grep '"weapon"\|"armor"\|"equipment"' system.json` — three entries present
- [ ] `grep "WeaponData\|ArmorData\|EquipmentData" starwarsd6.mjs` — all imported and in dataModels
- [ ] `grep "ItemSheet" starwarsd6.mjs` — imported and registered for three types
- [ ] `grep "inventory" modules/apps/character-sheet.mjs` — context added
- [ ] `grep "inventory" templates/actors/character-sheet.hbs` — tab present
- [ ] `grep "STARWARSD6.Tab.Inventory" lang/en.json` — key present
- [ ] `npm test` exits 0, 4 test files passing
- [ ] `doc/implementation-plan.md` has `3 ✓` and `feat005` in current-state line
- [ ] (After user deploys) Inventory tab shows weapons/armor/equipment grouped correctly
- [ ] (After user deploys) Item type sheets open the correct template per type

---

## Anti-Patterns to Avoid

- **Do not** `import { NumberField }` from anywhere — destructure from `foundry.data.fields` at module top
- **Do not** import `foundry`, `Item`, `Actor`, `CONFIG`, `Hooks`, `game` — these are Foundry globals
- **Do not** add `prepareDerivedData()` to WeaponData, ArmorData, or EquipmentData — none have derived fields; YAGNI
- **Do not** try to set per-type document classes via `CONFIG.Item.documentClasses` — not needed, adds complexity
- **Do not** call `DocumentSheetConfig.unregisterSheet` for the core ItemSheet again — already done in feat003 code
- **Do not** rename or change the existing `SkillItem`/`SkillData` registrations in `starwarsd6.mjs`
- **Do not** use `getData()`, `mergeObject()`, or `duplicate()` — deprecated v13 APIs
- **Do not** alter existing test files — `item-types.test.mjs` is the only new test file
- **Do not** modify `tabGroups = { primary: "attributes" }` — the inventory tab becomes accessible via click; default stays "attributes"
- **Do not** add WeaponItem/ArmorItem/EquipmentItem imports to `starwarsd6.mjs` if they have no behavior — they are not needed there since `CONFIG.Item.documentClass = SkillItem` (a no-op base) handles all types
- **Do not** run `deploy.sh` — the user deploys manually

---

## Confidence Score: 8.5/10

**Strong foundations:**
- Existing DataModel pattern (SkillData) is proven and directly replicable
- Existing sheet pattern (SkillSheet) is proven and directly replicable for ItemSheet
- Registration pattern in `starwarsd6.mjs` is established and documented
- Test pattern is established and the new tests only need `defineSchema()` calls
- The inventory tab follows the exact same CSS-tab pattern as attributes/skills (already working)

**Deductions:**
- **-1**: `_configureRenderOptions` template swapping for ItemSheet is correct per v13 API but hasn't been exercised in this project yet. If options.parts mutation doesn't work as expected, fall back to a single `item-sheet.hbs` with `{{#if (eq item.type ...)}}` conditionals — that approach has zero risk.
- **-0.5**: The 3-template approach creates three separate HBS files that each follow the same simple pattern. Risk is low but slightly more surface area than a single template approach.
