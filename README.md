# Star Wars D6 — FoundryVTT System

A FoundryVTT v13 game system implementing the **Star Wars D6 RPG** (1st edition + Bill Slavicsek house rules).

## Final Goal

A fully playable Star Wars D6 system for Foundry VTT v13, covering:

- Full character creation: 6 attributes (DEX, KNO, MEC, PER, STR, TEC), 36 default skills + 3 Force skills; skills auto-populated on PC creation
- Wild-die roll engine with complication and explosion annotations in chat
- Weapons, armor, and equipment item types with inventory management
- Combat resolution: derived defense values, damage tiers, hit-box tracking, wound penalties
- Non-combat skill/attribute rolls show a pre-filled difficulty and Success/Failure result in chat
- Character Points and Force Points spend mechanics
- NPC actor type with simplified sheet
- Force System: control/sense/alter skills, DSP bonus, keep-up powers, dark side conversion
- Healing rolls (stamina and medicine) with tier-priority enforcement
- Polished tabbed sheets, full localization, styled chat cards

**Out of scope:** compendium packs, vehicle actors, Active Effects, token automation.

---

## Tech Stack

- **Platform:** FoundryVTT v13 (minimum v13, no legacy support)
- **Language:** Plain JavaScript ESM (`.mjs`) — no TypeScript, no build step, no bundler
- **Sheets:** `ApplicationV2` + `HandlebarsApplicationMixin`
- **Data:** `TypeDataModel` registered via `CONFIG.Actor.dataModels` / `CONFIG.Item.dataModels`

## Project Layout

```
starwarsd6/
├── system.json              # Manifest
├── starwarsd6.mjs           # Entry point
├── modules/
│   ├── actors/              # Actor DataModels and document classes
│   ├── items/               # Item DataModels and document classes
│   ├── apps/                # ApplicationV2 sheets
│   └── helpers/             # Dice, defense, damage utilities
├── templates/               # Handlebars templates
├── styles/                  # CSS
└── lang/
    └── en.json              # Localization strings
```

## Deploy

```bash
./deploy.sh           # rsync to remote Foundry server
./deploy.sh --dry-run # preview changes
```
