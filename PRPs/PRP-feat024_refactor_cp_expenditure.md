name: "PRP-feat024 — Refactor CP Expenditure (Repeatable Post-Roll Spend Button)"
description: |
  Rewrite the Character Point spend flow so players click **Spend CP** multiple times on a single chat
  card. Each click rolls 1d6, appends to the Normal dice list, updates the running total in-place,
  recomputes the HIT/MISS or SUCCESS/FAILURE label against the stored difficulty, and decrements
  `system.characterPoints` by 1. The button disappears when CP reaches 0 or when the roll used FP.

---

## Goal

Implement a repeatable post-roll "Spend CP" button on every character roll chat card (skill,
attribute, combat, force-skill). Each click:

1. Rolls one extra d6 (no wild die, no pips).
2. Appends that die to the Normal dice list in the card.
3. Updates the `.total-value` span in-place (both stored content and live DOM).
4. Recomputes the result label (HIT/MISS for combat, SUCCESS/FAILURE for skill/attribute/force)
   against the difficulty stored on the card.
5. Decrements `actor.system.characterPoints` by 1.
6. Hides the button (removes from DOM) when CP reaches 0.

The button is rendered only when the roll did **not** spend a Force Point and `cp > 0`.

## Why

- feat023 removed the per-round FP/CP cap machinery. CP spend now needs to be truly repeatable on
  any single card without flag tracking.
- Multiple-click UX beats one-shot dialog prompt: players see each die and total update live.
- Aligns with WEG Star Wars D6 rule: any number of CP may be spent on one roll, declared before
  the GM resolves success/failure. (See `doc/rules-reference.md`.)

## What

### User-visible behaviour

- Every character roll chat card shows **Spend CP (+1D)** when `canSpendCp === true`.
- `canSpendCp = !useForcePoint && cp > 0`.
- Each click: visible d6 appended, total updates, result label flips if crossing difficulty.
- Button disappears when `characterPoints === 0` (hidden, not disabled).
- Card is mutated in-place — no new `ChatMessage.create` calls on spend.

### Success Criteria

- [ ] All four roll handlers (`#rollSkill`, `#rollAttribute`, `#rollAttack`, `#rollForceSkill`)
      compute and pass `canSpendCp` to their post-chat helper.
- [ ] `#postRollToChat`, `#postAttackToChat`, `#postForceRollToChat` render the Spend CP button
      section when `canSpendCp` is true, embed `data-actor-id`, `data-difficulty`, `data-roll-type`
      on the `.starwarsd6.roll-result` container.
- [ ] Global `Hooks.on("renderChatMessageHTML", ...)` in `starwarsd6.mjs` wires click handling for
      `.spend-cp-btn`, mirroring the existing `.roll-damage-btn` / `.mark-hit-box-btn` wiring pattern.
- [ ] Click handler: reads live `actor.system.characterPoints`, rolls 1d6 via `rollExtraDie`,
      updates stored content and live DOM (Normal dice list, `.total-value`, result label),
      `actor.update({ "system.characterPoints": cp - 1 })`, removes `.cp-action` block when new CP = 0.
- [ ] If actor missing / not a character type — silent no-op.
- [ ] `npm test` passes. `tests/unit/cp-expenditure.test.mjs` tests satisfied (already present).
- [ ] `doc/implementation-plan.md` Phase 5 CP/FP section updated to describe multi-spend button.
- [ ] `doc/rules-reference.md` confirms/clarifies CP rule text matches impl.

## All Needed Context

### Documentation & References

```yaml
- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/PRPs/feats/feat024_refactor_cp_expenditure.md
  why: Feature spec — mandatory reading. Lists 4 roll sites, in-place update rule, difficulty embed.

- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/modules/apps/character-sheet.mjs
  why: >
    Four roll handlers + three post-chat helpers live here.
      #rollSkill        ~line 191   → calls #postRollToChat
      #rollAttribute    ~line 230   → calls #postRollToChat
      #rollAttack       ~line 351   → calls #postAttackToChat
      #rollForceSkill   ~line 578   → calls #postForceRollToChat
      #postRollToChat        ~288
      #postAttackToChat      ~504
      #postForceRollToChat   ~622
    Each post-chat helper emits `<div class="starwarsd6 roll-result">` with `.roll-dice`,
    `.roll-total`, and (for skill/attr) `.roll-difficulty` or (for attack) `.roll-defense`.
    `useForcePoint` is a local in every handler after dialog return — already available.

- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/starwarsd6.mjs
  why: >
    Existing `Hooks.on("renderChatMessageHTML", (message, html) => ...)` at line 73 wires
    `.roll-damage-btn` and `.mark-hit-box-btn`. EXACT pattern to mirror for `.spend-cp-btn`:
      - html.querySelectorAll(".spend-cp-btn:not([disabled])").forEach(btn => ...)
      - Use DOMParser to mutate stored content, doc.body.firstElementChild.outerHTML when saving.
      - Use game.messages.get(message.id) then chatMsg.update({ content }).

- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/modules/helpers/dice.mjs
  why: >
    `rollExtraDie(_rollFn = rollOneDie)` already exists (line 65). Returns a single d6 face via
    Foundry `Roll` under the hood. Use directly — do not reimplement.

- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/tests/unit/cp-expenditure.test.mjs
  why: >
    Tests ALREADY WRITTEN. They import `rollExtraDie` and assert the click-handler behaviour on
    injected DOM-like fakes. Implementation must be refactorable so the same logic is extractable
    or at minimum matches the contract:
      - `cp <= 0` → no actor.update, no chatMsg.update, returns { hidden:true, updated:false }.
      - Happy path: decrement CP, replace `<span class="total-value">N</span>` with new total,
        update live DOM total, call chatMsg.update once, remove `.cp-action` when newCp <= 0.
      - `canSpendCp` gate: `!useForcePoint && cp > 0`.
    Implementation plan below proposes extracting the click logic into a pure helper that the
    hook wiring calls — tests depend on this shape.

- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/lang/en.json
  why: >
    Existing keys reused:
      "STARWARSD6.CP.SpendCP": "Spend CP (+1D)"      (line 122)
      "STARWARSD6.CP.CPSpent": "CP Spent"            (line 123)
      "STARWARSD6.Roll.ExtraDie": "extra die (CP)"   (line 126)
      "STARWARSD6.RollSuccess": "Success"            (line 171)
      "STARWARSD6.RollFailure": "Failure"            (line 172)
      "STARWARSD6.Combat.Hit"   / "STARWARSD6.Combat.Miss"  (lines 100-101)
      "STARWARSD6.RollDifficulty"
    No new keys needed unless new button text desired.

- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/doc/implementation-plan.md
  why: Update Phase 5 (CP/FP) section to describe multi-spend chat card button. Mandatory.

- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/doc/rules-reference.md
  why: Confirm CP rule text ("any number of CP per roll, declared before GM resolves") matches impl.

- file: /home/perico/1_projects/101_dev/fvtt-starwarsd6/PRPs/PRP-feat023_remove_fp_cp_expenditure_cap.md
  why: Context — how feat023 removed fpSpentThisRound machinery. Do NOT reintroduce any flag tracking.

- doc: https://foundryvtt.com/api/v13/classes/foundry.documents.ChatMessage.html
  section: update() — use chatMsg.update({ content }) to mutate stored HTML.

- doc: https://foundryvtt.com/api/v13/modules/hookEvents.html#event:renderChatMessageHTML
  section: renderChatMessageHTML hook signature (v13). Use this hook, NOT deprecated renderChatMessage.
```

### Affected codebase tree

```
starwarsd6/
├── starwarsd6.mjs                              # EXTEND renderChatMessageHTML hook: wire .spend-cp-btn
├── modules/
│   ├── apps/
│   │   └── character-sheet.mjs                 # 4 handlers + 3 post-chat helpers: add canSpendCp
│   └── helpers/
│       ├── dice.mjs                            # already exports rollExtraDie (no change)
│       └── cp-spend.mjs  (NEW, optional)       # Extract click-handler logic for testability
├── tests/
│   └── unit/
│       └── cp-expenditure.test.mjs             # EXISTS — keep passing
├── doc/
│   ├── implementation-plan.md                  # UPDATE Phase 5 CP/FP entry
│   └── rules-reference.md                      # confirm/tighten CP rule text
└── lang/
    └── en.json                                 # no change unless new label desired
```

### Known Gotchas

```js
// CRITICAL: Four roll handlers, four post-chat helpers. Three helpers emit chat cards.
//   - #rollSkill + #rollAttribute → #postRollToChat
//   - #rollAttack                 → #postAttackToChat
//   - #rollForceSkill             → #postForceRollToChat
// All three helpers must accept canSpendCp, difficulty/defenseValue, rollType and render the button.

// CRITICAL: Use `renderChatMessageHTML` (v13), NOT deprecated `renderChatMessage`.
// Mirror the existing hook pattern in starwarsd6.mjs:73 — same `html.querySelectorAll(...)` shape.

// CRITICAL: canSpendCp must be computed AFTER dialog closes, using the post-spend FP state
// but the CP value at roll-time. Recommended form:
//   const cp = this.document.system.characterPoints;
//   const canSpendCp = !useForcePoint && cp > 0;
// Even safer: re-read live CP at click-time (tests do). Do not trust DOM-embedded CP.

// CRITICAL: In-place mutation only. Use chatMsg.update({ content }) — NEVER ChatMessage.create.
// Parse stored content with DOMParser, mutate, serialize via doc.body.firstElementChild.outerHTML.
// Live DOM update separately: html.querySelector(".total-value").textContent = newTotal
// (the hook receives the live html element — see feat023's damage button for the pattern).

// CRITICAL: Result label recomputation.
//   - For combat (rollType="combat"): HIT if newTotal >= difficulty else MISS.
//   - For skill/attribute/force (rollType="skill"|"attribute"|"force"): SUCCESS/FAILURE.
// Difficulty is frozen per card — read from `data-difficulty` on the container.
// Update both the text (localized) and the CSS class on the `.success`/`.failure`/`.hit`/`.miss`
// span. For force rolls, difficulty may be null (no difficulty shown) — skip label recompute.

// CRITICAL: Appending new d6 to Normal dice list.
// Current render emits:   `Normal: [3, 5] | Wild: 6`
// Mutate the text inside `.roll-dice` to become:  `Normal: [3, 5, 2] | Wild: 6`
// If `Normal: ` prefix missing (zero normal dice before), add it. Use regex replace on innerHTML
// or parse + rebuild the .roll-dice content. Keep Wild display untouched.

// CRITICAL: `actor.update()` silently fails for unowned actors. No extra permission guard needed.

// CRITICAL: Hide button = remove `.cp-action` DOM node (stored + live). Do NOT use disabled.

// NOTE: `Hooks.on("renderChatMessageHTML", ...)` receives a raw HTMLElement as `html`.
// Use `html.querySelectorAll(...)` — NOT jQuery `$(html).find(...)`.
// Re-run on every render (Foundry re-renders messages on update). Guard with `:not([disabled])`
// or a dataset flag to avoid double-binding — though button removal after CP=0 inherently
// prevents re-trigger.

// NOTE: tests/unit/cp-expenditure.test.mjs imports `rollExtraDie` directly. If you extract the
// click logic to `modules/helpers/cp-spend.mjs`, export `handleSpendCpClick(...)` with the exact
// signature the test already uses: { actor, dieFace, chatMsg, liveTotal } — adapt test or impl
// so they align. Simplest: keep the test's local handler as-is (it's self-contained), and make
// sure the real hook code is logically identical.

// NOTE: NPCs have no `characterPoints`. Hook handler must check `actor.type === "character"` early.

// NOTE: `tests/unit/cp-expenditure.test.mjs` does NOT test result-label recompute. Add tests for:
//   (f) result MISS → HIT when newTotal crosses difficulty
//   (g) result SUCCESS → FAILURE does not happen (monotonic +d6, can only upgrade outcome)
// and (e) new d6 appended to Normal dice list in stored content.
```

## Implementation Blueprint

### Data flow

```
[Player clicks roll button]
  → handler computes useForcePoint, cp, canSpendCp
  → post-chat helper builds content with cp-action block (if canSpendCp) + data-* on container
  → ChatMessage.create → message renders

[Player clicks Spend CP on card]
  → renderChatMessageHTML hook listener fires
  → read actor via data-actor-id; bail if !actor or actor.type !== "character"
  → cp = actor.system.characterPoints; bail if cp <= 0
  → dieFace = await rollExtraDie()
  → parse stored chatMsg.content with DOMParser
  → mutate: append dieFace to .roll-dice Normal list, update .total-value, recompute label
  → live DOM: mirror the same mutations on `html` element
  → actor.update({ "system.characterPoints": cp - 1 })
  → if (cp - 1) <= 0: remove .cp-action from stored + live
  → chatMsg.update({ content: doc.body.firstElementChild.outerHTML })
```

### Task list (ordered)

```yaml
Task 1 — MODIFY modules/apps/character-sheet.mjs: #postRollToChat
  - FIND: signature `static async #postRollToChat(actor, label, result, numActions, { keepUpPenalty = 0, penaltyDice = 0, penaltyPips = 0, difficulty = null } = {})`
  - ADD params: `canSpendCp = false`, `rollType = "skill"`
  - EMBED on `.starwarsd6.roll-result` div:
      data-actor-id="${actor.id}"
      data-difficulty="${hasDifficulty ? difficulty : ''}"
      data-roll-type="${rollType}"
  - APPEND after `${difficultyStr}` (before closing `</div>`):
      ${canSpendCp ? cpButtonHtml(actor.id) : ''}
  - PRESERVE existing behavior.

Task 2 — MODIFY modules/apps/character-sheet.mjs: #postAttackToChat
  - Same treatment: add `canSpendCp = false` param, embed data-* on container,
    render cp-action block alongside damage-action block. Use rollType="combat",
    difficulty=defenseValue.

Task 3 — MODIFY modules/apps/character-sheet.mjs: #postForceRollToChat
  - Same treatment: add `canSpendCp = false` param, embed data-* on container.
    rollType="force". Force rolls have no difficulty in current render — pass null/empty.
    (Spec: CP still spendable post-force-roll when no FP used; skip label recompute if no diff.)

Task 4 — ADD static helper in CharacterSheet: #buildCpActionHtml(actorId)
  - Returns: `<div class="cp-action"><button type="button" class="spend-cp-btn"
             data-actor-id="${actorId}">${game.i18n.localize("STARWARSD6.CP.SpendCP")}</button></div>`
  - Called from all three post-chat helpers.

Task 5 — MODIFY #rollSkill: compute canSpendCp, pass to #postRollToChat
  - AFTER `const { numActions, useForcePoint, difficulty } = result;`
      const cp = this.document.system.characterPoints;
      const canSpendCp = !useForcePoint && cp > 0;
  - Update call:
      await CharacterSheet.#postRollToChat(
        this.document, skill.name, rollResult, numActions,
        { keepUpPenalty, penaltyDice, penaltyPips, difficulty, canSpendCp, rollType: "skill" }
      );

Task 6 — MODIFY #rollAttribute: same as Task 5, rollType="attribute".

Task 7 — MODIFY #rollAttack: same, rollType="combat", passes canSpendCp alongside existing args.

Task 8 — MODIFY #rollForceSkill: same, rollType="force".

Task 9 — EXTEND starwarsd6.mjs Hooks.on("renderChatMessageHTML", ...)
  - INSIDE the same callback at line 73, after the existing `.mark-hit-box-btn` block,
    add a new block:
      html.querySelectorAll(".spend-cp-btn:not([disabled])").forEach(btn => {
        btn.addEventListener("click", async () => {
          const actorId = btn.dataset.actorId;
          const actor = game.actors.get(actorId);
          if (!actor || actor.type !== "character") return;
          const cp = actor.system.characterPoints;
          if (cp <= 0) return;

          // Roll 1d6
          const dieFace = await rollExtraDie();
          await showRollAnimation( /* optional: build a Roll for DSN */ );

          // Mutate stored content
          const chatMsg = game.messages.get(message.id);
          if (!chatMsg) return;
          const parser = new DOMParser();
          const doc = parser.parseFromString(chatMsg.content, "text/html");
          const container = doc.querySelector(".starwarsd6.roll-result");
          if (!container) return;

          // Update total
          const totalSpan = container.querySelector(".total-value");
          const oldTotal = parseInt(totalSpan.textContent) || 0;
          const newTotal = oldTotal + dieFace;
          totalSpan.textContent = String(newTotal);

          // Append to Normal dice list
          const rollDiceEl = container.querySelector(".roll-dice");
          if (rollDiceEl) {
            const html = rollDiceEl.innerHTML;
            if (/Normal:\s*\[/.test(html)) {
              rollDiceEl.innerHTML = html.replace(
                /Normal:\s*\[([^\]]*)\]/,
                (_, inner) => `Normal: [${inner}${inner.trim() ? ", " : ""}${dieFace}]`
              );
            } else {
              rollDiceEl.innerHTML = `Normal: [${dieFace}] | ` + html;
            }
          }

          // Recompute result label against stored difficulty
          const difficulty = parseInt(container.dataset.difficulty);
          const rollType = container.dataset.rollType;
          if (Number.isFinite(difficulty) && difficulty > 0) {
            const isSuccess = newTotal >= difficulty;
            if (rollType === "combat") {
              const span = container.querySelector(".roll-defense .hit, .roll-defense .miss");
              if (span) {
                span.className = isSuccess ? "hit" : "miss";
                span.textContent = game.i18n.localize(
                  isSuccess ? "STARWARSD6.Combat.Hit" : "STARWARSD6.Combat.Miss"
                );
              }
            } else {
              const span = container.querySelector(".roll-difficulty .success, .roll-difficulty .failure");
              if (span) {
                span.className = isSuccess ? "success" : "failure";
                span.textContent = game.i18n.localize(
                  isSuccess ? "STARWARSD6.RollSuccess" : "STARWARSD6.RollFailure"
                );
              }
            }
          }

          // Decrement CP
          const newCp = cp - 1;
          await actor.update({ "system.characterPoints": newCp });

          // Remove button block in stored content if CP exhausted
          if (newCp <= 0) {
            const block = container.querySelector(".cp-action");
            if (block) block.remove();
          }

          // Mirror mutations onto live DOM (html element)
          const liveContainer = html.querySelector(".starwarsd6.roll-result");
          if (liveContainer) {
            const liveTotal = liveContainer.querySelector(".total-value");
            if (liveTotal) liveTotal.textContent = String(newTotal);
            const liveDice = liveContainer.querySelector(".roll-dice");
            if (liveDice) liveDice.innerHTML = rollDiceEl.innerHTML;
            if (rollType === "combat") {
              const liveSpan = liveContainer.querySelector(".roll-defense .hit, .roll-defense .miss");
              const storedSpan = container.querySelector(".roll-defense .hit, .roll-defense .miss");
              if (liveSpan && storedSpan) {
                liveSpan.className = storedSpan.className;
                liveSpan.textContent = storedSpan.textContent;
              }
            } else {
              const liveSpan = liveContainer.querySelector(".roll-difficulty .success, .roll-difficulty .failure");
              const storedSpan = container.querySelector(".roll-difficulty .success, .roll-difficulty .failure");
              if (liveSpan && storedSpan) {
                liveSpan.className = storedSpan.className;
                liveSpan.textContent = storedSpan.textContent;
              }
            }
            if (newCp <= 0) {
              const liveBlock = liveContainer.querySelector(".cp-action");
              if (liveBlock) liveBlock.remove();
            }
          }

          await chatMsg.update({ content: doc.body.firstElementChild.outerHTML });
        });
      });
  - Ensure `rollExtraDie` is imported at the top of starwarsd6.mjs:
      import { rollDamage, rollExtraDie } from "./modules/helpers/dice.mjs";

Task 10 — VERIFY tests/unit/cp-expenditure.test.mjs still passes.
  - Tests use an isolated local handleSpendCpClick that mirrors the intended logic.
  - Ensure behavioural parity: click = decrement + update total + hide on last.
  - If needed, ADD tests for:
      - result label recomputation when crossing difficulty (MISS → HIT for combat).
      - Normal dice list appending (stored content contains "Normal: [..., N]").
      - canSpendCp=false when useForcePoint=true (no button in rendered content).

Task 11 — UPDATE doc/implementation-plan.md
  - Phase 5 CP/FP section: describe repeatable button, in-place update, no flags.

Task 12 — UPDATE doc/rules-reference.md
  - Confirm CP rule: "Any number of CP may be spent on a single roll, before GM declares
    success/failure. Each CP spent adds 1d6 (no wild, no pips) to the roll total."
```

### Integration points

```yaml
RENDER HOOK:
  - file: starwarsd6.mjs
  - pattern: extend existing Hooks.on("renderChatMessageHTML", ...) callback at line 73
  - import rollExtraDie from modules/helpers/dice.mjs

CHAT CARD STRUCTURE:
  - container: <div class="starwarsd6 roll-result" data-actor-id data-difficulty data-roll-type>
  - dice line: <div class="roll-dice">Normal: [d1, d2] | Wild: <b>W</b></div>
  - total:    <div class="roll-total"><strong>Total: <span class="total-value">N</span></strong></div>
  - result:   <div class="roll-difficulty">... <span class="success|failure">...</span></div>
              or combat: <div class="roll-defense">... <span class="hit|miss">...</span></div>
  - action:   <div class="cp-action"><button class="spend-cp-btn" data-actor-id="...">Spend CP</button></div>

NO MIGRATION: no persisted flags or schema change.
```

## Validation Loop

### Level 1: Syntax and static grep

```bash
cd /home/perico/1_projects/101_dev/fvtt-starwarsd6

# Button wiring must exist exactly once
grep -n "spend-cp-btn" starwarsd6.mjs modules/apps/character-sheet.mjs

# Must be zero occurrences of fpSpentThisRound (feat023 invariant)
grep -rn "fpSpentThisRound" modules/ starwarsd6.mjs

# canSpendCp must be computed in all four roll handlers
grep -n "canSpendCp" modules/apps/character-sheet.mjs    # expect >= 4 sites

# rollExtraDie imported in starwarsd6.mjs
grep -n "rollExtraDie" starwarsd6.mjs modules/helpers/dice.mjs
```

### Level 2: Unit tests

```bash
cd /home/perico/1_projects/101_dev/fvtt-starwarsd6
npm test
# Expected: tests/unit/cp-expenditure.test.mjs all pass,
# plus full suite (~80+ tests) still green.
```

Test additions (append to `tests/unit/cp-expenditure.test.mjs`):

```js
it("appends new d6 to Normal dice list in stored content", async () => {
  const actor = makeActor(2);
  const chatMsg = {
    content: `<div class="starwarsd6 roll-result"><div class="roll-dice">Normal: [3, 5] | Wild: <b>4</b></div><div class="roll-total"><span class="total-value">12</span></div><div class="cp-action"><button class="spend-cp-btn"></button></div></div>`,
    update: vi.fn(async function({ content }) { this.content = content; })
  };
  // ... invoke an extended handler that mutates Normal list, assert /Normal: \[3, 5, 6\]/.test(chatMsg.content)
});

it("flips MISS → HIT when new total crosses difficulty", async () => {
  // container has data-difficulty="10" data-roll-type="combat", initial total=8 (MISS)
  // dieFace=4 → newTotal=12 → HIT. Assert class flip.
});
```

### Level 3: Manual smoke test (Foundry VTT)

```text
1. Open a character sheet with CP > 0, FP > 0.
2. Roll a skill without checking FP → chat card shows "Spend CP (+1D)" button.
3. Click button → new d6 appears in Normal list, total updates, CP decrements on sheet.
4. Click again multiple times → total keeps increasing, CP keeps decrementing.
5. If difficulty was set and the running total crosses it → label flips FAILURE→SUCCESS.
6. When CP hits 0 → button vanishes (removed from DOM), remaining clicks impossible.
7. Re-roll same skill with FP checked → NO "Spend CP" button rendered on that card.
8. Attack roll, force-skill roll: repeat steps 2-7 — all three card types behave identically.
9. Reopen Foundry (reload page) — chat card persists with updated total and no button (if CP was 0).
```

## Final Validation Checklist

- [ ] All four roll handlers pass `canSpendCp` and `rollType` to their post-chat helpers.
- [ ] Three post-chat helpers (`#postRollToChat`, `#postAttackToChat`, `#postForceRollToChat`)
      embed `data-actor-id`, `data-difficulty`, `data-roll-type` and optionally render `.cp-action`.
- [ ] `Hooks.on("renderChatMessageHTML", ...)` in `starwarsd6.mjs` wires `.spend-cp-btn` click →
      roll extra die, mutate stored + live DOM, `actor.update`, hide-on-zero.
- [ ] `npm test` all green (including existing cp-expenditure tests).
- [ ] `grep fpSpentThisRound modules/ starwarsd6.mjs` returns nothing.
- [ ] Manual smoke test passes for skill, attribute, attack, force-skill rolls.
- [ ] `doc/implementation-plan.md` Phase 5 CP/FP section updated.
- [ ] `doc/rules-reference.md` CP text consistent with implementation.

---

## Anti-Patterns to Avoid

- ❌ Do NOT call `ChatMessage.create` on spend — always mutate the existing message via
     `chatMsg.update({ content })`.
- ❌ Do NOT reintroduce any flag tracking (feat023 removed `fpSpentThisRound`).
- ❌ Do NOT leave the button visible and disabled — remove the `.cp-action` DOM node.
- ❌ Do NOT read CP from the DOM — always read `actor.system.characterPoints` at click time.
- ❌ Do NOT wire on deprecated `renderChatMessage` — use `renderChatMessageHTML` (v13).
- ❌ Do NOT use jQuery `$(html).find(...)` — the hook gives a raw HTMLElement; use
     `html.querySelectorAll(...)`.
- ❌ Do NOT rebuild the entire dice list — append-only.
- ❌ Do NOT trust the roll-time CP count on the card — player may have spent on a prior card.

---

*Confidence score: 8/10 — High: feat023 done, exact roll-site lines known, tests pre-written,
render hook pattern mirrored from damage/hit-box. Risk: Normal dice regex edge cases
(empty list, whitespace variance) and live-vs-stored DOM mirror bugs — covered by gotchas
and the existing test harness.*
