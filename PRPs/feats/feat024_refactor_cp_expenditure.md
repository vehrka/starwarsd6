## FEATURE: Refactor CP Expenditure — Repeatable Post-Roll Spend Button

Rewrite the Character Point spend flow so players can click **Spend CP** multiple times on a single chat card. Each click rolls one extra d6, adds the result to the running total displayed on that card, and decrements `characterPoints` by 1. The button disappears automatically when CP reaches 0.

**Scope constraints:**

- Character actors only (not NPCs, not vehicles).
- Only available when the roll was made **without** spending a Force Point (i.e. `useForcePoint === false`).
- No per-round cap — feat023 already removed that machinery; do not re-introduce any flag tracking.
- The button must be hidden (not just disabled) when `characterPoints === 0`.
- Each click is independent: rolls 1d6, no wild die, no pips. The raw d6 value is added directly to the current total.
- The chat card `total-value` span must update in-place (same message, no new card).

**Affected roll sites — all four must be updated consistently:**

- `CharacterSheet.#rollSkill`
- `CharacterSheet.#rollAttribute`
- `CharacterSheet.#rollCombat`
- `CharacterSheet.#rollForceSkill` — Force rolls cannot spend FP and CP in the same roll, but CP spend is still available post-roll if no FP was used.

**Data flow:**

1. `#postRollToChat` embeds `data-actor-id` and `data-roll-total` on the chat card container.
2. A `Hooks.on("renderChatMessage", ...)` listener (or `ChatMessage` click delegation) wires the "Spend CP" button.
3. Handler: read current CP via `game.actors.get(actorId)`, roll `1d6`, update total display, call `actor.update({ "system.characterPoints": cp - 1 })`, hide button if CP is now 0.
4. After rolling, update the chat card in-place:
   - Append the new d6 result to the **Normal dice** list in the card (same format as existing dice entries).
   - Update the `total-value` span with the new running total.
   - Recompute the **Result label** (HIT/MISS for combat rolls, SUCCESS/FAILURE for skill/attribute/force rolls) using the new total against the original difficulty/defense value embedded in the card via `data-difficulty`. Update the result element in-place.
5. If the actor no longer exists or is not a character, do nothing silently.

## EXAMPLES:

No `examples/` folder in this project. Reference existing patterns in:

- `modules/apps/character-sheet.mjs` — `#postRollToChat` (lines ~288–333) for the current chat card HTML structure; the new button and `data-*` attributes go here.
- `modules/apps/character-sheet.mjs` — `#rollSkill`, `#rollAttribute`, `#rollCombat`, `#rollForceSkill` for the `useForcePoint` flag already present in each handler; use it to gate `canSpendCp`.
- `starwarsd6.mjs` — existing `Hooks.on("combatRound", ...)` block (now deleted by feat023) shows the correct pattern for wiring a global hook from the entry point.

## DOCUMENTATION:

- `doc/rules-reference.md` — authoritative source for CP rules. Confirm: CP may be spent multiple times on the same roll (one die per spend), and must be spent **before** the GM declares success/failure. No per-round cap (feat023 removed it).
- `doc/implementation-plan.md` — update Phase 5 (CP/FP) entry to reflect the new multi-spend behaviour.
- `doc/fvtt/fvtt_sysdev.md` — Foundry v13 `ChatMessage` update patterns; use `ChatMessage.updateDocuments` or `message.update({ content })` to mutate the card in-place.
- `ref/dnd5e/module/` — reference for ApplicationV2 and Hooks patterns if uncertain about listener wiring.

## OTHER CONSIDERATIONS:

- **Four roll sites, not one.** `canSpendCp` must be passed from all four handlers to `#postRollToChat`. Missing any one leaves CP spend silently absent on that roll type.
- **In-place card update, not a new message.** The total must update on the existing `ChatMessage`. Use `message.update({ content: newContent })` — do not call `ChatMessage.create`.
- **Button visibility vs. disabled state.** Hide the button (`display:none` or remove from DOM) when CP = 0. Do **not** leave it visible but disabled — disabled buttons confuse players.
- **`canSpendCp` is false when FP was spent.** The `useForcePoint` boolean is already available in every handler. Pass `canSpendCp: !useForcePoint && cp > 0` to `#postRollToChat`.
- **Hook listener must re-read actor CP live.** The CP count on the card at render time may be stale (player spent CP on a prior card). Always call `actor.system.characterPoints` at click time, not from a cached value embedded in the DOM.
- **`data-actor-id` security.** Foundry's default permission model prevents players from updating another actor's data. No extra guard needed — `actor.update()` will silently fail for actors the user does not own.
- **Normal dice list update.** When appending the CP d6 to the Normal dice list, use the same HTML structure as existing dice entries in the card. Do not rebuild the entire dice list — append only the new entry.
- **Result recomputation.** Embed `data-difficulty` and `data-roll-type` (e.g. `"combat"`, `"skill"`) on the chat card container in `#postRollToChat`. On each CP spend, read these values and recompute: HIT if `newTotal >= difficulty`, MISS otherwise (combat); SUCCESS/FAILURE for skill/attribute/force. Update the result element text and any CSS class in-place. The difficulty is static per card — do not re-read from the actor.
- **Tests required.** Add unit tests for: (a) button hidden when CP = 0, (b) button hidden when FP was spent, (c) each click decrements CP by 1 and increments total, (d) button disappears after last CP is spent, (e) new d6 result appended to Normal dice list, (f) result label recomputed correctly after spend (MISS→HIT when new total crosses difficulty, SUCCESS/FAILURE equivalent for skill rolls).
- **Doc updates mandatory.** Update `doc/implementation-plan.md` and `doc/rules-reference.md` after implementation.
