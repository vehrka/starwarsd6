## Phase 1 — Skill Sheet & Data Expansion

**Goal:** All 38 skills (plus 3 Force skills) in DataModel. Character sheet shows skills grouped by attribute. Tabbed layout foundation for all future phases.

**Complexity:** M | **Dependencies:** Phase 0

### Files to create:
- `templates/items/skill-sheet.hbs`
- `modules/apps/skill-sheet.mjs` — `SkillSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2)`

### Files to modify:
- `modules/items/skill-data.mjs` — fix pip derivation: `dicePool = parentAttr.dice + rank`, `pips = parentAttr.pips`. Add `isForce: BooleanField`. Force skills (`isForce: true`) have no parent attribute; `dicePool` is stored rank, `pips` stored as `forcePips`.
- `modules/actors/character-data.mjs` — add:
  - `move: NumberField({ initial: 10 })`
  - `forceSensitive: BooleanField`
  - `characterPoints: NumberField({ initial: 0 })`
  - `forcePoints: NumberField({ initial: 0 })`
  - `darkSidePoints: NumberField({ initial: 0 })`
  - Wound tracking: `stunMarks`, `woundMarks`, `incapMarks`, `mortalMarks` as `NumberField({ initial: 0 })`
  - Derive `hitBoxes = STR.dice` in `prepareDerivedData()`
- `templates/actors/character-sheet.hbs` — replace flat layout with two-tab structure: attributes tab, skills tab (skills grouped by attribute key)
- `starwarsd6.mjs` — register `SkillSheet`
- `lang/en.json` — all 38 skill names, sheet tab labels

### Key patterns:

**`CharacterSheet._prepareContext()`** — build `attributeGroups`:
```js
context.attributeGroups = ATTRIBUTE_KEYS.map(key => ({
  key, label: `STARWARSD6.Attribute.${key}`,
  ...this.document.system[key],
  skills: this.document.items
    .filter(i => i.type === "skill" && i.system.attribute === key)
    .map(skill => ({ id: skill.id, name: skill.name, ...skill.system }))
}));
context.forceSkills = this.document.items.filter(i => i.type === "skill" && i.system.isForce);
```

**Tab pattern:** Use `data-tab` / `data-tab-group` Foundry attributes. Match the structure in `ref/dnd5e/module/applications/actor/character-sheet.mjs`.

**Testing:** Create a character. Add a "blaster" skill item (attribute DEX, rank 1). Open character sheet → skills tab → blaster appears under DEX with correct dicePool.
