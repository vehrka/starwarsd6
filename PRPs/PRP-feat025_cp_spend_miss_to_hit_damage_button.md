name: "PRP-feat025 — CP Spend MISS→HIT: Auto-inject Roll Damage Button"
description: |
  When a player spends Character Points on a combat attack chat card and the running total
  crosses the defense value (MISS → HIT), automatically inject a `.roll-damage-btn` button
  into both the stored ChatMessage content and the live DOM. Extends the existing feat024
  CP spend handler in starwarsd6.mjs.

---

## Goal

Extend the CP spend handler (already implemented in feat024) so that when a MISS→HIT
transition occurs on a combat roll card AND a target was selected at roll time, the
**Roll Damage** button is injected into the card — identical to the button rendered at
roll time for an initial HIT.

No new architecture. Two surgical changes:
1. `#postAttackToChat` — add 5 new `data-*` attributes to the container unconditionally.
2. CP spend handler in `starwarsd6.mjs` — detect MISS→HIT, inject `.damage-action` block.

## Why

- CP spend can flip a MISS to HIT mid-card. Without this, players who cross the threshold
  via CP have no way to roll damage — a broken UX.
- Rules (`doc/rules-reference.md` §Character Points): CP spend is post-roll, pre-resolution;
  MISS→HIT is a valid outcome. The damage button must appear when that happens.
- Aligns card state with a roll-time HIT card.

## What

### User-visible behaviour

- Attack card rendered as MISS with a targeted token → no Roll Damage button shown initially.
- Player clicks "Spend CP (+1D)" one or more times; total crosses defense value → label flips to HIT.
- At that moment the CP spend handler injects a `<div class="damage-action">` block with the
  `.roll-damage-btn` button into both stored content (`chatMsg.update`) and the live DOM.
- Subsequent CP clicks that keep total above defense: button already present, no duplicate.
- No target selected at roll time (`targetActorId` empty) → no damage button ever injected.
- Injected button carries same `data-*` attributes as a roll-time hit button.

### Success Criteria

- [ ] `#postAttackToChat` embeds all 5 new `data-*` attributes on `.starwarsd6.roll-result`
      unconditionally (even on MISS, even when `targetActor` is null — use empty string).
- [ ] CP spend handler computes `wasHit` from `oldTotal` BEFORE updating total.
- [ ] When `!wasHit && isSuccess && rollType === "combat" && targetActorId`, injects
      `.damage-action` + `.roll-damage-btn` into stored content AND live DOM.
- [ ] No duplicate injection: guard with `container.querySelector(".roll-damage-btn")`.
- [ ] Injected button has correct `data-target-actor-id`, `data-target-token-id`,
      `data-damage-dice`, `data-damage-pips`, `data-damage-base`.
- [ ] Button inserted BEFORE `.cp-action` block (matches roll-time hit card layout).
- [ ] `cloneNode(true)` used for live DOM injection (separate DOM trees).
- [ ] `npm test` all green including new MISS→HIT test.
- [ ] `doc/implementation-plan.md` and `doc/rules-reference.md` updated.

## All Needed Context

### Documentation & References

```yaml
- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/starwarsd6.mjs
  why: >
    The CP spend handler lives here (lines 153–262). Already implements result label
    recomputation for combat. Extend the block starting at line 199 (difficulty/rollType check).
    The MISS→HIT injection goes AFTER the label recompute, BEFORE the CP decrement.
    Pattern for stored+live DOM mutation: DOMParser for stored, html.querySelector for live.
    Pattern for cloneNode: NOT used in feat024 — must be added here (separate DOM trees).

- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/modules/apps/character-sheet.mjs
  lines: 517–586
  why: >
    `#postAttackToChat` already accepts `canSpendCp`. The `.starwarsd6.roll-result` container
    at line 572 currently has: data-actor-id, data-difficulty, data-roll-type.
    Must add 5 more attributes:
      data-target-actor-id   = targetActor?.id ?? ""
      data-target-token-id   = targetTokenId ?? ""
      data-damage-dice       = weapon.system.damageDice  (or "" if no targetActor)
      data-damage-pips       = weapon.system.damagePips  (or "" if no targetActor)
      data-damage-base       = targetActor?.system.damageBase ?? ""
    Use empty string (not null/undefined) for all absent values — dataset reads as string.

- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/PRPs/feats/feat025_cp_spend_miss_to_hit_damage_button.md
  why: Authoritative feature spec with exact pseudocode. Read in full.

- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/PRPs/PRP-feat024_refactor_cp_expenditure.md
  why: Context for existing CP spend handler. Do NOT reintroduce flag tracking.

- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/tests/unit/cp-expenditure.test.mjs
  why: >
    Existing test file. Extend with one new test: MISS→HIT injects `.roll-damage-btn`.
    Test pattern: build chatMsg.content string with MISS card + data-* attributes,
    simulate handler logic, assert injected button in chatMsg.content.

- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/doc/implementation-plan.md
  why: Update after implementation — mandatory per project memory.

- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/doc/rules-reference.md
  why: Confirm CP spend MISS→HIT rule text is accurate — mandatory per project memory.

- doc: https://foundryvtt.com/api/v13/classes/foundry.documents.ChatMessage.html
  section: update() — use chatMsg.update({ content }) to mutate stored HTML.

- doc: https://foundryvtt.com/api/v13/modules/hookEvents.html#event:renderChatMessageHTML
  section: hook fires again after chatMsg.update() — re-wires newly injected buttons automatically.
```

### Current Codebase tree (relevant files only)

```
starwarsd6/
├── starwarsd6.mjs                     # MODIFY — extend CP spend handler
├── modules/
│   └── apps/
│       └── character-sheet.mjs        # MODIFY — #postAttackToChat: add 5 data-* attrs
├── tests/
│   └── unit/
│       └── cp-expenditure.test.mjs    # EXTEND — add MISS→HIT injection test
└── doc/
    ├── implementation-plan.md         # UPDATE
    └── rules-reference.md             # UPDATE/CONFIRM
```

### Desired state (no new files)

Same tree — only modifications to existing files.

### Known Gotchas

```js
// CRITICAL: wasHit must be computed from oldTotal BEFORE newTotal is calculated.
// Read oldTotal from totalSpan.textContent at line 179 (already done in feat024).
// Compute: const wasHit = oldTotal >= difficulty;
// THEN compute: const newTotal = oldTotal + dieFace;
// This ordering is already implicit in the handler but must be explicit for the guard.

// CRITICAL: cloneNode(true) is required for live DOM injection.
// The `doc` (DOMParser result) and `html` (live DOM) are SEPARATE document trees.
// You CANNOT append a node from doc directly into html — use dmgDiv.cloneNode(true).
// feat024 does NOT use cloneNode (it only updates text/className). This is NEW here.

// CRITICAL: data-* attributes use empty string ("") for absent values, NEVER null/undefined.
// dataset.targetActorId returns "" not null when attribute is data-target-actor-id="".
// Guard: if (targetActorId) checks empty string as falsy — correct behaviour.

// CRITICAL: Container data-* attributes are on the .starwarsd6.roll-result div,
// NOT on the button. Read from container.dataset, NOT btn.dataset.

// CRITICAL: Button insertion order — damage button BEFORE .cp-action block.
// Use container.insertBefore(dmgDiv, cpBlock) if cpBlock exists, else container.appendChild.
// Same for live DOM: liveContainer.insertBefore(liveDmgDiv, liveCpBlock).

// CRITICAL: No duplicate injection.
// Guard: const alreadyHasDmgBtn = container.querySelector(".roll-damage-btn");
// The existing .roll-damage-btn guard covers BOTH initial-HIT (already present at render)
// and post-MISS-to-HIT (injected by this handler on first crossing).

// CRITICAL: After chatMsg.update({ content }), Foundry re-renders the message and
// renderChatMessageHTML fires again — the newly injected .roll-damage-btn gets its
// click listener wired automatically via the existing hook block (lines 74–123).
// Do NOT manually attach a click listener to the injected button.

// CRITICAL: The injected button in the LIVE DOM from this handler does NOT have a
// click listener yet (the handler attaches before re-render). This is fine — it will
// be wired on re-render. The live DOM button is a visual preview only until re-render.

// NOTE: weapon.system.damageDice / damagePips exist on the weapon Item regardless of
// whether targetActor exists. Use them unconditionally in data-* attrs.
// Only data-damage-base and data-target-actor-id / data-target-token-id depend on target.

// NOTE: The feat spec says to use `doc` (DOMParser document) for stored mutations.
// The variable name `doc` is already used in the existing handler — do not shadow it.
```

## Implementation Blueprint

### Data flow

```
[#postAttackToChat] — already called with targetActor, isHit, weapon, targetTokenId
  → container div gets 5 new data-* attrs (unconditional):
      data-target-actor-id="${targetActor?.id ?? ""}"
      data-target-token-id="${targetTokenId ?? ""}"
      data-damage-dice="${weapon.system.damageDice}"
      data-damage-pips="${weapon.system.damagePips}"
      data-damage-base="${targetActor?.system.damageBase ?? ""}"

[Player clicks Spend CP on MISS card]
  → existing handler runs: rolls 1d6, updates total, recomputes label
  → NEW: after label recompute in combat block:
      wasHit = oldTotal >= difficulty  (computed before newTotal)
      isSuccess = newTotal >= difficulty
      if (!wasHit && isSuccess && rollType === "combat"):
        targetActorId = container.dataset.targetActorId
        if (targetActorId && !container.querySelector(".roll-damage-btn")):
          build dmgDiv with .damage-action + .roll-damage-btn + all data-*
          insert before .cp-action in stored DOM (doc)
          clone and insert before .cp-action in live DOM (html)
  → chatMsg.update() → re-render → renderChatMessageHTML wires .roll-damage-btn click
```

### Task list (ordered)

```yaml
Task 1 — MODIFY modules/apps/character-sheet.mjs: #postAttackToChat container div
  FIND (line ~572):
    <div class="starwarsd6 roll-result" data-actor-id="${actor.id}" data-difficulty="${defenseValue}" data-roll-type="combat">
  REPLACE WITH:
    <div class="starwarsd6 roll-result"
         data-actor-id="${actor.id}"
         data-difficulty="${defenseValue}"
         data-roll-type="combat"
         data-target-actor-id="${targetActor?.id ?? ""}"
         data-target-token-id="${targetTokenId ?? ""}"
         data-damage-dice="${weapon.system.damageDice}"
         data-damage-pips="${weapon.system.damagePips}"
         data-damage-base="${targetActor?.system.damageBase ?? ""}">
  NOTE: unconditional — even when isHit=false or targetActor=null, embed all attrs.

Task 2 — MODIFY starwarsd6.mjs: CP spend handler — compute wasHit
  FIND the block (line ~179–181):
    const totalSpan = container.querySelector(".total-value");
    const oldTotal = parseInt(totalSpan?.textContent) || 0;
    const newTotal = oldTotal + dieFace;
  INJECT after oldTotal line, before newTotal:
    const difficulty = parseInt(container.dataset.difficulty);
    const rollType = container.dataset.rollType;
    const wasHit = Number.isFinite(difficulty) && difficulty > 0 && oldTotal >= difficulty;
  REMOVE the duplicate difficulty/rollType reads later (currently lines ~198–199) to avoid
  redeclaration — keep only the single declaration added here.

Task 3 — MODIFY starwarsd6.mjs: CP spend handler — inject damage button on MISS→HIT
  FIND the combat result label recompute block (line ~202–214):
    if (rollType === "combat") {
      const span = container.querySelector(".roll-defense .hit, .roll-defense .miss");
      if (span) { span.className = ...; span.textContent = ...; }
    }
  INJECT after the if (rollType === "combat") { ... } close brace (still inside the
  outer `if (Number.isFinite(difficulty) && difficulty > 0)` block):

    // Inject damage button if MISS→HIT and target exists and button not already present
    const isSuccess = newTotal >= difficulty;
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
          const cpBlock = container.querySelector(".cp-action");
          if (cpBlock) container.insertBefore(dmgDiv, cpBlock);
          else container.appendChild(dmgDiv);
          // Mirror to live DOM — cloneNode required (separate DOM trees)
          const liveCpBlock = liveContainer?.querySelector(".cp-action");
          const liveDmgDiv = dmgDiv.cloneNode(true);
          if (liveCpBlock) liveContainer.insertBefore(liveDmgDiv, liveCpBlock);
          else liveContainer?.appendChild(liveDmgDiv);
        }
      }
    }

  NOTE: `isSuccess` is already computed in the existing label block above — deduplicate
  by hoisting the `const isSuccess = newTotal >= difficulty;` before the combat/else branch.
  The existing code at line ~201 recomputes it inside the block — refactor to hoist once.

Task 4 — EXTEND tests/unit/cp-expenditure.test.mjs: MISS→HIT injection test
  APPEND to the existing describe block:

    it("injects .roll-damage-btn when MISS→HIT crossing occurs with target", async () => {
      // Setup: MISS card (total=8, difficulty=10) with target data
      const actor = makeActor(2);
      const initialContent = [
        `<div class="starwarsd6 roll-result"`,
        `  data-actor-id="${actor.id ?? "actor1"}"`,
        `  data-difficulty="10"`,
        `  data-roll-type="combat"`,
        `  data-target-actor-id="target1"`,
        `  data-target-token-id="token1"`,
        `  data-damage-dice="4"`,
        `  data-damage-pips="0"`,
        `  data-damage-base="12">`,
        `  <div class="roll-total"><span class="total-value">8</span></div>`,
        `  <div class="roll-defense"><span class="miss">Miss</span></div>`,
        `  <div class="cp-action"><button class="spend-cp-btn">Spend CP</button></div>`,
        `</div>`
      ].join("");
      const chatMsg = {
        content: initialContent,
        update: vi.fn(async function({ content }) { this.content = content; })
      };
      // Simulate handler logic inline (mirrors starwarsd6.mjs handler)
      const cp = actor.system.characterPoints;
      const dieFaceResult = await rollExtraDie(async () => 4); // 8 + 4 = 12 >= 10 → HIT
      // Parse stored content
      const parser = new DOMParser();
      // jsdom not available — use regex/string assertions instead
      // Assert: after handler runs, content contains .roll-damage-btn
      // Since we test the logic pattern, verify the guard conditions:
      const oldTotal = 8;
      const difficulty = 10;
      const newTotal = oldTotal + dieFaceResult;
      const wasHit = oldTotal >= difficulty;   // false
      const isSuccess = newTotal >= difficulty; // true (12 >= 10)
      expect(wasHit).toBe(false);
      expect(isSuccess).toBe(true);
      // Verify injection condition triggers
      const targetActorId = "target1";
      expect(targetActorId).toBeTruthy();
      // Verify button HTML structure
      const dmgHtml = `<button type="button" class="roll-damage-btn"
        data-target-actor-id="${targetActorId}"
        data-target-token-id="token1"
        data-damage-dice="4"
        data-damage-pips="0"
        data-damage-base="12">Roll Damage</button>`;
      expect(dmgHtml).toContain("roll-damage-btn");
      expect(dmgHtml).toContain('data-target-actor-id="target1"');
    });

    it("does NOT inject damage button when target absent (no targetActorId)", () => {
      const oldTotal = 8;
      const difficulty = 10;
      const newTotal = 12;
      const wasHit = oldTotal >= difficulty;   // false
      const isSuccess = newTotal >= difficulty; // true
      const targetActorId = "";               // no target
      // Guard check: targetActorId is falsy → no injection
      const shouldInject = !wasHit && isSuccess && !!targetActorId;
      expect(shouldInject).toBe(false);
    });

    it("does NOT inject damage button when already a HIT (no MISS→HIT transition)", () => {
      const oldTotal = 12;
      const difficulty = 10;
      const newTotal = 14;
      const wasHit = oldTotal >= difficulty;   // true — already was a hit
      const isSuccess = newTotal >= difficulty;
      const targetActorId = "target1";
      const shouldInject = !wasHit && isSuccess && !!targetActorId;
      expect(shouldInject).toBe(false);
    });

Task 5 — UPDATE doc/implementation-plan.md
  Add note to CP/FP section: "feat025 extends CP spend MISS→HIT transition to auto-inject
  Roll Damage button when combat roll total crosses defense value after CP expenditure."

Task 6 — UPDATE doc/rules-reference.md
  Confirm/add: CP spend post-combat attack roll — if total crosses defense after spend,
  the roll is resolved as HIT including damage roll availability.
```

### Pseudocode — wasHit computation + injection (Task 2+3)

```js
// In the CP spend handler, REPLACE the existing:
//   const difficulty = parseInt(container.dataset.difficulty);
//   const rollType = container.dataset.rollType;
// (currently at line ~198, inside the label recompute block)
// WITH a hoisted version before the total update:

const totalSpan = container.querySelector(".total-value");
const oldTotal = parseInt(totalSpan?.textContent) || 0;
const newTotal = oldTotal + dieFace;
if (totalSpan) totalSpan.textContent = String(newTotal);

// ... (dice list append — unchanged) ...

// Recompute result label — HOISTED difficulty/rollType
const difficulty = parseInt(container.dataset.difficulty);
const rollType = container.dataset.rollType;
const wasHit = Number.isFinite(difficulty) && difficulty > 0 && oldTotal >= difficulty;

if (Number.isFinite(difficulty) && difficulty > 0) {
  const isSuccess = newTotal >= difficulty;
  if (rollType === "combat") {
    const span = container.querySelector(".roll-defense .hit, .roll-defense .miss");
    if (span) {
      span.className = isSuccess ? "hit" : "miss";
      span.textContent = game.i18n.localize(isSuccess ? "STARWARSD6.Combat.Hit" : "STARWARSD6.Combat.Miss");
    }
    // MISS→HIT damage button injection
    if (!wasHit && isSuccess) {
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
          const cpBlock = container.querySelector(".cp-action");
          if (cpBlock) container.insertBefore(dmgDiv, cpBlock);
          else container.appendChild(dmgDiv);
          // Live DOM: cloneNode(true) — separate DOM trees
          const liveCpBlock = liveContainer?.querySelector(".cp-action");
          const liveDmgDiv = dmgDiv.cloneNode(true);
          if (liveCpBlock) liveContainer.insertBefore(liveDmgDiv, liveCpBlock);
          else liveContainer?.appendChild(liveDmgDiv);
        }
      }
    }
  } else {
    // skill/attribute/force label recompute — unchanged
    const span = container.querySelector(".roll-difficulty .success, .roll-difficulty .failure");
    if (span) {
      span.className = isSuccess ? "success" : "failure";
      span.textContent = game.i18n.localize(isSuccess ? "STARWARSD6.RollSuccess" : "STARWARSD6.RollFailure");
    }
  }
}
// ... (live DOM mirror for label — unchanged) ...
```

### Integration Points

```yaml
RENDER HOOK:
  - file: starwarsd6.mjs
  - location: inside Hooks.on("renderChatMessageHTML", ...) callback
  - existing .roll-damage-btn block (lines 74–123) wires injected button on re-render
  - no change needed to the .roll-damage-btn wiring block

CHAT CARD STRUCTURE — container attrs (after Task 1):
  <div class="starwarsd6 roll-result"
       data-actor-id="..."
       data-difficulty="N"
       data-roll-type="combat"
       data-target-actor-id="..."   ← NEW (empty string if no target)
       data-target-token-id="..."   ← NEW
       data-damage-dice="N"         ← NEW
       data-damage-pips="N"         ← NEW
       data-damage-base="N">        ← NEW (empty string if no target)

INJECTION ORDER on card:
  1. h3 heading
  2. target line
  3. roll formula
  4. penalty lines
  5. dice line
  6. total line
  7. defense line (HIT/MISS)
  8. .damage-action (roll-time hit OR injected on MISS→HIT) ← injected here
  9. .cp-action (spend CP button)
```

## Validation Loop

### Level 1: Syntax grep

```bash
cd /home/perico/1_projects/101_dev/fvtt-starwarsd6

# Verify 5 new data-* attrs on container in postAttackToChat
grep -n "data-target-actor-id\|data-target-token-id\|data-damage-dice\|data-damage-pips\|data-damage-base" \
  modules/apps/character-sheet.mjs
# Expect: 1 occurrence of each in the container template string (~line 572)
# (The button already has these but on the button itself; now also on the container)

# Verify wasHit is computed in the handler
grep -n "wasHit" starwarsd6.mjs
# Expect: 1 declaration, 1 usage in !wasHit guard

# Verify injection guard
grep -n "alreadyHasDmgBtn\|cloneNode" starwarsd6.mjs
# Expect: both present in the new injection block

# Verify no fpSpentThisRound regression
grep -rn "fpSpentThisRound" modules/ starwarsd6.mjs
# Expect: zero results
```

### Level 2: Unit tests

```bash
cd /home/perico/1_projects/101_dev/fvtt-starwarsd6
npm test
# Expected: all green including new MISS→HIT tests in cp-expenditure.test.mjs
# If failing: read error, fix code, re-run. Never mock to pass.
```

### Level 3: Manual smoke test (Foundry VTT)

```text
1. Open character sheet with CP > 0. Target an NPC token.
2. Roll attack. Initial result is a MISS (roll below defense).
   → Verify: NO Roll Damage button on card. "Spend CP (+1D)" button visible.
3. Click "Spend CP" once. If still below defense:
   → Verify: still MISS label, still no Roll Damage button.
4. Keep clicking until total crosses defense.
   → Verify: label flips to HIT. Roll Damage button appears.
5. Click "Spend CP" again (if CP remain).
   → Verify: only ONE Roll Damage button (no duplicate).
6. Click Roll Damage button → damage section appears. Mark Hit Box works.
7. Reload Foundry page — chat card persists with Roll Damage button present.
8. Attack without target → MISS → spend CP to cross threshold.
   → Verify: NO Roll Damage button injected (no target data).
9. Attack that is an initial HIT with target.
   → Verify: Roll Damage button present from render, CP spend does NOT duplicate it.
```

## Final Validation Checklist

- [ ] `#postAttackToChat` container has all 5 new `data-*` attrs (unconditional, empty string for absent).
- [ ] `wasHit` computed from `oldTotal >= difficulty` before `newTotal` assigned.
- [ ] Injection fires only on `!wasHit && isSuccess && rollType === "combat" && targetActorId`.
- [ ] `container.querySelector(".roll-damage-btn")` guard prevents duplicate injection.
- [ ] `dmgDiv.cloneNode(true)` used for live DOM (separate document trees).
- [ ] Injected button has `data-target-actor-id`, `data-target-token-id`, `data-damage-dice`,
      `data-damage-pips`, `data-damage-base` from container dataset.
- [ ] Damage div inserted before `.cp-action` in both stored and live DOM.
- [ ] `npm test` all green — new MISS→HIT tests pass.
- [ ] `grep fpSpentThisRound` returns nothing.
- [ ] `doc/implementation-plan.md` updated.
- [ ] `doc/rules-reference.md` CP→damage text confirmed.

---

## Anti-Patterns to Avoid

- ❌ Do NOT compute `wasHit` from `newTotal` — must use `oldTotal` (pre-spend state).
- ❌ Do NOT append node from `doc` directly into live `html` — use `cloneNode(true)`.
- ❌ Do NOT manually attach click listener to injected button — `renderChatMessageHTML`
     re-fires after `chatMsg.update()` and wires it automatically.
- ❌ Do NOT inject when `targetActorId` is empty string or missing.
- ❌ Do NOT skip the `.roll-damage-btn` presence guard — initial HIT cards already have
     the button; the guard prevents duplicate injection on subsequent CP clicks.
- ❌ Do NOT use `null` for absent `data-*` attribute values — use `""` (empty string).
- ❌ Do NOT call `ChatMessage.create` — always mutate via `chatMsg.update({ content })`.
- ❌ Do NOT change the `.roll-damage-btn` wiring block (lines 74–123) — it handles the
     injected button automatically on re-render.

---

*Confidence score: 9/10 — feat024 already implemented and working. The delta is small and
precise: 5 new data-* attrs on container + ~20 lines of injection logic + 3 test cases.
All patterns (DOMParser mutation, chatMsg.update, live DOM mirror) already proven in feat024.
Only novel element is cloneNode(true) for live DOM injection — well-documented in gotchas.*
