# CLAUDE.md — Star Wars D6 FoundryVTT System

## Project Overview

A FoundryVTT v13 game system implementing the Star Wars D6 RPG (1st edition + Bill Slavicsek house rules).

- **System id:** `starwarsd6` (folder name must match exactly)
- **Target:** Foundry VTT v13 (minimum 13, no legacy support)
- **Language:** Plain JavaScript ESM (`.mjs`) — no TypeScript, no build step, no bundler

## Key Docs

| Path | Purpose |
|------|---------|
| `doc/rules-reference.md` | **Authoritative** rules reference — single source of truth for all game mechanics |
| `doc/fvtt/fvtt_sysdev.md` | Foundry v13 system development guide and pitfalls |
| `ref/dnd5e/` | **Primary reference** — official Foundry-recommended v13 system; use for ApplicationV2 sheets, DataModel patterns, and API usage |
| `ref/FoundryVTT-Nimble/` | Secondary reference — modern Svelte-based system; use `AGENTS.md` and `docs/STYLE_GUIDE.md` for coding conventions and engineering principles |
| `ref/StarWarsFFG/` | Tertiary reference — uses deprecated sheet APIs; do **not** use as architecture reference |
| `PRPs/feats/` | Feature implementation specs (PRP = Product Requirements Prompt) |
| `deploy.sh` | Deploys via rsync to `vehrka:share/foundrydata_13/Data/systems/starwarsd6/` |

## Architecture

### File Layout

```
starwarsd6/
├── system.json              # Manifest (id, version, esmodules, styles, languages)
├── starwarsd6.mjs           # Entry point — all Hooks.once("init", ...) setup here
├── modules/
│   ├── actors/              # Actor DataModels and document classes
│   ├── items/               # Item DataModels and document classes
│   ├── apps/                # ApplicationV2 sheets
│   └── helpers/             # Utility functions, roll helpers
├── templates/               # Handlebars templates
├── styles/                  # CSS
└── lang/
    └── en.json              # Localization strings
```

### v13 Patterns (mandatory)

- **Sheets:** `ApplicationV2` only — `Application`/`FormApplication` are deprecated
- **Data models:** Register via `CONFIG.Actor.dataModels` and `CONFIG.Item.dataModels`
- **Document classes:** Assign via `CONFIG.Actor.documentClass` / `CONFIG.Item.documentClass`
- **No deprecated APIs:** avoid `mergeObject`, `duplicate`, old `getData`-based sheets
- **Init hook:** All system setup in `Hooks.once("init", ...)` in `starwarsd6.mjs`

## Game Rules Summary

### Attributes (6 total)

`DEX`, `KNO`, `MEC`, `PER`, `STR`, `TEC` — each a die code (e.g. `3D+2`)

### Skills

Listed under parent attribute. Unskilled = roll parent attribute. Skills stored as die code offset from parent.

Force skills (`control`, `sense`, `alter`) are independent — no parent attribute.

### Die Code Format

`ND+P` — N six-sided dice plus P pips (0, +1, or +2).  
Derived formula: `base_value = floor(3.5 × N) + P`

### Wild Die

Always included in skill/attribute rolls. On 1: GM complication. On 6: explodes (reroll, add).

### Combat

- **Attack:** roll combat skill vs. static Defense value
- **Ranged Defense:** `floor(3.5 × dodge_dice) + dodge_pips + armor_bonus`
- **Melee Defense:** `floor(3.5 × melee_parry_dice) + melee_parry_pips + weapon_bonus`
- **Brawling Defense:** `floor(3.5 × brawling_parry_dice) + brawling_parry_pips`
- **Damage tiers:** Stun / Wound / Incapacitated / Mortally Wounded — thresholds derived from STR

### Hit Boxes

Per tier: `hit_boxes = STR_dice` (pips ignored). Overflow cascades to next tier.

### Multiple Actions

Each extra action beyond the first: −1D penalty to **all** rolls that round.

## Development Workflow

### Deploy

```bash
./deploy.sh           # rsync to vehrka Foundry server
./deploy.sh --dry-run # preview changes
```

Excludes: `tests/`, `doc/`, `PRPs/`, `ref/`, `.git/`, `deploy.sh`, `*.md`

### Implementation Order (PRPs)

1. `PRPs/feats/feat001_base_foundry_requirement.md` — base system scaffold

Add new PRPs in `PRPs/feats/` as `featNNN_<slug>.md`.

## Coding Standards

- ESM only: `import`/`export`, no `require()`
- No build step — files must work directly in Foundry
- Handlebars templates in `templates/`
- Localization keys in `lang/en.json` for all user-visible strings
- For API and sheet patterns, consult `ref/dnd5e/module/` first

### Naming

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `CharacterSheet`, `SkillData` |
| Functions | camelCase verbs | `calculateDicePool`, `applyDamage` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PIPS`, `ATTRIBUTES` |
| Files | kebab-case | `character-sheet.mjs`, `skill-data.mjs` |

Use descriptive names — avoid abbreviations (`dicePool` not `dp`, `attribute` not `attr`).

### Engineering Principles (from Nimble AGENTS.md)

- **KISS**: Use explicit `if`/`switch`. Avoid dynamic dispatch or runtime string-to-function lookups.
- **YAGNI**: Every abstraction must have a current caller. No stubs or no-op fallbacks for unsupported paths — throw an error.
- **Rule of Three**: Two similar blocks in one file are fine. Extract to a shared helper only after the same pattern appears three times across different files.
- **One export per file**: Each module exports one public class, function, or constant. Internal helpers stay in the file but are not exported.

### Code Promotion (scope ladder)

| Level | Location | When |
|-------|----------|------|
| Local | Same file | Only one caller |
| Feature | Feature directory (e.g., `modules/actors/`) | 2+ files in the same feature |
| Global | `modules/helpers/` | 3+ files across different features |

Never skip a level. The promoting change must update all existing call-sites.

### Foundry globals

`game`, `CONFIG`, `Hooks`, `Roll`, `Actor`, `Item` are globals — never import them.

### Document mutations

Never assign to document properties directly. Use `actor.update()` / `item.update()` — direct assignment won't persist.

## Rules Reference Usage

Always consult `doc/rules-reference.md` before implementing any mechanic. It merges base rules + house rules — house rules take precedence where they conflict.
