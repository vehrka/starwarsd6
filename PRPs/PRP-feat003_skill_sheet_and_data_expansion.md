# PRP-feat003 — Skill Sheet & Data Expansion

## Goal

Expand the `starwarsd6` system so that:
1. All 38 standard skills + 3 Force skills are representable in the `SkillData` DataModel
2. `CharacterData` gains wound tracking, special points, movement, and Force-sensitivity fields
3. The character sheet gains a two-tab layout (Attributes tab + Skills tab, skills grouped by attribute)
4. A `SkillSheet` ApplicationV2 item sheet is registered for `skill` items
5. A Vitest test suite is established covering all pure derivation logic
6. `doc/implementation-plan.md` is updated to reflect Phase 1 complete

## Why

- Characters need a full skill list to be playable; the current model only stores `attribute` and `rank`
- Wound tracking (stunMarks, woundMarks, etc.) and hit boxes are required for combat (Phase 2 dependency)
- The flat single-page sheet won't scale — every subsequent phase adds content; tabs are the foundation
- Force skills have no parent attribute — `isForce: true` + independent die code are the data model fix

## What

### Success Criteria

- [ ] `SkillData` has `isForce: BooleanField` and correct pip derivation (see Gotchas)
- [ ] Force skills (`isForce: true`) derive `dicePool` and `pips` from their own stored fields, not from a parent attribute
- [ ] `CharacterData` has all new fields: `move`, `forceSensitive`, `characterPoints`, `forcePoints`, `darkSidePoints`, `stunMarks`, `woundMarks`, `incapMarks`, `mortalMarks`
- [ ] `prepareDerivedData()` in `CharacterData` derives `hitBoxes = STR.dice`
- [ ] Character sheet renders a tab bar with "Attributes" and "Skills" tabs
- [ ] Skills tab shows skills grouped by their parent attribute key (DEX group, KNO group, …, plus a Force group)
- [ ] `SkillSheet` opens when double-clicking a skill item and renders `attribute`, `rank`, `isForce` fields
- [ ] `SkillSheet` is registered via `DocumentSheetConfig.registerSheet` in `starwarsd6.mjs`
- [ ] All new user-visible strings have entries in `lang/en.json`
- [ ] No `import` of Foundry globals; no deprecated APIs
- [ ] Vitest test suite runs (`npm test`) with all unit tests passing
- [ ] `doc/implementation-plan.md` updated: Phase 1 marked complete, current state updated

---

## All Needed Context

### Documentation & References

```yaml
- url: https://foundryvtt.com/api/v13/modules.html
  why: v13 API — foundry.data.fields.BooleanField, foundry.applications.sheets.ItemSheetV2,
       tabGroups pattern, _preparePartContext signature

- file: ref/dnd5e/module/applications/actor/character-sheet.mjs
  why: tabGroups property (line 163), static TABS array (line 128), _prepareContext pattern (line 182)
       Shows how tab parts map to container IDs; PARTS entries that share container.id render into same div

- file: ref/dnd5e/module/applications/actor/api/base-actor-sheet.mjs
  why: changeTab() override pattern (line 1243); _configureRenderOptions tab preservation (line 170)

- file: ref/dnd5e/module/applications/item/item-sheet.mjs
  why: ItemSheet5e DEFAULT_OPTIONS and PARTS structure — shows correct extends chain for item sheets
       Line 20: extends PrimarySheetMixin(DocumentSheet5e) — our simpler version:
       HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2)

- file: doc/rules-reference.md
  why: Authoritative skill list (38 skills), Force skills section, hit box formula, wound tiers

- file: modules/actors/character-data.mjs
  why: Existing CharacterData — add new fields here; keep existing attributeField() helper

- file: modules/items/skill-data.mjs
  why: Existing SkillData — add isForce, fix pip derivation

- file: modules/apps/character-sheet.mjs
  why: Existing CharacterSheet — add tabGroups, tab PARTS, update _prepareContext

- file: starwarsd6.mjs
  why: Entry point — add SkillSheet import + DocumentSheetConfig.registerSheet call

- file: lang/en.json
  why: Localization — add all 38 skill names, Force skill names, tab labels, new field labels

- file: PRPs/PRP-feat002_BUG_actor_sheet_doesnt_load.md
  why: Shows exact gotcha format for this project; Foundry globals pattern

- file: ref/FoundryVTT-Nimble/tests/mocks/foundry.ts
  why: Complete Foundry global mock reference — shows exactly which globals need stubbing
       (foundry.data.fields.*, foundry.abstract.TypeDataModel, foundry.applications.sheets.*).
       We adapt this for plain JS (no TypeScript) in tests/mocks/foundry.mjs.

- file: ref/FoundryVTT-Nimble/tests/setup.ts
  why: Vitest setup pattern — globalThis assignment for foundry, game, CONFIG, Hooks mocks.
       Our equivalent: tests/setup.mjs

- file: ref/FoundryVTT-Nimble/src/utils/actorHealthState.test.ts
  why: Test style reference — describe/it/expect, pure function pattern, fixture objects.
       Our tests follow the same pattern in plain JS.

- url: https://vitest.dev/config/
  why: Vitest config — `globals: true`, `setupFiles`, `testEnvironment: "node"` options

- file: doc/implementation-plan.md
  why: Must be updated after feat003 completes — change Phase 1 status, update current state line
```

### Current Codebase Tree

```
fvtt-starwarsd6/
├── system.json
├── starwarsd6.mjs                        ← register SkillSheet here
├── modules/
│   ├── actors/
│   │   ├── character-data.mjs            ← ADD new fields + derivations
│   │   └── character.mjs                 ← no change
│   ├── items/
│   │   ├── skill-data.mjs                ← ADD isForce, fix pip derivation
│   │   └── skill.mjs                     ← no change
│   └── apps/
│       ├── character-sheet.mjs           ← ADD tabs, update _prepareContext
│       └── skill-sheet.mjs               ← CREATE NEW
├── templates/
│   └── actors/
│       └── character-sheet.hbs           ← REPLACE with tabbed layout
│   └── items/
│       └── skill-sheet.hbs               ← CREATE NEW
├── styles/
│   └── starwarsd6.css                    ← ADD tab styles
└── lang/
    └── en.json                           ← ADD skill names, tab labels
```

### Desired Codebase Tree (after feat003)

```
fvtt-starwarsd6/
├── system.json                           ← no change
├── starwarsd6.mjs                        ← +SkillSheet import + registerSheet
├── package.json                          ← NEW: vitest dev dependency + test script
├── vitest.config.mjs                     ← NEW: vitest configuration
├── modules/
│   ├── actors/
│   │   ├── character-data.mjs            ← new fields + hitBoxes derivation
│   │   └── character.mjs                 ← no change
│   ├── items/
│   │   ├── skill-data.mjs                ← isForce + corrected derivation
│   │   └── skill.mjs                     ← no change
│   └── apps/
│       ├── character-sheet.mjs           ← tabGroups + two-part PARTS + new _prepareContext
│       └── skill-sheet.mjs               ← NEW
├── templates/
│   ├── actors/
│   │   └── character-sheet.hbs           ← tabbed layout (attributes tab + skills tab)
│   └── items/
│       └── skill-sheet.hbs               ← NEW
├── styles/
│   └── starwarsd6.css                    ← +tab CSS
├── lang/
│   └── en.json                           ← +all skill names, tab labels
├── tests/
│   ├── setup.mjs                         ← NEW: globalThis Foundry mocks for vitest
│   ├── mocks/
│   │   └── foundry.mjs                   ← NEW: foundry global stubs
│   └── unit/
│       ├── character-data.test.mjs       ← NEW: baseValue + hitBoxes derivation tests
│       └── skill-data.test.mjs           ← NEW: dicePool derivation + Force branch tests
└── doc/
    └── implementation-plan.md            ← UPDATE: Phase 1 marked complete
```

### Skill List (from doc/rules-reference.md — authoritative)

**DEX (5 skills):** blaster, brawling parry, dodge, melee combat, melee parry  
**KNO (5 skills):** alien species, languages, planetary systems, streetwise, survival  
**MEC (6 skills):** astrogation, beast riding, repulsorlift operation, space transports, starfighter piloting, starship gunnery  
**PER (5 skills):** bargain, con, gambling, search, sneak  
**STR (3 skills):** brawling, climbing/jumping, stamina  
**TEC (7 skills):** computer programming/repair, droid programming, droid repair, first aid, medicine, space transports repair, starfighter repair  
**Force (3 skills, isForce=true):** control, sense, alter  

**Total: 38 standard + 3 Force = 41 skills** (feat spec says "38 skills + 3 Force skills")

---

## Known Gotchas & Critical Constraints

```js
// CRITICAL: isForce pip derivation — Force skills store their own die code independently.
// When isForce=true, the skill has its own dice/pips stored in `forceDice`/`forcePips` fields.
// dicePool = forceDice, pips = forcePips. NO parent attribute lookup.
// When isForce=false, existing derivation applies: dicePool = parentAttr.dice + rank, pips = parentAttr.pips.

// CRITICAL: SkillData schema needs TWO extra fields for Force skills:
//   forceDice: NumberField({ initial: 1, min: 1, integer: true })
//   forcePips: NumberField({ initial: 0, min: 0, max: 2, integer: true })
// These are only meaningful when isForce=true; they are ignored for regular skills.

// CRITICAL: tabGroups is an instance property (not static) on the sheet class.
// It declares the default active tab for each named tab group:
//   tabGroups = { primary: "attributes" };
// ApplicationV2 reads this to initialize the active tab on first render.

// CRITICAL: PARTS for tabbed sheets — each "body" part needs a `container` key to be placed
// inside the same container div. Simplest approach for our use case: use a single-part layout
// with tab switching done via CSS (active/inactive) rather than the dnd5e multi-part container
// approach — that approach requires `container.id` coordination that is complex. 
// SIMPLER APPROACH (recommended): Keep ONE part named "sheet" with the full template,
// and render both tabs in the single HBS template using data-tab / data-tab-group attributes.
// Foundry's ApplicationV2 core handles tab activation automatically when you use the correct
// data attributes — no need for multiple PARTS entries.

// CRITICAL: Tab HTML attributes in the template:
//   Tab nav button:  <button type="button" data-action="tab" data-tab="skills"
//                            data-group="primary" class="item {{#if (eq tabs.primary "skills")}}active{{/if}}">
//   Tab content div: <div data-tab="skills" data-group="primary"
//                         class="tab {{#if (eq tabs.primary "skills")}}active{{/if}}">
// The `tabs` object in context is provided by ApplicationV2 when you define `tabGroups`.
// Access via context.tabs (built by super._prepareContext).

// GOTCHA: `context.tabs` (ApplicationV2 built-in) vs our custom `context.tabGroups` (we built for skills grouping).
// Use `context.tabs.primary` for the active tab key in the template.
// Use `context.attributeGroups` for the skills-grouped-by-attribute data (different thing).

// CRITICAL: Foundry globals — never import these:
//   game, CONFIG, Hooks, Roll, Actor, Item, foundry (the namespace itself is global)
// Access SkillSheet's base class as:
//   const { HandlebarsApplicationMixin } = foundry.applications.api;
//   class SkillSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2)

// CRITICAL: BooleanField is in foundry.data.fields namespace:
//   const { NumberField, StringField, BooleanField } = foundry.data.fields;

// GOTCHA: `this.document` on ItemSheetV2 is the Item document. Access system data via
//   this.document.system   (e.g., this.document.system.isForce)

// GOTCHA: submitOnChange on item sheets — set form.submitOnChange: true in DEFAULT_OPTIONS
//   to auto-persist field edits without a Save button, same pattern as CharacterSheet.

// GOTCHA: DocumentSheetConfig.registerSheet for items uses `Item` (not `Actor`) as first arg:
//   DocumentSheetConfig.registerSheet(Item, "starwarsd6", SkillSheet, {
//     types: ["skill"], makeDefault: true, label: "STARWARSD6.SheetClass.Skill"
//   });
// Also unregister the default core ItemSheet first:
//   DocumentSheetConfig.unregisterSheet(Item, "core", foundry.appv1.sheets.ItemSheet);

// GOTCHA: Template path must be the full system-relative path:
//   "systems/starwarsd6/templates/items/skill-sheet.hbs"

// GOTCHA: The `templates/items/` directory does not exist yet — the agent must create it
// (the Write tool creates parent dirs implicitly, but be aware).

// ── TESTING GOTCHAS ─────────────────────────────────────────────────────────

// CRITICAL: The project has NO existing test infrastructure. This feat creates it from scratch.
// No package.json exists at the project root — it must be created.

// CRITICAL: The system is plain JS ESM with no build step. Vitest must be configured
// to handle .mjs files natively. Use `testEnvironment: "node"` (browser APIs not needed
// for pure derivation logic). Do NOT configure any bundler or transformer.

// CRITICAL: DataModel classes (CharacterData, SkillData) cannot be instantiated in tests
// without mocking `foundry.data.fields.*` and `foundry.abstract.TypeDataModel`.
// These are Foundry globals — they don't exist in Node. You must stub them on globalThis
// BEFORE importing any module that references them.
// Pattern (from ref/FoundryVTT-Nimble/tests/setup.ts, adapted to plain JS):
//   globalThis.foundry = { data: { fields: { NumberField, StringField, BooleanField, SchemaField } },
//                          abstract: { TypeDataModel } }
//
// The stubs only need to be "good enough" for the functions under test.
// NumberField/StringField/BooleanField/SchemaField can be no-op classes.
// TypeDataModel needs to be a base class that DataModel subclasses can extend.

// CRITICAL: prepareDerivedData() is the only testable logic in DataModels without Foundry.
// Test it by constructing a plain object that mimics what TypeDataModel initialises,
// then calling prepareDerivedData() directly on it.
// Do NOT try to test defineSchema() — it just instantiates field classes.

// CRITICAL: SkillData.prepareDerivedData() reads `this.parent?.actor?.system`.
// In tests, `this` is the instance — set up the mock parent on the instance directly:
//   skillDataInstance.parent = { actor: { system: { DEX: { dice: 3, pips: 1 } } } };

// GOTCHA: vitest.config.mjs must use `setupFiles: ["./tests/setup.mjs"]` so mocks load
// before any test imports DataModel subclasses.

// GOTCHA: package.json test script should be `"test": "vitest run"` (single-run, not watch)
// so CI and the validation loop work non-interactively.

// GOTCHA: `tests/` is excluded from deploy.sh already (it's in the exclude list).
// Confirm with: grep "tests" deploy.sh

// GOTCHA: The `eq` Handlebars helper used in tab templates (e.g. `{{#if (eq tabs.primary 'skills')}}`)
// is a custom helper — NOT built into Handlebars. Foundry registers it globally. In tests
// that only cover JS logic (not templates), this is not a concern. Never test HBS templates
// via Vitest — that requires a live Foundry instance.
```

---

## Implementation Blueprint

### Task 1 — MODIFY `modules/items/skill-data.mjs`

Add `isForce`, `forceDice`, `forcePips` fields. Fix `prepareDerivedData()` to branch on `isForce`.

```js
const { NumberField, StringField, BooleanField } = foundry.data.fields;

export default class SkillData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      attribute: new StringField({ required: true, initial: "DEX", blank: false }),
      rank: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      isForce: new BooleanField({ initial: false }),
      // Force-only fields (ignored when isForce=false):
      forceDice: new NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 1 }),
      forcePips: new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 0 })
    };
  }

  prepareDerivedData() {
    if (this.isForce) {
      this.dicePool = this.forceDice;
      this.pips = this.forcePips;
      return;
    }
    const actor = this.parent?.actor;
    if (!actor) return;
    const parentAttr = actor.system?.[this.attribute];
    if (!parentAttr) return;
    this.dicePool = parentAttr.dice + this.rank;
    this.pips = parentAttr.pips;
  }
}
```

### Task 2 — MODIFY `modules/actors/character-data.mjs`

Add new fields. Derive `hitBoxes` in `prepareDerivedData()`.

```js
const { NumberField, SchemaField, BooleanField } = foundry.data.fields;

// ... keep existing attributeField() helper unchanged ...

export default class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      // existing 6 attributes unchanged
      DEX: attributeField(), KNO: attributeField(), MEC: attributeField(),
      PER: attributeField(), STR: attributeField(), TEC: attributeField(),
      // new fields:
      move: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 10 }),
      forceSensitive: new BooleanField({ initial: false }),
      characterPoints: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      forcePoints: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      darkSidePoints: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      // wound tracking:
      stunMarks:   new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      woundMarks:  new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      incapMarks:  new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
      mortalMarks: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
    };
  }

  prepareDerivedData() {
    for (const key of ["DEX", "KNO", "MEC", "PER", "STR", "TEC"]) {
      const attr = this[key];
      attr.baseValue = Math.floor(3.5 * attr.dice) + attr.pips;
    }
    // hit boxes per tier = STR dice (pips ignored, per rules-reference.md)
    this.hitBoxes = this.STR.dice;
  }
}
```

### Task 3 — CREATE `modules/apps/skill-sheet.mjs`

New ApplicationV2 item sheet for skill items.

```js
const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class SkillSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["starwarsd6", "sheet", "item", "skill"],
    position: { width: 400, height: 300 },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    sheet: { template: "systems/starwarsd6/templates/items/skill-sheet.hbs" }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.document;
    context.system = this.document.system;
    context.ATTRIBUTE_KEYS = ["DEX", "KNO", "MEC", "PER", "STR", "TEC"];
    return context;
  }
}
```

### Task 4 — MODIFY `modules/apps/character-sheet.mjs`

Add `tabGroups`, update `PARTS` to include two tab sections, update `_prepareContext` to build `attributeGroups` and `forceSkills`.

```js
const { HandlebarsApplicationMixin } = foundry.applications.api;

const ATTRIBUTE_KEYS = ["DEX", "KNO", "MEC", "PER", "STR", "TEC"];

export default class CharacterSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["starwarsd6", "sheet", "actor", "character"],
    position: { width: 650, height: 600 },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    sheet: { template: "systems/starwarsd6/templates/actors/character-sheet.hbs" }
  };

  // Instance property — declares default active tab per group
  tabGroups = { primary: "attributes" };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    // Attributes tab data
    context.attributeEntries = ATTRIBUTE_KEYS.map(key => ({
      key,
      label: `STARWARSD6.Attribute.${key}`,
      ...this.document.system[key]   // dice, pips, baseValue
    }));
    // Extra stats
    context.system = this.document.system;
    // Skills tab data — grouped by parent attribute
    context.attributeGroups = ATTRIBUTE_KEYS.map(key => ({
      key,
      label: `STARWARSD6.Attribute.${key}`,
      skills: this.document.items
        .filter(i => i.type === "skill" && !i.system.isForce && i.system.attribute === key)
        .map(skill => ({ id: skill.id, name: skill.name, dicePool: skill.system.dicePool, pips: skill.system.pips, rank: skill.system.rank }))
    }));
    context.forceSkills = this.document.items
      .filter(i => i.type === "skill" && i.system.isForce)
      .map(skill => ({ id: skill.id, name: skill.name, dicePool: skill.system.dicePool, pips: skill.system.pips }));
    return context;
  }
}
```

### Task 5 — MODIFY `templates/actors/character-sheet.hbs`

Replace flat layout with tabbed layout. The template receives `tabs` (from ApplicationV2 via super._prepareContext), `attributeEntries`, `attributeGroups`, `forceSkills`, `system`.

```hbs
<div class="starwarsd6 sheet actor character">
  <header class="sheet-header">
    <input type="text" name="name" value="{{document.name}}" placeholder="Character Name" />
  </header>

  {{!-- Tab navigation --}}
  <nav class="sheet-tabs tabs" data-group="primary">
    <a class="item {{#if (eq tabs.primary 'attributes')}}active{{/if}}"
       data-action="tab" data-tab="attributes" data-group="primary">
      {{localize "STARWARSD6.Tab.Attributes"}}
    </a>
    <a class="item {{#if (eq tabs.primary 'skills')}}active{{/if}}"
       data-action="tab" data-tab="skills" data-group="primary">
      {{localize "STARWARSD6.Tab.Skills"}}
    </a>
  </nav>

  {{!-- ATTRIBUTES TAB --}}
  <section class="tab {{#if (eq tabs.primary 'attributes')}}active{{/if}}"
           data-tab="attributes" data-group="primary">
    <!-- attributes table (existing layout) + new fields -->
  </section>

  {{!-- SKILLS TAB --}}
  <section class="tab {{#if (eq tabs.primary 'skills')}}active{{/if}}"
           data-tab="skills" data-group="primary">
    {{#each attributeGroups as |group|}}
      <h3>{{localize group.label}}</h3>
      {{#if group.skills.length}}
        <table class="skills-table"> ... </table>
      {{else}}
        <p class="no-skills">—</p>
      {{/if}}
    {{/each}}
    {{#if forceSkills.length}}
      <h3>{{localize "STARWARSD6.ForceSkills"}}</h3>
      <table class="skills-table"> ... </table>
    {{/if}}
  </section>
</div>
```

**Note:** Write the full template with all table rows — the pseudocode above shows structure only.

### Task 6 — CREATE `templates/items/skill-sheet.hbs`

Simple form showing skill fields. Show `isForce` checkbox. Conditionally show `forceDice`/`forcePips` when force, or `attribute`/`rank` select when not.

```hbs
<div class="starwarsd6 sheet item skill">
  <header class="sheet-header">
    <input type="text" name="name" value="{{item.name}}" placeholder="Skill Name" />
  </header>
  <section class="sheet-body">
    <div class="form-group">
      <label>{{localize "STARWARSD6.Skill.IsForce"}}</label>
      <input type="checkbox" name="system.isForce" {{#if system.isForce}}checked{{/if}} />
    </div>
    {{#if system.isForce}}
      <!-- Force skill: show forceDice / forcePips -->
    {{else}}
      <!-- Regular skill: show attribute select + rank -->
    {{/if}}
  </section>
</div>
```

### Task 7 — MODIFY `starwarsd6.mjs`

Add SkillSheet import and registration (after CharacterSheet registration block).

```js
import SkillSheet from "./modules/apps/skill-sheet.mjs";

// Inside Hooks.once("init", () => { ... })
// After the CharacterSheet registration:
DocumentSheetConfig.unregisterSheet(Item, "core", foundry.appv1.sheets.ItemSheet);
DocumentSheetConfig.registerSheet(Item, "starwarsd6", SkillSheet, {
  types: ["skill"],
  makeDefault: true,
  label: "STARWARSD6.SheetClass.Skill"
});
```

### Task 8 — MODIFY `lang/en.json`

Add all skill names, Force group label, tab labels, new field labels.

```json
{
  "STARWARSD6.Tab.Attributes": "Attributes",
  "STARWARSD6.Tab.Skills": "Skills",
  "STARWARSD6.ForceSkills": "Force Skills",
  "STARWARSD6.Skill.IsForce": "Force Skill",
  "STARWARSD6.Skill.Attribute": "Attribute",
  "STARWARSD6.Skill.Rank": "Rank",
  "STARWARSD6.Skill.DicePool": "Dice Pool",
  "STARWARSD6.SheetClass.Skill": "Star Wars D6 Skill Sheet",
  "STARWARSD6.Attribute.Move": "Move",
  "STARWARSD6.Character.ForceSensitive": "Force Sensitive",
  "STARWARSD6.Character.CharacterPoints": "Character Points",
  "STARWARSD6.Character.ForcePoints": "Force Points",
  "STARWARSD6.Character.DarkSidePoints": "Dark Side Points",
  "STARWARSD6.Character.HitBoxes": "Hit Boxes",
  "STARWARSD6.Wound.StunMarks": "Stun Marks",
  "STARWARSD6.Wound.WoundMarks": "Wound Marks",
  "STARWARSD6.Wound.IncapMarks": "Incapacitated Marks",
  "STARWARSD6.Wound.MortalMarks": "Mortally Wounded Marks",
  "STARWARSD6.Skill.blaster": "Blaster",
  "STARWARSD6.Skill.brawling parry": "Brawling Parry",
  "STARWARSD6.Skill.dodge": "Dodge",
  "STARWARSD6.Skill.melee combat": "Melee Combat",
  "STARWARSD6.Skill.melee parry": "Melee Parry",
  "STARWARSD6.Skill.alien species": "Alien Species",
  "STARWARSD6.Skill.languages": "Languages",
  "STARWARSD6.Skill.planetary systems": "Planetary Systems",
  "STARWARSD6.Skill.streetwise": "Streetwise",
  "STARWARSD6.Skill.survival": "Survival",
  "STARWARSD6.Skill.astrogation": "Astrogation",
  "STARWARSD6.Skill.beast riding": "Beast Riding",
  "STARWARSD6.Skill.repulsorlift operation": "Repulsorlift Operation",
  "STARWARSD6.Skill.space transports": "Space Transports",
  "STARWARSD6.Skill.starfighter piloting": "Starfighter Piloting",
  "STARWARSD6.Skill.starship gunnery": "Starship Gunnery",
  "STARWARSD6.Skill.bargain": "Bargain",
  "STARWARSD6.Skill.con": "Con",
  "STARWARSD6.Skill.gambling": "Gambling",
  "STARWARSD6.Skill.search": "Search",
  "STARWARSD6.Skill.sneak": "Sneak",
  "STARWARSD6.Skill.brawling": "Brawling",
  "STARWARSD6.Skill.climbing/jumping": "Climbing/Jumping",
  "STARWARSD6.Skill.stamina": "Stamina",
  "STARWARSD6.Skill.computer programming/repair": "Computer Programming/Repair",
  "STARWARSD6.Skill.droid programming": "Droid Programming",
  "STARWARSD6.Skill.droid repair": "Droid Repair",
  "STARWARSD6.Skill.first aid": "First Aid",
  "STARWARSD6.Skill.medicine": "Medicine",
  "STARWARSD6.Skill.space transports repair": "Space Transports Repair",
  "STARWARSD6.Skill.starfighter repair": "Starfighter Repair",
  "STARWARSD6.Skill.control": "Control",
  "STARWARSD6.Skill.sense": "Sense",
  "STARWARSD6.Skill.alter": "Alter"
}
```

### Task 9 — CREATE test infrastructure (`package.json`, `vitest.config.mjs`, `tests/setup.mjs`, `tests/mocks/foundry.mjs`)

**`package.json`** (root, new file — only dev dependencies needed for testing; no build):

```json
{
  "name": "starwarsd6",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

**`vitest.config.mjs`**:

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.mjs"],
    include: ["tests/unit/**/*.test.mjs"]
  }
});
```

**`tests/mocks/foundry.mjs`** — minimal stubs for Foundry globals needed by DataModels:

```js
// Stub field classes — they only need to be constructable; we don't test defineSchema()
class FieldStub {
  constructor(options = {}) { Object.assign(this, options); }
}

export const foundryMock = {
  data: {
    fields: {
      NumberField: FieldStub,
      StringField: FieldStub,
      BooleanField: FieldStub,
      SchemaField: FieldStub
    }
  },
  abstract: {
    // TypeDataModel must be a real class so DataModel subclasses can extend it.
    // prepareDerivedData() is intentionally a no-op here — subclasses override it.
    TypeDataModel: class TypeDataModel {
      prepareDerivedData() {}
    }
  }
};
```

**`tests/setup.mjs`** — loaded by Vitest before any test file:

```js
import { foundryMock } from "./mocks/foundry.mjs";

// Install Foundry globals on globalThis BEFORE any module import resolves them.
// This must run first — setupFiles executes before test file imports.
globalThis.foundry = foundryMock;
```

### Task 10 — CREATE `tests/unit/character-data.test.mjs`

Tests for `CharacterData.prepareDerivedData()` — pure arithmetic, no Foundry runtime needed.

```js
import { describe, it, expect, beforeEach } from "vitest";
import CharacterData from "../../modules/actors/character-data.mjs";

// Build a minimal instance without going through DataModel construction.
// We only need the fields that prepareDerivedData() reads and writes.
function makeCharacterData(overrides = {}) {
  const instance = Object.create(CharacterData.prototype);
  // Default attribute values (matches DataModel initial values)
  instance.DEX = { dice: 2, pips: 0 };
  instance.KNO = { dice: 2, pips: 0 };
  instance.MEC = { dice: 2, pips: 0 };
  instance.PER = { dice: 2, pips: 0 };
  instance.STR = { dice: 2, pips: 0 };
  instance.TEC = { dice: 2, pips: 0 };
  // Apply overrides
  Object.assign(instance, overrides);
  return instance;
}

describe("CharacterData.prepareDerivedData()", () => {
  describe("baseValue derivation", () => {
    it("computes baseValue = floor(3.5 * dice) + pips for whole-die attribute", () => {
      const data = makeCharacterData({ DEX: { dice: 3, pips: 0 } });
      data.prepareDerivedData();
      expect(data.DEX.baseValue).toBe(10); // floor(3.5*3)+0 = 10
    });

    it("adds pips to baseValue", () => {
      const data = makeCharacterData({ DEX: { dice: 3, pips: 2 } });
      data.prepareDerivedData();
      expect(data.DEX.baseValue).toBe(12); // floor(3.5*3)+2 = 12
    });

    it("floors fractional result: 1D = floor(3.5) = 3", () => {
      const data = makeCharacterData({ KNO: { dice: 1, pips: 0 } });
      data.prepareDerivedData();
      expect(data.KNO.baseValue).toBe(3);
    });

    it("floors fractional result: 2D = floor(7.0) = 7", () => {
      const data = makeCharacterData({ KNO: { dice: 2, pips: 0 } });
      data.prepareDerivedData();
      expect(data.KNO.baseValue).toBe(7);
    });

    it("computes baseValue for all six attributes independently", () => {
      const data = makeCharacterData({
        DEX: { dice: 3, pips: 1 },
        STR: { dice: 4, pips: 2 }
      });
      data.prepareDerivedData();
      expect(data.DEX.baseValue).toBe(11); // floor(10.5)+1 = 11
      expect(data.STR.baseValue).toBe(16); // floor(14.0)+2 = 16
    });
  });

  describe("hitBoxes derivation", () => {
    it("derives hitBoxes = STR.dice (pips ignored)", () => {
      const data = makeCharacterData({ STR: { dice: 3, pips: 2 } });
      data.prepareDerivedData();
      expect(data.hitBoxes).toBe(3);
    });

    it("hitBoxes = 1 at minimum STR 1D", () => {
      const data = makeCharacterData({ STR: { dice: 1, pips: 0 } });
      data.prepareDerivedData();
      expect(data.hitBoxes).toBe(1);
    });

    it("hitBoxes matches STR dice regardless of pips", () => {
      const data = makeCharacterData({ STR: { dice: 5, pips: 1 } });
      data.prepareDerivedData();
      expect(data.hitBoxes).toBe(5);
    });
  });
});
```

### Task 11 — CREATE `tests/unit/skill-data.test.mjs`

Tests for `SkillData.prepareDerivedData()` — covers regular skill derivation and Force skill branch.

```js
import { describe, it, expect } from "vitest";
import SkillData from "../../modules/items/skill-data.mjs";

// Build a minimal SkillData instance for testing prepareDerivedData().
// Sets up `this.parent.actor.system` to simulate an embedded skill on a character.
function makeSkillData({ attribute = "DEX", rank = 0, isForce = false,
                         forceDice = 1, forcePips = 0,
                         actorSystem = null } = {}) {
  const instance = Object.create(SkillData.prototype);
  instance.attribute = attribute;
  instance.rank = rank;
  instance.isForce = isForce;
  instance.forceDice = forceDice;
  instance.forcePips = forcePips;
  // Default actor system with all attributes at 2D+0
  const defaultSystem = {
    DEX: { dice: 2, pips: 0 },
    KNO: { dice: 2, pips: 0 },
    MEC: { dice: 2, pips: 0 },
    PER: { dice: 2, pips: 0 },
    STR: { dice: 2, pips: 0 },
    TEC: { dice: 2, pips: 0 }
  };
  instance.parent = {
    actor: { system: actorSystem ?? defaultSystem }
  };
  return instance;
}

describe("SkillData.prepareDerivedData()", () => {
  describe("regular skill (isForce = false)", () => {
    it("dicePool = parentAttr.dice + rank when rank is 0", () => {
      const skill = makeSkillData({ attribute: "DEX", rank: 0 });
      skill.prepareDerivedData();
      expect(skill.dicePool).toBe(2); // 2+0
    });

    it("dicePool = parentAttr.dice + rank when rank > 0", () => {
      const skill = makeSkillData({ attribute: "DEX", rank: 2 });
      skill.prepareDerivedData();
      expect(skill.dicePool).toBe(4); // 2+2
    });

    it("inherits pips from parent attribute", () => {
      const skill = makeSkillData({
        attribute: "STR",
        rank: 1,
        actorSystem: { STR: { dice: 3, pips: 2 } }
      });
      skill.prepareDerivedData();
      expect(skill.pips).toBe(2);
    });

    it("uses the correct parent attribute (KNO, not DEX)", () => {
      const skill = makeSkillData({
        attribute: "KNO",
        rank: 1,
        actorSystem: {
          DEX: { dice: 2, pips: 0 },
          KNO: { dice: 4, pips: 1 }
        }
      });
      skill.prepareDerivedData();
      expect(skill.dicePool).toBe(5); // 4+1
      expect(skill.pips).toBe(1);
    });

    it("does not set dicePool when parent actor is missing", () => {
      const skill = makeSkillData({ attribute: "DEX", rank: 1 });
      skill.parent = null;
      skill.prepareDerivedData();
      expect(skill.dicePool).toBeUndefined();
    });

    it("does not set dicePool when parent attribute key is not in actor system", () => {
      const skill = makeSkillData({
        attribute: "INVALID",
        rank: 1,
        actorSystem: { DEX: { dice: 2, pips: 0 } }
      });
      skill.prepareDerivedData();
      expect(skill.dicePool).toBeUndefined();
    });
  });

  describe("Force skill (isForce = true)", () => {
    it("dicePool = forceDice (ignores parent attribute)", () => {
      const skill = makeSkillData({
        isForce: true,
        forceDice: 2,
        forcePips: 0,
        // Even with a valid actor, Force skills must NOT look up a parent attribute
        actorSystem: { DEX: { dice: 5, pips: 2 } }
      });
      skill.prepareDerivedData();
      expect(skill.dicePool).toBe(2);
    });

    it("pips = forcePips", () => {
      const skill = makeSkillData({ isForce: true, forceDice: 3, forcePips: 1 });
      skill.prepareDerivedData();
      expect(skill.pips).toBe(1);
    });

    it("Force skill with no parent actor still derives correctly", () => {
      const skill = makeSkillData({ isForce: true, forceDice: 1, forcePips: 2 });
      skill.parent = null;
      skill.prepareDerivedData();
      expect(skill.dicePool).toBe(1);
      expect(skill.pips).toBe(2);
    });

    it("Force skill rank is irrelevant — dicePool does not include it", () => {
      const skill = makeSkillData({ isForce: true, forceDice: 2, forcePips: 0, rank: 99 });
      skill.prepareDerivedData();
      expect(skill.dicePool).toBe(2); // rank=99 must NOT be added
    });
  });
});
```

### Task 12 — MODIFY `styles/starwarsd6.css`

Add tab navigation styles.

```css
/* Tab navigation */
.starwarsd6.sheet .sheet-tabs {
  display: flex;
  border-bottom: 2px solid #2a2a2a;
  margin-bottom: 0.5em;
}
.starwarsd6.sheet .sheet-tabs .item {
  padding: 4px 12px;
  cursor: pointer;
  border: 1px solid transparent;
  border-bottom: none;
  color: #555;
  text-decoration: none;
}
.starwarsd6.sheet .sheet-tabs .item.active {
  background: #fff;
  border-color: #2a2a2a;
  color: #000;
  font-weight: bold;
}
/* Tab content panels */
.starwarsd6.sheet .tab {
  display: none;
}
.starwarsd6.sheet .tab.active {
  display: block;
}
```

### Task 13 — UPDATE `doc/implementation-plan.md`

Two changes only — do not rewrite the whole file:

1. **Update the current-state line** (line 4) from:
   ```
   **Current state:** feat001 scaffold complete; feat002 (mixin bug) is the only open bug
   ```
   to:
   ```
   **Current state:** feat001 scaffold complete; feat002 (mixin bug) resolved; feat003 (skill sheet & data expansion) complete
   ```

2. **Update the Phase Overview table** — change the Phase 1 row from no status marker to `✓`:

   Find the row:
   ```
   | 1 | Skill Sheet & Data Expansion | All 38 skills editable, full attribute/skill data | M | 0 |
   ```
   Replace with:
   ```
   | 1 ✓ | Skill Sheet & Data Expansion | All 38 skills editable, full attribute/skill data | M | 0 |
   ```

No other changes. Do not alter phase descriptions, dependency graph, or any other section.

---

## Validation Loop

### Level 1 — Static File Checks

```bash
# Verify no ES import of Foundry globals
grep -rn "^import.*foundry\|^import.*HandlebarsApplicationMixin\|^import.*BooleanField" \
  modules/apps/skill-sheet.mjs modules/items/skill-data.mjs modules/actors/character-data.mjs \
  && echo "ERROR: Foundry global imported" || echo "OK: no forbidden imports"

# Verify BooleanField destructured from foundry.data.fields (not imported)
grep -n "BooleanField" modules/items/skill-data.mjs modules/actors/character-data.mjs

# Verify isForce field present in skill-data.mjs
grep -n "isForce" modules/items/skill-data.mjs && echo "OK" || echo "ERROR: isForce missing"

# Verify all new CharacterData fields present
for field in move forceSensitive characterPoints forcePoints darkSidePoints \
             stunMarks woundMarks incapMarks mortalMarks hitBoxes; do
  grep -n "$field" modules/actors/character-data.mjs \
    && echo "OK: $field" || echo "ERROR: $field missing"
done

# Verify SkillSheet file exists and has correct structure
grep -n "class SkillSheet\|ItemSheetV2\|PARTS\|_prepareContext" modules/apps/skill-sheet.mjs

# Verify template paths use the full system prefix
grep -n "systems/starwarsd6/templates" modules/apps/skill-sheet.mjs modules/apps/character-sheet.mjs

# Verify SkillSheet registered in entry point
grep -n "SkillSheet\|skill-sheet" starwarsd6.mjs && echo "OK" || echo "ERROR: SkillSheet not registered"

# Verify lang/en.json has tab labels and Force labels
grep -n "Tab.Attributes\|Tab.Skills\|ForceSkills\|SheetClass.Skill" lang/en.json

# Verify both template files exist
ls templates/actors/character-sheet.hbs templates/items/skill-sheet.hbs \
  && echo "OK: templates exist" || echo "ERROR: template missing"

# Verify tabGroups declared as instance property on CharacterSheet
grep -n "tabGroups" modules/apps/character-sheet.mjs && echo "OK" || echo "ERROR: tabGroups missing"

# Verify no deprecated APIs
grep -rn "getData\|mergeObject\|duplicate\|Actors\.registerSheet\|Items\.registerSheet" \
  modules/apps/character-sheet.mjs modules/apps/skill-sheet.mjs \
  && echo "ERROR: deprecated API found" || echo "OK: no deprecated APIs"

# Verify test infrastructure files exist
ls package.json vitest.config.mjs tests/setup.mjs \
   tests/mocks/foundry.mjs \
   tests/unit/character-data.test.mjs \
   tests/unit/skill-data.test.mjs \
  && echo "OK: test files exist" || echo "ERROR: test file missing"

# Verify tests/ excluded from deploy
grep "tests" deploy.sh && echo "OK: tests excluded from deploy" || echo "WARNING: check deploy.sh excludes"

# Verify implementation-plan.md updated
grep "feat003" doc/implementation-plan.md && echo "OK: plan updated" || echo "ERROR: plan not updated"
```

### Level 1.5 — Run Unit Tests

Install dependencies and run the test suite. Fix any failures before proceeding to deploy.

```bash
# Install vitest (first time only)
npm install

# Run all unit tests — must exit 0 with all tests passing
npm test
```

Expected output pattern:
```
 ✓ tests/unit/character-data.test.mjs (8 tests)
 ✓ tests/unit/skill-data.test.mjs (10 tests)

 Test Files  2 passed (2)
 Tests      18 passed (18)
```

**If a test fails:** read the assertion error, fix the logic in the DataModel (not the test), re-run.  
**Do not** mock `prepareDerivedData()` itself — the whole point is testing that function.  
**Do not** alter test expectations to match broken logic — fix the source.

### Level 2 — Deploy and Functional Validation (Manual, in Foundry)

```bash
./deploy.sh
```

Then in Foundry:

1. **No init errors**: Open the starwarsd6 world → browser console must be clean
2. **Character sheet — Attributes tab**:
   - Open any character actor → sheet opens on Attributes tab by default
   - All 6 attributes render with dice/pips inputs and baseValue
   - New fields visible: Move, Force Sensitive, CP, FP, DSP, wound mark fields
3. **Character sheet — Skills tab**:
   - Click "Skills" tab → switches without page reload
   - Skills grouped under DEX / KNO / MEC / PER / STR / TEC headings
   - Force skills appear in a separate Force Skills group
   - A "blaster" skill (attribute=DEX, rank=1) on a 3D DEX actor shows dicePool=4
4. **Skill sheet**:
   - Double-click a skill item → `SkillSheet` opens (not the default core item sheet)
   - Regular skill: attribute dropdown and rank number field are visible
   - Tick "Force Skill" → `forceDice`/`forcePips` fields appear; attribute/rank hidden
   - Edit rank → close → reopen → value persists (submitOnChange working)
5. **Force skill derivation**:
   - Create a skill with isForce=true, forceDice=2, forcePips=1
   - On the character sheet Skills tab → Force group shows dicePool=2, pips=1
   - DEX attribute value is irrelevant to this result

### Final Validation Checklist

- [ ] `grep "isForce\|forceDice\|forcePips" modules/items/skill-data.mjs` — all 3 present
- [ ] `grep "hitBoxes\|mortalMarks\|woundMarks\|stunMarks\|incapMarks" modules/actors/character-data.mjs` — all present
- [ ] `ls modules/apps/skill-sheet.mjs` — file exists
- [ ] `ls templates/items/skill-sheet.hbs` — file exists
- [ ] `grep "tabGroups" modules/apps/character-sheet.mjs` — present
- [ ] `grep "SkillSheet" starwarsd6.mjs` — import and registerSheet both present
- [ ] `grep "STARWARSD6.Tab" lang/en.json` — tab labels present
- [ ] `ls tests/unit/character-data.test.mjs tests/unit/skill-data.test.mjs` — both exist
- [ ] `npm test` exits 0, all 18 tests pass
- [ ] `grep "feat003" doc/implementation-plan.md` — plan updated
- [ ] `./deploy.sh` exits 0
- [ ] Character sheet opens, Attributes tab active by default
- [ ] Clicking Skills tab switches content without reload
- [ ] Skill items appear grouped by attribute on Skills tab
- [ ] Double-clicking a skill opens SkillSheet (not core item sheet)
- [ ] Force skill checkbox toggles fields; dicePool derives independently of parent attribute

---

## Anti-Patterns to Avoid

- **Do not** `import { BooleanField }` — destructure from `foundry.data.fields` at module top level
- **Do not** `import { HandlebarsApplicationMixin }` — destructure from `foundry.applications.api`
- **Do not** call `Actors.registerSheet` or `Items.registerSheet` (deprecated) — use `DocumentSheetConfig.registerSheet`
- **Do not** use `getData()` — use `_prepareContext(options)` returning a plain object
- **Do not** use `mergeObject` or `duplicate` — use spread or `foundry.utils.deepClone`
- **Do not** assign to `actor.system.foo = x` directly — use `actor.update({ "system.foo": x })`
- **Do not** add multiple PARTS with `container` IDs — keep the simpler single-part + CSS tab approach
- **Do not** skip the `foundry.appv1.sheets.ItemSheet` unregister call before registering SkillSheet
- **Do not** write tests that mock `prepareDerivedData()` — it is the function under test
- **Do not** alter test expectations to paper over logic bugs — fix the source, not the test
- **Do not** add a `"type": "module"` field to `package.json` if it causes import resolution issues with vitest; use the `vitest.config.mjs` `environment: "node"` setting instead to control module loading
- **Do not** test Handlebars templates with Vitest — template rendering requires a live Foundry instance; only test pure JS logic

---

## Confidence Score: 8/10

Deductions:
- **-1**: Tab activation in ApplicationV2 with a single-PARTS sheet relies on CSS `display:none/block` plus Foundry's built-in `data-action="tab"` handler — this should work but wasn't directly verified in the reference code (dnd5e uses multi-PARTS with container.id). If tabs don't switch, fallback: add a `changeTab(tab, group, options)` override that manually toggles `.active` class on `[data-tab]` elements.
- **-1**: The `foundry.appv1.sheets.ItemSheet` unregister call for items needs verification — the actor equivalent (`foundry.appv1.sheets.ActorSheet`) is confirmed in the existing `starwarsd6.mjs`; the item path should match but is not yet exercised.

The test infrastructure confidence is high: the mock pattern is directly adapted from `ref/FoundryVTT-Nimble/tests/mocks/foundry.ts` (a working, proven setup), and the tests cover only pure `prepareDerivedData()` arithmetic — no Foundry API surface beyond the base class stub.
