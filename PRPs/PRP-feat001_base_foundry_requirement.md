# PRP-feat001 — Base Foundry System Scaffold

## Goal

Deliver a minimal but complete, installable `starwarsd6` FoundryVTT v13 system that:
- Loads without console errors
- Lets a GM create a `character` actor with all six attributes (DEX, KNO, MEC, PER, STR, TEC)
- Lets a GM create a `skill` item with `attribute` and `rank` fields
- Opens a functional character actor sheet using ApplicationV2

## Why

- Foundation for all subsequent feat PRPs — nothing else can be built without this scaffold
- Establishes the mandatory v13 patterns (ApplicationV2, DataModels, ESM) that all future code must follow
- Proves the system installs and deploys correctly to the Foundry server

## What

10 files, greenfield creation — `modules/` directory does not exist yet.

### Success Criteria

- [ ] System appears in Foundry's system list and installs without errors
- [ ] `character` actor can be created; console shows no errors; all 6 attributes present with defaults (`dice: 2, pips: 0`)
- [ ] `skill` item can be created; `attribute` and `rank` fields are present
- [ ] Opening the character sheet renders all 6 attributes without console errors
- [ ] Assigning a skill item to a character resolves `dicePool` correctly (`parentAttribute.dice + rank`)
- [ ] `prepareDerivedData()` sets `baseValue = Math.floor(3.5 * dice) + pips` on each attribute

---

## All Needed Context

### Documentation & References

```yaml
- url: https://foundryvtt.com/article/module-development/
  why: Official v13 system dev guide — manifest structure, DataModels, init hook, sheet registration

- url: https://foundryvtt.com/api/v13/modules.html
  why: v13 API surface — foundry.data.fields.*, foundry.applications.sheets.ActorSheetV2

- file: ref/dnd5e/system.json
  why: Exact manifest format — documentTypes replaces template.json in v13; note esmodules, styles, languages fields

- file: ref/dnd5e/dnd5e.mjs
  why: Entry point pattern — Hooks.once("init"), CONFIG.Actor.dataModels assignment, DocumentSheetConfig.registerSheet call (lines 57–160)

- file: ref/dnd5e/module/data/actor/character.mjs
  why: DataModel pattern — static defineSchema() with foundry.data.fields.*, prepareDerivedData() structure

- file: ref/dnd5e/module/data/item/tool.mjs
  why: Item DataModel pattern — simple defineSchema() with NumberField and StringField

- file: ref/dnd5e/module/applications/actor/character-sheet.mjs
  why: ApplicationV2 sheet pattern — static DEFAULT_OPTIONS, static PARTS, _prepareContext(), _preparePartContext()

- file: ref/dnd5e/module/applications/actor/api/base-actor-sheet.mjs
  why: BaseActorSheet — extends foundry.applications.sheets.ActorSheetV2; form.submitOnChange pattern; DEFAULT_OPTIONS structure
```

### Current Codebase Tree

```
fvtt-starwarsd6/
├── system.json              ← DOES NOT EXIST YET
├── starwarsd6.mjs           ← DOES NOT EXIST YET
├── modules/                 ← DOES NOT EXIST YET
├── templates/               ← DOES NOT EXIST YET
├── styles/                  ← DOES NOT EXIST YET
├── lang/                    ← DOES NOT EXIST YET
├── doc/
│   └── rules-reference.md
├── ref/
│   ├── dnd5e/               ← PRIMARY reference
│   ├── FoundryVTT-Nimble/   ← secondary reference
│   └── StarWarsFFG/         ← DO NOT use as architecture reference
├── PRPs/
│   └── feats/feat001_base_foundry_requirement.md
├── CLAUDE.md
└── deploy.sh
```

### Desired Codebase Tree

```
fvtt-starwarsd6/
├── system.json
├── starwarsd6.mjs
├── modules/
│   ├── actors/
│   │   ├── character-data.mjs   # CharacterData DataModel
│   │   └── character.mjs        # CharacterActor document class
│   ├── items/
│   │   ├── skill-data.mjs       # SkillData DataModel
│   │   └── skill.mjs            # SkillItem document class
│   └── apps/
│       └── character-sheet.mjs  # CharacterSheet ApplicationV2
├── templates/
│   └── actors/
│       └── character-sheet.hbs  # Handlebars template
├── styles/
│   └── starwarsd6.css           # Minimal stylesheet
└── lang/
    └── en.json                  # English localization
```

### Known Gotchas & Critical Constraints

```js
// CRITICAL: No template.json in v13 — DataModels replace it entirely.
// Document types must be declared in system.json under "documentTypes".
// Without this, Foundry v13 will not recognize custom actor/item types.

// CRITICAL: Sheet registration uses DocumentSheetConfig, NOT Actors.registerSheet.
// Pattern from ref/dnd5e/dnd5e.mjs lines 151-157:
//   const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;
//   DocumentSheetConfig.unregisterSheet(Actor, "core", foundry.appv1.sheets.ActorSheet);
//   DocumentSheetConfig.registerSheet(Actor, "starwarsd6", CharacterSheet, {
//     types: ["character"], makeDefault: true, label: "STARWARSD6.SheetClass.Character"
//   });

// CRITICAL: ApplicationV2 sheets do NOT use getData(). Use _prepareContext() instead.
// _prepareContext() must return a plain object; super._prepareContext(options) provides
// actor, system, items, effects, etc.

// CRITICAL: DataModel fields use foundry.data.fields.*, destructured locally:
//   const { NumberField, SchemaField, StringField } = foundry.data.fields;
// These are Foundry globals — never import them.

// CRITICAL: game, CONFIG, Hooks, Roll, Actor, Item are globals — never import them.

// CRITICAL: Attribute storage is { dice: Number, pips: Number } — NOT a die string.
// pips must be constrained to 0, 1, or 2 via NumberField({ min: 0, max: 2, integer: true }).

// CRITICAL: SkillData.prepareDerivedData() needs the parent actor's attribute data.
// Access via: this.parent.actor?.system?.attributes?.[this.attribute]
// (this.parent is the Item document; this.parent.actor is the owning Actor)

// CRITICAL: ApplicationV2 form submission requires form.submitOnChange: true in DEFAULT_OPTIONS
// so attribute edits persist without a submit button.

// GOTCHA: system.json "esmodules" must list the entry point as "starwarsd6.mjs" (no leading slash).
// "styles" must list "styles/starwarsd6.css".
// "languages" must list { lang: "en", name: "English", path: "lang/en.json" }.

// GOTCHA: Handlebars template path in PARTS must be the full Foundry-relative path:
//   "systems/starwarsd6/templates/actors/character-sheet.hbs"

// GOTCHA: DEFAULT_OPTIONS uses static class field merging — subclass fields merge with parent.
// The base ActorSheetV2 provides window.resizable and form defaults; you add classes and position.

// GOTCHA: CharacterActor document class should extend Actor — only override if system-specific
// document behavior is needed. Minimal implementation is fine for this milestone.

// GOTCHA: Do NOT use mergeObject, duplicate, or foundry.utils.mergeObject for data model merging.
// Use actor.update() / item.update() for mutations.
```

---

## Implementation Blueprint

### Data Models

**CharacterData** (`modules/actors/character-data.mjs`):
```js
// Each attribute stored as SchemaField with two NumberFields
// Six attributes: DEX, KNO, MEC, PER, STR, TEC
// prepareDerivedData() computes baseValue = Math.floor(3.5 * dice) + pips

const { NumberField, SchemaField } = foundry.data.fields;

function attributeField() {
  return new SchemaField({
    dice: new NumberField({ required: true, nullable: false, integer: true, min: 1, initial: 2 }),
    pips: new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 0 })
  });
}

export default class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      DEX: attributeField(),
      KNO: attributeField(),
      MEC: attributeField(),
      PER: attributeField(),
      STR: attributeField(),
      TEC: attributeField()
    };
  }

  prepareDerivedData() {
    for (const key of ["DEX", "KNO", "MEC", "PER", "STR", "TEC"]) {
      const attr = this[key];
      attr.baseValue = Math.floor(3.5 * attr.dice) + attr.pips;
    }
  }
}
```

**SkillData** (`modules/items/skill-data.mjs`):
```js
// attribute: one of the 6 attribute keys (string)
// rank: integer >= 0 (die offset from parent attribute)
// prepareDerivedData(): resolve dicePool and pips from owning actor

const { NumberField, StringField } = foundry.data.fields;

export default class SkillData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      attribute: new StringField({ required: true, initial: "DEX", blank: false }),
      rank: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
    };
  }

  prepareDerivedData() {
    const actor = this.parent?.actor;
    if (!actor) return;
    const parentAttr = actor.system?.attributes?.[this.attribute];
    if (!parentAttr) return;
    this.dicePool = parentAttr.dice + this.rank;
    this.pips = parentAttr.pips;
  }
}
```

### Tasks

```yaml
Task 1 — CREATE system.json:
  - Mirror structure from ref/dnd5e/system.json
  - id: "starwarsd6"
  - title: "Star Wars D6"
  - compatibility: { minimum: "13", verified: "13" }
  - esmodules: ["starwarsd6.mjs"]
  - styles: ["styles/starwarsd6.css"]
  - languages: [{ lang: "en", name: "English", path: "lang/en.json" }]
  - documentTypes:
      Actor: { character: {} }
      Item: { skill: {} }
  - NO packs, NO socket, NO primaryTokenAttribute (out of scope)

Task 2 — CREATE modules/actors/character-data.mjs:
  - Implement CharacterData as shown in Data Models section above
  - Export default CharacterData
  - No imports (foundry.data.fields is a global)

Task 3 — CREATE modules/actors/character.mjs:
  - CharacterActor extends Actor (minimal — no overrides needed for this milestone)
  - Export default CharacterActor

Task 4 — CREATE modules/items/skill-data.mjs:
  - Implement SkillData as shown in Data Models section above
  - Export default SkillData

Task 5 — CREATE modules/items/skill.mjs:
  - SkillItem extends Item (minimal — no overrides needed for this milestone)
  - Export default SkillItem

Task 6 — CREATE modules/apps/character-sheet.mjs:
  - CharacterSheet extends foundry.applications.sheets.ActorSheetV2
  - static DEFAULT_OPTIONS = {
      classes: ["starwarsd6", "sheet", "actor", "character"],
      position: { width: 600, height: 500 },
      form: { submitOnChange: true, closeOnSubmit: false }
    }
  - static PARTS = {
      sheet: { template: "systems/starwarsd6/templates/actors/character-sheet.hbs" }
    }
  - async _prepareContext(options):
      const context = await super._prepareContext(options);
      context.attributes = this.document.system.attributes;  // DEX, KNO, ...
      context.skills = this.document.items.filter(i => i.type === "skill");
      context.ATTRIBUTE_KEYS = ["DEX", "KNO", "MEC", "PER", "STR", "TEC"];
      return context;
  - Export default CharacterSheet

Task 7 — CREATE templates/actors/character-sheet.hbs:
  - Render actor name (editable input)
  - Table of 6 attributes: label, dice input, pips input, baseValue (read-only)
  - List of owned skill items: name, attribute, rank, dicePool
  - Use Foundry field name convention: name="system.DEX.dice", name="system.DEX.pips"

Task 8 — CREATE styles/starwarsd6.css:
  - Minimal: scope all rules under .starwarsd6.sheet
  - Style the attributes table (grid or table layout)
  - No external fonts or imports

Task 9 — CREATE lang/en.json:
  - Keys for sheet class label: "STARWARSD6.SheetClass.Character"
  - Keys for attribute labels: "STARWARSD6.Attribute.DEX", ..., "STARWARSD6.Attribute.TEC"
  - Keys for field labels referenced in DataModel (if any)

Task 10 — CREATE starwarsd6.mjs:
  - Import CharacterData, CharacterActor, SkillData, SkillItem, CharacterSheet
  - Hooks.once("init", () => {
      CONFIG.Actor.documentClass = CharacterActor;
      CONFIG.Actor.dataModels = { character: CharacterData };
      CONFIG.Item.documentClass = SkillItem;
      CONFIG.Item.dataModels = { skill: SkillData };

      const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;
      DocumentSheetConfig.unregisterSheet(Actor, "core", foundry.appv1.sheets.ActorSheet);
      DocumentSheetConfig.registerSheet(Actor, "starwarsd6", CharacterSheet, {
        types: ["character"],
        makeDefault: true,
        label: "STARWARSD6.SheetClass.Character"
      });
    });
  - No other hooks needed for this milestone
```

### Integration Points

```yaml
FOUNDRY GLOBALS (never import these):
  - game, CONFIG, Hooks, Roll, Actor, Item
  - foundry.abstract.TypeDataModel
  - foundry.applications.sheets.ActorSheetV2
  - foundry.applications.apps.DocumentSheetConfig
  - foundry.appv1.sheets.ActorSheet
  - foundry.data.fields.*

DEPLOY:
  - After implementation: ./deploy.sh to rsync to vehrka Foundry server
  - ./deploy.sh --dry-run to preview before deploying

SYSTEM FOLDER:
  - Must live at: vehrka:share/foundrydata_13/Data/systems/starwarsd6/
  - Folder name "starwarsd6" must match system.json "id" exactly
```

---

## Validation Loop

### Level 1 — File Completeness Check

```bash
# Verify all 10 files exist
ls system.json starwarsd6.mjs \
   modules/actors/character-data.mjs modules/actors/character.mjs \
   modules/items/skill-data.mjs modules/items/skill.mjs \
   modules/apps/character-sheet.mjs \
   templates/actors/character-sheet.hbs \
   styles/starwarsd6.css lang/en.json

# Expected: all files listed, no "No such file" errors
```

### Level 2 — Static Syntax Check

```bash
# Check ESM syntax — no require(), no CommonJS
grep -rn "require(" modules/ starwarsd6.mjs && echo "ERROR: CommonJS require found" || echo "OK: no require()"

# Check no forbidden globals are imported
grep -rn "^import.*\b\(game\|CONFIG\|Hooks\|Roll\|Actor\|Item\)\b" modules/ starwarsd6.mjs \
  && echo "ERROR: forbidden global imported" || echo "OK: no forbidden imports"

# Check no deprecated APIs
grep -rn "mergeObject\|duplicate\|getData()" modules/ \
  && echo "ERROR: deprecated API found" || echo "OK: no deprecated APIs"

# Check no getData() in sheets
grep -n "getData(" modules/apps/character-sheet.mjs \
  && echo "ERROR: getData() in sheet — use _prepareContext()" || echo "OK"

# Check system.json validity
python3 -c "import json; json.load(open('system.json')); print('OK: system.json valid JSON')"

# Check lang/en.json validity  
python3 -c "import json; json.load(open('lang/en.json')); print('OK: en.json valid JSON')"
```

### Level 3 — Functional Validation (Manual, in Foundry)

After `./deploy.sh`:

1. **System loads**: Open Foundry, select starwarsd6 world → no red console errors on init
2. **Actor creation**: Actors sidebar → Create Actor → type "character" → no console errors
   - Open actor in console: `game.actors.getName("Test").system` must show `{ DEX: {dice:2, pips:0, baseValue:7}, ... }`
3. **Item creation**: Items sidebar → Create Item → type "skill" → no console errors
   - `game.items.getName("Test Skill").system` must show `{ attribute: "DEX", rank: 0 }`
4. **Sheet renders**: Double-click character actor → sheet opens, shows all 6 attributes
5. **Skill dicePool**: Drag skill item onto character → open character → check console:
   - `actor.items.getName("Test Skill").system.dicePool` should equal `actor.system.DEX.dice + skill.rank`

### Final Validation Checklist

- [ ] `system.json` has `documentTypes.Actor.character` and `documentTypes.Item.skill`
- [ ] No `template.json` exists (DataModels replace it)
- [ ] Sheet extends `foundry.applications.sheets.ActorSheetV2`, not `Application` or `FormApplication`
- [ ] Sheet uses `_prepareContext()`, not `getData()`
- [ ] `DocumentSheetConfig.registerSheet` used, not `Actors.registerSheet`
- [ ] All `foundry.*` namespaces used as globals (not imported)
- [ ] `prepareDerivedData()` on CharacterData computes `baseValue` for all 6 attributes
- [ ] `prepareDerivedData()` on SkillData reads from `this.parent.actor` (null-safe)
- [ ] Handlebars template path in PARTS uses `systems/starwarsd6/...`
- [ ] CSS rules scoped to `.starwarsd6.sheet`
- [ ] `lang/en.json` is valid JSON with sheet class key
- [ ] `deploy.sh` runs without errors

---

## Anti-Patterns to Avoid

- **No `template.json`** — v13 uses DataModels registered via `CONFIG.Actor.dataModels`
- **No `Actors.registerSheet()`** — use `DocumentSheetConfig.registerSheet()`
- **No `getData()`** in sheets — use `_prepareContext(options)`
- **No `mergeObject` / `duplicate`** — use `actor.update()` for mutations
- **No CommonJS** — ESM only; all files must be `.mjs`
- **No TypeScript** — plain JavaScript, no build step
- **No direct property assignment** for persistence — `actor.update({ "system.DEX.dice": 3 })`, not `actor.system.DEX.dice = 3`
- **No imports of Foundry globals** — `game`, `CONFIG`, `Hooks`, `Actor`, `Item`, `foundry.*` are all globals

---

## Confidence Score: 9/10

High confidence for one-pass implementation. All patterns are directly observable in `ref/dnd5e/`. The only risk area is `SkillData.prepareDerivedData()` — accessing `this.parent.actor` may not be available during all data preparation phases (e.g., when item is not embedded). The null-safe guard `if (!actor) return` handles this correctly, but the agent should verify by testing with an unowned skill item.
