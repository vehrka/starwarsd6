# Star Wars D6 FoundryVTT — Implementation Plan

**System:** FoundryVTT v13, plain ESM JavaScript, no build step  
**Current state:** feat001 scaffold complete; feat002 (mixin bug) resolved; feat003 (skill sheet & data expansion) complete; feat004 (dice engine) complete; feat005 (item types) complete  
**Architecture:** ApplicationV2 + HandlebarsApplicationMixin, DataModels, KISS/YAGNI

---

## Phase Overview

| Phase | Name | Goal | Complexity | Depends on |
|-------|------|------|------------|------------|
| 0 | Bug Fix | Sheet renders | S | — |
| 1 ✓ | Skill Sheet & Data Expansion | All 38 skills editable, full attribute/skill data | M | 0 |
| 2 ✓ | Dice Engine | Wild die rolls from sheet | M | 1 |
| 3 ✓ | Item Types | Weapons, armor, equipment | M | 1 |
| 4 | Combat & Damage | Defense values, damage thresholds, hit boxes | L | 2, 3 |
| 5 | Character Points & Force Points | CP/FP spend on rolls | M | 2 |
| 6 | NPC Actor | NPC DataModel and sheet | M | 4 |
| 7 | Force System | Force skills, powers, DSP | L | 5 |
| 8 | Healing | Post-combat recovery | M | 4 |
| 9 | Sheet Polish | Tabs, CSS, localization | M | 4 |

---

## Phase 0 — Bug Fix: Character Sheet Mixin

**Goal:** Character sheet renders. Unblocks everything.

**Complexity:** S (1 line + 1 declaration)

**Files to modify:**
- `modules/apps/character-sheet.mjs`

**Changes:** The class extends `foundry.applications.sheets.ActorSheetV2` directly, leaving `_renderHTML` / `_replaceHTML` abstract. Fix: wrap with `HandlebarsApplicationMixin`.

```js
// Add at top:
const { HandlebarsApplicationMixin } = foundry.applications.api;

// Class declaration:
export default class CharacterSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
```

**Testing:** Deploy, open a character actor — sheet renders, all 6 attribute rows visible, no console errors. Edit DEX dice, re-open — value persists.

**Ref:** `ref/dnd5e/module/applications/api/application-v2-mixin.mjs` lines 4, 20.

---

## Phase 1 — Skill Sheet & Data Expansion

**Goal:** All 38 skills (plus 3 Force skills) in DataModel. Character sheet shows skills grouped by attribute. Tabbed layout foundation for all future phases.

**Complexity:** M | **Dependencies:** Phase 0

### Files to create:
- `templates/items/skill-sheet.hbs`
- `modules/apps/skill-sheet.mjs` — `SkillSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2)`

### Files to modify:
- `modules/items/skill-data.mjs` — fix pip derivation: `dicePool = parentAttr.dice + rank`, `pips = parentAttr.pips`. Add `isForce: BooleanField`. Force skills (`isForce: true`) have no parent attribute; `dicePool` is stored rank, `pips` stored as `forcePips`.
- `modules/actors/character-data.mjs` — add:
  - `move: NumberField({ initial: 10 })`
  - `forceSensitive: BooleanField`
  - `characterPoints: NumberField({ initial: 0 })`
  - `forcePoints: NumberField({ initial: 0 })`
  - `darkSidePoints: NumberField({ initial: 0 })`
  - Wound tracking: `stunMarks`, `woundMarks`, `incapMarks`, `mortalMarks` as `NumberField({ initial: 0 })`
  - Derive `hitBoxes = STR.dice` in `prepareDerivedData()`
- `templates/actors/character-sheet.hbs` — replace flat layout with two-tab structure: attributes tab, skills tab (skills grouped by attribute key)
- `starwarsd6.mjs` — register `SkillSheet`
- `lang/en.json` — all 38 skill names, sheet tab labels

### Key patterns:

**`CharacterSheet._prepareContext()`** — build `attributeGroups`:
```js
context.attributeGroups = ATTRIBUTE_KEYS.map(key => ({
  key, label: `STARWARSD6.Attribute.${key}`,
  ...this.document.system[key],
  skills: this.document.items
    .filter(i => i.type === "skill" && i.system.attribute === key)
    .map(skill => ({ id: skill.id, name: skill.name, ...skill.system }))
}));
context.forceSkills = this.document.items.filter(i => i.type === "skill" && i.system.isForce);
```

**Tab pattern:** Use `data-tab` / `data-tab-group` Foundry attributes. Match the structure in `ref/dnd5e/module/applications/actor/character-sheet.mjs`.

**Testing:** Create a character. Add a "blaster" skill item (attribute DEX, rank 1). Open character sheet → skills tab → blaster appears under DEX with correct dicePool.

---

## Phase 2 — Dice Engine

**Goal:** Clicking a skill/attribute on the sheet opens a roll dialog (choose number of actions), rolls with Wild Die, posts result to chat with complication/explosion annotations.

**Complexity:** M | **Dependencies:** Phase 1

### Files to create:
- `modules/helpers/dice.mjs` — core dice logic
- `modules/apps/roll-dialog.mjs` — `RollDialog` for choosing number of actions

### Key functions in `modules/helpers/dice.mjs`:

```js
// rollWithWildDie(dice, pips, multipleActionPenalty = 0) → Promise<RollResult>
// 1. effective = max(1, dice - multipleActionPenalty)
// 2. Roll (effective - 1) normal d6s
// 3. Roll 1 wild d6
// 4. If wild === 6: add 6, reroll, repeat (chain)
// 5. If wild === 1: flag isComplication=true (default: add 1 normally)
// 6. total = normalDice.total + wildTotal + pips

// rollDamage(dice, pips) → Promise<Number>
// No wild die — just new Roll(`${dice}d6 + ${pips}`).evaluate()
```

Use `new Roll("1d6").evaluate()` for each component. Store all intermediate wild die rolls for chat display.

**`RollDialog`** — extends `HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2)`. Input: number of actions (1–4). Returns `{ numActions }` or null (cancelled).

**Sheet wiring** via `static DEFAULT_OPTIONS.actions`:
```js
actions: {
  rollSkill: CharacterSheet.#rollSkill,
  rollAttribute: CharacterSheet.#rollAttribute
}
```
Template buttons: `data-action="rollSkill" data-skill-id="{{skill.id}}"`.

**Testing:** Click skill → dialog → roll → chat card. Wild die 6 shows chained explosion. Wild die 1 shows complication flag. Two-action penalty reduces dice by 1.

**Ref:** `ref/dnd5e/module/dice/basic-roll.mjs`; `ref/dnd5e/module/applications/dice/roll-configuration-dialog.mjs`.

---

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

---

## Phase 4 — Combat: Defense Values, Damage Thresholds, Hit Box Tracking

**Goal:** Sheet shows derived defense values. Damage rolls compare against STR thresholds. Hit boxes tracked and rendered. Tier penalties computed and applied to rolls.

**Complexity:** L | **Dependencies:** Phases 2, 3

### Files to create:
- `modules/helpers/defense.mjs` — `calculateRangedDefense(actor)`, `calculateMeleeDefense(actor)`, `calculateBrawlingDefense(actor)`
- `modules/helpers/damage.mjs` — `calculateDamageThresholds(strDice, strPips)`, `resolveDamageTier(damageTotal, thresholds)`, `applyDamage(actor, tier)`

### Files to modify:
- `modules/actors/character-data.mjs` — add `armorBonus: NumberField` and `weaponBonus: NumberField` (manual overrides). In `prepareDerivedData()`: compute defense values and damage thresholds, expose `penaltyDice` and `penaltyPips` from wound marks.
- `modules/apps/character-sheet.mjs` — add combat tab; wire roll-attack action; wire hit-box click-to-mark
- `templates/actors/character-sheet.hbs` — combat tab: defense values, damage threshold hit box checkboxes per tier
- `lang/en.json` — combat labels

### Key functions:

**`calculateRangedDefense(actor)`:**
```
find dodge skill in actor.items (i.name === "dodge") or fall back to DEX
floor(3.5 × dodgeDice) + dodgePips + actor.system.armorBonus
```

**`calculateDamageThresholds(strDice, strPips)`:**
```
base = floor(3.5 × strDice) + strPips
returns { base, stun: [0, base), wound: [base, 2*base), incap: [2*base, 3*base), mortal: ≥3*base }
```

**`applyDamage(actor, tier)`:** Increment `${tier}Marks` by 1. Overflow (marks ≥ hitBoxes) cascades to next tier. Use `actor.update()`.

**Tier penalties in `prepareDerivedData()`:**
```
penaltyDice = woundMarks×1 + incapMarks×2 + mortalMarks×3
penaltyPips = -1 per stunMark (flat roll penalty, not dice)
```

**Roll-attack flow:** Get weapon from actor.items → open `RollDialog` → `rollWithWildDie` with attack skill dice minus tier penalties → post to chat.

**Testing:** STR 3D → base=10, 3 hit boxes/tier. Mark hit boxes, verify overflow cascade. Roll skill with 2 wound marks → dice reduced by 2.

**Ref:** `ref/dnd5e/module/data/actor/templates/attributes.mjs`.

---

## Phase 5 — Character Points & Force Points

**Goal:** CP/FP tracked on sheet. CP adds +1D post-roll. FP doubles all dice for one round. Mutual exclusivity enforced.

**Complexity:** M | **Dependencies:** Phase 2

### Files to modify:
- `modules/apps/character-sheet.mjs` — CP/FP display in header; spend action buttons
- `modules/helpers/dice.mjs` — extend `rollWithWildDie` with `{ extraDice, doubled }` options
- `templates/actors/character-sheet.hbs` — CP/FP counters in header; "Spend CP" button in chat card; FP checkbox in `RollDialog`

### Interaction flow:

**Character Point:** After roll resolves, "Spend CP" button in chat card (if actor has CP > 0). Clicking rolls 1 extra die, adds to total, decrements `characterPoints` via `actor.update()`.

**Force Point:** Checkbox in `RollDialog`. If checked, `doubled = true` → `effectiveDice = dice × 2`. Decrements `forcePoints` via `actor.update()`.

**Mutual exclusivity:** Track `fpSpentThisRound` via `actor.setFlag("starwarsd6", "fpSpentThisRound", true)`. Clear via a "New Round" button or `combatRound` hook.

**Testing:** CP=3, roll skill, click "Spend CP" → +1D added, CP→2. FP spend doubles dice. Both same round → second button disabled.

---

## Phase 6 — NPC Actor Type

**Goal:** NPC actor type with simplified DataModel (no skill items, direct defense values), NPC sheet, registered in system.

**Complexity:** M | **Dependencies:** Phase 4

### Files to create:
- `modules/actors/npc-data.mjs` — `NpcData extends foundry.abstract.TypeDataModel`
- `modules/apps/npc-sheet.mjs` — `NpcSheet`
- `templates/actors/npc-sheet.hbs`

### NpcData schema:
```js
{
  STR: attributeField(),            // same schema as character attributes
  rangedDefense: NumberField({ integer: true, min: 0, initial: 10 }),
  meleeDefense: NumberField({ integer: true, min: 0, initial: 10 }),
  brawlingDefense: NumberField({ integer: true, min: 0, initial: 10 }),
  damageDice: NumberField({ integer: true, min: 1, initial: 4 }),
  damagePips: NumberField({ integer: true, min: 0, max: 2, initial: 0 }),
  stunMarks: NumberField({ integer: true, min: 0, initial: 0 }),
  woundMarks: NumberField({ integer: true, min: 0, initial: 0 }),
  incapMarks: NumberField({ integer: true, min: 0, initial: 0 }),
  mortalMarks: NumberField({ integer: true, min: 0, initial: 0 }),
  notes: StringField({ initial: "" })
}
```

Derive `hitBoxes = STR.dice` and damage thresholds from `calculateDamageThresholds` helper (already in `modules/helpers/damage.mjs`).

> **Code promotion trigger:** `calculateDamageThresholds` now called from `character-data.mjs`, `npc-data.mjs`, and `damage.mjs` — third caller satisfies Rule of Three, confirming it belongs in `modules/helpers/damage.mjs`.

### Files to modify:
- `starwarsd6.mjs` — register `NpcData`, `NpcActor`, `NpcSheet`
- `system.json` — add `npc` to `documentTypes.Actor`
- `lang/en.json` — NPC sheet labels

**Testing:** Create NPC, STR 4D → 4 hit boxes. Set defense values directly. Mark wounds, verify thresholds.

**Ref:** `ref/dnd5e/module/data/actor/npc.mjs`; `ref/dnd5e/module/applications/actor/npc-sheet.mjs`.

---

## Phase 7 — Force System

**Goal:** Force skills (control/sense/alter) as independent die codes on Force-sensitive characters. DSP bonus applies to Force rolls. "Keep up" tracking. Dark side conversion roll.

**Complexity:** L | **Dependencies:** Phase 5

### Files to create:
- `modules/helpers/force.mjs` — `calculateForceDiceBonus(dsp)`, `applyDarkSidePoint(actor)`

### Files to modify:
- `modules/actors/character-data.mjs` — add Force fields (active when `forceSensitive: true`):
  ```js
  forceSkills: SchemaField({
    control: SchemaField({ dice: NumberField({ min: 0, initial: 0 }), pips: NumberField({ min: 0, max: 2, initial: 0 }) }),
    sense:   SchemaField({ dice: ..., pips: ... }),
    alter:   SchemaField({ dice: ..., pips: ... })
  }),
  keptUpPowers: ArrayField(StringField())  // names of currently active kept-up powers
  ```
  In `prepareDerivedData()`: compute DSP bonus via `calculateForceDiceBonus(dsp)`, expose `forceRollBonus`.

- `modules/apps/character-sheet.mjs` — Force tab (visible only when `forceSensitive === true`): Force skill die codes (editable), DSP counter, kept-up powers list, "Add DSP" button.

### Key functions in `modules/helpers/force.mjs`:

```js
// calculateForceDiceBonus(dsp):
// dsp 0:     { bonusDice: 0, bonusPips: 0 }
// dsp 1–2:   { bonusDice: 0, bonusPips: 2 * dsp }  (normalize overflow: 3 pips → 1 die)
// dsp >= 3:  { bonusDice: dsp, bonusPips: 0 }

// applyDarkSidePoint(actor):
// 1. newDsp = actor.system.darkSidePoints + 1
// 2. actor.update({ "system.darkSidePoints": newDsp })
// 3. Roll 1d6; if total < newDsp → post chat warning "Character consumed by dark side"
```

**Force power activation:** Powers are free-text entries, not coded items. `RollDialog` adds a "Force difficulty modifier" input (+0 to +30) for relationship/proximity. Multi-skill powers: user declares each skill roll as separate actions (normal multiple-action penalty applies). "Keep up" count (`keptUpPowers.length`) adds to action count for all rolls.

**Testing:** Force-sensitive character, control 2D. DSP=3 → roll shows control+3D bonus. "Add DSP" rolls conversion check in chat. Keep up 2 powers → action penalty of 2 on all rolls.

---

## Phase 8 — Healing

**Goal:** Stamina and medicine healing rolls with correct difficulty tables applied per tier. Most-serious-tier-first enforcement.

**Complexity:** M | **Dependencies:** Phase 4

### Files to create:
- `modules/helpers/healing.mjs` — `resolveStaminaHealing(rollTotal)`, `resolveMedicineHealing(rollTotal, tier)`, `applyHealing(actor, tier, amount)`

```js
// resolveStaminaHealing(rollTotal) → heals wounds only
// 6–10 → 1,  11–15 → 2,  16–20 → 3

// resolveMedicineHealing(rollTotal, tier):
// "wound":  3–5→1, 6–8→2, 9–12→3, 13–16→4
// "incap":  6–10→1, 11–15→2, 16–20→3, 21–25→4
// "mortal": 11–15→1, 16–20→2, 21–25→3, 26–30→4

// applyHealing(actor, tier, amount):
// Validates most-serious-first: if mortalMarks > 0 and tier !== "mortal" → throw + chat warning
// Decrements actor.system[`${tier}Marks`] by amount (min 0) via actor.update()
```

### Files to modify:
- `modules/apps/character-sheet.mjs` — "Stamina Roll" and "Medicine Roll" buttons in combat tab
- `templates/actors/character-sheet.hbs` — healing buttons in combat tab
- `lang/en.json` — healing tier labels

**Testing:** 2 wound marks. Stamina roll result 14 → heals 2 wounds. Try to heal wound while incapacitated → warning in chat, no healing applied.

---

## Phase 9 — Sheet Polish, CSS, Full Localization

**Goal:** Professional tabbed sheet, complete i18n, styled chat cards for rolls.

**Complexity:** M | **Dependencies:** All previous phases

### Files to modify:
- `styles/starwarsd6.css` — tab nav, attribute table, skill groups, hit box checkboxes with tier colours (stun=yellow, wound=orange, incap=red, mortal=dark-red), Force section (blue accent). Scope all rules to `.starwarsd6.sheet`.
- `templates/actors/character-sheet.hbs` — finalize all tabs: header (name/portrait/CP/FP/Move), attributes, skills (grouped), combat (defense + hit boxes + healing), force (conditional), inventory
- `lang/en.json` — all 38 skill names, all item fields, all chat labels, all error messages, tier names
- `templates/chat/roll-result.hbs` — new styled chat card: formula, wild die result, complication/explosion markers, vs. defense for attack rolls

**Testing:** Sheet opens cleanly. All tabs switch without reload. Zero raw i18n keys visible. Chat card readable with annotations.

---

## Dependency Graph

```
Phase 0 (bug fix)
  └─► Phase 1 (skills + data expansion)
        ├─► Phase 2 (dice engine)
        │     ├─► Phase 4 (combat)
        │     │     ├─► Phase 5 (CP/FP) ──► Phase 7 (Force)
        │     │     ├─► Phase 6 (NPC)
        │     │     └─► Phase 8 (healing)
        │     └─► Phase 5
        └─► Phase 3 (item types)
              └─► Phase 4
Phase 9 (polish) — final cleanup, no hard dependencies
```

---

## Out of Scope

- Compendium packs (pre-built skill items, weapons)
- Vehicle / starship actor type
- Active Effects (no modifier stacking in D6)
- Token automation (auto-apply damage from chat)
- Force power catalogue as coded items (free-text on sheet is sufficient)

---

## Critical Files

| File | Modified in phases |
|------|--------------------|
| `modules/apps/character-sheet.mjs` | 0, 1, 2, 4, 5, 7, 8, 9 |
| `modules/actors/character-data.mjs` | 1, 4, 5, 7 |
| `starwarsd6.mjs` | 1, 3, 6 |
| `system.json` | 3 (items), 6 (npc) |
| `modules/helpers/dice.mjs` | 2, 5 |
| `modules/helpers/damage.mjs` | 4, 6 |
| `lang/en.json` | 1, 3, 4, 8, 9 |
