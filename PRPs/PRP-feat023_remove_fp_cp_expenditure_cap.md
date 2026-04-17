## Goal

Remove all automation that limits Force Points (FP) to one spend per round. Delete `fpSpentThisRound` flag machinery entirely. GM enforces the rule at the table. `canSpendFP` stays in the dialog API but is now driven solely by whether `fp > 0`.

## Why

- House-rule enforcement was over-automated; GM prefers table-level control
- Removes `#newRound` button, `combatRound` hook, and flag reads/writes from four roll handlers
- Simplifies code: FP checkbox enabled iff actor has FP remaining

## What

### Success Criteria

- [ ] Zero calls to `getFlag("starwarsd6", "fpSpentThisRound")` remain in codebase
- [ ] Zero calls to `setFlag("starwarsd6", "fpSpentThisRound", ...)` remain
- [ ] `Hooks.on("combatRound", ...)` block deleted from `starwarsd6.mjs`
- [ ] `#newRound` method and its actions entry deleted from `character-sheet.mjs`
- [ ] `canSpendFP` passed as `fp > 0` (not `!fpSpent`) in all four roll handlers
- [ ] `STARWARSD6.Roll.NewRound` and `STARWARSD6.CP.FPSpent` keys removed from `lang/en.json`
- [ ] `doc/implementation-plan.md` updated — mutual exclusivity no longer enforced by code
- [ ] `doc/rules-reference.md` updated — per-round cap dropped
- [ ] All tests pass: `npm test`

## All Needed Context

```yaml
- file: modules/apps/character-sheet.mjs
  why: >
    Four roll handlers to fix: #rollSkill (line ~185), #rollAttribute (line ~226),
    #rollAttack (line ~363), #rollForceSkill (line ~592).
    Each has: fpSpent = getFlag(...), canSpendFP: !fpSpent, setFlag(...) inside useForcePoint block.
    #newRound method at lines 566-572; registered at line 30 in DEFAULT_OPTIONS.actions.

- file: starwarsd6.mjs
  why: >
    combatRound hook at lines 72-77 — clears fpSpentThisRound for all combatants.
    Delete entire Hooks.on("combatRound", ...) block.

- file: lang/en.json
  why: >
    Two keys to delete:
      "STARWARSD6.CP.FPSpent": "FP Spent This Round"   (line 124)
      "STARWARSD6.Roll.NewRound": "New Round"           (line 127)
    Verify neither key is referenced in any template or module before deleting.

- file: templates/actors/character-sheet.hbs
  why: >
    CONFIRMED: no data-action="newRound" button exists in actual template.
    No template changes needed. (PRP-feat009 planned it but it was never added.)

- file: doc/implementation-plan.md
  why: >
    Line 248 describes mutual exclusivity via fpSpentThisRound flag and New Round button.
    Update to state: "mutual exclusivity no longer enforced by code; GM manages at table."

- file: doc/rules-reference.md
  why: Authoritative rules source. Remove/update any mention of per-round FP/CP cap enforcement.

- file: tests/unit/
  why: >
    Grep confirms NO existing test asserts fpSpentThisRound behaviour (tests are unit-level,
    don't test sheet actions). No tests to remove.
    ADD: new test in an appropriate file confirming canSpendFP = true when fp > 0,
    regardless of how many times FP has been spent.
```

### Codebase tree (affected files only)

```
starwarsd6/
├── starwarsd6.mjs                       # DELETE combatRound hook block
├── modules/
│   └── apps/
│       └── character-sheet.mjs          # MODIFY 4 roll handlers + DELETE #newRound
├── lang/
│   └── en.json                          # DELETE 2 i18n keys
├── doc/
│   ├── implementation-plan.md           # UPDATE Phase 5 CP/FP section
│   └── rules-reference.md              # UPDATE per-round cap text
└── tests/
    └── unit/                            # ADD canSpendFP test
```

### Known Gotchas

```js
// CRITICAL: canSpendFP must NOT be removed from RollDialog.prompt() API.
// It still gates the checkbox for actors with fp === 0.
// New expression: canSpendFP: fp > 0   (was: canSpendFP: !fpSpent)

// CRITICAL: Four roll handlers, not one. Miss any → partial removal.
// Handler names: #rollSkill, #rollAttribute, #rollAttack, #rollForceSkill
// Note: feature file calls it #rollCombat but actual method is #rollAttack — verify by reading file.

// CRITICAL: Flag data persists on existing actors (fpSpentThisRound = true frozen on them).
// No migration needed — once no code reads the flag, it's inert.
// But grep must confirm ZERO reads remain after change.

// CRITICAL: No CP per-round cap flag exists (cpSpentThisRound was never implemented).
// Nothing to remove on CP side. Verify with grep.

// NOTE: #newRound is NOT wired in character-sheet.hbs template — confirmed by grep.
// No template changes needed.

// NOTE: Tests are unit-level (dice, damage, data models) — no sheet action tests exist.
// Existing tests won't break. Add one new test for the canSpendFP=true invariant.
```

## Implementation Blueprint

### Task 1 — Fix `#rollSkill` in `modules/apps/character-sheet.mjs`

```
FIND (around line 185):
  const fpSpent = !!this.document.getFlag("starwarsd6", "fpSpentThisRound");
  const result = await RollDialog.prompt({ canSpendFP: !fpSpent, hasFP: fp > 0, ... });
  ...
  if (useForcePoint) {
    await this.document.update({ ... });
      await this.document.setFlag("starwarsd6", "fpSpentThisRound", true);
  }

CHANGE TO:
  // Remove fpSpent variable entirely
  const result = await RollDialog.prompt({ canSpendFP: fp > 0, hasFP: fp > 0, ... });
  ...
  if (useForcePoint) {
    await this.document.update({ ... });
    // setFlag line deleted
  }
```

### Task 2 — Fix `#rollAttribute` (same pattern, ~line 226)

Same 3-part removal as Task 1.

### Task 3 — Fix `#rollAttack` (~line 363)

```
FIND:
  const fpSpent = !!this.document.getFlag("starwarsd6", "fpSpentThisRound");
  ...
  const dialogResult = await RollDialog.prompt({ canSpendFP: !fpSpent, hasFP: fp > 0, ... });
  ...
  if (useForcePoint) {
    ...
    await this.document.setFlag("starwarsd6", "fpSpentThisRound", true);
  }

CHANGE TO:
  // Remove fpSpent line
  const dialogResult = await RollDialog.prompt({ canSpendFP: fp > 0, hasFP: fp > 0, ... });
  if (useForcePoint) {
    // setFlag line deleted
  }
```

### Task 4 — Fix `#rollForceSkill` (~line 592)

Same 3-part removal. Handler calls `RollDialog.prompt({ canSpendFP: !fpSpent, hasFP: fp > 0, isForceRoll: true })`.

### Task 5 — Delete `#newRound` method and actions entry

```
DELETE from DEFAULT_OPTIONS.actions (~line 30):
  newRound: CharacterSheet.#newRound,

DELETE method (~lines 566-572):
  /**
   * Clear the fpSpentThisRound flag. Called by the "New Round" button in the sheet header.
   * @this {CharacterSheet}
   */
  static async #newRound(event, target) {
    await this.document.setFlag("starwarsd6", "fpSpentThisRound", false);
  }
```

### Task 6 — Delete `combatRound` hook in `starwarsd6.mjs`

```
DELETE (~lines 72-77):
  // Clear fpSpentThisRound for all combatants when the round advances
  Hooks.on("combatRound", (combat, _updateData, _options) => {
    combat.combatants.forEach(c => {
      c.actor?.setFlag("starwarsd6", "fpSpentThisRound", false);
    });
  });
```

### Task 7 — Remove i18n keys from `lang/en.json`

```
DELETE:
  "STARWARSD6.CP.FPSpent": "FP Spent This Round",
  "STARWARSD6.Roll.NewRound": "New Round",
```

### Task 8 — Update `doc/implementation-plan.md`

Find Phase 5 CP/FP section. Update line ~248:

```
OLD: "Mutual exclusivity: Track fpSpentThisRound via actor.setFlag(...). Clear via a "New Round" button or combatRound hook."
NEW: "Mutual exclusivity: No longer enforced by code. GM manages at the table."

OLD testing note: "Both same round → second button disabled."
NEW: Remove or replace with: "FP spend doubles dice regardless of how many times FP has been spent this round."
```

### Task 9 — Update `doc/rules-reference.md`

Search for any mention of per-round FP/CP cap or mutual exclusivity enforcement. Update to state the restriction is a GM-managed table rule, not system-enforced.

### Task 10 — Add unit test

Add to `tests/unit/character-data.test.mjs` or create `tests/unit/fp-cap.test.mjs`:

```js
// Confirm canSpendFP logic: true whenever fp > 0, ignoring any flags
it("canSpendFP is true when actor has force points, regardless of round state", () => {
  const fp = 2;
  // Old guard: canSpendFP: !fpSpent — with fpSpent=true this was false
  // New guard: canSpendFP: fp > 0
  expect(fp > 0).toBe(true);
});

it("canSpendFP is false when actor has no force points", () => {
  const fp = 0;
  expect(fp > 0).toBe(false);
});
```

Note: sheet action handlers can't be unit-tested without Foundry runtime. Keep tests at the logic level (pure expression). If a more integration-style test exists, mirror its pattern.

## Validation Gates

### Level 1: No residual flag usage

```bash
# Must return zero matches
grep -r "fpSpentThisRound" /path/to/starwarsd6/modules/ /path/to/starwarsd6/starwarsd6.mjs
grep -r "newRound" /path/to/starwarsd6/modules/ /path/to/starwarsd6/starwarsd6.mjs
grep -r "cpSpentThisRound" /path/to/starwarsd6/modules/  # should already be zero
```

```bash
# Verify i18n keys removed
grep "FPSpent\|NewRound" /path/to/starwarsd6/lang/en.json  # must return nothing
```

### Level 2: Unit tests pass

```bash
npm test
# Expected: all tests pass (currently ~81+ tests)
# New canSpendFP test must also pass
```

### Level 3: Manual smoke test (in Foundry VTT)

1. Open a character sheet with FP > 0
2. Roll a skill → FP checkbox enabled ✓
3. Check the FP box → submit → FP decrements, roll doubles ✓
4. Roll same skill again immediately → FP checkbox still enabled ✓ (was disabled before)
5. Confirm "New Round" button is gone from sheet header ✓
6. Advance combat round → no console errors from missing hook ✓

## Final Validation Checklist

- [ ] `grep -r fpSpentThisRound modules/ starwarsd6.mjs` returns nothing
- [ ] `grep -r newRound modules/ starwarsd6.mjs` returns nothing (also check templates)
- [ ] `npm test` passes with all existing tests + new FP cap test
- [ ] `doc/implementation-plan.md` updated — Phase 5 CP/FP section
- [ ] `doc/rules-reference.md` updated — per-round cap text removed/revised
- [ ] No Foundry console warnings about unknown action `newRound`
- [ ] FP can be spent on consecutive rolls in same round (smoke test)

---

## Anti-Patterns to Avoid

- Do NOT remove `canSpendFP` from `RollDialog.prompt()` API — it still gates actors with fp=0
- Do NOT remove `hasFP` from dialog calls — it controls tooltip/disabled state in the template
- Do NOT add a migration for existing actor flags — flag is inert once unread
- Do NOT leave any `getFlag("starwarsd6", "fpSpentThisRound")` call anywhere

---

*Confidence score: 9/10 — All affected lines identified with exact locations, no ambiguity about template state (confirmed no button), test strategy is clear.*
