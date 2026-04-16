# PRP-feat019 — Character Sheet Footer Circle Counters

## Goal

Replace plain `<input type="number">` controls for **Character Points**, **Force Points**, and **Dark Side Points** in both the Attributes & Skills tab footer and the Force tab footer with a large circle counter design (number centred inside a CSS circle, flanked by `+`/`−` icon buttons). Pure template + CSS + minimal JS handler change. No DataModel changes.

## Why

- Current plain number inputs look unpolished; the reference design (`doc/ref/old_footer_ref.png`) shows large bold circles per counter, matching physical Star Wars D6 character sheets.
- Force tab DSP/FP footer was implemented in feat017 with the `attr-footer` pattern; this feat upgrades the visual treatment to match the circle design.
- Character Points, Force Points, and Dark Side Points are the three main tracking currencies during play — a clear visual counter improves usability.

## What

### Attributes & Skills Tab Footer (lines 82–103 of `templates/actors/character-sheet.hbs`)

**Leave unchanged:** Move, Force Sensitive.

**Replace for CP, FP, DSP:**
- Remove `<input type="number">` for each.
- Add a big circle (`<div class="counter-circle">`) with the numeric value centred inside.
- Add `−` button (icon `<i class="fas fa-minus">`) to the left of the circle; `+` button (icon `<i class="fas fa-plus">`) to the right.
- Label below the circle group.
- Buttons call new `data-action` handlers: `incrementStat` / `decrementStat` with a `data-field` attribute naming the `system.*` path.

**Layout per counter group:**
```
[−]  ( N )  [+]
  Label
```

### Force Tab Footer (lines 413–435 of `templates/actors/character-sheet.hbs`)

**DSP group:**
- Remove `<span class="derived-value">{{forceData.dsp}}</span>` + full-text button.
- Add circle (`<div class="counter-circle">{{forceData.dsp}}</div>`) with a small `+` icon button using the existing `data-action="addDarkSidePoint"` handler. No `−` button (DSP only increments via game mechanic).
- No new handler needed.

**Force Points group:**
- Remove `<span class="derived-value">{{system.forcePoints}}</span>`.
- Add circle (`<div class="counter-circle">{{system.forcePoints}}</div>`).
- No `+`/`−` buttons. Wrap in `<div class="counter-group counter-group--readonly">` with `pointer-events: none`.

**DSP Penalty block:** keep exactly as-is.

### Success Criteria

- [ ] Attributes tab: CP, FP, DSP each render as a large circle with number centred; `+`/`−` icon buttons flank it; label below
- [ ] Clicking `+` on CP increments `system.characterPoints` via `actor.update()`; `−` decrements (floor 0)
- [ ] Same for FP and DSP via `incrementStat`/`decrementStat` handlers
- [ ] Force tab: DSP renders as circle with `+` icon button using existing `addDarkSidePoint` handler
- [ ] Force tab: FP renders as read-only circle (no `+`/`−`, `pointer-events: none`)
- [ ] DSP penalty block (`forceData.forceRollBonus`) keeps its existing conditional — unchanged
- [ ] Move and Force Sensitive inputs in Attributes footer are unchanged
- [ ] All new CSS scoped under `.starwarsd6.sheet`
- [ ] `npm test` passes
- [ ] `doc/implementation-plan.md` updated to mark feat019 complete

---

## All Needed Context

### Documentation & References

```yaml
- file: templates/actors/character-sheet.hbs (lines 82–103)
  why: CURRENT Attributes tab attr-footer — the source to modify.
       Current CP/FP/DSP are plain inputs. Move and forceSensitive are untouched.

- file: templates/actors/character-sheet.hbs (lines 413–435)
  why: CURRENT Force tab attr-footer — DSP + addDarkSidePoint button + FP display.
       DSP becomes circle + icon-only + button; FP becomes read-only circle.

- file: styles/starwarsd6.css (lines 182–211)
  why: Existing .attr-footer and .attr-footer-group rules. NEW classes .counter-group,
       .counter-circle, .counter-btn must be added under .starwarsd6.sheet.

- file: modules/apps/character-sheet.mjs (lines 10–29)
  why: DEFAULT_OPTIONS.actions — all registered actions. NEW actions incrementStat
       and decrementStat must be added here alongside existing ones.

- file: modules/actors/character-data.mjs
  why: Confirms characterPoints, forcePoints, darkSidePoints are NumberField min:0.
       No new DataModel fields needed.

- file: doc/ref/old_footer_ref.png
  why: Reference design — large empty circle, label below. Each counter is one circle.
       Design shows: Force Points, Dark Side Points, Wound Status, Skill Points circles.
       Target: approximate this circle style (simple border-radius:50% circle).

- file: PRPs/prp-feat017-pc-force-tab-style.md
  why: Prior restyle work on Force tab. Shows established attr-footer pattern and gotchas.
       Confirms addDarkSidePoint action is already registered and working.

- file: modules/helpers/force.mjs
  why: applyDarkSidePoint() is the existing handler for DSP increments — no change needed.
       The Force tab DSP `+` button keeps data-action="addDarkSidePoint".

- file: lang/en.json
  why: No new lang keys needed. CP/FP/DSP labels already exist:
       STARWARSD6.Character.CharacterPoints
       STARWARSD6.Character.ForcePoints
       STARWARSD6.Character.DarkSidePoints
       Do NOT add new keys.
```

### Current Codebase tree (relevant files only)

```
fvtt-starwarsd6/
├── templates/actors/character-sheet.hbs   ← MODIFY (Attr footer lines 82–103, Force footer 413–435)
├── styles/starwarsd6.css                  ← ADD counter circle CSS
├── modules/apps/character-sheet.mjs       ← ADD incrementStat / decrementStat actions
├── doc/implementation-plan.md             ← UPDATE to mark feat019 complete
└── lang/en.json                           ← NO CHANGES
```

### Desired Codebase tree (no new files)

Same as above. No new files.

### Known Gotchas & Critical Constraints

```js
// CRITICAL: Never assign directly to document properties.
// Always use actor.update({ "system.fieldName": value }) — direct assignment won't persist.

// CRITICAL: Floor at 0 on decrement. characterPoints, forcePoints, darkSidePoints
// all have min:0 in their NumberField. Enforce in JS: Math.max(0, current - 1).

// CRITICAL: Force Points on the Force tab are READ-ONLY.
// The only editable FP input is in the Attributes tab footer.
// Force tab FP circle: no +/− buttons, pointer-events: none on the group.

// CRITICAL: DSP on Force tab increments via existing addDarkSidePoint handler
// which calls applyDarkSidePoint(this.document) — includes the conversion check roll.
// Do NOT replace this with a generic incrementStat for DSP on the Force tab.
// The Attributes tab DSP +/− buttons CAN use incrementStat/decrementStat because
// they bypass the conversion check — OR you can wire them to addDarkSidePoint for
// the + and a new decrementDarkSidePoint (or inline decrement) for the −.
// RECOMMENDED: For Attributes tab DSP: wire + to addDarkSidePoint (preserves check),
// wire − to decrementStat handler (just decrements, no check needed for removing DSP).
// For CP and FP: generic incrementStat/decrementStat using data-field attribute.

// CRITICAL: The addDarkSidePoint action is already registered. Do NOT re-register it.
// Just add the new incrementStat / decrementStat actions alongside existing ones.

// GOTCHA: data-field on the button must be the dotted path into system:
//   data-field="characterPoints"  → updates system.characterPoints
//   data-field="forcePoints"      → updates system.forcePoints
//   data-field="darkSidePoints"   → updates system.darkSidePoints
// The handler reads target.dataset.field and builds the update key.

// GOTCHA: The counter layout (−  circle  +  label) inside attr-footer-group
// requires changing attr-footer-group from row (align-items:center) to column,
// OR nesting: outer .counter-group stacks vertically (circle-row on top, label below);
// inner .counter-row has − circle + in a row.
// RECOMMENDED STRUCTURE:
//   <div class="attr-footer-group counter-group">
//     <div class="counter-row">
//       <button class="counter-btn" data-action="decrementStat" data-field="characterPoints">
//         <i class="fas fa-minus"></i>
//       </button>
//       <div class="counter-circle">{{system.characterPoints}}</div>
//       <button class="counter-btn" data-action="incrementStat" data-field="characterPoints">
//         <i class="fas fa-plus"></i>
//       </button>
//     </div>
//     <label>{{localize "STARWARSD6.Character.CharacterPoints"}}</label>
//   </div>

// GOTCHA: Current .attr-footer-group uses display:flex; align-items:center; gap:5px.
// Adding counter-group override: display:flex; flex-direction:column; align-items:center.
// The counter-row inside is display:flex; align-items:center; gap:4px.

// GOTCHA: Circle sizing. From the reference image, circles are ~40–48px diameter.
// Use: width:44px; height:44px; border-radius:50%; border:2px solid #333;
//      display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.1em.

// GOTCHA: npm test only covers JS helpers (force, dice, damage, defense, etc.).
// No template rendering tests exist. Tests will pass unchanged if no JS files break.
// The only risky file is character-sheet.mjs — verify the two new actions are syntactically correct.

// GOTCHA: CSS scope — ALL new rules must be under .starwarsd6.sheet to avoid leaking.
// Pattern: .starwarsd6.sheet .counter-group { ... }

// GOTCHA: Font Awesome icons (fas fa-plus / fas fa-minus) are available in Foundry VTT.
// They are already used in the system (e.g. Force tab add-power button uses fa-plus pattern).
// No additional font loading needed.

// GOTCHA: submitOnChange:true means form inputs auto-submit on change.
// The new +/− buttons are type="button" (not submit) — they call actor.update() directly
// via the action handler. They do NOT submit the form. This is intentional.
// Ensure all new buttons have type="button".
```

---

## Implementation Blueprint

### Task 1 — MODIFY `modules/apps/character-sheet.mjs`

Add two new static private action handlers and register them.

**Step 1a — Register in DEFAULT_OPTIONS.actions** (around line 28, after `newRound`):

```js
// ADD inside the actions object:
incrementStat: CharacterSheet.#incrementStat,
decrementStat: CharacterSheet.#decrementStat,
```

**Step 1b — Add handler methods** (add after `#addDarkSidePoint` around line 663):

```js
static async #incrementStat(event, target) {
  const field = target.dataset.field;
  const current = foundry.utils.getProperty(this.document.system, field) ?? 0;
  await this.document.update({ [`system.${field}`]: current + 1 });
}

static async #decrementStat(event, target) {
  const field = target.dataset.field;
  const current = foundry.utils.getProperty(this.document.system, field) ?? 0;
  await this.document.update({ [`system.${field}`]: Math.max(0, current - 1) });
}
```

> `foundry.utils.getProperty` is a Foundry global — works on plain objects for dotted-path access. For non-dotted field names like `"characterPoints"`, it returns `this.document.system.characterPoints` directly.

### Task 2 — MODIFY `templates/actors/character-sheet.hbs` — Attributes tab footer

Replace lines 91–102 (the CP, FP, DSP groups). **Leave lines 83–90 (Move, ForceSensitive) untouched.**

**Target markup for each counter (example: Character Points):**

```hbs
<div class="attr-footer-group counter-group">
  <div class="counter-row">
    <button type="button" class="counter-btn"
            data-action="decrementStat" data-field="characterPoints"
            title="−">
      <i class="fas fa-minus"></i>
    </button>
    <div class="counter-circle">{{system.characterPoints}}</div>
    <button type="button" class="counter-btn"
            data-action="incrementStat" data-field="characterPoints"
            title="+">
      <i class="fas fa-plus"></i>
    </button>
  </div>
  <label>{{localize "STARWARSD6.Character.CharacterPoints"}}</label>
</div>
```

Repeat pattern for `forcePoints` and `darkSidePoints` (with `data-field="forcePoints"` etc.).

**DSP special case on Attributes tab:**
- `+` button: use `data-action="addDarkSidePoint"` (preserves conversion check), **no `data-field`**
- `−` button: use `data-action="decrementStat" data-field="darkSidePoints"` (removing DSP needs no check)

```hbs
<div class="attr-footer-group counter-group">
  <div class="counter-row">
    <button type="button" class="counter-btn"
            data-action="decrementStat" data-field="darkSidePoints"
            title="−">
      <i class="fas fa-minus"></i>
    </button>
    <div class="counter-circle">{{system.darkSidePoints}}</div>
    <button type="button" class="counter-btn"
            data-action="addDarkSidePoint"
            title="+">
      <i class="fas fa-plus"></i>
    </button>
  </div>
  <label>{{localize "STARWARSD6.Character.DarkSidePoints"}}</label>
</div>
```

### Task 3 — MODIFY `templates/actors/character-sheet.hbs` — Force tab footer

Replace lines 413–435. Keep the entire `<div class="attr-footer">` wrapper.

**DSP group (with icon-only + button, using existing addDarkSidePoint):**

```hbs
<div class="attr-footer-group counter-group">
  <div class="counter-row">
    <div class="counter-circle">{{forceData.dsp}}</div>
    <button type="button" class="counter-btn"
            data-action="addDarkSidePoint"
            title="{{localize 'STARWARSD6.Force.AddDSP'}}">
      <i class="fas fa-plus"></i>
    </button>
  </div>
  <label>{{localize "STARWARSD6.Character.DarkSidePoints"}}</label>
</div>
```

**DSP penalty block — keep exactly as-is:**

```hbs
{{#if forceData.forceRollBonus}}
<div class="attr-footer-group">
  <label>{{localize "STARWARSD6.Force.DSPBonus"}}</label>
  <span class="derived-value">
    {{#if forceData.forceRollBonus.bonusDice}}+{{forceData.forceRollBonus.bonusDice}}D{{/if}}{{#if forceData.forceRollBonus.bonusPips}}+{{forceData.forceRollBonus.bonusPips}}{{/if}}
    {{#unless forceData.forceRollBonus.bonusDice}}{{#unless forceData.forceRollBonus.bonusPips}}—{{/unless}}{{/unless}}
  </span>
</div>
{{/if}}
```

**Force Points group — read-only circle:**

```hbs
<div class="attr-footer-group counter-group counter-group--readonly">
  <div class="counter-row">
    <div class="counter-circle">{{system.forcePoints}}</div>
  </div>
  <label>{{localize "STARWARSD6.Character.ForcePoints"}}</label>
</div>
```

### Task 4 — MODIFY `styles/starwarsd6.css`

Append new rules at the end of the file (after last existing rule):

```css
/* Counter circle — large circular stat display */
.starwarsd6.sheet .counter-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.starwarsd6.sheet .counter-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.starwarsd6.sheet .counter-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1em;
  background: transparent;
}

.starwarsd6.sheet .counter-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  font-size: 0.75em;
  color: #444;
  line-height: 1;
}

.starwarsd6.sheet .counter-btn:hover {
  color: #000;
}

.starwarsd6.sheet .counter-group--readonly {
  pointer-events: none;
  opacity: 0.85;
}

.starwarsd6.sheet .counter-group label {
  font-weight: bold;
  white-space: nowrap;
  color: #1a1a1a;
  font-size: 0.85em;
  text-align: center;
}
```

### Task 5 — MODIFY `doc/implementation-plan.md`

Find the feat019 entry (or Phase 10 / Sheet Polish line) and mark it complete. If no entry exists yet, add one under the appropriate phase indicating feat019 is done.

---

## Validation Loop

### Level 1 — Template Structure Check

```bash
cd /home/perico/1_projects/101_dev/fvtt-starwarsd6

# Verify old plain number inputs for CP/FP/DSP are removed from attr footer
grep -n 'name="system.characterPoints"\|name="system.forcePoints"\|name="system.darkSidePoints"' \
  templates/actors/character-sheet.hbs
# Expected: ZERO matches (these inputs no longer exist)

# Verify counter-circle class appears (at least 4 times: CP, FP, DSP in attr tab + DSP,FP in force tab)
grep -c "counter-circle" templates/actors/character-sheet.hbs
# Expected: 5

# Verify new actions registered in template
grep -n "incrementStat\|decrementStat" templates/actors/character-sheet.hbs
# Expected: multiple matches (one per button that uses these)

# Verify addDarkSidePoint still present (DSP + on both tabs)
grep -c "addDarkSidePoint" templates/actors/character-sheet.hbs
# Expected: 2 (one per tab)

# Verify Force tab FP has counter-group--readonly class (read-only)
grep -n "counter-group--readonly" templates/actors/character-sheet.hbs
# Expected: 1 match (Force tab FP)

# Verify DSP penalty block still conditional
grep -n "forceRollBonus" templates/actors/character-sheet.hbs
# Expected: matches — conditional block preserved

# Verify Move and forceSensitive inputs untouched
grep -n 'name="system.move"\|name="system.forceSensitive"' templates/actors/character-sheet.hbs
# Expected: 1 match each
```

### Level 2 — JS Actions Check

```bash
# Verify new actions registered in character-sheet.mjs
grep -n "incrementStat\|decrementStat" modules/apps/character-sheet.mjs
# Expected: 4 matches — 2 in actions object, 2 method definitions

# Verify no syntax errors via Node (Foundry globals excluded from parse check)
node --input-type=module --experimental-vm-modules < /dev/null 2>&1 || true
# Just check the file parses: use npm test which runs vitest
```

### Level 3 — Unit Tests

```bash
npm test
```

Expected: all tests pass. Only helpers (force, dice, damage, defense) are tested. No template coverage.

If tests fail: check `git diff modules/helpers/` — only `character-sheet.mjs` should be touched among JS files. If a helper file was accidentally modified, revert it.

### Level 4 — CSS Sanity Check

```bash
# Verify new CSS classes added and scoped under .starwarsd6.sheet
grep -n "counter-circle\|counter-group\|counter-btn\|counter-row" styles/starwarsd6.css
# Expected: all matches scoped under .starwarsd6.sheet
```

---

## Final Validation Checklist

- [ ] `grep -c "counter-circle" templates/actors/character-sheet.hbs` → `5`
- [ ] `grep 'name="system.characterPoints"\|name="system.forcePoints"\|name="system.darkSidePoints"' templates/actors/character-sheet.hbs` → no output (inputs removed)
- [ ] `grep -c "addDarkSidePoint" templates/actors/character-sheet.hbs` → `2`
- [ ] `grep "counter-group--readonly" templates/actors/character-sheet.hbs` → 1 match
- [ ] `grep -n "incrementStat\|decrementStat" modules/apps/character-sheet.mjs` → 4 lines
- [ ] `grep 'name="system.move"\|name="system.forceSensitive"' templates/actors/character-sheet.hbs` → 2 matches (unchanged)
- [ ] `npm test` → exits 0

---

## Anti-Patterns to Avoid

- **Do not** use `actor.system.characterPoints = value` — direct assignment never persists; always `actor.update()`
- **Do not** add a second editable input for `system.forcePoints` in the Force tab — it must remain read-only there
- **Do not** replace the `addDarkSidePoint` handler with a generic `incrementStat` for the DSP `+` button — the conversion check must run
- **Do not** use `<button type="submit">` — use `type="button"` on all counter buttons
- **Do not** scope CSS outside `.starwarsd6.sheet`
- **Do not** run `deploy.sh` — user deploys manually
- **Do not** create new test files — no unit-test surface for template changes
- **Do not** touch DataModel (`character-data.mjs`) — no new fields needed

---

## Confidence Score: 9/10

**Strong:** All data fields exist; all Handlebars bindings are known; prior attr-footer pattern is established and working; CSS pattern (border-radius:50% circle) is simple and standard; reference image shows exactly the target design.

**Deductions:** −1 for the DSP `+` button asymmetry (uses `addDarkSidePoint` not `incrementStat`) — agent must remember to keep the two DSP tabs consistent in that convention and not accidentally unify them to a generic handler.
