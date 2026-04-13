# PRP-feat012 — Force Powers Item Type

## Goal

Add a `forcePower` item type so Force-sensitive characters can own, document, and manage their Force powers from the Force tab. Toggling a power's `keptUp` flag drives the `keepUpPenalty` (replacing the manual `keptUpPowers` text array as the source of truth).

## Why

- Players need to track Force powers as structured data (difficulties, keep-up status, dark-side warning) rather than free-text notes.
- The `keepUpPenalty` is currently derived from `keptUpPowers.length` (free-text array). `forcePower` items provide the authoritative source — removing the guesswork of manual text entry.
- Mirrors the established weapon/armor item pattern: DataModel → document class → shared ItemSheet → character sheet section.

## What

### New item type: `forcePower`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `controlDifficulty` | string | `""` | Difficulty for the Control roll (e.g. "Moderate", "15") |
| `senseDifficulty` | string | `""` | Difficulty for the Sense roll — blank if not required |
| `alterDifficulty` | string | `""` | Difficulty for the Alter roll — blank if not required |
| `requiredPowers` | string | `""` | Comma-separated prerequisite power names |
| `canKeepUp` | boolean | `false` | Whether the power can be maintained continuously |
| `keptUp` | boolean | `false` | Whether the character is currently keeping this power up |
| `darkSideWarning` | boolean | `false` | If true, using this power automatically grants a DSP |
| `timeToUse` | string | `""` | Activation time; blank = "one round" |
| `effect` | string | `""` | Mechanical description of what the power does |

### Behaviour

- Force tab shows a **Force Powers** section (only visible when `forceSensitive === true`) listing all `forcePower` items.
- Each row: power name, required skills (control/sense/alter difficulty cells), can-keep-up indicator, dark-side warning badge, `keptUp` toggle button.
- Toggling `keptUp` updates the item; `prepareDerivedData()` re-derives `keepUpPenalty` from the count of `forcePower` items where `canKeepUp && keptUp`.
- Double-clicking a power row opens its item sheet.
- `forcePower` item sheet shows all nine fields in a form.
- `keptUpPowers` ArrayField stays on `CharacterData` but **stops being used** in `prepareDerivedData()` once items drive the penalty. The existing add/remove UI in the Force tab stays unchanged for now (it can be removed in a future feat).

### Success Criteria

- [ ] `forcePower` appears in the item-type dropdown when creating an Item in Foundry
- [ ] Creating a `forcePower` item stores all nine fields with correct defaults
- [ ] Double-clicking a `forcePower` item opens its sheet showing all fields, all editable and persisted
- [ ] Force tab shows a "Force Powers" section (only when `forceSensitive === true`) listing owned `forcePower` items
- [ ] Each row shows: name, control/sense/alter difficulty, can-keep-up indicator, dark-side warning, keptUp toggle
- [ ] Toggling `keptUp` persists on the item and immediately re-derives `keepUpPenalty`
- [ ] `keepUpPenalty` is derived from `forcePower` items (not `keptUpPowers` array length) in `prepareDerivedData()`
- [ ] All new user-visible strings are in `lang/en.json`
- [ ] Unit tests for `ForcePowerData.defineSchema()` pass (`npm test`)
- [ ] All existing tests still pass

---

## All Needed Context

### Documentation & References

```yaml
- file: modules/items/weapon-data.mjs
  why: PRIMARY PATTERN — exact DataModel pattern to copy for ForcePowerData.
       Uses foundry.data.fields destructure at top, extends TypeDataModel, static defineSchema().
       ForcePowerData is additive: more StringField/BooleanField entries, no NumberField except none needed.

- file: modules/items/weapon.mjs
  why: Minimal document class: `export default class WeaponItem extends Item {}`.
       ForcePowerItem follows the same one-liner pattern.

- file: modules/apps/item-sheet.mjs
  why: Shared ItemSheet for all non-skill item types. PARTS points to item-sheet.hbs.
       Currently registered for ["weapon","armor","equipment"] — ADD "forcePower" to that list.
       No code change to the sheet class itself needed.

- file: templates/items/item-sheet.hbs
  why: Single template with {{#if (eq item.type "weapon")}} / "armor" / "equipment" blocks.
       ADD a new {{#if (eq item.type "forcePower")}} block for the nine ForcePowerData fields.
       Uses context.item and context.system set by item-sheet.mjs _prepareContext().

- file: modules/actors/character-data.mjs
  why: prepareDerivedData() currently sets:
         this.keepUpPenalty = this.keptUpPowers.length;  ← CHANGE THIS
       New: derive from this.parent.items filtered to forcePower where canKeepUp && keptUp.
       Guard with `if (this.parent)` already present (same guard used for armorBonus/weaponBonus).
       keptUpPowers ArrayField stays in defineSchema() — do NOT remove it.

- file: modules/apps/character-sheet.mjs
  why: _prepareContext() builds forceData when forceSensitive is true.
       ADD forcePowers array to forceData:
         forcePowers: this.document.items
           .filter(i => i.type === "forcePower")
           .map(i => ({ id, name, controlDifficulty, senseDifficulty, alterDifficulty,
                        canKeepUp, keptUp, darkSideWarning }))
       ADD toggleKeptUp action (static private method) — mirrors toggleEquipped pattern.
       keepUpPenalty shown in Force tab already — it will auto-update once prepareDerivedData
       is changed (no template change needed for that display).

- file: templates/actors/character-sheet.hbs
  why: Force tab section (lines 381–462). ADD a Force Powers sub-section before the
       "Kept-Up Powers" heading. Pattern: same item-row / data-item-id / dblclick pattern
       as weapons in inventory tab. Toggle button mirrors equip-toggle pattern.

- file: starwarsd6.mjs
  why: CONFIG.Item.dataModels already includes weapon/armor/equipment — ADD forcePower: ForcePowerData.
       system.json documentTypes.Item already has weapon/armor/equipment — ADD "forcePower": {}.
       ItemSheet DocumentSheetConfig.registerSheet types array: ADD "forcePower".
       Import ForcePowerData and ForcePowerItem (even if ForcePowerItem is a no-op extend, import
       is needed for future extensibility and consistency with other item types).

- file: system.json
  why: documentTypes.Item — MUST add "forcePower": {} or Foundry silently ignores the type.
       Currently: { "skill":{}, "weapon":{}, "armor":{}, "equipment":{} }
       After:     { "skill":{}, "weapon":{}, "armor":{}, "equipment":{}, "forcePower":{} }

- file: lang/en.json
  why: Add keys for forcePower item fields and Force tab UI strings.
       Follow existing STARWARSD6.Item.<Type>.<Field> and STARWARSD6.Force.* conventions.

- file: tests/mocks/foundry.mjs
  why: FieldStub class is used for all DataModel tests. BooleanField and StringField already
       mocked. ForcePowerData tests call defineSchema() directly — same pattern as WeaponData.

- file: tests/unit/character-data.test.mjs
  why: Test pattern for prepareDerivedData(). keepUpPenalty tests already exist (lines 111–129).
       The new keepUpPenalty derivation needs to work when this.parent is null (no items
       available) — must fall back to 0.

- file: doc/rules-reference.md (The Force section)
  why: Force Power Description Format fields match the ForcePowerData schema exactly.
       "Keeping Powers Up" section: canKeepUp item flag drives keepUpPenalty for ALL rolls.
       "Dark Side Warning" section: some powers automatically grant a DSP — darkSideWarning flag.

- file: doc/implementation-plan.md
  why: Phase 7 description says "Powers are free-text entries, not coded items" — must be updated.
       "Out of Scope" explicitly lists "Force power catalogue as coded items" — must be removed.
       Phase Overview table and Critical Files table need feat012 (Phase 7.5) entries.

- file: README.md
  why: Development Status table must add Phase 7.5 row (✅ Done).
       "Out of scope" note about "coded Force power catalogue" must be removed.

- url: https://foundryvtt.com/api/v13/modules.html
  why: foundry.data.fields.BooleanField, StringField, TypeDataModel — v13 API reference.
```

---

## Current Codebase State

```
fvtt-starwarsd6/
├── system.json                           ← ADD "forcePower": {} to documentTypes.Item
├── starwarsd6.mjs                        ← ADD ForcePowerData import + dataModels entry + ItemSheet type
├── modules/
│   ├── actors/
│   │   └── character-data.mjs           ← CHANGE keepUpPenalty derivation
│   ├── items/
│   │   ├── weapon-data.mjs              ← (reference)
│   │   ├── weapon.mjs                   ← (reference)
│   │   └── [armor/equipment/skill ...]
│   └── apps/
│       ├── character-sheet.mjs          ← ADD forcePowers to forceData + toggleKeptUp action
│       └── item-sheet.mjs               ← ADD "forcePower" to registerSheet types (in starwarsd6.mjs)
├── templates/
│   ├── actors/character-sheet.hbs       ← ADD Force Powers section in Force tab
│   └── items/item-sheet.hbs             ← ADD {{#if (eq item.type "forcePower")}} block
├── lang/en.json                         ← ADD forcePower keys
└── tests/unit/
    ├── character-data.test.mjs          ← ADD keepUpPenalty-from-items tests
    └── force-power-data.test.mjs        ← NEW: ForcePowerData.defineSchema() tests
```

## Desired Codebase State (after feat012)

```
fvtt-starwarsd6/
├── system.json                           ← forcePower added
├── starwarsd6.mjs                        ← ForcePowerData + ForcePowerItem imported and registered
├── modules/
│   ├── actors/
│   │   └── character-data.mjs           ← keepUpPenalty from forcePower items
│   ├── items/
│   │   ├── force-power-data.mjs         ← NEW: ForcePowerData
│   │   └── force-power.mjs              ← NEW: ForcePowerItem extends Item
│   └── apps/
│       └── character-sheet.mjs          ← forcePowers in forceData, toggleKeptUp action
├── templates/
│   ├── actors/character-sheet.hbs       ← Force Powers section in Force tab
│   └── items/item-sheet.hbs             ← forcePower block added
├── lang/en.json                         ← new keys added
└── tests/unit/
    ├── character-data.test.mjs          ← keepUpPenalty tests updated
    └── force-power-data.test.mjs        ← NEW
```

---

## Known Gotchas & Critical Constraints

```js
// CRITICAL: system.json documentTypes.Item MUST include "forcePower": {}
// Omitting it → Foundry silently ignores the type; items can't be created.

// CRITICAL: CONFIG.Item.dataModels must include forcePower.
// Current starwarsd6.mjs line:
//   CONFIG.Item.dataModels = { skill: SkillData, weapon: WeaponData, armor: ArmorData, equipment: EquipmentData };
// Must become:
//   CONFIG.Item.dataModels = { skill: SkillData, weapon: WeaponData, armor: ArmorData, equipment: EquipmentData, forcePower: ForcePowerData };

// CRITICAL: DocumentSheetConfig.registerSheet for ItemSheet must include "forcePower":
//   DocumentSheetConfig.registerSheet(Item, "starwarsd6", ItemSheet, {
//     types: ["weapon", "armor", "equipment", "forcePower"],  ← ADD "forcePower"
//     makeDefault: true,
//     label: "STARWARSD6.SheetClass.Item"
//   });

// CRITICAL: keepUpPenalty derivation change in character-data.mjs.
// Current:
//   this.keepUpPenalty = this.keptUpPowers.length;
// New — MUST guard with this.parent (same pattern as armorBonus/weaponBonus above it):
//   if (this.parent) {
//     this.keepUpPenalty = this.parent.items
//       .filter(i => i.type === "forcePower" && i.system.canKeepUp && i.system.keptUp)
//       .length;
//   } else {
//     this.keepUpPenalty = 0;  // no items available (unit test context)
//   }
// NOTE: The existing keptUpPowers.length line IS inside the non-parent block (see current code).
// Actually looking at the current code: this.keepUpPenalty = this.keptUpPowers.length;
// is set OUTSIDE the if(this.parent) block (line 65). Move it INSIDE the if/else.
// The test makeCharacterData() sets keptUpPowers = [] and has no parent — tests still pass
// because else branch → keepUpPenalty = 0. UPDATE the keepUpPenalty tests in
// character-data.test.mjs to reflect items-based derivation.

// CRITICAL: keepUpPenalty tests in character-data.test.mjs must be updated.
// The existing tests use keptUpPowers array (lines 111-129). These tests will BREAK
// because the new derivation ignores keptUpPowers when parent is null.
// Update those tests to use `this.parent` mock with forcePower items, OR simply
// verify that keepUpPenalty = 0 when no parent, and add new tests with a mock parent.
// SIMPLEST: keep the existing null-parent tests (they still return 0) and add new
// tests with a mock parent containing forcePower items.

// GOTCHA: ForcePowerData fields are all StringField or BooleanField.
// StringField with blank: true for all string fields (they may legitimately be empty).
// BooleanField for canKeepUp, keptUp, darkSideWarning — initial: false.

// GOTCHA: item-sheet.hbs uses {{#if (eq item.type "forcePower")}} — the `eq` helper
// is available in Handlebars via foundry's built-in helpers. No registration needed.

// GOTCHA: The forcePower item sheet needs a textarea for `effect` (long text).
// Use <textarea name="system.effect" rows="4">{{system.effect}}</textarea>
// Same pattern as equipment description in the existing template.

// GOTCHA: toggleKeptUp action in character-sheet.mjs must mirror toggleEquipped.
// Pattern from #toggleEquipped (line 410-415 of character-sheet.mjs):
//   static async #toggleKeptUp(event, target) {
//     const itemId = target.closest("[data-item-id]").dataset.itemId;
//     const item = this.document.items.get(itemId);
//     if (!item) return;
//     await item.update({ "system.keptUp": !item.system.keptUp });
//   }
// Add to DEFAULT_OPTIONS.actions: { ..., toggleKeptUp: CharacterSheet.#toggleKeptUp }

// GOTCHA: Force Powers section in character-sheet.hbs must be inside the
// {{#if system.forceSensitive}} block (same as the rest of the Force tab).
// Place it BEFORE the existing "Kept-Up Powers" section.
// Each row: data-item-id for dblclick-to-open. Toggle button: data-action="toggleKeptUp".

// GOTCHA: The dark side warning badge — display a ⚠ symbol in the row when darkSideWarning is true.
// Use: {{#if power.darkSideWarning}}<span class="dsp-warning-badge" title="Dark Side Warning">⚠</span>{{/if}}
// No new CSS class needed — reuse existing .dsp-warning or add minimal style.

// GOTCHA: Required skills column in the Force Powers table — show which skills are needed.
// A power needs Control if controlDifficulty is non-empty, Sense if senseDifficulty is non-empty,
// Alter if alterDifficulty is non-empty. Display the difficulty values directly.
// E.g. three columns: Control Difficulty | Sense Difficulty | Alter Difficulty
// Empty string renders as blank cell — correct behavior.

// GOTCHA: canKeepUp indicator — display a "✓" or "—" based on canKeepUp boolean.
// Use: {{#if power.canKeepUp}}✓{{else}}—{{/if}}

// CRITICAL: Do NOT remove keptUpPowers ArrayField from CharacterData.defineSchema().
// Do NOT remove the #addKeptUpPower / #removeKeptUpPower actions from CharacterSheet.
// Do NOT remove the kept-up powers UI from the Force tab template.
// Those are left intact for now. Only STOP using keptUpPowers.length for keepUpPenalty.

// GOTCHA: ForcePowerItem document class — same pattern as WeaponItem:
//   export default class ForcePowerItem extends Item {}
// Import it in starwarsd6.mjs but do NOT assign it as CONFIG.Item.documentClass.
// The existing SkillItem no-op class handles all types via CONFIG.Item.documentClass = SkillItem.

// GOTCHA: Unit tests for ForcePowerData — call defineSchema() directly, check field keys
// and option values (initial, blank). Same pattern as WeaponData tests would use
// (see tests/unit/character-data.test.mjs for the Object.create/FieldStub pattern;
// see tests/mocks/foundry.mjs for the mock setup).
// The test file is tests/unit/force-power-data.test.mjs.

// CRITICAL: npm test must pass for ALL existing tests after changes. In particular:
// - character-data.test.mjs keepUpPenalty tests — behavior changes because keepUpPenalty
//   now comes from items (which don't exist in test context → always 0). The existing
//   tests that set keptUpPowers: ["A","B","C"] and expect keepUpPenalty = 3 will FAIL.
//   UPDATE those tests: when parent is null, keepUpPenalty = 0 always.
//   ADD new tests that simulate a parent with forcePower items (mock parent.items).
```

---

## Implementation Blueprint

### Task 1 — CREATE `modules/items/force-power-data.mjs`

```js
const { StringField, BooleanField } = foundry.data.fields;

export default class ForcePowerData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      controlDifficulty: new StringField({ initial: "", blank: true }),
      senseDifficulty:   new StringField({ initial: "", blank: true }),
      alterDifficulty:   new StringField({ initial: "", blank: true }),
      requiredPowers:    new StringField({ initial: "", blank: true }),
      canKeepUp:         new BooleanField({ initial: false }),
      keptUp:            new BooleanField({ initial: false }),
      darkSideWarning:   new BooleanField({ initial: false }),
      timeToUse:         new StringField({ initial: "", blank: true }),
      effect:            new StringField({ initial: "", blank: true })
    };
  }
}
```

### Task 2 — CREATE `modules/items/force-power.mjs`

```js
export default class ForcePowerItem extends Item {}
```

### Task 3 — MODIFY `system.json`

Add `"forcePower": {}` to `documentTypes.Item`:

```json
"Item": {
  "skill": {},
  "weapon": {},
  "armor": {},
  "equipment": {},
  "forcePower": {}
}
```

### Task 4 — MODIFY `starwarsd6.mjs`

Add imports and register the new type:

```js
// ADD these two imports after existing item imports:
import ForcePowerData from "./modules/items/force-power-data.mjs";
import ForcePowerItem from "./modules/items/force-power.mjs";

// CHANGE CONFIG.Item.dataModels to add forcePower:
CONFIG.Item.dataModels = {
  skill: SkillData,
  weapon: WeaponData,
  armor: ArmorData,
  equipment: EquipmentData,
  forcePower: ForcePowerData
};

// CHANGE ItemSheet registerSheet to add "forcePower":
DocumentSheetConfig.registerSheet(Item, "starwarsd6", ItemSheet, {
  types: ["weapon", "armor", "equipment", "forcePower"],
  makeDefault: true,
  label: "STARWARSD6.SheetClass.Item"
});
```

### Task 5 — MODIFY `templates/items/item-sheet.hbs`

Add a `forcePower` block after the `equipment` block, before the closing `</section>`:

```hbs
{{#if (eq item.type "forcePower")}}
  <div class="form-group">
    <label>{{localize "STARWARSD6.ForcePower.ControlDifficulty"}}</label>
    <input type="text" name="system.controlDifficulty" value="{{system.controlDifficulty}}" />
  </div>
  <div class="form-group">
    <label>{{localize "STARWARSD6.ForcePower.SenseDifficulty"}}</label>
    <input type="text" name="system.senseDifficulty" value="{{system.senseDifficulty}}" />
  </div>
  <div class="form-group">
    <label>{{localize "STARWARSD6.ForcePower.AlterDifficulty"}}</label>
    <input type="text" name="system.alterDifficulty" value="{{system.alterDifficulty}}" />
  </div>
  <div class="form-group">
    <label>{{localize "STARWARSD6.ForcePower.RequiredPowers"}}</label>
    <input type="text" name="system.requiredPowers" value="{{system.requiredPowers}}" />
  </div>
  <div class="form-group">
    <label>{{localize "STARWARSD6.ForcePower.CanKeepUp"}}</label>
    <input type="checkbox" name="system.canKeepUp" {{#if system.canKeepUp}}checked{{/if}} />
  </div>
  <div class="form-group">
    <label>{{localize "STARWARSD6.ForcePower.KeptUp"}}</label>
    <input type="checkbox" name="system.keptUp" {{#if system.keptUp}}checked{{/if}} />
  </div>
  <div class="form-group">
    <label>{{localize "STARWARSD6.ForcePower.DarkSideWarning"}}</label>
    <input type="checkbox" name="system.darkSideWarning" {{#if system.darkSideWarning}}checked{{/if}} />
  </div>
  <div class="form-group">
    <label>{{localize "STARWARSD6.ForcePower.TimeToUse"}}</label>
    <input type="text" name="system.timeToUse" value="{{system.timeToUse}}" />
  </div>
  <div class="form-group">
    <label>{{localize "STARWARSD6.ForcePower.Effect"}}</label>
    <textarea name="system.effect" rows="4">{{system.effect}}</textarea>
  </div>
{{/if}}
```

### Task 6 — MODIFY `modules/actors/character-data.mjs`

Change `keepUpPenalty` derivation. Find the line:
```js
this.keepUpPenalty = this.keptUpPowers.length;
```

Move it inside the `if (this.parent)` block and replace with items-based derivation. The full `if (this.parent)` block becomes:

```js
if (this.parent) {
  this.armorBonus = this.parent.items
    .filter(i => i.type === "armor" && i.system.equipped)
    .reduce((sum, i) => sum + i.system.armorBonus, 0);
  this.weaponBonus = this.parent.items
    .filter(i => i.type === "weapon" && i.system.equipped)
    .reduce((sum, i) => sum + i.system.weaponBonus, 0);
  this.keepUpPenalty = this.parent.items
    .filter(i => i.type === "forcePower" && i.system.canKeepUp && i.system.keptUp)
    .length;
  this.rangedDefense   = calculateRangedDefense(this.parent);
  this.meleeDefense    = calculateMeleeDefense(this.parent);
  this.brawlingDefense = calculateBrawlingDefense(this.parent);
} else {
  this.armorBonus      = 0;
  this.weaponBonus     = 0;
  this.keepUpPenalty   = 0;
  this.rangedDefense   = 0;
  this.meleeDefense    = 0;
  this.brawlingDefense = 0;
}
```

Remove the standalone `this.keepUpPenalty = this.keptUpPowers.length;` line that currently sits before this block.

### Task 7 — MODIFY `modules/apps/character-sheet.mjs`

**7a.** Add `toggleKeptUp` to `DEFAULT_OPTIONS.actions`:
```js
actions: {
  // ... existing actions ...
  toggleKeptUp: CharacterSheet.#toggleKeptUp,
}
```

**7b.** Add `forcePowers` to `forceData` in `_prepareContext`. The current `forceData` construction is:
```js
context.forceData = system.forceSensitive ? {
  skills: { ... },
  keptUpPowers: system.keptUpPowers.map((name, index) => ({ name, index })),
  dsp: system.darkSidePoints,
  forceRollBonus: system.forceRollBonus,
  keepUpPenalty: system.keepUpPenalty
} : null;
```

Add `forcePowers` to the object:
```js
context.forceData = system.forceSensitive ? {
  skills: { ... },
  keptUpPowers: system.keptUpPowers.map((name, index) => ({ name, index })),
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
  dsp: system.darkSidePoints,
  forceRollBonus: system.forceRollBonus,
  keepUpPenalty: system.keepUpPenalty
} : null;
```

**7c.** Add the `#toggleKeptUp` static private method, after `#toggleEquipped`:
```js
static async #toggleKeptUp(event, target) {
  const itemId = target.closest("[data-item-id]").dataset.itemId;
  const item = this.document.items.get(itemId);
  if (!item) return;
  await item.update({ "system.keptUp": !item.system.keptUp });
}
```

### Task 8 — MODIFY `templates/actors/character-sheet.hbs`

Add a Force Powers section inside the Force tab, BEFORE the existing `{{!-- Kept-Up Powers --}}` comment block. Insert after the closing `</div>` of the Force Dark Side section:

```hbs
{{!-- Force Powers --}}
<h3>{{localize "STARWARSD6.ForcePower.Label"}}</h3>
{{#if forceData.forcePowers.length}}
  <table class="force-powers-table">
    <thead>
      <tr>
        <th>{{localize "STARWARSD6.Skill.Name"}}</th>
        <th>{{localize "STARWARSD6.Force.Skill.control"}}</th>
        <th>{{localize "STARWARSD6.Force.Skill.sense"}}</th>
        <th>{{localize "STARWARSD6.Force.Skill.alter"}}</th>
        <th>{{localize "STARWARSD6.ForcePower.CanKeepUp"}}</th>
        <th>{{localize "STARWARSD6.ForcePower.KeptUp"}}</th>
        <th>{{localize "STARWARSD6.ForcePower.DarkSide"}}</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {{#each forceData.forcePowers as |power|}}
      <tr class="item-row" data-item-id="{{power.id}}">
        <td>{{power.name}}</td>
        <td>{{power.controlDifficulty}}</td>
        <td>{{power.senseDifficulty}}</td>
        <td>{{power.alterDifficulty}}</td>
        <td class="center">{{#if power.canKeepUp}}✓{{else}}—{{/if}}</td>
        <td class="center">
          <button type="button"
                  class="equip-toggle {{#if power.keptUp}}equipped{{/if}}"
                  data-action="toggleKeptUp"
                  data-item-id="{{power.id}}"
                  title="{{localize 'STARWARSD6.ForcePower.KeptUp'}}">
            {{#if power.keptUp}}✓{{else}}○{{/if}}
          </button>
        </td>
        <td class="center">
          {{#if power.darkSideWarning}}
            <span class="dsp-warning-badge" title="{{localize 'STARWARSD6.ForcePower.DarkSideWarningBadge'}}">⚠</span>
          {{/if}}
        </td>
        <td>
          <button type="button" class="item-delete"
                  data-action="deleteItem"
                  data-item-id="{{power.id}}"
                  title="Delete">✕</button>
        </td>
      </tr>
      {{/each}}
    </tbody>
  </table>
{{else}}
  <p class="no-items">{{localize "STARWARSD6.Inventory.Empty"}}</p>
{{/if}}
```

Note: `deleteItem` action is already registered in `DEFAULT_OPTIONS.actions` — it works for forcePower items without any changes.

### Task 9 — MODIFY `lang/en.json`

Add after the existing Force keys:

```json
"STARWARSD6.ForcePower.Label": "Force Powers",
"STARWARSD6.ForcePower.ControlDifficulty": "Control Difficulty",
"STARWARSD6.ForcePower.SenseDifficulty": "Sense Difficulty",
"STARWARSD6.ForcePower.AlterDifficulty": "Alter Difficulty",
"STARWARSD6.ForcePower.RequiredPowers": "Required Powers",
"STARWARSD6.ForcePower.CanKeepUp": "Can Keep Up",
"STARWARSD6.ForcePower.KeptUp": "Kept Up",
"STARWARSD6.ForcePower.DarkSideWarning": "Dark Side Warning",
"STARWARSD6.ForcePower.DarkSide": "Dark Side",
"STARWARSD6.ForcePower.DarkSideWarningBadge": "Automatically grants a Dark Side Point",
"STARWARSD6.ForcePower.TimeToUse": "Time to Use",
"STARWARSD6.ForcePower.Effect": "Effect"
```

### Task 10 — MODIFY `tests/unit/character-data.test.mjs`

Update the `keepUpPenalty` describe block (lines 111–129). The current tests set `keptUpPowers` and expect `keepUpPenalty` to equal the array length. These WILL FAIL because `keepUpPenalty` is now derived from `parent.items` (null parent → 0).

**Replace** the three existing keepUpPenalty tests with:

```js
describe("keepUpPenalty derivation", () => {
  it("no parent → keepUpPenalty = 0 (unit test context)", () => {
    const data = makeCharacterData({});
    data.prepareDerivedData();
    expect(data.keepUpPenalty).toBe(0);
  });

  it("parent with no forcePower items → keepUpPenalty = 0", () => {
    const data = makeCharacterData({});
    data.parent = { items: [] };
    data.prepareDerivedData();
    expect(data.keepUpPenalty).toBe(0);
  });

  it("parent with 2 keptUp canKeepUp forcePower items → keepUpPenalty = 2", () => {
    const data = makeCharacterData({});
    data.parent = {
      items: [
        { type: "forcePower", system: { canKeepUp: true, keptUp: true, equipped: false } },
        { type: "forcePower", system: { canKeepUp: true, keptUp: true, equipped: false } },
        { type: "forcePower", system: { canKeepUp: true, keptUp: false, equipped: false } }, // not kept up
        { type: "forcePower", system: { canKeepUp: false, keptUp: false, equipped: false } }, // can't keep up
        { type: "weapon",     system: { equipped: false, armorBonus: 0, weaponBonus: 0 } }
      ]
    };
    data.prepareDerivedData();
    expect(data.keepUpPenalty).toBe(2);
  });

  it("parent with 0 keptUp items → keepUpPenalty = 0", () => {
    const data = makeCharacterData({});
    data.parent = {
      items: [
        { type: "forcePower", system: { canKeepUp: true, keptUp: false, equipped: false } }
      ]
    };
    data.prepareDerivedData();
    expect(data.keepUpPenalty).toBe(0);
  });
});
```

**NOTE:** The existing `makeCharacterData()` creates instances with no `parent` property. The `prepareDerivedData()` method already has `if (this.parent)` ... `else` with the armorBonus/weaponBonus fallback. Since `keepUpPenalty` is now inside the same `if/else`, no-parent tests correctly get `keepUpPenalty = 0`.

However, when a test does `data.parent = { items: [...] }`, the mock parent's `items` array must contain objects that the armor/weapon filter lines can safely iterate. Supply minimal mock items that include `type`, `system.equipped`, `system.armorBonus`, and `system.weaponBonus` to avoid TypeError on those filters.

### Task 12 — UPDATE `doc/implementation-plan.md`

Three targeted changes:

**12a.** Update the Phase Overview table — add a Phase 7.5 row (or note) for feat012. Since feat012 is a sub-phase of 7 rather than a full phase, add it as a note under Phase 7 in the table. Find the Phase 7 row:

```
| 7 ✓ | Force System | Force skills, powers, DSP | L | 5 |
```

Replace with:

```
| 7 ✓ | Force System | Force skills, DSP, keep-up | L | 5 |
| 7.5 ✓ | Force Powers Item | forcePower item type, keep-up drives penalty | M | 7 |
```

**12b.** Update the Phase 7 description section. Find the line:

```
**Force power activation:** Powers are free-text entries, not coded items.
```

Replace with:

```
**Force power activation:** Powers are structured `forcePower` items (feat012) with control/sense/alter difficulty, keep-up toggle, and dark-side warning fields. The `keepUpPenalty` is derived from owned `forcePower` items where `canKeepUp && keptUp`. `RollDialog` adds a "Force difficulty modifier" input (+0 to +30) for relationship/proximity. Multi-skill powers: user declares each skill roll as separate actions (normal multiple-action penalty applies).
```

**12c.** Update the "Out of Scope" section. Find and remove this line:

```
- Force power catalogue as coded items (free-text on sheet is sufficient)
```

**12d.** Update the Critical Files table. Find:

```
| `modules/actors/character-data.mjs` | 1, 4, 5, 7 |
```

Replace with:

```
| `modules/actors/character-data.mjs` | 1, 4, 5, 7, 7.5 |
```

And add a new row after `system.json`:

```
| `modules/items/force-power-data.mjs` | 7.5 (new) |
```

### Task 13 — UPDATE `README.md`

**13a.** Update the Development Status table. Find:

```
| 7 | Force System | ✅ Done |
```

Replace with:

```
| 7 | Force System | ✅ Done |
| 7.5 | Force Powers Item Type | ✅ Done |
```

**13b.** Update the "Out of scope" line. Find:

```
**Out of scope:** compendium packs, vehicle actors, Active Effects, token automation, coded Force power catalogue.
```

Replace with:

```
**Out of scope:** compendium packs, vehicle actors, Active Effects, token automation.
```

### Task 11 — CREATE `tests/unit/force-power-data.test.mjs`

```js
import { describe, it, expect } from "vitest";
import ForcePowerData from "../../modules/items/force-power-data.mjs";

function schema() {
  return ForcePowerData.defineSchema();
}

describe("ForcePowerData.defineSchema()", () => {
  it("has all nine required fields", () => {
    const s = schema();
    expect(s).toHaveProperty("controlDifficulty");
    expect(s).toHaveProperty("senseDifficulty");
    expect(s).toHaveProperty("alterDifficulty");
    expect(s).toHaveProperty("requiredPowers");
    expect(s).toHaveProperty("canKeepUp");
    expect(s).toHaveProperty("keptUp");
    expect(s).toHaveProperty("darkSideWarning");
    expect(s).toHaveProperty("timeToUse");
    expect(s).toHaveProperty("effect");
  });

  it("has exactly nine fields", () => {
    expect(Object.keys(schema())).toHaveLength(9);
  });

  it("string fields have blank: true (empty string allowed)", () => {
    const s = schema();
    for (const key of ["controlDifficulty", "senseDifficulty", "alterDifficulty",
                        "requiredPowers", "timeToUse", "effect"]) {
      expect(s[key].blank).toBe(true);
    }
  });

  it("string fields have initial: ''", () => {
    const s = schema();
    for (const key of ["controlDifficulty", "senseDifficulty", "alterDifficulty",
                        "requiredPowers", "timeToUse", "effect"]) {
      expect(s[key].initial).toBe("");
    }
  });

  it("boolean fields have initial: false", () => {
    const s = schema();
    for (const key of ["canKeepUp", "keptUp", "darkSideWarning"]) {
      expect(s[key].initial).toBe(false);
    }
  });
});
```

---

## Integration Points

```yaml
system.json:
  - documentTypes.Item: add "forcePower": {}

starwarsd6.mjs:
  - CONFIG.Item.dataModels: add forcePower: ForcePowerData
  - ItemSheet registerSheet types: add "forcePower"
  - New imports: ForcePowerData, ForcePowerItem

character-data.mjs:
  - prepareDerivedData(): keepUpPenalty moved into if(this.parent)/else block
  - Source of keepUpPenalty changes from keptUpPowers.length to forcePower items count
  - keptUpPowers ArrayField: UNCHANGED in defineSchema()

character-sheet.mjs:
  - DEFAULT_OPTIONS.actions: add toggleKeptUp
  - _prepareContext forceData: add forcePowers array
  - New private method: #toggleKeptUp
  - Existing keep-up UI: UNCHANGED (addKeptUpPower, removeKeptUpPower, keptUpPowers display)

item-sheet.hbs:
  - Add forcePower block alongside existing weapon/armor/equipment blocks

character-sheet.hbs:
  - Force tab: add Force Powers section (table with toggle button + delete button)

lang/en.json:
  - Add STARWARSD6.ForcePower.* keys

doc/implementation-plan.md:
  - Phase Overview table: add Phase 7.5 row
  - Phase 7 description: update "free-text entries" sentence and keepUpPenalty note
  - Out of Scope: remove "Force power catalogue as coded items" line
  - Critical Files table: update character-data.mjs phases, add force-power-data.mjs row

README.md:
  - Development Status table: add Phase 7.5 row (✅ Done)
  - Out of scope: remove "coded Force power catalogue"
```

---

## Validation Loop

### Level 1 — File & Registration Checks

```bash
# Verify new files exist
ls modules/items/force-power-data.mjs modules/items/force-power.mjs \
   tests/unit/force-power-data.test.mjs \
  && echo "OK" || echo "ERROR: missing file"

# Verify system.json has forcePower
grep '"forcePower"' system.json && echo "OK" || echo "ERROR: missing from system.json"

# Verify starwarsd6.mjs has ForcePowerData imported and in dataModels
grep "ForcePowerData" starwarsd6.mjs && echo "OK" || echo "ERROR"

# Verify ItemSheet types include forcePower
grep -A3 '"weapon", "armor", "equipment"' starwarsd6.mjs | grep "forcePower" \
  && echo "OK" || echo "ERROR: forcePower not in ItemSheet types"

# Verify keepUpPenalty derivation changed in character-data.mjs
grep "forcePower" modules/actors/character-data.mjs && echo "OK" || echo "ERROR"
grep "keptUpPowers.length" modules/actors/character-data.mjs \
  && echo "ERROR: old derivation still present" || echo "OK: old derivation removed"

# Verify toggleKeptUp action registered in character-sheet.mjs
grep "toggleKeptUp" modules/apps/character-sheet.mjs && echo "OK" || echo "ERROR"

# Verify forcePower block in item-sheet.hbs
grep "forcePower" templates/items/item-sheet.hbs && echo "OK" || echo "ERROR"

# Verify Force Powers section in character-sheet.hbs
grep "forcePowers\|ForcePower.Label" templates/actors/character-sheet.hbs && echo "OK" || echo "ERROR"

# Verify new lang keys exist
grep "STARWARSD6.ForcePower" lang/en.json && echo "OK" || echo "ERROR"

# Verify implementation-plan.md updated
grep "7.5\|forcePower\|force-power" doc/implementation-plan.md && echo "OK" || echo "ERROR"
grep "free-text entries, not coded items" doc/implementation-plan.md \
  && echo "ERROR: outdated Phase 7 description still present" || echo "OK"
grep "Force power catalogue as coded items" doc/implementation-plan.md \
  && echo "ERROR: outdated out-of-scope line still present" || echo "OK: removed"

# Verify README.md updated
grep "7.5\|Force Powers Item" README.md && echo "OK" || echo "ERROR"
grep "coded Force power catalogue" README.md \
  && echo "ERROR: outdated out-of-scope note still present" || echo "OK: removed"

# Verify no deprecated APIs used
grep -n "getData\|mergeObject" modules/items/force-power-data.mjs \
  && echo "ERROR: deprecated API" || echo "OK"
```

### Level 2 — Unit Tests

```bash
npm test
```

Expected output:
```
✓ tests/unit/character-data.test.mjs
✓ tests/unit/skill-data.test.mjs
✓ tests/unit/dice.test.mjs
✓ tests/unit/force.test.mjs
✓ tests/unit/force-power-data.test.mjs
[any other existing test files]

Test Files  N passed (N)
Tests       N passed (N)
```

**If `character-data.test.mjs` keepUpPenalty tests fail:** The old tests expected `keptUpPowers: ["A","B","C"]` → `keepUpPenalty = 3`. This will fail now. Update those tests per Task 10 above — do NOT revert the keepUpPenalty derivation change.

**If `force-power-data.test.mjs` fails:** Read the error, fix `force-power-data.mjs`, re-run. The `FieldStub` mock stores constructor options as properties on `this`, so `s.controlDifficulty.blank === true` works correctly.

### Level 3 — Functional Validation (in Foundry, after user deploys)

1. Open world → browser console clean (no init errors).
2. Create Item → type dropdown includes "forcePower".
3. Create a forcePower item "Lightsaber Combat":
   - controlDifficulty = "Moderate"
   - senseDifficulty = "Moderate"
   - canKeepUp = true
   - darkSideWarning = false
   - effect = "Adds control skill to lightsaber attack and parry"
4. Open a Force-sensitive character → Force tab → Force Powers section shows "Lightsaber Combat".
5. Row shows: "Lightsaber Combat", "Moderate", "Moderate", "", ✓, ○ (toggle), no ⚠.
6. Click ✓/○ toggle → item updates, row shows ✓ in keptUp column.
7. Check all-rolls penalty increases by 1 (shown in keepUpPenalty on Force tab).
8. Double-click the row → item sheet opens with all fields visible and editable.
9. Edit "effect" field → close → reopen → persists.
10. Create forcePower "Force Lightning" with darkSideWarning = true → row shows ⚠ badge.
11. Delete button (✕) removes the power from the list.

---

## Final Validation Checklist

- [ ] `ls modules/items/force-power-data.mjs modules/items/force-power.mjs` — both exist
- [ ] `grep '"forcePower"' system.json` — entry present
- [ ] `grep "ForcePowerData" starwarsd6.mjs` — imported + in dataModels
- [ ] `grep "forcePower" starwarsd6.mjs` — in ItemSheet types
- [ ] `grep "forcePower" modules/actors/character-data.mjs` — new derivation present
- [ ] `grep "keptUpPowers.length" modules/actors/character-data.mjs` — NOT found
- [ ] `grep "toggleKeptUp" modules/apps/character-sheet.mjs` — action + method present
- [ ] `grep "forcePowers" modules/apps/character-sheet.mjs` — in forceData context
- [ ] `grep "forcePower" templates/items/item-sheet.hbs` — block present
- [ ] `grep "ForcePower.Label" templates/actors/character-sheet.hbs` — section present
- [ ] `grep "STARWARSD6.ForcePower" lang/en.json` — all keys present
- [ ] `npm test` exits 0, all test files pass
- [ ] `doc/implementation-plan.md` Phase 7.5 row added, Phase 7 description updated, out-of-scope line removed
- [ ] `README.md` Phase 7.5 row added, out-of-scope note updated
- [ ] (After deploy) Force-sensitive character shows Force Powers section in Force tab
- [ ] (After deploy) keptUp toggle drives keepUpPenalty correctly

---

## Anti-Patterns to Avoid

- **Do not** remove `keptUpPowers` ArrayField from `CharacterData` — it stays for compatibility
- **Do not** remove `#addKeptUpPower` / `#removeKeptUpPower` actions — left for now
- **Do not** import `foundry`, `Item`, `Actor`, `CONFIG` — they are globals
- **Do not** add `prepareDerivedData()` to `ForcePowerData` — no derived fields exist; YAGNI
- **Do not** create separate template files for the forcePower item sheet — use the existing shared `item-sheet.hbs` with the `{{#if (eq item.type "forcePower")}}` conditional (already established pattern)
- **Do not** use `getData()`, `mergeObject()`, or `duplicate()` — deprecated v13 APIs
- **Do not** modify `tabGroups` — the Force tab is already accessible
- **Do not** run `deploy.sh` — the user deploys manually
- **Do not** alter `tests/mocks/foundry.mjs` — `BooleanField` and `StringField` are already mocked via `FieldStub`

---

## Confidence Score: 9/10

**Strong foundations:**
- All infrastructure already exists: ItemSheet, item-sheet.hbs, Force tab, item-row/dblclick pattern, deleteItem action, toggleEquipped pattern — all directly reusable.
- `ForcePowerData` is the simplest DataModel in the project: only StringFields and BooleanFields, no derived data, no parent-dependent logic.
- `keepUpPenalty` migration is a one-line change in `prepareDerivedData()`, well-guarded by the existing `if (this.parent)` block.
- Test pattern is identical to existing DataModel tests; `FieldStub` already handles `BooleanField` and `StringField`.

**Deductions:**
- **-1**: `character-data.test.mjs` keepUpPenalty tests must be **updated** (not just added to) — existing tests will fail after the derivation change. This is a deliberate breaking change that requires careful test migration. If the agent forgets to update those tests, `npm test` will fail.
