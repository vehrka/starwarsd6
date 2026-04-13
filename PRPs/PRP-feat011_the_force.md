# PRP-feat011 — Force System (Phase 7)

## Goal

Implement the Force system for Force-sensitive characters:

1. **Force skill fields** (`control`, `sense`, `alter`) stored directly on `CharacterData` (dice + pips per skill), independent of any attribute.
2. **DSP bonus**: `calculateForceDiceBonus(dsp)` computes a bonus die code from `darkSidePoints`. Exposed via `forceRollBonus` in `prepareDerivedData()`.
3. **Keep-up tracking**: `keptUpPowers` (array of power name strings) on `CharacterData`. Its length contributes to the multiple-action penalty for **all** rolls (not just Force rolls).
4. **Force tab** on character sheet (visible only when `forceSensitive === true`): editable Force skill die codes, DSP counter, kept-up powers list (add/remove), "Add DSP" button.
5. **Force rolls**: dedicated `rollForceSkill` action that applies DSP bonus, wound penalties, keep-up penalty, and the Force difficulty modifier.
6. **Force difficulty modifier** field in `RollDialog` (shown only for Force rolls): +0 to +30 for relationship/proximity (see rules reference).
7. **Dark side conversion check**: "Add DSP" button calls `applyDarkSidePoint(actor)` — increments DSP, then rolls 1d6; if result < new DSP total, posts a "Character consumed by dark side" warning to chat.

End state: A Force-sensitive character can roll control/sense/alter with DSP bonus applied, track kept-up powers (contributing to action penalty), and use the "Add DSP" button to trigger the conversion check in chat.

## Why

- Phase 7 of the implementation plan — phases 0–6 complete.
- Force-sensitive characters (Jedi, Dark Jedi, force users) need mechanical support.
- DSP bonus is already partially set up (field exists on CharacterData) but no bonus calculation or Force tab exist yet.
- Keep-up mechanic affects all rolls for the character, making it a cross-cutting concern.

## What

### Files to create
- `modules/helpers/force.mjs` — `calculateForceDiceBonus(dsp)`, `applyDarkSidePoint(actor)`
- `tests/unit/force.test.mjs` — unit tests for `calculateForceDiceBonus` and `applyDarkSidePoint`

### Files to modify
- `modules/actors/character-data.mjs` — add `forceSkills` SchemaField and `keptUpPowers` ArrayField; update `prepareDerivedData()` to compute `forceRollBonus` and `keepUpPenalty`
- `modules/apps/character-sheet.mjs` — add Force tab context, `rollForceSkill` action, `addDarkSidePoint` action, `addKeptUpPower` action, `removeKeptUpPower` action; integrate keep-up penalty into all roll handlers
- `templates/actors/character-sheet.hbs` — add Force tab in nav (conditional), Force tab section
- `modules/apps/roll-dialog.mjs` — add optional `forceDifficultyModifier` input (shown when `isForceRoll: true`)
- `templates/dice/roll-dialog.hbs` — render Force difficulty modifier input conditionally
- `lang/en.json` — Force tab labels, keep-up strings, DSP warning, Force difficulty label
- `doc/implementation-plan.md` — mark Phase 7 ✓ Done
- `README.md` — update Development Status table (fix phases 5+6 to ✅ Done, mark phase 7 ✅ Done)

### Success Criteria

- [ ] `CharacterData` defines `forceSkills` SchemaField with `control`, `sense`, `alter` sub-fields (dice + pips)
- [ ] `CharacterData` defines `keptUpPowers: ArrayField(StringField())`
- [ ] `prepareDerivedData()` computes `forceRollBonus` and `keepUpPenalty`
- [ ] `calculateForceDiceBonus(dsp)` returns correct bonus for dsp 0, 1, 2, 3+
- [ ] `applyDarkSidePoint(actor)` increments DSP, rolls 1d6, posts conversion warning if triggered
- [ ] Force tab visible only when `system.forceSensitive === true`
- [ ] Force skill dice/pips editable and persisted
- [ ] "Add DSP" button triggers conversion check chat message
- [ ] Kept-up powers: add (text input), remove (button) — array persists
- [ ] Force skill roll includes DSP bonus + wound penalty + keep-up penalty + Force difficulty modifier
- [ ] Keep-up count adds to multiple-action penalty on ALL rolls (attribute, skill, force, attack)
- [ ] `RollDialog` shows Force difficulty modifier input when `isForceRoll: true`

---

## All Needed Context

### Documentation & References

```yaml
- file: modules/actors/character-data.mjs
  why: >
    PRIMARY FILE TO MODIFY. Current state:
    - Already has: forceSensitive BooleanField, darkSidePoints NumberField
    - MISSING: forceSkills SchemaField, keptUpPowers ArrayField
    - prepareDerivedData() computes penaltyDice/penaltyPips — extend it to also compute
      forceRollBonus (via calculateForceDiceBonus) and keepUpPenalty = keptUpPowers.length
    - ArrayField/StringField not yet imported — add to destructuring at top

- file: modules/apps/character-sheet.mjs
  why: >
    PRIMARY FILE TO MODIFY. Current state:
    - _prepareContext() builds forceSkills from Items (keep this for skills tab — it's separate)
    - tabGroups = { primary: "attributes" } — add "force" tab
    - Roll handlers (#rollSkill, #rollAttribute, #rollAttack) compute penalty = numActions - 1
      BUT do not yet account for keptUpPowers.length. Add:
        const keepUpPenalty = this.document.system.keepUpPenalty ?? 0;
        const penalty = (numActions - 1) + keepUpPenalty;
      to ALL three roll handlers.
    - Add new actions: rollForceSkill, addDarkSidePoint, addKeptUpPower, removeKeptUpPower
    - Force tab context: system.forceSkills (the die-code fields, NOT item skills),
      keptUpPowers array, DSP value, forceRollBonus

- file: modules/apps/roll-dialog.mjs
  why: >
    Add isForceRoll private field and forceDifficultyModifier output.
    prompt() gets new option: isForceRoll (default false).
    _prepareContext() exposes isForceRoll.
    #onSubmit reads forceDifficultyModifier from formData (integer 0-30, default 0).
    Return value signature extends to: { numActions, useForcePoint, forceDifficultyModifier }
    (forceDifficultyModifier is always in the return — 0 for non-Force rolls).

- file: templates/dice/roll-dialog.hbs
  why: >
    Add conditional Force difficulty modifier input:
      {{#if isForceRoll}}
      <div class="form-group">
        <label>{{localize "STARWARSD6.Force.DifficultyModifier"}}</label>
        <input type="number" name="forceDifficultyModifier" value="0" min="0" max="30" />
      </div>
      {{/if}}

- file: templates/actors/character-sheet.hbs
  why: >
    Add Force tab to nav (conditional on system.forceSensitive).
    Add Force tab section:
    - Three force skills (control/sense/alter): dice input, pips input, roll button
    - DSP counter (read-only derived display) + "Add DSP" button
    - DSP bonus display (derived forceRollBonus)
    - Kept-up powers list: each with name + remove button
    - Add kept-up power: text input + add button

- file: modules/helpers/force.mjs
  why: >
    NEW FILE to create. Export calculateForceDiceBonus and applyDarkSidePoint.
    See Implementation Blueprint for exact logic.

- file: doc/rules-reference.md
  section: "The Force" > "The Lure of the Dark Side"
  why: >
    DSP bonus rules (authoritative):
    - 1-2 DSP: +2 pips per DSP (e.g., dsp=1 → +2 pips, dsp=2 → +4 pips normalized to +1D+1pip)
    - dsp >= 3: +1D per DSP (e.g., dsp=3 → +3D)
    - Normalize: 3 pips = 1 die. Apply normalization to the pip bonus.

- file: doc/rules-reference.md
  section: "The Force" > "Keeping Powers Up"
  why: >
    Keep-up count adds those Force skills as active actions, contributing to
    multiple-action penalty for all other actions. keptUpPowers.length = extra penalty dice.

- file: doc/rules-reference.md
  section: "Special Points" > "Dark Side Points"
  why: >
    Conversion check: roll 1d6; if result < current DSP (after gaining the new one)
    → post chat warning "Character consumed by dark side". Note: the check fires
    AFTER incrementing DSP (so threshold is already the new total).

- file: doc/rules-reference.md
  section: "The Force" > "Difficulty Modifiers" (Relationship and Proximity tables)
  why: >
    Force difficulty modifier ranges +0 to +30. Added to the base difficulty.
    RollDialog shows a number input (0-30) when isForceRoll=true. This modifier
    is a flat addition to the difficulty number, NOT to the dice pool.
    Implementation note: the Force roll does NOT subtract this from dice — it is
    informational (GM compares roll total vs. difficulty + modifier). Post it in chat.

- file: modules/helpers/dice.mjs
  why: >
    rollWithWildDie(dice, pips, multipleActionPenalty, _rollFn, { doubled }) is the
    roll engine. Force rolls reuse it:
      rollWithWildDie(
        system.forceSkills[skill].dice + forceRollBonus.bonusDice,
        system.forceSkills[skill].pips + forceRollBonus.bonusPips,
        totalPenalty,  // (numActions - 1) + keepUpPenalty + wound penalty dice
        undefined,
        { doubled: useForcePoint }
      )
    Pips can exceed 2 after adding DSP bonus — rollWithWildDie adds pips directly
    to the total, so this is fine. No normalization needed in the roll call itself.

- file: starwarsd6.mjs
  why: >
    No changes needed. force.mjs is imported only by character-data.mjs and
    character-sheet.mjs — no registration required.

- file: tests/unit/damage.test.mjs
  why: >
    Primary pattern for helper unit tests. Mirror: vitest imports, makeMockActor()
    factory with vi.fn() for actor.update, describe/it/expect structure.
    force.test.mjs follows the same pattern.

- file: tests/unit/dice.test.mjs
  why: >
    Pattern for testing async functions with injected mock roll functions.
    applyDarkSidePoint needs a mock Roll object injected via parameter
    (same injection pattern used in rollWithWildDie).

- file: tests/mocks/foundry.mjs
  why: >
    The foundry mock MUST have ArrayField in foundry.data.fields for
    character-data.mjs to import without error. Add ArrayField: FieldStub
    to the fields object. Also add Roll mock for applyDarkSidePoint tests.

- file: tests/unit/character-data.test.mjs
  why: >
    Pattern for testing prepareDerivedData(). The makeCharacterData() factory
    uses Object.create(CharacterData.prototype) and assigns fields directly.
    Update this test file to cover forceRollBonus and keepUpPenalty derivation.
```

### Current Codebase Tree (relevant subset)

```
fvtt-starwarsd6/
├── starwarsd6.mjs                       (unchanged)
├── modules/
│   ├── actors/
│   │   └── character-data.mjs           ← MODIFY: add forceSkills, keptUpPowers, update prepareDerivedData
│   ├── apps/
│   │   ├── character-sheet.mjs          ← MODIFY: Force tab, new actions, keep-up in all rolls
│   │   └── roll-dialog.mjs              ← MODIFY: add isForceRoll / forceDifficultyModifier
│   └── helpers/
│       ├── dice.mjs                     (unchanged — reused as-is)
│       └── force.mjs                    ← CREATE: calculateForceDiceBonus, applyDarkSidePoint
├── templates/
│   ├── actors/
│   │   └── character-sheet.hbs          ← MODIFY: add Force tab nav + section
│   └── dice/
│       └── roll-dialog.hbs             ← MODIFY: add Force difficulty modifier input
└── lang/
    └── en.json                          ← MODIFY: add Force tab labels
```

### Desired Codebase Tree (after implementation)

```
fvtt-starwarsd6/
├── modules/
│   ├── actors/
│   │   └── character-data.mjs           ← forceSkills SchemaField + keptUpPowers ArrayField added
│   ├── apps/
│   │   ├── character-sheet.mjs          ← Force tab + 4 new actions + keepUp in all rolls
│   │   └── roll-dialog.mjs              ← isForceRoll + forceDifficultyModifier
│   └── helpers/
│       └── force.mjs                    ← NEW: calculateForceDiceBonus + applyDarkSidePoint
├── templates/
│   ├── actors/
│   │   └── character-sheet.hbs          ← Force tab added (conditional)
│   └── dice/
│       └── roll-dialog.hbs              ← Force difficulty modifier input added
└── lang/
    └── en.json                          ← Force tab i18n keys added
```

### Known Gotchas

```js
// GOTCHA 1: ArrayField import
// character-data.mjs currently only destructures: NumberField, SchemaField, BooleanField
// You MUST add StringField and ArrayField to the destructuring:
//   const { NumberField, SchemaField, BooleanField, StringField, ArrayField } = foundry.data.fields;

// GOTCHA 2: forceSkills are NOT items — they are direct fields on system
// The existing context.forceSkills in character-sheet.mjs reads from actor.items
// (isForce skills). These are separate from the new system.forceSkills die-code fields.
// Rename the context key for Force tab to avoid collision:
//   context.forceData = {
//     skills: { control: system.forceSkills.control, sense: ..., alter: ... },
//     keptUpPowers: system.keptUpPowers,
//     dsp: system.darkSidePoints,
//     forceRollBonus: system.forceRollBonus
//   };
// (context.forceSkills from items can stay as-is for the Skills tab)

// GOTCHA 3: keptUpPowers is an ArrayField(StringField()) stored on the actor.
// To add a power: actor.update({ "system.keptUpPowers": [...current, newName] })
// To remove:      actor.update({ "system.keptUpPowers": current.filter((_, i) => i !== index) })
// Array mutation via direct assignment won't persist — always use actor.update().

// GOTCHA 4: Force difficulty modifier is NOT subtracted from dice.
// It's a flat number the GM uses to set the difficulty. Post it in chat alongside
// the roll total. Formula: total must beat (base_difficulty + forceDifficultyModifier).
// The RollDialog only captures the modifier; the sheet posts it in the chat card.

// GOTCHA 5: keepUpPenalty in all roll handlers
// keptUpPowers.length must be added to the penalty for ALL rolls: rollSkill,
// rollAttribute, rollAttack, AND rollForceSkill. Pattern:
//   const keepUpPenalty = this.document.system.keepUpPenalty ?? 0;
// Use ?? 0 in case keepUpPenalty is undefined during DataModel migration.

// GOTCHA 6: Pip overflow in Force rolls
// After adding DSP bonus pips: forceSkills.control.pips + forceRollBonus.bonusPips
// may exceed 2. rollWithWildDie simply adds pips to the total, so values > 2 are fine.
// DO NOT clamp pips before calling rollWithWildDie.

// GOTCHA 7: Pip normalization in calculateForceDiceBonus
// For dsp 1-2, apply normalization so the returned bonusPips is 0-2 and any
// excess becomes bonusDice. Example: dsp=2 → rawPips=4 → bonusDice=1, bonusPips=1.
// Formula: const rawPips = 2 * dsp; bonusDice = Math.floor(rawPips / 3); bonusPips = rawPips % 3;
// (only for dsp < 3 branch; for dsp >= 3, bonusDice = dsp, bonusPips = 0)

// GOTCHA 8: applyDarkSidePoint uses new Roll("1d6").evaluate()
// Mirror rollOneDie() in dice.mjs:
//   const r = await new Roll("1d6").evaluate();
//   const rolled = r.total;
// Do NOT import rollOneDie (it's not exported) — use the same inline pattern.

// GOTCHA 9: Force tab visibility in HBS
// Use {{#if system.forceSensitive}} ... {{/if}} around the Force tab nav item
// AND around the Force tab section. The tab must not appear at all (not just hidden)
// for non-Force characters. If the Force tab was the active tab and forceSensitive
// is toggled off, the user would land on a blank tab — acceptable for now.

// GOTCHA 9b: Foundry mock needs ArrayField
// tests/mocks/foundry.mjs only mocks NumberField, StringField, BooleanField, SchemaField.
// character-data.mjs now also destructures ArrayField — add it to the mock:
//   ArrayField: FieldStub
// Without this, importing character-data.mjs in tests will throw.

// GOTCHA 9c: applyDarkSidePoint uses Roll and ChatMessage globals
// These are Foundry globals not available in vitest. The function must accept
// an injected roll function (_rollFn) as an optional parameter (same pattern as
// rollWithWildDie in dice.mjs). Signature:
//   export async function applyDarkSidePoint(actor, _rollFn = defaultRollFn)
// where defaultRollFn = async () => (await new Roll("1d6").evaluate()).total
// Tests inject a vi.fn() mock instead, and mock actor.update + ChatMessage.create
// via globalThis injection in the test file (see applyDamage tests for actor.update pattern).
// For ChatMessage.create, set globalThis.ChatMessage = { create: vi.fn() } in tests.

// GOTCHA 10: RollDialog return value now always includes forceDifficultyModifier
// Even for non-Force rolls, #onSubmit returns { numActions, useForcePoint, forceDifficultyModifier: 0 }.
// All existing callers (#rollSkill, #rollAttribute, #rollAttack) already destructure
// { numActions, useForcePoint } — the extra key is harmless.
```

---

## Implementation Blueprint

### `modules/helpers/force.mjs` (new file)

```js
/**
 * @param {number} dsp  Current dark side points
 * @returns {{ bonusDice: number, bonusPips: number }}
 */
export function calculateForceDiceBonus(dsp) {
  if (dsp <= 0) return { bonusDice: 0, bonusPips: 0 };
  if (dsp >= 3) return { bonusDice: dsp, bonusPips: 0 };
  // dsp 1-2: +2 pips per DSP, then normalize (3 pips = 1 die)
  const rawPips = 2 * dsp;
  return { bonusDice: Math.floor(rawPips / 3), bonusPips: rawPips % 3 };
}

// Default roll function — inline to avoid importing non-exported rollOneDie from dice.mjs
async function defaultRollFn() {
  const r = await new Roll("1d6").evaluate();
  return r.total;
}

/**
 * @param {Actor} actor
 * @param {Function} [_rollFn]  Injectable for tests (same pattern as rollWithWildDie)
 * @returns {Promise<void>}
 */
export async function applyDarkSidePoint(actor, _rollFn = defaultRollFn) {
  const newDsp = actor.system.darkSidePoints + 1;
  await actor.update({ "system.darkSidePoints": newDsp });
  // Conversion check: roll 1d6
  const rolled = await _rollFn();
  const speaker = ChatMessage.getSpeaker({ actor });
  if (rolled < newDsp) {
    await ChatMessage.create({
      speaker,
      content: `<div class="starwarsd6 roll-result dsp-warning">
        <h3>Dark Side Point Gained (total: ${newDsp})</h3>
        <div>Conversion roll: <strong>${rolled}</strong> vs DSP ${newDsp}</div>
        <div class="dark-side-consumed"><strong>⚠ Character consumed by the dark side!</strong></div>
      </div>`
    });
  } else {
    await ChatMessage.create({
      speaker,
      content: `<div class="starwarsd6 roll-result">
        <h3>Dark Side Point Gained (total: ${newDsp})</h3>
        <div>Conversion roll: <strong>${rolled}</strong> vs DSP ${newDsp} — resisted</div>
      </div>`
    });
  }
}
```

### `modules/actors/character-data.mjs` changes

```js
// Change destructuring (top of file):
const { NumberField, SchemaField, BooleanField, StringField, ArrayField } = foundry.data.fields;

// Add import:
import { calculateForceDiceBonus } from "../helpers/force.mjs";

// In defineSchema(), add after darkSidePoints:
forceSkills: new SchemaField({
  control: new SchemaField({
    dice: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
    pips: new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 0 })
  }),
  sense: new SchemaField({
    dice: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
    pips: new NumberField({ required: true, nullable: false, integer: true, min: 0, max: 2, initial: 0 })
  }),
  alter: new SchemaField({
    dice: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 }),
    pips: new NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 })
  })
}),
keptUpPowers: new ArrayField(new StringField({ required: true, nullable: false, initial: "" })),

// In prepareDerivedData(), add after existing penalty calculations:
this.forceRollBonus = calculateForceDiceBonus(this.darkSidePoints);
this.keepUpPenalty = this.keptUpPowers.length;
```

### `modules/apps/roll-dialog.mjs` changes

```js
// Add private field:
#isForceRoll = false;

// Extend prompt() signature:
static async prompt({ canSpendFP = false, hasFP = false, isForceRoll = false, ...options } = {}) {
  // ... set dialog.#isForceRoll = isForceRoll; before render

// Extend _prepareContext():
context.isForceRoll = this.#isForceRoll;

// Extend #onSubmit:
const forceDifficultyModifier = this.#isForceRoll
  ? Math.min(30, Math.max(0, parseInt(formData.object.forceDifficultyModifier ?? "0")))
  : 0;
// Return: this.#resolve({ numActions, useForcePoint, forceDifficultyModifier });
```

### `modules/apps/character-sheet.mjs` changes

```js
// Add import at top:
import { applyDarkSidePoint } from "../helpers/force.mjs";

// Add actions in DEFAULT_OPTIONS.actions:
rollForceSkill: CharacterSheet.#rollForceSkill,
addDarkSidePoint: CharacterSheet.#addDarkSidePoint,
addKeptUpPower: CharacterSheet.#addKeptUpPower,
removeKeptUpPower: CharacterSheet.#removeKeptUpPower,

// In _prepareContext(), add:
context.forceData = this.document.system.forceSensitive ? {
  skills: {
    control: { ...this.document.system.forceSkills.control, key: "control", label: "Control" },
    sense:   { ...this.document.system.forceSkills.sense,   key: "sense",   label: "Sense" },
    alter:   { ...this.document.system.forceSkills.alter,   key: "alter",   label: "Alter" }
  },
  keptUpPowers: this.document.system.keptUpPowers.map((name, index) => ({ name, index })),
  dsp: this.document.system.darkSidePoints,
  forceRollBonus: this.document.system.forceRollBonus,
  keepUpPenalty: this.document.system.keepUpPenalty
} : null;

// Update ALL three existing roll handlers to add keepUpPenalty:
// In #rollSkill, #rollAttribute, #rollAttack:
//   const keepUpPenalty = this.document.system.keepUpPenalty ?? 0;
//   const penalty = (numActions - 1) + keepUpPenalty + penaltyDice;  // (for attack)
//   — or for skill/attribute:
//   const penalty = (numActions - 1) + keepUpPenalty;
//   Then pass to rollWithWildDie as multipleActionPenalty

// New action: #rollForceSkill
static async #rollForceSkill(event, target) {
  const skillKey = target.dataset.skillKey; // "control"|"sense"|"alter"
  const system = this.document.system;
  if (!system.forceSensitive) return;
  const skill = system.forceSkills[skillKey];
  if (!skill) return;

  const bonus = system.forceRollBonus;
  const totalDice = skill.dice + bonus.bonusDice;
  const totalPips = skill.pips + bonus.bonusPips; // may exceed 2, OK

  const fp = system.forcePoints;
  const fpSpent = !!this.document.getFlag("starwarsd6", "fpSpentThisRound");
  const result = await RollDialog.prompt({ canSpendFP: !fpSpent, hasFP: fp > 0, isForceRoll: true });
  if (result === null) return;

  const { numActions, useForcePoint, forceDifficultyModifier } = result;

  if (useForcePoint) {
    await this.document.update({ "system.forcePoints": Math.max(0, fp - 1) });
    await this.document.setFlag("starwarsd6", "fpSpentThisRound", true);
  }

  const keepUpPenalty = system.keepUpPenalty ?? 0;
  const penalty = (numActions - 1) + keepUpPenalty + system.penaltyDice;
  const rollResult = await rollWithWildDie(totalDice, totalPips, penalty, undefined, { doubled: useForcePoint });
  rollResult.total = Math.max(0, rollResult.total - system.penaltyPips);

  const cpNow = this.document.system.characterPoints;
  const fpSpentNow = !!this.document.getFlag("starwarsd6", "fpSpentThisRound");

  // Post to chat — include DSP bonus and difficulty modifier in label
  const label = game.i18n.localize(`STARWARSD6.Force.Skill.${skillKey}`);
  await CharacterSheet.#postForceRollToChat(
    this.document, label, rollResult, numActions, keepUpPenalty,
    bonus, forceDifficultyModifier,
    { cpAvailable: cpNow, fpSpentThisRound: fpSpentNow }
  );
}

// New action: #addDarkSidePoint
static async #addDarkSidePoint(event, target) {
  await applyDarkSidePoint(this.document);
}

// New action: #addKeptUpPower
static async #addKeptUpPower(event, target) {
  // Read power name from a text input sibling via data-power-input on same form row
  const input = this.element.querySelector(".kept-up-power-input");
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;
  const current = this.document.system.keptUpPowers;
  await this.document.update({ "system.keptUpPowers": [...current, name] });
  input.value = "";
}

// New action: #removeKeptUpPower
static async #removeKeptUpPower(event, target) {
  const index = parseInt(target.dataset.powerIndex);
  const current = this.document.system.keptUpPowers;
  await this.document.update({
    "system.keptUpPowers": current.filter((_, i) => i !== index)
  });
}
```

### `templates/actors/character-sheet.hbs` Force tab additions

```hbs
{{!-- In <nav>, after Combat tab (conditional): --}}
{{#if system.forceSensitive}}
<a class="item {{#if (eq tabs.primary 'force')}}active{{/if}}"
   data-action="tab" data-tab="force" data-group="primary">
  {{localize "STARWARSD6.Tab.Force"}}
</a>
{{/if}}

{{!-- New Force tab section: --}}
{{#if system.forceSensitive}}
<section class="tab {{#if (eq tabs.primary 'force')}}active{{/if}}"
         data-tab="force" data-group="primary">

  {{!-- Force Skills --}}
  <h3>{{localize "STARWARSD6.Force.Skills"}}</h3>
  <table class="force-skills-table">
    <thead>
      <tr>
        <th>{{localize "STARWARSD6.Skill.Name"}}</th>
        <th>{{localize "STARWARSD6.Attribute.Dice"}}</th>
        <th>{{localize "STARWARSD6.Attribute.Pips"}}</th>
        <th>{{localize "STARWARSD6.Roll.Label"}}</th>
      </tr>
    </thead>
    <tbody>
      {{#each forceData.skills as |skill|}}
      <tr>
        <td>{{skill.label}}</td>
        <td><input type="number" name="system.forceSkills.{{skill.key}}.dice"
                   value="{{skill.dice}}" min="0" /></td>
        <td><input type="number" name="system.forceSkills.{{skill.key}}.pips"
                   value="{{skill.pips}}" min="0" max="2" /></td>
        <td><button type="button" data-action="rollForceSkill"
                    data-skill-key="{{skill.key}}">
          <i class="fas fa-dice"></i>
        </button></td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  {{!-- Dark Side Points --}}
  <h3>{{localize "STARWARSD6.Force.DarkSide"}}</h3>
  <div class="force-dsp">
    <div class="form-group">
      <label>{{localize "STARWARSD6.Character.DarkSidePoints"}}</label>
      <input type="number" name="system.darkSidePoints"
             value="{{forceData.dsp}}" min="0" />
      <button type="button" data-action="addDarkSidePoint"
              title="{{localize 'STARWARSD6.Force.AddDSP'}}">
        {{localize "STARWARSD6.Force.AddDSP"}}
      </button>
    </div>
    {{#if forceData.forceRollBonus}}
    <div class="form-group">
      <label>{{localize "STARWARSD6.Force.DSPBonus"}}</label>
      <span class="derived-value">
        {{#if forceData.forceRollBonus.bonusDice}}+{{forceData.forceRollBonus.bonusDice}}D{{/if}}{{#if forceData.forceRollBonus.bonusPips}}+{{forceData.forceRollBonus.bonusPips}}{{/if}}
        {{#unless forceData.forceRollBonus.bonusDice}}{{#unless forceData.forceRollBonus.bonusPips}}—{{/unless}}{{/unless}}
      </span>
    </div>
    {{/if}}
  </div>

  {{!-- Kept-Up Powers --}}
  <h3>{{localize "STARWARSD6.Force.KeptUpPowers"}}</h3>
  {{#if forceData.keepUpPenalty}}
  <p class="keep-up-penalty-note">
    {{localize "STARWARSD6.Force.KeepUpPenaltyNote"}}: −{{forceData.keepUpPenalty}}D
  </p>
  {{/if}}
  <ul class="kept-up-powers-list">
    {{#each forceData.keptUpPowers as |power|}}
    <li>
      <span>{{power.name}}</span>
      <button type="button" data-action="removeKeptUpPower"
              data-power-index="{{power.index}}"
              title="{{localize 'STARWARSD6.Force.RemovePower'}}">✕</button>
    </li>
    {{/each}}
  </ul>
  <div class="form-group kept-up-add">
    <input type="text" class="kept-up-power-input"
           placeholder="{{localize 'STARWARSD6.Force.PowerName'}}" />
    <button type="button" data-action="addKeptUpPower">
      {{localize "STARWARSD6.Force.AddPower"}}
    </button>
  </div>

</section>
{{/if}}
```

---

## Implementation Tasks (ordered)

```yaml
Task 1 — CREATE modules/helpers/force.mjs:
  EXPORTS: calculateForceDiceBonus(dsp), applyDarkSidePoint(actor)
  RULES:
    - calculateForceDiceBonus: dsp<=0 → {0,0}; dsp>=3 → {dsp,0}; dsp 1-2 → normalize rawPips=2*dsp
    - applyDarkSidePoint: update darkSidePoints, roll 1d6, post chat card
  NO IMPORTS NEEDED beyond Foundry globals (Roll, ChatMessage)

Task 2 — MODIFY modules/actors/character-data.mjs:
  ADD to destructuring: StringField, ArrayField
  ADD import: import { calculateForceDiceBonus } from "../helpers/force.mjs";
  ADD to defineSchema() after darkSidePoints:
    - forceSkills SchemaField (control/sense/alter, each with dice+pips NumberFields, min:0)
    - keptUpPowers ArrayField(StringField) — StringField({ required:true, nullable:false, initial:"" })
  ADD to prepareDerivedData() after penaltyPips line:
    - this.forceRollBonus = calculateForceDiceBonus(this.darkSidePoints);
    - this.keepUpPenalty = this.keptUpPowers.length;

Task 3 — MODIFY modules/apps/roll-dialog.mjs:
  ADD private field: #isForceRoll = false;
  MODIFY prompt(): accept isForceRoll option, assign to dialog.#isForceRoll
  MODIFY _prepareContext(): context.isForceRoll = this.#isForceRoll
  MODIFY #onSubmit: read forceDifficultyModifier (clamp 0-30, default 0)
  MODIFY return value: add forceDifficultyModifier to resolve() call

Task 4 — MODIFY templates/dice/roll-dialog.hbs:
  ADD conditional Force difficulty modifier input ({{#if isForceRoll}} ... {{/if}})
  PRESERVE existing numActions and useForcePoint inputs

Task 5 — MODIFY modules/apps/character-sheet.mjs:
  STEP 5a: ADD import for applyDarkSidePoint from force.mjs
  STEP 5b: ADD 4 new actions to DEFAULT_OPTIONS.actions
  STEP 5c: ADD forceData to _prepareContext() (conditional on forceSensitive)
  STEP 5d: UPDATE #rollSkill — add keepUpPenalty to penalty computation
  STEP 5e: UPDATE #rollAttribute — add keepUpPenalty to penalty computation
  STEP 5f: UPDATE #rollAttack — add keepUpPenalty to penalty computation
  STEP 5g: ADD static #rollForceSkill method (see Implementation Blueprint)
  STEP 5h: ADD static #postForceRollToChat method (mirror #postRollToChat; add DSP bonus note and difficulty modifier to chat content)
  STEP 5i: ADD static #addDarkSidePoint method
  STEP 5j: ADD static #addKeptUpPower method
  STEP 5k: ADD static #removeKeptUpPower method

Task 6 — MODIFY templates/actors/character-sheet.hbs:
  ADD Force tab nav item (conditional on system.forceSensitive)
  ADD Force tab section (conditional on system.forceSensitive)
  PRESERVE all existing tabs and sections unchanged

Task 7 — MODIFY tests/mocks/foundry.mjs:
  ADD ArrayField: FieldStub to foundry.data.fields (alongside existing NumberField etc.)
  NOTE: without this, importing character-data.mjs in any test will throw
        "ArrayField is not a constructor"

Task 8 — CREATE tests/unit/force.test.mjs:
  MIRROR: tests/unit/damage.test.mjs (structure, imports, vi.fn() actor mock)
  TEST calculateForceDiceBonus:
    - dsp=0 → { bonusDice:0, bonusPips:0 }
    - dsp=1 → { bonusDice:0, bonusPips:2 }
    - dsp=2 → { bonusDice:1, bonusPips:1 }   (4 pips normalized: 1D+1pip)
    - dsp=3 → { bonusDice:3, bonusPips:0 }
    - dsp=5 → { bonusDice:5, bonusPips:0 }
    - dsp=-1 → { bonusDice:0, bonusPips:0 }  (negative treated as 0)
  TEST applyDarkSidePoint:
    SETUP: globalThis.ChatMessage = { create: vi.fn().mockResolvedValue(undefined) }
           makeActor() factory: { system: { darkSidePoints: N }, update: vi.fn() }
           inject _rollFn = vi.fn() to control the 1d6 result
    - calls actor.update({ "system.darkSidePoints": oldDsp + 1 })
    - when rolled < newDsp → ChatMessage.create called with content matching "consumed"
    - when rolled >= newDsp → ChatMessage.create called with content matching "resisted"
    - calls actor.update exactly once
    - always calls ChatMessage.create exactly once

Task 9 — MODIFY tests/unit/character-data.test.mjs:
  ADD to makeCharacterData() defaults:
    - forceSensitive: false
    - darkSidePoints: 0
    - forceSkills: { control: { dice:0, pips:0 }, sense: { dice:0, pips:0 }, alter: { dice:0, pips:0 } }
    - keptUpPowers: []
    - penaltyDice: 0 (needed so prepareDerivedData() can read it without error
      if called with no wounds set — or set woundMarks/incapMarks/mortalMarks defaults to 0)
  ADD new describe block "forceRollBonus derivation":
    - darkSidePoints=0 → forceRollBonus = { bonusDice:0, bonusPips:0 }
    - darkSidePoints=2 → forceRollBonus = { bonusDice:1, bonusPips:1 }
    - darkSidePoints=4 → forceRollBonus = { bonusDice:4, bonusPips:0 }
  ADD new describe block "keepUpPenalty derivation":
    - keptUpPowers=[] → keepUpPenalty = 0
    - keptUpPowers=["Lightsaber Combat"] → keepUpPenalty = 1
    - keptUpPowers=["A","B","C"] → keepUpPenalty = 3
  NOTE: makeCharacterData() must also set stunMarks/woundMarks/incapMarks/mortalMarks
        to 0 by default (they already exist in CharacterData so prepareDerivedData()
        references them for penaltyDice) — check if they're already defaulted;
        add them if not.

Task 10 — MODIFY lang/en.json:
  ADD the following keys (before closing brace):
  "STARWARSD6.Tab.Force": "Force",
  "STARWARSD6.Force.Skills": "Force Skills",
  "STARWARSD6.Force.DarkSide": "Dark Side",
  "STARWARSD6.Force.AddDSP": "Add Dark Side Point",
  "STARWARSD6.Force.DSPBonus": "DSP Bonus",
  "STARWARSD6.Force.KeptUpPowers": "Kept-Up Powers",
  "STARWARSD6.Force.KeepUpPenaltyNote": "Keep-up penalty",
  "STARWARSD6.Force.AddPower": "Add Power",
  "STARWARSD6.Force.RemovePower": "Remove Power",
  "STARWARSD6.Force.PowerName": "Power name...",
  "STARWARSD6.Force.DifficultyModifier": "Force Difficulty Modifier",
  "STARWARSD6.Force.Skill.control": "Control",
  "STARWARSD6.Force.Skill.sense": "Sense",
  "STARWARSD6.Force.Skill.alter": "Alter",
  "STARWARSD6.Force.ChatDSPBonus": "DSP bonus",
  "STARWARSD6.Force.ChatDiffModifier": "Difficulty mod"

Task 11 — MODIFY doc/implementation-plan.md:
  FIND Phase 7 row in the Phase Overview table:
    | 7 | Force System | Force skills, powers, DSP | L | 5 |
  REPLACE with:
    | 7 ✓ | Force System | Force skills, powers, DSP | L | 5 |
  Also update "Current state" line at top from "phases 0–6 completed" to "phases 0–7 completed"

Task 12 — MODIFY README.md:
  FIND the Development Status table. Fix stale rows and mark Phase 7 done:
    | 5 | Character Points & Force Points | ⬜ Pending |  →  | 5 | Character Points & Force Points | ✅ Done |
    | 6 | NPC Actor | ⬜ Pending |                        →  | 6 | NPC Actor | ✅ Done |
    | 7 | Force System | ⬜ Pending |                     →  | 7 | Force System | ✅ Done |
  NOTE: Phases 5 and 6 are already implemented (git commits confirm); the README was
        not updated after those phases completed.
```

---

## Integration Points

```yaml
FORCE_HELPERS (force.mjs):
  - calculateForceDiceBonus: imported by character-data.mjs
  - applyDarkSidePoint: imported by character-sheet.mjs

CHARACTER_DATA:
  - defineSchema: add forceSkills SchemaField + keptUpPowers ArrayField
  - prepareDerivedData: compute forceRollBonus + keepUpPenalty

ROLL_DIALOG:
  - New isForceRoll flag thread: prompt() → _prepareContext() → template → #onSubmit → return
  - forceDifficultyModifier always returned (0 for non-Force rolls)
  - All existing callers receive it harmlessly (they don't destructure it)

CHARACTER_SHEET (keep-up penalty):
  - #rollSkill: penalty = (numActions - 1) + keepUpPenalty
  - #rollAttribute: penalty = (numActions - 1) + keepUpPenalty
  - #rollAttack: totalPenalty = penaltyDice + (numActions - 1) + keepUpPenalty

LANG_EN_JSON:
  - All Force.* keys added — none conflict with existing keys
```

---

## Validation Gates

### Level 0: Unit tests

```bash
# Run from fvtt-starwarsd6/
npm test
# Expected: all tests pass including the new tests/unit/force.test.mjs
# If failing: read the error, fix the code, re-run. Never comment out failing tests.
```

### Level 1: JSON validation

```bash
# Run from fvtt-starwarsd6/
node -e "JSON.parse(require('fs').readFileSync('lang/en.json','utf8')); console.log('lang/en.json OK')"
node -e "JSON.parse(require('fs').readFileSync('system.json','utf8')); console.log('system.json OK')"
```

### Level 2: Structural checks

```bash
# Verify force.mjs exists and exports both functions:
grep -n "export function" modules/helpers/force.mjs
# Expected: calculateForceDiceBonus, applyDarkSidePoint

# Verify character-data.mjs has forceSkills and keptUpPowers:
grep -n "forceSkills\|keptUpPowers\|ArrayField\|forceRollBonus\|keepUpPenalty" modules/actors/character-data.mjs

# Verify character-sheet.mjs has new actions:
grep -n "rollForceSkill\|addDarkSidePoint\|addKeptUpPower\|removeKeptUpPower\|keepUpPenalty" modules/apps/character-sheet.mjs

# Verify roll-dialog.mjs has isForceRoll and forceDifficultyModifier:
grep -n "isForceRoll\|forceDifficultyModifier" modules/apps/roll-dialog.mjs

# Verify character-sheet.hbs has Force tab:
grep -n "Tab.Force\|force\|forceData" templates/actors/character-sheet.hbs

# Verify roll-dialog.hbs has isForceRoll:
grep -n "isForceRoll\|DifficultyModifier" templates/dice/roll-dialog.hbs
```

### Level 3: Logic unit check (calculateForceDiceBonus)

```bash
# Quick sanity check — run in node:
node -e "
function calculateForceDiceBonus(dsp) {
  if (dsp <= 0) return { bonusDice: 0, bonusPips: 0 };
  if (dsp >= 3) return { bonusDice: dsp, bonusPips: 0 };
  const rawPips = 2 * dsp;
  return { bonusDice: Math.floor(rawPips / 3), bonusPips: rawPips % 3 };
}
console.assert(JSON.stringify(calculateForceDiceBonus(0))  === '{\"bonusDice\":0,\"bonusPips\":0}', 'dsp=0 failed');
console.assert(JSON.stringify(calculateForceDiceBonus(1))  === '{\"bonusDice\":0,\"bonusPips\":2}', 'dsp=1 failed');
console.assert(JSON.stringify(calculateForceDiceBonus(2))  === '{\"bonusDice\":1,\"bonusPips\":1}', 'dsp=2 failed');
console.assert(JSON.stringify(calculateForceDiceBonus(3))  === '{\"bonusDice\":3,\"bonusPips\":0}', 'dsp=3 failed');
console.assert(JSON.stringify(calculateForceDiceBonus(5))  === '{\"bonusDice\":5,\"bonusPips\":0}', 'dsp=5 failed');
console.log('All calculateForceDiceBonus assertions passed');
"
```

### Level 4: Manual Foundry test (after deploy)

```
1. Open Foundry; open an existing character sheet
2. Attributes tab: check "Force Sensitive" checkbox → Force tab appears in nav
3. Uncheck Force Sensitive → Force tab disappears
4. Re-check Force Sensitive → open Force tab
5. Set control dice=2, pips=0 → values persist on sheet reload
6. Set darkSidePoints=1 in Force tab input → DSP Bonus shows "+2" (pips)
7. Set darkSidePoints=2 → DSP Bonus shows "+1D+1" (1 die, 1 pip)
8. Set darkSidePoints=3 → DSP Bonus shows "+3D"
9. Click "Add Dark Side Point" (starting from dsp=0):
   - DSP increments to 1 in chat card (conversion check posted)
   - Console: no errors
10. Click "Add Dark Side Point" repeatedly until dsp >= roll result to trigger consumed warning
11. Add a kept-up power "Lightsaber Combat" → appears in list
12. Add second power "Sense Force" → list shows both, action penalty note shows −2D
13. Roll an attribute → RollDialog opens with numActions input (no Force modifier shown)
14. Remove one kept-up power → list updates, penalty note decrements
15. Click roll button on Control skill in Force tab → RollDialog shows Force Difficulty Modifier input
16. Set Force modifier = 5, numActions = 1 → roll executes
17. Chat card shows: control roll total, DSP bonus applied (if dsp>0), difficulty modifier note
18. With 1 kept-up power active, roll a non-Force skill → penalty note shows 1 extra action
19. Force roll with 1 kept-up power + 2 numActions → effective penalty = 2D (1 from actions + 1 from keep-up)
20. Verify no console errors throughout
```

---

## Final Validation Checklist

- [ ] `lang/en.json` valid JSON with all `STARWARSD6.Force.*` keys
- [ ] `modules/helpers/force.mjs` exports `calculateForceDiceBonus` and `applyDarkSidePoint`
- [ ] `calculateForceDiceBonus` passes node sanity check (dsp=0,1,2,3,5)
- [ ] `CharacterData.defineSchema()` has `forceSkills` SchemaField and `keptUpPowers` ArrayField
- [ ] `CharacterData.prepareDerivedData()` sets `forceRollBonus` and `keepUpPenalty`
- [ ] `ArrayField` and `StringField` imported in `character-data.mjs`
- [ ] `applyDarkSidePoint` imported in `character-sheet.mjs`
- [ ] All four new actions registered in `DEFAULT_OPTIONS.actions`
- [ ] `forceData` context built in `_prepareContext()` (only when `forceSensitive`)
- [ ] `keepUpPenalty` added to penalty in `#rollSkill`, `#rollAttribute`, `#rollAttack`
- [ ] `#rollForceSkill` reads DSP bonus from `system.forceRollBonus`, posts chat with difficulty modifier
- [ ] `RollDialog.prompt()` accepts and passes through `isForceRoll`
- [ ] `roll-dialog.hbs` renders Force difficulty modifier input when `isForceRoll`
- [ ] Force tab nav item hidden when `!system.forceSensitive`
- [ ] Force tab section hidden when `!system.forceSensitive`
- [ ] No direct property assignment to document fields (always `actor.update()`)
- [ ] `applyDarkSidePoint` accepts `_rollFn` parameter for test injection
- [ ] No import of `rollOneDie` (not exported from dice.mjs) — uses `defaultRollFn` inline in force.mjs
- [ ] `tests/mocks/foundry.mjs` has `ArrayField: FieldStub` added
- [ ] `tests/unit/force.test.mjs` created — all `calculateForceDiceBonus` and `applyDarkSidePoint` cases pass
- [ ] `tests/unit/character-data.test.mjs` updated — `forceRollBonus` and `keepUpPenalty` cases pass
- [ ] `npm test` exits 0 (all tests pass)
- [ ] `doc/implementation-plan.md` — Phase 7 marked ✓, "current state" line updated
- [ ] `README.md` — phases 5, 6, 7 show ✅ Done

---

## Anti-Patterns to Avoid

- Do not use `context.forceSkills` for Force tab die-code fields — that key is already used for item-based Force skills on the Skills tab. Use `context.forceData.skills` instead.
- Do not normalize (clamp to max 2) the pip total when calling `rollWithWildDie` for Force rolls — let excess pips add to the total as normal.
- Do not skip keep-up penalty on attack rolls — it applies to ALL rolls.
- Do not import `rollOneDie` from dice.mjs — it is not exported. Use `new Roll("1d6").evaluate()` directly in force.mjs.
- Do not add Force skill items (isForce: true) in this phase — Force die-codes live on CharacterData fields only. Item-based Force skills shown in the Skills tab are separate legacy support.
- Do not gate the Force difficulty modifier in the chat post — always post it (even if 0) so the GM sees the intended difficulty.
- Do not add `forceSkills` or `keptUpPowers` to `NpcData` — NPCs never have Force skills.

---

**PRP Confidence Score: 9/10**

High confidence for one-pass implementation. All patterns are directly mirrored from working code already in the system (roll handlers, RollDialog, DataModel fields, chat posting). The only areas of uncertainty are:
1. The Force tab context key naming (`forceData` vs. conflicting `forceSkills`) — clearly documented in Gotcha 2.
2. The keep-up power text input in HBS (reading `.kept-up-power-input` via `this.element.querySelector`) — this is a direct DOM read inside the sheet, which is the same pattern ApplicationV2 sheets use.
