# PRP-feat015 — NPC Sheet: Attributes, Skills, and Attack Rolls

## Goal

Expand the NPC sheet to support all 6 attributes, a skills section (skill items grouped by attribute), and a weapons section with attack roll buttons. NPCs use the same wild-die roll flow and `#postAttackToChat` output as PCs, but without CP/FP spending or keep-up penalties. Wound penalties apply.

## Why

- NPCs need to roll attacks in combat, not just take hits. Without this, the GM has no dice flow for NPC weapons.
- Attributes are needed as a fallback dice pool when a skill item is absent.
- Skills are already supported as items (drag-and-drop works) but aren't displayed or rollable on the NPC sheet.
- Wound penalties must apply to NPCs for mechanical consistency with PCs.

## What

### Success Criteria

- [ ] `NpcData` has all 6 attributes (`DEX`, `KNO`, `MEC`, `PER`, `STR`, `TEC`), each with `baseValue` derived in `prepareDerivedData()`
- [ ] `NpcData.prepareDerivedData()` computes `penaltyDice` and `penaltyPips` from wound marks
- [ ] NPC sheet displays all 6 attributes with editable dice/pips inputs and a roll button per attribute, in a single combined section
- [ ] NPC sheet displays owned skill items indented under their parent attribute (same section, no separate header); no skills added by default — GM adds via drag-and-drop
- [ ] NPC sheet displays owned weapon items in a table with an attack roll button per row
- [ ] Attack roll: target selected → auto-resolve vs. target's defense (no dialog difficulty input); no target → `RollDialog` shown with `showDifficulty: true`
- [ ] Hit result posts to chat via `#postAttackToChat`-equivalent; includes "Roll Damage" button on hit with target
- [ ] Wound penalties are shown in the chat card
- [ ] `deleteItem` action removes skill/weapon items from the NPC
- [ ] All new labels have keys in `lang/en.json`; existing `STARWARSD6.Attribute.*` keys reused for attributes
- [ ] Unit test: `tests/unit/npc-data.test.mjs` covers `prepareDerivedData()` for all 6 `baseValue`s and `penaltyDice`/`penaltyPips`

---

## All Needed Context

### Key Files — Read Before Implementing

```yaml
- file: modules/actors/npc-data.mjs
  why: Current schema (only STR); extend with 5 new attributes + penaltyDice/penaltyPips in prepareDerivedData

- file: modules/apps/npc-sheet.mjs
  why: Current sheet; add _prepareContext data, 4 new actions (rollAttribute, rollSkill, rollAttack, deleteItem)

- file: templates/actors/npc-sheet.hbs
  why: Current template; add attributes, skills, weapons sections before the Defence section

- file: modules/apps/character-sheet.mjs
  why: Reference for #rollAttribute (line 218), #rollSkill (line 177), #rollAttack (line 340),
       #postAttackToChat (line 489), #postRollToChat (line 278), #buildPenaltyLines (line 259),
       #deleteItem (line 441), RANGED_SKILLS/MELEE_SKILLS (lines 381-382),
       _prepareContext attributeEntries/attributeGroups/weapons patterns (lines 54-95)

- file: modules/items/weapon-data.mjs
  why: WeaponData schema: damageDice, damagePips, attackSkill, range, weaponBonus, equipped

- file: modules/apps/roll-dialog.mjs
  why: RollDialog.prompt() signature — canSpendFP, hasFP, showDifficulty, defaultDifficulty
       NPCs do NOT pass canSpendFP/hasFP; only pass showDifficulty and defaultDifficulty

- file: lang/en.json
  why: Existing localization keys to reuse; new keys to add for NPC sections

- file: tests/unit/character-data.test.mjs
  why: Test pattern to follow — Object.create(Prototype), manual field assignment, call prepareDerivedData()

- file: doc/rules-reference.md
  why: Authoritative wound penalty formula and attribute list
```

### Codebase Tree (relevant)

```
starwarsd6/
├── modules/
│   ├── actors/
│   │   ├── npc-data.mjs        ← MODIFY: add DEX/KNO/MEC/PER/TEC + penaltyDice/penaltyPips
│   │   └── character-data.mjs  ← REFERENCE only
│   ├── apps/
│   │   ├── npc-sheet.mjs       ← MODIFY: _prepareContext + 4 new actions + private methods
│   │   └── character-sheet.mjs ← REFERENCE: copy roll methods (stripped of FP/CP/keepUp)
│   └── helpers/
│       └── dice.mjs            ← rollWithWildDie (already imported in npc-sheet via character-sheet ref)
├── templates/actors/
│   ├── npc-sheet.hbs           ← MODIFY: add attributes/skills/weapons sections
│   └── character-sheet.hbs     ← REFERENCE for table layout patterns
├── styles/starwarsd6.css       ← .sheet-body already has overflow-y: auto; no CSS changes needed
├── lang/en.json                ← MODIFY: add new keys
└── tests/unit/
    ├── npc-data.test.mjs       ← CREATE: new test file
    └── character-data.test.mjs ← REFERENCE test pattern
```

### Known Gotchas

```js
// CRITICAL: Private static methods (#rollAttack etc.) cannot be inherited across classes.
// NpcSheet must define its own private static versions. Copy verbatim, then strip:
//   - canSpendFP / hasFP from RollDialog.prompt()
//   - useForcePoint logic (no FP flag writes, no doubling)
//   - keepUpPenalty (NpcData has no keepUpPenalty field)

// CRITICAL: #buildPenaltyLines is private to CharacterSheet. Copy it into NpcSheet.
// It IS needed for NPCs (wound penalties show in chat). Signature unchanged.

// CRITICAL: Attack skill fallback attribute — RANGED_SKILLS maps to DEX, not a generic fallback.
// CharacterSheet.#rollAttack line 350: skillItem ? skillItem.system.dicePool : this.document.system.DEX.dice
// NPC must do the same. The feat file says "fall back to DEX for ranged skills" — but
// the existing code always falls back to DEX regardless of skill type.
// Replicate the existing pattern exactly: fallback is always DEX (same as CharacterSheet).

// CRITICAL: RANGED_SKILLS and MELEE_SKILLS are defined inline in CharacterSheet.#rollAttack (lines 381-382).
// Copy them inline into NpcSheet.#rollAttack. Do NOT promote to helpers/ — only 2 callers (Rule of Three).

// CRITICAL: RollDialog.prompt() for NPC rolls:
//   RollDialog.prompt({ showDifficulty: noTarget, defaultDifficulty })
// No canSpendFP, no hasFP. The dialog still supports numActions.

// CRITICAL: penaltyDice / penaltyPips formula (from doc/rules-reference.md + CharacterSheet):
//   penaltyDice = woundMarks×1 + incapMarks×2 + mortalMarks×3
//   penaltyPips = stunMarks×1
// Add to NpcData.prepareDerivedData(), NOT to the sheet.

// CRITICAL: Skills are items, not schema fields. Filter this.document.items by type === "skill"
// and group by i.system.attribute. SkillData.prepareDerivedData() already computes dicePool.

// CRITICAL: The npc-sheet.hbs currently has no "Attributes" header and no roll buttons.
// Add attributes/skills/weapons sections BEFORE the Defence section (as feat file specifies).

// CRITICAL: attributeField() helper is already defined locally in npc-data.mjs (line 5-9).
// Use it for the 5 new attributes — do not duplicate it.

// CRITICAL: CSS overflow-y: auto is already set on .starwarsd6.sheet.npc .sheet-body (line 277-281).
// No CSS changes needed.

// CRITICAL: NpcSheet currently does NOT import rollWithWildDie or RollDialog.
// Add imports at the top: rollWithWildDie from helpers/dice.mjs, RollDialog from ./roll-dialog.mjs

// CRITICAL: #postAttackToChat uses weapon.system.damageDice / weapon.system.damagePips directly.
// weapon is the Item document object, not the context proxy. Pass the full Item to the method.

// CRITICAL: Localization for attributes — reuse existing keys:
//   STARWARSD6.Attribute.DEX, .KNO, .MEC, .PER, .STR, .TEC  (already in lang/en.json)
// New keys needed:
//   STARWARSD6.NPC.Attributes  "Attributes & Skills"  ← section header for combined attr+skills section
//   STARWARSD6.NPC.Weapons     "Weapons"
//   STARWARSD6.NPC.AttackSkill "Attack Skill"
//   STARWARSD6.NPC.Formula     "Formula"
// NO separate STARWARSD6.NPC.Skills key — skills appear inline under their parent attribute row.
```

---

## Implementation Blueprint

### Step 1 — Extend `NpcData` (`modules/actors/npc-data.mjs`)

```js
// Add 5 new attribute fields to defineSchema() using existing attributeField():
static defineSchema() {
  return {
    DEX: attributeField(),   // NEW
    KNO: attributeField(),   // NEW
    MEC: attributeField(),   // NEW
    PER: attributeField(),   // NEW
    STR: attributeField(),   // already exists
    TEC: attributeField(),   // NEW
    // ... rest unchanged
  };
}

// Extend prepareDerivedData() to compute baseValue for all 6 attributes
// and add penaltyDice / penaltyPips:
prepareDerivedData() {
  const ATTR_KEYS = ["DEX", "KNO", "MEC", "PER", "STR", "TEC"];
  for (const key of ATTR_KEYS) {
    const attr = this[key];
    attr.baseValue = Math.floor(3.5 * attr.dice) + attr.pips;
  }
  this.hitBoxes = this.STR.dice;
  const { base } = calculateDamageThresholds(this.STR.dice, this.STR.pips);
  this.damageBase = base;
  // Wound penalties
  this.penaltyDice = this.woundMarks + (this.incapMarks * 2) + (this.mortalMarks * 3);
  this.penaltyPips = this.stunMarks;
}
```

### Step 2 — Update `NpcSheet._prepareContext` (`modules/apps/npc-sheet.mjs`)

```js
// Add imports at top:
import { rollWithWildDie } from "../helpers/dice.mjs";
import RollDialog from "./roll-dialog.mjs";

const ATTRIBUTE_KEYS = ["DEX", "KNO", "MEC", "PER", "STR", "TEC"];

// In _prepareContext, after existing code:
// Single combined structure: each attribute entry includes its owned skills inline.
// No separate attributeEntries array — template renders attributes and their skills together.
context.attributeGroups = ATTRIBUTE_KEYS.map(key => ({
  key,
  label: `STARWARSD6.Attribute.${key}`,
  dice: sys[key].dice,
  pips: sys[key].pips,
  baseValue: sys[key].baseValue,
  skills: this.document.items
    .filter(i => i.type === "skill" && !i.system.isForce && i.system.attribute === key)
    .map(skill => ({
      id: skill.id,
      name: skill.name,
      dicePool: skill.system.dicePool,
      pips: skill.system.pips
    }))
}));

context.weapons = this.document.items
  .filter(i => i.type === "weapon")
  .map(i => ({
    id: i.id,
    name: i.name,
    damageDice: i.system.damageDice,
    damagePips: i.system.damagePips,
    attackSkill: i.system.attackSkill,
    range: i.system.range
  }));
```

### Step 3 — Add actions to `NpcSheet` (`modules/apps/npc-sheet.mjs`)

Add to `DEFAULT_OPTIONS.actions`:
```js
actions: {
  markHitBox: NpcSheet.#markHitBox,   // already exists
  rollAttribute: NpcSheet.#rollAttribute,  // NEW
  rollSkill: NpcSheet.#rollSkill,          // NEW
  rollAttack: NpcSheet.#rollAttack,        // NEW
  deleteItem: NpcSheet.#deleteItem         // NEW
}
```

#### `#rollAttribute` — stripped PC version, no FP/CP

```js
static async #rollAttribute(event, target) {
  const attributeKey = target.dataset.attributeKey;
  const attr = this.document.system[attributeKey];
  if (!attr) return;

  const defaultDifficulty = Math.ceil(3.5 * attr.dice);
  const result = await RollDialog.prompt({ showDifficulty: true, defaultDifficulty });
  if (result === null) return;

  const { numActions, difficulty } = result;
  const penaltyDice = this.document.system.penaltyDice;
  const penaltyPips = this.document.system.penaltyPips;
  const penalty = (numActions - 1) + penaltyDice;

  const rollResult = await rollWithWildDie(attr.dice, attr.pips, penalty);
  rollResult.total = Math.max(0, rollResult.total - penaltyPips);

  const attrLabel = game.i18n.localize(`STARWARSD6.Attribute.${attributeKey}`);
  await NpcSheet.#postRollToChat(
    this.document, attrLabel, rollResult, numActions,
    { penaltyDice, penaltyPips, difficulty }
  );
}
```

#### `#rollSkill` — stripped PC version, no FP/CP

```js
static async #rollSkill(event, target) {
  const skillId = target.dataset.skillId;
  const skill = this.document.items.get(skillId);
  if (!skill) return;

  const defaultDifficulty = Math.ceil(3.5 * skill.system.dicePool);
  const result = await RollDialog.prompt({ showDifficulty: true, defaultDifficulty });
  if (result === null) return;

  const { numActions, difficulty } = result;
  const penaltyDice = this.document.system.penaltyDice;
  const penaltyPips = this.document.system.penaltyPips;
  const penalty = (numActions - 1) + penaltyDice;

  const rollResult = await rollWithWildDie(skill.system.dicePool, skill.system.pips, penalty);
  rollResult.total = Math.max(0, rollResult.total - penaltyPips);

  await NpcSheet.#postRollToChat(
    this.document, skill.name, rollResult, numActions,
    { penaltyDice, penaltyPips, difficulty }
  );
}
```

#### `#rollAttack` — copy of CharacterSheet.#rollAttack, stripped of FP/CP/keepUpPenalty

```js
static async #rollAttack(event, target) {
  const weaponId = target.dataset.weaponId;
  const weapon = this.document.items.get(weaponId);
  if (!weapon) return;

  const attackSkillName = weapon.system.attackSkill.toLowerCase();
  const skillItem = this.document.items.find(
    i => i.type === "skill" && i.name.toLowerCase() === attackSkillName
  );

  const skillDice = skillItem ? skillItem.system.dicePool : this.document.system.DEX.dice;
  const skillPips  = skillItem ? skillItem.system.pips    : this.document.system.DEX.pips;

  const targets = [...game.user.targets];
  const targetToken = targets[0];
  const targetActor = targetToken?.actor ?? null;
  const noTarget = !targetActor;

  const defaultDifficulty = noTarget ? Math.ceil(3.5 * skillDice) : 0;
  const dialogResult = await RollDialog.prompt({ showDifficulty: noTarget, defaultDifficulty });
  if (dialogResult === null) return;

  const { numActions, difficulty } = dialogResult;
  const penaltyDice = this.document.system.penaltyDice;
  const penaltyPips = this.document.system.penaltyPips;
  const totalPenalty = penaltyDice + (numActions - 1);

  const rollResult = await rollWithWildDie(skillDice, skillPips, totalPenalty);
  rollResult.total = Math.max(0, rollResult.total - penaltyPips);

  const RANGED_SKILLS = ["blaster", "starship gunnery", "starfighter piloting"];
  const MELEE_SKILLS  = ["melee combat"];
  let defenseLabel, defenseValue;

  if (noTarget) {
    defenseLabel = game.i18n.localize("STARWARSD6.Combat.Difficulty");
    defenseValue = difficulty ?? 0;
  } else if (RANGED_SKILLS.includes(attackSkillName)) {
    defenseLabel = game.i18n.localize("STARWARSD6.Combat.RangedDefense");
    defenseValue = targetActor.system.rangedDefense;
  } else if (MELEE_SKILLS.includes(attackSkillName)) {
    defenseLabel = game.i18n.localize("STARWARSD6.Combat.MeleeDefense");
    defenseValue = targetActor.system.meleeDefense;
  } else {
    defenseLabel = game.i18n.localize("STARWARSD6.Combat.BrawlingDefense");
    defenseValue = targetActor.system.brawlingDefense;
  }

  const isHit = rollResult.total >= defenseValue;
  await NpcSheet.#postAttackToChat(
    this.document, weapon, rollResult, numActions, defenseLabel, defenseValue,
    targetActor, isHit, targetToken?.id ?? null,
    { penaltyDice, penaltyPips }
  );
}
```

#### `#deleteItem`

```js
static async #deleteItem(event, target) {
  const itemId = target.closest("[data-item-id]").dataset.itemId;
  const item = this.document.items.get(itemId);
  if (!item) return;
  await item.delete();
}
```

#### `#postRollToChat` and `#postAttackToChat` — copy from CharacterSheet, class references changed

- Copy `CharacterSheet.#postRollToChat` → `NpcSheet.#postRollToChat` (change internal reference to `NpcSheet.#buildPenaltyLines`)
- Copy `CharacterSheet.#postAttackToChat` → `NpcSheet.#postAttackToChat` (change internal reference to `NpcSheet.#buildPenaltyLines`)
- Copy `CharacterSheet.#buildPenaltyLines` → `NpcSheet.#buildPenaltyLines` (identical body)
- In `#postAttackToChat`: remove the `keepUpPenalty` parameter (default it to 0 in the copied method; it will always be 0 for NPCs, but keep the parameter for signature compatibility with the body)

**The `#postAttackToChat` for NPCs omits `keepUpPenalty` in the call-site** (pass `{ penaltyDice, penaltyPips }` without `keepUpPenalty`; the method default of `keepUpPenalty = 0` handles it).

### Step 4 — Update `templates/actors/npc-sheet.hbs`

Add two sections before the existing `Defence` section (attributes and skills are **one combined section**):

**Attributes + Skills combined section** — each attribute row is followed by any skills the NPC owns under that attribute. Skills are GM-added via drag-and-drop; none appear by default.
```hbs
{{!-- Attributes & Skills Section (combined) --}}
<section class="npc-section">
  <h3>{{localize "STARWARSD6.NPC.Attributes"}}</h3>
  {{#each attributeGroups as |group|}}
    <div class="attribute-row">
      <span class="attr-label">{{localize group.label}}</span>
      <input type="number" name="system.{{group.key}}.dice" value="{{group.dice}}" min="1" />
      <span>D</span>
      <input type="number" name="system.{{group.key}}.pips" value="{{group.pips}}" min="0" max="2" />
      <span class="base-value">({{group.baseValue}})</span>
      <button type="button" data-action="rollAttribute" data-attribute-key="{{group.key}}"><i class="fas fa-dice"></i></button>
    </div>
    {{#if group.skills.length}}
      <table class="skills-table">
        <tbody>
          {{#each group.skills as |skill|}}
          <tr class="item-row skill-row" data-item-id="{{skill.id}}">
            <td class="skill-indent">{{skill.name}}</td>
            <td>{{skill.dicePool}}D{{#if skill.pips}}+{{skill.pips}}{{/if}}</td>
            <td><button type="button" data-action="rollSkill" data-skill-id="{{skill.id}}"><i class="fas fa-dice"></i></button></td>
            <td><button type="button" class="item-delete" data-action="deleteItem" data-item-id="{{skill.id}}" title="Delete">✕</button></td>
          </tr>
          {{/each}}
        </tbody>
      </table>
    {{/if}}
  {{/each}}
</section>
```

**Weapons section**:
```hbs
{{!-- Weapons Section --}}
<section class="npc-section">
  <h3>{{localize "STARWARSD6.NPC.Weapons"}}</h3>
  {{#if weapons.length}}
    <table class="inventory-table">
      <thead>
        <tr>
          <th>{{localize "STARWARSD6.Skill.Name"}}</th>
          <th>{{localize "STARWARSD6.NPC.AttackSkill"}}</th>
          <th>{{localize "STARWARSD6.NPC.Formula"}}</th>
          <th>{{localize "STARWARSD6.Item.Weapon.Damage"}}</th>
          <th>{{localize "STARWARSD6.Combat.Roll"}}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {{#each weapons as |weapon|}}
        <tr class="item-row" data-item-id="{{weapon.id}}">
          <td>{{weapon.name}}</td>
          <td>{{weapon.attackSkill}}</td>
          <td>—</td>
          <td>{{weapon.damageDice}}D{{#if weapon.damagePips}}+{{weapon.damagePips}}{{/if}}</td>
          <td><button type="button" data-action="rollAttack" data-weapon-id="{{weapon.id}}"><i class="fas fa-dice"></i></button></td>
          <td><button type="button" class="item-delete" data-action="deleteItem" data-item-id="{{weapon.id}}" title="Delete">✕</button></td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  {{else}}
    <p class="no-items">{{localize "STARWARSD6.Inventory.Empty"}}</p>
  {{/if}}
</section>
```

Note: The "Formula" column shows `—` in the template since the formula requires skill lookup (done in JS, not template). This is intentional — it matches what the feat spec shows in the table without over-engineering.

Also: **Remove the standalone `STR` section** that currently exists and merge it into the attributes table. The `STR` section (lines 8–29 of current `npc-sheet.hbs`) becomes redundant once all 6 attributes are in the table. Keep `hitBoxes` display in the table row for STR or in a separate stat block. Actually, looking at the current template, `hitBoxes` is shown in the STR section. Move it to a small stats block after the attributes table (same as character sheet's `<div class="character-stats">`).

**Revised approach**: Keep a small "stat block" after the attributes table:
```hbs
<div class="npc-row" style="margin-top: 0.5em;">
  <div class="form-group">
    <label>{{localize "STARWARSD6.Character.HitBoxes"}}</label>
    <span class="derived-value">{{system.hitBoxes}}</span>
  </div>
</div>
```

### Step 5 — Update `lang/en.json`

Add these new keys:
```json
"STARWARSD6.NPC.Attributes": "Attributes & Skills",
"STARWARSD6.NPC.Weapons": "Weapons",
"STARWARSD6.NPC.AttackSkill": "Attack Skill",
"STARWARSD6.NPC.Formula": "Formula"
```

(Keys `STARWARSD6.NPC.STR`, `STARWARSD6.NPC.Damage`, `STARWARSD6.NPC.Notes` already exist. Attribute names reuse `STARWARSD6.Attribute.*`. No separate `STARWARSD6.NPC.Skills` key needed — skills appear inline under attributes, no separate section header.)

### Step 6 — Create `tests/unit/npc-data.test.mjs`

```js
import { describe, it, expect } from "vitest";
import NpcData from "../../modules/actors/npc-data.mjs";

function makeNpcData(overrides = {}) {
  const instance = Object.create(NpcData.prototype);
  instance.DEX = { dice: 2, pips: 0 };
  instance.KNO = { dice: 2, pips: 0 };
  instance.MEC = { dice: 2, pips: 0 };
  instance.PER = { dice: 2, pips: 0 };
  instance.STR = { dice: 2, pips: 0 };
  instance.TEC = { dice: 2, pips: 0 };
  instance.stunMarks  = 0;
  instance.woundMarks = 0;
  instance.incapMarks = 0;
  instance.mortalMarks = 0;
  Object.assign(instance, overrides);
  return instance;
}

describe("NpcData.prepareDerivedData()", () => {
  describe("baseValue derivation", () => {
    it("computes baseValue for all 6 attributes", () => {
      const data = makeNpcData({
        DEX: { dice: 3, pips: 1 },
        STR: { dice: 4, pips: 2 }
      });
      data.prepareDerivedData();
      expect(data.DEX.baseValue).toBe(11); // floor(10.5)+1
      expect(data.STR.baseValue).toBe(16); // floor(14.0)+2
      expect(data.KNO.baseValue).toBe(7);  // floor(7.0)+0
    });

    it("hitBoxes = STR.dice", () => {
      const data = makeNpcData({ STR: { dice: 3, pips: 2 } });
      data.prepareDerivedData();
      expect(data.hitBoxes).toBe(3);
    });
  });

  describe("penaltyDice / penaltyPips", () => {
    it("no wounds → penaltyDice=0 penaltyPips=0", () => {
      const data = makeNpcData();
      data.prepareDerivedData();
      expect(data.penaltyDice).toBe(0);
      expect(data.penaltyPips).toBe(0);
    });

    it("1 wound mark → penaltyDice=1", () => {
      const data = makeNpcData({ woundMarks: 1 });
      data.prepareDerivedData();
      expect(data.penaltyDice).toBe(1);
    });

    it("1 incap mark → penaltyDice=2", () => {
      const data = makeNpcData({ incapMarks: 1 });
      data.prepareDerivedData();
      expect(data.penaltyDice).toBe(2);
    });

    it("1 mortal mark → penaltyDice=3", () => {
      const data = makeNpcData({ mortalMarks: 1 });
      data.prepareDerivedData();
      expect(data.penaltyDice).toBe(3);
    });

    it("combined wound/incap/mortal marks stack correctly", () => {
      const data = makeNpcData({ woundMarks: 1, incapMarks: 1, mortalMarks: 1 });
      data.prepareDerivedData();
      expect(data.penaltyDice).toBe(6); // 1+2+3
    });

    it("1 stun mark → penaltyPips=1", () => {
      const data = makeNpcData({ stunMarks: 1 });
      data.prepareDerivedData();
      expect(data.penaltyPips).toBe(1);
    });

    it("stun marks do not affect penaltyDice", () => {
      const data = makeNpcData({ stunMarks: 3 });
      data.prepareDerivedData();
      expect(data.penaltyDice).toBe(0);
      expect(data.penaltyPips).toBe(3);
    });
  });
});
```

Note: `NpcData` imports `calculateDamageThresholds` from `../helpers/damage.mjs`, which uses Foundry globals. The tests mock Foundry in `tests/setup.mjs`. Verify the mock covers `calculateDamageThresholds` dependencies, or mock that import directly if needed. Check `tests/mocks/foundry.mjs` — the existing character-data tests pass without special mocking of `calculateDamageThresholds`, so this should work.

---

## Implementation Order (Tasks)

1. **`modules/actors/npc-data.mjs`** — Add 5 attributes to `defineSchema()`, extend `prepareDerivedData()` for all 6 `baseValue`s + `penaltyDice`/`penaltyPips`
2. **`tests/unit/npc-data.test.mjs`** — Create test file; run `npm test` to verify
3. **`modules/apps/npc-sheet.mjs`** — Add imports, `ATTRIBUTE_KEYS`, update `_prepareContext`, add 4 new actions, copy private methods (`#rollAttribute`, `#rollSkill`, `#rollAttack`, `#deleteItem`, `#postRollToChat`, `#postAttackToChat`, `#buildPenaltyLines`)
4. **`templates/actors/npc-sheet.hbs`** — Replace standalone STR section with attributes table + stat block; add skills section; add weapons section; keep Defence, Damage, Thresholds, Hit Boxes, Notes
5. **`lang/en.json`** — Add 5 new keys
6. **Run tests** — `npm test`
7. **`doc/implementation-plan.md`** — Add Phase 15 entry

---

## Validation Gates

```bash
# Run all tests (must pass with 0 failures)
cd /home/perico/1_projects/101_dev/fvtt-starwarsd6
npm test

# Verify npc-data test file was created and runs
npm test -- --reporter=verbose tests/unit/npc-data.test.mjs

# Check for syntax errors (no build step — manual scan)
node --input-type=module < modules/actors/npc-data.mjs 2>&1 | head -5
node --input-type=module < modules/apps/npc-sheet.mjs 2>&1 | head -5
```

---

## Scope Boundaries (YAGNI)

- **Do NOT** promote `RANGED_SKILLS`/`MELEE_SKILLS` to `modules/helpers/` — only 2 callers (CharacterSheet, NpcSheet)
- **Do NOT** add an "equipped" toggle to weapons on the NPC sheet — NPCs don't use equip bonuses
- **Do NOT** add Force skill rolls to NPCs — feat spec is silent on this
- **Do NOT** add a "New Round" button — NPCs have no FP tracking
- **Do NOT** add tabs to the NPC sheet — flat scrollable layout is sufficient

---

**Confidence score: 9/10**

High confidence because:
- All source code and patterns are directly readable in the codebase
- The CharacterSheet roll methods are complete reference implementations
- The private static pattern is well-established
- Test structure is clear from `character-data.test.mjs`
- The only uncertainty is the `calculateDamageThresholds` mock boundary in tests — easily resolved by running the tests and fixing if needed
