# feat027 — Roll Window Redesign

## FEATURE:

Redesign the roll dialog window (`modules/apps/roll-dialog.mjs`, `templates/dice/roll-dialog.hbs`, `styles/starwarsd6.css`) to match the visual design in `doc/ref/roll_window_redesign.png`.

**Specific changes required:**

1. **Header:** Black bar, all-caps title "D6 DICE ROLL". Style `.starwarsd6.roll-dialog .window-header` in CSS (dark background, white all-caps text).

2. **Inputs — underline style:** Number inputs (`numActions`, `difficulty`, `forceDifficultyModifier`) use underline-only style — no box border, just `border-bottom`. Left-aligned value, transparent background.

3. **Difficulty tier select:** Style `<select>` underline-only — override with `-webkit-appearance: none; appearance: none;` and apply only `border-bottom` to match inputs.

4. **Force Point toggle:** Replace `<input type="checkbox">` with CSS-only toggle switch. Checkbox stays in DOM (for form submission), hidden visually, CSS-only sliding pill toggle overlaid via `<label>` wrapper. When `hasFP` is false, show toggle disabled with muted style. Use Force-related FontAwesome icon next to toggle (e.g. `fa-jedi`) if available, otherwise `fa-star`.

5. **Action buttons:** Pill-shaped — `border-radius: 999px`. ROLL button: dark fill (`background: #1a1a1a; color: #fff`). Cancel: transparent with dark border. Both left-aligned as group.

6. **Layout:** All content left-aligned. No centered text. Width stays at 320px.

7. **Variant dialogs:** Same visual style for force rolls (`isForceRoll=true`) and rolls without difficulty (`showDifficulty=false`) — no special-casing in `.mjs`, only template/CSS.

**No changes to `roll-dialog.mjs` logic** — only template and CSS. The `.mjs` handles all data flow.

## EXAMPLES:

- `doc/ref/roll_window_redesign.png` — **authoritative visual reference**. Match this layout: black header bar, underline inputs, large toggle with icon, pill buttons, left-aligned.
- `doc/ref/bs_character_sheet.jpg` — secondary reference for printed-sheet aesthetic (underline fields, stark black/white).

## DOCUMENTATION:

- `doc/rules-reference.md` — Force Point mechanic context (when `canSpendFP` / `hasFP` flags apply).
- `doc/fvtt/fvtt_sysdev.md` — Foundry v13 system dev guide.
- `modules/apps/roll-dialog.mjs` — current dialog logic; **do not change**.
- `templates/dice/roll-dialog.hbs` — primary file to edit.
- `styles/starwarsd6.css` — roll-dialog rules start at line 553.

## OTHER CONSIDERATIONS:

- **No JS changes** — CSS + HBS only. Do not rename any `name` attributes (form submission reads them).
- **Toggle switch:** `<label>` wraps hidden `<input type="checkbox" name="useForcePoint">`. Pure CSS visual toggle. No JavaScript.
- **Foundry window chrome:** `.starwarsd6.roll-dialog .window-header` needs dark background override.
- **Left-alignment:** `text-align: left` on container; no `justify-content: center` on footer.
- **`autofocus`** on `numActions` input must be preserved.
- **CSS scope:** All rules scoped under `.starwarsd6.roll-dialog` — no leaking into other sheets.
- **No new files** — edit existing `roll-dialog.hbs` and `starwarsd6.css` only.
