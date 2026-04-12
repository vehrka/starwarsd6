# PRP-feat004 — Base Dice Engine

## Goal

Implement Phase 2 of the Star Wars D6 FoundryVTT system: clicking a skill or attribute on the character sheet opens a roll dialog, performs a Wild Die roll (with chaining on 6, complication flag on 1), and posts a styled result to chat. Includes unit tests for all pure dice logic.

## Why

- Players need to roll skills/attributes from the sheet to play the game
- Wild Die is the core mechanic of the D6 system — complication/explosion must be represented
- Multiple Actions penalty reduces dice per extra action — must be supported from the dialog
- This is the foundation for Phase 4 (Combat), Phase 5 (CP/FP), and Phase 7 (Force)

## What

### Success Criteria

- [ ] `modules/helpers/dice.mjs` exports `rollWithWildDie(dice, pips, multipleActionPenalty)` returning `Promise<RollResult>`
- [ ] `modules/helpers/dice.mjs` exports `rollDamage(dice, pips)` returning `Promise<number>`
- [ ] `RollResult` shape: `{ total, normalDice, wildRolls, isComplication, pips }`
- [ ] Wild die 6 → explodes (chain: add 6, reroll until non-6)
- [ ] Wild die 1 → `isComplication: true`, add 1 to total (default rule per rules-reference.md)
- [ ] Multiple action penalty: `effective = max(1, dice - penalty)`; at minimum 1 die total (= wild die only)
- [ ] `modules/apps/roll-dialog.mjs` exports `RollDialog` — ApplicationV2, shows number-of-actions input (1–4), returns `{ numActions }` or `null` on cancel
- [ ] `CharacterSheet` gains `rollSkill` and `rollAttribute` static action handlers
- [ ] Clicking a skill row on the sheet opens `RollDialog`, then rolls and posts to chat
- [ ] Clicking an attribute row on the sheet opens `RollDialog`, then rolls and posts to chat
- [ ] Chat message includes: formula, normal dice totals, wild die chain, complication/explosion markers
- [ ] New i18n keys added to `lang/en.json`
- [ ] Unit tests cover all dice logic branches (normal, wild=1, wild=6 chain, penalty)
- [ ] `npm test` passes with all tests green
- [ ] `doc/implementation-plan.md` updated: Phase 2 marked complete

---

## All Needed Context

### Documentation & References

```yaml
- url: https://foundryvtt.com/api/v13/classes/foundry.dice.Roll.html
  why: Roll constructor, evaluate(), toMessage() — these are the Foundry globals used for rolling.
       Key: `new Roll("2d6").evaluate()` is async. `roll.toMessage({ speaker, flavor })` posts to chat.
       Roll is a global — never import it.

- url: https://foundryvtt.com/api/v13/classes/foundry.applications.api.ApplicationV2.html
  why: ApplicationV2 lifecycle — render(), close(), _prepareContext(), _onRender().
       Static actions pattern: actions defined in DEFAULT_OPTIONS, handlers are static private methods.

- file: ref/dnd5e/module/dice/basic-roll.mjs
  why: Shows Roll usage pattern — `new Roll(formula).evaluate()`, toMessage() with speaker/flavor.
       NOTE: We do NOT extend Roll — we use plain Roll instances and compose them.

- file: ref/dnd5e/module/applications/dice/roll-configuration-dialog.mjs
  why: Pattern for a dialog that wraps ApplicationV2, accepts form input, resolves a Promise.
       Our RollDialog is simpler — it only needs a numActions input and OK/Cancel buttons.
       Key pattern: static async `prompt()` method returns a Promise, resolved by form submit.

- file: modules/apps/character-sheet.mjs
  why: Existing CharacterSheet — ADD static #rollSkill/#rollAttribute action handlers here.
       Sheet already uses DEFAULT_OPTIONS.form.submitOnChange pattern.
       CRITICAL: actions in DEFAULT_OPTIONS must be an object mapping name→static handler.

- file: modules/apps/skill-sheet.mjs
  why: Reference for ApplicationV2 sheet structure in this project (simple, no-frills).

- file: templates/actors/character-sheet.hbs
  why: Must add data-action="rollSkill" data-skill-id buttons to skills table rows.
       Must add data-action="rollAttribute" data-attribute-key buttons to attributes table rows.
       Currently uses {{skill.id}} for item IDs — use same pattern.

- file: doc/rules-reference.md
  why: Wild Die rules (section "The Wild Die"): 1=complication+add1, 6=chain, 2-5=normal.
       Multiple Actions: effective = base − (numActions−1)D per roll. Min effective dice = 1.

- file: tests/mocks/foundry.mjs
  why: Existing Foundry mock — must NOT add Roll stub here (Roll is only used at runtime in Foundry,
       not in pure unit tests). Dice logic tests mock Roll internally using vi.fn() / vi.spyOn.

- file: tests/setup.mjs
  why: Runs before every test. Currently only sets globalThis.foundry. No changes needed.

- file: tests/unit/character-data.test.mjs
  why: Reference for test style — describe/it/expect, Object.create(prototype) pattern for instances.

- file: lang/en.json
  why: Add new keys for RollDialog labels and chat card labels. Existing keys already cover skills/attrs.

- file: doc/implementation-plan.md
  why: Update Phase 2 status to ✓ complete after implementation.
```

### Current Codebase Tree

```
fvtt-starwarsd6/
├── system.json
├── starwarsd6.mjs                          ← import RollDialog? NO — not registered globally; used in sheet
├── package.json                            ← vitest already configured
├── vitest.config.mjs
├── modules/
│   ├── actors/
│   │   ├── character-data.mjs
│   │   └── character.mjs
│   ├── items/
│   │   ├── skill-data.mjs
│   │   └── skill.mjs
│   └── apps/
│       ├── character-sheet.mjs             ← ADD actions + roll handlers
│       └── skill-sheet.mjs
├── templates/
│   ├── actors/
│   │   └── character-sheet.hbs             ← ADD roll buttons
│   └── items/
│       └── skill-sheet.hbs
├── styles/
│   └── starwarsd6.css
├── lang/
│   └── en.json                             ← ADD new i18n keys
├── tests/
│   ├── setup.mjs
│   ├── mocks/foundry.mjs
│   └── unit/
│       ├── character-data.test.mjs
│       └── skill-data.test.mjs
└── doc/
    └── implementation-plan.md
```

### Desired Codebase Tree (after feat004)

```
fvtt-starwarsd6/
├── modules/
│   └── helpers/
│       └── dice.mjs                        ← NEW: rollWithWildDie, rollDamage
│   └── apps/
│       ├── character-sheet.mjs             ← MODIFIED: actions + roll handlers
│       └── roll-dialog.mjs                 ← NEW: RollDialog
├── templates/
│   ├── actors/
│   │   └── character-sheet.hbs             ← MODIFIED: roll buttons on skills + attrs
│   └── dice/
│       └── roll-dialog.hbs                 ← NEW: dialog template
├── lang/
│   └── en.json                             ← MODIFIED: new keys
├── tests/
│   └── unit/
│       └── dice.test.mjs                   ← NEW: unit tests for dice logic
└── doc/
    └── implementation-plan.md              ← MODIFIED: Phase 2 ✓
```

---

## Known Gotchas & Critical Constraints

```js
// CRITICAL: Roll is a Foundry global — NEVER import it. Access as `Roll` directly.
// Same for: game, CONFIG, Hooks, Actor, Item, ChatMessage, ui.
// All these are available as globals at runtime in Foundry but don't exist in Node (tests).

// CRITICAL: Roll("1d6").evaluate() is async in Foundry v13. Always await it.
// Pattern: const roll = await new Roll("1d6").evaluate();
// Access result: roll.total (number), roll.terms[0].results (array of {result, active} objects)

// CRITICAL: Wild Die is always 1 die — roll separately from normal dice.
// If effective = 3 (after penalty), split as: 2 normal d6 + 1 wild d6.
// If effective = 1 (minimum), split as: 0 normal d6 + 1 wild d6 (wild die alone).

// CRITICAL: Wild die chain on 6 — each individual 1d6 roll is a separate Roll() call.
// Store all intermediate wild results in an array (wildRolls: number[]).
// wildTotal = sum of all wildRolls.
// total = sum(normalDice) + wildTotal + pips

// CRITICAL: Wild die result 1 → isComplication = true, add 1 to total normally.
// Per rules-reference.md: "add 1 to total normally but a complication occurs."
// The GM decides the narrative complication — we just flag it.

// CRITICAL: multipleActionPenalty = numActions - 1.
// effective = Math.max(1, dice - multipleActionPenalty).
// If effective = 1 → no normal dice, wild die only. Still possible to get a total.

// CRITICAL: rollDamage does NOT use the wild die. Pure: new Roll(`${dice}d6 + ${pips}`).evaluate().
// Damage rolls are for Phase 4 — include the function now but it's not wired to the sheet yet.

// CRITICAL: RollDialog must return a Promise<{ numActions: number } | null>.
// Pattern: static async prompt() { return new Promise(resolve => { ... }); }
// On form submit → resolve({ numActions: parseInt(input.value) })
// On window close without submit → resolve(null)
// Check for null in the sheet handler and abort roll if user cancelled.

// CRITICAL: ApplicationV2 actions are defined as static methods referenced in DEFAULT_OPTIONS:
// static DEFAULT_OPTIONS = { actions: { rollSkill: CharacterSheet.#rollSkill } }
// Private static methods are referenced via ClassName.#methodName in the class body.
// The handler receives (event, target) — target is the element with data-action.
// Access data attributes via: target.dataset.skillId or target.closest("[data-skill-id]").dataset.skillId

// CRITICAL: CharacterSheet actions that open a dialog must be async:
// static async #rollSkill(event, target) { ... }

// CRITICAL: In the sheet handler, get the actor from `this.document` (not from game.actors).
// `this` inside a static action handler is the ApplicationV2 instance (the sheet).

// CRITICAL: Chat message with Roll result — use Roll.toMessage() for dice animation in Foundry:
// await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.document }), flavor: label });
// But we are posting a COMPOSED result (multiple rolls combined), so build a custom ChatMessage:
// await ChatMessage.create({ speaker, flavor, content: renderTemplate(templatePath, data) });
// OR: use a simple string for content. For Phase 2, a simple formatted string in content is sufficient.
// renderTemplate() is a Foundry global — available at runtime, not in Node tests.

// CRITICAL: No chat template file is strictly required — use a simple HTML string or a template.
// If using a template: place at templates/dice/roll-dialog.hbs and templates/chat/roll-result.hbs
// For simplicity, use game.i18n.format() and a plain HTML string in ChatMessage.create().

// CRITICAL: Modules directory structure — `modules/helpers/` does not exist yet.
// The Write tool creates parent dirs implicitly — no mkdir needed.

// CRITICAL: Roll tests in Vitest — Roll is a Foundry global that doesn't exist in Node.
// Unit tests for dice.mjs must mock Roll using vi.mock() or inject a mock Roll factory.
// BEST APPROACH: Extract rolling into an injectable dependency (not `new Roll()` directly).
// Use a default parameter: rollWithWildDie(dice, pips, penalty = 0, _rollFn = rollOneDie)
// where rollOneDie = async () => (await new Roll("1d6").evaluate()).total
// In tests, pass a mock _rollFn that returns controlled values.

// CRITICAL: The `_rollFn` parameter approach is the ONLY way to test wild die logic without
// a live Foundry environment. Document this clearly in the function signature.

// GOTCHA: ChatMessage.getSpeaker is a Foundry global static method. Not importable.
// Use: ChatMessage.getSpeaker({ actor: this.document }) in the sheet handler.

// GOTCHA: RollDialog window close (X button) fires the `close` hook BEFORE any form submit.
// Override _onClose() to resolve(null) if not already resolved.
// Pattern: track resolution state with a flag to avoid double-resolve.

// GOTCHA: ApplicationV2 DEFAULT_OPTIONS.window.title must be a localization key string,
// not a resolved string. Foundry localizes it automatically on render.

// GOTCHA: The roll dialog template path uses the full system prefix:
// "systems/starwarsd6/templates/dice/roll-dialog.hbs"

// GOTCHA: `game.i18n.localize()` is not available in Vitest. Never call it in dice.mjs logic.
// All i18n must stay in the sheet handlers and templates.

// GOTCHA: skill.id in the template is the Foundry document ID (UUID-like string).
// Retrieve skill item: this.document.items.get(skillId)
// Retrieve skill system data: skill.system.dicePool, skill.system.pips

// GOTCHA: For attribute rolls, use the attribute key (e.g. "DEX") as data-attribute-key.
// Retrieve dice/pips from: this.document.system[attributeKey].dice / .pips
```

---

## Implementation Blueprint

### Task 1 — CREATE `modules/helpers/dice.mjs`

Core dice logic. All pure functions. `_rollFn` is injectable for testability.

```js
/**
 * @typedef {Object} RollResult
 * @property {number} total       — Final total (normalDice + wildTotal + pips)
 * @property {number[]} normalDice — Individual normal d6 results (length = effective-1)
 * @property {number[]} wildRolls  — Wild die chain: [first, ...explosions] (≥1 element)
 * @property {boolean} isComplication — true when first wild roll was 1
 * @property {number} pips         — Pip bonus applied
 */

/**
 * Default roll function — rolls one d6 using Foundry's Roll API.
 * Injected in production; replaced in tests.
 * @returns {Promise<number>}
 */
async function rollOneDie() {
  const r = await new Roll("1d6").evaluate();
  return r.total;
}

/**
 * Roll a skill or attribute using the Star Wars D6 wild die mechanic.
 *
 * @param {number} dice                    Base die code (number of d6s)
 * @param {number} pips                    Pip bonus (0, 1, or 2)
 * @param {number} [multipleActionPenalty=0]  Penalty dice from multiple actions
 * @param {Function} [_rollFn=rollOneDie]  Injected roll function — override in tests
 * @returns {Promise<RollResult>}
 */
export async function rollWithWildDie(dice, pips, multipleActionPenalty = 0, _rollFn = rollOneDie) {
  const effective = Math.max(1, dice - multipleActionPenalty);

  // Roll (effective - 1) normal d6s
  const normalDice = [];
  for (let i = 0; i < effective - 1; i++) {
    normalDice.push(await _rollFn());
  }

  // Roll wild die (chain on 6)
  const wildRolls = [];
  let wildResult = await _rollFn();
  wildRolls.push(wildResult);
  while (wildResult === 6) {
    wildResult = await _rollFn();
    wildRolls.push(wildResult);
  }

  const isComplication = wildRolls[0] === 1;
  const normalTotal = normalDice.reduce((sum, n) => sum + n, 0);
  const wildTotal = wildRolls.reduce((sum, n) => sum + n, 0);
  const total = normalTotal + wildTotal + pips;

  return { total, normalDice, wildRolls, isComplication, pips };
}

/**
 * Roll a flat damage die code — no wild die.
 *
 * @param {number} dice  Number of d6s
 * @param {number} pips  Pip bonus
 * @returns {Promise<number>}
 */
export async function rollDamage(dice, pips) {
  const formula = pips > 0 ? `${dice}d6 + ${pips}` : `${dice}d6`;
  const r = await new Roll(formula).evaluate();
  return r.total;
}
```

### Task 2 — CREATE `modules/apps/roll-dialog.mjs`

A modal ApplicationV2 dialog to collect number of actions (1–4) before rolling.

```js
const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class RollDialog extends HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["starwarsd6", "roll-dialog"],
    tag: "dialog",
    window: {
      title: "STARWARSD6.RollDialog.Title",
      minimizable: false
    },
    position: { width: 320, height: "auto" },
    form: { closeOnSubmit: true }
  };

  static PARTS = {
    form: { template: "systems/starwarsd6/templates/dice/roll-dialog.hbs" }
  };

  // Promise resolver — set by prompt(), called by submit/close handlers
  #resolve = null;
  #resolved = false;

  /**
   * Open a roll dialog and wait for the user's input.
   * @param {object} [options={}]  Options forwarded to render()
   * @returns {Promise<{ numActions: number }|null>}  null if cancelled
   */
  static async prompt(options = {}) {
    return new Promise(resolve => {
      const dialog = new RollDialog(options);
      dialog.#resolve = resolve;
      dialog.render(true);
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.numActions = 1;
    return context;
  }

  // Called when the form is submitted (OK button)
  static #onSubmit(event, form, formData) {
    const numActions = Math.min(4, Math.max(1, parseInt(formData.get("numActions") ?? "1")));
    if (!this.#resolved) {
      this.#resolved = true;
      this.#resolve({ numActions });
    }
  }

  // Called when the window is closed (X button or ESC) without submitting
  async _onClose(options) {
    await super._onClose(options);
    if (!this.#resolved) {
      this.#resolved = true;
      this.#resolve(null);
    }
  }
}
```

**IMPORTANT:** Wire `#onSubmit` into `DEFAULT_OPTIONS.form.handler`:
```js
static DEFAULT_OPTIONS = {
  ...
  form: { handler: RollDialog.#onSubmit, closeOnSubmit: true }
};
```

### Task 3 — CREATE `templates/dice/roll-dialog.hbs`

Simple form with a number input for "Number of Actions" (1–4).

```hbs
<form>
  <div class="form-group">
    <label for="num-actions">{{localize "STARWARSD6.RollDialog.NumActions"}}</label>
    <input type="number" id="num-actions" name="numActions" value="1" min="1" max="4" autofocus />
  </div>
  <footer class="sheet-footer form-footer">
    <button type="submit" class="default">
      <i class="fas fa-dice"></i>
      {{localize "STARWARSD6.RollDialog.Roll"}}
    </button>
    <button type="button" data-action="close">
      {{localize "STARWARSD6.RollDialog.Cancel"}}
    </button>
  </footer>
</form>
```

**Note:** `data-action="close"` is a built-in ApplicationV2 action that closes the window.

### Task 4 — MODIFY `modules/apps/character-sheet.mjs`

Add actions to `DEFAULT_OPTIONS` and implement `#rollSkill` and `#rollAttribute` static handlers.

```js
import { rollWithWildDie } from "../helpers/dice.mjs";
import RollDialog from "./roll-dialog.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const ATTRIBUTE_KEYS = ["DEX", "KNO", "MEC", "PER", "STR", "TEC"];

export default class CharacterSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["starwarsd6", "sheet", "actor", "character"],
    position: { width: 650, height: 600 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      rollSkill: CharacterSheet.#rollSkill,
      rollAttribute: CharacterSheet.#rollAttribute
    }
  };

  // ... (keep existing PARTS, tabGroups, _onRender, _prepareContext unchanged) ...

  /**
   * Handle a click on a skill's roll button.
   * @this {CharacterSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target  Element with data-action="rollSkill"
   */
  static async #rollSkill(event, target) {
    const skillId = target.dataset.skillId;
    const skill = this.document.items.get(skillId);
    if (!skill) return;

    const result = await RollDialog.prompt();
    if (result === null) return; // cancelled

    const { numActions } = result;
    const penalty = numActions - 1;
    const rollResult = await rollWithWildDie(skill.system.dicePool, skill.system.pips, penalty);

    await CharacterSheet.#postRollToChat(this.document, skill.name, rollResult, numActions);
  }

  /**
   * Handle a click on an attribute's roll button.
   * @this {CharacterSheet}
   * @param {PointerEvent} event
   * @param {HTMLElement} target  Element with data-action="rollAttribute"
   */
  static async #rollAttribute(event, target) {
    const attributeKey = target.dataset.attributeKey;
    const attr = this.document.system[attributeKey];
    if (!attr) return;

    const result = await RollDialog.prompt();
    if (result === null) return;

    const { numActions } = result;
    const penalty = numActions - 1;
    const attrLabel = game.i18n.localize(`STARWARSD6.Attribute.${attributeKey}`);
    const rollResult = await rollWithWildDie(attr.dice, attr.pips, penalty);

    await CharacterSheet.#postRollToChat(this.document, attrLabel, rollResult, numActions);
  }

  /**
   * Post a roll result to the chat log.
   * @param {Actor} actor
   * @param {string} label  — Skill or attribute name
   * @param {RollResult} result
   * @param {number} numActions
   */
  static async #postRollToChat(actor, label, result, numActions) {
    const speaker = ChatMessage.getSpeaker({ actor });
    const effectiveDice = Math.max(1, (result.normalDice.length + 1)); // normal + wild
    const penaltyNote = numActions > 1
      ? ` (${numActions} ${game.i18n.localize("STARWARSD6.Roll.Actions")}, −${numActions - 1}D)`
      : "";

    // Build wild die display
    const wildStr = result.wildRolls.length > 1
      ? result.wildRolls.map((v, i) => i === 0 ? `<b>${v}</b>` : `→${v}`).join(" ")
      : `<b>${result.wildRolls[0]}</b>`;

    const complications = result.isComplication
      ? `<span class="complication"> ⚠ ${game.i18n.localize("STARWARSD6.Roll.Complication")}</span>`
      : "";
    const explosion = result.wildRolls.length > 1
      ? `<span class="explosion"> 💥 ${game.i18n.localize("STARWARSD6.Roll.Explosion")}</span>`
      : "";

    const normalStr = result.normalDice.length > 0
      ? `Normal: [${result.normalDice.join(", ")}] | ` : "";
    const pipsStr = result.pips > 0 ? ` +${result.pips} pips` : "";
    const content = `
      <div class="starwarsd6 roll-result">
        <h3>${label}${penaltyNote}</h3>
        <div class="roll-formula">${effectiveDice}D${pipsStr}</div>
        <div class="roll-dice">${normalStr}Wild: ${wildStr}${explosion}${complications}</div>
        <div class="roll-total"><strong>${game.i18n.localize("STARWARSD6.Roll.Total")}: ${result.total}</strong></div>
      </div>`;

    await ChatMessage.create({ speaker, content });
  }
}
```

### Task 5 — MODIFY `templates/actors/character-sheet.hbs`

Add roll buttons to attribute rows and skill rows. Minimal changes — just add a `<td>` with the roll button.

**Attributes table rows** — add a roll button column:
```hbs
<tr>
  <td>{{localize attr.label}}</td>
  <td><input type="number" name="system.{{attr.key}}.dice" value="{{attr.dice}}" min="1" /></td>
  <td><input type="number" name="system.{{attr.key}}.pips" value="{{attr.pips}}" min="0" max="2" /></td>
  <td class="base-value">{{attr.baseValue}}</td>
  <td><button type="button" data-action="rollAttribute" data-attribute-key="{{attr.key}}">
    <i class="fas fa-dice"></i>
  </button></td>
</tr>
```

**Attributes table `<thead>`** — add a roll column header:
```hbs
<th>{{localize "STARWARSD6.Roll.Label"}}</th>
```

**Skills table rows** — add a roll button column:
```hbs
<tr class="item-row" data-item-id="{{skill.id}}">
  <td>{{skill.name}}</td>
  <td>{{skill.rank}}</td>
  <td>{{skill.dicePool}}D{{#if skill.pips}}+{{skill.pips}}{{/if}}</td>
  <td><button type="button" data-action="rollSkill" data-skill-id="{{skill.id}}">
    <i class="fas fa-dice"></i>
  </button></td>
</tr>
```

**Skills table `<thead>`** — add roll column header in both tables (regular skills and Force skills).

### Task 6 — MODIFY `lang/en.json`

Add new i18n keys:

```json
{
  "STARWARSD6.RollDialog.Title": "Roll",
  "STARWARSD6.RollDialog.NumActions": "Number of Actions",
  "STARWARSD6.RollDialog.Roll": "Roll",
  "STARWARSD6.RollDialog.Cancel": "Cancel",
  "STARWARSD6.Roll.Label": "Roll",
  "STARWARSD6.Roll.Total": "Total",
  "STARWARSD6.Roll.Actions": "actions",
  "STARWARSD6.Roll.Complication": "Complication!",
  "STARWARSD6.Roll.Explosion": "Wild Die Exploded!"
}
```

### Task 7 — CREATE `tests/unit/dice.test.mjs`

Unit tests for pure dice logic. `rollWithWildDie` is tested by injecting a mock `_rollFn`.

```js
import { describe, it, expect, vi } from "vitest";
import { rollWithWildDie } from "../../modules/helpers/dice.mjs";

// Helper: create a mock roll function that returns values from a sequence
function makeMockRoll(sequence) {
  const results = [...sequence];
  return vi.fn(async () => {
    const val = results.shift();
    if (val === undefined) throw new Error("Mock roll sequence exhausted");
    return val;
  });
}

describe("rollWithWildDie()", () => {
  describe("basic rolls (no penalty, no explosion, no complication)", () => {
    it("rolls (effective-1) normal dice + 1 wild die", async () => {
      // dice=3, effective=3: 2 normal + 1 wild
      const mock = makeMockRoll([3, 4, 5]); // normal: 3,4 | wild: 5
      const result = await rollWithWildDie(3, 0, 0, mock);
      expect(mock).toHaveBeenCalledTimes(3);
      expect(result.normalDice).toEqual([3, 4]);
      expect(result.wildRolls).toEqual([5]);
      expect(result.total).toBe(12); // 3+4+5+0
      expect(result.isComplication).toBe(false);
    });

    it("adds pips to total", async () => {
      const mock = makeMockRoll([3, 4]); // normal: 3 | wild: 4
      const result = await rollWithWildDie(2, 2, 0, mock);
      expect(result.total).toBe(9); // 3+4+2
      expect(result.pips).toBe(2);
    });

    it("1D (dice=1): only wild die rolls, no normal dice", async () => {
      const mock = makeMockRoll([4]); // wild only
      const result = await rollWithWildDie(1, 0, 0, mock);
      expect(mock).toHaveBeenCalledTimes(1);
      expect(result.normalDice).toEqual([]);
      expect(result.wildRolls).toEqual([4]);
      expect(result.total).toBe(4);
    });
  });

  describe("wild die = 1 (complication)", () => {
    it("sets isComplication=true when wild die is 1", async () => {
      const mock = makeMockRoll([3, 1]); // normal: 3 | wild: 1
      const result = await rollWithWildDie(2, 0, 0, mock);
      expect(result.isComplication).toBe(true);
      expect(result.wildRolls).toEqual([1]);
      expect(result.total).toBe(4); // 3+1+0 = 4 (add 1 normally per house rule)
    });

    it("complication on 1D: wild die only, total=1", async () => {
      const mock = makeMockRoll([1]);
      const result = await rollWithWildDie(1, 0, 0, mock);
      expect(result.isComplication).toBe(true);
      expect(result.total).toBe(1);
    });
  });

  describe("wild die = 6 (explosion / chain)", () => {
    it("chains when wild die shows 6, stops on non-6", async () => {
      // dice=3: normal=[3,4], wild chain=[6,6,3]
      const mock = makeMockRoll([3, 4, 6, 6, 3]);
      const result = await rollWithWildDie(3, 0, 0, mock);
      expect(result.wildRolls).toEqual([6, 6, 3]);
      expect(result.total).toBe(3 + 4 + 6 + 6 + 3 + 0); // 22
      expect(result.isComplication).toBe(false);
    });

    it("single explosion: wild=6 then non-6", async () => {
      const mock = makeMockRoll([2, 6, 4]); // normal:2, wild:6→4
      const result = await rollWithWildDie(2, 0, 0, mock);
      expect(result.wildRolls).toEqual([6, 4]);
      expect(result.total).toBe(2 + 6 + 4); // 12
    });

    it("isComplication is false when wild starts with 6 (not 1)", async () => {
      const mock = makeMockRoll([6, 3]); // 1D: wild=6→3
      const result = await rollWithWildDie(1, 0, 0, mock);
      expect(result.isComplication).toBe(false);
    });
  });

  describe("multiple action penalty", () => {
    it("reduces effective dice by penalty (2 actions = -1D)", async () => {
      // dice=3, penalty=1, effective=2: 1 normal + 1 wild
      const mock = makeMockRoll([4, 5]);
      const result = await rollWithWildDie(3, 0, 1, mock);
      expect(mock).toHaveBeenCalledTimes(2);
      expect(result.normalDice).toEqual([4]);
      expect(result.wildRolls).toEqual([5]);
    });

    it("effective minimum is 1 (only wild die) even with heavy penalty", async () => {
      // dice=2, penalty=5, effective=max(1,2-5)=1: 0 normal + 1 wild
      const mock = makeMockRoll([4]);
      const result = await rollWithWildDie(2, 0, 5, mock);
      expect(mock).toHaveBeenCalledTimes(1);
      expect(result.normalDice).toEqual([]);
      expect(result.wildRolls).toEqual([4]);
    });

    it("penalty=0 (1 action) produces no reduction", async () => {
      const mock = makeMockRoll([3, 4, 5]); // dice=3, penalty=0
      const result = await rollWithWildDie(3, 0, 0, mock);
      expect(result.normalDice).toHaveLength(2);
    });
  });
});
```

### Task 8 — UPDATE `doc/implementation-plan.md`

Two targeted changes only:

1. **Update current state line** (line 4):
   - From: `feat001 scaffold complete; feat002 (mixin bug) resolved; feat003 (skill sheet & data expansion) complete`
   - To: `feat001 scaffold complete; feat002 (mixin bug) resolved; feat003 (skill sheet & data expansion) complete; feat004 (dice engine) complete`

2. **Update Phase Overview table** — change Phase 2 row:
   - From: `| 2 | Dice Engine | Wild die rolls from sheet | M | 1 |`
   - To: `| 2 ✓ | Dice Engine | Wild die rolls from sheet | M | 1 |`

---

## Integration Points

```yaml
MODULES/HELPERS (new directory):
  - Create: modules/helpers/dice.mjs
  - No registration needed in starwarsd6.mjs — imported directly by character-sheet.mjs

MODULES/APPS/CHARACTER-SHEET:
  - Import: rollWithWildDie from ../helpers/dice.mjs
  - Import: RollDialog from ./roll-dialog.mjs
  - Add to DEFAULT_OPTIONS.actions: { rollSkill, rollAttribute }
  - Add private static methods: #rollSkill, #rollAttribute, #postRollToChat

MODULES/APPS/ROLL-DIALOG:
  - Not registered in starwarsd6.mjs (not a document sheet)
  - Imported only by character-sheet.mjs
  - Used via static RollDialog.prompt() call

TEMPLATES:
  - New: templates/dice/roll-dialog.hbs
  - Modified: templates/actors/character-sheet.hbs (add roll buttons)

LANG:
  - Modified: lang/en.json (add 9 new keys)

TESTS:
  - New: tests/unit/dice.test.mjs (13 unit tests for dice logic)
  - Roll is NOT mocked in tests/mocks/foundry.mjs (Roll is only used at runtime)
  - Mock is injected via _rollFn parameter in rollWithWildDie
```

---

## Validation Loop

### Level 1 — Static Checks

```bash
# 1. Verify new files exist
ls modules/helpers/dice.mjs modules/apps/roll-dialog.mjs \
   templates/dice/roll-dialog.hbs \
   tests/unit/dice.test.mjs \
  && echo "OK: all new files present" || echo "ERROR: missing file(s)"

# 2. Verify Roll is NOT imported (it's a global)
grep -n "^import.*Roll\b" modules/helpers/dice.mjs \
  && echo "ERROR: Roll must not be imported" || echo "OK: Roll not imported"

# 3. Verify no Foundry globals imported in new modules
grep -rn "^import.*\(Roll\|game\|CONFIG\|Hooks\|ChatMessage\|foundry\)" \
  modules/helpers/dice.mjs \
  && echo "ERROR: forbidden import found" || echo "OK"

# 4. Verify rollWithWildDie exported
grep -n "export.*rollWithWildDie\|export.*rollDamage" modules/helpers/dice.mjs \
  && echo "OK: exports present" || echo "ERROR: exports missing"

# 5. Verify _rollFn parameter in rollWithWildDie signature
grep -n "_rollFn" modules/helpers/dice.mjs \
  && echo "OK: injectable _rollFn present" || echo "ERROR: _rollFn missing (tests will fail)"

# 6. Verify RollDialog has static prompt() method
grep -n "static.*prompt\b" modules/apps/roll-dialog.mjs \
  && echo "OK: prompt() present" || echo "ERROR: prompt() missing"

# 7. Verify CharacterSheet actions wired
grep -n "rollSkill\|rollAttribute" modules/apps/character-sheet.mjs \
  && echo "OK: actions present" || echo "ERROR: actions missing"

# 8. Verify RollDialog imported in character-sheet.mjs
grep -n "import.*RollDialog" modules/apps/character-sheet.mjs \
  && echo "OK" || echo "ERROR: RollDialog not imported"

# 9. Verify dice.mjs imported in character-sheet.mjs
grep -n "import.*dice" modules/apps/character-sheet.mjs \
  && echo "OK" || echo "ERROR: dice.mjs not imported"

# 10. Verify template has roll buttons
grep -n "rollSkill\|rollAttribute" templates/actors/character-sheet.hbs \
  && echo "OK: roll buttons in template" || echo "ERROR: buttons missing"

# 11. Verify new i18n keys present
grep -n "RollDialog.Title\|Roll.Complication\|Roll.Explosion" lang/en.json \
  && echo "OK: i18n keys present" || echo "ERROR: keys missing"

# 12. Verify implementation-plan.md updated
grep -n "feat004\|2 ✓" doc/implementation-plan.md \
  && echo "OK: plan updated" || echo "ERROR: plan not updated"
```

### Level 2 — Unit Tests

```bash
# Run full test suite — must include new dice tests
npm test

# Expected output:
#  ✓ tests/unit/character-data.test.mjs (8 tests)
#  ✓ tests/unit/skill-data.test.mjs (10 tests)
#  ✓ tests/unit/dice.test.mjs (13 tests)
#
#  Test Files  3 passed (3)
#       Tests  31 passed (31)
```

**If a test fails:**
1. Read the full assertion error — `vi.fn` call count mismatches usually mean wrong number of dice rolled
2. Trace through the logic: check `effective = Math.max(1, dice - penalty)`, then loop count
3. Fix the source in `modules/helpers/dice.mjs` — never adjust test expectations to match wrong logic
4. Re-run `npm test`

### Level 3 — Manual Foundry Validation (after deploy)

Deploy via `./deploy.sh` (user runs this manually).

Then in Foundry:

1. **No init errors**: Open world → browser console clean
2. **Attribute roll**:
   - Open a character sheet → Attributes tab
   - Click the roll button (dice icon) next to DEX
   - Roll dialog opens titled "Roll" with "Number of Actions" input (default: 1)
   - Click "Roll" → dialog closes → chat message appears with total, normal dice, wild die result
   - If wild die = 1: chat shows "⚠ Complication!" text
   - If wild die = 6: chat shows "💥 Wild Die Exploded!" and chain results
3. **Skill roll**:
   - Switch to Skills tab → click roll button next to a skill (e.g. "blaster")
   - Same flow as attribute roll; skill name appears as label
4. **Multiple actions**:
   - Click roll → set numActions = 3 → "Roll"
   - Chat message shows `(3 actions, −2D)` in the label
   - If base skill is 2D and penalty=2, effective=max(1,0)=1 → only wild die rolls
5. **Cancel**:
   - Click roll button → X the dialog → no chat message posted

---

## Anti-Patterns to Avoid

- **Do NOT** `import Roll` — it's a Foundry global, available at runtime, not importable
- **Do NOT** call `new Roll("1d6").evaluate()` in unit tests without injecting a mock
- **Do NOT** hardcode i18n strings in `#postRollToChat` — use `game.i18n.localize()`
- **Do NOT** register `RollDialog` in `starwarsd6.mjs` — it's not a document sheet
- **Do NOT** use `event.preventDefault()` on the roll button — it's a `type="button"` not submit
- **Do NOT** put roll logic in `_prepareContext` — roll logic belongs in action handlers
- **Do NOT** use `FormDataExtended` — use native `FormData` from the form element for the dialog
- **Do NOT** add complexity for Phase 5 (CP/FP) yet — stub nothing, implement nothing for future phases
- **Do NOT** double-resolve the RollDialog Promise — the `#resolved` flag prevents this
- **Do NOT** make `rollWithWildDie` a method on a class — it's a pure function, keep it a named export

---

## Confidence Score: 9/10

**Deductions:**
- **-1**: RollDialog `_onClose` + form `handler` wiring in ApplicationV2 has subtle ordering — if `closeOnSubmit: true` fires close before the handler resolves, the `#resolved` flag protects against double-resolve but the test coverage can't verify the timing. If dialog Promise never resolves in a live session, check that `form.handler` is properly set in `DEFAULT_OPTIONS` (not just referenced in PARTS). Fallback: add a submit event listener in `_onRender` instead of the declarative `form.handler` approach.

The dice logic confidence is 10/10 — pure functions with injected `_rollFn` are fully testable and the rules are unambiguous. The ApplicationV2 dialog and sheet action wiring confidence is 8/10 — the pattern is well-established in this codebase but the promise-based dialog pattern adds one moving part.
