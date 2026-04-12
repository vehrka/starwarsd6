# PRP-feat008 — Damage Threshold Table on Combat Tab

## Goal

Display the character's derived damage thresholds as a read-only reference table on the Combat tab, between the Defense section and the Wound Penalties section.

End state:
- A table with four columns (Stun / Wound / Incapacitated / Mortally Wounded) and their numeric threshold ranges is visible on the Combat tab
- Values are derived live from the character's STR attribute — no manual input
- The table is purely informational; no new interaction is added

## Why

- Players currently have no visual reference for what damage totals trigger each wound tier — they must mentally compute `floor(3.5 × STR_dice) + STR_pips` mid-combat
- Showing the table on the sheet eliminates this calculation and speeds up damage resolution
- `calculateDamageThresholds()` in `damage.mjs` already returns `{ base }` — exposing it in the sheet is a pure display change with no logic risk

## What

### Success Criteria

- [ ] `CharacterData.prepareDerivedData()` assigns `this.damageBase` (the `base` value from `calculateDamageThresholds`)
- [ ] `character-sheet.mjs` passes `damageBase` and derived tier-bound strings into `context.combatData`
- [ ] `templates/actors/character-sheet.hbs` renders the threshold table after the Defense table (line 266) and before the Wound Penalties block (line 268)
- [ ] Table shows four columns: Stun, Wound, Incapacitated, Mortally Wounded — each with its numeric range string
- [ ] Values update automatically when STR dice/pips change (derived, not stored)
- [ ] `lang/en.json` adds `"STARWARSD6.Combat.DamageThresholds": "Damage Thresholds"` and `"STARWARSD6.Combat.DamageThreshold": "Threshold"`
- [ ] `npm test` passes — all 81 existing tests still pass

---

## All Needed Context

### Documentation & References

```yaml
- file: doc/rules-reference.md
  why: Authoritative formula and tier table
  critical: |
    base = floor(3.5 × STR_dice) + STR_pips
    Stun:             damage_total < base
    Wound:            base ≤ damage_total < 2 × base
    Incapacitated:    2 × base ≤ damage_total < 3 × base
    Mortally Wounded: damage_total ≥ 3 × base
    Example: STR 3D → base = 10 → Stun <10, Wound 10–19, Incap 20–29, Mortal 30+

- file: modules/helpers/damage.mjs
  why: calculateDamageThresholds(strDice, strPips) already exists and returns { base }
  critical: |
    export function calculateDamageThresholds(strDice, strPips) {
      const base = Math.floor(3.5 * strDice) + strPips;
      return { base };
    }
    NO CHANGES needed to this file.

- file: modules/actors/character-data.mjs
  why: prepareDerivedData() is where this.damageBase must be assigned
  critical: |
    Line 1 imports only from defense.mjs — must add a second import from damage.mjs.
    Current: import { calculateRangedDefense, ... } from "../helpers/defense.mjs";
    Add:     import { calculateDamageThresholds } from "../helpers/damage.mjs";

    In prepareDerivedData(), BEFORE the if (this.parent) block (currently line 45):
      const { base } = calculateDamageThresholds(this.STR.dice, this.STR.pips);
      this.damageBase = base;
    STR is always a schema field — this.parent is NOT required for this value.
    Place it after line 38 (this.hitBoxes = this.STR.dice) to mirror that pattern.

- file: modules/apps/character-sheet.mjs
  why: _prepareContext() builds combatData — add damageBase + threshold strings here
  critical: |
    combatData starts at line 109. Add to the object (after mortalBoxes at line 123):
      damageBase:      sys.damageBase,
      thresholdStun:   `< ${sys.damageBase}`,
      thresholdWound:  `${sys.damageBase}–${2 * sys.damageBase - 1}`,
      thresholdIncap:  `${2 * sys.damageBase}–${3 * sys.damageBase - 1}`,
      thresholdMortal: `${3 * sys.damageBase}+`
    Compute bounds in JS, NOT in Handlebars — HBS has no arithmetic helpers.

- file: templates/actors/character-sheet.hbs
  why: Combat tab template — insert threshold table between Defense (ends line 266) and
       Wound Penalties (starts line 268 with {{!-- Wound Penalties --}})
  critical: |
    Reuse existing CSS classes: .combat-defense-table and .defense-value
    Localization keys STARWARSD6.Combat.Stun/Wound/Incap/Mortal already exist in en.json.
    Only two new keys needed: DamageThresholds and DamageThreshold.

- file: lang/en.json
  why: Add two localisation keys in the Combat section (after line 98 Combat.Miss)
```

### Current Codebase Tree (relevant files)

```
starwarsd6/
├── modules/
│   ├── actors/
│   │   └── character-data.mjs     # MODIFY: import + assign this.damageBase
│   ├── apps/
│   │   └── character-sheet.mjs    # MODIFY: add 5 fields to combatData
│   └── helpers/
│       └── damage.mjs             # NO CHANGE — calculateDamageThresholds already exported
├── templates/
│   └── actors/
│       └── character-sheet.hbs    # MODIFY: insert threshold table between lines 266–268
└── lang/
    └── en.json                    # MODIFY: add 2 keys after "STARWARSD6.Combat.Miss"
```

### Desired Codebase Tree

No new files. Four existing files are modified.

### Known Gotchas

```js
// CRITICAL: calculateDamageThresholds is NOT yet imported in character-data.mjs
// The existing import on line 1 only references defense.mjs.
// Must add a separate import line — do NOT modify the existing defense.mjs import.

// CRITICAL: damageBase assignment goes BEFORE the `if (this.parent)` block (line 45).
// STR is always a schema field — available without this.parent.
// Placing it inside the if block would make it undefined when parent is absent (tests).

// CRITICAL: Upper bound of Wound is (2 * base - 1), not (2 * base).
// Example: base=10 → Wound = "10–19" (not "10–20"), Incap = "20–29", Mortal = "30+"
// thresholdStun = "< N" (no lower bound), thresholdMortal = "N+" (no upper bound).

// CRITICAL: Use en-dash (–) not hyphen (-) for range strings, to match existing UI style.
// `${base}–${2 * base - 1}` — the – is U+2013.

// CRITICAL: Handlebars has no arithmetic helpers in this project.
// ALL math must happen in _prepareContext() in character-sheet.mjs, never in the template.

// CRITICAL: character-data.test.mjs uses makeCharacterData() which sets STR = { dice: 2, pips: 0 }.
// After adding damageBase, that test's prepareDerivedData() will set damageBase = 7.
// This will NOT break existing tests — it only adds a new property.
// However, if you want to be thorough, you can add a damageBase test to that file.
```

---

## Implementation Blueprint

### Task 1 — MODIFY `modules/actors/character-data.mjs`

```yaml
MODIFY modules/actors/character-data.mjs:
  - FIND: import { calculateRangedDefense, calculateMeleeDefense, calculateBrawlingDefense } from "../helpers/defense.mjs";
  - ADD AFTER: import { calculateDamageThresholds } from "../helpers/damage.mjs";
  - FIND in prepareDerivedData(): this.hitBoxes = this.STR.dice;
  - ADD AFTER:
      const { base } = calculateDamageThresholds(this.STR.dice, this.STR.pips);
      this.damageBase = base;
```

Pseudocode:
```js
// BEFORE if (this.parent) block — STR is always available
const { base } = calculateDamageThresholds(this.STR.dice, this.STR.pips);
this.damageBase = base;
// → damageBase is now available to character-sheet.mjs via sys.damageBase
```

### Task 2 — MODIFY `modules/apps/character-sheet.mjs`

```yaml
MODIFY modules/apps/character-sheet.mjs:
  - FIND in _prepareContext(): mortalBoxes: CharacterSheet.#buildBoxArray(hitBoxes, sys.mortalMarks),
  - ADD AFTER (still inside combatData object):
      damageBase:      sys.damageBase,
      thresholdStun:   `< ${sys.damageBase}`,
      thresholdWound:  `${sys.damageBase}–${2 * sys.damageBase - 1}`,
      thresholdIncap:  `${2 * sys.damageBase}–${3 * sys.damageBase - 1}`,
      thresholdMortal: `${3 * sys.damageBase}+`
```

### Task 3 — MODIFY `templates/actors/character-sheet.hbs`

```yaml
MODIFY templates/actors/character-sheet.hbs:
  - FIND: {{!-- Wound Penalties --}}
  - INSERT BEFORE:
      {{!-- Damage Thresholds --}}
      <h3>{{localize "STARWARSD6.Combat.DamageThresholds"}}</h3>
      <table class="combat-defense-table"> ... </table>
```

Full block to insert:
```hbs
{{!-- Damage Thresholds --}}
<h3>{{localize "STARWARSD6.Combat.DamageThresholds"}}</h3>
<table class="combat-defense-table">
  <thead>
    <tr>
      <th>{{localize "STARWARSD6.Combat.Stun"}}</th>
      <th>{{localize "STARWARSD6.Combat.Wound"}}</th>
      <th>{{localize "STARWARSD6.Combat.Incap"}}</th>
      <th>{{localize "STARWARSD6.Combat.Mortal"}}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="defense-value">{{combatData.thresholdStun}}</td>
      <td class="defense-value">{{combatData.thresholdWound}}</td>
      <td class="defense-value">{{combatData.thresholdIncap}}</td>
      <td class="defense-value">{{combatData.thresholdMortal}}</td>
    </tr>
  </tbody>
</table>

```

No new CSS needed — `.combat-defense-table` and `.defense-value` are already defined.

### Task 4 — MODIFY `lang/en.json`

```yaml
MODIFY lang/en.json:
  - FIND: "STARWARSD6.Combat.Miss": "Miss",
  - ADD AFTER:
      "STARWARSD6.Combat.DamageThresholds": "Damage Thresholds",
      "STARWARSD6.Combat.DamageThreshold": "Threshold",
```

### Task 5 — Run `npm test`

```bash
npm test
# Expected: all existing tests pass (currently 81 tests across 6 files)
# New damageBase property on CharacterData will be set to 7 in existing tests (STR 2D+0)
# This is benign — existing assertions don't check for unexpected properties
```

---

## Validation Loop

### Level 1: Unit Tests

```bash
npm test
# Expected: 81 tests pass (6 test files)
# If character-data tests fail:
#   - Check damageBase assignment is BEFORE the if (this.parent) block
#   - STR dice default is 2, pips is 0 → damageBase = floor(3.5*2)+0 = 7 (no throw)
# If new import causes a module resolution error:
#   - Verify the path is "../helpers/damage.mjs" (same directory convention as defense.mjs)
```

### Level 2: Manual Foundry Validation

```
1. Open a character with STR 3D → table shows: Stun <10, Wound 10–19, Incap 20–29, Mortal 30+
2. Edit STR to 4D → base=14 → Stun <14, Wound 14–27, Incap 28–41, Mortal 42+
3. Edit STR to 2D+1 → base = floor(7)+1 = 8 → Stun <8, Wound 8–15, Incap 16–23, Mortal 24+
4. Confirm table appears between Defense and Wound Penalties sections on Combat tab
5. Confirm no raw i18n keys visible (all four tier headers and section heading localized)
6. Confirm layout matches the existing Defense table (same CSS classes)
```

### Final Checklist

- [ ] `npm test` passes (all 81 tests)
- [ ] `this.damageBase` is assigned in `prepareDerivedData()` BEFORE `if (this.parent)`
- [ ] Threshold strings are built in `_prepareContext()`, not in the template
- [ ] En-dash (–) used in range strings, not hyphen (-)
- [ ] Table appears between Defense table and Wound Penalties on the Combat tab
- [ ] Values update live when STR changes
- [ ] No new CSS added (reuses `.combat-defense-table` / `.defense-value`)
- [ ] Two new i18n keys added to `lang/en.json`

---

## Anti-Patterns to Avoid

- Do NOT do arithmetic in Handlebars templates — compute everything in `_prepareContext()`
- Do NOT add `damageBase` as a schema field in `defineSchema()` — it is a derived property
- Do NOT place the `damageBase` assignment inside the `if (this.parent)` block
- Do NOT create new CSS classes — `.combat-defense-table` and `.defense-value` already cover this
- Do NOT skip the `npm test` run — the character-data test exercises `prepareDerivedData()` directly

---

## Confidence Score: 9/10

High confidence because:
- `calculateDamageThresholds` already exists, is already tested, and returns exactly what's needed
- The derived-property pattern (`this.hitBoxes = this.STR.dice`) is already established in `prepareDerivedData()`
- Threshold string formatting is trivial JS with no external dependencies
- Existing CSS classes fully cover the new table — zero style work required
- The HBS insertion point is unambiguous (`{{!-- Wound Penalties --}}` comment on line 268)

Minor uncertainty (−1): existing `character-data.test.mjs` doesn't test `damageBase` — if a future agent adds assertions that check the exact set of properties, they'd need updating. But this does not affect the current test run.
