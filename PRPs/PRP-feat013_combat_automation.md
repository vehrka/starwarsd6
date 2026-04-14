# PRP-feat013 — Targeted Combat Resolution

## Goal

Attack rolls auto-resolve against a targeted token's defense. A hit reveals a "Roll Damage" button in the chat card. Damage is compared to the target's STR thresholds and a "Mark Hit Box" (GM-only) button applies the result. With no target selected, the player enters a manual difficulty number instead.

## Why

- Players currently roll attacks with no automatic resolution — they must manually compare roll totals to defense values and mark hit boxes. This breaks flow and creates errors.
- Targets are already available via `game.user.targets` (Foundry standard). The system already stores `rangedDefense`, `meleeDefense`, and `brawlingDefense` on both actor types.
- `applyDamage()` already exists and is correct — it just needs to be callable from a chat card button, including via socket for non-owner players.

## What

### Attack flow — with target

1. Player targets a token (Foundry standard `game.user.targets` Set).
2. Player presses Roll Attack on their character sheet.
3. System reads defense from the **target actor** based on weapon type (same RANGED/MELEE/BRAWLING skill classification already in `#rollAttack`).
4. Attack chat card shows: target name, attack total vs. target defense, hit/miss result.
5. On **hit**: a "Roll Damage" button appears in the chat card.
6. Player clicks "Roll Damage" — rolls flat `damageDice`d6 + `damagePips` (no wild die). Uses `rollDamage()` from `modules/helpers/dice.mjs` (already implemented there).
7. Damage total compared against `target.system.damageBase` → tier resolved via `resolveDamageTier()`.
8. Chat card updated: shows damage total, resolved tier, and "Mark Hit Box" button.
9. "Mark Hit Box" is **GM-only** — non-owner players emit a socket message; GM client calls `applyDamage(targetActor, tier)`.

### Attack flow — without target

1. `RollDialog` gains an optional "Difficulty" number input (shown when `noTarget: true` is passed).
2. Roll resolves against that difficulty number.
3. Chat card shows difficulty and hit/miss. **No "Roll Damage" button** — GM adjudicates manually.

### Success Criteria

- [ ] Targeting a token before rolling attack: chat card shows target name and their defense value, correct hit/miss
- [ ] Hit shows "Roll Damage" button; Miss does not
- [ ] Roll Damage button produces flat dice roll (no wild die), tier resolved, "Mark Hit Box" button appears
- [ ] GM clicking "Mark Hit Box" applies damage to target actor (hit boxes update)
- [ ] Non-GM player clicking "Mark Hit Box" triggers socket → GM client calls `applyDamage`
- [ ] No target selected: RollDialog shows Difficulty number input; roll resolves vs. that number; no damage button
- [ ] Multiple targets selected: only first is used (no error thrown)
- [ ] All new strings in `lang/en.json`
- [ ] Existing CP-spend, FP-spend, and skill-roll functionality unaffected

---

## All Needed Context

### Documentation & References

```yaml
- file: modules/apps/character-sheet.mjs
  why: PRIMARY FILE TO MODIFY.
       #rollAttack (line 348): currently reads attacker's OWN defense — must be changed to
         read TARGET's defense when game.user.targets.size > 0.
       #postAttackToChat (line 484): must accept targetActorId, damageDice, damagePips, damageBase
         and embed them as data attributes on the "Roll Damage" button.
       PATTERN for actions: static async #methodName(event, target) { ... }
       PATTERN for chat: build HTML string → ChatMessage.create({ speaker, content, flags }).

- file: modules/helpers/dice.mjs
  why: rollDamage(dice, pips) → Promise<number> ALREADY EXISTS at line 76.
       Rolls flat Nd6+pips with no wild die using Foundry Roll API.
       Import and use this — DO NOT re-implement in damage.mjs.

- file: modules/helpers/damage.mjs
  why: applyDamage(actor, tier) and resolveDamageTier(damageTotal, base) ALREADY EXIST.
       resolveDamageTier is used to determine which tier to mark.
       applyDamage is the function the socket handler will call on the GM side.

- file: modules/apps/roll-dialog.mjs
  why: PATTERN to extend for adding the optional Difficulty input.
       Static private fields: #canSpendFP, #hasFP, #isForceRoll — ADD #noTarget.
       _prepareContext passes booleans to template → ADD noTarget.
       #onSubmit reads formData.object — ADD difficulty field parsing (clamp 0–99).

- file: templates/dice/roll-dialog.hbs
  why: TEMPLATE TO MODIFY — add {{#if noTarget}} block for difficulty input.
       Pattern: same as isForceRoll block (lines 15–20).

- file: starwarsd6.mjs
  why: ALL HOOKS REGISTERED HERE.
       renderChatMessageHTML hook (line 57) is the existing pattern for wiring chat button clicks.
       ADD: Hooks.once("ready", ...) block to register socket handler.
       ADD: Hooks.on("renderChatMessageHTML", ...) handler for "Roll Damage" and "Mark Hit Box" buttons.
       Socket setup MUST be in "ready" (not "init") — game.socket is not available in "init".

- file: lang/en.json
  why: ALL user-visible strings must be localized. Add keys for:
       STARWARSD6.Combat.Target, STARWARSD6.Combat.Difficulty,
       STARWARSD6.Combat.RollDamage, STARWARSD6.Combat.MarkHitBox,
       STARWARSD6.Combat.DamageTier, STARWARSD6.Combat.NoTarget,
       STARWARSD6.Combat.DamageTotal

- file: modules/actors/npc-data.mjs
  why: NPC actors have rangedDefense, meleeDefense, brawlingDefense as DIRECT NumberFields
       (not derived from skills). Access via token.actor.system.rangedDefense — works the same
       as characters. damageBase is a derived field (prepareDerivedData sets it from STR).

- file: modules/actors/character-data.mjs
  why: Character actors derive rangedDefense/meleeDefense/brawlingDefense in prepareDerivedData()
       via calculateRangedDefense/calculateMeleeDefense/calculateBrawlingDefense from defense.mjs.
       Both actor types expose the same interface — no type check needed when reading target defense.
```

### Current Codebase Tree (relevant files)

```
starwarsd6/
├── starwarsd6.mjs                        ← Entry point, all hooks registered here
├── modules/
│   ├── actors/
│   │   ├── character-data.mjs            ← rangedDefense/meleeDefense/brawlingDefense derived
│   │   ├── character.mjs
│   │   ├── npc-data.mjs                  ← defense values as direct NumberFields
│   │   └── npc.mjs
│   ├── apps/
│   │   ├── character-sheet.mjs           ← #rollAttack and #postAttackToChat to modify
│   │   ├── npc-sheet.mjs
│   │   └── roll-dialog.mjs               ← Add noTarget + difficulty input
│   ├── helpers/
│   │   ├── damage.mjs                    ← applyDamage, resolveDamageTier (both exist)
│   │   ├── defense.mjs
│   │   ├── dice.mjs                      ← rollDamage already exists here
│   │   ├── force.mjs
│   │   └── socket.mjs                    ← CREATE THIS FILE
├── templates/
│   ├── actors/character-sheet.hbs
│   └── dice/roll-dialog.hbs              ← Add difficulty input block
└── lang/
    └── en.json                           ← Add new keys
```

### Desired Codebase Changes

```
MODIFY starwarsd6.mjs
  - ADD import for requestApplyDamage from modules/helpers/socket.mjs
  - ADD Hooks.once("ready") for socket.on registration
  - ADD renderChatMessageHTML handler for roll-damage-btn and mark-hit-box-btn

CREATE modules/helpers/socket.mjs
  - Export requestApplyDamage(targetActorId, tier)
  - Internal: game.socket.emit("system.starwarsd6", { action: "applyDamage", targetActorId, tier })

MODIFY modules/apps/roll-dialog.mjs
  - Add #noTarget private field
  - Pass noTarget option from prompt()
  - Add difficulty to _prepareContext and #onSubmit (return value)

MODIFY templates/dice/roll-dialog.hbs
  - Add {{#if noTarget}} difficulty number input block

MODIFY modules/apps/character-sheet.mjs
  - #rollAttack: detect game.user.targets → branch to target vs. no-target path
  - #postAttackToChat: accept targetActorId + weapon damage data; embed flags; show Roll Damage button on hit

MODIFY lang/en.json
  - Add 7 new localization keys

CREATE tests/unit/socket.test.mjs
  - Unit tests for handleSocketMessage and requestApplyDamage
```

### Known Gotchas

```js
// CRITICAL: game.socket is NOT available in Hooks.once("init") — register socket in "ready"
// WRONG:
Hooks.once("init", () => { game.socket.on(...) }); // throws — socket not ready
// CORRECT:
Hooks.once("ready", () => { game.socket.on("system.starwarsd6", ...) });

// CRITICAL: game.user.targets is a Set<Token> — get actor via token.actor
// WRONG: game.user.targets.first() — no .first() on Set
// CORRECT:
const targets = [...game.user.targets];
const targetToken = targets[0];  // undefined if empty
const targetActor = targetToken?.actor;

// CRITICAL: ChatMessage flags vs. data attributes in HTML
// Flags (chatMsg.flags) survive message updates. Use them for the socket call.
// Data attributes on buttons (data-target-actor-id) are convenient for click handlers
// but disappear if content is re-parsed. Use BOTH: embed data-* AND store flags.
// Pattern: await ChatMessage.create({ speaker, content, flags: { starwarsd6: { ... } } })

// CRITICAL: renderChatMessageHTML fires on EVERY render including after update()
// The "Roll Damage" button click handler must update the message content and disable the button
// after resolving — same pattern as the CP spend button in starwarsd6.mjs lines 58–98.

// CRITICAL: "Mark Hit Box" must be GM-only in the UI — non-GM players should still see it
// but clicking emits socket instead of calling applyDamage directly.
// Check game.user.isGM — if true, call applyDamage directly; if false, call requestApplyDamage.

// CRITICAL: rollDamage is in dice.mjs NOT damage.mjs — import from correct location:
// import { rollDamage } from "../helpers/dice.mjs";   ← in character-sheet.mjs
// The feat file says to add it to damage.mjs but it ALREADY EXISTS in dice.mjs.

// CRITICAL: RANGED_SKILLS list in #rollAttack is local — must also apply same classification
// to read TARGET defense. Extract or inline the same logic:
// RANGED_SKILLS = ["blaster", "starship gunnery", "starfighter piloting"]
// MELEE_SKILLS  = ["melee combat"]
// Brawling = everything else (including "brawling")

// CRITICAL: applyDamage socket — only the GM client should respond.
// The emit goes to ALL clients; the handler must guard: if (!game.user.isGM) return;

// CRITICAL: ChatMessage.create vs. chatMsg.update()
// For Roll Damage result: update the SAME message that contained the Roll Damage button.
// Retrieve via: const msgId = btn.closest("[data-message-id]").dataset.messageId;
// Then: const chatMsg = game.messages.get(msgId);
// Then: parse content with DOMParser, append damage section, disable button, call chatMsg.update()
// This is the SAME pattern as the CP spend at starwarsd6.mjs:77–97.
```

---

## Implementation Blueprint

### Task 1: Create `modules/helpers/socket.mjs`

```js
// modules/helpers/socket.mjs
// Emit a socket message asking the GM client to apply damage to a target actor.
// The handler is registered in starwarsd6.mjs Hooks.once("ready").

import { applyDamage } from "./damage.mjs";

export function requestApplyDamage(targetActorId, tier) {
  game.socket.emit("system.starwarsd6", { action: "applyDamage", targetActorId, tier });
}

// Called in starwarsd6.mjs ready hook — exported so it can be tested
export async function handleSocketMessage({ action, targetActorId, tier }) {
  if (!game.user.isGM) return;
  if (action === "applyDamage") {
    const actor = game.actors.get(targetActorId);
    if (actor) await applyDamage(actor, tier);
  }
}
```

### Task 2: Extend `RollDialog` for no-target difficulty input

Add private field `#noTarget = false`. In `prompt({ ..., noTarget = false })`, set it. In `_prepareContext`, set `context.noTarget = this.#noTarget`. In `#onSubmit`, parse `difficulty`:

```js
const difficulty = this.#noTarget
  ? Math.min(99, Math.max(0, parseInt(formData.object.difficulty ?? "0")))
  : null;
// Return: { numActions, useForcePoint, forceDifficultyModifier, difficulty }
```

Template addition (after `isForceRoll` block):
```hbs
{{#if noTarget}}
<div class="form-group">
  <label>{{localize "STARWARSD6.Combat.Difficulty"}}</label>
  <input type="number" name="difficulty" value="0" min="0" max="99" />
</div>
{{/if}}
```

### Task 3: Modify `#rollAttack` in `character-sheet.mjs`

```js
static async #rollAttack(event, target) {
  const weaponId = target.dataset.weaponId;
  const weapon = this.document.items.get(weaponId);
  if (!weapon) return;

  const attackSkillName = weapon.system.attackSkill.toLowerCase();
  // ... existing skill lookup ...

  // DETECT TARGET
  const targets = [...game.user.targets];
  const targetToken = targets[0];
  const targetActor = targetToken?.actor ?? null;

  const noTarget = !targetActor;

  // Open dialog — pass noTarget to show difficulty input
  const fp = this.document.system.forcePoints;
  const fpSpent = !!this.document.getFlag("starwarsd6", "fpSpentThisRound");
  const dialogResult = await RollDialog.prompt({ canSpendFP: !fpSpent, hasFP: fp > 0, noTarget });
  if (dialogResult === null) return;

  const { numActions, useForcePoint, difficulty } = dialogResult;
  // ... existing FP spend logic ...
  // ... existing roll logic ...

  // Determine defense type and VALUE
  const RANGED_SKILLS = ["blaster", "starship gunnery", "starfighter piloting"];
  const MELEE_SKILLS = ["melee combat"];
  let defenseLabel, defenseValue;

  if (noTarget) {
    // Use player-entered difficulty
    defenseLabel = game.i18n.localize("STARWARSD6.Combat.Difficulty");
    defenseValue = difficulty ?? 0;
  } else {
    // Read from TARGET actor
    if (RANGED_SKILLS.includes(attackSkillName)) {
      defenseLabel = game.i18n.localize("STARWARSD6.Combat.RangedDefense");
      defenseValue = targetActor.system.rangedDefense;
    } else if (MELEE_SKILLS.includes(attackSkillName)) {
      defenseLabel = game.i18n.localize("STARWARSD6.Combat.MeleeDefense");
      defenseValue = targetActor.system.meleeDefense;
    } else {
      defenseLabel = game.i18n.localize("STARWARSD6.Combat.BrawlingDefense");
      defenseValue = targetActor.system.brawlingDefense;
    }
  }

  const isHit = rollResult.total >= defenseValue;

  await CharacterSheet.#postAttackToChat(
    this.document, weapon, rollResult, numActions, defenseLabel, defenseValue,
    targetActor, isHit,
    { cpAvailable: cpNow, fpSpentThisRound: fpSpentNow, keepUpPenalty, penaltyDice, penaltyPips }
  );
}
```

### Task 4: Modify `#postAttackToChat` in `character-sheet.mjs`

Change signature to accept `weapon` (full object for damage data), `targetActor`, `isHit`. Embed flags on the ChatMessage. Add Roll Damage button only when `isHit && targetActor`:

```js
static async #postAttackToChat(actor, weapon, result, numActions, defenseLabel, defenseValue,
                                targetActor, isHit, { cpAvailable = 0, ... } = {}) {
  // ... existing roll display HTML ...

  const targetLine = targetActor
    ? `<div class="roll-target">${game.i18n.localize("STARWARSD6.Combat.Target")}: <strong>${targetActor.name}</strong></div>`
    : "";

  const rollDamageBtn = (isHit && targetActor)
    ? `<div class="damage-action">
         <button type="button" class="roll-damage-btn"
                 data-target-actor-id="${targetActor.id}"
                 data-damage-dice="${weapon.system.damageDice}"
                 data-damage-pips="${weapon.system.damagePips}"
                 data-damage-base="${targetActor.system.damageBase}">
           ${game.i18n.localize("STARWARSD6.Combat.RollDamage")}
         </button>
       </div>`
    : "";

  const content = `
    <div class="starwarsd6 roll-result">
      <h3>${game.i18n.localize("STARWARSD6.Combat.AttackRoll")}: ${weapon.name}</h3>
      ${targetLine}
      <div class="roll-formula">${effectiveDice}D${pipsStr}</div>
      ${penaltyStr}
      <div class="roll-dice">${normalStr}Wild: ${wildStr}${explosion}${complications}</div>
      <div class="roll-total"><strong>${game.i18n.localize("STARWARSD6.Roll.Total")}: <span class="total-value">${result.total}</span></strong></div>
      <div class="roll-defense">${defenseLabel}: ${defenseValue} — ${hitLabel}</div>
      ${cpButton}
      ${rollDamageBtn}
    </div>`;

  // Store damage data in flags for retrieval in the renderChatMessageHTML handler
  const flags = (isHit && targetActor)
    ? { starwarsd6: {
        targetActorId: targetActor.id,
        damageDice: weapon.system.damageDice,
        damagePips: weapon.system.damagePips,
        damageBase: targetActor.system.damageBase
      }}
    : {};

  await ChatMessage.create({ speaker, content, flags });
}
```

### Task 5: Register socket and chat handlers in `starwarsd6.mjs`

In `Hooks.once("ready")` (new hook, separate from init):
```js
import { handleSocketMessage, requestApplyDamage } from "./modules/helpers/socket.mjs";

Hooks.once("ready", () => {
  game.socket.on("system.starwarsd6", handleSocketMessage);
});
```

In `Hooks.once("init")`, extend the existing `renderChatMessageHTML` handler **OR** add a second one — append after the CP section:

```js
// --- Roll Damage button ---
html.querySelectorAll(".roll-damage-btn:not([disabled])").forEach(btn => {
  btn.addEventListener("click", async () => {
    const targetActorId = btn.dataset.targetActorId;
    const damageDice    = parseInt(btn.dataset.damageDice);
    const damagePips    = parseInt(btn.dataset.damagePips);
    const damageBase    = parseInt(btn.dataset.damageBase);

    const damageTotal = await rollDamage(damageDice, damagePips);
    const tier = resolveDamageTier(damageTotal, damageBase);

    // Disable button immediately (prevent double-click)
    btn.disabled = true;

    // Update chat message: append damage result + Mark Hit Box button
    const msgId = btn.closest("[data-message-id]").dataset.messageId;
    const chatMsg = game.messages.get(msgId);
    if (!chatMsg) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(chatMsg.content, "text/html");

    // Disable roll-damage-btn in stored content
    const dmgBtn = doc.querySelector(".roll-damage-btn");
    if (dmgBtn) dmgBtn.setAttribute("disabled", "disabled");

    // Append damage result section
    const resultEl = doc.querySelector(".starwarsd6.roll-result");
    if (resultEl) {
      const dmgSection = doc.createElement("div");
      dmgSection.className = "damage-result";
      const tierLabel = game.i18n.localize(`STARWARSD6.Combat.${tier.charAt(0).toUpperCase() + tier.slice(1)}`);
      dmgSection.innerHTML = `
        <div class="damage-total"><strong>${game.i18n.localize("STARWARSD6.Combat.DamageTotal")}: ${damageTotal}</strong>
          — <span class="damage-tier">${tierLabel}</span>
        </div>
        <div class="mark-hit-box-action">
          <button type="button" class="mark-hit-box-btn"
                  data-target-actor-id="${targetActorId}"
                  data-tier="${tier}">
            ${game.i18n.localize("STARWARSD6.Combat.MarkHitBox")}
          </button>
        </div>`;
      resultEl.appendChild(dmgSection);
    }

    await chatMsg.update({ content: doc.body.innerHTML });
  });
});

// --- Mark Hit Box button ---
html.querySelectorAll(".mark-hit-box-btn:not([disabled])").forEach(btn => {
  btn.addEventListener("click", async () => {
    const targetActorId = btn.dataset.targetActorId;
    const tier = btn.dataset.tier;

    btn.disabled = true;

    if (game.user.isGM) {
      const actor = game.actors.get(targetActorId);
      if (actor) await applyDamage(actor, tier);
    } else {
      requestApplyDamage(targetActorId, tier);
    }

    // Persist disabled state in message
    const msgId = btn.closest("[data-message-id]").dataset.messageId;
    const chatMsg = game.messages.get(msgId);
    if (!chatMsg) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(chatMsg.content, "text/html");
    const markBtn = doc.querySelector(".mark-hit-box-btn");
    if (markBtn) markBtn.setAttribute("disabled", "disabled");
    await chatMsg.update({ content: doc.body.innerHTML });
  });
});
```

### Task 6: Add localization keys to `lang/en.json`

```json
"STARWARSD6.Combat.Target":     "Target",
"STARWARSD6.Combat.Difficulty":  "Difficulty",
"STARWARSD6.Combat.RollDamage":  "Roll Damage",
"STARWARSD6.Combat.MarkHitBox":  "Mark Hit Box",
"STARWARSD6.Combat.DamageTotal": "Damage",
"STARWARSD6.Combat.DamageTier":  "Tier",
"STARWARSD6.Combat.NoTarget":    "No target selected"
```

### Task 7: Create `tests/unit/socket.test.mjs`

Test file uses the same vitest + `vi.fn()` mock pattern as `tests/unit/damage.test.mjs`. The Foundry mock in `tests/setup.mjs` installs `globalThis.foundry` — `game` is NOT mocked globally, so provide it per-test via `globalThis.game`.

```js
// tests/unit/socket.test.mjs
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSocketMessage, requestApplyDamage } from "../../modules/helpers/socket.mjs";
import { applyDamage } from "../../modules/helpers/damage.mjs";

vi.mock("../../modules/helpers/damage.mjs", () => ({
  applyDamage: vi.fn().mockResolvedValue(undefined)
}));

function setupGame({ isGM = true, actor = null } = {}) {
  globalThis.game = {
    user: { isGM },
    actors: { get: vi.fn().mockReturnValue(actor) },
    socket: { emit: vi.fn() }
  };
}

describe("handleSocketMessage()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when user is not GM", async () => {
    setupGame({ isGM: false });
    await handleSocketMessage({ action: "applyDamage", targetActorId: "abc", tier: "wound" });
    expect(applyDamage).not.toHaveBeenCalled();
  });

  it("does nothing for unknown action", async () => {
    const actor = { system: {} };
    setupGame({ isGM: true, actor });
    await handleSocketMessage({ action: "unknownAction", targetActorId: "abc", tier: "wound" });
    expect(applyDamage).not.toHaveBeenCalled();
  });

  it("calls applyDamage when GM and action is applyDamage", async () => {
    const actor = { id: "abc", system: {} };
    setupGame({ isGM: true, actor });
    await handleSocketMessage({ action: "applyDamage", targetActorId: "abc", tier: "stun" });
    expect(game.actors.get).toHaveBeenCalledWith("abc");
    expect(applyDamage).toHaveBeenCalledWith(actor, "stun");
  });

  it("does not call applyDamage when actor not found", async () => {
    setupGame({ isGM: true, actor: null });
    await handleSocketMessage({ action: "applyDamage", targetActorId: "missing", tier: "wound" });
    expect(applyDamage).not.toHaveBeenCalled();
  });
});

describe("requestApplyDamage()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("emits the correct socket message", () => {
    setupGame();
    requestApplyDamage("target-id", "mortal");
    expect(game.socket.emit).toHaveBeenCalledWith("system.starwarsd6", {
      action: "applyDamage",
      targetActorId: "target-id",
      tier: "mortal"
    });
  });
});
```

### Task 8: Update `doc/rules-reference.md` — Targeted Combat section

Add a section documenting the automated combat resolution flow. Insert after the existing Combat section (search for `## Combat` heading):

```markdown
### Targeted Combat Resolution (Automated)

When a player has a token targeted before clicking Roll Attack:

1. The system reads the **target actor's** defense value (ranged/melee/brawling based on weapon skill).
2. The chat card shows the target name, defense value, and hit/miss result automatically.
3. On a **hit**, a "Roll Damage" button appears. Clicking it rolls the weapon's flat damage dice (no wild die) and shows the resulting tier (Stun/Wound/Incap/Mortal).
4. A "Mark Hit Box" button applies one mark to the target's appropriate tier, with cascade overflow. This button is GM-only; non-GM players trigger a socket request that the GM client fulfills.

With **no target** selected, a Difficulty field appears in the roll dialog. The roll resolves against that number. No damage button is shown — the GM adjudicates damage manually.

Only the **first** targeted token is used when multiple tokens are targeted.
```

---

## Integration Points

```yaml
IMPORTS to add in starwarsd6.mjs:
  - import { handleSocketMessage, requestApplyDamage } from "./modules/helpers/socket.mjs"
  - import { rollDamage } from "./modules/helpers/dice.mjs"
  - import { applyDamage, resolveDamageTier } from "./modules/helpers/damage.mjs"

IMPORTS to add in modules/apps/character-sheet.mjs:
  - import { rollDamage } from "../helpers/dice.mjs"   (rollDamage already in dice.mjs)

NEW FILE:
  - modules/helpers/socket.mjs  (one export: requestApplyDamage, one internal: handleSocketMessage)

SOCKET CHANNEL: "system.starwarsd6" — Foundry convention for custom system sockets.
  Must be declared in system.json under "socket": true  ← VERIFY this is already set.
```

### Verify system.json has socket enabled

```bash
grep -i socket system.json
# Expected: "socket": true
# CURRENTLY MISSING — must be added to system.json before socket will work.
# Add "socket": true at the top level of system.json (alongside "id", "title", etc.)
```

---

## Validation Loop

### Level 1: Syntax check (Foundry uses plain JS/ESM — no build step)

```bash
# Check for syntax errors in modified/new files
node --input-type=module < modules/helpers/socket.mjs 2>&1 | head -20
# Expected: exits cleanly (or "Cannot use import statement" which is fine — means no syntax error)

# Verify all imports resolve (check for typos in paths):
grep -n "from " modules/apps/character-sheet.mjs
grep -n "from " starwarsd6.mjs
# Expected: all import paths point to existing files
```

### Level 2: Unit tests

```bash
# Run full test suite — all existing tests must still pass
npm test

# Expected output: all tests pass including the new socket.test.mjs
# Tests to verify specifically:
#   tests/unit/socket.test.mjs  — 5 cases (new)
#   tests/unit/damage.test.mjs  — unchanged (applyDamage/resolveDamageTier still work)
#   tests/unit/dice.test.mjs    — unchanged (rollDamage already covered there)
# If failing: read the vitest error, check vi.mock path matches actual import path in socket.mjs
```

### Level 3: File existence checks

```bash
# Confirm new file exists
ls -la modules/helpers/socket.mjs

# Confirm rollDamage is imported from dice.mjs (not damage.mjs)
grep "rollDamage" modules/apps/character-sheet.mjs
grep "rollDamage" starwarsd6.mjs

# Confirm socket registration is in "ready" hook (not "init")
grep -A 3 'once("ready"' starwarsd6.mjs

# Confirm new i18n keys exist
grep "RollDamage\|MarkHitBox\|DamageTotal\|\.Target\|\.Difficulty" lang/en.json

# Confirm system.json socket setting
grep "socket" system.json
```

### Level 4: Logic validation — manual in-Foundry test

**Test A — with target:**
1. Open a character sheet (attacker) with a ranged weapon (e.g., Blaster, 4D damage)
2. Target an NPC token with known rangedDefense (e.g., 12)
3. Click Roll Attack — dialog opens normally
4. Submit roll — chat card shows target name ("Target: [NPC name]"), attack total vs. 12, Hit/Miss
5. If Hit: "Roll Damage" button visible; if Miss: no button
6. Click Roll Damage — chat card appends damage total, tier (e.g., "Wound"), "Mark Hit Box" button
7. GM clicks Mark Hit Box — NPC's wound hit box increments by 1
8. Player (non-GM) clicks Mark Hit Box — NPC hit box still increments (via socket)

**Test B — without target:**
1. Clear all targets (deselect tokens)
2. Click Roll Attack — RollDialog shows "Difficulty" number input
3. Enter difficulty 15, submit
4. Chat card shows "Difficulty: 15", Hit/Miss — **no Roll Damage button**

**Test C — regression:**
1. CP spend button still works on non-attack rolls
2. Force Point spend still works
3. Skill rolls still work normally
4. NPC sheet hit boxes still respond to Alt+click

---

## Final Validation Checklist

- [ ] `modules/helpers/socket.mjs` created with `requestApplyDamage` export
- [ ] `system.json` has `"socket": true`
- [ ] Socket handler registered in `Hooks.once("ready")` (not "init")
- [ ] `RollDialog` shows Difficulty input when `noTarget: true`; `difficulty` returned in result
- [ ] `#rollAttack` branches on `game.user.targets` — reads target's defense or uses entered difficulty
- [ ] `#postAttackToChat` accepts weapon object (not just name), targetActor, isHit
- [ ] Roll Damage button only rendered on hit with a target
- [ ] Roll Damage handler updates chat message in-place (DOMParser pattern — same as CP spend)
- [ ] Mark Hit Box: GM calls `applyDamage` directly; non-GM calls `requestApplyDamage` via socket
- [ ] Mark Hit Box button disabled in persisted chat content after click
- [ ] All 7 new i18n keys in `lang/en.json`
- [ ] `rollDamage` imported from `dice.mjs` (it already exists there — do NOT duplicate in `damage.mjs`)
- [ ] `tests/unit/socket.test.mjs` created with 5 unit tests (handleSocketMessage: 4, requestApplyDamage: 1)
- [ ] `npm test` passes — all existing tests still pass, new socket tests pass
- [ ] `doc/rules-reference.md` updated with "Targeted Combat Resolution" section under Combat
- [ ] Existing CP spend, FP spend, skill roll, force roll behaviors unchanged

---

## Anti-Patterns to Avoid

- ❌ Do NOT implement `rollDamage` in `damage.mjs` — it already exists in `dice.mjs`
- ❌ Do NOT read attacker's own defense for the target comparison (old bug in `#rollAttack`)
- ❌ Do NOT register socket in `Hooks.once("init")` — `game.socket` is null there
- ❌ Do NOT use `game.user.targets.first()` — targets is a plain `Set`, use spread: `[...game.user.targets][0]`
- ❌ Do NOT create a new `renderChatMessageHTML` hook registration — extend the one already in `starwarsd6.mjs` or add one immediately after; they compose fine but duplicating creates confusion
- ❌ Do NOT skip persisting disabled state on Mark Hit Box — if user refreshes, button would re-enable
- ❌ Do NOT call `applyDamage` directly from a non-GM client without socket — non-owners cannot `update()` other actors

---

**PRP Confidence Score: 9/10**

The implementation is well-bounded: all APIs are established Foundry patterns already in use in this codebase, the socket pattern is explicitly specified, `rollDamage` and `applyDamage` already exist, and the chat-button-update pattern is directly mirrored from the CP-spend button. The only risk is the `system.json` socket flag — easy to verify and add. The RollDialog extension follows an established pattern (isForceRoll → noTarget). No novel API surface.
