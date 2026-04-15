## FEATURE: NPC Sheet — Attributes, Skills, and Attack Rolls

Expand the NPC sheet (`modules/apps/npc-sheet.mjs`, `modules/actors/npc-data.mjs`, `templates/actors/npc-sheet.hbs`) to support:

1. **All 6 attributes** (`DEX`, `KNO`, `MEC`, `PER`, `STR`, `TEC`) editable as dice/pips inputs with a clickable roll button (same wild-die flow as `CharacterSheet.#rollAttribute`). Currently `NpcData` only stores `STR`.

2. **Skills section** — display skill items owned by the NPC, shown inline beneath their parent attribute (no separate section header). NPCs may hold `skill` type items via drag-and-drop from the item sidebar (same item type already used by PCs); **no skills are added by default** — the GM adds skills as needed. Roll flow mirrors `CharacterSheet.#rollSkill` but without CP/FP spending.

   Layout (attributes and skills are one combined section — skills appear indented under their parent attribute):
   ```
   Dexterity 3D  [roll]
   ─────────────────────
     Blasters 4D   [roll]
     Brawling 4D   [roll]
   Knowledge 2D  [roll]
   Mechanics 3D  [roll]
   ─────────────────────
     Astrogation 4D  [roll]
   ```

3. **Weapons section** — display `weapon` type items owned by the NPC in a table, with an attack roll button per row. Roll flow mirrors `CharacterSheet.#rollAttack` but without FP/keep-up-penalty logic. **Wound penalties apply** using the same formula as PCs (`penaltyDice = woundMarks×1 + incapMarks×2 + mortalMarks×3`, `penaltyPips = stunMarks×1`) — compute these in `NpcData.prepareDerivedData()` and expose as `penaltyDice` / `penaltyPips`. The `RollDialog` should be shown with `showDifficulty: true` when no target is selected, and suppressed (auto-resolve vs. target's defense) when a target token is selected — exactly the same target-detection pattern already in `CharacterSheet.#rollAttack`.

   Table columns: Name | Attack Skill | Roll formula | Damage | [attack roll button]

   Example:
   ```
   Name                  | Attack Skill | Formula | Damage | Roll
   DL-44 Blaster Pistol  | blaster      | 5D+1    | 4D     | [dice]
   ```

Attack roll posts to chat via `#postAttackToChat` — reuse the same HTML structure from `CharacterSheet` (including the "Roll Damage" button on hit). NPCs have **no keep-up penalty, no CP/FP** — omit those from the roll and chat output. Wound penalties are applied and shown in the chat card.

## EXAMPLES:

- `modules/apps/character-sheet.mjs` — reference for `#rollAttribute`, `#rollSkill`, `#rollAttack`, `#postAttackToChat`, `#postRollToChat`, and `_prepareContext` patterns for grouping skills and weapons. Copy the target-detection and RANGED/MELEE/BRAWLING defense-type resolution logic verbatim.
- `modules/actors/npc-data.mjs` — current NPC data model; needs 5 new attribute fields (`DEX`, `KNO`, `MEC`, `PER`, `TEC`) matching the existing `STR` `attributeField()` helper.
- `templates/actors/npc-sheet.hbs` — current NPC template; needs attributes + skills + weapons sections added before the existing Defence section.
- `modules/items/weapon-data.mjs` — weapon item schema (`damageDice`, `damagePips`, `attackSkill`, `range`); these fields are what the weapons table must display.

## DOCUMENTATION:

- `doc/rules-reference.md` — authoritative skill list (38 skills grouped by attribute), die-code format (`ND+P`), wild die rules, and the three defense types (Ranged / Melee / Brawling) and which skills map to each.
- `doc/fvtt/fvtt_sysdev.md` — Foundry v13 `ApplicationV2` sheet patterns.
- `ref/dnd5e/` — primary reference for `ApplicationV2`, `HandlebarsApplicationMixin`, and item-owned-by-actor patterns.

## OTHER CONSIDERATIONS:

- **NPC data model must be extended before the sheet**: `NpcData.defineSchema()` currently only has `STR`. Add `DEX`, `KNO`, `MEC`, `PER`, `TEC` using the same `attributeField()` helper. Update `prepareDerivedData()` to compute `baseValue` for all six attributes (copy the existing `STR` pattern).
- **Skills are items, not embedded schema fields**: NPCs own skill items just like PCs. No new data model fields are needed for skills — just filter `this.document.items` by `type === "skill"` in `_prepareContext`. The `dicePool` on a skill item is already computed against the parent attribute by `SkillData.prepareDerivedData()`.
- **Weapons are items too**: same item type as PCs; drag-and-drop already works in Foundry. No new data model fields needed.
- **Attack skill lookup by name**: `weapon.system.attackSkill` is a lowercase string (e.g. `"blaster"`). Look up the matching skill item by `i.name.toLowerCase() === attackSkillName`. If not found, fall back to the parent attribute (`DEX` for ranged skills). This is the same fallback used in `CharacterSheet.#rollAttack:350`.
- **RANGED_SKILLS / MELEE_SKILLS constants**: defined inline in `CharacterSheet.#rollAttack`. Move to a shared helper in `modules/helpers/` only if a third file needs them — for now copy them into `npc-sheet.mjs`.
- **Wound penalty derivation**: add to `NpcData.prepareDerivedData()` — `this.penaltyDice = this.woundMarks + (this.incapMarks * 2) + (this.mortalMarks * 3)` and `this.penaltyPips = this.stunMarks`. All four mark fields already exist in `NpcData.defineSchema()`. Pass `penaltyDice` and `penaltyPips` into the roll and chat output exactly as `CharacterSheet.#rollAttack` does (lines 372–378, 403).
- **No `RollDialog` FP/CP options for NPCs**: call `RollDialog.prompt({ showDifficulty: noTarget, defaultDifficulty })` without `canSpendFP` or `hasFP` flags.
- **Sheet scrollability**: the sheet body must be scrollable. Set `overflow-y: auto` on the `.sheet-body` element in the NPC sheet CSS. Do not rely solely on resizing — content will exceed a fixed height once attributes, skills, and weapons are all present.
- **`deleteItem` action**: add it to `NpcSheet` actions so GMs can remove skill/weapon items from the NPC, consistent with `CharacterSheet.#deleteItem`.
- **Localization**: all new labels (attribute names, section headers, table column headers) must have keys in `lang/en.json`. Reuse existing `STARWARSD6.Attribute.*` keys for the six attributes.
