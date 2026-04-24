# PRP-feat027 — Roll Window Redesign

## Goal

Redesign `templates/dice/roll-dialog.hbs` and the roll-dialog section of `styles/starwarsd6.css` (lines 552–639) to match `doc/ref/roll_window_redesign.png`.

**No changes to `modules/apps/roll-dialog.mjs`.** No new files.

## Why

Visual consistency with the printed-sheet aesthetic. The current dialog uses generic form styling; the target is a stark black-and-white, underline-input design with a CSS-only toggle switch and pill buttons.

## What

Match the reference image exactly:

1. **Window header** — dark bar, white text (Foundry chrome override)
2. **Section title** — "ROLL PARAMETERS" bold, left-aligned, inside content area
3. **Number inputs** — underline-only, left-aligned value, transparent bg
4. **Difficulty row** — number input + select side-by-side; select underline-only with custom arrow
5. **Force Point toggle** — CSS-only sliding pill toggle + Jedi icon; hidden checkbox stays for form submission
6. **Decorative divider** — horizontal rule with double-chevron icon (between toggle and buttons)
7. **Buttons** — pill-shaped; ROLL = dark fill; Cancel = light with border; left-aligned (not stretched)

### Success Criteria

- [ ] Header bar is dark background, white text
- [ ] All inputs are underline-only (no box border)
- [ ] Select has underline-only + custom chevron arrow
- [ ] Force Point row shows CSS toggle + Jedi icon when `canSpendFP=true`
- [ ] Toggle is muted/disabled when `hasFP=false`
- [ ] Decorative divider appears between FP row and buttons
- [ ] ROLL button: pill, dark fill, dice icon
- [ ] Cancel button: pill, light with dark border
- [ ] All content left-aligned
- [ ] All CSS scoped to `.starwarsd6.roll-dialog` — no bleed
- [ ] `name` attributes unchanged (form submission still works)
- [ ] `autofocus` on `numActions` preserved
- [ ] Force roll variant (`isForceRoll=true`) uses same style
- [ ] No-difficulty variant (`showDifficulty=false`) uses same style

## All Needed Context

### Reference Files

```yaml
- file: doc/ref/roll_window_redesign.png
  why: Authoritative visual reference — match layout pixel-for-pixel
  critical: |
    - Header: dark bar (Foundry window-header override)
    - Title "ROLL PARAMETERS" is inside the content, NOT the window title
    - Number of Actions: label left, underline input right (value right-aligned in input)
    - Difficulty row: label left, number input + select side-by-side right
    - Select has visible down-arrow (custom, not native)
    - Spend Force Point row: label left, toggle pill + Jedi Order icon right
    - Toggle is dark/on in reference image
    - Divider: thin line + double down-chevron (≫ rotated, or fa-angles-down)
    - Buttons: ROLL (dark, dice icon, pill), Cancel (light, pill), left-aligned as pair

- file: templates/dice/roll-dialog.hbs
  why: File to rewrite — understand current structure, preserve name attrs and autofocus

- file: styles/starwarsd6.css
  why: Lines 552–639 = roll-dialog section to replace entirely
  critical: All rules must stay under .starwarsd6.roll-dialog scope

- file: modules/apps/roll-dialog.mjs
  why: READ ONLY. Understand context vars passed to template.
  critical: |
    Context vars: canSpendFP, hasFP, isForceRoll, showDifficulty, defaultDifficulty, difficultyTiers
    Form names (DO NOT RENAME): numActions, useForcePoint, forceDifficultyModifier, difficultyTier, difficulty
    Classes on app: ["starwarsd6", "roll-dialog"]
    window.title = "STARWARSD6.RollDialog.Title" (Foundry chrome title — separate from content title)
```

### Current Template (full)

```handlebars
<div class="roll-dialog-content">
  <div class="form-group">
    <label for="num-actions">{{localize "STARWARSD6.RollDialog.NumActions"}}</label>
    <input type="number" id="num-actions" name="numActions" value="1" min="1" max="4" autofocus />
  </div>
  {{#if canSpendFP}}
  <div class="form-group">
    <label>
      <input type="checkbox" name="useForcePoint" {{#unless hasFP}}disabled{{/unless}} />
      {{localize "STARWARSD6.FP.SpendFP"}}
      {{#unless hasFP}}<span class="no-fp">({{localize "STARWARSD6.FP.NoFP"}})</span>{{/unless}}
    </label>
  </div>
  {{/if}}
  {{#if isForceRoll}}
  <div class="form-group">
    <label>{{localize "STARWARSD6.Force.DifficultyModifier"}}</label>
    <input type="number" name="forceDifficultyModifier" value="0" min="0" max="30" />
  </div>
  {{/if}}
  {{#unless isForceRoll}}
  <div class="form-group">
    <label>{{localize "STARWARSD6.Difficulty.Label"}}</label>
    <select name="difficultyTier">
      {{#each difficultyTiers}}
      <option value="{{this.mod}}"{{#if this.isDefault}} selected{{/if}}>
        {{localize this.labelKey}}
      </option>
      {{/each}}
    </select>
  </div>
  {{/unless}}
  {{#if showDifficulty}}
  <div class="form-group">
    <label>{{localize "STARWARSD6.RollDifficulty"}}</label>
    <input type="number" name="difficulty" value="{{defaultDifficulty}}" min="0" max="99" />
  </div>
  {{/if}}
  <footer class="sheet-footer form-footer">
    <button type="submit" class="default">
      <i class="fas fa-dice"></i>
      {{localize "STARWARSD6.RollDialog.Roll"}}
    </button>
    <button type="button" data-action="close">
      {{localize "STARWARSD6.RollDialog.Cancel"}}
    </button>
  </footer>
</div>
```

### Current CSS — Roll Dialog Section (lines 552–639 of starwarsd6.css)

```css
/* ===== ROLL DIALOG ===== */
.starwarsd6.roll-dialog {
  font-family: sans-serif;
}
.starwarsd6.roll-dialog .roll-dialog-content {
  padding: 8px 12px 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.starwarsd6.roll-dialog .form-group {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px dotted #ddd;
  padding-bottom: 4px;
}
.starwarsd6.roll-dialog .form-group:last-of-type {
  border-bottom: none;
}
.starwarsd6.roll-dialog .form-group label {
  flex: 1;
  font-weight: bold;
  font-size: 0.9em;
  color: #1a1a1a;
}
.starwarsd6.roll-dialog .form-group input[type="number"] {
  width: 3.5em;
  text-align: center;
  border: none;
  border-bottom: 1px solid #aaa;
  background: transparent;
  font-weight: bold;
  font-size: 0.95em;
  padding: 0 2px;
}
.starwarsd6.roll-dialog .form-group input[type="checkbox"] {
  margin-right: 4px;
  cursor: pointer;
}
.starwarsd6.roll-dialog .no-fp {
  font-weight: normal;
  color: #888;
  font-size: 0.85em;
  font-style: italic;
}
.starwarsd6.roll-dialog .sheet-footer {
  display: flex;
  gap: 6px;
  border-top: 2px solid #2a2a2a;
  margin-top: 6px;
  padding-top: 6px;
}
.starwarsd6.roll-dialog .sheet-footer button {
  flex: 1;
  padding: 4px 8px;
  font-size: 0.9em;
  cursor: pointer;
  border: 1px solid #2a2a2a;
  background: #fff;
  font-family: inherit;
  font-weight: bold;
  color: #1a1a1a;
}
.starwarsd6.roll-dialog .sheet-footer button:hover {
  background: #2a2a2a;
  color: #fff;
}
.starwarsd6.roll-dialog .sheet-footer button.default {
  background: #2a2a2a;
  color: #fff;
}
.starwarsd6.roll-dialog .sheet-footer button.default:hover {
  background: #000;
}
```

### Known Gotchas

```
CRITICAL: Foundry window-header is rendered by the framework, outside the template.
Override via: .starwarsd6.roll-dialog .window-header { background: #1a1a1a; color: #fff; }
The .window-header rule must appear in the CSS, not the template.

CRITICAL: CSS-only toggle switch pattern:
  - <input type="checkbox" name="useForcePoint" hidden/visually-hidden> stays for form submission
  - <label for="useForcePoint" class="fp-toggle-label"> creates the visual toggle
  - The checkbox must have id="use-force-point" and label for="use-force-point"
  - Use :checked pseudo-class on sibling checkbox to drive CSS state
  - Pattern: input:checked + label .fp-toggle-track { background: #1a1a1a; }
  - OR: label::before / label::after for track and thumb

CRITICAL: Select underline-only needs -webkit-appearance:none; appearance:none; to remove
native box. Then add custom arrow using background-image SVG data-URI or ::after pseudo
(::after won't work on <select>, use background-image).

CRITICAL: The template title "ROLL PARAMETERS" is NOT from window.title — add it as a
heading inside .roll-dialog-content. window.title drives the Foundry chrome title bar
text which we're hiding/overriding visually.

CRITICAL: Buttons should NOT be flex:1 (that stretches them full width). Use width:auto
and display:inline-flex or just not flex:1. Left-align the footer, don't justify.

CRITICAL: FontAwesome 6 Free (shipped with Foundry v13) includes fa-jedi (solid) and
fa-angles-down (for the divider chevrons). Use class="fa-solid fa-jedi" or "fas fa-jedi".

CRITICAL: The toggle checkbox must still be submitted with the form when checked. Using
display:none or visibility:hidden on the <input> keeps it in the DOM for form submission.
Do NOT use type="hidden" — checkboxes only submit when checked, type="hidden" always submits.

CRITICAL: When hasFP=false, show toggle visually disabled (muted/grey), not interactive.
The disabled attr on the checkbox disables form submission logic too, which is correct.
Apply .fp-disabled class or use :disabled CSS selector on hidden input to drive muted style
on label: input[name="useForcePoint"]:disabled ~ .fp-toggle-label { opacity: 0.4; }

CRITICAL: Difficulty row in reference shows number input LEFT of select — they appear
side by side. In current template, they are separate form-groups. For the redesign,
keep them as separate rows OR merge into one row using a flex sub-container. 
Looking at reference image: "Difficulty:" label, then "7" (number input), then "Normal ▾" (select).
This is ONE row, two inputs. Requires a wrapper div with both inputs inside.
```

## Implementation Blueprint

### Step 1 — Template Restructure (`templates/dice/roll-dialog.hbs`)

Pseudocode for new structure:

```
<div class="roll-dialog-content">
  
  <!-- Section title (not window chrome) -->
  <h2 class="dialog-title">ROLL PARAMETERS</h2>

  <!-- Number of Actions row -->
  <div class="form-group">
    <label for="num-actions">Number of Actions:</label>
    <input type="number" id="num-actions" name="numActions" value="1" min="1" max="4" autofocus />
  </div>

  <!-- Difficulty row (non-force rolls only): number + select in one row -->
  {{#unless isForceRoll}}
  <div class="form-group">
    <label>Difficulty:</label>
    <div class="difficulty-inputs">
      {{#if showDifficulty}}
      <input type="number" name="difficulty" value="{{defaultDifficulty}}" min="0" max="99" />
      {{/if}}
      <div class="select-wrapper">
        <select name="difficultyTier">
          {{#each difficultyTiers}}
          <option value="{{this.mod}}"{{#if this.isDefault}} selected{{/if}}>
            {{localize this.labelKey}}
          </option>
          {{/each}}
        </select>
      </div>
    </div>
  </div>
  {{/unless}}

  <!-- Force difficulty modifier (force rolls only) -->
  {{#if isForceRoll}}
  <div class="form-group">
    <label>Force Difficulty:</label>
    <input type="number" name="forceDifficultyModifier" value="0" min="0" max="30" />
  </div>
  {{/if}}

  <!-- Force Point toggle (only when canSpendFP) -->
  {{#if canSpendFP}}
  <div class="form-group fp-group">
    <label class="fp-label">Spend Force Point?</label>
    <div class="fp-toggle-wrapper">
      <input type="checkbox" id="use-force-point" name="useForcePoint"
             class="fp-checkbox" {{#unless hasFP}}disabled{{/unless}} />
      <label for="use-force-point" class="fp-toggle-label {{#unless hasFP}}fp-disabled{{/unless}}">
        <span class="fp-toggle-track">
          <span class="fp-toggle-thumb"></span>
        </span>
      </label>
      <i class="fas fa-jedi fp-icon {{#unless hasFP}}fp-icon-disabled{{/unless}}"></i>
    </div>
  </div>
  {{/if}}

  <!-- Decorative divider -->
  <div class="dialog-divider">
    <i class="fas fa-angles-down"></i>
  </div>

  <!-- Buttons -->
  <footer class="sheet-footer">
    <button type="submit" class="default roll-btn">
      <i class="fas fa-dice-d6"></i>
      ROLL
    </button>
    <button type="button" data-action="close" class="cancel-btn">
      Cancel
    </button>
  </footer>

</div>
```

**IMPORTANT**: Keep localize helpers for all user-visible strings. Replace hardcoded English above with `{{localize "..."}}` calls. Keep existing localize keys — do not invent new ones.

### Step 2 — CSS Replacement (`styles/starwarsd6.css`, lines 552–639)

Replace the entire `/* ===== ROLL DIALOG ===== */` block with:

```css
/* ===== ROLL DIALOG ===== */
.starwarsd6.roll-dialog .window-header {
  background: #1a1a1a;
  color: #fff;
}

.starwarsd6.roll-dialog .window-header .window-title {
  color: #fff;
}

.starwarsd6.roll-dialog {
  font-family: sans-serif;
}

.starwarsd6.roll-dialog .roll-dialog-content {
  padding: 12px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fff;
  text-align: left;
}

/* Section heading inside content */
.starwarsd6.roll-dialog .dialog-title {
  font-size: 1.1em;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 4px;
  color: #1a1a1a;
}

/* Each label+input row */
.starwarsd6.roll-dialog .form-group {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: none;
  padding-bottom: 0;
}

.starwarsd6.roll-dialog .form-group label {
  flex: 1;
  font-weight: 600;
  font-size: 0.9em;
  color: #1a1a1a;
}

/* Number inputs — underline only */
.starwarsd6.roll-dialog .form-group input[type="number"] {
  width: 3.5em;
  text-align: left;
  border: none;
  border-bottom: 2px solid #1a1a1a;
  background: transparent;
  font-weight: bold;
  font-size: 1em;
  padding: 2px 4px;
  outline: none;
}

/* Difficulty row: number + select side by side */
.starwarsd6.roll-dialog .difficulty-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Select — underline only, custom arrow */
.starwarsd6.roll-dialog .select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.starwarsd6.roll-dialog .select-wrapper select {
  -webkit-appearance: none;
  appearance: none;
  border: none;
  border-bottom: 2px solid #1a1a1a;
  background: transparent;
  font-family: inherit;
  font-size: 0.9em;
  font-weight: 600;
  color: #1a1a1a;
  padding: 2px 20px 2px 4px;
  outline: none;
  cursor: pointer;
}

.starwarsd6.roll-dialog .select-wrapper::after {
  content: "▾";
  position: absolute;
  right: 4px;
  pointer-events: none;
  font-size: 0.85em;
  color: #1a1a1a;
}

/* Force Point toggle row */
.starwarsd6.roll-dialog .fp-group {
  align-items: center;
}

.starwarsd6.roll-dialog .fp-label {
  flex: 1;
  font-weight: 600;
  font-size: 0.9em;
  color: #1a1a1a;
}

.starwarsd6.roll-dialog .fp-toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Hide the actual checkbox but keep it in DOM for form submission */
.starwarsd6.roll-dialog .fp-checkbox {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

/* Toggle label acts as the visual toggle */
.starwarsd6.roll-dialog .fp-toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.starwarsd6.roll-dialog .fp-toggle-track {
  display: inline-block;
  width: 40px;
  height: 22px;
  background: #ccc;
  border-radius: 999px;
  position: relative;
  transition: background 0.2s;
}

.starwarsd6.roll-dialog .fp-toggle-thumb {
  display: block;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: left 0.2s;
}

/* When checkbox is checked, slide thumb right and darken track */
.starwarsd6.roll-dialog .fp-checkbox:checked ~ .fp-toggle-label .fp-toggle-track {
  background: #1a1a1a;
}

.starwarsd6.roll-dialog .fp-checkbox:checked ~ .fp-toggle-label .fp-toggle-thumb {
  left: 20px;
}

/* Disabled state */
.starwarsd6.roll-dialog .fp-toggle-label.fp-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.starwarsd6.roll-dialog .fp-icon {
  font-size: 1.2em;
  color: #1a1a1a;
}

.starwarsd6.roll-dialog .fp-icon-disabled {
  opacity: 0.4;
}

/* Decorative divider */
.starwarsd6.roll-dialog .dialog-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 1em;
  margin: 4px 0;
}

/* Footer buttons — pill shape, left-aligned */
.starwarsd6.roll-dialog .sheet-footer {
  display: flex;
  gap: 8px;
  border-top: none;
  margin-top: 4px;
  padding-top: 0;
  justify-content: flex-start;
}

.starwarsd6.roll-dialog .roll-btn {
  background: #1a1a1a;
  color: #fff;
  border: 2px solid #1a1a1a;
  border-radius: 999px;
  padding: 6px 18px;
  font-family: inherit;
  font-weight: bold;
  font-size: 0.9em;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.starwarsd6.roll-dialog .roll-btn:hover {
  background: #000;
  border-color: #000;
}

.starwarsd6.roll-dialog .cancel-btn {
  background: #fff;
  color: #1a1a1a;
  border: 2px solid #1a1a1a;
  border-radius: 999px;
  padding: 6px 18px;
  font-family: inherit;
  font-weight: bold;
  font-size: 0.9em;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.starwarsd6.roll-dialog .cancel-btn:hover {
  background: #f0f0f0;
}
```

## Tasks (in order)

1. **Read** `templates/dice/roll-dialog.hbs` — confirm current structure
2. **Read** `styles/starwarsd6.css` lines 552–639 — confirm current roll-dialog CSS
3. **Rewrite** `templates/dice/roll-dialog.hbs` — new structure per blueprint
   - Preserve all `name` attributes exactly
   - Preserve `autofocus` on `numActions`
   - Use `{{localize}}` for all strings
   - CSS-only toggle: hidden `<input id="use-force-point">` + `<label for="use-force-point">`
   - Sibling combinator `~` in CSS drives toggle state — checkbox and label must be siblings, **not** nested
4. **Replace** roll-dialog CSS section in `styles/starwarsd6.css` (lines 552–639) with new rules
   - Delete old block, paste new block in same location
   - Verify no rules bleed outside `.starwarsd6.roll-dialog` scope
5. **Verify** structure:
   - `fa-jedi` icon exists in FontAwesome 6 (it does — Free solid set)
   - `fa-angles-down` exists in FontAwesome 6 (it does — Free solid set)
   - `fa-dice-d6` exists (confirmed — used in other templates)
6. **Check** CSS sibling selector works: the `fp-checkbox` input and `fp-toggle-label` label must be **siblings** (same parent), not nested. The label wraps nothing except its own content. The checkbox sits just before the label in DOM.

## Validation Gates

### Level 1 — Structural checks (run after editing)

```bash
# Verify name attributes preserved
grep -E 'name="(numActions|useForcePoint|forceDifficultyModifier|difficultyTier|difficulty)"' \
  templates/dice/roll-dialog.hbs

# Expected: 5 matches (all 5 form field names present)

# Verify autofocus preserved
grep 'autofocus' templates/dice/roll-dialog.hbs
# Expected: 1 match on numActions input

# Verify checkbox has id for label pairing
grep 'id="use-force-point"' templates/dice/roll-dialog.hbs
# Expected: 1 match

# Verify label has for= pointing to checkbox
grep 'for="use-force-point"' templates/dice/roll-dialog.hbs
# Expected: 1 match on the fp-toggle-label

# Verify no JS changes
git diff modules/
# Expected: empty (no changes)
```

### Level 2 — CSS scope check

```bash
# No roll-dialog rules should be outside scope
grep -n "roll-dialog" styles/starwarsd6.css
# All results must have .starwarsd6.roll-dialog prefix

# Verify window-header override exists
grep "window-header" styles/starwarsd6.css
# Expected: at least one rule under .starwarsd6.roll-dialog .window-header
```

### Level 3 — Handlebars syntax check

```bash
# No unclosed {{#if}} blocks
node -e "
const fs = require('fs');
const t = fs.readFileSync('templates/dice/roll-dialog.hbs', 'utf8');
const opens = (t.match(/\{\{#(if|unless|each)/g) || []).length;
const closes = (t.match(/\{\{\/(if|unless|each)/g) || []).length;
console.log('opens:', opens, 'closes:', closes, opens === closes ? 'OK' : 'MISMATCH');
"
# Expected: opens === closes, prints "OK"
```

### Level 4 — Visual (manual, in Foundry)

Deploy and open a roll dialog. Verify:
- [ ] Header: dark bg, white text
- [ ] Title "ROLL PARAMETERS" visible in content
- [ ] Number input: underline only, value left-aligned
- [ ] Difficulty row: number + select side by side, select has custom arrow
- [ ] Force Point row (on force-capable actor): sliding toggle + Jedi icon
- [ ] Toggle slides when clicked (CSS only, no JS)
- [ ] Divider with chevrons visible
- [ ] ROLL button: dark pill with dice icon
- [ ] Cancel button: light pill with border
- [ ] Buttons left-aligned, not full-width

## Anti-Patterns to Avoid

- Do NOT wrap the checkbox `<input>` inside the `<label>` — the CSS sibling combinator `~` requires them to be siblings
- Do NOT use `display:none` on the checkbox if you want CSS `:checked` state — use `opacity:0; position:absolute; width:0; height:0` instead (keeps it in DOM and accessible to CSS)
- Do NOT add `flex:1` to buttons — that stretches them full-width; use `width:auto`
- Do NOT use `::after` to add a custom arrow to `<select>` — it doesn't work; use a wrapper div with `::after` instead (already shown in blueprint)
- Do NOT change `window.title` or Handlebars template title — window.title is used by Foundry, the visible heading is a new `<h2>` inside the content
- Do NOT create new localization keys — reuse existing `STARWARSD6.*` keys; use hardcoded "ROLL PARAMETERS" only if no existing key matches the section heading, or add it to `lang/en.json`
- Do NOT skip the `{{localize}}` wrapper on any user-visible string

## Confidence Score: 9/10

High confidence because:
- Pure CSS + HBS changes, no logic
- All form field names, autofocus, and Handlebars helpers are documented
- CSS sibling combinator toggle pattern is well-understood
- FontAwesome icon names verified against FA6 Free
- Gotchas about `::after` on select, sibling vs nested checkbox, and display:none documented
- Validation gates are fully executable
- Only risk: minor visual tuning needed after seeing result in Foundry (spacing, font sizes)
