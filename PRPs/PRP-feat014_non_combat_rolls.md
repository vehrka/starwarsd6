# PRP-feat014 — Non-Combat Skill Roll Difficulty

## Goal

Add a **Difficulty** number input to `RollDialog` for all non-combat skill and attribute rolls.
After rolling, the chat card shows the difficulty used and a **Success / Failure** label.

End state:
- `#rollSkill` and `#rollAttribute` in `character-sheet.mjs` compute a `defaultDifficulty` and pass it to `RollDialog.prompt()` via a new `defaultDifficulty` option
- `RollDialog` shows the Difficulty input pre-filled with `defaultDifficulty` whenever a new `showDifficulty` flag is set
- After rolling, `#postRollToChat` receives the difficulty value and renders it + a success/failure label on the chat card
- If difficulty is `0` / blank / `NaN` → no pass/fail judgement, total shown as-is
- Combat attack path (`#rollAttack`) is **not changed**

## Why

- Skill rolls currently produce a total with no difficulty to compare against — GM has to eyeball the result
- Making difficulty explicit and visible speeds up play and reduces GM cognitive load
- The `RollDialog` already has a difficulty input for the no-target attack case (feat013) — this feature reuses that mechanism for all non-combat rolls

## What

### Success Criteria

- [ ] `RollDialog.prompt({ showDifficulty: true, defaultDifficulty: N })` renders the Difficulty input pre-filled with `N`
- [ ] `#rollSkill` computes `defaultDifficulty = Math.ceil(3.5 * skill.system.dicePool)` and passes it
- [ ] `#rollAttribute` computes `defaultDifficulty = Math.ceil(3.5 * attr.dice)` and passes it
- [ ] Roll dialog returns `difficulty` in its resolved object for non-attack rolls
- [ ] Chat card shows difficulty value and **Success** / **Failure** label when `difficulty > 0`
- [ ] Chat card shows total only (no label) when difficulty is `0` / blank
- [ ] Combat attack path (`#rollAttack`) is unchanged
- [ ] Force skill path (`#rollForceSkill`) is unchanged
- [ ] `lang/en.json` adds: `SWFD6.RollDifficulty`, `SWFD6.RollSuccess`, `SWFD6.RollFailure`

---

## All Needed Context

### Documentation & References

```yaml
- file: modules/apps/roll-dialog.mjs
  why: The file to modify — already has difficulty input behind noTarget flag (feat013)
  critical: |
    CURRENT state (post-feat013):
      - Private field: #noTarget = false
      - prompt() signature: { canSpendFP, hasFP, isForceRoll, noTarget, ...options }
      - _prepareContext: passes context.noTarget
      - #onSubmit: reads difficulty only when this.#noTarget is true
      - Template: shows difficulty input only when {{#if noTarget}}
    
    NEW approach for feat014:
      - Replace #noTarget with a more general #showDifficulty = false and #defaultDifficulty = 0
      - prompt() gains: showDifficulty = false, defaultDifficulty = 0
      - #rollAttack still passes showDifficulty=true (replacing noTarget=true)
      - #rollSkill and #rollAttribute pass showDifficulty=true, defaultDifficulty computed
      - Template: {{#if showDifficulty}} renders the input with value={{defaultDifficulty}}
      - #onSubmit: reads difficulty when this.#showDifficulty is true

    IMPORTANT: noTarget was only ever set from #rollAttack. Replacing it with showDifficulty
    keeps the attack path working — just rename the field and update the template condition.

- file: modules/apps/character-sheet.mjs
  why: All roll actions are private static methods here; modify #rollSkill and #rollAttribute
  critical: |
    #rollSkill:
      - skill.system.dicePool = parent attribute dice + rank (no wound penalty)
      - defaultDifficulty = Math.ceil(3.5 * skill.system.dicePool)
      - Pass showDifficulty: true, defaultDifficulty to RollDialog.prompt()
      - Destructure difficulty from result
      - Pass difficulty to #postRollToChat
    
    #rollAttribute:
      - attr = this.document.system[attributeKey]
      - defaultDifficulty = Math.ceil(3.5 * attr.dice)
      - Pass showDifficulty: true, defaultDifficulty to RollDialog.prompt()
      - Destructure difficulty from result
      - Pass difficulty to #postRollToChat
    
    #rollAttack (NO CHANGE to logic):
      - Currently passes noTarget to RollDialog.prompt()
      - After this PRP: passes showDifficulty: noTarget (same boolean, renamed)
      - No defaultDifficulty needed for attack — it was always 0 in the dialog
    
    #rollForceSkill (NO CHANGE):
      - Does not pass noTarget or showDifficulty — keeps current behaviour
    
    #postRollToChat:
      - Signature extended with optional { difficulty = null }
      - When difficulty > 0: renders difficulty line + success/failure label
      - When difficulty is null / 0 / NaN: renders total only (no label)

- file: templates/dice/roll-dialog.hbs
  why: Rename noTarget → showDifficulty, add value binding for defaultDifficulty
  critical: |
    CURRENT:
      {{#if noTarget}}
      <div class="form-group">
        <label>{{localize "STARWARSD6.Combat.Difficulty"}}</label>
        <input type="number" name="difficulty" value="0" min="0" max="99" />
      </div>
      {{/if}}
    
    NEW:
      {{#if showDifficulty}}
      <div class="form-group">
        <label>{{localize "STARWARSD6.RollDifficulty"}}</label>
        <input type="number" name="difficulty" value="{{defaultDifficulty}}" min="0" max="99" />
      </div>
      {{/if}}
    
    Use the new key STARWARSD6.RollDifficulty (not Combat.Difficulty) to avoid confusion
    with the combat-specific label. The attack path will now also show this label — that
    is acceptable since "Difficulty" is a general term.

- file: lang/en.json
  why: Add 3 new i18n keys
  critical: |
    Add:
      "STARWARSD6.RollDifficulty": "Difficulty",
      "STARWARSD6.RollSuccess": "Success",
      "STARWARSD6.RollFailure": "Failure"
    
    Existing key "STARWARSD6.Combat.Difficulty" stays — it is used in the attack chat card
    for the defense label line ("Difficulty: 14 — Hit/Miss"). Keep it.

- file: modules/items/skill-data.mjs
  why: Understand what dicePool contains — NO changes needed
  critical: |
    prepareDerivedData():
      this.dicePool = parentAttr.dice + this.rank  (for normal skills)
      this.dicePool = this.forceDice               (for Force skills)
    
    dicePool is ALREADY the raw dice count (no wound penalty).
    defaultDifficulty = Math.ceil(3.5 * skill.system.dicePool) — correct, no penalty needed.
    The feature spec example confirms: blaster 3D+2 → ceil(3.5×3) = 11, using dicePool=3.

- file: modules/actors/character-data.mjs
  why: Understand attr.dice — NO changes needed
  critical: |
    attr.dice = the raw dice count stored on the attribute.
    No wound penalty is baked in — wound penalty is penaltyDice/penaltyPips, applied at roll time.
    defaultDifficulty for an attribute roll = Math.ceil(3.5 * attr.dice).

- file: doc/rules-reference.md  (lines 167–183)
  why: Authoritative rules for difficulty numbers — defines what the difficulty field represents
  critical: |
    ## Difficulty Numbers
    When a character attempts a non-opposed action, the GM assigns a difficulty number.
    Roll the relevant skill (or attribute if unskilled). If the total equals or exceeds
    the difficulty number, the action succeeds.

    | Difficulty  | Range   | Reference Die Code |
    |-------------|---------|-------------------|
    | Very Easy   | 1–5     | 1D                |
    | Easy        | 6–10    | 2D                |
    | Moderate    | 11–15   | 3D–4D             |
    | Difficult   | 16–20   | 4D–5D             |
    | Very Hard   | 21–30   | 5D–6D+            |
    | Heroic      | 31+     | 6D+               |

    The "Reference Die Code" is the approximate skill level needed for a reasonable
    chance of success — this is exactly what the defaultDifficulty formula approximates:
    ceil(3.5 × N) gives the median roll for a skill with N dice.

- file: tests/unit/dice.test.mjs
  why: Existing test patterns to mirror for any new unit tests; shows makeMockRoll helper
  critical: |
    Test file already covers rollWithWildDie and rollExtraDie (feat009).
    No dice.mjs changes in this feature — no new dice tests needed.
    The makeMockRoll helper uses vi.fn() with a sequence array.
    All tests use: import { describe, it, expect, vi } from "vitest"

- file: tests/unit/character-data.test.mjs
  why: Existing actor data test patterns — shows how to test derived values
  critical: |
    Tests use a mock actor built from CharacterData directly (no Foundry globals needed).
    Pattern: const data = new CharacterData({ DEX: { dice: 3, pips: 2 }, ... })
    This feature has no new data model changes, so no new character-data tests are needed.
```

### Current Codebase Tree (relevant files)

```
starwarsd6/
├── modules/
│   ├── apps/
│   │   ├── character-sheet.mjs     # MODIFY: #rollSkill, #rollAttribute, #postRollToChat
│   │   └── roll-dialog.mjs         # MODIFY: #noTarget → #showDifficulty, add #defaultDifficulty
│   └── items/
│       └── skill-data.mjs          # NO CHANGE — dicePool already correct
├── templates/
│   └── dice/
│       └── roll-dialog.hbs         # MODIFY: rename noTarget → showDifficulty, bind defaultDifficulty
└── lang/
    └── en.json                     # MODIFY: 3 new keys
```

### Desired Codebase Tree

No new files. Four existing files are modified.

### Known Gotchas

```js
// CRITICAL: defaultDifficulty uses raw dicePool / attr.dice — NOT post-penalty effective dice.
// Example: blaster 3D+2 → dicePool=3 → ceil(3.5×3) = 11. Even if actor has wound marks,
// the default difficulty stays 11. Wound penalty reduces the roll, not the default difficulty.

// CRITICAL: #noTarget in roll-dialog.mjs is renamed to #showDifficulty.
// The #rollAttack path currently passes { noTarget } — change that call to { showDifficulty: noTarget }.
// The boolean value is identical; only the field name changes.

// CRITICAL: difficulty returned from dialog is already handled with Math.min(99, Math.max(0, parseInt(...)))
// in #onSubmit. A cleared/blank field will parse as NaN → parseInt("") = NaN → NaN fails both
// comparisons → it resolves to 0 (because Math.max(0, NaN) = 0). So difficulty=0 means "none".

// WAIT — that's wrong. Math.max(0, NaN) = NaN in JavaScript. Verify:
// parseInt("") → NaN; Math.max(0, NaN) → NaN; Math.min(99, NaN) → NaN
// So a blank field returns NaN from #onSubmit. Handle this in #postRollToChat:
// treat difficulty as "none" if: difficulty === null || !Number.isFinite(difficulty) || difficulty === 0

// CRITICAL: The template input value="{{defaultDifficulty}}" — if defaultDifficulty is 0,
// the input pre-fills with 0. The user can clear it to get "no difficulty" behaviour.
// That is correct per the spec: "If no difficulty is entered (field cleared / 0), skip pass/fail."

// CRITICAL: #onSubmit currently only reads difficulty when this.#noTarget is true.
// After rename to #showDifficulty, the logic is identical — just rename the guard.

// CRITICAL: #postRollToChat is called from both #rollSkill and #rollAttribute with
// the same options object pattern. Add difficulty to that options object, NOT as a
// separate positional param (consistent with keepUpPenalty, penaltyDice, penaltyPips pattern).

// CRITICAL: lang key for dialog label is STARWARSD6.RollDifficulty (new),
// but the attack chat card continues to use STARWARSD6.Combat.Difficulty for the
// "Difficulty: X — Hit/Miss" line. These are two different display contexts.
```

---

## Implementation Blueprint

### Task 1 — MODIFY `modules/apps/roll-dialog.mjs`

Rename `#noTarget` → `#showDifficulty`, add `#defaultDifficulty`, update `prompt()`, `_prepareContext()`, and `#onSubmit`.

```yaml
MODIFY modules/apps/roll-dialog.mjs:
  - RENAME private field #noTarget to #showDifficulty
  - ADD private field #defaultDifficulty = 0
  - CHANGE prompt() signature to accept showDifficulty and defaultDifficulty
  - CHANGE _prepareContext() to pass showDifficulty and defaultDifficulty
  - CHANGE #onSubmit to use this.#showDifficulty guard (was this.#noTarget)
```

Pseudocode:
```js
// Private fields
#showDifficulty = false;   // renamed from #noTarget
#defaultDifficulty = 0;    // NEW

// prompt() — backward compatible: old callers passing noTarget=true still work
// because noTarget is not in the new signature; callers are updated in Task 3.
static async prompt({ canSpendFP = false, hasFP = false, isForceRoll = false,
                      showDifficulty = false, defaultDifficulty = 0, ...options } = {}) {
  return new Promise(resolve => {
    const dialog = new RollDialog(options);
    dialog.#resolve = resolve;
    dialog.#canSpendFP = canSpendFP;
    dialog.#hasFP = hasFP;
    dialog.#isForceRoll = isForceRoll;
    dialog.#showDifficulty = showDifficulty;
    dialog.#defaultDifficulty = defaultDifficulty;
    dialog.render(true);
  });
}

async _prepareContext(options) {
  const context = await super._prepareContext(options);
  context.numActions = 1;
  context.canSpendFP = this.#canSpendFP;
  context.hasFP = this.#hasFP;
  context.isForceRoll = this.#isForceRoll;
  context.showDifficulty = this.#showDifficulty;       // was noTarget
  context.defaultDifficulty = this.#defaultDifficulty; // NEW
  return context;
}

static #onSubmit(event, form, formData) {
  const numActions = Math.min(4, Math.max(1, parseInt(formData.object.numActions ?? "1")));
  const useForcePoint = !!formData.object.useForcePoint;
  const forceDifficultyModifier = this.#isForceRoll
    ? Math.min(30, Math.max(0, parseInt(formData.object.forceDifficultyModifier ?? "0")))
    : 0;
  const difficulty = this.#showDifficulty               // was this.#noTarget
    ? parseInt(formData.object.difficulty ?? "0")       // keep NaN possible — handled downstream
    : null;
  if (!this.#resolved) {
    this.#resolved = true;
    this.#resolve({ numActions, useForcePoint, forceDifficultyModifier, difficulty });
  }
}
```

> Note: Remove the `Math.min/Math.max` clamping from the difficulty read in `#onSubmit` — leave it as raw `parseInt` so NaN passes through. The downstream `#postRollToChat` handles the NaN/0/null cases uniformly with `Number.isFinite(difficulty) && difficulty > 0`.

---

### Task 2 — MODIFY `templates/dice/roll-dialog.hbs`

Rename `noTarget` → `showDifficulty`, bind `defaultDifficulty` to the input value.

```yaml
MODIFY templates/dice/roll-dialog.hbs:
  - REPLACE {{#if noTarget}} with {{#if showDifficulty}}
  - REPLACE localize "STARWARSD6.Combat.Difficulty" with localize "STARWARSD6.RollDifficulty"
  - REPLACE value="0" with value="{{defaultDifficulty}}"
```

Full updated difficulty block:
```hbs
{{#if showDifficulty}}
<div class="form-group">
  <label>{{localize "STARWARSD6.RollDifficulty"}}</label>
  <input type="number" name="difficulty" value="{{defaultDifficulty}}" min="0" max="99" />
</div>
{{/if}}
```

---

### Task 3 — MODIFY `modules/apps/character-sheet.mjs`

Three changes: update `#rollSkill`, update `#rollAttribute`, update `#rollAttack` (rename param), update `#postRollToChat`.

```yaml
MODIFY modules/apps/character-sheet.mjs:
  - #rollSkill: compute defaultDifficulty, pass showDifficulty+defaultDifficulty to prompt(), destructure difficulty, pass to #postRollToChat
  - #rollAttribute: same pattern with attr.dice
  - #rollAttack: change noTarget → showDifficulty: noTarget in prompt() call (no other change)
  - #postRollToChat: add optional difficulty to options, render difficulty + success/failure line
```

**`#rollSkill` pseudocode:**
```js
static async #rollSkill(event, target) {
  const skillId = target.dataset.skillId;
  const skill = this.document.items.get(skillId);
  if (!skill) return;

  const fp = this.document.system.forcePoints;
  const fpSpent = !!this.document.getFlag("starwarsd6", "fpSpentThisRound");
  const defaultDifficulty = Math.ceil(3.5 * skill.system.dicePool);  // NEW

  const result = await RollDialog.prompt({
    canSpendFP: !fpSpent, hasFP: fp > 0,
    showDifficulty: true,            // NEW
    defaultDifficulty                // NEW
  });
  if (result === null) return;

  const { numActions, useForcePoint, difficulty } = result;  // destructure difficulty

  if (useForcePoint) {
    await this.document.update({ "system.forcePoints": Math.max(0, fp - 1) });
    await this.document.setFlag("starwarsd6", "fpSpentThisRound", true);
  }

  const keepUpPenalty = this.document.system.keepUpPenalty ?? 0;
  const penaltyDice = this.document.system.penaltyDice;
  const penaltyPips = this.document.system.penaltyPips;
  const penalty = (numActions - 1) + keepUpPenalty + penaltyDice;
  const rollResult = await rollWithWildDie(
    skill.system.dicePool, skill.system.pips, penalty,
    undefined,
    { doubled: useForcePoint }
  );
  rollResult.total = Math.max(0, rollResult.total - penaltyPips);

  await CharacterSheet.#postRollToChat(
    this.document, skill.name, rollResult, numActions,
    { keepUpPenalty, penaltyDice, penaltyPips, difficulty }   // add difficulty
  );
}
```

**`#rollAttribute` pseudocode:**
```js
static async #rollAttribute(event, target) {
  const attributeKey = target.dataset.attributeKey;
  const attr = this.document.system[attributeKey];
  if (!attr) return;

  const fp = this.document.system.forcePoints;
  const fpSpent = !!this.document.getFlag("starwarsd6", "fpSpentThisRound");
  const defaultDifficulty = Math.ceil(3.5 * attr.dice);  // NEW

  const result = await RollDialog.prompt({
    canSpendFP: !fpSpent, hasFP: fp > 0,
    showDifficulty: true,            // NEW
    defaultDifficulty                // NEW
  });
  if (result === null) return;

  const { numActions, useForcePoint, difficulty } = result;

  if (useForcePoint) {
    await this.document.update({ "system.forcePoints": Math.max(0, fp - 1) });
    await this.document.setFlag("starwarsd6", "fpSpentThisRound", true);
  }

  const keepUpPenalty = this.document.system.keepUpPenalty ?? 0;
  const penaltyDice = this.document.system.penaltyDice;
  const penaltyPips = this.document.system.penaltyPips;
  const penalty = (numActions - 1) + keepUpPenalty + penaltyDice;
  const attrLabel = game.i18n.localize(`STARWARSD6.Attribute.${attributeKey}`);
  const rollResult = await rollWithWildDie(attr.dice, attr.pips, penalty, undefined, { doubled: useForcePoint });
  rollResult.total = Math.max(0, rollResult.total - penaltyPips);

  await CharacterSheet.#postRollToChat(
    this.document, attrLabel, rollResult, numActions,
    { keepUpPenalty, penaltyDice, penaltyPips, difficulty }   // add difficulty
  );
}
```

**`#rollAttack` change (one line only):**
```js
// BEFORE:
const dialogResult = await RollDialog.prompt({ canSpendFP: !fpSpent, hasFP: fp > 0, noTarget });
// AFTER:
const dialogResult = await RollDialog.prompt({ canSpendFP: !fpSpent, hasFP: fp > 0, showDifficulty: noTarget });
```

**`#postRollToChat` pseudocode:**
```js
static async #postRollToChat(actor, label, result, numActions,
  { keepUpPenalty = 0, penaltyDice = 0, penaltyPips = 0, difficulty = null } = {}) {

  // ... all existing content building unchanged ...

  // NEW: difficulty + success/failure line
  const hasDifficulty = Number.isFinite(difficulty) && difficulty > 0;
  const difficultyStr = hasDifficulty
    ? (() => {
        const isSuccess = result.total >= difficulty;
        const outcomeLabel = isSuccess
          ? `<span class="success">${game.i18n.localize("STARWARSD6.RollSuccess")}</span>`
          : `<span class="failure">${game.i18n.localize("STARWARSD6.RollFailure")}</span>`;
        return `<div class="roll-difficulty">${game.i18n.localize("STARWARSD6.RollDifficulty")}: ${difficulty} — ${outcomeLabel}</div>`;
      })()
    : "";

  const content = `
    <div class="starwarsd6 roll-result">
      <h3>${label}</h3>
      <div class="roll-formula">${effectiveDice}D${pipsStr}</div>
      ${penaltyStr}
      <div class="roll-dice">${normalStr}Wild: ${wildStr}${explosion}${complications}</div>
      <div class="roll-total"><strong>${game.i18n.localize("STARWARSD6.Roll.Total")}: <span class="total-value">${result.total}</span></strong></div>
      ${difficultyStr}
    </div>`;

  await ChatMessage.create({ speaker, content });
}
```

---

### Task 4 — ADD unit tests

Create `tests/unit/difficulty.test.mjs` covering the difficulty formula and the pass/fail guard used in `#postRollToChat`.

```yaml
CREATE tests/unit/difficulty.test.mjs:
  - MIRROR pattern from: tests/unit/dice.test.mjs (same imports, same describe/it/expect style)
  - Cover: defaultDifficulty formula (all spec examples)
  - Cover: pass/fail boundary (equal = success, one below = failure)
  - Cover: no-difficulty sentinel values (0, NaN, null all treated as "no difficulty")
```

```js
import { describe, it, expect } from "vitest";

describe("defaultDifficulty formula — Math.ceil(3.5 * N)", () => {
  it("3D+2 skill → 11", () => { expect(Math.ceil(3.5 * 3)).toBe(11); });
  it("4D+1 skill → 14", () => { expect(Math.ceil(3.5 * 4)).toBe(14); });
  it("4D Force skill → 14", () => { expect(Math.ceil(3.5 * 4)).toBe(14); });
  it("2D attribute → 7",  () => { expect(Math.ceil(3.5 * 2)).toBe(7);  });
  it("1D → 4 (ceil(3.5))", () => { expect(Math.ceil(3.5 * 1)).toBe(4); });
});

describe("pass/fail guard — Number.isFinite(d) && d > 0", () => {
  const hasDifficulty = d => Number.isFinite(d) && d > 0;

  it("positive difficulty is active", () => { expect(hasDifficulty(14)).toBe(true); });
  it("0 → no difficulty",            () => { expect(hasDifficulty(0)).toBe(false);  });
  it("NaN → no difficulty",          () => { expect(hasDifficulty(NaN)).toBe(false); });
  it("null → no difficulty",         () => { expect(hasDifficulty(null)).toBe(false); });
});

describe("success / failure comparison", () => {
  it("total equal to difficulty → success", () => { expect(14 >= 14).toBe(true);  });
  it("total above difficulty → success",    () => { expect(16 >= 14).toBe(true);  });
  it("total below difficulty → failure",    () => { expect(13 >= 14).toBe(false); });
});
```

```bash
npm test
# Expected: all existing tests + 11 new tests pass
```

---

### Task 5 — UPDATE documentation

```yaml
MODIFY doc/implementation-plan.md:
  - FIND: section covering skill/attribute rolls (Phase 2 or feat014 notes)
  - ADD or UPDATE: note that RollDialog now shows a pre-filled Difficulty field for all
    non-combat skill and attribute rolls; formula is Math.ceil(3.5 * dicePool);
    chat card shows Difficulty + Success/Failure label when difficulty > 0;
    blank/0 difficulty skips pass/fail judgement.
  - CONFIRM: combat attack path unchanged; Force skill path unchanged.

MODIFY README.md:
  - No phase status change needed (feat014 is not a new phase).
  - If the Final Goal bullet list does not mention difficulty resolution for skill rolls,
    add a note: "Non-combat skill/attribute rolls show a pre-filled difficulty and
    Success/Failure result in chat."
```

---

### Task 6 — MODIFY `lang/en.json`


Add 3 new keys before the closing `}`.

```yaml
MODIFY lang/en.json:
  - ADD before closing brace (note: last existing key needs a trailing comma):
      "STARWARSD6.RollDifficulty": "Difficulty",
      "STARWARSD6.RollSuccess": "Success",
      "STARWARSD6.RollFailure": "Failure"
```

---

### Integration Points

```yaml
ROLL DIALOG:
  - prompt() extended: showDifficulty replaces noTarget; defaultDifficulty is new
  - Backward compatible: old callers with no args or { canSpendFP, hasFP } still work
  - #rollAttack updated to pass showDifficulty: noTarget (was noTarget: noTarget)

CHARACTER SHEET:
  - #rollSkill and #rollAttribute gain 3 extra lines each (defaultDifficulty calc + 2 prompt params)
  - difficulty destructured from result and threaded to #postRollToChat
  - #postRollToChat options object gains optional difficulty = null
  - Attack chat cards unaffected (#postAttackToChat unchanged)
  - Force roll chat cards unaffected (#postForceRollToChat unchanged)
```

---

## Validation Loop

### Level 1: Unit Tests

This feature has no new pure-logic functions to unit-test in isolation — `defaultDifficulty`
is a one-liner (`Math.ceil(3.5 * N)`) and `Number.isFinite()` is a JS built-in.
However, run the full existing suite to confirm nothing is broken:

```bash
npm test
# Expected: all existing tests pass (currently 81+)
# Test file: tests/unit/dice.test.mjs — covers rollWithWildDie and rollExtraDie
# No dice.mjs changes in this feature, so dice tests must remain green unchanged
```

If you want to add a focused test for the difficulty formula helper (optional but useful):

```js
// Could be added to tests/unit/character-data.test.mjs or a new tests/unit/difficulty.test.mjs
// Pattern mirrors existing tests — no Foundry globals needed for pure math

import { describe, it, expect } from "vitest";

describe("defaultDifficulty formula", () => {
  // Math.ceil(3.5 * N) — verify the spec examples
  it("3D+2 skill → difficulty 11", () => {
    expect(Math.ceil(3.5 * 3)).toBe(11);
  });
  it("4D+1 skill → difficulty 14", () => {
    expect(Math.ceil(3.5 * 4)).toBe(14);
  });
  it("4D Force skill → difficulty 14", () => {
    expect(Math.ceil(3.5 * 4)).toBe(14);
  });
  it("2D attribute → difficulty 7", () => {
    expect(Math.ceil(3.5 * 2)).toBe(7);
  });
  it("1D → difficulty 4 (ceil(3.5) = 4)", () => {
    expect(Math.ceil(3.5 * 1)).toBe(4);
  });
});

describe("difficulty pass/fail logic", () => {
  // Mirrors the check in #postRollToChat
  it("total equal to difficulty = success", () => {
    const difficulty = 14;
    expect(14 >= difficulty).toBe(true);
  });
  it("total below difficulty = failure", () => {
    const difficulty = 14;
    expect(13 >= difficulty).toBe(false);
  });
  it("difficulty=0 is treated as no-difficulty", () => {
    expect(Number.isFinite(0) && 0 > 0).toBe(false);
  });
  it("difficulty=NaN is treated as no-difficulty", () => {
    expect(Number.isFinite(NaN) && NaN > 0).toBe(false);
  });
  it("difficulty=null is treated as no-difficulty", () => {
    expect(Number.isFinite(null) && null > 0).toBe(false);
  });
});
```

```bash
# Run after implementing:
npm test
# Expected: all tests green
```

### Level 2: Manual Foundry Validation

```
SKILL ROLL — default difficulty shown:
1. Open a character sheet, go to Skills tab
2. Click roll on a skill with dicePool=3 (e.g. blaster 3D+2)
3. RollDialog opens → Difficulty field pre-filled with 11 (ceil(3.5×3))
4. Change difficulty to 14, click Roll
5. If result ≥ 14 → chat card shows "Difficulty: 14 — Success"
6. If result < 14 → chat card shows "Difficulty: 14 — Failure"

SKILL ROLL — no difficulty:
7. Click roll again, clear the Difficulty field, click Roll
8. Chat card shows total only — no Difficulty/Success/Failure line

ATTRIBUTE ROLL — default difficulty shown:
9. Go to Attributes tab, click roll on DEX (e.g. 3D)
10. RollDialog opens → Difficulty pre-filled with 11 (ceil(3.5×3))
11. Roll and verify success/failure label appears

FORCE SKILL ROLL — unchanged:
12. Roll a Force skill (control/sense/alter)
13. RollDialog opens with Force Difficulty Modifier field but NO Difficulty field
14. Chat card shows no difficulty/success/failure line

COMBAT ATTACK ROLL — unchanged:
a. With target selected: dialog shows no Difficulty field; chat shows defense vs hit/miss
b. With no target: dialog shows Difficulty field (pre-filled with 0, not defaultDifficulty)
   → this is correct: attack rolls have no meaningful defaultDifficulty

FORMULA VERIFICATION:
- 4D+1 skill → defaultDifficulty = ceil(3.5×4) = ceil(14) = 14 ✓
- 3D+2 skill → defaultDifficulty = ceil(3.5×3) = ceil(10.5) = 11 ✓
- 2D   attr  → defaultDifficulty = ceil(3.5×2) = ceil(7) = 7 ✓
- 4D   Force skill → NOT shown (Force roll path unchanged)
```

### Final Checklist

- [ ] `RollDialog` private field renamed `#noTarget` → `#showDifficulty`; `#defaultDifficulty` added
- [ ] `prompt()` accepts `showDifficulty` and `defaultDifficulty`; old callers with no args still resolve correctly
- [ ] Template condition is `{{#if showDifficulty}}`, input `value="{{defaultDifficulty}}"`
- [ ] `#rollAttack` passes `showDifficulty: noTarget` (not `noTarget: noTarget`)
- [ ] `#rollSkill` uses `Math.ceil(3.5 * skill.system.dicePool)` — NOT post-wound effective dice
- [ ] `#rollAttribute` uses `Math.ceil(3.5 * attr.dice)` — NOT post-wound effective dice
- [ ] `difficulty` destructured from `RollDialog.prompt()` result in both roll methods
- [ ] `#postRollToChat` checks `Number.isFinite(difficulty) && difficulty > 0` before rendering label
- [ ] Success = `result.total >= difficulty`; Failure = `result.total < difficulty`
- [ ] `#postAttackToChat` and `#postForceRollToChat` are **not** touched
- [ ] 3 new keys in `lang/en.json`: `RollDifficulty`, `RollSuccess`, `RollFailure`
- [ ] `tests/unit/difficulty.test.mjs` created with 11 tests covering formula, guard, and comparison
- [ ] `npm test` passes — all existing tests + 11 new tests green
- [ ] `doc/implementation-plan.md` updated to reflect the difficulty field behaviour
- [ ] `README.md` checked — Final Goal section updated if skill roll difficulty was not already mentioned

---

## Anti-Patterns to Avoid

- Do NOT apply wound penalty to `defaultDifficulty` — use raw `skill.system.dicePool` / `attr.dice`
- Do NOT add difficulty to the Force roll path (`#rollForceSkill`) — it has its own Force difficulty modifier
- Do NOT add difficulty to `#postAttackToChat` — that path already has hit/miss via defense value
- Do NOT add `Math.max(0, ...)` clamping to the raw `parseInt` in `#onSubmit` for difficulty — let NaN through and handle it in `#postRollToChat` with `Number.isFinite()`
- Do NOT create a separate `#postSkillRollToChat` method — extend the existing `#postRollToChat`
- Do NOT use jQuery or `mergeObject` — plain DOM and direct object spread only

---

## Confidence Score: 9/10

High confidence because:
- All four files are small and well-understood from reading the source
- The `noTarget → showDifficulty` rename is mechanical — same boolean logic, same template location
- `defaultDifficulty` is a trivial template binding (`value="{{defaultDifficulty}}"`)
- `#postRollToChat` extension follows the exact same pattern as `#buildPenaltyLines` — optional options, conditional HTML string
- The formula `Math.ceil(3.5 * dicePool)` is confirmed by the feature spec test cases

One point of uncertainty (−1):
- The `#onSubmit` currently wraps difficulty in `Math.min(99, Math.max(0, parseInt(...)))` which would turn a blank field into `0` via `NaN → 0` only if `Math.max(0, NaN)` returned 0 — but in JavaScript it returns `NaN`. Verify the current attack-no-target blank-field behaviour before finalising the `#onSubmit` change; the PRP removes the clamp and lets `NaN` pass through to be caught by `Number.isFinite()` downstream.
