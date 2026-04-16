## FEATURE: Restyle the Force Tab on the PC Character Sheet

Redesign the Force tab layout so it visually matches the conventions established in the Attributes & Skills tab:

1. **Force Skills** — rendered like attribute headers (`attr-header` block pattern): one row per Force skill (Control, Sense, Alter) with a roll button on the left, the skill name, and an editable die-code input (`ND+P`). No table; use `attr-column-block` / `attr-header` CSS classes.

2. **Force Powers** — rendered like the skill list under an attribute (`skill-list` / `skill-row` pattern): one `<li>` per power, showing name, difficulty columns (Control / Sense / Alter), kept-up toggle, dark-side warning badge, and a delete button. Replace the current `<table class="force-powers-table">`.

3. **Kept-Up Powers** — displayed below Force Powers, unchanged in data but restyled as a simple `skill-list` ul. Keep the penalty note and remove-button functionality.

4. **DSP & Force Points footer** — a footer row styled like `attr-footer` showing:
   - DSP counter (current value) + "Add DSP" button
   - DSP roll-bonus derived value (if non-zero)
   - Force Points remaining (read-only display of `system.forcePoints`)

Section order (top to bottom): Force Skills → Force Powers → Kept-Up Powers → DSP / Force Points footer.

## EXAMPLES:

No `examples/` folder exists in this repo. Use existing templates as in-codebase examples:

- `templates/actors/character-sheet.hbs` lines 40–79 — **Attributes & Skills tab**: `attr-skills-grid`, `attr-column-block`, `attr-header`, `skill-list`, `skill-row` — this is the target visual pattern.
- `templates/actors/character-sheet.hbs` lines 324–453 — **current Force tab** to be restyled.
- `templates/actors/character-sheet.hbs` lines 82–103 — **`attr-footer` pattern** to model the DSP/FP footer.
- `styles/` — check existing CSS for `attr-header`, `skill-row`, `attr-footer` before adding new rules; reuse them wherever possible.

## DOCUMENTATION:

- `doc/rules-reference.md` — authoritative rules for Force skills (Control, Sense, Alter), DSP mechanics, Force Points, and keep-up penalty.
- `CLAUDE.md` — coding standards: ESM only, no build step, Handlebars templates in `templates/`, localization keys in `lang/en.json`.
- `modules/apps/character-sheet.mjs` — sheet class; check `_prepareContext()` (or equivalent) for `forceData` shape before changing the template.

## OTHER CONSIDERATIONS:

- **CSS first**: reuse existing classes (`attr-header`, `skill-list`, `skill-row`, `attr-footer`) before writing new rules. Add new CSS only for Force-specific overrides.
- **No data-model changes**: this is a pure template + CSS restyle. Do not touch `modules/actors/` DataModels or `modules/helpers/force.mjs` logic.
- **Localization**: all visible strings must use `{{localize "..."}}` with keys already present in `lang/en.json`. Do not add new keys unless strictly necessary for new UI elements.
- **Force Points display**: `system.forcePoints` is editable in the Attributes tab footer — in the Force tab footer it should be a **read-only derived display**, not a second editable input, to avoid duplicate edit surfaces.
- **Keep-up penalty note**: the `<p class="keep-up-penalty-note">` must remain visible when `forceData.keepUpPenalty` is truthy.
- **Dark-side warning badge** (`dsp-warning-badge`) must remain on powers that have `power.darkSideWarning === true`.
- **Double-click to open power sheet**: the `item-row` / `data-item-id` double-click handler on force power rows must be preserved when converting from `<tr>` to `<li>`.
- **Tests**: update or add any snapshot / rendering tests that cover the Force tab template.
- **Docs**: update `doc/implementation-plan.md` to mark this restyling task as complete once done.
