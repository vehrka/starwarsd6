## Phase 2 — Dice Engine

**Goal:** Clicking a skill/attribute on the sheet opens a roll dialog (choose number of actions), rolls with Wild Die, posts result to chat with complication/explosion annotations.

**Complexity:** M | **Dependencies:** Phase 1

### Files to create:
- `modules/helpers/dice.mjs` — core dice logic
- `modules/apps/roll-dialog.mjs` — `RollDialog` for choosing number of actions

### Key functions in `modules/helpers/dice.mjs`:

```js
// rollWithWildDie(dice, pips, multipleActionPenalty = 0) → Promise<RollResult>
// 1. effective = max(1, dice - multipleActionPenalty)
// 2. Roll (effective - 1) normal d6s
// 3. Roll 1 wild d6
// 4. If wild === 6: add 6, reroll, repeat (chain)
// 5. If wild === 1: flag isComplication=true (default: add 1 normally)
// 6. total = normalDice.total + wildTotal + pips

// rollDamage(dice, pips) → Promise<Number>
// No wild die — just new Roll(`${dice}d6 + ${pips}`).evaluate()
```

Use `new Roll("1d6").evaluate()` for each component. Store all intermediate wild die rolls for chat display.

**`RollDialog`** — extends `HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2)`. Input: number of actions (1–4). Returns `{ numActions }` or null (cancelled).

**Sheet wiring** via `static DEFAULT_OPTIONS.actions`:
```js
actions: {
  rollSkill: CharacterSheet.#rollSkill,
  rollAttribute: CharacterSheet.#rollAttribute
}
```
Template buttons: `data-action="rollSkill" data-skill-id="{{skill.id}}"`.

**Testing:** Click skill → dialog → roll → chat card. Wild die 6 shows chained explosion. Wild die 1 shows complication flag. Two-action penalty reduces dice by 1.

**Ref:** `ref/dnd5e/module/dice/basic-roll.mjs`; `ref/dnd5e/module/applications/dice/roll-configuration-dialog.mjs`.

