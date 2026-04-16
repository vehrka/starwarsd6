## FEATURE: Add a "Header" tab to the PC Character Sheet with basic character info

Add a new tab called **Bio** to the PC character sheet (`templates/actors/character-sheet.hbs` + `styles/starwarsd6.css`). It displays identity fields and the character portrait in a layout matching the classic Star Wars D6 paper sheet (`doc/ref/old_header.png`).

**Fields to display:**

- Character Name (`actor.name`)
- Character Type (`system.characterType` — free-text string, new field)
- Height (`system.height` — free-text string, new field)
- Weight (`system.weight` — free-text string, new field)
- Sex (`system.sex` — free-text string, new field)
- Age (`system.age` — free-text string, new field)
- Physical Description (`system.description` — textarea, new field)
- Character Image — the standard Foundry actor portrait (`actor.img`), displayed top-right

All new fields are stored in the actor DataModel (`modules/actors/character-data.mjs`). All string fields are plain `StringField`. `description` is also a `StringField` (multiline textarea in the template).

**Layout** (matches `doc/ref/old_header.png`):

```
[ Character Type _____________ ]   [ Portrait (actor.img) ]
[ Character Name _____________ ]
[ Height ____  Weight ____  Sex ____  Age ____ ]
[ Physical Description _______________________________ ]
[ __________________________________________________ ]
```

The portrait is displayed in the top-right corner using `<img src="{{actor.img}}" ...>`. Clicking it should open the Foundry default file-picker (use `data-action="editImage"` or the built-in ApplicationV2 behavior for `document-image`).

This is primarily a **DataModel + template + CSS** task. No new roll logic.

## EXAMPLES:

- `doc/ref/old_header.png` — **Primary visual reference.** Defines field order, grouping, and proportions. The portrait lives in the top-right corner.
- `templates/actors/character-sheet.hbs` — existing tabbed sheet. Add the new `header` tab nav entry and tab panel following the same pattern used by `attributes`, `skills`, `combat`, etc.
- `modules/actors/character-data.mjs` — existing DataModel. Add the six new `StringField` entries here.
- `styles/starwarsd6.css` — add new CSS scoped under `.starwarsd6.sheet` for the header tab layout.
- `PRPs/feats/feat016_pc_combat_tab_style.md` — reference for how a pure template+CSS tab PRP is structured.

## DOCUMENTATION:

- `doc/fvtt/fvtt_sysdev.md` — Foundry v13 sheet patterns (ApplicationV2, tab registration, `_prepareContext`).
- `doc/rules-reference.md` — confirm which bio fields are referenced in game rules (none expected, but verify).
- `ref/dnd5e/module/` — reference for ApplicationV2 tab wiring and DataModel `StringField` usage.
- Foundry v13 docs: `ActorSheet` image editing via `data-edit="img"` or ApplicationV2 equivalent.

## OTHER CONSIDERATIONS:

- **New DataModel fields** must be declared in `character-data.mjs` with `new fields.StringField({ required: false, initial: "" })`. Do not hardcode defaults in the template.
- **Tab registration:** the new tab must be added to the `tabs` array in `_getTabs()` (or equivalent) in `character-sheet.mjs` with a matching `id`, `group`, and `label` localization key.
- **Localization:** add keys for all new field labels and the tab name in `lang/en.json` before using them in the template.
- **Portrait editing:** use whatever mechanism the existing sheet already uses for `actor.img` editing — do not introduce a new pattern.
- **No TypeScript, no build step** — plain CSS and Handlebars only.
- **CSS scope:** all new rules scoped under `.starwarsd6.sheet .tab[data-tab="header"]` to avoid leaking.
