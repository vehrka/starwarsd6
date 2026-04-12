# PRP-feat008 — Damage Threshold Table on Combat Tab

## Goal

Display the character's derived damage thresholds as a read-only reference table on the Combat tab, between the Defense section and the Wound Penalties section.

End state:
- A table with four rows (Stun / Wound / Incapacitated / Mortally Wounded) and their numeric threshold ranges is visible on the Combat tab
- Values are derived live from the character's STR attribute — no manual input
- The table is purely informational; no new interaction is added

## Why

Players currently have no visual reference for what damage totals trigger each wound tier. They must mentally compute `floor(3.5 × STR_dice) + STR_pips` mid-combat. Showing the table on the sheet eliminates this calculation and speeds up damage resolution.

The `base` value is already computed by `calculateDamageThresholds()` in `damage.mjs` — exposing it in the sheet is a pure display change.

