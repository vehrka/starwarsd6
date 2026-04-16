# PRP-feat016 — PC Combat Tab Restyling

## Goal

Restyle the Combat tab on the PC character sheet to match the reference layout in `doc/ref/combat_tab_ref.png`. This is a **pure template + CSS** task — no new data model fields, no new MJS logic.

The new layout has two sections in this order:

1. **Weapons** (top) — table with name, damage, attack skill die pool, and roll button per row; only equipped weapons
2. **Wounds** (bottom) — section caption "WOUNDS", defense values inline on one row, then a 2×2 grid of wound-tier cells (tier name + threshold range on line 1; clickable hit boxes on line 2)

Remove: the existing standalone `combat-defense-table`, the Damage Thresholds table, the Wound Penalties block, and the hit-box hint text.

## Why

- The current layout stacks Defense / Thresholds / Penalties / Hit Boxes / Weapons in a verbose, table-heavy format that doesn't match the compact reference design.
- The reference image groups wounds/defense together and surfaces weapons first for faster combat access.
- Pure visual reshuffle — no mechanical changes, no risk to existing data bindings.

## What

### Success Criteria

- [ ] Weapons section appears **first** on the Combat tab, showing only equipped weapons
- [ ] Each weapon row: Name | Damage die pool | Attack Skill die pool | Roll Attack button — all on a single `<tr>`, no second line
- [ ] WOUNDS section caption appears below weapons
- [ ] Defense values (Ranged / Melee / Brawling) displayed inline on one row immediately below the WOUNDS caption
- [ ] 2×2 grid of wound tier cells, each cell has tier label + threshold range on line 1, hit boxes on line 2
- [ ] Grid order: Stunned (top-left), Wounded (top-right), Incapacitated (bottom-left), Mortally Wounded (bottom-right)
- [ ] All `data-action="markHitBox"` and `data-tier="..."` attributes preserved on hit-box buttons
- [ ] All `data-action="rollAttack"` and `data-weapon-id="..."` attributes preserved on roll buttons
- [ ] All `combatData.*` Handlebars references intact (no data binding changes)
- [ ] Removed: `combat-defense-table`, Damage Thresholds table, Wound Penalties block, hit-box hint text
- [ ] All new CSS rules scoped under `.starwarsd6.sheet`
- [ ] No new localization keys needed (all existing keys already cover the content)
- [ ] `npm test` still passes (no MJS changes expected)

---

## All Needed Context

### Reference Image Analysis

`doc/ref/combat_tab_ref.png` shows:

```
Heavy Blaster     5D + 1
  Damage: 5D
Vibroblade        4D + 1
  Damage: 4D + 2

WOUNDS                      DEFENSE = 16
Stunned (<10)               Wounded (10-19)
[                        ]  [                        ]
(3 = Unconscious)           (3 = Incapacitated)

Incapacitated (20-29)       Mortally Wounded (30+)
[                        ]  [                        ]
(3 = Mortally Wounded)      (3 = Dead)
```

**Important deviations from the image per the feature spec:**
- Weapons: show as a proper table with Name | Damage | Skill | Roll button (single row per weapon), not the two-line text format in the image
- Defense: show as three separate labeled values (Ranged / Melee / Brawling), not a single "DEFENSE = 16" value
- Consequence labels like "(3 = Unconscious)" are derived from `combatData.stunBoxes.length` — compute in template or add pre-computed field in `_prepareCombatData`

### Documentation & References

```yaml
- file: templates/actors/character-sheet.hbs
  lines: 208–347
  why: Current Combat tab markup to be replaced. Data bindings (combatData.*) are correct and
       must all be preserved. Only HTML structure and CSS classes change.

- file: styles/starwarsd6.css
  lines: 426–529
  why: Existing combat tab styles to be revised. Classes to remove/retire:
       .combat-defense-table, .hit-box-tracker, .hit-box-row, .tier-label, .hit-box-hint,
       .combat-penalties, .combat-bonuses (defensive — keep .hit-box and .hit-box.marked as-is).
       Add new: .combat-wounds-section, .combat-defense-inline, .wound-grid, .wound-cell,
       .wound-cell-header, .wound-cell-boxes

- file: modules/apps/character-sheet.mjs
  lines: 131–158
  why: combatData fields available in template:
       rangedDefense, meleeDefense, brawlingDefense,
       penaltyDice, penaltyPips,
       hitBoxes, stunMarks, woundMarks, incapMarks, mortalMarks,
       stunBoxes[], woundBoxes[], incapBoxes[], mortalBoxes[]  (each: {index, marked})
       damageBase, thresholdStun, thresholdWound, thresholdIncap, thresholdMortal
       weapons[]  (each: {id, name, damageDice, damagePips, attackSkill, range, equipped})

- file: lang/en.json
  why: All localization keys already present:
       STARWARSD6.Combat.Weapons, STARWARSD6.Combat.RangedDefense,
       STARWARSD6.Combat.MeleeDefense, STARWARSD6.Combat.BrawlingDefense,
       STARWARSD6.Combat.Stun, STARWARSD6.Combat.Wound, STARWARSD6.Combat.Incap,
       STARWARSD6.Combat.Mortal, STARWARSD6.Combat.Roll, STARWARSD6.Skill.Name,
       STARWARSD6.Item.Weapon.Damage, STARWARSD6.Item.Weapon.AttackSkill,
       STARWARSD6.Combat.AttackRoll, STARWARSD6.Inventory.Empty
       No new keys needed.

- file: doc/ref/combat_tab_ref.png
  why: PRIMARY visual reference. The target layout. See deviations noted above.

- file: PRPs/feats/feat006-combat.md
  why: Background on what combatData fields exist and what they mean.

- file: PRPs/feats/feat008-add-damage-threshold-table.md
  why: Added thresholdStun/thresholdWound/thresholdIncap/thresholdMortal to combatData.
```

### Current Codebase Tree (relevant files only)

```
starwarsd6/
├── templates/actors/character-sheet.hbs   # MODIFY: lines 208–347 (Combat tab section)
├── styles/starwarsd6.css                  # MODIFY: lines 426–529 (combat tab styles)
└── lang/en.json                           # NO CHANGE (all keys exist)
```

### Desired Codebase Tree

No new files. Only two files change:

```
templates/actors/character-sheet.hbs   ← MODIFY: restructure Combat tab section
styles/starwarsd6.css                  ← MODIFY: replace old combat styles with new layout styles
```

### Known Gotchas

```js
// CRITICAL: All data bindings must be preserved exactly.
// combatData.stunBoxes is an array of {index, marked} objects — the current HBS
// iterates over it with {{#each combatData.stunBoxes as |box|}}. Preserve this pattern.

// CRITICAL: Hit-box buttons must keep data-action="markHitBox" and data-tier="..."
// They must NOT have name= attributes (would overwrite marks on form submit).
// They are styled buttons, not checkboxes.

// CRITICAL: Only equipped weapons in the weapons table.
// combatData.weapons === context.weapons which is ALL weapons (including unequipped).
// Filter in HBS: {{#if weapon.equipped}} ... {{/if}} inside the #each loop,
// OR add a pre-filtered field in _prepareContext. Simplest: filter in HBS template.

// CRITICAL: thresholdStun/Wound/Incap/Mortal are pre-formatted strings
// e.g. thresholdStun = "< 10", thresholdWound = "10–19", etc.
// Use directly in template — no arithmetic needed.

// CRITICAL: Consequence labels (e.g. "3 = Incapacitated")
// These show "N = <consequence>" where N = number of hit boxes per tier = combatData.hitBoxes.
// The consequence per tier:
//   stun tier full → Unconscious (actually: Wounded for overflow — check rules)
//   wound tier full → Incapacitated
//   incap tier full → Mortally Wounded
//   mortal tier full → Dead
// Simplest approach: hardcode the consequence string in HBS using combatData.hitBoxes
// e.g.:  {{combatData.hitBoxes}} = Unconscious
// The feature spec says to derive from stunBoxes.length etc. which equals hitBoxes.
// Keep it simple — all four tiers have the same count (hitBoxes = STR_dice).

// CRITICAL: Wound tier name + threshold in cell header.
// Format: "Stunned (<10)" using the thresholdStun pre-formatted string.
// For Stun: "Stunned ({{combatData.thresholdStun}})"
// For Wound: "Wounded ({{combatData.thresholdWound}})"
// etc.

// CRITICAL: CSS grid for 2×2 wound layout.
// Use CSS grid: display: grid; grid-template-columns: 1fr 1fr; gap: Xpx
// Each .wound-cell fills one grid cell.
// All new rules under .starwarsd6.sheet to avoid leaking.

// CRITICAL: Damage die pool display format
// Current template: {{weapon.damageDice}}D{{#if weapon.damagePips}}+{{weapon.damagePips}}{{/if}}
// This correctly renders "5D" (no pips) or "4D+2" (with pips). Preserve exactly.

// CRITICAL: Attack skill die pool
// weapon.attackSkill is a string name like "blaster" not a die code.
// The actual die pool for the attack skill needs to come from the actor's skill items.
// The current template just shows weapon.attackSkill (the skill name).
// The feature spec says "Attack skill die pool (e.g. 5D+1)" — this means the computed
// dicePool from the actor's matching skill item.
// SOLUTION: Add attackSkillDice and attackSkillPips to each weapon entry in _prepareContext,
// OR add a pre-computed attackSkillDisplay string. This requires a small MJS change.
// Add to _prepareContext in the combatData.weapons mapping:
//   Find skill item matching weapon.attackSkill (case-insensitive)
//   If found: attackSkillDisplay = `${skill.system.dicePool}D+${skill.system.pips}` (handle 0 pips)
//   If not found: fallback to DEX: `${sys.DEX.dice}D+${sys.DEX.pips}`
// This IS a minor MJS change but is necessary to show the die pool.
```

---

## Implementation Blueprint

### New Combat Tab Structure (HTML pseudocode)

```handlebars
{{!-- COMBAT TAB --}}
<section class="tab ..." data-tab="combat" data-group="primary">

  {{!-- Section 1: Weapons --}}
  <h3>{{localize "STARWARSD6.Combat.Weapons"}}</h3>
  {{#if combatData.weapons.length}}
  <table class="combat-weapons-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Damage</th>
        <th>Skill</th>
        <th>Roll</th>
      </tr>
    </thead>
    <tbody>
      {{#each combatData.weapons as |weapon|}}
        {{#if weapon.equipped}}
        <tr>
          <td>{{weapon.name}}</td>
          <td>{{weapon.damageDice}}D{{#if weapon.damagePips}}+{{weapon.damagePips}}{{/if}}</td>
          <td>{{weapon.attackSkillDisplay}}</td>   {{!-- NEW: pre-computed die pool string --}}
          <td>
            <button type="button" data-action="rollAttack" data-weapon-id="{{weapon.id}}">
              {{localize "STARWARSD6.Combat.Roll"}}
            </button>
          </td>
        </tr>
        {{/if}}
      {{/each}}
    </tbody>
  </table>
  {{else}}
  <p class="no-items">{{localize "STARWARSD6.Inventory.Empty"}}</p>
  {{/if}}

  {{!-- Section 2: Wounds --}}
  <div class="combat-wounds-section">
    <h3 class="wounds-caption">WOUNDS</h3>

    {{!-- Defense values inline --}}
    <div class="combat-defense-inline">
      <span class="defense-label">{{localize "STARWARSD6.Combat.RangedDefense"}}</span>
      <span class="defense-value">{{combatData.rangedDefense}}</span>
      <span class="defense-label">{{localize "STARWARSD6.Combat.MeleeDefense"}}</span>
      <span class="defense-value">{{combatData.meleeDefense}}</span>
      <span class="defense-label">{{localize "STARWARSD6.Combat.BrawlingDefense"}}</span>
      <span class="defense-value">{{combatData.brawlingDefense}}</span>
    </div>

    {{!-- 2x2 wound grid --}}
    <div class="wound-grid">

      {{!-- Stunned --}}
      <div class="wound-cell">
        <div class="wound-cell-header">
          {{localize "STARWARSD6.Combat.Stun"}} ({{combatData.thresholdStun}})
        </div>
        <div class="hit-boxes">
          {{#each combatData.stunBoxes as |box|}}
          <button type="button" class="hit-box {{#if box.marked}}marked{{/if}}"
                  data-action="markHitBox" data-tier="stun"></button>
          {{/each}}
        </div>
        <div class="wound-consequence">{{combatData.hitBoxes}} = Unconscious</div>
      </div>

      {{!-- Wounded --}}
      <div class="wound-cell">
        <div class="wound-cell-header">
          {{localize "STARWARSD6.Combat.Wound"}} ({{combatData.thresholdWound}})
        </div>
        <div class="hit-boxes">
          {{#each combatData.woundBoxes as |box|}}
          <button type="button" class="hit-box {{#if box.marked}}marked{{/if}}"
                  data-action="markHitBox" data-tier="wound"></button>
          {{/each}}
        </div>
        <div class="wound-consequence">{{combatData.hitBoxes}} = Incapacitated</div>
      </div>

      {{!-- Incapacitated --}}
      <div class="wound-cell">
        <div class="wound-cell-header">
          {{localize "STARWARSD6.Combat.Incap"}} ({{combatData.thresholdIncap}})
        </div>
        <div class="hit-boxes">
          {{#each combatData.incapBoxes as |box|}}
          <button type="button" class="hit-box {{#if box.marked}}marked{{/if}}"
                  data-action="markHitBox" data-tier="incap"></button>
          {{/each}}
        </div>
        <div class="wound-consequence">{{combatData.hitBoxes}} = Mortally Wounded</div>
      </div>

      {{!-- Mortally Wounded --}}
      <div class="wound-cell">
        <div class="wound-cell-header">
          {{localize "STARWARSD6.Combat.Mortal"}} ({{combatData.thresholdMortal}})
        </div>
        <div class="hit-boxes">
          {{#each combatData.mortalBoxes as |box|}}
          <button type="button" class="hit-box {{#if box.marked}}marked{{/if}}"
                  data-action="markHitBox" data-tier="mortal"></button>
          {{/each}}
        </div>
        <div class="wound-consequence">{{combatData.hitBoxes}} = Dead</div>
      </div>

    </div>{{!-- .wound-grid --}}
  </div>{{!-- .combat-wounds-section --}}

</section>
```

### New CSS pseudocode

```css
/* Combat tab — Weapons table (reuse existing .combat-weapons-table rules) */
/* No structural change needed for the weapons table itself */

/* Wounds section */
.starwarsd6.sheet .combat-wounds-section {
  margin-top: 1em;
}

.starwarsd6.sheet .wounds-caption {
  text-transform: uppercase;
  font-weight: bold;
  border-bottom: 2px solid #333;
  margin-bottom: 0.4em;
}

/* Defense inline row */
.starwarsd6.sheet .combat-defense-inline {
  display: flex;
  gap: 1.2em;
  align-items: center;
  margin-bottom: 0.75em;
  flex-wrap: wrap;
}

.starwarsd6.sheet .combat-defense-inline .defense-label {
  font-weight: bold;
  font-size: 0.85em;
  text-transform: uppercase;
  color: #555;
}

.starwarsd6.sheet .combat-defense-inline .defense-value {
  font-size: 1.2em;
  font-weight: bold;
  margin-right: 0.5em;
}

/* 2x2 wound grid */
.starwarsd6.sheet .wound-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.starwarsd6.sheet .wound-cell {
  border: 1px solid #aaa;
  border-radius: 3px;
  padding: 6px 8px;
  background: #fafafa;
}

.starwarsd6.sheet .wound-cell-header {
  font-weight: bold;
  font-size: 0.9em;
  margin-bottom: 4px;
}

.starwarsd6.sheet .wound-cell .hit-boxes {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.starwarsd6.sheet .wound-consequence {
  font-size: 0.75em;
  color: #666;
  font-style: italic;
}

/* Remove old rules that no longer apply (override with display:none or just delete): */
/* .combat-defense-table, .hit-box-tracker, .hit-box-row, .tier-label, .hit-box-hint,
   .combat-penalties — these classes will no longer exist in the template */
/* SAFE to delete their CSS rules since the classes are gone from HTML */
```

### List of Tasks

```yaml
Task 1 — MODIFY modules/apps/character-sheet.mjs (_prepareContext, combatData.weapons):
  - In the combatData.weapons mapping (line ~154), add attackSkillDisplay to each weapon entry.
  - Find the skill item matching weapon.attackSkill (case-insensitive) in this.document.items.
  - If found: format as "NDs+P" or "ND" if pips==0.
  - If not found: fallback to DEX die code.
  - Keep the mapping inside the existing _prepareContext combatData block (no new methods).
  - PATTERN: Mirror the existing case-insensitive skill lookup pattern already in #rollAttack.

  Pseudocode:
    weapons: context.weapons.map(w => {
      const skillItem = this.document.items.find(
        i => i.type === "skill" && i.name.toLowerCase() === w.attackSkill.toLowerCase()
      );
      const skillDice = skillItem ? skillItem.system.dicePool : sys.DEX.dice;
      const skillPips  = skillItem ? skillItem.system.pips     : sys.DEX.pips;
      const attackSkillDisplay = skillPips > 0
        ? `${skillDice}D+${skillPips}`
        : `${skillDice}D`;
      return { ...w, attackSkillDisplay };
    })

Task 2 — MODIFY templates/actors/character-sheet.hbs:
  - Replace lines 208–347 (the entire Combat tab section) with the new structure.
  - Section 1: Weapons table (equipped weapons only, single row per weapon).
  - Section 2: Wounds section with WOUNDS caption, defense inline row, 2×2 wound grid.
  - Preserve all data-action, data-tier, data-weapon-id attributes exactly.
  - Remove: combat-defense-table, Damage Thresholds table, Wound Penalties block,
    hit-box-tracker/hit-box-row/tier-label structure, hit-box-hint paragraph.

Task 3 — MODIFY styles/starwarsd6.css:
  - Remove (delete) the old rules for:
      .combat-defense-table, .combat-defense-table th/td,
      .combat-defense-table th, .defense-value (standalone),
      .combat-bonuses, .combat-penalties, .combat-bonuses .form-group, .combat-penalties .form-group,
      .combat-bonuses input[type="number"],
      .hit-box-tracker, .hit-box-row, .tier-label, .hit-box-hint
  - Keep: .hit-box, .hit-box.marked, .hit-box:hover, .hit-boxes (reused in wound cells)
  - Keep: .combat-weapons-table and its th/td rules (reused as-is)
  - Add: new rules for .combat-wounds-section, .wounds-caption, .combat-defense-inline,
    .defense-label (scoped), .defense-value (scoped under .combat-defense-inline),
    .wound-grid, .wound-cell, .wound-cell-header, .wound-cell .hit-boxes, .wound-consequence
  - All new rules scoped under .starwarsd6.sheet

Task 4 — Verify tests still pass:
  Run: npm test
  Expected: all tests green (no MJS logic changed that affects tests, only _prepareContext addition)
```

### Integration Points

```yaml
MJS (_prepareContext):
  - combatData.weapons changes from context.weapons directly
    to context.weapons.map(w => ({...w, attackSkillDisplay}))
  - This is the only MJS change; it's additive (adds a field, changes nothing else)
  - The existing context.weapons is still built before combatData, so it's available

HBS template:
  - Section order: Weapons first, then Wounds (reversed from current)
  - The tab wrapper (<section class="tab ..."> and </section>) stays identical
  - Only the inner content between the section tags changes

CSS:
  - .hit-boxes class (flex row of hit-box buttons) is reused inside wound cells
  - No class rename needed — the existing .hit-boxes and .hit-box rules still apply
  - The .combat-weapons-table rules stay unchanged
```

---

## Validation Loop

### Level 1: Syntax Check

```bash
# Check HBS template syntax by looking for unclosed {{#each}}/{{#if}} blocks
# (no CLI tool available — verify manually by counting opens vs closes)

# Check CSS for obvious syntax errors
node -e "
const fs = require('fs');
const css = fs.readFileSync('styles/starwarsd6.css', 'utf8');
const opens = (css.match(/\{/g) || []).length;
const closes = (css.match(/\}/g) || []).length;
console.log('CSS brace balance:', opens === closes ? 'OK' : 'MISMATCH ' + opens + ' vs ' + closes);
"
```

### Level 2: Unit Tests

```bash
npm test
# Expected: all tests pass (no pure logic changed)
# The only MJS change is adding attackSkillDisplay to combatData.weapons.
# If a test fails, read the error carefully — likely an import or mock issue.
```

### Level 3: Manual Validation in Foundry (after deploy)

```
1. Open a character sheet → Combat tab
2. Weapons section appears at top — only equipped weapons visible (one row per weapon)
3. Each weapon row shows: Name | Damage die code | Skill die code | Roll Attack button
4. WOUNDS caption visible below weapons table
5. Three defense values (Ranged / Melee / Brawling) on one inline row
6. 2×2 grid of wound cells — Stunned top-left, Wounded top-right,
   Incapacitated bottom-left, Mortally Wounded bottom-right
7. Each cell: tier name + threshold range on header, hit boxes below, consequence text below that
8. Click a hit box → markHitBox fires, box turns red
9. Roll Attack button → RollDialog opens, roll posts to chat
10. No stale CSS classes visible (no defense table, no threshold table, no penalties block)
```

## Final Validation Checklist

- [ ] `npm test` passes with no failures
- [ ] Weapons section is first, shows only equipped weapons, single row per weapon
- [ ] `attackSkillDisplay` renders as die code (e.g. "4D+1"), not skill name
- [ ] WOUNDS section caption present
- [ ] Defense values inline (3 on one row, labeled)
- [ ] 2×2 wound grid renders correctly
- [ ] Hit box buttons: `data-action="markHitBox"`, `data-tier="stun|wound|incap|mortal"` preserved
- [ ] Roll button: `data-action="rollAttack"`, `data-weapon-id="..."` preserved
- [ ] Removed sections: defense table, threshold table, penalties block, hit-box-hint
- [ ] All CSS rules scoped under `.starwarsd6.sheet`
- [ ] No raw localization key strings visible in UI
- [ ] `doc/implementation-plan.md` updated to mark feat016 complete

---

## Anti-Patterns to Avoid

- Never change `data-action` or `data-tier` attribute names — the JS click handlers in `character-sheet.mjs` rely on them
- Never bind hit boxes as `<input type="checkbox" name="...">` — form submit would overwrite mark state
- Never skip the `{{#if weapon.equipped}}` filter — all weapons (equipped/unequipped) are in `combatData.weapons`
- Never add CSS rules without `.starwarsd6.sheet` scope prefix
- Never add new localization keys — all required strings are already in `lang/en.json`
- Never touch `character-sheet.mjs` actions or any file outside the three listed (character-sheet.mjs, character-sheet.hbs, starwarsd6.css)
- Never remove the `penaltyDice`/`penaltyPips` from `combatData` even if not displayed — other code may read them

---

**Confidence score: 8/10**

High confidence because: pure template + CSS task, all data already available in `combatData`, clear reference image, well-defined removals and additions. The one complexity is `attackSkillDisplay` requiring a minor `_prepareContext` change and the equipped-only weapon filter, both clearly specified. Loses 2 points for: (a) Handlebars has no native CSS grid helper so layout relies entirely on CSS grid working correctly in Foundry's embedded window, and (b) the consequence label strings ("Unconscious", "Incapacitated", etc.) are hardcoded in the template rather than localized — acceptable per "no new localization keys" constraint but worth noting.
