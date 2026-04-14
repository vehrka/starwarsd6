## FEATURE: Non-Combat Skill Roll Difficulty

**Goal:** Add a `Difficulty` field to the roll dialog for all non-combat skill and attribute rolls, so players can set a target number before rolling. The field pre-fills with a sensible default derived from the skill's die code.

**Complexity:** S | **Dependencies:** feat004 (dice engine), feat013 (RollDialog with difficulty field for no-target attacks)

### Background

Combat attack rolls already resolve against a target's defense value. Skill rolls (piloting, persuasion, sneaking, etc.) currently produce a total with no difficulty to compare against — the GM eyeballs the result. This feature makes difficulty explicit and visible in every non-combat roll.

### Behaviour

1. Every skill/attribute roll that is **not** a combat attack opens `RollDialog` with a **Difficulty** number input.
2. The field is pre-filled with `ceil(3.5 × N)`, where `N` is the number of dice in the rolled attribute or skill.
   - Example: rolling `4D+1` → default difficulty = `ceil(3.5 × 4)` = `14`.
3. The player may change the difficulty value before rolling.
4. After rolling, the chat card shows:
   - The roll total.
   - The difficulty used.
   - A clear **Success** / **Failure** result label.
5. If no difficulty is entered (field cleared / 0), the roll resolves with no pass/fail judgement — total is shown as-is (GM adjudicates).

### Formula

```
default_difficulty = Math.ceil(3.5 * dicePart)
```

where `dicePart` is the integer before the `D` in the die code (e.g., `4` for `4D+1`).

### Files to modify

- `modules/apps/roll-dialog.mjs` — accept `defaultDifficulty` option; render difficulty input; return difficulty in resolved data.
- `modules/apps/character-sheet.mjs` — pass `defaultDifficulty: Math.ceil(3.5 * dicePart)` when opening `RollDialog` for skill/attribute rolls (non-attack paths). Compare roll total to difficulty; pass success/failure flag to chat.
- `modules/helpers/chat.mjs` (or wherever chat cards are built) — render difficulty, total, and success/failure label on the card.
- `lang/en.json` — add keys: `SWFD6.RollDifficulty`, `SWFD6.RollSuccess`, `SWFD6.RollFailure`.

### Key implementation notes

**Scope:** Only non-combat rolls get this treatment. The `#rollAttack` path in `character-sheet.mjs` already handles difficulty via target defense (feat013) — do not change that path.

**`RollDialog` reuse:** feat013 already added an optional difficulty input to `RollDialog` for the no-target attack case. Extend that same input rather than duplicating it; just ensure it is shown for all non-attack rolls too and that `defaultDifficulty` is always provided.

**No difficulty entered:** Treat blank / `0` / `NaN` as "no difficulty" — skip success/failure evaluation and omit the result label from the chat card.

**Wound penalties:** Skills rolls already apply the wound penalty die reduction before the die code is known — read the effective die code (post-penalty) when computing `defaultDifficulty`.

### Testing

- Roll `blaster 3D+2` with no target → dialog shows difficulty `11` (ceil(3.5×3)). Change to `14`, roll 16 → chat shows **Success**. Roll 13 → **Failure**.
- Clear the difficulty field → roll resolves, chat shows total only, no success/failure label.
- Roll a `4D` Force skill → default difficulty `14`.
- Confirm combat attack roll path unchanged: targeting a token still uses defense value, no difficulty field shown.
