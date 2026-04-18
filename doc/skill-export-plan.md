
# Plan: Skills CSV + JSON Template for fvtt-data-toolbox

## Context

User wants to import all default Star Wars D6 skills into a Foundry compendium using fvtt-data-toolbox. Tool needs two files: a CSV with skill data and a JSON template mapping CSV columns to Foundry Item structure.

## Output Files

Both files go in `data/skills/` (new directory at project root).

---

## File 1: `data/skills/skills.csv`

Columns: `name,attribute,rank,rankPips`

- `name` — skill display name (title case)
- `attribute` — parent attribute code (`DEX`, `KNO`, `MEC`, `PER`, `STR`, `TEC`, `FORCE`)
- `rank` — starting dice rank (0 for all default skills)
- `rankPips` — starting pips (0 for all default skills)

**34 rows** — 31 attribute skills + 3 Force skills:

| Skill | Attribute |
|-------|-----------|
| Blaster | DEX |
| Brawling Parry | DEX |
| Dodge | DEX |
| Melee Combat | DEX |
| Melee Parry | DEX |
| Alien Species | KNO |
| Languages | KNO |
| Planetary Systems | KNO |
| Streetwise | KNO |
| Survival | KNO |
| Astrogation | MEC |
| Beast Riding | MEC |
| Repulsorlift Operation | MEC |
| Space Transports | MEC |
| Starfighter Piloting | MEC |
| Starship Gunnery | MEC |
| Bargain | PER |
| Con | PER |
| Gambling | PER |
| Search | PER |
| Sneak | PER |
| Brawling | STR |
| Climbing/Jumping | STR |
| Stamina | STR |
| Computer Programming/Repair | TEC |
| Droid Programming | TEC |
| Droid Repair | TEC |
| First Aid | TEC |
| Medicine | TEC |
| Space Transports Repair | TEC |
| Starfighter Repair | TEC |
| Control | FORCE |
| Sense | FORCE |
| Alter | FORCE |

---

## File 2: `data/skills/skills-template.json`

Maps to Foundry Item structure observed in `doc/ref/fvtt-Item-blaster.json`:

```json
{
  "name": "{{name}}",
  "type": "skill",
  "img": "icons/svg/item-bag.svg",
  "effects": [],
  "system": {
    "attribute": "{{attribute}}",
    "rank": {{rank}},
    "rankPips": {{rankPips}}
  }
}
```

- `attribute` quoted (string), `rank`/`rankPips` unquoted (numbers) — per toolbox rules
- No `_id`, `flags`, `_stats`, `folder` — toolbox generates standard fields automatically

---

## Verification

After implementation:
1. Check CSV has 34 data rows + 1 header = 35 lines
2. Validate JSON template is valid (no syntax errors)
3. In Foundry: use fvtt-data-toolbox macro, load both files, generate into a compendium, verify skill items appear with correct `system.attribute` values
