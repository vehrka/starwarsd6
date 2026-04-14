## Phase 8 — Targeted Combat Resolution

**Goal:** Attack rolls resolve automatically against a targeted token's defense values. A hit triggers a damage roll that compares against the target's STR thresholds and suggests which hit box tier to mark. With no target selected, the player inputs a manual difficulty number.

**Complexity:** M | **Dependencies:** Phases 4, 6

> **Why not healing:** Medicine and first aid are applied by a *healer* to another actor — placing those buttons on the patient's own sheet is the wrong UX. Manual Shift+Alt+click on hit boxes is sufficient for GM-adjudicated healing. Stamina recovery is a normal skill roll; the result is applied manually.

### Attack flow — with target

1. Player targets a token (Foundry's standard targeting, `game.user.targets`). Only one target is supported; if multiple are targeted, only the first is used.
2. Player presses Roll Attack on their sheet. System reads defense from the target actor based on weapon type (same RANGED/MELEE/BRAWLING logic already in `#rollAttack`):
   - Ranged weapons → `target.system.rangedDefense`
   - Melee weapons → `target.system.meleeDefense`
   - Brawling → `target.system.brawlingDefense`
3. Attack chat card shows target name, defense value, and hit/miss result.
4. On a **hit**: a "Roll Damage" button appears in the chat card.
5. Player clicks "Roll Damage" — rolls `damageDice`d6 + `damagePips` (no wild die).
6. Damage total compared against `target.system.damageBase` → tier resolved via `resolveDamageTier`.
7. Chat card appends the damage total, resolved tier, and a **"Mark Hit Box"** button.
8. Clicking "Mark Hit Box" calls `applyDamage(targetActor, tier)` on the target actor. Button is GM-only (only the GM has write access to other actors); uses a socket call for non-owner players.

### Attack flow — without target

1. `RollDialog` gains an optional "Difficulty" number input (shown when no target is selected).
2. Roll resolves against that number. Chat card shows difficulty and hit/miss.
3. No "Roll Damage" button — GM adjudicates damage and marks manually via hit-box controls.

### Files to create:
- `modules/helpers/socket.mjs` — `requestApplyDamage(targetActorId, tier)` — emits a socket message for the GM client to call `applyDamage` when the player is not the target's owner

### Files to modify:
- `modules/apps/character-sheet.mjs` — `#rollAttack`: check `game.user.targets`; branch on target vs. no-target; pass target actor and defense to `#postAttackToChat`
- `modules/helpers/damage.mjs` — add `rollDamage(damageDice, damagePips) → Promise<number>` (plain Nd6 + pips, no wild die)
- `modules/apps/roll-dialog.mjs` — add optional "Difficulty" number input rendered when `noTarget: true` is passed
- `modules/apps/character-sheet.mjs` — `#postAttackToChat`: embed target actor id and weapon damage in chat message flags; add "Roll Damage" and "Mark Hit Box" button handlers wired via `Hooks.on("renderChatMessage", ...)`
- `starwarsd6.mjs` — register socket handler on `Hooks.once("ready", ...)`
- `lang/en.json` — target name label, difficulty label, roll damage, mark hit box, no target warning

### Key implementation notes:

**Reading target defense:** `game.user.targets` is a `Set<Token>`. Get the actor via `token.actor`. Both `CharacterData` and `NpcData` expose `rangedDefense`, `meleeDefense`, `brawlingDefense` — no type check needed.

**Chat message flags:** Store `{ targetActorId, damageDice, damagePips, damageBase, hit }` as flags on the `ChatMessage` so the "Roll Damage" and "Mark Hit Box" handlers can retrieve them without closing over sheet state.

**Socket pattern:**
```js
// In socket.mjs
game.socket.on("system.starwarsd6", async ({ action, targetActorId, tier }) => {
  if (!game.user.isGM) return;
  if (action === "applyDamage") {
    const actor = game.actors.get(targetActorId);
    if (actor) await applyDamage(actor, tier);
  }
});
```

**Testing:** Target a character with STR 3D (base=10, 3 hit boxes/tier). Roll ranged attack — chat shows target's rangedDefense. On hit, click "Roll Damage" — result 15 → wound tier. GM clicks "Mark Hit Box" → target gains one wound mark. With no target, enter difficulty 12 — roll resolves against 12, no damage button shown.

