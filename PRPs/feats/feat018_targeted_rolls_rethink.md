## FEATURE: Show Editable Difficulty in Targeted Attack Rolls

**Goal:** When a player makes a targeted attack roll (PC or NPC), the `RollDialog` should display the target's computed defense value in an **editable Difficulty field** — pre-filled but adjustable — so the player or GM can apply modifiers (range penalties, cover bonuses, called-shot malus, etc.) before rolling.

**Complexity:** S | **Dependencies:** feat013 (targeted combat), feat014 (RollDialog difficulty field), feat015 (NPC attack rolls)

### Background

Currently, targeted attack rolls bypass the Difficulty field entirely: the defense value is read from the target actor and passed straight to the roll resolution without ever being shown to the player (feat013). This works for clean cases but blocks common table situations where the effective difficulty differs from the raw defense — range band penalties, cover, aiming bonuses, called shots, etc. The fix is small: pre-fill the existing editable Difficulty input (already present via feat014) with the target's defense value instead of hiding it.

### Behaviour

1. Player targets a token and clicks Roll Attack on their sheet (PC or NPC path).
2. System reads the target actor's defense value (ranged / melee / brawling, same logic as today).
3. `RollDialog` opens with `showDifficulty: true` and `defaultDifficulty` set to that defense value.
4. Player can adjust the number before rolling (e.g., +4 for long range, −2 for aiming bonus).
5. Roll resolves against the **edited** difficulty, not the raw defense.
6. Chat card shows: target name, the **effective difficulty used** (not necessarily the raw defense), and hit/miss result.

### Files to modify

- `modules/apps/character-sheet.mjs` — `#rollAttack`: remove the branch that skips `showDifficulty` when a target is present. Pass `showDifficulty: true, defaultDifficulty: defenseValue` to `RollDialog.prompt()` in all attack paths (targeted and untargeted).
- `modules/apps/npc-sheet.mjs` — same change in the NPC attack roll handler.
- `modules/helpers/chat.mjs` (or equivalent) — chat card should display the effective difficulty used (already the case if `difficulty` is passed through from the roll result).
- `lang/en.json` — no new keys needed; existing `SWFD6.RollDifficulty` label is reused.

### Key implementation notes

**Minimal change:** The only structural change is removing (or skipping) the guard that hid the Difficulty field when a target was present. The `RollDialog` and chat rendering already support difficulty — just stop suppressing it in the attack path.

**Effective difficulty:** Destructure `difficulty` from `RollDialog.prompt()` result and pass it (not the raw `defenseValue`) to `#postAttackToChat`. The chat card must show the value the player actually rolled against.

**No target fallback:** Untargeted attack flow (blank manual difficulty input) is unchanged.

**NPC parity:** NPC attack rolls (feat015) must receive the same treatment — the NPC sheet handler should mirror the PC change exactly.

## EXAMPLES:

No example files. Refer to the existing targeted attack path in `modules/apps/character-sheet.mjs` (`#rollAttack`) and the non-combat roll path (`#rollSkill` / `#rollAttribute`) for the `showDifficulty: true, defaultDifficulty` call pattern introduced in feat014.

## DOCUMENTATION:

- `PRPs/feats/feat013-combat-automation.md` — original targeted attack flow (shows where the no-difficulty branch lives)
- `PRPs/feats/feat014-non-combat-rolls.md` — `showDifficulty` / `defaultDifficulty` pattern in `RollDialog`
- `PRPs/feats/feat015-npc-attack-rolls.md` — NPC attack handler to mirror
- `doc/rules-reference.md` — combat section for valid modifier examples (range, cover, aiming)

## OTHER CONSIDERATIONS:

- **Do not change the defense value source.** The target actor's `rangedDefense` / `meleeDefense` / `brawlingDefense` is still the starting value — it just becomes an editable pre-fill rather than a silent constant.
- **Chat card accuracy:** The card must log the *effective* difficulty (post-edit), not the raw defense, so the GM can audit what the roll was actually against.
- **No new fields or flags needed.** `defaultDifficulty` and `difficulty` already flow through `RollDialog` and chat; no schema changes required.
- **Targeted NPC attacks:** feat015 NPC handler must be updated in the same commit — partial implementation (PC only) would create an inconsistent UX.
