# feat022 — PC Default Skills on Creation

## FEATURE:

When a new PC actor is created (type `character`), automatically add a fixed set of default skill items to the sheet. NPCs get no default skills — GM adds them manually.

**Requirements:**
- Trigger on PC creation only (`this.type === "character"` guard in `_onCreate`)
- Only run for the creating user (`userId === game.user.id`)
- Create skill items via `createEmbeddedDocuments("Item", [...])` — never direct assignment
- Each skill: `type: "skill"`, `system.attribute` = parent attribute key, `system.rank = 0`
- Skills grouped by attribute — see full list below

**Default skill list (from `doc/ref/bs_character_sheet.jpg`):**

| Attribute | Skills |
|-----------|--------|
| DEX | Blaster, Brawling Parry, Dodge, Grenade, Hvy Weapons, Melee |
| KNO | Alien Races, Bureaucracy, Culture, Languages, Planets, Streetwise, Survival, Technology |
| MEC | Astrogation, Beast Riding, Repulsorlift Operation, Ship Weapons, Ship Pilot, Ship Shields |
| PER | Bargain, Command, Con, Gambling, Hide/Sneak, Search |
| STR | Brawling, Climb/Jump, Lifting, Stamina, Swimming |
| TEC | Computers, Demolitions, Droids, Medicine, Repair, Security |

## EXAMPLES:

- `doc/ref/bs_character_sheet.jpg` — reference character sheet showing all default skills per attribute column
- `modules/actors/character.mjs` — implementation; `DEFAULT_SKILLS` constant + `_onCreate` override

## DOCUMENTATION:

- `doc/rules-reference.md` — authoritative skill list and attribute groupings
- `ref/dnd5e/` — `_onCreate` patterns for document classes
- Foundry v13: `Actor._onCreate(data, options, userId)` — called after document created; use `createEmbeddedDocuments` to add embedded items

## OTHER CONSIDERATIONS:

- `CONFIG.Actor.documentClass` takes a **single class** (not a per-type map). The `_onCreate` guard (`this.type !== "character"`) handles NPC exclusion.
- `CONFIG.Actor.documentClasses` (plural) is **not a valid Foundry v13 API** — it silently fails, leaving the default `Actor` class and `_onCreate` never fires.
- Guard `userId !== game.user.id` prevents duplicate creation in multiplayer
- Skill `rank` stores offset from parent attribute dice — `0` means unskilled (rolls parent attribute)
