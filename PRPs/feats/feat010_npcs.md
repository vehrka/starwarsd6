
## Phase 6 — NPC Actor Type

**Goal:** NPC actor type with simplified DataModel (no skill items, direct defense values), NPC sheet, registered in system.

**Complexity:** M | **Dependencies:** Phase 4

### Files to create:
- `modules/actors/npc-data.mjs` — `NpcData extends foundry.abstract.TypeDataModel`
- `modules/apps/npc-sheet.mjs` — `NpcSheet`
- `templates/actors/npc-sheet.hbs`

### NpcData schema:
```js
{
  STR: attributeField(),            // same schema as character attributes
  rangedDefense: NumberField({ integer: true, min: 0, initial: 10 }),
  meleeDefense: NumberField({ integer: true, min: 0, initial: 10 }),
  brawlingDefense: NumberField({ integer: true, min: 0, initial: 10 }),
  damageDice: NumberField({ integer: true, min: 1, initial: 4 }),
  damagePips: NumberField({ integer: true, min: 0, max: 2, initial: 0 }),
  stunMarks: NumberField({ integer: true, min: 0, initial: 0 }),
  woundMarks: NumberField({ integer: true, min: 0, initial: 0 }),
  incapMarks: NumberField({ integer: true, min: 0, initial: 0 }),
  mortalMarks: NumberField({ integer: true, min: 0, initial: 0 }),
  notes: StringField({ initial: "" })
}
```

Derive `hitBoxes = STR.dice` and damage thresholds from `calculateDamageThresholds` helper (already in `modules/helpers/damage.mjs`).

> **Code promotion trigger:** `calculateDamageThresholds` now called from `character-data.mjs`, `npc-data.mjs`, and `damage.mjs` — third caller satisfies Rule of Three, confirming it belongs in `modules/helpers/damage.mjs`.

### Files to modify:
- `starwarsd6.mjs` — register `NpcData`, `NpcActor`, `NpcSheet`
- `system.json` — add `npc` to `documentTypes.Actor`
- `lang/en.json` — NPC sheet labels

**Testing:** Create NPC, STR 4D → 4 hit boxes. Set defense values directly. Mark wounds, verify thresholds.

**Ref:** `ref/dnd5e/module/data/actor/npc.mjs`; `ref/dnd5e/module/applications/actor/npc-sheet.mjs`.
