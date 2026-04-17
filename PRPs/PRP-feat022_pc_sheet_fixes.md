# PRP-feat022 — PC Character Sheet Minor Fixes

## Goal

Five targeted layout/data changes to the PC character sheet. One DataModel addition (`system.notes`), the rest are pure template + CSS edits.

## Why

- Bio tab lacks a notes field present on the NPC sheet — players have nowhere to record freeform notes
- Move value and Force Sensitive checkbox are on the wrong tabs for their conceptual home
- Combat tab uses `<table>` while the rest of the UI uses flex lists — visual inconsistency
- Force tab footer has DSP before Force Points — players use Force Points more often

## What

1. **Bio tab — Notes textarea** bound to `system.notes` (new DataModel field)
2. **Move value** removed from Attributes tab footer; added to Combat tab above the Weapons heading
3. **Force Sensitive checkbox** removed from Attributes tab footer; added inline on Bio tab next to Character Type
4. **Combat tab weapons section** restyled from `<table class="combat-weapons-table">` to flex `inv-section-header` + `ul.inv-list > li.inv-row` pattern (matching Inventory tab)
5. **Force tab footer** — swap order: Force Points group first, DSP group second (DSP roll-bonus stays adjacent to DSP)

### Success Criteria

- [ ] `system.notes` persists on PC actors (DataModel field added)
- [ ] Bio tab shows Notes textarea at bottom, Force Sensitive inline with Character Type row
- [ ] Attributes tab footer has NO Move or Force Sensitive fields
- [ ] Combat tab shows Move value above Weapons section; weapons list uses inv-list/inv-row flex pattern (no `<table>`)
- [ ] Force tab footer shows Force Points first, then DSP counter + Add DSP button
- [ ] All existing data bindings (`combatData.*`, `system.*`, `data-action`, `data-weapon-id`, `data-tier`) preserved
- [ ] `npm test` passes with no regressions

---

## All Needed Context

### Files to Read Before Implementing

```yaml
- file: modules/actors/character-data.mjs
  why: >
    Add `notes: new StringField(...)` to defineSchema(). Pattern mirrors
    npc-data.mjs line 30: `notes: new StringField({ required: true, nullable: false, initial: "" })`
    CRITICAL: `system.notes` does NOT currently exist — this is the only JS change needed.

- file: templates/actors/character-sheet.hbs
  why: Primary file for all 5 HTML changes. Full current state:
    - Bio tab: lines 36–96 (add notes + forceSensitive, remove forceSensitive from attributes footer)
    - Attributes footer: lines 144–189 (remove Move input + Force Sensitive group)
    - Combat tab: lines 294–407 (add Move display above h3, restyle weapons table → inv-list)
    - Force tab footer: lines 501–528 (swap DSP group and Force Points group order)

- file: templates/actors/npc-sheet.hbs lines 158–164
  why: Pattern for notes textarea in a form-group wrapper

- file: styles/starwarsd6.css lines 258–424
  why: inv-section-header, inv-list, inv-row, inv-col-* classes already defined — reuse them for Combat weapons

- file: lang/en.json
  why: >
    `STARWARSD6.Attribute.Move` exists (line 14). `STARWARSD6.Character.ForceSensitive` exists (line 25).
    `STARWARSD6.NPC.Notes` = "Notes" exists (line 134) — reuse for Bio tab notes label.
    NO new lang keys needed unless you want a `STARWARSD6.Bio.Notes` key — check first.
    VERDICT: Reuse `STARWARSD6.NPC.Notes` OR add `STARWARSD6.Bio.Notes: "Notes"` (preferred for namespace clarity).

- file: PRPs/feats/feat016-pc-combat-tab-style.md
  why: Background on combatData.* bindings and which data-action attributes must survive the restyle

- file: PRPs/feats/feat017-pc-force-tab-style.md (swd6fvtt collection)
  why: Describes the attr-footer structure for Force tab — DSP / Force Points order reference
```

### Current Template State (condensed)

**Attributes tab footer** (lines 144–189) — currently contains:
```hbs
<div class="attr-footer">
  <div class="attr-footer-group">          ← REMOVE: Move input
    <label>{{localize "STARWARSD6.Attribute.Move"}}</label>
    <input type="number" name="system.move" .../>
  </div>
  <div class="attr-footer-group">          ← REMOVE: Force Sensitive checkbox
    <label>{{localize "STARWARSD6.Character.ForceSensitive"}}</label>
    <input type="checkbox" name="system.forceSensitive" .../>
  </div>
  <div class="attr-footer-group counter-group"> ← KEEP: Character Points
  ...
  <div class="attr-footer-group counter-group"> ← KEEP: Force Points
  ...
  <div class="attr-footer-group counter-group"> ← KEEP: Dark Side Points
  ...
</div>
```

**Bio tab Character Type row** (lines 52–57):
```hbs
<div class="bio-row">
  <label class="bio-label">{{localize "STARWARSD6.Bio.CharacterType"}}</label>
  <input type="text" name="system.characterType" value="{{system.characterType}}" class="bio-input" />
</div>
```
→ Add Force Sensitive inline after Character Type input (same `bio-row`, new inline span).

**Combat tab weapons** (lines 298–329) — currently `<table class="combat-weapons-table">`:
```hbs
<h3>{{localize "STARWARSD6.Combat.Weapons"}}</h3>
{{#if combatData.weapons.length}}
<table class="combat-weapons-table">
  <thead><tr><th>Name</th><th>Damage</th><th>Skill</th><th>Roll</th></tr></thead>
  <tbody>
    {{#each combatData.weapons as |weapon|}}
    {{#if weapon.equipped}}
    <tr>
      <td>{{weapon.name}}</td>
      <td>{{weapon.damageDice}}D{{...}}</td>
      <td>{{weapon.attackSkillDisplay}}</td>
      <td><button data-action="rollAttack" data-weapon-id="{{weapon.id}}">Roll</button></td>
    </tr>
    {{/if}}
    {{/each}}
  </tbody>
</table>
```

**Force tab footer** (lines 501–528) — currently DSP first, Force Points last:
```hbs
<div class="attr-footer">
  <div class="attr-footer-group counter-group"> ← DSP (currently first)
    <div class="counter-row">
      <div class="counter-circle">{{forceData.dsp}}</div>
      <button data-action="addDarkSidePoint">+</button>
    </div>
    <label>Dark Side Points</label>
  </div>
  {{#if forceData.forceRollBonus}} ← DSP roll bonus (stays adjacent to DSP)
  <div class="attr-footer-group">...</div>
  {{/if}}
  <div class="attr-footer-group counter-group counter-group--readonly"> ← Force Points (currently last)
    <div class="counter-row"><div class="counter-circle">{{system.forcePoints}}</div></div>
    <label>Force Points</label>
  </div>
</div>
```

### CSS Classes Already Available (no new classes needed)

From `styles/starwarsd6.css`:
- `.inv-section-header` — flex header row with column labels (line 259)
- `.inv-list` — `<ul>` list container (line 291)
- `.inv-row` — `<li>` flex row (line 297)
- `.inv-col-damage`, `.inv-col-skill`, `.inv-col-range` — column widths (line 258+)
- `.inv-col-delete` — delete button column
- `.attr-footer`, `.attr-footer-group` — footer row pattern (lines 182–196)
- `.derived-value` — read-only derived display span
- `.bio-row`, `.bio-label`, `.bio-input`, `.bio-textarea` — bio tab form patterns
- `.form-group` — generic form group wrapper

### Known Gotchas

```
CRITICAL: system.notes does not exist on CharacterData — must add StringField before the template will bind.
         Pattern: npc-data.mjs line 30 — `notes: new StringField({ required: true, nullable: false, initial: "" })`

CRITICAL: system.move is a READ-ONLY derived value in combat context. Display as:
         <span class="derived-value">{{system.move}}</span>
         NOT as <input type="number" name="system.move">
         The attributes footer uses an input (editable), but combat display is read-only.
         HOWEVER: Looking at character-data.mjs, `move` is a plain NumberField (not derived),
         so it IS editable. Feature spec says "derived read-only" for combat context display.
         Display as <span class="derived-value"> in Combat tab, keep input in Attributes footer... 
         WAIT: feature spec says REMOVE from Attributes footer and ADD to Combat tab.
         So: remove the input from attributes footer entirely; show read-only span in combat tab.

CRITICAL: Force Sensitive checkbox controls whether Force tab appears (line 28–33 of template):
         {{#if system.forceSensitive}} → Force tab nav + Force section
         Moving it to Bio tab does NOT change this logic — the checkbox just moves location.
         Binding stays: name="system.forceSensitive"

CRITICAL: Combat tab weapons — when restyling to inv-list, preserve:
         data-action="rollAttack" and data-weapon-id="{{weapon.id}}" on the roll button.
         The {{#if weapon.equipped}} filter MUST remain (only equipped weapons in combat tab).

CRITICAL: Force tab footer swap — the {{#if forceData.forceRollBonus}} block is a CONDITIONAL
         group that must stay adjacent to DSP. Order after swap:
         1. Force Points group (readonly counter)
         2. DSP counter group (with Add DSP button)
         3. DSP roll bonus group (conditional, only if forceData.forceRollBonus)

GOTCHA: The Move field in Attributes footer uses an editable input. After moving to Combat tab
        as read-only display, the value won't be editable from the sheet at all. This is by design
        per the feature spec — Move is derived from STR and displayed read-only in combat context.
        BUT: character-data.mjs shows move is a plain NumberField (not derived from STR).
        The spec says "derived read-only" for display purposes only. Treat as display-only in combat.

GOTCHA: No new localization key needed for Notes if you reuse "STARWARSD6.NPC.Notes".
        Alternatively add "STARWARSD6.Bio.Notes": "Notes" to lang/en.json (cleaner namespace).
        Either approach is valid — add new key to keep namespaces clean.
```

---

## Implementation Blueprint

### Task ordering

```yaml
Task 1 — MODIFY modules/actors/character-data.mjs:
  - FIND: `description: new StringField({ required: false, initial: "" }),`
  - ADD AFTER: `notes: new StringField({ required: false, initial: "" }),`
  - WHY: system.notes must exist in DataModel before template can bind to it

Task 2 — MODIFY lang/en.json:
  - FIND: `"STARWARSD6.Bio.Description": "Physical Description"`
  - ADD AFTER: `"STARWARSD6.Bio.Notes": "Notes"`
  - WHY: Clean namespace; avoids reusing NPC-namespaced key

Task 3 — MODIFY templates/actors/character-sheet.hbs — Bio tab:
  3a. Force Sensitive inline with Character Type:
      - FIND the `<div class="bio-row">` containing `system.characterType` input
      - ADD after the input, still inside the same bio-row div:
        ```hbs
        <span class="bio-inline-group">
          <label class="bio-label">{{localize "STARWARSD6.Character.ForceSensitive"}}</label>
          <input type="checkbox" name="system.forceSensitive"
                 {{#if system.forceSensitive}}checked{{/if}} />
        </span>
        ```
  3b. Notes textarea at bottom of Bio tab:
      - FIND: `</div>{{!-- .bio-layout --}}`
      - ADD BEFORE the closing `</section>`:
        ```hbs
        <div class="bio-row bio-row--description">
          <label class="bio-label">{{localize "STARWARSD6.Bio.Notes"}}</label>
          <textarea name="system.notes"
                    class="bio-textarea">{{system.notes}}</textarea>
        </div>
        ```
      - Place INSIDE `.bio-fields` div, after the description row

Task 4 — MODIFY templates/actors/character-sheet.hbs — Attributes tab footer:
  - REMOVE the entire `<div class="attr-footer-group">` block for Move (label + input)
  - REMOVE the entire `<div class="attr-footer-group">` block for Force Sensitive (label + checkbox)
  - KEEP: characterPoints, forcePoints, darkSidePoints counter groups

Task 5 — MODIFY templates/actors/character-sheet.hbs — Combat tab:
  5a. Add Move display above weapons section:
      - FIND: `<h3>{{localize "STARWARSD6.Combat.Weapons"}}</h3>`
      - ADD BEFORE that h3:
        ```hbs
        <div class="attr-footer-group">
          <label>{{localize "STARWARSD6.Attribute.Move"}}</label>
          <span class="derived-value">{{system.move}}</span>
        </div>
        ```
  5b. Restyle weapons table to inv-list pattern:
      - REPLACE entire `<table class="combat-weapons-table">...</table>` block with:
        ```hbs
        <div class="inv-section-header">
          <span class="inv-section-name">{{localize "STARWARSD6.Skill.Name"}}</span>
          <span class="inv-col-label inv-col-damage">{{localize "STARWARSD6.Item.Weapon.Damage"}}</span>
          <span class="inv-col-label inv-col-skill">{{localize "STARWARSD6.Item.Weapon.AttackSkill"}}</span>
          <span class="inv-col-delete"></span>
        </div>
        <ul class="inv-list">
          {{#each combatData.weapons as |weapon|}}
          {{#if weapon.equipped}}
          <li class="inv-row item-row" data-item-id="{{weapon.id}}">
            <span class="inv-name">{{weapon.name}}</span>
            <span class="inv-col-damage">{{weapon.damageDice}}D{{#if weapon.damagePips}}+{{weapon.damagePips}}{{/if}}</span>
            <span class="inv-col-skill">{{weapon.attackSkillDisplay}}</span>
            <span class="inv-col-delete">
              <button type="button" data-action="rollAttack" data-weapon-id="{{weapon.id}}">
                {{localize "STARWARSD6.Combat.Roll"}}
              </button>
            </span>
          </li>
          {{/if}}
          {{/each}}
        </ul>
        ```
      - KEEP the `{{else}}<p class="no-items">...` block unchanged

Task 6 — MODIFY templates/actors/character-sheet.hbs — Force tab footer:
  - FIND the `<div class="attr-footer">` block in the Force tab (line ~501)
  - REORDER: move the `counter-group--readonly` Force Points block to FIRST position
  - Keep DSP counter group SECOND
  - Keep `{{#if forceData.forceRollBonus}}` block AFTER DSP (third position)
  - New order:
    ```hbs
    <div class="attr-footer">
      {{!-- 1. Force Points (read-only, moved first) --}}
      <div class="attr-footer-group counter-group counter-group--readonly">
        <div class="counter-row">
          <div class="counter-circle">{{system.forcePoints}}</div>
        </div>
        <label>{{localize "STARWARSD6.Character.ForcePoints"}}</label>
      </div>
      {{!-- 2. DSP counter --}}
      <div class="attr-footer-group counter-group">
        <div class="counter-row">
          <div class="counter-circle">{{forceData.dsp}}</div>
          <button type="button" class="counter-btn" data-action="addDarkSidePoint"
                  title="{{localize 'STARWARSD6.Force.AddDSP'}}">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <label>{{localize "STARWARSD6.Character.DarkSidePoints"}}</label>
      </div>
      {{!-- 3. DSP roll bonus (conditional, stays adjacent to DSP) --}}
      {{#if forceData.forceRollBonus}}
      <div class="attr-footer-group">
        <label>{{localize "STARWARSD6.Force.DSPBonus"}}</label>
        <span class="derived-value">
          {{#if forceData.forceRollBonus.bonusDice}}+{{forceData.forceRollBonus.bonusDice}}D{{/if}}{{#if forceData.forceRollBonus.bonusPips}}+{{forceData.forceRollBonus.bonusPips}}{{/if}}
          {{#unless forceData.forceRollBonus.bonusDice}}{{#unless forceData.forceRollBonus.bonusPips}}—{{/unless}}{{/unless}}
        </span>
      </div>
      {{/if}}
    </div>
    ```

Task 7 — VERIFY styles/starwarsd6.css:
  - No new CSS classes needed for Tasks 3–6 (all reuse existing classes)
  - If `.bio-row` doesn't support inline checkbox layout, add:
    ```css
    .starwarsd6.sheet .bio-row .bio-inline-group {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-left: 1em;
    }
    ```
    Scope under `.starwarsd6.sheet` always.
  - The `attr-footer-group` used standalone (without attr-footer wrapper) for Move in combat
    may need a small margin. Add only if visually broken:
    ```css
    .starwarsd6.sheet [data-tab="combat"] .attr-footer-group {
      margin-bottom: 0.5em;
    }
    ```

Task 8 — RUN TESTS and verify:
  - npm test — all existing tests must pass
  - No unit test surface for template-only changes; confirm DataModel field addition doesn't break
    existing character actor tests if any test CharacterData schema
```

---

## Validation Gates

```bash
# 1. Syntax check — no build step, so just verify JS parses
node --input-type=module < modules/actors/character-data.mjs 2>&1 || echo "SYNTAX ERROR"

# 2. Run all tests
npm test

# 3. Verify lang key added
grep -n "Bio.Notes" lang/en.json

# 4. Verify system.notes in DataModel
grep -n "notes" modules/actors/character-data.mjs

# 5. Verify Force Sensitive removed from attributes footer
grep -n "forceSensitive" templates/actors/character-sheet.hbs
# Expected: exactly 2 occurrences:
#   1. The {{#if system.forceSensitive}} nav guard (line ~28)
#   2. The new Bio tab inline checkbox
# NOT in the attr-footer block

# 6. Verify no combat-weapons-table remains
grep -n "combat-weapons-table" templates/actors/character-sheet.hbs
# Expected: 0 matches (class moved to CSS only or removed)

# 7. Verify Move removed from attributes footer
grep -n "system\.move" templates/actors/character-sheet.hbs
# Expected: exactly 1 match — the new combat tab display span

# 8. Verify data-action="rollAttack" preserved in combat tab
grep -n 'data-action="rollAttack"' templates/actors/character-sheet.hbs
# Expected: ≥1 match inside the {{#each combatData.weapons}} block

# 9. Verify data-action="markHitBox" unchanged
grep -n 'data-action="markHitBox"' templates/actors/character-sheet.hbs
# Expected: 4 matches (stun/wound/incap/mortal)
```

---

## Final Validation Checklist

- [ ] `npm test` passes
- [ ] `system.notes` field added to `character-data.mjs` `defineSchema()`
- [ ] `STARWARSD6.Bio.Notes` key added to `lang/en.json`
- [ ] Bio tab: Force Sensitive checkbox inline with Character Type
- [ ] Bio tab: Notes textarea at bottom bound to `system.notes`
- [ ] Attributes footer: Move input REMOVED
- [ ] Attributes footer: Force Sensitive REMOVED
- [ ] Combat tab: Move displayed as `<span class="derived-value">` above Weapons section
- [ ] Combat tab: Weapons use `inv-section-header` + `ul.inv-list > li.inv-row` (no `<table>`)
- [ ] Combat tab: `data-action="rollAttack"` and `data-weapon-id` preserved on roll buttons
- [ ] Combat tab: `data-action="markHitBox"` and `data-tier` preserved on all hit box buttons
- [ ] Force tab footer: Force Points group is FIRST, DSP group is SECOND
- [ ] Force tab footer: DSP roll-bonus block remains adjacent to DSP (third, conditional)
- [ ] No new CSS classes added unless strictly required
- [ ] All CSS rules scoped under `.starwarsd6.sheet`
- [ ] `doc/implementation-plan.md` updated to mark feat022 complete

---

## Anti-Patterns to Avoid

- Do NOT use `<table>` for the combat weapons list — use inv-list/inv-row flex pattern
- Do NOT make `system.move` an editable input in the Combat tab — display-only span
- Do NOT remove `{{#if system.forceSensitive}}` nav guard at top of template (line ~28)
- Do NOT add `data-action` or `data-item-id` to combat weapon rows unless double-click-to-edit is desired (not in scope)
- Do NOT run `deploy.sh` — user deploys manually
- Do NOT add new CSS classes unless existing ones fail — reuse inv-*, attr-footer-*, bio-* classes
- Do NOT skip the DataModel change — template binding to `system.notes` silently fails without it
