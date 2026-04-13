## Phase 7 — Force System

**Goal:** Force skills (control/sense/alter) as independent die codes on Force-sensitive characters. DSP bonus applies to Force rolls. "Keep up" tracking. Dark side conversion roll.

**Complexity:** L | **Dependencies:** Phase 5

### Files to create:
- `modules/helpers/force.mjs` — `calculateForceDiceBonus(dsp)`, `applyDarkSidePoint(actor)`

### Files to modify:
- `modules/actors/character-data.mjs` — add Force fields (active when `forceSensitive: true`):
  ```js
  forceSkills: SchemaField({
    control: SchemaField({ dice: NumberField({ min: 0, initial: 0 }), pips: NumberField({ min: 0, max: 2, initial: 0 }) }),
    sense:   SchemaField({ dice: ..., pips: ... }),
    alter:   SchemaField({ dice: ..., pips: ... })
  }),
  keptUpPowers: ArrayField(StringField())  // names of currently active kept-up powers
  ```
  In `prepareDerivedData()`: compute DSP bonus via `calculateForceDiceBonus(dsp)`, expose `forceRollBonus`.

- `modules/apps/character-sheet.mjs` — Force tab (visible only when `forceSensitive === true`): Force skill die codes (editable), DSP counter, kept-up powers list, "Add DSP" button.

### Key functions in `modules/helpers/force.mjs`:

```js
// calculateForceDiceBonus(dsp):
// dsp 0:     { bonusDice: 0, bonusPips: 0 }
// dsp 1–2:   { bonusDice: 0, bonusPips: 2 * dsp }  (normalize overflow: 3 pips → 1 die)
// dsp >= 3:  { bonusDice: dsp, bonusPips: 0 }

// applyDarkSidePoint(actor):
// 1. newDsp = actor.system.darkSidePoints + 1
// 2. actor.update({ "system.darkSidePoints": newDsp })
// 3. Roll 1d6; if total < newDsp → post chat warning "Character consumed by dark side"
```

**Force power activation:** Powers are free-text entries, not coded items. `RollDialog` adds a "Force difficulty modifier" input (+0 to +30) for relationship/proximity. Multi-skill powers: user declares each skill roll as separate actions (normal multiple-action penalty applies). "Keep up" count (`keptUpPowers.length`) adds to action count for all rolls.

**Testing:** Force-sensitive character, control 2D. DSP=3 → roll shows control+3D bonus. "Add DSP" rolls conversion check in chat. Keep up 2 powers → action penalty of 2 on all rolls.
