# PRP-feat009 — Character Points & Force Points Expenditure

## Goal

Add CP/FP spending to the roll workflow.

End state:
- After any skill/attribute/attack roll, the resulting chat card shows a **"Spend CP"** button if the actor has CP > 0 and has not spent an FP this round
- Clicking "Spend CP" rolls 1 extra d6, adds it to the displayed total, and decrements the actor's `characterPoints` by 1
- The `RollDialog` shows a **"Spend Force Point"** checkbox (enabled only if `forcePoints > 0` and FP not already spent this round). If checked, `effectiveDice` is doubled before rolling, and `forcePoints` is decremented by 1
- CP and FP spending are mutually exclusive per round — spending either one disables the other for that actor until the round advances
- A **"New Round"** button on the sheet header clears the per-actor FP-spent flag (for out-of-combat use); in-combat the flag clears automatically on `combatRound` advance
- All existing 81 tests continue to pass; new unit tests cover the extended `rollWithWildDie` signature

## Why

- Players currently must manually track CP/FP use and apply bonuses by hand
- CP/FP are core to the Star Wars D6 heroic arc — players spend CP on critical rolls to push results over difficulty numbers
- Force Points represent peak heroic moments and doubling dice creates dramatic swings; mutual exclusivity with CP is a rules requirement
- The dice engine (`modules/helpers/dice.mjs`) and chat posting (`#postRollToChat`) are already stable and well-tested — this feature extends them cleanly

## What

### Success Criteria

- [ ] `rollWithWildDie` accepts a 4th positional param `multipleActionPenalty` (unchanged) and a 5th options object `{ doubled = false, _rollFn }` — when `doubled: true`, `effectiveDice = dice × 2` before penalty
- [ ] A standalone helper `rollExtraDie(_rollFn?)` rolls one d6 and returns `{ value, total }` for CP post-roll addition
- [ ] `RollDialog.prompt({ canSpendFP, hasFP })` adds an FP checkbox; returns `{ numActions, useForcePoint }` (or `null` if cancelled)
- [ ] `character-sheet.mjs` passes `canSpendFP` / `hasFP` flags into `RollDialog.prompt()` calls and handles `useForcePoint`
- [ ] Chat cards for all roll types (skill, attribute, attack) embed `data-actor-id` and `data-roll-total` attributes, and a "Spend CP" button (rendered disabled if CP=0 or FP spent this round)
- [ ] `Hooks.on("renderChatMessage", ...)` in `starwarsd6.mjs` attaches a click listener to "Spend CP" buttons
- [ ] Clicking "Spend CP": rolls 1d6, updates message content (total + extra die), decrements `characterPoints` via `actor.update()`, sets `fpSpentThisRound` flag, re-renders the button as disabled
- [ ] Spending an FP at roll time: sets `actor.setFlag("starwarsd6", "fpSpentThisRound", true)` immediately; chat card button rendered disabled
- [ ] Sheet header shows **"New Round"** button; clicking it calls `actor.unsetFlag("starwarsd6", "fpSpentThisRound")`
- [ ] `Hooks.on("combatRound", ...)` in `starwarsd6.mjs` clears `fpSpentThisRound` for all actor tokens in the combat
- [ ] `lang/en.json` adds all new i18n keys
- [ ] `npm test` passes (all 81 existing tests + new dice tests)

---

## All Needed Context

### Documentation & References

```yaml
- file: doc/rules-reference.md
  why: Authoritative rules for CP/FP. No separate section; behavior from implementation-plan.md Phase 5.
  critical: |
    CHARACTER POINTS: After a roll resolves, spend 1 CP to roll 1 extra d6 and add to total.
    FORCE POINTS: Before rolling, check FP box → effectiveDice doubled for that roll.
    MUTUAL EXCLUSIVITY: If FP was spent this round, CP spend is unavailable (and vice versa).
    Both are tracked on CharacterData: characterPoints: NumberField, forcePoints: NumberField.

- file: doc/implementation-plan.md (Phase 5)
  why: Canonical design notes for this feature
  critical: |
    "Spend CP" button in chat card. fpSpentThisRound via actor.setFlag("starwarsd6", ...).
    Clear via "New Round" button or combatRound hook.

- file: modules/helpers/dice.mjs
  why: rollWithWildDie signature to extend; rollDamage for contrast
  critical: |
    CURRENT signature: rollWithWildDie(dice, pips, multipleActionPenalty = 0, _rollFn = rollOneDie)
    _rollFn is already injectable for tests — keep this pattern for the doubled option.
    ADD option: when doubled=true, effectiveDice = dice * 2 (BEFORE subtracting penalty)
    The function must remain pure and injectable — no globals inside.
    ADD standalone export: rollExtraDie(_rollFn = rollOneDie) → Promise<number>
    This is the CP spend helper — returns one d6 value.

- file: modules/apps/character-sheet.mjs
  why: All roll actions are private static methods here; chat posting is #postRollToChat
  critical: |
    #rollSkill, #rollAttribute, #rollAttack all call: RollDialog.prompt() then rollWithWildDie then #postRollToChat
    Must thread canSpendFP / hasFP into RollDialog.prompt() calls.
    Must check useForcePoint from dialog result.
    Must pass actorId + rollTotal into #postRollToChat for embedding in chat HTML.
    IMPORTANT: #postRollToChat is static — add actorId/rollTotal/cpAvailable params.

- file: modules/apps/roll-dialog.mjs
  why: Must extend with FP checkbox
  critical: |
    CURRENT: prompt(options={}) → Promise<{ numActions }|null>
    NEW: prompt({ canSpendFP=false, hasFP=false, ...options }) → Promise<{ numActions, useForcePoint }|null>
    Template must conditionally render FP checkbox ({{#if canSpendFP}}).
    #onSubmit reads useForcePoint from formData ("useForcePoint" checkbox → boolean).
    _prepareContext passes canSpendFP, hasFP to template.
    If canSpendFP=false or hasFP=false the checkbox renders disabled/absent.

- file: templates/dice/roll-dialog.hbs
  why: Template to extend with FP checkbox
  critical: |
    Add conditional FP block before the footer:
    {{#if canSpendFP}}
      <div class="form-group">
        <label><input type="checkbox" name="useForcePoint" {{#unless hasFP}}disabled{{/unless}} />
          Force Point (double dice)</label>
      </div>
    {{/if}}

- file: templates/actors/character-sheet.hbs
  why: Must add CP/FP counters in header and "New Round" button
  critical: |
    CP/FP counters already exist in the attributes tab character-stats section.
    Add to sheet-header: read-only CP/FP display + "New Round" button with data-action="newRound".
    header = actor name input + CP counter + FP counter + New Round button.

- file: starwarsd6.mjs
  why: Must register Hooks.on("renderChatMessage") and Hooks.on("combatRound")
  critical: |
    renderChatMessage hook: (message, html, _data) =>
      html.querySelectorAll(".spend-cp-btn").forEach(btn => btn.addEventListener("click", ...))
    Inside handler: const actorId = btn.dataset.actorId; const actor = game.actors.get(actorId);
    combatRound hook: (combat, _updateData, _options) =>
      combat.combatants.forEach(c => c.actor?.unsetFlag("starwarsd6", "fpSpentThisRound"))
    Register both hooks INSIDE Hooks.once("init", ...) — do NOT place them at top level.

- file: lang/en.json
  why: All new i18n keys must be added here
  critical: |
    New keys needed:
    "STARWARSD6.CP.SpendCP": "Spend CP (+1D)"
    "STARWARSD6.CP.CPSpent": "CP Spent"
    "STARWARSD6.CP.FPSpent": "FP Spent This Round"
    "STARWARSD6.FP.SpendFP": "Force Point (double dice)"
    "STARWARSD6.FP.NoFP": "No Force Points remaining"
    "STARWARSD6.Roll.NewRound": "New Round"
    "STARWARSD6.Roll.ExtraDie": "Extra die (CP)"

- url: https://foundryvtt.com/api/v13/classes/foundry.abstract.Document.html#setFlag
  why: actor.setFlag(scope, key, value) / actor.unsetFlag(scope, key) / actor.getFlag(scope, key)
  critical: |
    setFlag and unsetFlag are async — must await them.
    scope for this system = "starwarsd6"
    key = "fpSpentThisRound"
    Flags persist in the actor document — they survive page reload.

- url: https://foundryvtt.com/api/v13/functions/foundry.applications.hooks.html
  why: Hooks.on signature and renderChatMessage / combatRound hook shapes
  critical: |
    renderChatMessage: (message: ChatMessage, html: HTMLElement, data: object) => void
    combatRound: (combat: Combat, updateData: object, options: object) => void
    NOTE: In FoundryVTT v13, 'html' in renderChatMessage is an HTMLElement (not jQuery).
    Use html.querySelector / html.querySelectorAll — NOT $(html).find().

- url: https://foundryvtt.com/api/v13/classes/foundry.documents.ChatMessage.html#update
  why: Updating chat message content in place after CP spend
  critical: |
    message.update({ content: newHtml }) — async, returns Promise<ChatMessage>
    To get the message from the button click: const msgId = btn.closest("[data-message-id]").dataset.messageId;
    Then: const message = game.messages.get(msgId);
    The ".message" wrapper with data-message-id is injected by Foundry around every chat message.
```

### Current Codebase Tree (relevant files)

```
starwarsd6/
├── starwarsd6.mjs                         # MODIFY: add renderChatMessage + combatRound hooks
├── modules/
│   ├── actors/
│   │   └── character-data.mjs             # NO CHANGE (characterPoints/forcePoints already defined)
│   ├── apps/
│   │   ├── character-sheet.mjs            # MODIFY: FP threading, CP button in chat, newRound action
│   │   └── roll-dialog.mjs                # MODIFY: FP checkbox support
│   └── helpers/
│       └── dice.mjs                       # MODIFY: doubled option + rollExtraDie export
├── templates/
│   ├── actors/
│   │   └── character-sheet.hbs            # MODIFY: header CP/FP display + New Round button
│   └── dice/
│       └── roll-dialog.hbs                # MODIFY: FP checkbox block
└── lang/
    └── en.json                            # MODIFY: 6 new keys
```

### Desired Codebase Tree

No new files. Six existing files are modified.

### Known Gotchas

```js
// CRITICAL: renderChatMessage html argument is a raw HTMLElement in v13, NOT a jQuery object.
// Use html.querySelectorAll(".spend-cp-btn") — NOT $(html).find(".spend-cp-btn")

// CRITICAL: The data-message-id attribute is on the outer .message wrapper injected by Foundry,
// NOT on the inner content div. Get it via: btn.closest("[data-message-id]").dataset.messageId

// CRITICAL: actor.setFlag / unsetFlag are async. Always await them.

// CRITICAL: Both Hooks.on("renderChatMessage") and Hooks.on("combatRound") must be registered
// INSIDE Hooks.once("init", ...) in starwarsd6.mjs — registering them at module top-level
// is unreliable because Foundry may not be initialized yet.

// CRITICAL: FP checkbox uses type="checkbox" — formData.get("useForcePoint") returns "on" or null
// (not true/false). Convert: useForcePoint = formData.get("useForcePoint") === "on"

// CRITICAL: rollWithWildDie signature change — the 5th argument is an OPTIONS OBJECT, not a positional param.
// New signature: rollWithWildDie(dice, pips, multipleActionPenalty = 0, _rollFn = rollOneDie, { doubled = false } = {})
// This preserves backward compatibility — all existing callers pass only 3-4 args.
// Do NOT add doubled as a 5th positional — that would break the injectable _rollFn in tests.

// CRITICAL: doubled applies to dice BEFORE multipleActionPenalty:
// effective = max(1, (doubled ? dice * 2 : dice) - multipleActionPenalty)
// Example: dice=3, doubled=true, penalty=1 → effective = max(1, 6-1) = 5

// CRITICAL: CP spend button must be disabled (not absent) when CP=0 or FP spent.
// Use disabled attribute so GM can see the state. Check at render time via flags.

// CRITICAL: The "Spend CP" button in chat must store actorId as data-actor-id.
// Do NOT embed actor name — use the ID for reliable lookup via game.actors.get(actorId).

// CRITICAL: After CP spend, update the chat message content — replace the total line
// and re-render the button as disabled. Keep the original roll data intact above.

// CRITICAL: fpSpentThisRound flag blocks BOTH CP and FP. When FP is spent at roll time,
// set the flag immediately (before ChatMessage.create) so the rendered button starts disabled.

// CRITICAL: combatRound hook fires when the round counter increments.
// Some combat systems use combatTurn — but for end-of-round use combatRound.
// Check: Hooks.on("combatRound", (combat, updateData, options) => {...})
// combat.combatants is a Collection — iterate with .forEach(c => c.actor?.unsetFlag(...))

// CRITICAL: CharacterData already has characterPoints and forcePoints fields (feat003).
// Do NOT redefine them. Access via actor.system.characterPoints / actor.system.forcePoints.
```

---

## Implementation Blueprint

### Task 1 — MODIFY `modules/helpers/dice.mjs`

**What:** Add `doubled` option to `rollWithWildDie` and export `rollExtraDie`.

```yaml
MODIFY modules/helpers/dice.mjs:
  - CHANGE signature of rollWithWildDie to accept options object as 5th param
  - MODIFY effective calculation to handle doubled
  - ADD exported rollExtraDie function
```

Pseudocode:
```js
// NEW signature — options object is 5th param to preserve _rollFn position
export async function rollWithWildDie(
  dice, pips,
  multipleActionPenalty = 0,
  _rollFn = rollOneDie,
  { doubled = false } = {}
) {
  const baseDice = doubled ? dice * 2 : dice;
  const effective = Math.max(1, baseDice - multipleActionPenalty);
  // ... rest unchanged ...
  return { total, normalDice, wildRolls, isComplication, pips, doubled };
}

// CP spend helper — rolls one extra d6
export async function rollExtraDie(_rollFn = rollOneDie) {
  return _rollFn();
}
```

Note: existing callers pass only 3 or 4 args — the options object defaults to `{}` so `doubled` defaults to `false`. No breaking change.

---

### Task 2 — MODIFY `modules/apps/roll-dialog.mjs`

**What:** Add FP checkbox. Pass `canSpendFP` and `hasFP` context. Return `useForcePoint` in result.

```yaml
MODIFY modules/apps/roll-dialog.mjs:
  - CHANGE prompt() to accept { canSpendFP, hasFP, ...options }
  - CHANGE _prepareContext() to pass canSpendFP, hasFP to template
  - CHANGE #onSubmit to read useForcePoint from formData
  - CHANGE resolve call to include useForcePoint in result
```

Pseudocode:
```js
// Instance properties set from prompt() args
#canSpendFP = false;
#hasFP = false;

static async prompt({ canSpendFP = false, hasFP = false, ...options } = {}) {
  return new Promise(resolve => {
    const dialog = new RollDialog(options);
    dialog.#resolve = resolve;
    dialog.#canSpendFP = canSpendFP;
    dialog.#hasFP = hasFP;
    dialog.render(true);
  });
}

async _prepareContext(options) {
  const context = await super._prepareContext(options);
  context.numActions = 1;
  context.canSpendFP = this.#canSpendFP;
  context.hasFP = this.#hasFP;
  return context;
}

static #onSubmit(event, form, formData) {
  const numActions = Math.min(4, Math.max(1, parseInt(formData.get("numActions") ?? "1")));
  const useForcePoint = formData.get("useForcePoint") === "on";
  if (!this.#resolved) {
    this.#resolved = true;
    this.#resolve({ numActions, useForcePoint });
  }
}
```

---

### Task 3 — MODIFY `templates/dice/roll-dialog.hbs`

**What:** Add conditional FP checkbox block above the footer.

```yaml
MODIFY templates/dice/roll-dialog.hbs:
  - INSERT FP checkbox block between the numActions form-group and the footer
```

Full block to insert:
```hbs
{{#if canSpendFP}}
  <div class="form-group">
    <label>
      <input type="checkbox" name="useForcePoint" {{#unless hasFP}}disabled{{/unless}} />
      {{localize "STARWARSD6.FP.SpendFP"}}
      {{#unless hasFP}}<span class="no-fp">({{localize "STARWARSD6.FP.NoFP"}})</span>{{/unless}}
    </label>
  </div>
{{/if}}
```

---

### Task 4 — MODIFY `modules/apps/character-sheet.mjs`

**What:** Thread FP state into dialog calls, handle `useForcePoint`, embed actor context in chat posting.

```yaml
MODIFY modules/apps/character-sheet.mjs:
  - ADD newRound action to DEFAULT_OPTIONS.actions
  - MODIFY #rollSkill, #rollAttribute, #rollAttack to: derive canSpendFP/hasFP, pass to RollDialog.prompt, handle useForcePoint
  - MODIFY #postRollToChat signature to accept { actorId, cpAvailable, fpSpentThisRound }
  - ADD "Spend CP" button HTML to chat card with data-actor-id and data-roll-total
  - ADD static #newRound action handler
```

Pseudocode — roll action pattern (same for all three roll methods):
```js
static async #rollSkill(event, target) {
  const skillId = target.dataset.skillId;
  const skill = this.document.items.get(skillId);
  if (!skill) return;

  const fp = this.document.system.forcePoints;
  const fpSpent = !!this.document.getFlag("starwarsd6", "fpSpentThisRound");
  const canSpendFP = !fpSpent;
  const hasFP = fp > 0;

  const result = await RollDialog.prompt({ canSpendFP, hasFP });
  if (result === null) return;

  const { numActions, useForcePoint } = result;

  if (useForcePoint) {
    await this.document.update({ "system.forcePoints": Math.max(0, fp - 1) });
    await this.document.setFlag("starwarsd6", "fpSpentThisRound", true);
  }

  const penalty = numActions - 1;
  const rollResult = await rollWithWildDie(
    skill.system.dicePool, skill.system.pips, penalty,
    undefined,               // _rollFn — use default
    { doubled: useForcePoint }
  );

  const cpNow = this.document.system.characterPoints;
  const fpSpentNow = !!this.document.getFlag("starwarsd6", "fpSpentThisRound");

  await CharacterSheet.#postRollToChat(
    this.document, skill.name, rollResult, numActions,
    { cpAvailable: cpNow, fpSpentThisRound: fpSpentNow }
  );
}
```

Pseudocode — updated `#postRollToChat`:
```js
static async #postRollToChat(actor, label, result, numActions, { cpAvailable = 0, fpSpentThisRound = false } = {}) {
  // ... existing content building (unchanged) ...

  // Add CP button — disabled if CP=0 OR FP already spent this round
  const cpDisabled = (cpAvailable <= 0 || fpSpentThisRound) ? "disabled" : "";
  const cpButton = `
    <div class="cp-action">
      <button type="button" class="spend-cp-btn" data-actor-id="${actor.id}"
              data-roll-total="${result.total}" ${cpDisabled}>
        ${game.i18n.localize("STARWARSD6.CP.SpendCP")}
        ${cpAvailable > 0 ? `(${cpAvailable} ${game.i18n.localize("STARWARSD6.Character.CharacterPoints")})` : ""}
      </button>
    </div>`;

  const content = `
    <div class="starwarsd6 roll-result">
      <h3>${label}${penaltyNote}</h3>
      <div class="roll-formula">${effectiveDice}D${pipsStr}</div>
      <div class="roll-dice">${normalStr}Wild: ${wildStr}${explosion}${complications}</div>
      <div class="roll-total" data-base-total="${result.total}">
        <strong>${game.i18n.localize("STARWARSD6.Roll.Total")}: <span class="total-value">${result.total}</span></strong>
      </div>
      ${cpButton}
    </div>`;

  await ChatMessage.create({ speaker, content });
}
```

New `#newRound` action:
```js
static async #newRound(event, target) {
  await this.document.unsetFlag("starwarsd6", "fpSpentThisRound");
}
```

---

### Task 5 — MODIFY `templates/actors/character-sheet.hbs`

**What:** Add CP/FP display and "New Round" button to the sheet header.

```yaml
MODIFY templates/actors/character-sheet.hbs:
  - FIND: <header class="sheet-header">
  - EXTEND header to include CP counter, FP counter, and New Round button after the name input
```

New header block:
```hbs
<header class="sheet-header">
  <input type="text" name="name" value="{{document.name}}" placeholder="Character Name" />
  <div class="header-stats">
    <span class="cp-display" title="{{localize 'STARWARSD6.Character.CharacterPoints'}}">
      CP: <strong>{{system.characterPoints}}</strong>
    </span>
    <span class="fp-display" title="{{localize 'STARWARSD6.Character.ForcePoints'}}">
      FP: <strong>{{system.forcePoints}}</strong>
    </span>
    <button type="button" data-action="newRound" class="new-round-btn"
            title="{{localize 'STARWARSD6.Roll.NewRound'}}">
      {{localize "STARWARSD6.Roll.NewRound"}}
    </button>
  </div>
</header>
```

---

### Task 6 — MODIFY `starwarsd6.mjs`

**What:** Register `renderChatMessage` and `combatRound` hooks inside `Hooks.once("init", ...)`.

```yaml
MODIFY starwarsd6.mjs:
  - IMPORT rollExtraDie from dice.mjs at top of file
  - ADD Hooks.on("renderChatMessage", ...) inside Hooks.once("init", ...)
  - ADD Hooks.on("combatRound", ...) inside Hooks.once("init", ...)
```

Pseudocode:
```js
import { rollExtraDie } from "./modules/helpers/dice.mjs";

Hooks.once("init", () => {
  // ... existing registrations unchanged ...

  // CP spend: attach listener to "Spend CP" buttons on chat cards
  Hooks.on("renderChatMessage", (message, html, _data) => {
    html.querySelectorAll(".spend-cp-btn:not([disabled])").forEach(btn => {
      btn.addEventListener("click", async () => {
        const actorId = btn.dataset.actorId;
        const actor = game.actors.get(actorId);
        if (!actor) return;
        if (actor.system.characterPoints <= 0) return;

        // Roll 1 extra d6
        const extraValue = await rollExtraDie();

        // Decrement CP and set FP-spent flag (mutual exclusivity)
        await actor.update({ "system.characterPoints": actor.system.characterPoints - 1 });
        await actor.setFlag("starwarsd6", "fpSpentThisRound", true);

        // Update the chat message: add extra die to total, disable button
        const msgId = btn.closest("[data-message-id]").dataset.messageId;
        const chatMsg = game.messages.get(msgId);
        if (!chatMsg) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(chatMsg.content, "text/html");
        const totalEl = doc.querySelector(".total-value");
        if (totalEl) {
          const newTotal = parseInt(totalEl.textContent) + extraValue;
          totalEl.textContent = newTotal;
          // Append extra die note
          const totalRow = doc.querySelector(".roll-total");
          if (totalRow) {
            const extraNote = doc.createElement("span");
            extraNote.className = "extra-die";
            extraNote.textContent = ` +${extraValue} ${game.i18n.localize("STARWARSD6.Roll.ExtraDie")}`;
            totalRow.appendChild(extraNote);
          }
        }
        // Disable the CP button
        const cpBtn = doc.querySelector(".spend-cp-btn");
        if (cpBtn) cpBtn.setAttribute("disabled", "disabled");

        await chatMsg.update({ content: doc.body.innerHTML });
      });
    });
  });

  // Clear fpSpentThisRound for all actors when the combat round advances
  Hooks.on("combatRound", (combat, _updateData, _options) => {
    combat.combatants.forEach(c => {
      c.actor?.unsetFlag("starwarsd6", "fpSpentThisRound");
    });
  });
});
```

---

### Task 7 — MODIFY `lang/en.json`

**What:** Add 6 new i18n keys.

```yaml
MODIFY lang/en.json:
  - FIND: "STARWARSD6.Item.Equipped": "Equipped"
  - ADD AFTER (end of file, before closing brace):
      "STARWARSD6.CP.SpendCP": "Spend CP (+1D)",
      "STARWARSD6.CP.CPSpent": "CP Spent",
      "STARWARSD6.CP.FPSpent": "FP Spent This Round",
      "STARWARSD6.FP.SpendFP": "Force Point (double dice)",
      "STARWARSD6.FP.NoFP": "No Force Points remaining",
      "STARWARSD6.Roll.NewRound": "New Round",
      "STARWARSD6.Roll.ExtraDie": "extra die (CP)"
```

---

### Task 8 — Add unit tests for extended `rollWithWildDie`

**What:** Extend `tests/unit/dice.test.mjs` with tests for the `doubled` option and `rollExtraDie`.

```yaml
MODIFY tests/unit/dice.test.mjs:
  - ADD import of rollExtraDie
  - ADD describe block "doubled option"
  - ADD describe block "rollExtraDie()"
```

Test cases to add:
```js
import { rollWithWildDie, rollExtraDie } from "../../modules/helpers/dice.mjs";

describe("doubled option", () => {
  it("doubles effective dice when doubled=true", async () => {
    // dice=3, doubled=true → effectiveDice=6 → 5 normal + 1 wild
    const mock = makeMockRoll([1,2,3,4,5, 4]); // 5 normal, wild=4
    const result = await rollWithWildDie(3, 0, 0, mock, { doubled: true });
    expect(mock).toHaveBeenCalledTimes(6);
    expect(result.normalDice).toHaveLength(5);
    expect(result.doubled).toBe(true);
  });

  it("doubled=true then penalty reduces from doubled base", async () => {
    // dice=3, doubled=true → base=6, penalty=1 → effective=5
    const mock = makeMockRoll([1,2,3,4, 5]); // 4 normal, wild=5
    const result = await rollWithWildDie(3, 0, 1, mock, { doubled: true });
    expect(mock).toHaveBeenCalledTimes(5);
    expect(result.normalDice).toHaveLength(4);
  });

  it("doubled=false (default) produces normal roll", async () => {
    const mock = makeMockRoll([3, 4, 5]); // dice=3: 2 normal + wild
    const result = await rollWithWildDie(3, 0, 0, mock, { doubled: false });
    expect(mock).toHaveBeenCalledTimes(3);
    expect(result.normalDice).toHaveLength(2);
  });

  it("omitting options object behaves as before (backward compat)", async () => {
    const mock = makeMockRoll([3, 4, 5]);
    const result = await rollWithWildDie(3, 0, 0, mock);
    expect(mock).toHaveBeenCalledTimes(3);
  });
});

describe("rollExtraDie()", () => {
  it("calls _rollFn once and returns the value", async () => {
    const mock = vi.fn(async () => 5);
    const value = await rollExtraDie(mock);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(value).toBe(5);
  });
});
```

---

### Integration Points

```yaml
ENTRY POINT (starwarsd6.mjs):
  - Import rollExtraDie at top alongside existing imports
  - Two new Hooks.on registrations inside init hook

ROLL DIALOG:
  - New private fields #canSpendFP, #hasFP
  - prompt() signature extended (backward compatible — old callers pass no args)
  - Template receives two new context variables

CHARACTER SHEET:
  - All three roll actions (#rollSkill, #rollAttribute, #rollAttack) derive FP state before dialog
  - #postRollToChat gains optional options object — old call signatures still work
  - New #newRound action in DEFAULT_OPTIONS.actions

CHAT MESSAGE:
  - Content now contains .total-value span and .spend-cp-btn button
  - No new document type or message flag schema required
  - DOMParser used to mutate content string on CP spend
```

---

## Validation Loop

### Level 1: Unit Tests

```bash
npm test
# Expected: 81 existing tests + ~6 new dice tests = ~87 total passing
# If rollWithWildDie tests fail after signature change:
#   - Confirm options object is 5th param with default = {}
#   - Confirm existing callers in dice.test.mjs pass only 4 args (mock is arg 4, no options)
#   - Verify effective = max(1, (doubled ? dice*2 : dice) - penalty)
# If rollExtraDie tests fail:
#   - Confirm export name matches import in test
```

### Level 2: Manual Foundry Validation

```
CP FLOW:
1. Set actor characterPoints = 3
2. Click a skill roll button → RollDialog opens (FP checkbox visible, enabled if forcePoints > 0)
3. Submit with 1 action, no FP → chat card appears with "Spend CP (+1D) (3 Character Points)" button
4. Click "Spend CP" → extra die value added to total, button becomes disabled, CP on sheet → 2
5. Open another roll → CP button shows "(2 Character Points)"

FP FLOW:
1. Set actor forcePoints = 1
2. Click a skill → RollDialog shows FP checkbox enabled
3. Check the FP box, submit → roll fires with doubled dice, forcePoints → 0
4. Chat card "Spend CP" button is disabled (FP already spent this round)
5. Open a second roll dialog → FP checkbox is present but disabled (0 FP and flag set)

MUTUAL EXCLUSIVITY:
1. Spend CP on a roll → try to open RollDialog for another roll → FP checkbox is disabled
2. Spend FP on a roll → chat card CP button appears disabled

NEW ROUND BUTTON:
1. After spending CP or FP, click "New Round" on sheet header
2. FP checkbox in next roll dialog is enabled again (if FP > 0)
3. Chat CP button on NEW rolls is enabled

COMBAT ROUND ADVANCE:
1. Start combat, spend FP in round 1
2. Advance round via combat tracker
3. New roll in round 2 → FP checkbox re-enabled, CP button re-enabled

EDGE CASES:
- Actor with CP=0: chat button renders but is disabled immediately
- Actor with FP=0: FP checkbox renders but is disabled (still visible for clarity)
- Non-owner viewing chat: button is visible but only the owning player's click should work
  (actor.update() will fail for non-owners — no extra guard needed, Foundry enforces permissions)
```

### Final Checklist

- [ ] `npm test` passes (all existing 81 + new tests)
- [ ] `rollWithWildDie` 5th param is options object `{ doubled }` — NOT a positional param
- [ ] `rollExtraDie` is exported from `dice.mjs`
- [ ] `RollDialog.prompt()` is backward compatible — existing calls with no args still return `{ numActions, useForcePoint: false }`
- [ ] FP checkbox in template uses `name="useForcePoint"`, read as `=== "on"` in `#onSubmit`
- [ ] Chat card HTML contains `.total-value` span and `.spend-cp-btn` with `data-actor-id`
- [ ] `Hooks.on("renderChatMessage", ...)` uses `html.querySelectorAll` (not jQuery)
- [ ] `btn.closest("[data-message-id]")` used to resolve the ChatMessage document
- [ ] `fpSpentThisRound` flag set after BOTH CP spend and FP spend
- [ ] `combatRound` hook clears flag for ALL combatants in the combat
- [ ] "New Round" button calls `actor.unsetFlag("starwarsd6", "fpSpentThisRound")`
- [ ] `doubled` flag applied to base dice BEFORE penalty subtraction
- [ ] Both `Hooks.on` registrations are INSIDE `Hooks.once("init", ...)`
- [ ] All 7 new i18n keys added to `lang/en.json`

---

## Anti-Patterns to Avoid

- Do NOT use jQuery (`$`, `.find()`) — FoundryVTT v13 uses plain DOM
- Do NOT register `renderChatMessage` or `combatRound` at module top-level — put them inside `Hooks.once("init")`
- Do NOT add `doubled` as a positional 5th param — it must be an options object to preserve the injectable `_rollFn` at position 4
- Do NOT store roll state in memory or a module-level variable — use `actor.setFlag()` which persists across reloads
- Do NOT check `actor.system.forcePoints` after `actor.update()` in the same tick — the update is async; re-read the flag from `this.document.getFlag(...)` after awaiting
- Do NOT skip `await` on `setFlag` / `unsetFlag` / `update` — they are all async
- Do NOT call `DOMParser` on the existing `html` element in `renderChatMessage` — it's already a live DOM node; only use DOMParser when reconstructing from a saved `chatMsg.content` string
- Do NOT add a `cpSpentThisRound` flag — `fpSpentThisRound` covers both directions (spending either one sets the flag)

---

## Confidence Score: 8/10

High confidence because:
- All data fields (`characterPoints`, `forcePoints`) already exist in `CharacterData`
- `rollWithWildDie` has injectable `_rollFn` — the `doubled` extension follows the exact same pattern
- Chat message mutation via `message.update({ content })` + DOMParser is a well-established FoundryVTT pattern
- `renderChatMessage` and `combatRound` are stable v13 hooks with clear signatures
- The FP checkbox in `RollDialog` is a simple template + formData extension of the existing pattern

Two points of uncertainty (−2):
- The `closest("[data-message-id]")` selector depends on Foundry's rendered chat DOM structure — if the attribute name differs in v13, the handler will silently fail (mitigated: check via devtools before finalizing)
- `combatRound` hook name: verify it fires on round increment vs. `combatTurnChange` (which fires per turn). If wrong hook, flag clearing won't work in combat — fallback is to use `Hooks.on("updateCombat", (combat, delta) => { if (delta.round) ... })` which is definitely correct
