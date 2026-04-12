## Phase 4 — Combat: Defense Values, Damage Thresholds, Hit Box Tracking

**Goal:** Sheet shows derived defense values. Damage rolls compare against STR thresholds. Hit boxes tracked and rendered. Tier penalties computed and applied to rolls.

**Complexity:** L | **Dependencies:** Phases 2, 3

### Files to create:
- `modules/helpers/defense.mjs` — `calculateRangedDefense(actor)`, `calculateMeleeDefense(actor)`, `calculateBrawlingDefense(actor)`
- `modules/helpers/damage.mjs` — `calculateDamageThresholds(strDice, strPips)`, `resolveDamageTier(damageTotal, thresholds)`, `applyDamage(actor, tier)`

### Files to modify:
- `modules/actors/character-data.mjs` — add `armorBonus: NumberField` and `weaponBonus: NumberField` (manual overrides). In `prepareDerivedData()`: compute defense values and damage thresholds, expose `penaltyDice` and `penaltyPips` from wound marks.
- `modules/apps/character-sheet.mjs` — add combat tab; wire roll-attack action; wire hit-box click-to-mark
- `templates/actors/character-sheet.hbs` — combat tab: defense values, damage threshold hit box checkboxes per tier
- `lang/en.json` — combat labels

### Key functions:

**`calculateRangedDefense(actor)`:**
```
find dodge skill in actor.items (i.name === "dodge") or fall back to DEX
floor(3.5 × dodgeDice) + dodgePips + actor.system.armorBonus
```

**`calculateDamageThresholds(strDice, strPips)`:**
```
base = floor(3.5 × strDice) + strPips
returns { base, stun: [0, base), wound: [base, 2*base), incap: [2*base, 3*base), mortal: ≥3*base }
```

**`applyDamage(actor, tier)`:** Increment `${tier}Marks` by 1. Overflow (marks ≥ hitBoxes) cascades to next tier. Use `actor.update()`.

**Tier penalties in `prepareDerivedData()`:**
```
penaltyDice = woundMarks×1 + incapMarks×2 + mortalMarks×3
penaltyPips = -1 per stunMark (flat roll penalty, not dice)
```

**Roll-attack flow:** Get weapon from actor.items → open `RollDialog` → `rollWithWildDie` with attack skill dice minus tier penalties → post to chat.

**Testing:** STR 3D → base=10, 3 hit boxes/tier. Mark hit boxes, verify overflow cascade. Roll skill with 2 wound marks → dice reduced by 2.

**Ref:** `ref/dnd5e/module/data/actor/templates/attributes.mjs`.

