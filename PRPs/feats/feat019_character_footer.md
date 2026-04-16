## FEATURE: Restyle Character Sheet Footer — Attributes & Skills Tab and Force Tab

Replace the current plain `attr-footer` inputs/spans on both tabs with a visual circle-pip design matching `doc/ref/old_footer_ref.png`.

### Attributes & Skills tab footer (lines 82–103 of `templates/actors/character-sheet.hbs`)

Current layout has five `attr-footer-group` items: Move, Force Sensitive, Character Points, Force Points, Dark Side Points.

**Changes:**
- **Move** and **Force Sensitive** — leave untouched (no visual change).
- **Character Points**, **Force Points**, **Dark Side Points** — replace the plain `<input type="number">` with a single large circle displaying the numeric value in the centre. Label below. Clicking `+` increments; clicking `−` decrements. No pip rows.

### Force tab footer (lines 413–435 of `templates/actors/character-sheet.hbs`)

Current layout: DSP counter + "Add Dark Side Point" button, optional DSP roll penalty, Force Points display.

**Changes:**
- **Dark Side Points** — replace counter + button with a single large circle showing the DSP count. The "Add Dark Side Point" button becomes a small `+` icon button (`<i class="fas fa-plus">`) inline next to the circle — no full button text.
- **Force Points** — replace `derived-value` span with a single large circle showing the FP count (read-only display, not editable from here, since FP come from the Attributes & Skills tab).
- **Dark Side Penalty** (`forceData.forceRollBonus`, shown only when non-zero) — keep as-is (derived text display, no circle needed).

### Big-circle interaction model

- Each counter renders as one large circle (CSS circle with `border-radius: 50%`) with the numeric value centred inside.
- `+` / `−` buttons (icon-only) flank the circle; clicking them calls `actor.update()` — never direct assignment.
- Force Points circle on the Force tab is read-only: no `+`/`−` buttons, `pointer-events: none`.
- This is **pure template + CSS + minimal JS handler** work. No new DataModel fields needed.

## EXAMPLES:

- `doc/ref/old_footer_ref.png` — reference screenshot (ignore pip-row layout; use only for general size/colour inspiration). Target design: one big circle per counter, number centred inside, label below.
- `templates/actors/character-sheet.hbs` lines 82–103 — current Attributes & Skills `attr-footer` to be restyled.
- `templates/actors/character-sheet.hbs` lines 413–435 — current Force tab `attr-footer` to be restyled.
- `styles/starwarsd6.css` — check existing `.attr-footer`, `.attr-footer-group` rules before adding new CSS; extend rather than duplicate.
- `PRPs/feats/feat017-pc-force-tab-style.md` and its generated PRP — prior restyling work on the Force tab; follow the same `attr-footer` / `attr-header` conventions established there.

## DOCUMENTATION:

- `doc/rules-reference.md` — consult for canonical max values of Character Points, Force Points, and Dark Side Points before hardcoding pip limits.
- `doc/fvtt/fvtt_sysdev.md` — Foundry v13 template and ApplicationV2 patterns.
- `ref/dnd5e/module/` — reference for ApplicationV2 action handler wiring (how `data-action` click handlers connect to sheet methods).

## OTHER CONSIDERATIONS:

- **No new DataModel fields.** `characterPoints`, `forcePoints`, `darkSidePoints` already exist on the actor model. Only the presentation changes.
- **Force Points on the Force tab are read-only.** They are edited on the Attributes & Skills tab. The Force tab circle must be non-interactive (CSS `pointer-events: none`, no `+`/`−` buttons).
- **"Add Dark Side Point" button.** The existing `data-action="addDarkSidePoint"` handler in `character-sheet.mjs` becomes the `+` icon button next to the DSP circle. Preserve the handler — only the visible markup changes.
- **DSP penalty block (`forceData.forceRollBonus`)** is conditional (`{{#if}}`). Keep that conditional intact; it must still hide when the penalty is zero.
- **CSS scope.** All new rules must be scoped under `.starwarsd6.sheet` to avoid leaking into other systems.
- **No pip-array helpers needed.** Single-circle display requires no `times` loop — just output the value directly inside the circle element.
