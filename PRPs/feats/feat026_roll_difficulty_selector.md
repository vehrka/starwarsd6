## FEATURE:

Add a **Difficulty Tier** dropdown to `RollDialog` for **all** PC rolls (skill, attribute, attack,
and force). The dropdown lists the seven standard Star Wars D6 difficulty tiers; selecting one adds
its modifier to the base difficulty on submit, and the final (modified) value is what gets used for
success/failure resolution and displayed on the roll card.

### Difficulty tiers and modifiers

| Label          | Modifier |
|----------------|----------|
| Very Easy      | −10      |
| Easy           | −5       |
| Normal         | +0       |
| Moderate       | +5       |
| Difficult      | +10      |
| Very Difficult | +15      |
| Impossible     | +20      |

Default selection: **Normal** (mod = 0, no change to current behaviour).

### Behaviour

1. Dropdown appears in **every** `RollDialog` instance — skill, attribute, attack, and force rolls.
2. For rolls with `showDifficulty: true` (skill, attribute, attack), the number input shows the
   pre-filled base difficulty and remains editable. The tier dropdown sits above it.
3. For force rolls (`isForceRoll: true`), add `showDifficulty: true, defaultDifficulty: 0` to the
   `#rollForceSkill` call so players can set a base difficulty and apply a tier mod.
4. On submit: `finalDifficulty = baseDifficulty + tierMod`
   - `baseDifficulty` = value in the Difficulty number input at submit time (user may have edited it).
   - `tierMod` = selected tier's modifier value.
   - Applied once, at submit — not live-updated in the input.
5. `difficulty` in the resolved object equals `finalDifficulty`. Same field, same type (`number|null`).
6. Roll card shows only the final modified difficulty total — no tier label, no breakdown.
   No change needed to chat card rendering code.

### What does NOT change

- `#postRollToChat` and `#postAttackToChat` — no changes required.
- `#postForceRollToChat` — `forceDifficultyModifier` field is unrelated; no changes required.
- The resolved `difficulty` value type and meaning stay identical.


## EXAMPLES:

- `modules/apps/roll-dialog.mjs` — add `#difficultyTiers` constant and `#selectedTierMod = 0`
  field. Pass tiers array in `_prepareContext`. In `#onSubmit`, compute
  `finalDifficulty = baseDifficulty + tierMod` before resolving.
- `templates/dice/roll-dialog.hbs` — add tier `<select>` above the existing difficulty `<input>`
  block. The `<select>` is always rendered (not gated on `showDifficulty`). Wire via
  `data-action` + `_onChangeForm` override, or plain `onchange`, to store selected mod value —
  no re-render needed since submit reads it directly.
- `modules/apps/character-sheet.mjs` line 614 — `#rollForceSkill`: add
  `showDifficulty: true, defaultDifficulty: 0` to the `RollDialog.prompt()` call.
  Lines 201–260: skill/attribute callers — no changes needed.
  Lines 404–408: attack caller — no changes needed.
- `lang/en.json` — add `STARWARSD6.Difficulty.VeryEasy`, `Easy`, `Normal`, `Moderate`,
  `Difficult`, `VeryDifficult`, `Impossible`, and a dropdown label key
  `STARWARSD6.Difficulty.Label`.


## DOCUMENTATION:

- `doc/rules-reference.md` — verify difficulty tier labels and modifier values before finalising.
- `modules/apps/roll-dialog.mjs` — `#onSubmit` reads `formData.object.difficulty` (line 71–73);
  extend to add tier mod before resolving.
- `templates/dice/roll-dialog.hbs` — existing `showDifficulty` block (lines 21–26) is the
  insertion point for the dropdown.
- `PRPs/feats/feat014_non_combat_rolls.md` — context for how `showDifficulty` was introduced.
- `PRPs/feats/feat018-targeted-rolls-rethink.md` — context for attack roll difficulty flow.


## OTHER CONSIDERATIONS:

- **Submit-time calculation:** Tier mod is applied once at submit. The number input always shows
  the raw base difficulty; the tier label communicates the intent. This avoids double-applying
  the mod if the user switches tiers multiple times.
- **Storing tier mod:** Add a `#selectedTierMod = 0` private field to `RollDialog`. Update it
  via a `_onChangeForm` override or a `data-action` handler when the select changes.
- **Default = Normal (mod 0):** Pre-select `value="0"` so existing behaviour is unchanged when
  user ignores the dropdown.
- **No new return field:** `difficulty` in the resolved object stays a plain `number|null`.
  The tier is UI scaffolding, not data.
- **Force roll difficulty:** Force rolls previously returned `difficulty: null`. After this change
  they return a number (base 0 + tierMod). `#postForceRollToChat` already guards with
  `Number.isFinite(difficulty) && difficulty > 0` (line 318 pattern) — a zero result renders
  nothing, so existing behaviour is preserved when user leaves default Normal + 0.
- **Localization:** Add `STARWARSD6.Difficulty.<Tier>` keys and `STARWARSD6.Difficulty.Label`
  to `lang/en.json`.
- **Tests:** Add unit test: tiers array present in context for all `RollDialog` instances.
  Add integration test: selecting "Moderate" (mod +5) with base difficulty 10 yields
  `difficulty = 15` on submit. Add integration test: force roll with "Easy" (mod −5) and
  base 10 yields `difficulty = 5`.
- **No chat card changes needed** — roll card already displays raw `difficulty` value; will
  naturally show the modified total.
