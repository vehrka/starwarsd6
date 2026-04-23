## FEATURE:

When a player spends Character Points on an attack roll card that was initially a MISS, and the
running total crosses the defense value (MISS → HIT), the **Roll Damage** button must automatically
appear on the card — identical to the button rendered at roll time for an initial HIT with a target.

### Behaviour

- Attack card rendered as MISS with a targeted token: no Roll Damage button shown initially.
- Player clicks "Spend CP (+1D)" one or more times; total crosses defense value → label flips to HIT.
- At that moment the CP spend handler injects a `<div class="damage-action">` block with the
  `.roll-damage-btn` button into both the stored content (`chatMsg.update`) and the live DOM.
- Subsequent CP clicks that keep the total above defense: button already present, do not duplicate.
- If no target was selected at roll time (no `targetActor`): no damage button is ever injected
  (can't roll damage without a target).
- The injected button must carry the same `data-*` attributes as a roll-time hit button:
  `data-target-actor-id`, `data-target-token-id`, `data-damage-dice`, `data-damage-pips`,
  `data-damage-base`.

### Data required at click time

The CP spend handler in `starwarsd6.mjs` runs inside `renderChatMessageHTML` and only has access
to the live DOM / stored HTML. All weapon and target data must therefore be embedded as `data-*`
attributes on the `.starwarsd6.roll-result` container at card creation time, even when the initial
result is a MISS.

Attributes to add to the container (already has `data-actor-id`, `data-difficulty`,
`data-roll-type`):

```
data-target-actor-id   — targetActor.id  (empty string if no target)
data-target-token-id   — targetTokenId   (empty string if no target)
data-damage-dice       — weapon.system.damageDice
data-damage-pips       — weapon.system.damagePips
data-damage-base       — targetActor.system.damageBase (empty string if no target)
```

### Logic in the CP spend handler (starwarsd6.mjs)

After recomputing the result label for `rollType === "combat"`:

```js
// Only inject damage button if: was MISS, is now HIT, has target data, button not already present
const wasHit = /* old total >= difficulty — compute before updating total */;
if (!wasHit && isSuccess && rollType === "combat") {
  const targetActorId = container.dataset.targetActorId;
  if (targetActorId) {
    const alreadyHasDmgBtn = container.querySelector(".roll-damage-btn");
    if (!alreadyHasDmgBtn) {
      const dmgDiv = doc.createElement("div");
      dmgDiv.className = "damage-action";
      dmgDiv.innerHTML = `<button type="button" class="roll-damage-btn"
        data-target-actor-id="${targetActorId}"
        data-target-token-id="${container.dataset.targetTokenId}"
        data-damage-dice="${container.dataset.damageDice}"
        data-damage-pips="${container.dataset.damagePips}"
        data-damage-base="${container.dataset.damageBase}">
        ${game.i18n.localize("STARWARSD6.Combat.RollDamage")}
      </button>`;
      // Insert before .cp-action if present, else append
      const cpBlock = container.querySelector(".cp-action");
      if (cpBlock) container.insertBefore(dmgDiv, cpBlock);
      else container.appendChild(dmgDiv);
      // Mirror to live DOM
      const liveCpBlock = liveContainer?.querySelector(".cp-action");
      const liveDmgDiv = dmgDiv.cloneNode(true);
      if (liveCpBlock) liveContainer.insertBefore(liveDmgDiv, liveCpBlock);
      else liveContainer?.appendChild(liveDmgDiv);
    }
  }
}
```

The newly injected `.roll-damage-btn` in the live DOM will NOT have a click listener yet — it will
be wired automatically when `chatMsg.update()` triggers a re-render and `renderChatMessageHTML`
fires again.


## EXAMPLES:

- `starwarsd6.mjs` lines 73–152 — existing `renderChatMessageHTML` hook with `.roll-damage-btn`
  and `.mark-hit-box-btn` wiring. The CP spend handler (lines 154–260) already handles label
  recompute for combat. Extend that block.
- `modules/apps/character-sheet.mjs` `#postAttackToChat` (~line 517) — where the container HTML
  is built. Add the five new `data-*` attributes here unconditionally (whether hit or miss).


## DOCUMENTATION:

- `doc/rules-reference.md` §Character Points — CP spend is post-roll pre-resolution; MISS→HIT
  is a valid outcome.
- `PRPs/PRP-feat024_refactor_cp_expenditure.md` — feat024 context; this feat extends the combat
  label recompute block added there.
- Foundry v13 `ChatMessage.update({ content })` — same pattern already used in feat024.
- `renderChatMessageHTML` hook re-fires after `chatMsg.update()`, re-wiring new buttons
  automatically — no manual listener attachment needed for the injected damage button.


## OTHER CONSIDERATIONS:

- **`wasHit` must be computed from old total, before `newTotal` is calculated.** Read
  `oldTotal` from the stored span, compare to `difficulty` — that is the pre-click outcome.
- **Do not duplicate the damage button.** Guard with `container.querySelector(".roll-damage-btn")`.
  Multiple CP clicks after the threshold must not inject multiple buttons.
- **No target = no button.** If `container.dataset.targetActorId` is empty string or missing,
  skip injection entirely.
- **Insertion order matters.** Damage button must appear BEFORE the `.cp-action` block so the
  card layout matches a roll-time hit card (damage action above CP action).
- **`data-*` attributes on container are new** — `#postAttackToChat` must unconditionally embed
  all five damage-related `data-*` attributes on the `.starwarsd6.roll-result` div, even when
  `isHit` is false or `targetActor` is null (use empty string for absent values).
- **`cloneNode(true)` for live DOM injection** — the `doc` (DOMParser document) and the live
  `html` element are separate DOM trees; you cannot move a node between them directly.
- **No `ChatMessage.create`** — always mutate via `chatMsg.update({ content })`.
- **No flag tracking** — all data lives in `data-*` attributes on the container.
- **The `flags` object on `ChatMessage.create`** in `#postAttackToChat` currently only sets
  flags when `isHit && targetActor`. This does not need to change — flags are not used by the
  CP spend handler.
- **Test coverage**: add a unit test asserting that when `rollType=combat`, `oldTotal < difficulty`,
  `newTotal >= difficulty`, and `targetActorId` is set, the stored content gains a
  `.roll-damage-btn` element after the handler runs.
