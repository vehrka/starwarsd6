## Phase 5 — Character Points & Force Points

**Goal:** CP/FP tracked on sheet. CP adds +1D post-roll. FP doubles all dice for one round. Mutual exclusivity enforced.

**Complexity:** M | **Dependencies:** Phase 2

### Files to modify:
- `modules/apps/character-sheet.mjs` — CP/FP display in header; spend action buttons
- `modules/helpers/dice.mjs` — extend `rollWithWildDie` with `{ extraDice, doubled }` options
- `templates/actors/character-sheet.hbs` — CP/FP counters in header; "Spend CP" button in chat card; FP checkbox in `RollDialog`

### Interaction flow:

**Character Point:** After roll resolves, "Spend CP" button in chat card (if actor has CP > 0). Clicking rolls 1 extra die, adds to total, decrements `characterPoints` via `actor.update()`.

**Force Point:** Checkbox in `RollDialog`. If checked, `doubled = true` → `effectiveDice = dice × 2`. Decrements `forcePoints` via `actor.update()`.

**Mutual exclusivity:** Track `fpSpentThisRound` via `actor.setFlag("starwarsd6", "fpSpentThisRound", true)`. Clear via a "New Round" button or `combatRound` hook.

**Testing:** CP=3, roll skill, click "Spend CP" → +1D added, CP→2. FP spend doubles dice. Both same round → second button disabled.

