## Goal

Add a **Difficulty Tier** `<select>` dropdown to `RollDialog` for all PC rolls (skill, attribute, attack, force). Selecting a tier adds its modifier to the base difficulty at submit time; `finalDifficulty = baseDifficulty + tierMod`. The resolved `difficulty` field stays a plain `number|null` — no API change. Default tier is Normal (mod 0), preserving current behaviour.

## Why

- GMs describe difficulty as "this is a Difficult task" — players currently must mentally translate that label to a number themselves, then hand-edit the input.
- The dropdown makes that translation automatic and removes a friction point.
- Force rolls currently return `difficulty: null`. Adding `showDifficulty: true, defaultDifficulty: 0` to the force-skill call brings them in line with all other PC rolls.
- Zero total difficulty (Normal + 0 base) renders nothing in chat — existing guard `Number.isFinite(d) && d > 0` preserves current force-roll behaviour when user leaves defaults.

## What

### User-visible behaviour

1. Every `RollDialog` instance shows a tier dropdown above the difficulty number input.
2. Dropdown lists seven tiers: Very Easy (−10), Easy (−5), Normal (0), Moderate (+5), Difficult (+10), Very Difficult (+15), Impossible (+20). Default: Normal.
3. Difficulty number input shows the pre-filled base difficulty and stays editable.
4. On submit: `finalDifficulty = parseInt(difficulty_input) + parseInt(tier_select)`.
5. Chat card displays only the final total. No tier label in chat.
6. Force rolls now show a difficulty input (base 0) with the tier dropdown.

### Success Criteria

- [ ] `RollDialog` has `static #DIFFICULTY_TIERS` array with 7 tiers (label key + modifier value)
- [ ] `_prepareContext` passes `difficultyTiers` array to template
- [ ] Template renders `<select name="difficultyTier">` always (not gated on `showDifficulty`)
- [ ] `#onSubmit` computes `finalDifficulty = baseDifficulty + tierMod` when `showDifficulty: true`
- [ ] Force skill call in `character-sheet.mjs` passes `showDifficulty: true, defaultDifficulty: 0`
- [ ] `lang/en.json` has all 7 tier keys + `STARWARSD6.Difficulty.Label`
- [ ] Unit test: tiers array has 7 entries with correct mods
- [ ] Unit test: finalDifficulty formula for Moderate+10 = 15, Easy+10 = 5
- [ ] All existing tests pass

## All Needed Context

### Documentation & References

```yaml
- file: modules/apps/roll-dialog.mjs
  why: |
    Full implementation file (89 lines). Key patterns:
    - Private fields: #canSpendFP, #hasFP, #isForceRoll, #showDifficulty, #defaultDifficulty
    - static prompt() sets private fields, calls render(true)
    - _prepareContext() passes fields into template context
    - static #onSubmit() reads ALL values from formData.object
    - #onSubmit line 71-73: difficulty only read when #showDifficulty is true
    - form: { handler: RollDialog.#onSubmit, closeOnSubmit: true }
    ADD: #DIFFICULTY_TIERS static array, no new private field needed —
    read difficultyTier from formData.object in #onSubmit directly.

- file: templates/dice/roll-dialog.hbs
  why: |
    Full template (36 lines). Insertion point for tier <select>:
    - Insert BEFORE the {{#if showDifficulty}} block (line 21)
    - Tier <select> must be outside the {{#if showDifficulty}} guard (always rendered)
    - Difficulty input is inside {{#if showDifficulty}} — stays there unchanged
    - Use {{localize}} for option labels

- file: modules/apps/character-sheet.mjs lines 602-635
  why: |
    #rollForceSkill at line 614:
      const result = await RollDialog.prompt({ canSpendFP: fp > 0, hasFP: fp > 0, isForceRoll: true });
    CHANGE to:
      const result = await RollDialog.prompt({ canSpendFP: fp > 0, hasFP: fp > 0, isForceRoll: true, showDifficulty: true, defaultDifficulty: 0 });
    Also destructure difficulty from result (line 617) alongside forceDifficultyModifier.
    NOTE: #postForceRollToChat already guards with Number.isFinite(difficulty) && difficulty > 0
    (pattern shown in difficulty.test.mjs line 12) — zero difficulty renders nothing in chat.
    Lines 198, 239, 404-407: skill/attribute/attack callers already pass showDifficulty: true — NO CHANGES.

- file: lang/en.json
  why: Add 8 new keys under STARWARSD6.Difficulty namespace. All other keys use this pattern.

- file: doc/rules-reference.md lines 173-181
  why: |
    Authoritative difficulty chart. Ranges (not modifier values):
    Very Easy 3–5 | Easy 6–10 | Moderate 11–15 | Difficult 16–20
    Very Difficult 21–25 | Impossible 26–30
    The feature uses RELATIVE modifiers centered on "Normal" (range ≈11–15 → mod 0),
    so steps of ±5 between tiers. The feat spec modifiers are authoritative for this feature.

- file: tests/unit/difficulty.test.mjs
  why: |
    Existing test pattern to mirror. Pure JS logic tests with describe/it/expect.
    No Foundry globals needed. Run with: npm test

- file: tests/setup.mjs
  why: Sets globalThis.foundry before imports. No change needed for this feature.

- file: tests/mocks/foundry.mjs
  why: Minimal foundry mock. No change needed for this feature.
```

### Current Codebase Tree (relevant subset)

```
starwarsd6/
├── modules/apps/
│   ├── roll-dialog.mjs          ← MODIFY
│   └── character-sheet.mjs      ← MODIFY (line 614 only)
├── templates/dice/
│   └── roll-dialog.hbs          ← MODIFY
├── lang/
│   └── en.json                  ← MODIFY
└── tests/unit/
    ├── difficulty.test.mjs      ← MODIFY (add new describe blocks)
    └── [all others]             ← no changes
```

### Known Gotchas

```javascript
// CRITICAL: RollDialog cannot be unit-tested directly — it extends ApplicationV2 (Foundry global).
// Test the pure logic only: the tiers array and the finalDifficulty formula as plain JS.

// CRITICAL: FormDataExtended coerces <input type="number"> to numbers automatically.
// <select> values are strings. Use parseInt() on formData.object.difficultyTier in #onSubmit.

// CRITICAL: No private field needed for selected tier — #onSubmit already reads all form
// values from formData.object at submit time. Adding a private field with a change handler
// would be redundant and add complexity.

// CRITICAL: When showDifficulty is false, difficulty stays null. Tier mod is irrelevant
// in that case. Guard: only apply tierMod when this.#showDifficulty is true.

// CRITICAL: Force roll currently does NOT destructure `difficulty` from result.
// After change, it must. But #postForceRollToChat signature does NOT take difficulty —
// only forceDifficultyModifier. Force difficulty display in chat uses forceDifficultyModifier,
// not the new difficulty field. The new difficulty value from force roll goes unused in
// #postForceRollToChat — this is expected per the feature spec ("no changes to postForceRollToChat").
// The difficulty field is returned in the resolved object but not forwarded to post function.

// GOTCHA: The feature spec says "Easy = −5" but rules ref shows Easy range 6-10.
// Normal range 11-15 is the baseline (mod 0). Easy is one tier below Normal, so mod −5
// means a base difficulty of 10 gets modified to 5. This is correct per the spec.
// Do NOT derive mods from the rules table ranges — use the spec values directly.
```

## Implementation Blueprint

### Data structure: DIFFICULTY_TIERS

```javascript
// In roll-dialog.mjs — static class field (not exported, not a module constant)
static #DIFFICULTY_TIERS = [
  { labelKey: "STARWARSD6.Difficulty.VeryEasy",     mod: -10 },
  { labelKey: "STARWARSD6.Difficulty.Easy",         mod: -5  },
  { labelKey: "STARWARSD6.Difficulty.Normal",       mod: 0   },
  { labelKey: "STARWARSD6.Difficulty.Moderate",     mod: 5   },
  { labelKey: "STARWARSD6.Difficulty.Difficult",    mod: 10  },
  { labelKey: "STARWARSD6.Difficulty.VeryDifficult",mod: 15  },
  { labelKey: "STARWARSD6.Difficulty.Impossible",   mod: 20  },
];
```

### Tasks

```yaml
Task 1 — lang/en.json: Add localization keys
  MODIFY lang/en.json:
    ADD after "STARWARSD6.RollDifficulty" key (line 170):
      "STARWARSD6.Difficulty.Label": "Difficulty Tier",
      "STARWARSD6.Difficulty.VeryEasy": "Very Easy",
      "STARWARSD6.Difficulty.Easy": "Easy",
      "STARWARSD6.Difficulty.Normal": "Normal",
      "STARWARSD6.Difficulty.Moderate": "Moderate",
      "STARWARSD6.Difficulty.Difficult": "Difficult",
      "STARWARSD6.Difficulty.VeryDifficult": "Very Difficult",
      "STARWARSD6.Difficulty.Impossible": "Impossible"

Task 2 — roll-dialog.mjs: Add tiers + update onSubmit
  MODIFY modules/apps/roll-dialog.mjs:
    ADD static #DIFFICULTY_TIERS array (after static DEFAULT_OPTIONS block)
    MODIFY _prepareContext: add context.difficultyTiers = RollDialog.#DIFFICULTY_TIERS
    MODIFY static #onSubmit:
      - Read tierMod: const tierMod = this.#showDifficulty ? parseInt(formData.object.difficultyTier ?? "0") : 0;
      - Modify difficulty calculation:
          const baseDifficulty = this.#showDifficulty
            ? parseInt(formData.object.difficulty ?? "0")
            : null;
          const difficulty = this.#showDifficulty ? baseDifficulty + tierMod : null;

Task 3 — roll-dialog.hbs: Add tier <select> to template
  MODIFY templates/dice/roll-dialog.hbs:
    INSERT before {{#if showDifficulty}} block:
      <div class="form-group">
        <label>{{localize "STARWARSD6.Difficulty.Label"}}</label>
        <select name="difficultyTier">
          {{#each difficultyTiers}}
          <option value="{{this.mod}}" {{#if (eq this.mod 0)}}selected{{/if}}>
            {{localize this.labelKey}}
          </option>
          {{/each}}
        </select>
      </div>
    NOTE: The {{eq}} helper may not be available in Foundry Handlebars. Use a
    pre-processed tiers array with isDefault flag instead (see pseudocode below).

Task 4 — character-sheet.mjs: Enable difficulty on force rolls
  MODIFY modules/apps/character-sheet.mjs line 614:
    FIND: RollDialog.prompt({ canSpendFP: fp > 0, hasFP: fp > 0, isForceRoll: true })
    REPLACE WITH: RollDialog.prompt({ canSpendFP: fp > 0, hasFP: fp > 0, isForceRoll: true, showDifficulty: true, defaultDifficulty: 0 })
    NOTE: No change needed to destructuring on line 617 because difficulty is already
    destructured via the spread — but since the original line 617 only destructures
    { numActions, useForcePoint, forceDifficultyModifier }, add difficulty to it:
      const { numActions, useForcePoint, forceDifficultyModifier, difficulty } = result;
    NOTE: difficulty is NOT passed to #postForceRollToChat — that function signature
    is unchanged. The value is simply available but not forwarded (per spec).

Task 5 — tests: Add unit tests for tiers and formula
  MODIFY tests/unit/difficulty.test.mjs:
    ADD describe block: "DIFFICULTY_TIERS array"
      - test: array has 7 entries
      - test: Normal tier has mod 0
      - test: Very Easy has mod -10, Impossible has mod 20
    ADD describe block: "finalDifficulty = baseDifficulty + tierMod"
      - test: base 10, Moderate (+5) → 15
      - test: base 10, Easy (−5) → 5
      - test: base 0, Normal (0) → 0
      - test: base 0, Easy (−5) → −5 (can go negative; no clamp specified)
    NOTE: Import the tiers array — it needs to be exported for testing OR the tests
    use inline values that mirror the spec. Since #DIFFICULTY_TIERS is private static,
    test the formula logic inline without importing from RollDialog.
```

### Pseudocode — Critical details

```javascript
// Task 2: _prepareContext — pass tiers with isDefault flag to avoid {{eq}} helper issue
async _prepareContext(options) {
  const context = await super._prepareContext(options);
  context.numActions = 1;
  context.canSpendFP = this.#canSpendFP;
  context.hasFP = this.#hasFP;
  context.isForceRoll = this.#isForceRoll;
  context.showDifficulty = this.#showDifficulty;
  context.defaultDifficulty = this.#defaultDifficulty;
  // Map tiers with isDefault flag so template can use {{#if isDefault}}selected{{/if}}
  context.difficultyTiers = RollDialog.#DIFFICULTY_TIERS.map(t => ({
    ...t,
    isDefault: t.mod === 0
  }));
  return context;
}

// Task 2: #onSubmit — compute finalDifficulty
static #onSubmit(event, form, formData) {
  const numActions = Math.min(4, Math.max(1, parseInt(formData.object.numActions ?? "1")));
  const useForcePoint = !!formData.object.useForcePoint;
  const forceDifficultyModifier = this.#isForceRoll
    ? Math.min(30, Math.max(0, parseInt(formData.object.forceDifficultyModifier ?? "0")))
    : 0;
  // NEW: tier mod — select value is a string, must parseInt
  const tierMod = this.#showDifficulty
    ? parseInt(formData.object.difficultyTier ?? "0")
    : 0;
  const difficulty = this.#showDifficulty
    ? parseInt(formData.object.difficulty ?? "0") + tierMod
    : null;
  if (!this.#resolved) {
    this.#resolved = true;
    this.#resolve({ numActions, useForcePoint, forceDifficultyModifier, difficulty });
  }
}

// Task 3: Template <select> with isDefault flag
// <select name="difficultyTier">
//   {{#each difficultyTiers}}
//   <option value="{{this.mod}}"{{#if this.isDefault}} selected{{/if}}>
//     {{localize this.labelKey}}
//   </option>
//   {{/each}}
// </select>

// Task 5: Pure formula test (no RollDialog import needed)
const TIERS = [
  { mod: -10 }, { mod: -5 }, { mod: 0 }, { mod: 5 },
  { mod: 10 }, { mod: 15 }, { mod: 20 }
];
const finalDifficulty = (base, tierMod) => base + tierMod;
```

### Integration Points

```yaml
TEMPLATE:
  - roll-dialog.hbs: tier <select> goes BEFORE {{#if showDifficulty}} block
  - The <select> is always in the form so formData always has difficultyTier
  - When showDifficulty is false, tierMod is calculated but difficulty stays null

FORM DATA:
  - difficultyTier: string (select option value) — parseInt in #onSubmit
  - difficulty: number (input type=number) — Foundry coerces to number but parseInt is safe

FORCE ROLL PATH:
  - Before: RollDialog.prompt({ isForceRoll: true }) → difficulty: null
  - After: RollDialog.prompt({ isForceRoll: true, showDifficulty: true, defaultDifficulty: 0 })
           → difficulty: 0 + tierMod (0 for Normal default)
  - #postForceRollToChat: unchanged signature, difficulty NOT passed to it
  - Chat guard: Number.isFinite(0) && 0 > 0 → false → no difficulty shown (correct for Normal)
```

## Validation Gates

### Level 1: Verify no syntax errors

```bash
# No build step needed — check files parse as valid JS/JSON manually, or:
node --input-type=module < modules/apps/roll-dialog.mjs 2>&1 | head -5
node -e "JSON.parse(require('fs').readFileSync('lang/en.json','utf8'))" && echo "JSON valid"
```

### Level 2: Unit Tests

```bash
npm test
# Expected: all existing tests pass + new difficulty tier tests pass
# Key new tests:
#   difficulty.test.mjs > DIFFICULTY_TIERS array > has 7 entries
#   difficulty.test.mjs > finalDifficulty formula > Moderate+10 = 15
#   difficulty.test.mjs > finalDifficulty formula > Easy+10 = 5
```

### Level 3: Manual verification checklist (Foundry required)

```
1. Open character sheet → click any skill roll button
   ✓ Roll dialog shows "Difficulty Tier" dropdown above Difficulty input
   ✓ Default selection is "Normal"
   ✓ Difficulty input shows pre-filled value

2. Select "Moderate" (mod +5), set difficulty input to 10, roll
   ✓ Chat card shows Difficulty: 15

3. Select "Easy" (mod −5), set difficulty input to 10, roll
   ✓ Chat card shows Difficulty: 5

4. Open force-sensitive character → click Force skill roll
   ✓ Roll dialog shows difficulty input (base 0) + tier dropdown
   ✓ Default Normal + base 0 → difficulty 0 → chat card shows no difficulty line

5. Force roll with Easy (−5) + base 10
   ✓ Chat card would show Difficulty: 5 (if difficulty > 0)
```

## Final Validation Checklist

- [ ] `npm test` passes (all tests green)
- [ ] `lang/en.json` is valid JSON with 8 new Difficulty keys
- [ ] `roll-dialog.mjs`: `#DIFFICULTY_TIERS` has 7 entries, `#onSubmit` applies `tierMod`
- [ ] `roll-dialog.hbs`: `<select name="difficultyTier">` renders above `{{#if showDifficulty}}` block
- [ ] `character-sheet.mjs` line ~614: force skill call has `showDifficulty: true, defaultDifficulty: 0`
- [ ] Existing `difficulty.test.mjs` tests still pass
- [ ] No changes to `#postRollToChat`, `#postAttackToChat`, or `#postForceRollToChat`
- [ ] No new files created (all changes are in-place edits)

## Anti-Patterns to Avoid

- ❌ Don't add a private `#selectedTierMod` field with a change handler — `#onSubmit` reads `formData.object` at submit time; no live state needed
- ❌ Don't use `{{eq}}` Handlebars helper for pre-selecting Normal — use `isDefault` flag in context
- ❌ Don't clamp `finalDifficulty` to ≥ 0 — spec doesn't require it; negative difficulty is an edge case the GM controls
- ❌ Don't forward `difficulty` to `#postForceRollToChat` — that function's signature is unchanged per spec
- ❌ Don't change `#postRollToChat` or chat card templates — they already display raw `difficulty` value
- ❌ Don't export `#DIFFICULTY_TIERS` for tests — test the formula logic inline with mirrored values

---

**Confidence score: 9/10**

High confidence because: all touched files are small and fully read; the change is additive (one new form field, one array, one formula tweak, one call-site change); no new files needed; existing test infra (vitest, pure JS) handles the new tests cleanly. Minor uncertainty on Handlebars `{{eq}}` availability (mitigated by `isDefault` flag approach) and whether FormDataExtended coerces select values to numbers (mitigated by explicit `parseInt`).
