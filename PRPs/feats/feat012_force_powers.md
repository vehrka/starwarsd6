# feat012 — Force Powers Item Type

## Summary

Add a `forcePower` item type so Force-sensitive characters can own, document, and manage their Force powers from the Force tab.

## User Story

As a player with a Force-sensitive character, I want to add Force powers as items so I can see their difficulty, track which ones I'm keeping up, and know at a glance whether using one earns a Dark Side Point.

## Behaviour

- A new item type `forcePower` with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `controlDifficulty` | string | Difficulty for the Control roll (e.g. "Moderate", "15") |
| `senseDifficulty` | string | Difficulty for the Sense roll — blank if not required |
| `alterDifficulty` | string | Difficulty for the Alter roll — blank if not required |
| `requiredPowers` | string | Comma-separated list of prerequisite power names |
| `canKeepUp` | boolean | Whether the power can be maintained continuously |
| `keptUp` | boolean | Whether the character is currently keeping this power up (only relevant if `canKeepUp` is true) |
| `darkSideWarning` | boolean | If true, using this power automatically grants a DSP |
| `timeToUse` | string | Activation time; blank defaults to "one round" |
| `effect` | string | Mechanical description of what the power does |

- The Force tab shows a **Force Powers** section listing all `forcePower` items owned by the actor (only visible when `forceSensitive === true`).
- Each row shows: power name, required skills, can-keep-up indicator, dark side warning badge, and a toggle button for `keptUp` (mirroring the `equipped` toggle on weapons/armor).
- **Toggling `keptUp`** on a power replaces the manual kept-up powers text list (current `keptUpPowers` ArrayField). The `keepUpPenalty` should be derived from the count of `forcePower` items where `canKeepUp && keptUp`, not from the free-text array.
- A `forcePower` item has its own item sheet showing all fields in a form.
- Double-clicking a power row opens its item sheet (same pattern as weapons/armor).

## Out of Scope

- Auto-rolling the power's difficulty from the sheet (can be a future feat).
- A compendium of built-in powers.
- Drag-and-drop from compendium to actor.

## Notes

- `keptUpPowers` ArrayField on `CharacterData` becomes redundant once `forcePower` items drive the keep-up penalty. Migration: derive `keepUpPenalty` from items, keep the ArrayField for now but stop using it in `prepareDerivedData()` once items are the source of truth.
- Pattern to follow: `weapon.mjs` / `weapon-data.mjs` for item class + data model; combat tab weapons section for the sheet list with toggle button.
