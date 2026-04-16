## FEATURE: Restyle the PC Combat Tab to match reference layout

Redesign the Combat tab on the character sheet (`templates/actors/character-sheet.hbs` + `styles/starwarsd6.css`) to match the visual layout in `doc/ref/combat_tab_ref.png`.

The reference image defines two main sections, in this order:

**Section 1 — Weapons** (top)
A table of equipped weapons (keep the existing `<table class="combat-weapons-table">` structure). Move it to the top of the tab. Columns:
- Weapon name
- Damage die pool (e.g. `5D+2`)
- Attack skill die pool (e.g. `5D+1`)
- Roll attack button (`data-action="rollAttack"`, `data-weapon-id="..."`)

The current table already has these columns except damage and skill are separate from the roll button. Consolidate so all four are visible in one row — no second line needed.

**Section 2 — Wounds** (bottom)
Starts with a section caption ("WOUNDS"), followed immediately by the three defense values inline:
- Ranged Defense, Melee Defense, Brawling Defense — displayed as labeled values on one line, sourced from `combatData.rangedDefense`, `combatData.meleeDefense`, `combatData.brawlingDefense`.

Below the defense values, a 2×2 grid of wound-tier cells. Each cell has exactly two lines:
1. Tier name + threshold range (e.g. `Stunned (<10)`, `Wounded (10–19)`)
2. The hit boxes for that tier (clickable, `data-action="markHitBox"`, `data-tier="..."`)

Grid layout:
```
[ Stunned (<threshold)        ]  [ Wounded (threshold–threshold)   ]
[ [■ □ □ hit boxes]           ]  [ [■ □ □ hit boxes]               ]

[ Incapacitated (range)       ]  [ Mortally Wounded (range+)       ]
[ [□ □ □ hit boxes]           ]  [ [□ □ □ hit boxes]               ]
```

Remove the existing standalone Defense table (`combat-defense-table`), the Damage Thresholds table, and the Wound Penalties block — their data is now surfaced in this section. The hit-box hint text can be removed too.

No new data model fields. No new MJS logic. This is a pure template + CSS restyling task.

## EXAMPLES:

- `doc/ref/combat_tab_ref.png` — **Primary reference**. The target visual layout. Weapon entries show name, damage, and skill in a table with a roll button per row; and the 2×2 wound grid with threshold ranges and consequence labels. But take into account that we changed things from the image.
- `templates/actors/character-sheet.hbs` lines 208–347 — current Combat tab markup. The data bindings (`combatData.*`) are correct and must be preserved; only the HTML structure and CSS classes change.
- `styles/starwarsd6.css` lines 425–521 — existing combat tab styles (`combat-defense-table`, `hit-box-tracker`, etc.) to be revised or extended.

## DOCUMENTATION:

- `doc/rules-reference.md` — authoritative source for threshold values and tier names (Stun / Wound / Incapacitated / Mortally Wounded). Thresholds are derived from STR; the template already receives them via `combatData.thresholdStun`, `combatData.thresholdWound`, `combatData.thresholdIncap`, `combatData.thresholdMortal`.
- `doc/fvtt/fvtt_sysdev.md` — Foundry v13 sheet patterns (ApplicationV2).
- `PRPs/feats/feat006-combat.md` and `prp-feat006-combat.md` — original combat tab spec; background on what data is available.
- `PRPs/feats/feat008-add-damage-threshold-table.md` — spec for the threshold table already rendered in the tab.

## OTHER CONSIDERATIONS:

- **Data bindings must not change.** All `combatData.*` Handlebars references (`stunBoxes`, `woundBoxes`, `incapBoxes`, `mortalBoxes`, `weapons`, `thresholdStun`, etc.) must remain wired to the same variables. Only restructure the surrounding HTML.
- **Hit boxes stay interactive.** Each `.hit-box` button must keep `data-action="markHitBox"` and `data-tier="..."` attributes so the existing click handler in `character-sheet.mjs` continues to work.
- **Only equipped weapons appear** in Section 1 — `combatData.weapons` already contains only equipped weapons; do not change the filter.
- **The consequence label** (e.g. `3 = Incapacitated`) is derived from `STR_dice` hit boxes per tier — it is a display-only string. Compute it in the template using `combatData.stunBoxes.length`, etc., or add a pre-computed field in `_prepareCombatData` in `character-sheet.mjs` if the expression is non-trivial.
- **No new localization keys** unless the consequence labels (`N = Unconscious`, etc.) are not already present in `lang/en.json`. Check before adding.
- **CSS scope:** all new rules must be scoped under `.starwarsd6.sheet` to avoid leaking into other system sheets.
- **No TypeScript, no build step** — plain CSS and Handlebars only.
