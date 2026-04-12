# PRP-feat006 — Combat: Defense Values, Damage Thresholds, Hit Box Tracking

## Goal

Implement Phase 4 of the Star Wars D6 FoundryVTT system:

- Derived **defense values** (Ranged, Melee, Brawling) computed from actor skills and displayed on the sheet
- **Damage thresholds** derived from STR and used to resolve damage tier (Stun / Wound / Incapacitated / Mortally Wounded)
- **Hit box tracking** per tier — click to mark, overflow cascades to next tier
- **Tier penalties** (`penaltyDice` from wounds/incap/mortal, `penaltyPips` from stun) exposed from `prepareDerivedData()` and applied to attack rolls
- **Roll-attack flow** — pick weapon from inventory, open `RollDialog`, roll attack skill minus penalties, compare vs target defense, post result to chat
- **Manual overrides** — `armorBonus` and `weaponBonus` fields on the actor (for active armor and equipped parry weapon)

## Why

- Players need to track and apply combat state (hit boxes, wounds) during play
- Defense values must be displayed at-a-glance to speed up play
- Tier penalties from wounds feed back into skill/attribute rolls — core game loop dependency
- `rollWithWildDie` (feat004) and weapon/armor item types (feat005) are already in place — this phase wires them together into a playable combat round
- Unblocks Phase 5 (CP/FP spend) and Phase 6 (NPC sheet)

## What

### Success Criteria

- [ ] `modules/helpers/defense.mjs` exports `calculateRangedDefense(actor)`, `calculateMeleeDefense(actor)`, `calculateBrawlingDefense(actor)` — pure functions, no side effects
- [ ] `modules/helpers/damage.mjs` exports `calculateDamageThresholds(strDice, strPips)`, `resolveDamageTier(damageTotal, thresholds)`, `applyDamage(actor, tier)`
- [ ] `CharacterData.prepareDerivedData()` computes `penaltyDice`, `penaltyPips`, `rangedDefense`, `meleeDefense`, `brawlingDefense` as derived fields on `this`
- [ ] `CharacterData` schema adds `armorBonus: NumberField` and `weaponBonus: NumberField` (manual per-session overrides)
- [ ] Character sheet has a **Combat** tab (4th tab alongside Attributes / Skills / Inventory)
- [ ] Combat tab shows: defense values (Ranged / Melee / Brawling), damage thresholds table, hit boxes per tier as clickable checkboxes, current penalties
- [ ] Clicking a hit-box checkbox calls `applyDamage(actor, tier)` via a `markHitBox` sheet action — marks exactly 1 box; subsequent overflow cascades automatically
- [ ] Roll-attack button in the Combat tab (or on each weapon row) opens `RollDialog`, rolls the weapon's attack skill minus tier penalties, posts attack result to chat
- [ ] `rollDamage` (already in `dice.mjs`) used for damage rolls posted from chat
- [ ] All new user-visible strings in `lang/en.json`
- [ ] Unit tests for all pure logic in `defense.mjs` and `damage.mjs` pass (`npm test`)
- [ ] `doc/implementation-plan.md` Phase 4 marked complete

---

## All Needed Context

### Documentation & References

```yaml
- file: doc/rules-reference.md
  why: AUTHORITATIVE — Combat section (Defense Values, Damage Thresholds, Hit Boxes, Damage Effects).
       Read every formula before implementing. Key sections:
       - "Defense Values" — 3 separate formulas (Ranged/Melee/Brawling), each fallback to DEX if skill absent
       - "Damage Thresholds" — base = floor(3.5*STR_dice)+STR_pips; tier ranges from base
       - "Hit Boxes" — hit_boxes_per_tier = STR_dice (NOT STR baseValue — pips ignored)
       - "Damage Effects" table — penalty per mark per tier; overflow cascade rules
  critical: |
    Stun penalty is PIPS (flat roll penalty), NOT dice. 
    penaltyDice = woundMarks×1 + incapMarks×2 + mortalMarks×3
    penaltyPips = stunMarks×1 (subtracted from final roll total, not from dice pool)
    Overflow: marks reaching hitBoxes cascades by adding 1 mark to next tier.

- file: modules/helpers/dice.mjs
  why: rollWithWildDie(dice, pips, multipleActionPenalty) is the ONLY roll primitive.
       rollDamage(dice, pips) for weapon damage — no wild die.
       CRITICAL: multipleActionPenalty reduces DICE count. stun penalty must be applied AFTER
       rolling by subtracting from result.total. Pass penaltyDice to rollWithWildDie as
       multipleActionPenalty; subtract penaltyPips from result.total manually after.

- file: modules/actors/character-data.mjs
  why: CharacterData DataModel pattern — extend it with armorBonus, weaponBonus fields,
       and add derived computation in prepareDerivedData(). 
       CRITICAL: prepareDerivedData() already sets hitBoxes = this.STR.dice and baseValues.
       Append to this method — call defense helpers here, compute penaltyDice/penaltyPips.
       Defense helpers need actor.items access — use `this.parent.items` (parent = Actor).

- file: modules/items/weapon-data.mjs
  why: WeaponData has damageDice, damagePips, attackSkill (string), weaponBonus, range.
       attackSkill is a lowercase skill name string (e.g. "blaster", "melee combat", "brawling").
       This string is used to find the matching skill item on the actor.

- file: modules/items/armor-data.mjs
  why: ArmorData has armorBonus (number). The ACTOR's armorBonus field is a manual override
       (user inputs the value from worn armor). Do NOT sum all armor items automatically.

- file: modules/actors/character.mjs
  why: CharacterActor._onCreate creates default skill items. Skill names are Title Case
       ("Dodge", "Melee Parry", "Brawling Parry"). Match case-insensitively when looking up.

- file: modules/apps/character-sheet.mjs
  why: MIRROR this pattern for new combat tab + roll-attack + markHitBox actions.
       actions in DEFAULT_OPTIONS must map to static methods.
       _prepareContext builds context object passed to HBS template.
       submitOnChange is already true — direct number inputs persist automatically.

- file: modules/apps/roll-dialog.mjs
  why: RollDialog.prompt() returns Promise<{ numActions }|null>. Reuse as-is.

- file: templates/actors/character-sheet.hbs
  why: Tab navigation pattern — copy the existing tab structure for the new "combat" tab.
       data-action="markHitBox" data-tier="stun" data-index="0" pattern for hit boxes.
       data-action="rollAttack" data-weapon-id="{{weapon.id}}" for attack roll buttons.

- file: tests/unit/character-data.test.mjs
  why: Test pattern — use Object.create(Class.prototype) + manual property assignment 
       to build instances for unit testing prepareDerivedData() without Foundry.
       Copy this pattern for defense.mjs and damage.mjs tests.

- file: tests/unit/dice.test.mjs
  why: Test pattern for pure functions — makeMockRoll sequence, vi.fn(), describe/it/expect.

- file: tests/mocks/foundry.mjs
  why: Foundry mock for unit tests. defense.mjs and damage.mjs are pure functions with
       no Foundry API calls — no mock additions needed for unit tests.
       applyDamage(actor, tier) calls actor.update() — mock actor in test.

- url: https://foundryvtt.com/api/v13/classes/foundry.applications.api.ApplicationV2.html
  why: ApplicationV2 actions pattern — static handlers, _prepareContext, _onRender.

- url: https://foundryvtt.com/api/v13/classes/foundry.abstract.TypeDataModel.html
  why: TypeDataModel.prepareDerivedData() lifecycle — called after schema fields are set.
       `this.parent` is the owning Document (the Actor). `this.parent.items` is the EmbeddedCollection.
```

### Current Codebase Tree

```
starwarsd6/
├── system.json
├── starwarsd6.mjs                         # Entry point — no changes needed
├── modules/
│   ├── actors/
│   │   ├── character-data.mjs             # MODIFY: add armorBonus/weaponBonus fields, derived defense/penalty
│   │   └── character.mjs                  # No change
│   ├── items/
│   │   ├── skill-data.mjs                 # No change
│   │   ├── skill.mjs                      # No change
│   │   ├── weapon-data.mjs                # No change (damageDice, damagePips, attackSkill, weaponBonus, range)
│   │   ├── armor-data.mjs                 # No change (armorBonus)
│   │   └── equipment-data.mjs             # No change
│   ├── apps/
│   │   ├── character-sheet.mjs            # MODIFY: add combat tab, rollAttack + markHitBox actions
│   │   ├── roll-dialog.mjs                # No change
│   │   ├── skill-sheet.mjs                # No change
│   │   └── item-sheet.mjs                 # No change
│   └── helpers/
│       └── dice.mjs                       # No change
├── templates/
│   └── actors/
│       └── character-sheet.hbs            # MODIFY: add combat tab section
├── styles/
│   └── starwarsd6.css                     # MODIFY: add combat tab styles
├── lang/
│   └── en.json                            # MODIFY: add combat labels
└── tests/
    ├── mocks/foundry.mjs                  # No change
    ├── setup.mjs                          # No change
    └── unit/
        ├── character-data.test.mjs        # No change
        ├── skill-data.test.mjs            # No change
        ├── dice.test.mjs                  # No change
        ├── item-types.test.mjs            # No change
        ├── defense.test.mjs               # CREATE: tests for calculateRangedDefense etc.
        └── damage.test.mjs                # CREATE: tests for calculateDamageThresholds etc.
```

### Desired Codebase Tree (additions / changes)

```
modules/helpers/defense.mjs   ← CREATE: 3 pure defense calculators
modules/helpers/damage.mjs    ← CREATE: threshold calc, tier resolver, applyDamage
tests/unit/defense.test.mjs   ← CREATE
tests/unit/damage.test.mjs    ← CREATE
```

### Known Gotchas

```js
// CRITICAL: Skill lookup by name is CASE-INSENSITIVE
// actor.items stores skill items with Title Case names ("Dodge", "Melee Parry")
// weapon.attackSkill is lowercase ("blaster", "melee combat")
// Always: actor.items.find(i => i.type === "skill" && i.name.toLowerCase() === targetName)

// CRITICAL: Fallback logic for defense when skill is absent
// If no "dodge" skill item → fall back to DEX attribute (actor.system.DEX)
// If no "melee parry" skill item → fall back to DEX attribute
// If no "brawling parry" skill item → fall back to DEX attribute

// CRITICAL: armorBonus and weaponBonus are on the ACTOR (actor.system.armorBonus)
// NOT summed from items. The user manually sets these when equipping gear.

// CRITICAL: stun penalty is SUBTRACTED FROM TOTAL, not from dice
// rollWithWildDie(dice - penaltyDice, pips, 0) then subtract penaltyPips from result.total
// OR: pass penaltyDice as multipleActionPenalty, then subtract penaltyPips from result.total after
// Simplest: rollWithWildDie(dice, pips, penaltyDice) subtracts from dice, then result.total -= penaltyPips

// CRITICAL: applyDamage overflow cascade uses actor.update() — NEVER direct assignment
// The cascade logic runs in pure JS first (compute new mark values), THEN one actor.update() call.
// Do NOT call actor.update() multiple times — compute final state first.

// CRITICAL: this.parent in TypeDataModel = Actor document
// In CharacterData.prepareDerivedData(), calling defense helpers requires passing `this.parent`
// as the actor argument, since `this` is the CharacterData instance, not the Actor.
// BUT: `this.parent` may be null during schema validation (e.g. item creation without actor context).
// Guard: if (!this.parent) skip defense computation.

// CRITICAL: hit box checkboxes are visual only — the SOURCE OF TRUTH is the mark fields
// Do NOT bind hit boxes as HTML checkboxes with name= attributes (that would overwrite marks on submit).
// Use data-action="markHitBox" buttons styled as checkboxes — clicking fires an action handler.
// Render "checked" state based on: index < system.stunMarks (etc).

// CRITICAL: penaltyDice reduces the effective dice pool, not numActions
// rollWithWildDie's 3rd arg is the multipleActionPenalty (reduces dice count).
// For combat rolls, pass penaltyDice directly as multipleActionPenalty.
// numActions from RollDialog is ADDITIVE on top of penaltyDice:
// totalPenalty = penaltyDice + (numActions - 1)

// CRITICAL: weapon.attackSkill maps to defense type:
// blaster, starship gunnery → Ranged Defense
// melee combat              → Melee Defense
// brawling                  → Brawling Defense
// This mapping drives which defense value to show in the attack chat message.
```

---

## Implementation Blueprint

### Data Models and Structure

```js
// defense.mjs — pure functions, no Foundry API calls except actor.items / actor.system
export function calculateRangedDefense(actor) {
  // 1. Find dodge skill item (case-insensitive)
  const dodge = actor.items.find(i => i.type === "skill" && i.name.toLowerCase() === "dodge");
  const dice  = dodge ? dodge.system.dicePool : actor.system.DEX.dice;
  const pips  = dodge ? dodge.system.pips     : actor.system.DEX.pips;
  return Math.floor(3.5 * dice) + pips + actor.system.armorBonus;
}

export function calculateMeleeDefense(actor) {
  const skill = actor.items.find(i => i.type === "skill" && i.name.toLowerCase() === "melee parry");
  const dice  = skill ? skill.system.dicePool : actor.system.DEX.dice;
  const pips  = skill ? skill.system.pips     : actor.system.DEX.pips;
  return Math.floor(3.5 * dice) + pips + actor.system.weaponBonus;
}

export function calculateBrawlingDefense(actor) {
  const skill = actor.items.find(i => i.type === "skill" && i.name.toLowerCase() === "brawling parry");
  const dice  = skill ? skill.system.dicePool : actor.system.DEX.dice;
  const pips  = skill ? skill.system.pips     : actor.system.DEX.pips;
  return Math.floor(3.5 * dice) + pips;
  // No equipment bonus for brawling defense
}

// damage.mjs
export function calculateDamageThresholds(strDice, strPips) {
  const base = Math.floor(3.5 * strDice) + strPips;
  return { base };
  // Usage: stun < base, wound [base, 2*base), incap [2*base, 3*base), mortal >= 3*base
}

export function resolveDamageTier(damageTotal, base) {
  if (damageTotal < base)         return "stun";
  if (damageTotal < 2 * base)     return "wound";
  if (damageTotal < 3 * base)     return "incap";
  return "mortal";
}

export async function applyDamage(actor, tier) {
  // Compute new marks — handle overflow cascade
  const system   = actor.system;
  const hitBoxes = system.hitBoxes; // = STR.dice

  let { stunMarks, woundMarks, incapMarks, mortalMarks } = system;

  if (tier === "stun") {
    stunMarks++;
    if (stunMarks >= hitBoxes) { stunMarks = hitBoxes; woundMarks++; }
  } else if (tier === "wound") {
    woundMarks++;
  } else if (tier === "incap") {
    incapMarks++;
  } else if (tier === "mortal") {
    mortalMarks++;
  }
  // Each tier checks overflow into next
  if (woundMarks >= hitBoxes)  { woundMarks  = hitBoxes; incapMarks++; }
  if (incapMarks >= hitBoxes)  { incapMarks  = hitBoxes; mortalMarks++; }
  // mortalMarks overflow = dead (cap at hitBoxes, GM narrates death)
  mortalMarks = Math.min(mortalMarks, hitBoxes);

  await actor.update({
    "system.stunMarks":   stunMarks,
    "system.woundMarks":  woundMarks,
    "system.incapMarks":  incapMarks,
    "system.mortalMarks": mortalMarks
  });
}

// character-data.mjs — additions to prepareDerivedData()
// penaltyDice = woundMarks*1 + incapMarks*2 + mortalMarks*3
// penaltyPips = stunMarks*1
// Defense values require actor reference (this.parent) — guard against null
```

### List of Tasks

```yaml
Task 1 — CREATE modules/helpers/defense.mjs:
  - Export calculateRangedDefense(actor), calculateMeleeDefense(actor), calculateBrawlingDefense(actor)
  - Pure functions — find skill item by type="skill" and name match (case-insensitive), fallback to DEX
  - armorBonus from actor.system.armorBonus (Ranged only), weaponBonus from actor.system.weaponBonus (Melee only)
  - PATTERN: Similar to standalone pure helpers — no imports from Foundry globals

Task 2 — CREATE modules/helpers/damage.mjs:
  - Export calculateDamageThresholds(strDice, strPips) → { base }
  - Export resolveDamageTier(damageTotal, base) → "stun"|"wound"|"incap"|"mortal"
  - Export applyDamage(actor, tier) — compute cascade in pure JS then ONE actor.update() call
  - Overflow: stun→wound, wound→incap, incap→mortal; mortalMarks capped at hitBoxes

Task 3 — MODIFY modules/actors/character-data.mjs:
  - ADD to defineSchema(): armorBonus and weaponBonus NumberFields (min: 0, initial: 0)
  - ADD to prepareDerivedData(): compute penaltyDice and penaltyPips from mark fields
  - ADD to prepareDerivedData(): if (this.parent) compute this.rangedDefense, this.meleeDefense, this.brawlingDefense
    by calling the three defense helpers — import them at top of file
  - Guard: if (!this.parent) set defense values to 0 (schema validation context)
  - KEEP existing baseValue and hitBoxes logic unchanged

Task 4 — MODIFY modules/apps/character-sheet.mjs:
  - ADD "combat" tab to tabGroups default: tabGroups = { primary: "attributes" } stays, tab is added to template
  - ADD actions to DEFAULT_OPTIONS: rollAttack: CharacterSheet.#rollAttack, markHitBox: CharacterSheet.#markHitBox
  - ADD combat context to _prepareContext():
      context.combatData = {
        rangedDefense:   this.document.system.rangedDefense,
        meleeDefense:    this.document.system.meleeDefense,
        brawlingDefense: this.document.system.brawlingDefense,
        penaltyDice:     this.document.system.penaltyDice,
        penaltyPips:     this.document.system.penaltyPips,
        hitBoxes:        this.document.system.hitBoxes,
        stunMarks:       this.document.system.stunMarks,
        woundMarks:      this.document.system.woundMarks,
        incapMarks:      this.document.system.incapMarks,
        mortalMarks:     this.document.system.mortalMarks,
        weapons:         context.weapons   // already computed above
      }
  - ADD #rollAttack(event, target):
      1. Get weaponId from target.dataset.weaponId
      2. Get weapon item from this.document.items
      3. Find attack skill item by name match (weapon.system.attackSkill)
         — fallback to DEX if not found
      4. RollDialog.prompt() → { numActions } or null
      5. Compute totalPenaltyDice = penaltyDice + (numActions - 1)
      6. rollWithWildDie(skillDice, skillPips, totalPenaltyDice) → attackResult
         — then subtract penaltyPips from attackResult.total
      7. Post to chat with attack label, weapon name, final total
  - ADD #markHitBox(event, target):
      1. Get tier from target.dataset.tier ("stun"|"wound"|"incap"|"mortal")
      2. Import applyDamage from damage.mjs; call applyDamage(this.document, tier)

Task 5 — MODIFY templates/actors/character-sheet.hbs:
  - ADD "Combat" tab link to <nav class="sheet-tabs">
  - ADD <section class="tab" data-tab="combat"> with:
      - Defense values table (Ranged / Melee / Brawling)
      - Penalties display (penaltyDice, penaltyPips)
      - Hit box rows per tier: Stun, Wound, Incapacitated, Mortally Wounded
        Each row: tier label + N checkbox-style buttons using data-action="markHitBox" data-tier="..."
        Checked state: {{#if (lt index ../system.stunMarks)}}checked{{/if}} — use index helper or
        build a helper array in context (e.g. hitBoxArray = Array.from({length: hitBoxes}, (_, i) => i))
      - Attack roll section — list weapons with roll button:
        data-action="rollAttack" data-weapon-id="{{weapon.id}}"
  - PATTERN: Follow existing tab section structure exactly

Task 6 — MODIFY lang/en.json:
  - ADD all new i18n keys for combat tab labels, defense values, tier names, penalties
  - See key list in pseudocode section below

Task 7 — CREATE tests/unit/defense.test.mjs:
  - PATTERN: Object.create(prototype) style (no Foundry DataModel construction needed)
  - Build mock actor with { system: { DEX: {dice, pips}, armorBonus, weaponBonus }, items: [...] }
  - Test all three defense functions with:
    - Skill present / skill absent (fallback to DEX)
    - Various dice + pip combinations
    - armorBonus / weaponBonus applied correctly
    - Brawling has no equipment bonus

Task 8 — CREATE tests/unit/damage.test.mjs:
  - Test calculateDamageThresholds: base = floor(3.5*strDice)+strPips
  - Test resolveDamageTier: boundary conditions at base, 2*base, 3*base
  - Test applyDamage: stun marks, overflow to wound, wound overflow to incap, incap to mortal
    Use a mock actor: { system: {...marks, hitBoxes}, update: vi.fn() }
    Verify actor.update() called once with correct values
  - Test applyDamage mortal cap at hitBoxes

Task 9 — Verify npm test passes:
  Run: npm test
  Expected: all test files pass including defense.test.mjs and damage.test.mjs
```

### Per-Task Pseudocode

```js
// ===== Task 3: character-data.mjs additions =====
// At top:
import { calculateRangedDefense, calculateMeleeDefense, calculateBrawlingDefense } from "../helpers/defense.mjs";

// In prepareDerivedData(), AFTER existing baseValue/hitBoxes logic:
this.penaltyDice = this.woundMarks * 1 + this.incapMarks * 2 + this.mortalMarks * 3;
this.penaltyPips = this.stunMarks * 1;

if (this.parent) {
  this.rangedDefense   = calculateRangedDefense(this.parent);
  this.meleeDefense    = calculateMeleeDefense(this.parent);
  this.brawlingDefense = calculateBrawlingDefense(this.parent);
} else {
  this.rangedDefense   = 0;
  this.meleeDefense    = 0;
  this.brawlingDefense = 0;
}

// ===== Task 4: #rollAttack pseudocode =====
static async #rollAttack(event, target) {
  const weaponId = target.dataset.weaponId;
  const weapon   = this.document.items.get(weaponId);
  if (!weapon) return;

  // Find attack skill item (case-insensitive name match)
  const attackSkillName = weapon.system.attackSkill.toLowerCase();
  const skillItem = this.document.items.find(
    i => i.type === "skill" && i.name.toLowerCase() === attackSkillName
  );

  const skillDice = skillItem ? skillItem.system.dicePool : this.document.system.DEX.dice;
  const skillPips = skillItem ? skillItem.system.pips     : this.document.system.DEX.pips;

  const dialogResult = await RollDialog.prompt();
  if (dialogResult === null) return;

  const { numActions } = dialogResult;
  const penaltyDice   = this.document.system.penaltyDice;
  const penaltyPips   = this.document.system.penaltyPips;
  const totalPenalty  = penaltyDice + (numActions - 1);

  const rollResult    = await rollWithWildDie(skillDice, skillPips, totalPenalty);
  rollResult.total    = Math.max(0, rollResult.total - penaltyPips); // stun penalty

  // Determine defense type for display in chat
  const RANGED_SKILLS = ["blaster", "starship gunnery", "starfighter piloting"];
  const MELEE_SKILLS  = ["melee combat"];
  // brawling is default
  let defenseLabel, defenseValue;
  if (RANGED_SKILLS.includes(weapon.system.attackSkill.toLowerCase())) {
    defenseLabel = game.i18n.localize("STARWARSD6.Combat.RangedDefense");
    defenseValue = this.document.system.rangedDefense;
  } else if (MELEE_SKILLS.includes(weapon.system.attackSkill.toLowerCase())) {
    defenseLabel = game.i18n.localize("STARWARSD6.Combat.MeleeDefense");
    defenseValue = this.document.system.meleeDefense;
  } else {
    defenseLabel = game.i18n.localize("STARWARSD6.Combat.BrawlingDefense");
    defenseValue = this.document.system.brawlingDefense;
  }

  await CharacterSheet.#postAttackToChat(
    this.document, weapon.name, rollResult, numActions, defenseLabel, defenseValue
  );
}

// ===== Task 4: #markHitBox pseudocode =====
static async #markHitBox(event, target) {
  const tier = target.dataset.tier; // "stun"|"wound"|"incap"|"mortal"
  await applyDamage(this.document, tier);
}

// ===== Task 5: HBS hit-box rendering pattern =====
// In _prepareContext, build helper arrays for each tier:
context.combatData.stunBoxes    = buildBoxArray(hitBoxes, stunMarks);
context.combatData.woundBoxes   = buildBoxArray(hitBoxes, woundMarks);
context.combatData.incapBoxes   = buildBoxArray(hitBoxes, incapMarks);
context.combatData.mortalBoxes  = buildBoxArray(hitBoxes, mortalMarks);

// Helper (local to _prepareContext, not exported):
function buildBoxArray(hitBoxes, marks) {
  return Array.from({ length: hitBoxes }, (_, i) => ({ index: i, marked: i < marks }));
}

// In HBS template:
// {{#each combatData.stunBoxes as |box|}}
//   <button type="button" class="hit-box {{#if box.marked}}marked{{/if}}"
//           data-action="markHitBox" data-tier="stun">
//   </button>
// {{/each}}

// ===== Task 6: New i18n keys =====
// "STARWARSD6.Tab.Combat": "Combat"
// "STARWARSD6.Combat.Defense": "Defense"
// "STARWARSD6.Combat.RangedDefense": "Ranged Defense"
// "STARWARSD6.Combat.MeleeDefense": "Melee Defense"
// "STARWARSD6.Combat.BrawlingDefense": "Brawling Defense"
// "STARWARSD6.Combat.ArmorBonus": "Armor Bonus"
// "STARWARSD6.Combat.WeaponBonus": "Weapon Bonus"
// "STARWARSD6.Combat.Penalties": "Wound Penalties"
// "STARWARSD6.Combat.PenaltyDice": "Penalty Dice"
// "STARWARSD6.Combat.PenaltyPips": "Penalty Pips (from Stun)"
// "STARWARSD6.Combat.HitBoxes": "Hit Boxes"
// "STARWARSD6.Combat.Stun": "Stun"
// "STARWARSD6.Combat.Wound": "Wound"
// "STARWARSD6.Combat.Incap": "Incapacitated"
// "STARWARSD6.Combat.Mortal": "Mortally Wounded"
// "STARWARSD6.Combat.AttackRoll": "Attack Roll"
// "STARWARSD6.Combat.Roll": "Roll Attack"
// "STARWARSD6.Combat.Weapons": "Weapons"
// "STARWARSD6.Combat.AttackVsDefense": "vs"
```

### Integration Points

```yaml
IMPORTS:
  - modules/helpers/defense.mjs: imported in character-data.mjs (for prepareDerivedData)
  - modules/helpers/damage.mjs: imported in character-sheet.mjs (for #markHitBox)
  - Both new helper files follow the "one export per file" rule — EXCEPT defense.mjs which
    exports three functions. All three are tightly coupled (same module, same data source) —
    acceptable as a group export since they share no logic with other feature areas.

SCHEMA CHANGES:
  - character-data.mjs adds armorBonus and weaponBonus fields
  - Existing actor documents without these fields get initial: 0 (DataModel default migration)
  - No system.json version bump needed for additive field changes in Foundry v13

STARWARSD6.MJS:
  - No changes needed — defense.mjs and damage.mjs are imported by existing files,
    not registered globally.
```

---

## Validation Loop

### Level 1: Syntax Check (run after each file is written)

```bash
# Foundry uses ESM — verify no syntax errors with Node's module check
node --input-type=module < modules/helpers/defense.mjs
node --input-type=module < modules/helpers/damage.mjs
# Expected: no output (no syntax errors)
# If error: READ the error line, fix the syntax, re-run

# For files that reference Foundry globals (character-data.mjs, character-sheet.mjs):
# Syntax errors will surface in tests — run npm test after each file change
```

### Level 2: Unit Tests

```bash
npm test
# Expected: all test files pass (defense.test.mjs and damage.test.mjs included)
# If failing: READ the error message carefully:
#   - "Cannot find module" → check import paths (use relative .mjs extension)
#   - "TypeError: X is not a function" → check export names match imports
#   - "Expected Y but received Z" → check formula — re-read doc/rules-reference.md
# Never mock logic to force tests to pass — fix the implementation
```

### Level 3: Manual Validation in Foundry (after deploy)

```
1. Open a character sheet → Combat tab visible
2. Verify defense values display: character with Dodge 3D+2 + armorBonus 1 → Ranged Defense = 13
3. Mark a Stun hit box → stunMarks increments by 1; sheet re-renders
4. Fill all stun hit boxes (equal to STR dice) → overflow: woundMarks increments by 1
5. Roll attack on a weapon → RollDialog opens, roll result posted to chat with penalty applied
6. With 2 wound marks on a 3D blaster roll: effective = 3-2=1D, result posted correctly
```

### Final Validation Checklist

- [ ] `npm test` passes — all tests green including new defense.test.mjs and damage.test.mjs
- [ ] No syntax errors in new .mjs files
- [ ] Defense formulas match doc/rules-reference.md exactly (including fallback to DEX)
- [ ] Stun penalty applied to roll TOTAL (not dice count reduction)
- [ ] Hit box overflow cascade works: stun→wound→incap→mortal
- [ ] `applyDamage` makes exactly ONE `actor.update()` call
- [ ] `armorBonus` and `weaponBonus` fields editable on combat tab and persist
- [ ] All new i18n keys in lang/en.json — no raw key strings visible in UI
- [ ] `doc/implementation-plan.md` Phase 4 marked complete

---

## Anti-Patterns to Avoid

- Never assign `actor.system.stunMarks = X` directly — always `actor.update({"system.stunMarks": X})`
- Never call `actor.update()` multiple times in cascade — compute all final values first, one update
- Never import Foundry globals (`Roll`, `game`, `Actor`, `Item`, `ChatMessage`) — they are globals
- Never skip the `if (!this.parent)` guard in `prepareDerivedData()` — called during item embed validation too
- Never use `mergeObject` or `duplicate` — deprecated in v13
- Never add `rollDamage` import to character-sheet.mjs without using it — YAGNI
- Never create a helper for `buildBoxArray` in a separate file — it has one caller, keep it local
