## FEATURE: NPC Sheet Restyling

Restyle `templates/actors/npc-sheet.hbs` and its CSS to match the visual language of the PC character sheet. No new data model fields, no new MJS logic — **pure template + CSS task**.

### Layout (top to bottom, single scrollable page, no tabs)

1. **Header** — NPC name input (existing) + portrait image top-left (clickable, `data-action="editImage" data-edit="img"`, same pattern as PC bio tab `document.img`)

2. **Attributes & Skills** — Replace current `attribute-row` / `skills-table` layout with the PC `attr-column-block` / `attr-header` / `skill-list` pattern from the Attributes tab (`character-sheet.hbs` lines 103–141). Six attribute blocks, each with roll button, name, dice/pips inputs, and indented skill list beneath.

3. **Weapons** — Replace current `inventory-table` with the PC combat tab weapons table (`character-sheet.hbs` lines 300–329): `combat-weapons-table` class, columns Name / Damage / Attack Skill / Roll button. Show all NPC weapons (no equipped filter — NPCs don't use the equipped toggle).

4. **Defense + Hit Boxes + Damage Thresholds** — Replace current separate Defense / Damage / Damage Thresholds / Hit Boxes sections with the PC combat tab "Wounds" block (`character-sheet.hbs` lines 332–405): `combat-wounds-section`, defense values inline row, then `wound-grid` 2×2 with threshold in header and hit-box buttons per tier.

5. **Notes** — Keep existing `<textarea name="system.notes">` section at bottom.

### CSS

- Apply same font, colour, and spacing rules from `.starwarsd6.sheet.actor.character` to `.starwarsd6.sheet.actor.npc`.
- Portrait: `img.bio-portrait` style (square, top-left, clickable cursor).
- Reuse existing PC classes (`attr-column-block`, `attr-header`, `skill-list`, `combat-weapons-table`, `combat-wounds-section`, `wound-grid`, `wound-cell`, `hit-box`, etc.) — do **not** duplicate CSS. Add NPC-specific overrides only where layout differs.

## EXAMPLES:

- `templates/actors/character-sheet.hbs` — **primary reference** for all markup patterns:
  - Portrait: lines 43–47 (bio tab)
  - Attributes + skills: lines 103–141 (attributes tab)
  - Weapons table: lines 299–329 (combat tab)
  - Wounds / defense / hit boxes: lines 332–405 (combat tab)
- `templates/actors/npc-sheet.hbs` — file to rewrite; keep all existing data bindings (`system.*`, `attributeGroups`, `weapons`, `combatData.*`)
- `modules/apps/npc-sheet.mjs` — check `_prepareContext()` to confirm which variables are already passed; add `img` if missing

## DOCUMENTATION:

- `doc/fvtt/fvtt_sysdev.md` — Foundry v13 ApplicationV2 sheet patterns
- `doc/rules-reference.md` — combat section for defense / hit box / threshold values (verify field names match)
- `ref/dnd5e/module/` — ApplicationV2 `editImage` action pattern if portrait click needs wiring in MJS

## OTHER CONSIDERATIONS:

- **`editImage` action** — PC sheet wires portrait click via `data-action="editImage"`. Verify `NpcSheet` in `modules/apps/npc-sheet.mjs` has this action handler (inherited from `ActorSheetV2` or explicitly defined). If missing, add it — do **not** skip the portrait or make it non-clickable.
- **No equipped filter on NPC weapons** — PC combat tab only shows `weapon.equipped` weapons. NPCs have no equipped toggle; show all weapons unconditionally.
- **`combatData` context variable** — already provided by `NpcSheet._prepareContext()`. Confirm field names (`combatData.rangedDefense`, `combatData.stunBoxes`, etc.) match what PC sheet uses. They must be identical for CSS class reuse to work.
- **`attributeGroups` with skills** — already provided; no changes needed in MJS.
- **No tabs** — do not introduce `<nav class="sheet-tabs">` or tab sections. Single `<div class="sheet-body">` with sequential sections.
- **CSS scope** — all new/reused classes must be scoped under `.starwarsd6.sheet.actor.npc` to avoid bleed into PC sheet. Check existing stylesheet for where `.starwarsd6.sheet.actor.character` rules live and mirror the pattern.
- **Tests** — update or add tests in `tests/` covering NPC sheet context preparation if `_prepareContext()` is touched.
- **Docs** — update `doc/implementation-plan.md` to mark feat021 complete after shipping.
