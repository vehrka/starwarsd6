## FEATURE: PC Character Sheet Minor Fixes

Five targeted layout changes to the PC character sheet. Pure template + CSS — no DataModel, no JS, no new lang keys unless a label is missing.

### Changes

1. **Bio tab — Notes section**: Add a freeform notes textarea at the bottom of the Bio tab, bound to `system.notes`. Use the existing `form-group` pattern.

2. **Move "Move" value**: Remove from the Attributes & Skills tab footer. Add it to the Combat tab above the Weapons section (same `attr-footer-group` pattern used elsewhere).

3. **Move "Force Sensitive" checkbox**: Remove from the Attributes & Skills tab. Add it to the Bio tab, on the same line as the Character Type field (inline, right side).

4. **Combat tab visual consistency**: Restyle the Combat tab text and tables to match the Inventory tab conventions — replace any `<table>` elements with flex-based `skill-list` / `skill-row` / `item-row` patterns used in the Inventory tab.

5. **Force tab footer — swap DSP / Force Points order**: In the `attr-footer` bar at the bottom of the Force tab, move Force Points to the left of Dark Side Points.

---

## EXAMPLES:

- `templates/actors/character-sheet.hbs` — primary file to modify. All five changes land here.
  - **Bio tab**: find the Bio `<section data-tab="bio">` block; append notes textarea before `</section>`.
  - **Attributes tab footer**: find `system.move` and `system.forceSensitive` references; remove them.
  - **Combat tab**: lines ~208–347 (current combat markup); add Move above Weapons, restyle tables to match Inventory.
  - **Bio tab (Force Sensitive)**: find Character Type field row; add Force Sensitive checkbox inline.
  - **Force tab footer**: find `attr-footer` in the Force tab (`data-tab="force"`); swap the two `attr-footer-group` blocks.

- `templates/actors/character-sheet.hbs` (Inventory tab) — **reference for table/list style target**. The Inventory tab uses `<ul class="skill-list">` / `<li class="skill-row item-row">` — Combat tab tables must match this pattern.

- `styles/starwarsd6.css` — add any Combat-tab-specific overrides scoped under `.starwarsd6.sheet`.

---

## DOCUMENTATION:

- `doc/rules-reference.md` — authoritative source for Move stat definition and Force Sensitive mechanic.
- `doc/fvtt/fvtt_sysdev.md` — Foundry v13 ApplicationV2 sheet patterns.
- `PRPs/feats/feat016-pc-combat-tab-style.md` — prior combat tab restyle spec; check what data bindings (`combatData.*`) are already in place and must be preserved.
- `PRPs/feats/prp-feat017-pc-force-tab-style.md` — Force tab restyle spec; describes the `attr-footer` structure for DSP / Force Points — use as reference for the footer swap.

---

## OTHER CONSIDERATIONS:

- **Data bindings must not change.** All `system.*` and `combatData.*` Handlebars references must remain wired to the same variables. Only restructure surrounding HTML.

- **Force Sensitive checkbox placement**: it must stay bound to `name="system.forceSensitive"` (checkbox input). Place it as a labeled inline group next to the Character Type field — use a `form-group inline` or `attr-footer-group` pattern, not a new full-width row.

- **Move value in Combat tab**: `system.move` is a derived read-only value. Display as `<span class="derived-value">{{system.move}}</span>` with a label. Do NOT make it an editable input. Place it above the Weapons `<h3>` heading, in its own `attr-footer-group` or small `form-group`.

- **Combat tab restyle scope**: only change the visual structure (tables → flex lists). Do NOT remove or rename any `data-action`, `data-weapon-id`, `data-tier`, or other event-wiring attributes. Hit boxes must keep `data-action="markHitBox"` and `data-tier="..."`.

- **Force tab footer swap**: the Force tab `attr-footer` currently has DSP group first, Force Points group last. Swap so Force Points is first, DSP (with Add DSP button) is second. The DSP roll-bonus group (if present) stays adjacent to DSP.

- **No new CSS classes** unless strictly needed. Prefer reusing `.skill-list`, `.skill-row`, `.item-row`, `.attr-footer`, `.attr-footer-group`, `.derived-value`, `.form-group` which are already defined in `styles/starwarsd6.css`.

- **No new localization keys** unless a label is genuinely absent from `lang/en.json`. Verify with grep before adding.

- **CSS scope**: all new rules scoped under `.starwarsd6.sheet`.

- **No TypeScript, no build step** — plain Handlebars and CSS only.

- **Do not run `deploy.sh`** — user deploys manually.

- **Tests**: run `npm test` after changes. Template-only edits have no unit-test surface, but confirm all existing tests still pass.

- **Update `doc/implementation-plan.md`** to mark feat022 complete after implementation.
