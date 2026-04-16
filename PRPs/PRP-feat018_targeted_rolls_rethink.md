## Goal

Pre-fill the `RollDialog` Difficulty field with the target's computed defense value when making a targeted attack roll (PC and NPC). The field remains editable so the player/GM can adjust for range, cover, aiming, etc. Roll resolves against the **edited** difficulty; the chat card shows that effective value — not the raw defense.

## Why

- Currently targeted attacks bypass the Difficulty field entirely (hardcoded in feat013). Common table situations (range penalty +4, cover −2, called shot) have no in-game adjustment point.
- The `showDifficulty` / `defaultDifficulty` mechanism already exists (feat014). This feature just stops suppressing it in the attack path.
- Affects both PC (`character-sheet.mjs`) and NPC (`npc-sheet.mjs`) — partial fix would create inconsistent UX.

## What

1. When a target is selected, `RollDialog` opens with `showDifficulty: true` and `defaultDifficulty` = target's computed defense (ranged/melee/brawling per skill type).
2. Player can edit the number before rolling.
3. `isHit` and the chat card use the **dialog's `difficulty` result**, not the raw defense.
4. When no target: behavior unchanged (blank difficulty field, manual entry).

### Success Criteria
- [ ] Targeted PC attack: dialog shows pre-filled defense value, editable
- [ ] Targeted NPC attack: same
- [ ] Untargeted attack: dialog behavior unchanged
- [ ] Chat card shows the **effective difficulty used** (post-edit), not raw defense
- [ ] `isHit` is computed from dialog `difficulty`, not raw `defenseValue`
- [ ] All existing tests pass (`npm test`)
- [ ] New unit tests for defense-value pre-fill logic pass

## All Needed Context

### Documentation & References

```yaml
- file: modules/apps/character-sheet.mjs
  why: "#rollAttack (lines 337-402) — the targeted/untargeted branch to modify; #postAttackToChat (lines 486-551) — chat card builder"

- file: modules/apps/npc-sheet.mjs
  why: "#rollAttack (lines 169-223) — identical fix needed; #postAttackToChat (lines 327-392)"

- file: modules/apps/roll-dialog.mjs
  why: "RollDialog.prompt() signature — showDifficulty, defaultDifficulty options (lines 39-50); #onSubmit returns difficulty (lines 65-78)"

- file: tests/unit/difficulty.test.mjs
  why: "Test pattern to follow for new tests"

- file: doc/rules-reference.md
  why: "Combat section — defense value formulas for context (rangedDefense / meleeDefense / brawlingDefense)"
```

### Current State — Key Lines to Change

**`character-sheet.mjs` `#rollAttack`** (lines 337–402):
```js
// CURRENT — lines 358-359: hides difficulty when targeted
const defaultDifficulty = noTarget ? Math.ceil(3.5 * skillDice) : 0;
const dialogResult = await RollDialog.prompt({ canSpendFP: !fpSpent, hasFP: fp > 0, showDifficulty: noTarget, defaultDifficulty });

// Then later — lines 378-394: defense computed AFTER dialog
const RANGED_SKILLS = ["blaster", "starship gunnery", "starfighter piloting"];
const MELEE_SKILLS = ["melee combat"];
let defenseLabel, defenseValue;
if (noTarget) {
  defenseLabel = game.i18n.localize("STARWARSD6.Combat.Difficulty");
  defenseValue = difficulty ?? 0;
} else if (RANGED_SKILLS.includes(attackSkillName)) {
  defenseLabel = game.i18n.localize("STARWARSD6.Combat.RangedDefense");
  defenseValue = targetActor.system.rangedDefense;
} else if (MELEE_SKILLS.includes(attackSkillName)) {
  defenseLabel = game.i18n.localize("STARWARSD6.Combat.MeleeDefense");
  defenseValue = targetActor.system.meleeDefense;
} else {
  defenseLabel = game.i18n.localize("STARWARSD6.Combat.BrawlingDefense");
  defenseValue = targetActor.system.brawlingDefense;
}

const isHit = rollResult.total >= defenseValue;
await CharacterSheet.#postAttackToChat(
  this.document, weapon, rollResult, numActions, defenseLabel, defenseValue, ...
```

**`npc-sheet.mjs` `#rollAttack`** (lines 169–223):
```js
// CURRENT — lines 187-188
const defaultDifficulty = noTarget ? Math.ceil(3.5 * skillDice) : 0;
const dialogResult = await RollDialog.prompt({ showDifficulty: noTarget, defaultDifficulty });

// Then lines 201-215: same defense-after-dialog pattern
// Same defenseValue used for isHit and postAttackToChat
```

### Known Gotchas

```js
// CRITICAL: Defense must be computed BEFORE calling RollDialog.prompt() so it
// can be passed as defaultDifficulty. Move the defense detection block up.

// CRITICAL: After the dialog, use dialogResult.difficulty (the edited value) as
// the effective difficulty — NOT the raw defenseValue — for both isHit and
// the chat card. The raw defenseValue is only used as the pre-fill default.

// CRITICAL: When noTarget, defenseLabel is STARWARSD6.Combat.Difficulty and
// defenseValue = difficulty ?? 0. This path is UNCHANGED.

// CRITICAL: RollDialog returns difficulty=null when showDifficulty=false (current
// targeted path). After this change showDifficulty is always true, so difficulty
// will always be a number. parseInt coerces empty input to NaN — treat NaN as 0.

// NOTE: #postAttackToChat already accepts defenseValue as a number — we just
// pass difficulty (the edited value) instead of the raw computed defense.
// The defense line in chat reads: `${defenseLabel}: ${defenseValue} — ${hitLabel}`
// so it will correctly show the effective difficulty.
```

## Implementation Blueprint

### Task 1 — Modify `character-sheet.mjs` `#rollAttack`

**FIND** the block at ~line 358 in `#rollAttack`:
```js
const defaultDifficulty = noTarget ? Math.ceil(3.5 * skillDice) : 0;
const dialogResult = await RollDialog.prompt({ canSpendFP: !fpSpent, hasFP: fp > 0, showDifficulty: noTarget, defaultDifficulty });
```

**REPLACE WITH** (move defense detection before dialog, always show difficulty):
```js
// Compute defense pre-fill before opening dialog
const RANGED_SKILLS = ["blaster", "starship gunnery", "starfighter piloting"];
const MELEE_SKILLS = ["melee combat"];
let defenseLabel, rawDefenseValue;
if (noTarget) {
  defenseLabel = game.i18n.localize("STARWARSD6.Combat.Difficulty");
  rawDefenseValue = Math.ceil(3.5 * skillDice);
} else if (RANGED_SKILLS.includes(attackSkillName)) {
  defenseLabel = game.i18n.localize("STARWARSD6.Combat.RangedDefense");
  rawDefenseValue = targetActor.system.rangedDefense;
} else if (MELEE_SKILLS.includes(attackSkillName)) {
  defenseLabel = game.i18n.localize("STARWARSD6.Combat.MeleeDefense");
  rawDefenseValue = targetActor.system.meleeDefense;
} else {
  defenseLabel = game.i18n.localize("STARWARSD6.Combat.BrawlingDefense");
  rawDefenseValue = targetActor.system.brawlingDefense;
}

const dialogResult = await RollDialog.prompt({
  canSpendFP: !fpSpent, hasFP: fp > 0,
  showDifficulty: true, defaultDifficulty: rawDefenseValue
});
```

**THEN** remove the old defense detection block (~lines 378-394) that ran after the dialog (it is now redundant).

**THEN** update the resolution logic to use `difficulty` (edited value) not `rawDefenseValue`:
```js
const { numActions, useForcePoint, difficulty } = dialogResult;
// difficulty is the effective value — what the player actually rolled against
const defenseValue = Number.isFinite(difficulty) && difficulty > 0 ? difficulty : 0;
const isHit = rollResult.total >= defenseValue;
await CharacterSheet.#postAttackToChat(
  this.document, weapon, rollResult, numActions, defenseLabel, defenseValue,
  targetActor, isHit, targetToken?.id ?? null,
  { keepUpPenalty, penaltyDice, penaltyPips }
);
```

### Task 2 — Modify `npc-sheet.mjs` `#rollAttack`

Apply the identical restructuring to `NpcSheet.#rollAttack`:

**FIND** (~lines 187-188):
```js
const defaultDifficulty = noTarget ? Math.ceil(3.5 * skillDice) : 0;
const dialogResult = await RollDialog.prompt({ showDifficulty: noTarget, defaultDifficulty });
```

**REPLACE WITH** same pattern (no `canSpendFP`/`hasFP` since NPCs don't use FP):
```js
const RANGED_SKILLS = ["blaster", "starship gunnery", "starfighter piloting"];
const MELEE_SKILLS  = ["melee combat"];
let defenseLabel, rawDefenseValue;
if (noTarget) {
  defenseLabel = game.i18n.localize("STARWARSD6.Combat.Difficulty");
  rawDefenseValue = Math.ceil(3.5 * skillDice);
} else if (RANGED_SKILLS.includes(attackSkillName)) {
  defenseLabel = game.i18n.localize("STARWARSD6.Combat.RangedDefense");
  rawDefenseValue = targetActor.system.rangedDefense;
} else if (MELEE_SKILLS.includes(attackSkillName)) {
  defenseLabel = game.i18n.localize("STARWARSD6.Combat.MeleeDefense");
  rawDefenseValue = targetActor.system.meleeDefense;
} else {
  defenseLabel = game.i18n.localize("STARWARSD6.Combat.BrawlingDefense");
  rawDefenseValue = targetActor.system.brawlingDefense;
}

const dialogResult = await RollDialog.prompt({ showDifficulty: true, defaultDifficulty: rawDefenseValue });
```

**THEN** remove the old defense block (~lines 201-215).

**THEN** update resolution:
```js
const { numActions, difficulty } = dialogResult;
const defenseValue = Number.isFinite(difficulty) && difficulty > 0 ? difficulty : 0;
const isHit = rollResult.total >= defenseValue;
await NpcSheet.#postAttackToChat(
  this.document, weapon, rollResult, numActions, defenseLabel, defenseValue,
  targetActor, isHit, targetToken?.id ?? null,
  { penaltyDice, penaltyPips }
);
```

### Task 3 — Add unit tests

Create `tests/unit/targeted-attack-difficulty.test.mjs` following the pattern in `tests/unit/difficulty.test.mjs`:

```js
import { describe, it, expect } from "vitest";

// Mirrors the pre-fill logic extracted from #rollAttack
function computeDefensePreFill(noTarget, attackSkillName, skillDice, targetActor) {
  const RANGED_SKILLS = ["blaster", "starship gunnery", "starfighter piloting"];
  const MELEE_SKILLS = ["melee combat"];
  if (noTarget) return Math.ceil(3.5 * skillDice);
  if (RANGED_SKILLS.includes(attackSkillName)) return targetActor.system.rangedDefense;
  if (MELEE_SKILLS.includes(attackSkillName)) return targetActor.system.meleeDefense;
  return targetActor.system.brawlingDefense;
}

// Mirrors the effective difficulty guard after dialog
function effectiveDifficulty(dialogDifficulty) {
  return Number.isFinite(dialogDifficulty) && dialogDifficulty > 0 ? dialogDifficulty : 0;
}

const mockTarget = { system: { rangedDefense: 12, meleeDefense: 9, brawlingDefense: 7 } };

describe("defense pre-fill for RollDialog", () => {
  it("no target → ceil(3.5 × skillDice)", () => {
    expect(computeDefensePreFill(true, "blaster", 4, null)).toBe(14);
  });
  it("targeted blaster → rangedDefense", () => {
    expect(computeDefensePreFill(false, "blaster", 4, mockTarget)).toBe(12);
  });
  it("targeted melee combat → meleeDefense", () => {
    expect(computeDefensePreFill(false, "melee combat", 3, mockTarget)).toBe(9);
  });
  it("targeted brawling parry → brawlingDefense", () => {
    expect(computeDefensePreFill(false, "brawling parry", 3, mockTarget)).toBe(7);
  });
  it("starship gunnery → rangedDefense", () => {
    expect(computeDefensePreFill(false, "starship gunnery", 3, mockTarget)).toBe(12);
  });
});

describe("effectiveDifficulty — dialog result guard", () => {
  it("positive number passes through", () => { expect(effectiveDifficulty(16)).toBe(16); });
  it("0 → 0",                          () => { expect(effectiveDifficulty(0)).toBe(0); });
  it("NaN → 0",                        () => { expect(effectiveDifficulty(NaN)).toBe(0); });
  it("null → 0",                        () => { expect(effectiveDifficulty(null)).toBe(0); });
  it("adjusted value used for isHit",  () => { expect(14 >= effectiveDifficulty(16)).toBe(false); });
  it("edited lower value — hit",       () => { expect(14 >= effectiveDifficulty(10)).toBe(true); });
});
```

### Task 4 — Update documentation

Update `doc/rules-reference.md` combat section to note that the Difficulty field in the attack dialog is pre-filled with the target's defense value and is editable (range, cover, aiming modifiers applied here).

## Validation Loop

### Level 1: Verify no syntax errors
```bash
# Check ESM syntax is valid — node will parse without executing
node --input-type=module < modules/apps/character-sheet.mjs 2>&1 || echo "SYNTAX ERROR"
node --input-type=module < modules/apps/npc-sheet.mjs 2>&1 || echo "SYNTAX ERROR"
```

Note: These will throw ReferenceError for `foundry` (not defined outside Foundry). That's expected and OK — it means the file parsed successfully. A SyntaxError means a real problem.

### Level 2: Unit Tests
```bash
npm test
# Expected: all tests pass, including new targeted-attack-difficulty.test.mjs
# If failing: read the error, fix the logic, re-run — never skip or comment out
```

### Level 3: Manual smoke test (Foundry)
1. Open Foundry, load a scene with a PC sheet and an NPC token.
2. Target the NPC token (click target icon or T key).
3. Click Roll Attack on the PC sheet — verify dialog shows pre-filled defense value.
4. Change the value (e.g., +4 for range) and roll.
5. Verify chat card shows the **edited** value, not the original defense.
6. Repeat for NPC attacking a PC target.
7. Roll without a target — verify dialog shows skill-based default, behavior unchanged.

## Final Validation Checklist
- [ ] All existing tests pass: `npm test`
- [ ] New `targeted-attack-difficulty.test.mjs` tests pass
- [ ] No stray `defenseValue` references left from the old post-dialog block in either sheet
- [ ] `showDifficulty: true` in both attack handlers (targeted and untargeted)
- [ ] `defaultDifficulty` is the pre-computed defense (targeted) or `ceil(3.5 * skillDice)` (untargeted)
- [ ] `isHit` uses dialog `difficulty`, not raw defense
- [ ] `#postAttackToChat` receives dialog `difficulty` as `defenseValue`
- [ ] `doc/rules-reference.md` updated to reflect editable difficulty in attack dialog

## Anti-Patterns to Avoid
- ❌ Don't add a separate "effective difficulty" field — reuse the existing `defenseValue` parameter in `#postAttackToChat`
- ❌ Don't change `RollDialog` — it already supports this, just pass the right args
- ❌ Don't change `#postAttackToChat` signature — just pass `difficulty` where `defenseValue` was
- ❌ Don't use `defenseValue` for `isHit` after the dialog — always use `difficulty` (the edited result)
- ❌ Don't leave the old defense detection block after the dialog call — it's now dead code
- ❌ Don't implement only PC — NPC must be updated in the same pass

---

**Confidence score: 9/10** — The change is minimal and surgical (two nearly-identical methods), the supporting infrastructure already exists, and the test pattern is established. The only risk is the restructuring (moving defense detection before the dialog) — the pseudocode above is exact enough to make this a clean one-pass implementation.
