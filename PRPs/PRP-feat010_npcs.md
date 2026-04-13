# PRP-feat010 — NPC Actor Type

## Goal

Add a second Actor type `npc` to the system. NPCs use a simplified DataModel — only STR attribute for hit-box derivation; defense values are static numbers entered by the GM; damage is a single dice pool (damageDice + damagePips); wound tracking identical to characters. No skill items, no inventory, no CP/FP.

End state: GM can create an NPC actor, open a compact sheet, fill in STR, defense values, damage dice, and mark wounds via hit-box buttons (same Alt+click interaction as the character sheet).

## Why

- Phase 6 of the implementation plan — all previous phases are complete (feat001–feat009)
- NPCs are the primary adversary stat block in combat; the GM needs a minimal, fast sheet
- Decouples NPC concerns from CharacterData — NPCs never have skills, inventory, or CP/FP

## What

### Files to create
- `modules/actors/npc-data.mjs` — `NpcData extends foundry.abstract.TypeDataModel`
- `modules/actors/npc.mjs` — `NpcActor extends Actor` (minimal, no auto-created skills)
- `modules/apps/npc-sheet.mjs` — `NpcSheet extends HandlebarsApplicationMixin(ActorSheetV2)`
- `templates/actors/npc-sheet.hbs` — compact single-page sheet (no tabs needed)

### Files to modify
- `starwarsd6.mjs` — register `NpcData`, `NpcActor`, `NpcSheet`
- `system.json` — add `"npc": {}` to `documentTypes.Actor`
- `lang/en.json` — NPC labels

### Success Criteria
- [ ] NPC actor type appears in the Foundry "Create Actor" dialog
- [ ] NPC sheet opens with no console errors
- [ ] STR 4D → `hitBoxes = 4`, `damageBase = 14` (floor(3.5×4)+0)
- [ ] Defense fields (`rangedDefense`, `meleeDefense`, `brawlingDefense`) are editable numbers
- [ ] Damage dice field (`damageDice`, `damagePips`) are editable
- [ ] Hit-box buttons: Alt+click marks, Shift+Alt+click unmarks (same as character sheet)
- [ ] Wound overflow cascade works (same `applyDamage` / `removeOneMark` from `damage.mjs`)
- [ ] Notes textarea persists on save

---

## All Needed Context

### Documentation & References

```yaml
- file: modules/actors/character-data.mjs
  why: >
    Primary pattern to mirror. NpcData is a simplified subset.
    Copy: attributeField() helper (for STR only), prepareDerivedData() structure,
    calculateDamageThresholds() call, hitBoxes derivation.
    OMIT: DEX/KNO/MEC/PER/TEC, move, forceSensitive, characterPoints, forcePoints,
    darkSidePoints, penaltyDice, penaltyPips, defense calculations from skills.

- file: modules/actors/character.mjs
  why: >
    NpcActor pattern — extend Actor. NPC does NOT call createEmbeddedDocuments in _onCreate
    (no default skills). Just export default class NpcActor extends Actor {}.

- file: modules/apps/character-sheet.mjs
  why: >
    Sheet pattern — HandlebarsApplicationMixin, DEFAULT_OPTIONS, PARTS, _prepareContext,
    #buildBoxArray static helper, #markHitBox action (copy verbatim — same Alt+click logic),
    applyDamage / removeOneMark import.
    OMIT: rollSkill, rollAttribute, rollAttack, deleteItem, toggleEquipped, newRound,
    all the CP/FP chat logic.

- file: templates/actors/character-sheet.hbs
  why: >
    Template patterns: hit-box-tracker section (copy verbatim for NPC),
    form-group layout, input type=number with name="system.*",
    data-action="markHitBox" data-tier="..." buttons.

- file: modules/helpers/damage.mjs
  why: >
    applyDamage() and removeOneMark() are reused as-is. Both work on any actor
    that has system.hitBoxes and system.{stun,wound,incap,mortal}Marks.
    calculateDamageThresholds(strDice, strPips) returns { base } — same call as CharacterData.

- file: starwarsd6.mjs
  why: >
    Registration pattern:
      CONFIG.Actor.dataModels = { character: CharacterData, npc: NpcData };
      CONFIG.Actor.documentClass must be overridden per-type using a proxy or
      — IMPORTANT — in v13 you set documentClass at the type level via
      CONFIG.Actor.documentClasses = { character: CharacterActor, npc: NpcActor }
      IF that API exists, otherwise keep CONFIG.Actor.documentClass pointing to
      a common base and rely on the DataModel for type-specific logic.
      Check: the existing code sets CONFIG.Actor.documentClass = CharacterActor globally.
      For NPC, use the same pattern: add NpcData to dataModels, register NpcSheet
      with types: ["npc"].

- file: system.json
  why: documentTypes.Actor must list both "character" and "npc"; Foundry uses this
       to populate the actor-type selector. Pattern: add "npc": {} alongside "character": {}.

- file: lang/en.json
  why: Add NPC-specific keys. Follow existing key naming pattern.

- file: ref/dnd5e/module/data/actor/npc.mjs
  why: Secondary reference for NPC DataModel shape (complex — ignore most of it;
       our NpcData is far simpler, use character-data.mjs as the primary model).

- url: https://foundryvtt.com/api/v13/classes/foundry.abstract.TypeDataModel.html
  why: TypeDataModel.defineSchema() and prepareDerivedData() API.
```

### Current Codebase Tree (relevant subset)

```
fvtt-starwarsd6/
├── system.json                          ← MODIFY: add "npc" to documentTypes.Actor
├── starwarsd6.mjs                       ← MODIFY: import + register NpcData, NpcActor, NpcSheet
├── modules/
│   ├── actors/
│   │   ├── character-data.mjs           ← PRIMARY PATTERN for NpcData
│   │   └── character.mjs                ← PRIMARY PATTERN for NpcActor
│   ├── apps/
│   │   └── character-sheet.mjs          ← PRIMARY PATTERN for NpcSheet
│   └── helpers/
│       └── damage.mjs                   ← REUSE applyDamage, removeOneMark, calculateDamageThresholds
├── templates/
│   └── actors/
│       └── character-sheet.hbs          ← PATTERN for hit-box section in npc-sheet.hbs
└── lang/
    └── en.json                          ← MODIFY: add NPC labels
```

### Desired Codebase Tree (after implementation)

```
fvtt-starwarsd6/
├── system.json                          ← "npc": {} added
├── starwarsd6.mjs                       ← NpcData, NpcActor, NpcSheet imported + registered
├── modules/
│   ├── actors/
│   │   ├── character-data.mjs           (unchanged)
│   │   ├── character.mjs                (unchanged)
│   │   ├── npc-data.mjs                 ← NEW
│   │   └── npc.mjs                      ← NEW
│   ├── apps/
│   │   ├── character-sheet.mjs          (unchanged)
│   │   └── npc-sheet.mjs                ← NEW
│   └── helpers/
│       └── damage.mjs                   (unchanged)
├── templates/
│   └── actors/
│       ├── character-sheet.hbs          (unchanged)
│       └── npc-sheet.hbs                ← NEW
└── lang/
    └── en.json                          ← NPC labels added
```

### Known Gotchas

```js
// GOTCHA 1: CONFIG.Actor.documentClass is set globally to CharacterActor.
// In v13, Foundry does NOT have CONFIG.Actor.documentClasses (plural) as a standard API.
// The workaround: keep documentClass pointing to a shared base, OR
// override _getDocumentClass in the Actor document. The simplest v13-compatible
// approach used here: keep CONFIG.Actor.documentClass = CharacterActor (it's just a base Actor).
// NpcActor extends Actor — both CharacterActor and NpcActor extend Actor.
// Foundry v13 routes actor creation to the correct DataModel via dataModels,
// and the documentClass applies to all types. Since NpcActor has no special methods
// beyond Actor, it's safe to NOT set it as documentClass and let CharacterActor handle both —
// OR use a pattern like: after registering NpcData, set documentClass back to Actor if needed.
// RECOMMENDED: define NpcActor extends Actor {} (empty) and use the CONFIG.Actor.documentClasses
// map pattern IF available. If not, leave CONFIG.Actor.documentClass = CharacterActor unchanged
// (CharacterActor extends Actor and adds no methods used in NpcActor context).
// Verify by creating the actor and checking console for errors.

// GOTCHA 2: StringField for notes must use { required: true, nullable: false, initial: "" }
// pattern — same as other fields. Omitting initial causes issues.

// GOTCHA 3: prepareDerivedData() on NpcData must NOT reference this.parent.items
// (NPCs have no embedded skill items). Defense values come from stored fields, not derived.

// GOTCHA 4: applyDamage() reads system.hitBoxes — this field MUST be set in prepareDerivedData()
// before applyDamage can work. Confirm: this.hitBoxes = this.STR.dice in prepareDerivedData().

// GOTCHA 5: Hit-box buttons use Alt+click. Plain clicks are intentionally ignored in #markHitBox.
// Copy the exact guard: if (!event.altKey) return;

// GOTCHA 6: template path must be "systems/starwarsd6/templates/actors/npc-sheet.hbs"
// (absolute from Foundry's perspective, not relative). Match PARTS pattern from CharacterSheet.

// GOTCHA 7: NpcSheet must NOT import rollWithWildDie or RollDialog — NPC sheets have no roll buttons.
// Damage is applied via hit-box buttons only.
```

---

## Implementation Blueprint

### Data Model: `modules/actors/npc-data.mjs`

```js
// Mirror character-data.mjs structure. Key differences:
// - Only STR attribute (not all 6)
// - Defense values are stored NumberFields (not derived from skills)
// - damageDice + damagePips are stored (NPC's weapon damage stat)
// - Same wound mark fields
// - notes StringField
// - prepareDerivedData: STR baseValue, hitBoxes = STR.dice, damageBase from calculateDamageThresholds
//   NO penaltyDice/penaltyPips, NO parent.items access, NO defense derivation helpers

import { calculateDamageThresholds } from "../helpers/damage.mjs";

const { NumberField, SchemaField, StringField } = foundry.data.fields;

function attributeField() { /* copy from character-data.mjs exactly */ }

export default class NpcData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      STR: attributeField(),
      rangedDefense:   new NumberField({ integer:true, min:0, initial:10 }),
      meleeDefense:    new NumberField({ integer:true, min:0, initial:10 }),
      brawlingDefense: new NumberField({ integer:true, min:0, initial:10 }),
      damageDice:      new NumberField({ integer:true, min:1, initial:4 }),
      damagePips:      new NumberField({ integer:true, min:0, max:2, initial:0 }),
      stunMarks:       new NumberField({ required:true, nullable:false, integer:true, min:0, initial:0 }),
      woundMarks:      new NumberField({ required:true, nullable:false, integer:true, min:0, initial:0 }),
      incapMarks:      new NumberField({ required:true, nullable:false, integer:true, min:0, initial:0 }),
      mortalMarks:     new NumberField({ required:true, nullable:false, integer:true, min:0, initial:0 }),
      notes:           new StringField({ required:true, nullable:false, initial:"" })
    };
  }

  prepareDerivedData() {
    const attr = this.STR;
    attr.baseValue = Math.floor(3.5 * attr.dice) + attr.pips;
    this.hitBoxes = attr.dice;
    const { base } = calculateDamageThresholds(attr.dice, attr.pips);
    this.damageBase = base;
  }
}
```

### Actor Class: `modules/actors/npc.mjs`

```js
// Minimal — no auto-created items, no special hooks.
export default class NpcActor extends Actor {}
```

### Sheet: `modules/apps/npc-sheet.mjs`

```js
// Mirror CharacterSheet pattern. Key differences:
// - PARTS points to npc-sheet.hbs
// - classes: ["starwarsd6", "sheet", "actor", "npc"]
// - actions: only markHitBox (copy verbatim from CharacterSheet)
// - No tabGroups (single page, no tabs)
// - _prepareContext: expose system, hitBoxes, box arrays, damage thresholds, defense fields
// - #buildBoxArray: copy static helper verbatim
// - #markHitBox: copy static handler verbatim

import { applyDamage, removeOneMark } from "../helpers/damage.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class NpcSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["starwarsd6", "sheet", "actor", "npc"],
    position: { width: 480, height: 520 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      markHitBox: NpcSheet.#markHitBox
    }
  };

  static PARTS = {
    sheet: { template: "systems/starwarsd6/templates/actors/npc-sheet.hbs" }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sys = this.document.system;
    const hitBoxes = sys.hitBoxes;
    context.system = sys;
    context.combatData = {
      hitBoxes,
      stunBoxes:       NpcSheet.#buildBoxArray(hitBoxes, sys.stunMarks),
      woundBoxes:      NpcSheet.#buildBoxArray(hitBoxes, sys.woundMarks),
      incapBoxes:      NpcSheet.#buildBoxArray(hitBoxes, sys.incapMarks),
      mortalBoxes:     NpcSheet.#buildBoxArray(hitBoxes, sys.mortalMarks),
      damageBase:      sys.damageBase,
      thresholdStun:   `< ${sys.damageBase}`,
      thresholdWound:  `${sys.damageBase}–${2 * sys.damageBase - 1}`,
      thresholdIncap:  `${2 * sys.damageBase}–${3 * sys.damageBase - 1}`,
      thresholdMortal: `${3 * sys.damageBase}+`
    };
    return context;
  }

  static #buildBoxArray(hitBoxes, marks) {
    return Array.from({ length: hitBoxes }, (_, i) => ({ index: i, marked: i < marks }));
  }

  static async #markHitBox(event, target) {
    if (!event.altKey) return;
    const tier = target.dataset.tier;
    if (event.shiftKey) {
      await removeOneMark(this.document, tier);
    } else {
      await applyDamage(this.document, tier);
    }
  }
}
```

### Template: `templates/actors/npc-sheet.hbs`

Single-page layout (no tabs). Sections:
1. Header: actor name input
2. STR: dice + pips inputs, derived baseValue display, hitBoxes display
3. Combat: rangedDefense / meleeDefense / brawlingDefense number inputs
4. Damage: damageDice + damagePips inputs
5. Damage Thresholds: derived stun/wound/incap/mortal threshold display (read-only)
6. Hit Boxes: stunBoxes/woundBoxes/incapBoxes/mortalBoxes — copy verbatim from character-sheet.hbs hit-box-tracker section
7. Notes: textarea bound to `system.notes`

Key template patterns (copy from character-sheet.hbs):
```hbs
{{!-- Hit box button --}}
<button type="button" class="hit-box {{#if box.marked}}marked{{/if}}"
        data-action="markHitBox" data-tier="stun"></button>

{{!-- Number input --}}
<input type="number" name="system.STR.dice" value="{{system.STR.dice}}" min="1" />

{{!-- Textarea --}}
<textarea name="system.notes">{{system.notes}}</textarea>
```

---

## Implementation Tasks (ordered)

```yaml
Task 1 — CREATE modules/actors/npc-data.mjs:
  MIRROR: modules/actors/character-data.mjs
  KEEP: attributeField() helper, prepareDerivedData() pattern, calculateDamageThresholds import
  INCLUDE: STR attribute, all four wound mark fields, rangedDefense, meleeDefense,
           brawlingDefense, damageDice, damagePips, notes
  OMIT: DEX/KNO/MEC/PER/TEC, move, forceSensitive, characterPoints, forcePoints,
        darkSidePoints, penaltyDice/penaltyPips, all parent.items references,
        defense helper imports (calculateRangedDefense etc.)
  ADD: notes StringField({ required:true, nullable:false, initial:"" })
  NOTE: All NumberFields should use { required:true, nullable:false, integer:true, min:0, initial:... }

Task 2 — CREATE modules/actors/npc.mjs:
  CONTENT: export default class NpcActor extends Actor {}
  NOTE: No _onCreate override, no auto-skills.

Task 3 — CREATE modules/apps/npc-sheet.mjs:
  MIRROR: modules/apps/character-sheet.mjs
  KEEP: HandlebarsApplicationMixin pattern, DEFAULT_OPTIONS structure,
        form: { submitOnChange: true, closeOnSubmit: false },
        #buildBoxArray (copy verbatim), #markHitBox (copy verbatim),
        applyDamage/removeOneMark imports
  OMIT: All roll actions (rollSkill, rollAttribute, rollAttack),
        deleteItem, toggleEquipped, newRound,
        all CP/FP/chat logic, tabGroups, rollWithWildDie, RollDialog imports
  ADD: _prepareContext with system, combatData (hitBoxes, boxArrays, thresholds)

Task 4 — CREATE templates/actors/npc-sheet.hbs:
  STRUCTURE: single-page (no tab nav), sections: header, STR, combat stats,
             damage, thresholds, hit boxes, notes
  COPY VERBATIM: hit-box-tracker section from character-sheet.hbs (lines 314–363)
  ADAPT: use system.STR.dice, system.STR.pips, system.rangedDefense etc.
  INCLUDE: notes textarea: <textarea name="system.notes">{{system.notes}}</textarea>

Task 5 — MODIFY system.json:
  FIND: "Actor": { "character": {} }
  REPLACE WITH: "Actor": { "character": {}, "npc": {} }

Task 6 — MODIFY lang/en.json:
  ADD the following keys (insert after last existing key, before closing brace):
  "STARWARSD6.SheetClass.NPC": "Star Wars D6 NPC Sheet",
  "STARWARSD6.NPC.Damage": "Damage",
  "STARWARSD6.NPC.Notes": "Notes",
  "STARWARSD6.NPC.STR": "Strength"

Task 7 — MODIFY starwarsd6.mjs:
  ADD imports at top:
    import NpcData from "./modules/actors/npc-data.mjs";
    import NpcActor from "./modules/actors/npc.mjs";
    import NpcSheet from "./modules/apps/npc-sheet.mjs";
  MODIFY inside Hooks.once("init"):
    CONFIG.Actor.dataModels line → add npc: NpcData
    After existing sheet registrations, add:
      DocumentSheetConfig.registerSheet(Actor, "starwarsd6", NpcSheet, {
        types: ["npc"],
        makeDefault: true,
        label: "STARWARSD6.SheetClass.NPC"
      });
  NOTE: CONFIG.Actor.documentClass stays as CharacterActor — this is fine since
        NpcActor is just Actor. If Foundry errors on type mismatch, change
        CONFIG.Actor.documentClass = Actor (the base class works for both).
```

---

## Integration Points

```yaml
SYSTEM_JSON:
  - key: documentTypes.Actor
  - change: add "npc": {} entry

STARWARSD6_MJS:
  - CONFIG.Actor.dataModels: add npc: NpcData
  - DocumentSheetConfig.registerSheet: add NpcSheet for types: ["npc"]

LANG_EN_JSON:
  - add SheetClass.NPC, NPC.Damage, NPC.Notes, NPC.STR

DAMAGE_HELPERS (no change):
  - applyDamage() and removeOneMark() already work for any actor with system.hitBoxes
    and system.{tier}Marks — confirmed by reading damage.mjs
```

---

## Validation Gates

### Level 1: File syntax (no build step — visual check)

```bash
# These files are plain ESM — no linter configured. Verify manually:
# - All import paths use relative paths with .mjs extension
# - No CommonJS require()
# - No TypeScript syntax
# - attributeField() is defined before use in defineSchema()
# Check for obvious syntax errors by reading each file after writing

# Verify system.json is valid JSON:
node -e "JSON.parse(require('fs').readFileSync('system.json','utf8')); console.log('system.json OK')"

# Verify lang/en.json is valid JSON:
node -e "JSON.parse(require('fs').readFileSync('lang/en.json','utf8')); console.log('lang/en.json OK')"
```

### Level 2: Structural checks

```bash
# Verify all expected files exist:
ls modules/actors/npc-data.mjs modules/actors/npc.mjs modules/apps/npc-sheet.mjs templates/actors/npc-sheet.hbs

# Verify system.json has npc type:
node -e "const s=JSON.parse(require('fs').readFileSync('system.json','utf8')); console.log(s.documentTypes.Actor)"
# Expected: { character: {}, npc: {} }

# Verify npc-data.mjs exports NpcData extending TypeDataModel:
grep -n "TypeDataModel\|export default" modules/actors/npc-data.mjs

# Verify npc-sheet.mjs imports damage helpers:
grep -n "applyDamage\|removeOneMark" modules/apps/npc-sheet.mjs

# Verify starwarsd6.mjs has all three new imports and npc registration:
grep -n "NpcData\|NpcActor\|NpcSheet" starwarsd6.mjs
```

### Level 3: Manual Foundry test

```
1. Deploy to Foundry: ./deploy.sh (user deploys manually — do not run)
2. Open Foundry, create new Actor → type selector should show "npc"
3. Create NPC actor "Test Stormtrooper", open sheet — no console errors
4. Set STR dice=4, pips=0 → hitBoxes shows 4, damageBase shows 14
5. Set rangedDefense=12, meleeDefense=10, brawlingDefense=9 → values persist on reload
6. Set damageDice=4, damagePips=0 → persists
7. Alt+click Stun box → box marks, stunMarks increments
8. Alt+click Stun boxes 4 more times → stun fills, woundMarks increments (cascade)
9. Shift+Alt+click Wound box → woundMarks decrements
10. Type in notes "Standard stormtrooper" → persists on close/reopen
```

---

## Final Validation Checklist

- [ ] `system.json` valid JSON with `"npc": {}` in `documentTypes.Actor`
- [ ] `lang/en.json` valid JSON with all new NPC keys
- [ ] `modules/actors/npc-data.mjs` — `NpcData` extends `foundry.abstract.TypeDataModel`, exports default
- [ ] `modules/actors/npc.mjs` — `NpcActor` extends `Actor`, exports default
- [ ] `modules/apps/npc-sheet.mjs` — `NpcSheet`, template path correct, markHitBox action present
- [ ] `templates/actors/npc-sheet.hbs` — hit-box buttons use `data-action="markHitBox" data-tier="..."`
- [ ] `starwarsd6.mjs` — all three imports added, `npc: NpcData` in dataModels, `NpcSheet` registered
- [ ] No imports of `rollWithWildDie`, `RollDialog`, or defense helpers in `npc-data.mjs` / `npc-sheet.mjs`
- [ ] `applyDamage` / `removeOneMark` imported and used in `npc-sheet.mjs`
- [ ] No direct property assignment to document properties (always use `actor.update()`)

---

## Anti-Patterns to Avoid

- Do not add skills, inventory, CP/FP, or roll buttons to the NPC sheet
- Do not reference `this.parent.items` in `NpcData.prepareDerivedData()`
- Do not import defense calculation helpers (`calculateRangedDefense` etc.) in `npc-data.mjs`
- Do not set `required: false` or omit `nullable: false` on NumberFields — match the existing pattern
- Do not use tabs in the NPC sheet — it's a compact single-page layout
- Do not set `CONFIG.Actor.documentClass = NpcActor` — it would break character creation

---

**PRP Confidence Score: 9/10**

High confidence for one-pass implementation. All patterns are directly mirrored from existing, working code. The NPC DataModel is a strict subset of CharacterData. The sheet and template are simplified versions of CharacterSheet. The only uncertainty is the `documentClass` registration in v13 when multiple actor types exist — the anti-pattern note addresses this with the safest approach (leave `documentClass = CharacterActor` since NpcActor adds nothing).
