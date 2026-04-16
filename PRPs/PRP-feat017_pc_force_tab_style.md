# PRP-feat017 — Force Tab Restyle

## Goal

Restyle the Force tab on the PC Character Sheet so it visually matches the Attributes & Skills tab conventions: replace all `<table>` elements with flex-based `attr-header` / `skill-list` / `skill-row` rows, and replace the current DSP/FP ad-hoc layout with an `attr-footer` bar. Pure template + CSS change — **no JS, no DataModel, no lang key changes**.

## Why

- The Force tab currently uses `<table>` elements that look inconsistent with the polished flex-row layout used in the Attributes & Skills tab.
- Phase 9 "Sheet Polish" is the right time to unify visual conventions.
- All backend data and JS actions (toggleKeptUp, rollForceSkill, addDarkSidePoint, deleteItem, etc.) were already implemented in feat011/feat012 and are untouched.

## What

### Section-by-section target layout (top to bottom inside the Force tab `<section>`):

1. **Force Skills** — three `attr-column-block` / `attr-header` rows (one per skill: Control, Sense, Alter). Each row has: roll button (left), skill name, editable die-code `ND+P` inputs. No `<table>`.

2. **Force Powers** — a heading (`<h3>`) followed by a `<ul class="skill-list">` where each power is a `<li class="skill-row item-row" data-item-id="...">`. Columns: name (flex-grow), control/sense/alter difficulty cells, keptUp toggle button, dark-side warning badge, delete button. Replaces `<table class="force-powers-table">`.

3. **Kept-Up Powers** — section heading + penalty note (if `forceData.keepUpPenalty` truthy) + `<ul class="skill-list">` for both `keptUpPowerItems` and `keptUpPowers`. Replaces `<ul class="kept-up-powers-list">`.

4. **DSP / Force Points footer** — `<div class="attr-footer">` with `attr-footer-group` children:
   - DSP current value (read-only `derived-value` span) + "Add DSP" button
   - DSP roll-bonus (if `forceData.forceRollBonus` is non-zero)
   - Force Points remaining (read-only `derived-value` span — NOT an input, to avoid duplicate edit surface with the Attributes tab)

Section order: Force Skills → Force Powers → Kept-Up Powers → DSP / Force Points footer.

### Success Criteria

- [ ] Force Skills section renders as three `attr-header` flex rows (roll button, name, ND+P inputs) — no `<table class="force-skills-table">`
- [ ] Force Powers section renders as a `skill-list` `<ul>` with `skill-row` `<li>` items — no `<table class="force-powers-table">`
- [ ] Each Force Power row shows: name, control/sense/alter difficulty, keptUp toggle, dark-side badge (if `darkSideWarning`), delete button
- [ ] Double-click on a power row opens the item sheet (existing `_onRender` dblclick handler fires via `data-item-id`)
- [ ] Kept-Up Powers renders as a `skill-list` with penalty note preserved
- [ ] DSP / Force Points footer uses `attr-footer` / `attr-footer-group` layout with read-only Force Points display
- [ ] `keep-up-penalty-note` paragraph remains visible when `forceData.keepUpPenalty` is truthy
- [ ] `dsp-warning-badge` renders on powers with `power.darkSideWarning === true`
- [ ] No new CSS classes needed beyond minor Force-specific overrides (if any)
- [ ] All existing unit tests pass (`npm test`)
- [ ] `doc/implementation-plan.md` updated to mark feat017 (Phase 9) complete

---

## All Needed Context

### Documentation & References

```yaml
- file: templates/actors/character-sheet.hbs (lines 40–103)
  why: PRIMARY REFERENCE. The Attributes & Skills tab is the exact visual target.
       attr-skills-grid, attr-column-block, attr-header, attr-roll-btn, attr-name,
       attr-dice, attr-dice-input, attr-pips-input, skill-list, skill-row, skill-name,
       skill-roll-btn, item-delete, attr-footer, attr-footer-group, stat-input.
       All these classes already exist in the CSS — reuse them.

- file: templates/actors/character-sheet.hbs (lines 323–454)
  why: CURRENT Force tab. This is the source to be replaced.
       Current state:
         - Force Skills: <table class="force-skills-table"> (REPLACE with attr-header rows)
         - DSP section: <div class="force-dsp"> (MOVE to attr-footer at bottom)
         - Force Powers: <table class="force-powers-table"> (REPLACE with skill-list ul)
         - Kept-Up Powers: <ul class="kept-up-powers-list"> (REPLACE with skill-list ul)
       The {{#if system.forceSensitive}} outer guard stays unchanged.

- file: styles/starwarsd6.css (lines 80–211)
  why: All CSS classes already defined. Key ones to reuse:
       .attr-header { display:flex; align-items:baseline; gap:6px; border-bottom:2px solid #2a2a2a }
       .attr-roll-btn — dice roll button, no background/border
       .attr-name — font-weight:900; text-transform:uppercase
       .attr-dice / .attr-dice-input / .attr-pips-input — editable ND+P inputs
       .skill-list { list-style:none; margin:0; padding:0 }
       .skill-row { display:flex; align-items:center; gap:4px; border-bottom:1px dotted #ddd }
       .skill-name { flex:1 }
       .attr-footer { display:flex; flex-wrap:wrap; gap:0.5em 1.5em; border-top:2px solid #2a2a2a }
       .attr-footer-group { display:flex; align-items:center; gap:5px }
       .equip-toggle / .equip-toggle.equipped — already styled for toggle buttons
       .item-delete — already styled (red ✕ button)
       .no-items — italic grey placeholder text
       .derived-value — used in existing DSP display (span showing a computed value)

- file: modules/apps/character-sheet.mjs (lines 51–129)
  why: _prepareContext() reveals the exact forceData shape. Key fields:
       forceData.skills — object with keys control/sense/alter, each having:
         { key, label, dice, pips, dicePool (from system.forceSkills) }
         NOTE: iterate Object.values(forceData.skills) or use each on a skills array.
         CURRENT template uses {{#each forceData.skills as |skill|}} — but forceData.skills
         is a plain object (keys: control/sense/alter), not an array.
         Handlebars {{#each}} on a plain object iterates values — this works.
       forceData.forcePowers — array of { id, name, controlDifficulty, senseDifficulty,
         alterDifficulty, canKeepUp, keptUp, darkSideWarning }
       forceData.keptUpPowerItems — array of { id, name } (kept-up forcePower items)
       forceData.keptUpPowers — array of { name, index } (legacy text entries)
       forceData.dsp — current darkSidePoints value (number)
       forceData.forceRollBonus — { bonusDice, bonusPips }
       forceData.keepUpPenalty — number

- file: modules/apps/character-sheet.mjs (lines 10–29)
  why: DEFAULT_OPTIONS.actions confirms all needed actions are registered:
       rollForceSkill, addDarkSidePoint, toggleKeptUp, deleteItem,
       addKeptUpPower, removeKeptUpPower — ALL already exist.

- file: lang/en.json (lines 136–162)
  why: All needed localization keys already exist:
       STARWARSD6.Force.Skills, STARWARSD6.Force.DarkSide, STARWARSD6.Force.AddDSP,
       STARWARSD6.Force.DSPBonus, STARWARSD6.Force.KeptUpPowers,
       STARWARSD6.Force.KeepUpPenaltyNote, STARWARSD6.Force.Skill.control/sense/alter,
       STARWARSD6.ForcePower.Label, STARWARSD6.ForcePower.CanKeepUp,
       STARWARSD6.ForcePower.KeptUp, STARWARSD6.ForcePower.DarkSide,
       STARWARSD6.ForcePower.DarkSideWarningBadge,
       STARWARSD6.Character.ForcePoints, STARWARSD6.Character.DarkSidePoints.
       DO NOT add new keys unless an entirely new UI element is introduced.

- file: doc/rules-reference.md
  why: Authoritative rules for Force skills, DSP mechanics, Force Points, keep-up penalty.
       Consult before making any label or layout decisions.

- file: doc/implementation-plan.md
  why: Must update Phase 9 description to mark feat017 complete after implementation.
```

### Current Force Tab (source to replace — lines 323–454 of character-sheet.hbs)

```hbs
{{!-- FORCE TAB --}}
{{#if system.forceSensitive}}
<section class="tab ..." data-tab="force" data-group="primary">

  {{!-- Force Skills --}}
  <h3>{{localize "STARWARSD6.Force.Skills"}}</h3>
  <table class="force-skills-table">          ← REPLACE with attr-column-block / attr-header rows
    <thead>
      <tr><th>Name</th><th>Dice</th><th>Pips</th><th>Roll</th></tr>
    </thead>
    <tbody>
      {{#each forceData.skills as |skill|}}
      <tr>
        <td>{{skill.label}}</td>
        <td><input name="system.forceSkills.{{skill.key}}.dice" .../></td>
        <td><input name="system.forceSkills.{{skill.key}}.pips" .../></td>
        <td><button data-action="rollForceSkill" .../></td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  {{!-- Dark Side Points --}}
  <h3>...</h3>                                ← MOVE to attr-footer at bottom
  <div class="force-dsp">
    <div class="form-group">
      <label>DSP</label>
      <span class="derived-value">{{forceData.dsp}}</span>
      <button data-action="addDarkSidePoint">Add DSP</button>
    </div>
    {{#if forceData.forceRollBonus}}
    <div class="form-group">DSP Bonus</div>
    {{/if}}
  </div>

  {{!-- Force Powers --}}
  <h3>{{localize "STARWARSD6.ForcePower.Label"}}</h3>
  {{#if forceData.forcePowers.length}}
  <table class="force-powers-table">          ← REPLACE with skill-list ul
    ...
  </table>
  {{/if}}

  {{!-- Kept-Up Powers --}}
  <h3>{{localize "STARWARSD6.Force.KeptUpPowers"}}</h3>
  {{#if forceData.keepUpPenalty}}
  <p class="keep-up-penalty-note">...</p>
  {{/if}}
  <ul class="kept-up-powers-list">            ← REPLACE with skill-list ul
    ...
  </ul>

</section>
{{/if}}
```

### Target Force Tab (pseudocode — complete structural blueprint)

```hbs
{{!-- FORCE TAB --}}
{{#if system.forceSensitive}}
<section class="tab ..." data-tab="force" data-group="primary">

  {{!-- 1. FORCE SKILLS — attr-header pattern, one block per skill --}}
  <div class="attr-skills-grid force-skills-grid">
    {{#each forceData.skills as |skill|}}
    <div class="attr-column-block">
      <div class="attr-header">
        <button type="button" class="attr-roll-btn" data-action="rollForceSkill"
                data-skill-key="{{skill.key}}"
                title="{{localize 'STARWARSD6.Roll.Label'}}">
          <i class="fas fa-dice-d6"></i>
        </button>
        <span class="attr-name">{{skill.label}}</span>
        <span class="attr-dice">
          <input type="number" name="system.forceSkills.{{skill.key}}.dice"
                 value="{{skill.dice}}" min="0" class="attr-dice-input" />D+<input
                 type="number" name="system.forceSkills.{{skill.key}}.pips"
                 value="{{skill.pips}}" min="0" max="2" class="attr-pips-input" />
        </span>
      </div>
    </div>
    {{/each}}
  </div>

  {{!-- 2. FORCE POWERS — skill-list pattern --}}
  <h3>{{localize "STARWARSD6.ForcePower.Label"}}</h3>
  {{#if forceData.forcePowers.length}}
  <ul class="skill-list force-powers-list">
    {{#each forceData.forcePowers as |power|}}
    <li class="skill-row item-row" data-item-id="{{power.id}}">
      <span class="skill-name">{{power.name}}</span>
      <span class="fp-col fp-col-ctrl">{{power.controlDifficulty}}</span>
      <span class="fp-col fp-col-sense">{{power.senseDifficulty}}</span>
      <span class="fp-col fp-col-alter">{{power.alterDifficulty}}</span>
      {{#if power.darkSideWarning}}
      <span class="dsp-warning-badge" title="{{localize 'STARWARSD6.ForcePower.DarkSideWarningBadge'}}">⚠</span>
      {{/if}}
      <button type="button"
              class="equip-toggle {{#if power.keptUp}}equipped{{/if}}"
              data-action="toggleKeptUp"
              data-item-id="{{power.id}}"
              title="{{localize 'STARWARSD6.ForcePower.KeptUp'}}">
        {{#if power.keptUp}}✓{{else}}○{{/if}}
      </button>
      <button type="button" class="item-delete" data-action="deleteItem"
              data-item-id="{{power.id}}" title="Delete">✕</button>
    </li>
    {{/each}}
  </ul>
  {{else}}
  <p class="no-items">{{localize "STARWARSD6.Inventory.Empty"}}</p>
  {{/if}}

  {{!-- 3. KEPT-UP POWERS — skill-list pattern --}}
  <h3>{{localize "STARWARSD6.Force.KeptUpPowers"}}</h3>
  {{#if forceData.keepUpPenalty}}
  <p class="keep-up-penalty-note">
    {{localize "STARWARSD6.Force.KeepUpPenaltyNote"}}: −{{forceData.keepUpPenalty}}D
  </p>
  {{/if}}
  <ul class="skill-list">
    {{#each forceData.keptUpPowerItems as |power|}}
    <li class="skill-row">
      <span class="skill-name">{{power.name}}</span>
    </li>
    {{/each}}
    {{#each forceData.keptUpPowers as |power|}}
    <li class="skill-row">
      <span class="skill-name">{{power.name}}</span>
      <button type="button" data-action="removeKeptUpPower"
              data-power-index="{{power.index}}"
              title="{{localize 'STARWARSD6.Force.RemovePower'}}">&#10005;</button>
    </li>
    {{/each}}
  </ul>

  {{!-- 4. DSP / FORCE POINTS FOOTER — attr-footer pattern --}}
  <div class="attr-footer">
    <div class="attr-footer-group">
      <label>{{localize "STARWARSD6.Character.DarkSidePoints"}}</label>
      <span class="derived-value">{{forceData.dsp}}</span>
      <button type="button" data-action="addDarkSidePoint"
              title="{{localize 'STARWARSD6.Force.AddDSP'}}">
        {{localize "STARWARSD6.Force.AddDSP"}}
      </button>
    </div>
    {{#if forceData.forceRollBonus}}
    <div class="attr-footer-group">
      <label>{{localize "STARWARSD6.Force.DSPBonus"}}</label>
      <span class="derived-value">
        {{#if forceData.forceRollBonus.bonusDice}}+{{forceData.forceRollBonus.bonusDice}}D{{/if}}{{#if forceData.forceRollBonus.bonusPips}}+{{forceData.forceRollBonus.bonusPips}}{{/if}}
        {{#unless forceData.forceRollBonus.bonusDice}}{{#unless forceData.forceRollBonus.bonusPips}}—{{/unless}}{{/unless}}
      </span>
    </div>
    {{/if}}
    <div class="attr-footer-group">
      <label>{{localize "STARWARSD6.Character.ForcePoints"}}</label>
      <span class="derived-value">{{system.forcePoints}}</span>
    </div>
  </div>

</section>
{{/if}}
```

### Codebase State (no new files needed)

```
fvtt-starwarsd6/
├── templates/actors/character-sheet.hbs   ← ONLY FILE TO MODIFY (Force tab section)
├── styles/starwarsd6.css                  ← ADD small Force-specific overrides if needed
├── doc/implementation-plan.md            ← UPDATE Phase 9 to mark complete
└── lang/en.json                          ← NO CHANGES (all keys exist)
```

No new files. No JS changes. No DataModel changes. No new lang keys (unless a label doesn't exist — verify against lang/en.json before adding).

---

## Known Gotchas & Critical Constraints

```js
// CRITICAL: forceData.skills is a plain JS object (keys: control, sense, alter),
// NOT an array. Handlebars {{#each obj as |val|}} iterates the values, yielding
// the three skill objects in insertion order. This is how the CURRENT template works
// and it works correctly — keep using {{#each forceData.skills as |skill|}}.

// CRITICAL: Force Skills section must NOT have an attr-skills-grid with 2 columns
// like the Attributes tab. Force has only 3 skills — use a single-column layout
// (CSS: grid-template-columns: 1fr) or just stack the attr-column-blocks naturally
// (default block layout). Add a class like "force-skills-grid" if needed to override
// the 2-column grid.
// SIMPLEST: wrap with <div class="attr-skills-grid"> and add CSS:
//   .starwarsd6.sheet .force-skills-grid { grid-template-columns: 1fr; }
// OR just skip the grid wrapper and let the blocks stack as block elements.

// CRITICAL: Force Points in the footer must be READ-ONLY (span, not input).
// The editable input is in the Attributes tab footer (system.forcePoints input).
// Use <span class="derived-value">{{system.forcePoints}}</span> — no name attribute.

// CRITICAL: data-item-id on the <li> element is required for the existing
// _onRender dblclick handler to work. Current code:
//   this.element.querySelectorAll("[data-item-id]").forEach(row => {
//     row.addEventListener("dblclick", () => {
//       const item = this.document.items.get(row.dataset.itemId);
//       item?.sheet.render(true);
//     });
//   });
// The toggleKeptUp button inside the row also has data-item-id, but the dblclick
// fires on the <li> itself. The button's data-item-id is used by #toggleKeptUp.
// Both are correctly set to the same power.id — no conflict.

// GOTCHA: The keep-up toggle button also has data-item-id. The dblclick listener
// on the <li> will also fire when the user double-clicks the toggle button,
// opening the item sheet. This is the same behavior as weapons in the inventory tab —
// acceptable UX (matches existing pattern).

// GOTCHA: The forceData.forceRollBonus conditional — in the current template it uses
// {{#if forceData.forceRollBonus}} which is truthy even when both bonusDice and bonusPips
// are 0, because the object always exists. Use the existing pattern of checking
// {{#if forceData.forceRollBonus}} (always true) but showing "—" when both are zero.
// The CURRENT template already handles this correctly — copy it verbatim.

// GOTCHA: The DSP h3 heading moves from being a standalone section mid-tab to the
// label inside the footer. The h3 "Dark Side" heading is REMOVED — the label
// "STARWARSD6.Character.DarkSidePoints" inside the footer-group replaces it.
// This is intentional — the footer is the right place for these summary values.

// GOTCHA: Force Powers difficulty columns — the current table has separate th headers
// (Control / Sense / Alter). In the new skill-list layout, there are no column headers.
// Add small column-label spans at the top OR accept header-less columns for now.
// Per the feature spec: "one <li> per power, showing name, difficulty columns
// (Control / Sense / Alter), kept-up toggle, dark-side warning badge, and a delete button."
// The simplest approach: add difficulty values as small flex-shrink spans in each row
// (they're short text like "Easy", "Moderate", "15"). A thin sub-header row above the
// list is optional — omit it unless visually unclear.

// GOTCHA: The `.attr-skills-grid` CSS has `grid-template-columns: 1fr 1fr` — two columns.
// Force Skills only has 3 items, so using this class unmodified gives an unexpected
// 2-column layout. Either:
//   (a) Don't use attr-skills-grid for force skills — just stack attr-column-blocks
//       as natural block elements (simplest, no new CSS needed), OR
//   (b) Wrap in a div and add `.force-skills-grid { grid-template-columns: 1fr }` CSS.
// Recommended: option (a) — no wrapper grid, let blocks stack naturally.

// GOTCHA: The existing h3 elements ("Force Skills", "Force Powers", "Kept-Up Powers")
// use `<h3>` which Foundry/the system's CSS may or may not style. Check that h3
// renders visibly inside the sheet. If not, use a div with a style class. The current
// template already uses <h3> for these headings (lines 329, 379, 431) — no change needed.

// CRITICAL: Do NOT remove the addKeptUpPower text-input UI (the .kept-up-power-input
// input field and Add Power button). The feature spec says "unchanged in data".
// Check current template for the add-power input — it appears the current template
// does NOT have the add-power input in the provided lines 430–454 (only the list).
// Verify: if there's no add-power input in current template, don't add one.
// Looking at lines 430–454: only the kept-up-powers-list is present; the add form
// is NOT in the current template. Leave as-is (list only).

// CRITICAL: npm test must pass unchanged — this is a template-only change.
// No unit tests cover HBS template rendering (they test JS logic only).
// The only test risk is accidentally breaking something in character-sheet.mjs —
// which is NOT being modified.
```

---

## Implementation Blueprint

### Task 1 — MODIFY `templates/actors/character-sheet.hbs`

Replace the entire Force tab section (lines 323–454: from `{{!-- FORCE TAB --}}` through `{{/if}}` ending at line 454, inclusive of the `</section>` and outer `{{/if}}`).

**Structural changes:**
- Remove `<table class="force-skills-table">` — replace with stacked `attr-column-block` / `attr-header` divs
- Remove `<div class="force-dsp">` and its h3 — replace with `attr-footer` bar at the bottom
- Remove `<table class="force-powers-table">` — replace with `<ul class="skill-list">` / `<li class="skill-row item-row">`
- Replace `<ul class="kept-up-powers-list">` with `<ul class="skill-list">` using `skill-row` items

**Key invariants to preserve:**
- `{{#if system.forceSensitive}}` outer guard — unchanged
- `data-action="rollForceSkill" data-skill-key="{{skill.key}}"` — same attribute names
- `name="system.forceSkills.{{skill.key}}.dice"` and `.pips` inputs — same form bindings
- `data-action="addDarkSidePoint"` — same
- `data-item-id="{{power.id}}"` on both the `<li>` and the toggle/delete buttons — same
- `data-action="toggleKeptUp" data-item-id="{{power.id}}"` — same
- `data-action="deleteItem" data-item-id="{{power.id}}"` — same
- `data-action="removeKeptUpPower" data-power-index="{{power.index}}"` — same
- `class="keep-up-penalty-note"` paragraph — same class name
- `class="dsp-warning-badge"` span — same class name

### Task 2 — MODIFY `styles/starwarsd6.css`

Add Force-specific overrides at the end of the file. Only add what is strictly needed:

```css
/* Force tab — skills stack single column (no 2-col grid) */
/* No new CSS needed if force skills don't use attr-skills-grid wrapper. */

/* Force power row difficulty columns */
.starwarsd6.sheet .fp-col {
  width: 5em;
  text-align: center;
  font-size: 0.85em;
  color: #555;
  flex-shrink: 0;
  white-space: nowrap;
}

/* DSP warning badge */
.starwarsd6.sheet .dsp-warning-badge {
  color: #c60;
  font-size: 0.9em;
  flex-shrink: 0;
}
```

If the `dsp-warning-badge` and `fp-col` classes already have styles elsewhere, do NOT add duplicates — check first with Grep.

### Task 3 — MODIFY `doc/implementation-plan.md`

Update the Phase 9 section to mark feat017 complete. Find:

```
| 9 | Sheet Polish | Tabs, CSS, localization | M | 4 |
```

Replace with:

```
| 9 ✓ | Sheet Polish | Force tab restyle to match Attributes & Skills | M | 4 |
```

And update the Phase 9 description body to reflect that feat017 completes it.

---

## Validation Loop

### Level 1 — Template Structure Check

```bash
# Verify the old table classes are gone from the Force tab
grep -n "force-skills-table\|force-powers-table\|kept-up-powers-list\|force-dsp" \
  templates/actors/character-sheet.hbs \
  && echo "ERROR: old table classes still present" || echo "OK"

# Verify the new structural classes are present
grep -n "attr-header\|skill-list\|attr-footer" \
  templates/actors/character-sheet.hbs \
  && echo "OK: new classes present" || echo "ERROR: new classes missing"

# Verify critical data-action and name attributes are preserved
grep -n "rollForceSkill\|addDarkSidePoint\|toggleKeptUp\|removeKeptUpPower" \
  templates/actors/character-sheet.hbs \
  && echo "OK: actions present" || echo "ERROR: actions missing"

# Verify form input names unchanged
grep -n 'name="system.forceSkills' templates/actors/character-sheet.hbs \
  && echo "OK: input bindings present" || echo "ERROR: input bindings missing"

# Verify data-item-id on force power rows
grep -n 'data-item-id.*power.id' templates/actors/character-sheet.hbs \
  && echo "OK: item-id present" || echo "ERROR"

# Verify keep-up-penalty-note class preserved
grep -n "keep-up-penalty-note" templates/actors/character-sheet.hbs \
  && echo "OK" || echo "ERROR: penalty note class missing"

# Verify dsp-warning-badge preserved
grep -n "dsp-warning-badge" templates/actors/character-sheet.hbs \
  && echo "OK" || echo "ERROR: dsp-warning-badge missing"

# Verify Force Points is read-only (no input with name=system.forcePoints in Force tab)
# (The input should ONLY appear in the attributes tab, not force tab)
# Manual check: search for the Force tab section and confirm no input for forcePoints there
grep -n 'name="system.forcePoints"' templates/actors/character-sheet.hbs
# Expected: exactly ONE match (in the attr-footer of the Attributes tab, lines ~97)
# If two matches exist, the Force tab accidentally added an editable input — fix it
```

### Level 2 — Unit Tests

```bash
npm test
```

Expected: all tests pass unchanged. This is a template-only change; no JS is modified.

If any test fails, it's likely a pre-existing issue unrelated to this change — verify with `git diff modules/` to confirm no JS files were touched.

### Level 3 — Functional Validation (in Foundry, after user deploys)

1. Open a Force-sensitive PC character sheet → Force tab.
2. **Force Skills section**: three rows (Control, Sense, Alter) each with a dice icon button, skill name, and ND+P editable inputs. Visually matches attribute headers in the Attributes tab.
3. **Roll Force Skill**: click the dice icon on one skill → RollDialog opens → roll executes → chat message posted. ✓
4. **Force Powers section**: if character has no forcePower items → "No items" placeholder. Add a forcePower item → row appears with name, difficulty columns, toggle, badge (if dark side), delete button.
5. **keptUp toggle**: click toggle button → power updates → toggle changes appearance. ✓
6. **Dark side badge**: forcePower with darkSideWarning=true → ⚠ badge visible in row. ✓
7. **Double-click power row** → forcePower item sheet opens. ✓
8. **Delete button** → power removed from list. ✓
9. **Kept-Up Powers section**: kept-up powers (both item-based and legacy text) appear as simple rows. Penalty note visible when keepUpPenalty > 0.
10. **DSP / Force Points footer**: bar at bottom shows DSP count + Add DSP button + bonus (if non-zero) + Force Points (read-only number). Clicking "Add DSP" increments DSP. ✓
11. **Attributes tab unaffected**: navigate to Attributes tab — forcePoints input still editable there. ✓
12. **Non-force-sensitive character**: Force tab not shown in tab bar. ✓

---

## Final Validation Checklist

- [ ] `grep "force-skills-table\|force-powers-table\|kept-up-powers-list" templates/actors/character-sheet.hbs` — NO matches
- [ ] `grep "attr-header\|skill-list\|attr-footer" templates/actors/character-sheet.hbs` — matches present in Force tab
- [ ] `grep "rollForceSkill\|toggleKeptUp\|addDarkSidePoint\|removeKeptUpPower" templates/actors/character-sheet.hbs` — all present
- [ ] `grep -c 'name="system.forcePoints"' templates/actors/character-sheet.hbs` — output is `1` (Attributes tab only)
- [ ] `grep "keep-up-penalty-note\|dsp-warning-badge" templates/actors/character-sheet.hbs` — both present
- [ ] `npm test` — exits 0, all tests pass
- [ ] `doc/implementation-plan.md` — Phase 9 marked ✓

---

## Anti-Patterns to Avoid

- **Do not** touch `modules/apps/character-sheet.mjs` — all JS is already correct
- **Do not** touch `modules/actors/character-data.mjs` — DataModel unchanged
- **Do not** touch `lang/en.json` unless a label genuinely doesn't exist (verify first)
- **Do not** add a second editable input for `system.forcePoints` in the Force tab
- **Do not** remove `data-item-id` from force power `<li>` elements — breaks dblclick to open sheet
- **Do not** use `mergeObject`, `getData()`, or deprecated v13 APIs — not applicable here but check any helper additions
- **Do not** run `deploy.sh` — user deploys manually
- **Do not** create new test files — template changes have no unit test surface

---

## Confidence Score: 9/10

**Strong foundations:**
- All JS actions, context data, and lang keys are already in place from feat011/feat012.
- All target CSS classes exist and are well-defined — this is purely a structural template restyle.
- The target visual pattern (attr-header / skill-list / attr-footer) is already proven working in the Attributes tab.
- No data-model changes, no new files, no new JS.

**Deductions:**
- **-1**: The Force Skills section layout requires careful attention to the `attr-skills-grid` 2-column CSS — using the grid wrapper without an override would misplace the 3 skill blocks into 2 columns. The gotcha notes cover this but the agent must actively decide and implement the single-column approach.
