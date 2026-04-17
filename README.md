# Star Wars D6 — FoundryVTT System

A FoundryVTT v13 game system implementing the **Star Wars D6 RPG** (1st edition + Bill Slavicsek house rules).

---

## For Players & GMs

### Characters

When you create a **PC actor**, the system auto-populates 36 standard skills grouped under their parent attribute. Open the character sheet to find five tabs:

- **Bio** — name, portrait, identity fields (type, height, weight, sex, age, description), and notes
- **Attributes** — 6 attributes (DEX, KNO, MEC, PER, STR, TEC) each with die codes; Character Points, Force Points, and Move tracked in the footer
- **Skills** — all skills listed under their parent attribute; click any skill name to roll it
- **Combat** — equipped weapons with attack buttons, defense values, and the wound grid
- **Inventory** — weapons, armor, and equipment carried by the character
- **Force** *(Force-sensitive only)* — control/sense/alter die codes, kept-up powers, and Dark Side Points

### Rolling Dice

Click any **skill or attribute** to open the Roll Dialog:

- Set **Number of Actions** (1–4). Each action beyond the first applies a −1D penalty to all rolls that round.
- A **Difficulty** field is pre-filled (≈ 3.5× your dice pool). Change it if the GM calls for a different target number.
- Optionally check **Spend Force Point** to double all dice for this roll (costs 1 FP; cannot combine with Character Points in the same round).
- Click **Roll**. The chat card shows each die, the Wild Die result, and a **Success / Failure** label vs. the difficulty.

**Wild Die rules:**
- Roll of **6**: explodes — the die is re-rolled and the new value added (repeatedly).
- Roll of **1**: complication — annotated in the chat card; GM decides the narrative consequence.

**Spending a Character Point:** After a roll, if you have CP remaining, a **Spend CP** button appears in the chat card. Click it to roll one extra die and add it to your total. CP decrements by 1.

### Combat

1. **Target** the enemy token (Foundry's standard T key).
2. Click **Roll Attack** on your weapon row. The system reads the target's defense automatically (ranged / melee / brawling).
3. On a **hit**, click **Roll Damage** in the chat card.
4. The damage total is compared against the target's STR thresholds; the resulting wound tier is shown.
5. The GM clicks **Mark Hit Box** to apply the wound to the target.

With no token targeted, enter a manual **Difficulty** number in the Roll Dialog. Damage is adjudicated by the GM.

**Wound tiers and hit boxes:** Each tier (Stun / Wound / Incapacitated / Mortally Wounded) has a number of hit boxes equal to the actor's STR dice. Overflow cascades to the next tier. Wound penalties (−1D per Wound mark, −2D per Incap mark, etc.) are applied automatically to all rolls.

### NPCs

Create an **NPC actor** for enemies and supporting characters. The NPC sheet is a single scrollable page with attributes, skills, weapons, defense values, wound tracking, and notes. NPCs support full attribute/skill rolls and attack rolls with the same Wild Die flow as PCs.

### Items

Three item types are available from the Items sidebar:

| Type | Key fields |
|------|-----------|
| **Weapon** | Damage dice/pips, attack skill, range, weapon bonus (melee parry) |
| **Armor** | Armor bonus (adds to ranged defense) |
| **Equipment** | Description, quantity |

Drag items onto a character sheet to add them to inventory.

### Force Powers

Force-sensitive characters can own **Force Power** items. Each power lists its activation skills (control/sense/alter), difficulty, and whether it can be kept up. Activate powers from the Force tab. Kept-up powers count as continuous actions — each one imposes a −1D penalty on all rolls.

---

## Development Status

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Base scaffold & sheet rendering | ✅ Done |
| 1 | Skills & data expansion (38 skills) | ✅ Done |
| 2 | Dice engine — Wild Die rolls | ✅ Done |
| 3 | Item types: weapon, armor, equipment | ✅ Done |
| 4 | Combat: defense values, damage tiers, hit boxes | ✅ Done |
| 5 | Character Points & Force Points | ✅ Done |
| 6 | NPC actor type | ✅ Done |
| 7 | Force system: control/sense/alter, DSP, keep-up | ✅ Done |
| 7.5 | Force Powers item type | ✅ Done |
| 8 | Targeted combat resolution (auto-read target defense) | ✅ Done |
| 9 | Sheet polish — Force tab restyle | ✅ Done |
| — | Non-combat roll difficulty field | ✅ Done |
| — | PC combat tab restyling | ✅ Done |
| — | Circle counters (CP/FP/DSP) | ✅ Done |
| — | NPC attributes, skills & attack rolls | ✅ Done |
| — | Bio tab (portrait + identity fields) | ✅ Done |
| — | NPC sheet restyling | ✅ Done |
| — | Auto-populate default skills on PC creation | ✅ Done |

**Out of scope:** compendium packs, vehicle actors, Active Effects, token automation.

---

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
- Polished tabbed sheets, full localization, styled chat cards

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
