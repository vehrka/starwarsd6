# NPC → Foundry VTT JSON Conversion

## Task

Convert the NPC stat block below into a Foundry VTT export JSON for the `starwarsd6` system. Output valid JSON only — no prose, no markdown fences.

Write the json in a file in doc/ref/fvtt-Actor-name.json

## JSON Structure

Use the template at `doc/ref/fvtt-Actor-npc-name.json` as the base. Key fields to fill:

- `name` — NPC name
- `prototypeToken.name` — same as `name`
- `system.DEX/KNO/MEC/PER/STR/TEC` — `{ "dice": N, "pips": P }` parsed from the stat block
- `system.rangedDefense` — `floor(3.5 × dodge_dice) + dodge_pips` (use DEX if no dodge skill)
- `system.meleeDefense` — `floor(3.5 × melee_parry_dice) + melee_parry_pips` (use DEX if no melee parry)
- `system.brawlingDefense` — `floor(3.5 × brawling_parry_dice) + brawling_parry_pips` (use STR if no brawling parry)
- `system.damageDice` / `system.damagePips` — from the NPC's primary weapon damage (highest damage weapon)
- `system.notes` — list all non-weapon equipment here as plain text
- `items` — array of skill and weapon items (see below)

## Die Code Parsing

Format: `ND` or `ND+P` where N = dice count, P = pips (0, 1, or 2).

Examples: `3D` → `{ dice: 3, pips: 0 }`, `4D+2` → `{ dice: 4, pips: 2 }`

## Skill Items

For each skill listed under an attribute (skills with a value above the parent attribute):

- `type`: `"skill"`
- `img`: `"icons/svg/aura.svg"`
- `system.attribute`: parent attribute key (`"DEX"`, `"KNO"`, `"MEC"`, `"PER"`, `"STR"`, `"TEC"`)
- `system.rank` / `system.rankPips`: the **offset** from the parent attribute (skill total minus attribute base)
  - Example: attribute `3D`, skill `4D+2` → rank = 1, rankPips = 2
- `_id`: generate a random 16-character alphanumeric string
- `folder`: `null`
- `sort`: `0`
- `flags`: `{}`
- `effects`: `[]`
- `ownership`: `{ "default": 0 }`
- `_stats`: copy verbatim from the template, updating `createdTime`/`modifiedTime` with a plausible timestamp

Do **not** add skills that equal the parent attribute (rank 0, rankPips 0) unless they appear explicitly in the stat block.

## Weapon Items

For each piece of equipment that has a damage value:

- `type`: `"weapon"`
- `img`: `"icons/svg/sword.svg"`
- `system.damageDice` / `system.damagePips`: from the damage value
- `system.attackSkill`: the skill name used to attack (e.g. `"Blaster"`, `"Melee"`)
- `system.weaponBonus`: `0` (default)
- `system.range`: fill if known, else `""`
- `system.equipped`: `false`
- `_id`, `folder`, `sort`, `flags`, `effects`, `ownership`, `_stats`: same pattern as skills

## Non-weapon Equipment

Everything without a damage value goes into `system.notes` as a comma-separated list.

## Fields to Keep Verbatim from Template

`folder`, `img`, `prototypeToken` (except `name`), `effects`, `flags`, `_stats`, `ownership` — copy from template unchanged.

## NPC Data

<npcdata>

### Repair Droids


**Stats (SWD6)**
```
DEX 3D   blaster 4D, dodge 4D
KNO 2D   technology 3D
MEC 1D
PER 2D   hide/sneak 3D+2, search 4D+2
STR 3D   brawl 3D+1
TEC 2D   starship repair 4D
Equipment: blaster (damage 4D), manipulation claws (brawling damage 5D)
Cylindrical body, four flexible legs, slightly over one meter tall.
Treat Rebels as vermin. Fight until destroyed.
```

</npcdata>
