## FEATURE: Remove per-round FP/CP expenditure cap — delegate enforcement to the GM

Remove all automation that limits Force Points (FP) and Character Points (CP) to one spend per round. The system currently tracks this via the `fpSpentThisRound` flag and the "New Round" button/hook; all of that machinery must be deleted. The GM will manage the rule at the table.

**Exact changes required:**

1. **`modules/apps/character-sheet.mjs`** — in every roll handler (`#rollSkill`, `#rollAttribute`, `#rollCombat`, `#rollForceSkill`), remove:
   - The `fpSpent` variable and `getFlag("starwarsd6", "fpSpentThisRound")` call
   - The `canSpendFP: !fpSpent` guard — replace with `canSpendFP: true`
   - The `setFlag("starwarsd6", "fpSpentThisRound", true)` call inside the `if (useForcePoint)` block

2. **`modules/apps/character-sheet.mjs`** — delete the entire `#newRound` static method (lines ~566–572) and remove `newRound: CharacterSheet.#newRound` from the actions map.

3. **`starwarsd6.mjs`** — delete the `Hooks.on("combatRound", ...)` block (~lines 72–76) that resets the flag for all combatants.

4. **`templates/dice/roll-dialog.hbs`** — the `{{#if canSpendFP}}` block and `hasFP` logic stay; only the `canSpendFP` **value** changes (always `true` now). No template changes needed unless the "New Round" button lives in a sheet template — locate and remove it.

5. **`lang/en.json`** — remove any localization keys tied exclusively to the "New Round" button if they exist.

## EXAMPLES:

No dedicated examples folder. Reference existing roll handlers in `modules/apps/character-sheet.mjs` — the four methods `#rollSkill`, `#rollAttribute`, `#rollCombat`, `#rollForceSkill` all follow the same pattern and must all be updated consistently.

## DOCUMENTATION:

- `doc/rules-reference.md` — authoritative source; confirm the per-round cap rule is a house-rule that is being **dropped**, not a core rule being overridden
- `doc/implementation-plan.md` — update Phase 5 (CP/FP) to reflect that mutual exclusivity is no longer enforced by code
- `ref/dnd5e/module/` — ApplicationV2 patterns; no special relevance here but consult for flag usage if uncertain

## OTHER CONSIDERATIONS:

- **Four roll sites, not one.** The `fpSpentThisRound` guard appears in `#rollSkill`, `#rollAttribute`, `#rollCombat`, and `#rollForceSkill`. Miss any one and the cap is only partially removed.
- **Flag data persists on existing actors.** Actors saved before this change may have `flags.starwarsd6.fpSpentThisRound = true` frozen on them. No migration needed (the flag is simply ignored once no code reads it), but do not leave any read of it in the codebase.
- **`RollDialog.prompt` signature.** `canSpendFP` is now always `true` when the actor has FP; pass `canSpendFP: fp > 0` (same as `hasFP`). Do not remove `canSpendFP` from the dialog API — it may still be useful to hide the checkbox when an actor structurally cannot spend FP (e.g. non-force-sensitive NPC).
- **`#newRound` removal.** Check whether the "New Round" button is wired in a Handlebars template via `data-action="newRound"`. If so, remove that button element from the template too, or the action will silently fail (Foundry will log a warning).
- **No CP per-round cap exists in code.** The original design noted mutual exclusivity (FP and CP cannot both be spent in the same round), but no `cpSpentThisRound` flag was ever implemented. Verify by grepping — nothing to remove on the CP side beyond the FP/CP mutual exclusivity enforced via `canSpendFP: !fpSpent`.
- **Tests.** Update or remove any unit/integration tests that assert the per-round cap behaviour. Add a test confirming that two consecutive FP spends on the same actor in the same round are both accepted.
- **`doc/implementation-plan.md` and `doc/rules-reference.md` must be updated** to reflect that this restriction is no longer enforced by the system.
