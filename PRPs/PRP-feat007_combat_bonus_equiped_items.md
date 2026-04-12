# PRP-feat007 — Combat Bonuses from Equipped Items

## Goal

Replace the manual `armorBonus` / `weaponBonus` `NumberField` overrides on `CharacterData` with
**derived values** automatically summed from equipped items in the actor's inventory.

End state:
- `ArmorData` and `WeaponData` each gain an `equipped: BooleanField`
- `CharacterData.prepareDerivedData()` derives `armorBonus` / `weaponBonus` by summing equipped items
- The manual number inputs on the combat tab are removed; the checkbox on each item sheet drives equip state
- `calculateRangedDefense` / `calculateMeleeDefense` in `defense.mjs` are **unchanged** — they already read `actor.system.armorBonus` and `actor.system.weaponBonus`

## Why

- Players should not manually enter their armor/weapon bonus — the system should infer it from what is actually equipped
- Removes a class of user error (forgetting to update the bonus when swapping gear)
- `defense.mjs` already consumes `actor.system.armorBonus` and `actor.system.weaponBonus`; this phase makes the source of those values automatic
- Feat006 intentionally shipped manual fields as a known placeholder: feat007 is the designed follow-up

## What

### Success Criteria

- [ ] `ArmorData.defineSchema()` includes `equipped: BooleanField({ initial: false })`
- [ ] `WeaponData.defineSchema()` includes `equipped: BooleanField({ initial: false })`
- [ ] `CharacterData.defineSchema()` no longer declares `armorBonus` or `weaponBonus` fields
- [ ] `CharacterData.prepareDerivedData()` derives `this.armorBonus` / `this.weaponBonus` from equipped items (guarded by `this.parent`)
- [ ] `templates/items/armor-sheet.hbs` renders an Equipped checkbox bound to `system.equipped`
- [ ] `templates/items/weapon-sheet.hbs` renders an Equipped checkbox bound to `system.equipped`
- [ ] `templates/actors/character-sheet.hbs` — the Manual Bonuses block (`system.armorBonus` / `system.weaponBonus` number inputs) is removed
- [ ] `modules/apps/character-sheet.mjs` — `context.combatData` no longer passes `armorBonus` / `weaponBonus` (they are display-only derived values, removed from combat tab)
- [ ] `lang/en.json` adds `"STARWARSD6.Item.Equipped": "Equipped"`
- [ ] `npm test` passes — existing tests in `defense.test.mjs` still pass (no interface change to the helpers)
- [ ] No test file needs to be created (logic moved to data model; tested implicitly through existing defense tests)

---

## All Needed Context

### Documentation & References

```yaml
- file: doc/rules-reference.md
  why: Authoritative rules — confirms armor_bonus comes from worn armor items,
       weapon_bonus from equipped parrying weapon, brawling has no equipment bonus.

- file: modules/items/armor-data.mjs
  why: Current ArmorData schema — has armorBonus: NumberField. Must ADD equipped: BooleanField.
  current content: |
    const { NumberField } = foundry.data.fields;
    export default class ArmorData extends foundry.abstract.TypeDataModel {
      static defineSchema() {
        return {
          armorBonus: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
        };
      }
    }

- file: modules/items/weapon-data.mjs
  why: Current WeaponData schema — has weaponBonus: NumberField. Must ADD equipped: BooleanField.
       weaponBonus already exists here — no change needed to it.
  current content: |
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
    }

- file: modules/actors/character-data.mjs
  why: CharacterData — REMOVE armorBonus/weaponBonus from defineSchema(); ADD derived computation
       in prepareDerivedData(). Currently lines 30-31 declare the manual fields; these must be removed.
       The BooleanField import is already present. The defense helper imports are already at top of file.
  critical: |
    The derived properties (this.armorBonus, this.weaponBonus) are assigned DIRECTLY on the
    TypeDataModel instance — they are NOT schema fields. This is the same pattern already used for
    this.rangedDefense, this.meleeDefense, this.brawlingDefense, this.penaltyDice, this.penaltyPips,
    this.hitBoxes — all assigned in prepareDerivedData() without being in defineSchema().
    The `this.parent` guard is already in place for the defense values block — append the
    armorBonus/weaponBonus derivation inside that same `if (this.parent)` block.

- file: modules/helpers/defense.mjs
  why: calculateRangedDefense reads actor.system.armorBonus; calculateMeleeDefense reads
       actor.system.weaponBonus. These functions are UNCHANGED — the source of those values
       is transparently upgraded from a manual field to a derived property.
  critical: |
    NO CHANGES to this file. The interface (actor.system.armorBonus / actor.system.weaponBonus)
    is identical. Tests in defense.test.mjs mock these values directly and continue to work.

- file: modules/apps/character-sheet.mjs
  why: _prepareContext() currently passes armorBonus/weaponBonus into context.combatData (lines 109-110).
       After this change, those values are still on actor.system (as derived props), so the context
       entries are technically harmless — but the Manual Bonuses section in the HBS template that
       rendered number INPUTS for them must be removed (they are no longer editable schema fields).
       The context.armors mapping (lines 86-92) must expose equipped to allow the inventory table to
       show equipped state if desired — or leave as-is (the item sheet handles equip toggling directly).

- file: templates/items/armor-sheet.hbs
  why: Must add equipped checkbox. Current template has one form-group for armorBonus only.

- file: templates/items/weapon-sheet.hbs
  why: Must add equipped checkbox. Current template has five form-groups.

- file: templates/actors/character-sheet.hbs
  why: Lines 258-268 render the "Manual Bonuses" block with two number inputs bound to
       system.armorBonus and system.weaponBonus. This entire block must be removed.
       No replacement display needed — defense totals already incorporate these values.

- file: lang/en.json
  why: Add "STARWARSD6.Item.Equipped": "Equipped". Existing armor/weapon keys unchanged.

- file: tests/unit/defense.test.mjs
  why: Existing tests mock actor.system.armorBonus / actor.system.weaponBonus directly.
       They continue to pass without changes — the interface to defense.mjs is unchanged.

- url: https://foundryvtt.com/api/v13/classes/foundry.abstract.TypeDataModel.html
  why: prepareDerivedData() lifecycle — `this.parent` is the Actor document, available after
       embedded document creation. `this.parent.items` is the EmbeddedCollection (iterable with .filter).
```

### Current Codebase Tree (relevant files)

```
starwarsd6/
├── modules/
│   ├── actors/
│   │   └── character-data.mjs     # MODIFY: remove armorBonus/weaponBonus schema fields; add derivation
│   ├── items/
│   │   ├── armor-data.mjs         # MODIFY: add equipped: BooleanField
│   │   └── weapon-data.mjs        # MODIFY: add equipped: BooleanField
│   ├── apps/
│   │   └── character-sheet.mjs    # MODIFY: remove armorBonus/weaponBonus from combatData context
│   └── helpers/
│       └── defense.mjs            # NO CHANGE
├── templates/
│   ├── actors/
│   │   └── character-sheet.hbs    # MODIFY: remove Manual Bonuses block
│   └── items/
│       ├── armor-sheet.hbs        # MODIFY: add equipped checkbox
│       └── weapon-sheet.hbs       # MODIFY: add equipped checkbox
├── lang/
│   └── en.json                    # MODIFY: add STARWARSD6.Item.Equipped
└── tests/
    └── unit/
        └── defense.test.mjs       # NO CHANGE (interface unchanged)
```

### Desired Codebase Tree (no new files)

All changes are modifications to existing files. No new files created.

### Known Gotchas

```js
// CRITICAL: armorBonus and weaponBonus transition from SCHEMA FIELDS to DERIVED PROPERTIES
// Schema fields are persisted in the actor document's system data.
// Derived properties are computed on every prepareDerivedData() call and NOT persisted.
// The transition is safe: Foundry v13 ignores unknown fields on load (old stored values are
// silently discarded). No migration needed.
// PATTERN: this.hitBoxes = this.STR.dice (line 40) is the exact same pattern — not in defineSchema().

// CRITICAL: this.parent.items is an EmbeddedCollection
// Use Array.from() or spread if you need .filter/.reduce — EmbeddedCollection supports
// .filter() natively in Foundry v13 (it's Collection which extends Map with filter/find/reduce).
// The feat007 spec uses .filter().reduce() chaining — this works on Foundry Collection.

// CRITICAL: equipped checkbox in HBS must use Foundry's {{checked}} helper
// Pattern: <input type="checkbox" name="system.equipped" {{checked item.system.equipped}}>
// OR:      <input type="checkbox" name="system.equipped" {{#if item.system.equipped}}checked{{/if}}>
// The item sheets use `item.system.*` not `system.*` — check existing armor-sheet.hbs:
//   value="{{system.armorBonus}}" — NOTE: uses `system.` without `item.` prefix
// This is because item sheets expose `system` directly in context (not `item.system`).
// Use: name="system.equipped" and {{#if system.equipped}}checked{{/if}}

// CRITICAL: submitOnChange = true on item sheets (inherited from ItemSheetV2)
// The checkbox will auto-submit on change via the sheet's form handling.
// Do NOT add a separate event listener — the framework handles it.

// CRITICAL: The character-sheet.mjs combatData block (lines 103-123) passes armorBonus/weaponBonus
// These are still valid to keep in context (now derived, but still on actor.system).
// The only REQUIRED change is removing the number INPUT elements from the HBS template.
// The context values themselves are harmless to leave — but remove the inputs to avoid
// confusion (they would try to submit to a non-existent schema field and be silently ignored).

// CRITICAL: BooleanField is already imported in character-data.mjs (line 3)
// armor-data.mjs only imports NumberField — must add BooleanField to the destructure.
// weapon-data.mjs imports NumberField, StringField — must add BooleanField.

// CRITICAL: Multiple equipped armor pieces stack (sum all armorBonus values)
// Multiple equipped weapons also stack (sum all weaponBonus values)
// No game-level constraint on equipping multiple items of the same type.
```

---

## Implementation Blueprint

### Data Models

```js
// armor-data.mjs — add BooleanField import and equipped field
const { NumberField, BooleanField } = foundry.data.fields;
export default class ArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      armorBonus: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      equipped:   new BooleanField({ initial: false })
    };
  }
}

// weapon-data.mjs — add BooleanField to import, add equipped field
const { NumberField, StringField, BooleanField } = foundry.data.fields;
// ...keep all existing fields, add:
//   equipped: new BooleanField({ initial: false })

// character-data.mjs — prepareDerivedData() additions
// REMOVE from defineSchema(): armorBonus and weaponBonus NumberFields (lines 30-31)
// In prepareDerivedData(), INSIDE the existing `if (this.parent) { ... }` block,
// BEFORE the defense value computations (which depend on armorBonus/weaponBonus being set):

if (this.parent) {
  // Derived from equipped items — must run BEFORE defense calculations
  this.armorBonus = this.parent.items
    .filter(i => i.type === "armor" && i.system.equipped)
    .reduce((sum, i) => sum + i.system.armorBonus, 0);

  this.weaponBonus = this.parent.items
    .filter(i => i.type === "weapon" && i.system.equipped)
    .reduce((sum, i) => sum + i.system.weaponBonus, 0);

  // Defense values — read this.armorBonus / this.weaponBonus just set above
  this.rangedDefense   = calculateRangedDefense(this.parent);
  this.meleeDefense    = calculateMeleeDefense(this.parent);
  this.brawlingDefense = calculateBrawlingDefense(this.parent);
} else {
  this.armorBonus      = 0;
  this.weaponBonus     = 0;
  this.rangedDefense   = 0;
  this.meleeDefense    = 0;
  this.brawlingDefense = 0;
}
```

### List of Tasks

```yaml
Task 1 — MODIFY modules/items/armor-data.mjs:
  - Change: const { NumberField } → const { NumberField, BooleanField }
  - Add to defineSchema() return object: equipped: new BooleanField({ initial: false })
  - Keep armorBonus field unchanged

Task 2 — MODIFY modules/items/weapon-data.mjs:
  - Change: const { NumberField, StringField } → const { NumberField, StringField, BooleanField }
  - Add to defineSchema() return object: equipped: new BooleanField({ initial: false })
  - Keep all existing fields unchanged

Task 3 — MODIFY modules/actors/character-data.mjs:
  - REMOVE from defineSchema(): lines 30-31 (armorBonus and weaponBonus NumberFields)
    FIND:   armorBonus:  new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
            weaponBonus: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
    DELETE both lines
  - MODIFY prepareDerivedData(): replace the existing `if (this.parent) { ... } else { ... }` block
    The new block must SET this.armorBonus and this.weaponBonus BEFORE calling the defense helpers,
    because calculateRangedDefense reads actor.system.armorBonus (which is `this` on the DataModel).
    Full replacement of the if/else block:

    if (this.parent) {
      this.armorBonus = this.parent.items
        .filter(i => i.type === "armor" && i.system.equipped)
        .reduce((sum, i) => sum + i.system.armorBonus, 0);
      this.weaponBonus = this.parent.items
        .filter(i => i.type === "weapon" && i.system.equipped)
        .reduce((sum, i) => sum + i.system.weaponBonus, 0);
      this.rangedDefense   = calculateRangedDefense(this.parent);
      this.meleeDefense    = calculateMeleeDefense(this.parent);
      this.brawlingDefense = calculateBrawlingDefense(this.parent);
    } else {
      this.armorBonus      = 0;
      this.weaponBonus     = 0;
      this.rangedDefense   = 0;
      this.meleeDefense    = 0;
      this.brawlingDefense = 0;
    }

Task 4 — MODIFY templates/items/armor-sheet.hbs:
  - Add equipped checkbox form-group after the armorBonus form-group:
    <div class="form-group">
      <label>{{localize "STARWARSD6.Item.Equipped"}}</label>
      <input type="checkbox" name="system.equipped" {{#if system.equipped}}checked{{/if}} />
    </div>

Task 5 — MODIFY templates/items/weapon-sheet.hbs:
  - Add equipped checkbox form-group after the range form-group (last group):
    <div class="form-group">
      <label>{{localize "STARWARSD6.Item.Equipped"}}</label>
      <input type="checkbox" name="system.equipped" {{#if system.equipped}}checked{{/if}} />
    </div>

Task 6 — MODIFY templates/actors/character-sheet.hbs:
  - REMOVE the entire "Manual Bonuses" div block (lines 258-268):
    {{!-- Manual Bonuses --}}
    <div class="combat-bonuses">
      <div class="form-group">
        <label>{{localize "STARWARSD6.Combat.ArmorBonus"}}</label>
        <input type="number" name="system.armorBonus" value="{{combatData.armorBonus}}" min="0" />
      </div>
      <div class="form-group">
        <label>{{localize "STARWARSD6.Combat.WeaponBonus"}}</label>
        <input type="number" name="system.weaponBonus" value="{{combatData.weaponBonus}}" min="0" />
      </div>
    </div>

Task 7 — MODIFY lang/en.json:
  - Add before the closing brace:
    "STARWARSD6.Item.Equipped": "Equipped"

Task 8 — Verify: npm test
  - Run npm test; all tests must pass
  - defense.test.mjs tests mock actor.system.armorBonus/weaponBonus directly — they pass unchanged
  - If any test fails, read the error carefully and fix the implementation (do not mock to pass)
```

### Per-Task Pseudocode

```js
// ===== Task 3 detail: ordering constraint =====
// defense.mjs calculateRangedDefense(actor) does:
//   return Math.floor(3.5 * dice) + pips + actor.system.armorBonus;
// `actor` here is the Actor document; `actor.system` is the CharacterData instance.
// Therefore `actor.system.armorBonus` reads THIS instance's property.
// If we set this.armorBonus BEFORE calling calculateRangedDefense, the value is available.
// If we call calculateRangedDefense BEFORE setting this.armorBonus, it reads undefined → NaN.
// ORDER IS CRITICAL: set armorBonus/weaponBonus first, then call defense helpers.

// ===== Task 4/5: HBS checkbox pattern =====
// The item sheet context exposes `system` directly (not nested under `item`).
// Verify by checking armor-sheet.hbs line 8: value="{{system.armorBonus}}"
// Therefore checkbox: name="system.equipped" {{#if system.equipped}}checked{{/if}}
// submitOnChange=true on the sheet means toggling the checkbox auto-saves via item.update().

// ===== Why no character-sheet.mjs change is needed =====
// character-sheet.mjs _prepareContext() passes:
//   armorBonus: sys.armorBonus  (line 109)
//   weaponBonus: sys.weaponBonus (line 110)
// After this change, sys.armorBonus and sys.weaponBonus are still valid (derived props on CharacterData).
// These context values remain harmless. The only removal is the HBS template INPUT elements.
// Optional cleanup: remove armorBonus/weaponBonus from combatData in _prepareContext
//   if no HBS template references them — but since we're removing the inputs, they become dead context.
//   Per YAGNI: remove them from the context too to avoid confusion.
//   FIND in character-sheet.mjs:
//     armorBonus:      sys.armorBonus,
//     weaponBonus:     sys.weaponBonus,
//   DELETE both lines from the combatData object.
```

### Integration Points

```yaml
DATA FLOW (after this change):
  1. User opens armor item sheet → checks "Equipped" checkbox
  2. Item sheet auto-submits via submitOnChange → item.update({"system.equipped": true})
  3. Foundry updates the embedded item document
  4. Actor's prepareDerivedData() re-runs (triggered by embedded item change)
  5. this.armorBonus = sum of equipped armor armorBonus values
  6. calculateRangedDefense(actor) reads actor.system.armorBonus → updated value
  7. Character sheet re-renders → Ranged Defense shows new value

NO CHANGES TO:
  - modules/helpers/defense.mjs  (interface unchanged)
  - modules/helpers/damage.mjs   (unrelated)
  - modules/apps/character-sheet.mjs  (optional cleanup only — see Task list note)
  - Any test files
  - system.json (no new types registered)
  - starwarsd6.mjs (no new registrations)
```

---

## Validation Loop

### Level 1: Syntax Check

```bash
# Verify no syntax errors in modified files (files without Foundry globals)
node --input-type=module < modules/items/armor-data.mjs
# Expected: no output (no errors)
# GOTCHA: This will fail because `foundry` global is not defined in Node.
# For files referencing foundry.*, syntax errors surface in `npm test` instead.
# Use npm test as the primary validation gate.
```

### Level 2: Unit Tests

```bash
npm test
# Expected: all tests pass — green output, no failures
# Tests that exercise armorBonus/weaponBonus:
#   defense.test.mjs — "adds armorBonus to result" and "adds weaponBonus to result" tests
#   These mock actor.system.armorBonus directly, so they are unchanged and pass.
# If tests fail:
#   - "ReferenceError: foundry is not defined" → check tests/mocks/foundry.mjs is loaded
#   - "TypeError: Cannot read properties of undefined" → check filter/reduce on items returns a number
#   - Math.NaN in defense results → armorBonus/weaponBonus set to NaN → ordering bug in prepareDerivedData
```

### Level 3: Manual Foundry Validation (after deploy)

```
Testing sequence (from feat007 spec):
1. Create character with dodge 3D+2 → Ranged Defense = 12 (no armor)
2. Add armor item (armorBonus=1), leave UNEQUIPPED → Ranged Defense still 12
3. Open armor item sheet → check Equipped → Ranged Defense becomes 13
4. Add second armor item (armorBonus=2), equip it → Ranged Defense becomes 15
5. Unequip first armor → Ranged Defense drops to 14
6. Add weapon item (weaponBonus=1) → equip it → Melee Defense increases by 1
7. Equip weapon, check brawlingDefense → unchanged (no equipment bonus for brawling)
```

### Final Validation Checklist

- [ ] `npm test` passes — all tests green
- [ ] `ArmorData` schema includes `equipped` field (verify by inspecting item in Foundry)
- [ ] `WeaponData` schema includes `equipped` field
- [ ] `CharacterData.defineSchema()` no longer contains `armorBonus` or `weaponBonus`
- [ ] Equipping armor changes `rangedDefense` on the character sheet immediately
- [ ] Equipping weapon changes `meleeDefense` on the character sheet immediately
- [ ] `brawlingDefense` is unaffected by equipping any item
- [ ] Multiple equipped armors stack correctly
- [ ] No manual bonus inputs visible on the Combat tab
- [ ] `lang/en.json` contains `STARWARSD6.Item.Equipped` — no raw key string in UI

---

## Anti-Patterns to Avoid

- Never add `armorBonus` / `weaponBonus` back to `defineSchema()` — they must be derived-only
- Never call `calculateRangedDefense()` before setting `this.armorBonus` — ordering causes NaN
- Never use `Array.from(this.parent.items)` before `.filter()` — Foundry Collection supports `.filter()` natively
- Never bind the equipped checkbox with a JS event listener — `submitOnChange=true` handles it
- Never create a separate "equipped items" helper function — the derivation has one caller, keep it inline in `prepareDerivedData()`
- Never add a migration for the removed schema fields — Foundry v13 silently discards unknown stored fields

---

## Confidence Score: 9/10

High confidence due to:
- Fully implemented predecessor (feat006) provides exact patterns for `prepareDerivedData()` derived properties
- `defense.mjs` interface is unchanged — no risk of breaking existing tests
- All 7 target files are small and well-understood from direct inspection
- The ordering constraint (set armorBonus before calling defense helpers) is identified and documented
- The `BooleanField` pattern is already used in `CharacterData` (`forceSensitive`) and `SkillData` (`isForce`)

Minor uncertainty (-1): The `{{checked}}` vs `{{#if}}checked{{/if}}` Handlebars pattern for checkboxes — both work in Foundry v13, but the existing `forceSensitive` checkbox in `character-sheet.hbs` uses `{{#if system.forceSensitive}}checked{{/if}}`, confirming the correct pattern.
