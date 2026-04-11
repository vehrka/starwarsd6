# feat001 — Base Foundry System Scaffold

## Goal

Deliver a minimal but complete, installable `starwarsd6` Foundry VTT v13 system that loads without errors, lets a GM create a `character` actor and a `skill` item, and opens a functional actor sheet.

## Deliverables

| File | Purpose |
|------|---------|
| `system.json` | System manifest |
| `starwarsd6.mjs` | Entry point — all `Hooks.once("init", ...)` setup |
| `modules/actors/character-data.mjs` | `CharacterData` DataModel |
| `modules/actors/character.mjs` | `CharacterActor` document class |
| `modules/items/skill-data.mjs` | `SkillData` DataModel |
| `modules/items/skill.mjs` | `SkillItem` document class |
| `modules/apps/character-sheet.mjs` | `CharacterSheet` ApplicationV2 sheet |
| `templates/actors/character-sheet.hbs` | Actor sheet Handlebars template |
| `styles/starwarsd6.css` | Minimal stylesheet |
| `lang/en.json` | English localization strings |

## Data Model

### CharacterData (`character` actor type)

Six attributes, each stored as `{ dice: Number, pips: Number }` where `pips` is 0, 1, or 2:

- `DEX`, `KNO`, `MEC`, `PER`, `STR`, `TEC`

Derived in `prepareDerivedData()`:
- `baseValue = floor(3.5 × dice) + pips` for each attribute

### SkillData (`skill` item type)

| Field | Type | Description |
|-------|------|-------------|
| `attribute` | `String` | One of `DEX`, `KNO`, `MEC`, `PER`, `STR`, `TEC` |
| `rank` | `Number` | Die rank offset from parent attribute (integer, min 0) |

Derived in `prepareDerivedData()`:
- `dicePool = parentAttribute.dice + rank`
- `pips = parentAttribute.pips` (inherited from parent attribute)

## Acceptance Criteria

- [ ] System installs and loads in Foundry v13 with no console errors
- [ ] Creating a `character` actor succeeds; all six attributes are present with default values
- [ ] Creating a `skill` item succeeds; `attribute` and `rank` fields are present
- [ ] Opening the character sheet renders without errors and displays all six attributes
- [ ] Assigning a `skill` item to a character actor resolves `dicePool` correctly

## Constraints

- Plain JavaScript ESM only — `.mjs` extensions, no `require()`, no build step
- `ApplicationV2` for all sheets — `Application`/`FormApplication` are forbidden
- `static DEFAULT_OPTIONS` and `static PARTS` patterns (see `ref/dnd5e/module/applications/actor/`)
- DataModels use `static defineSchema()` with `foundry.data.fields.*` (see `ref/dnd5e/module/data/actor/character.mjs`)
- Register sheets via `DocumentSheetConfig.registerSheet` — not `Actors.registerSheet`
- No `mergeObject`, no `duplicate`, no `getData()`-based sheets
- No `template.json` — DataModels replace it entirely
- `game`, `CONFIG`, `Hooks`, `Roll`, `Actor`, `Item` are Foundry globals — never import them

## Reference Paths

- Sheet pattern: `ref/dnd5e/module/applications/actor/api/base-actor-sheet.mjs`
- DataModel pattern: `ref/dnd5e/module/data/actor/character.mjs`
- Item DataModel pattern: `ref/dnd5e/module/data/item/tool.mjs`
- Entry point pattern: `ref/dnd5e/dnd5e.mjs`
- Module structure: `ref/dnd5e/module/data/actor/_module.mjs`

## Out of Scope

- Dice rolling
- Combat or damage
- Multiple actor types (NPC, vehicle, etc.)
- Item sheet
- Active effects
- Compendium packs
