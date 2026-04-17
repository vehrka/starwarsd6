# PRP-feat021 — NPC Sheet Restyling

## Goal

Restyle `templates/actors/npc-sheet.hbs` and its CSS block to match the PC character sheet's visual language. Pure template + CSS task — no data model changes — with one small MJS addition (`editImage` action).

End state: NPC sheet has (top-to-bottom, single scrollable page, no tabs):
1. Header with name input + portrait (clickable, `editImage`)
2. Attributes & Skills in `attr-column-block` / `attr-header` / `skill-list` pattern (2-column grid)
3. Weapons using `combat-weapons-table` (no equipped filter)
4. Single Defense value (`system.rangedDefense`) + Hit Boxes + Damage Thresholds as `combat-wounds-section` / `wound-grid` 2×2
5. Notes textarea at bottom

## Why

- NPC sheet currently uses custom one-off layout (`attribute-row`, `skills-table`, `inventory-table`, `hit-box-tracker`) that diverges visually from PC sheet
- Reusing PC CSS classes reduces CSS surface area and ensures consistent look
- NPCs show one defense value on sheet — `rangedDefense` is the canonical NPC defense; `meleeDefense` and `brawlingDefense` remain in data model but are not shown on sheet

## What

### Success Criteria
- [ ] NPC sheet renders portrait (top-left, clickable, opens FilePicker)
- [ ] 6 attributes each in `attr-column-block` with roll button, name, dice/pips inputs; skills indented below using `skill-list`
- [ ] Weapons in `combat-weapons-table` (all weapons, no equipped filter)
- [ ] Wounds block: single Defense value (`system.rangedDefense`, editable input) + `wound-grid` 2×2 (threshold in header, hit-box buttons per tier, consequence line)
- [ ] Notes textarea unchanged at bottom
- [ ] No tab navigation (`<nav class="sheet-tabs">`) introduced
- [ ] No CSS rules duplicated from `.starwarsd6.sheet` — NPC-specific overrides only under `.starwarsd6.sheet.npc`
- [ ] All existing MJS actions (`rollAttribute`, `rollSkill`, `rollAttack`, `markHitBox`, `deleteItem`) still work
- [ ] `editImage` action wired and functional
- [ ] All existing tests pass

## All Needed Context

### Documentation & References

```yaml
- file: templates/actors/character-sheet.hbs
  why: PRIMARY reference for all markup patterns
  critical: |
    Portrait: lines 43–47 — img.bio-portrait, data-action="editImage", data-edit="img"
    Attributes+skills: lines 103–141 — attr-skills-grid > attr-column-block > attr-header + skill-list
    Weapons table: lines 300–329 — combat-weapons-table, {{#if weapon.equipped}} guard (REMOVE for NPC)
    Wounds section: lines 332–405 — combat-wounds-section > combat-defense-inline + wound-grid 2×2

- file: templates/actors/npc-sheet.hbs
  why: FILE TO REWRITE — keep all existing data bindings
  critical: |
    Keep: system.*, attributeGroups, weapons, combatData.*
    Defense display: show ONE editable input bound to system.rangedDefense, labelled "Defense".
    Do NOT show meleeDefense or brawlingDefense — they stay in data model but are hidden.

- file: modules/apps/npc-sheet.mjs
  why: Add editImage action + add combatData.defense in _prepareContext
  critical: |
    Current combatData does NOT include any defense field.
    Add ONE field: defense: sys.rangedDefense
    Template reads combatData.defense for display; edit input binds to system.rangedDefense.
    Also: context.document injected by ActorSheetV2 super — do NOT add context.document manually.

- file: modules/apps/character-sheet.mjs lines 706–715
  why: editImage implementation to copy verbatim into NpcSheet
  critical: |
    static async #editImage(_event, target) {
      const attr = target.dataset.edit;
      const current = foundry.utils.getProperty(this.document._source, attr);
      const fp = new foundry.applications.apps.FilePicker.implementation({
        current, type: "image",
        callback: path => this.document.update({ [attr]: path })
      });
      fp.browse(current);
    }

- file: styles/starwarsd6.css
  why: Understand existing CSS scope before adding NPC overrides
  critical: |
    Shared classes scoped under .starwarsd6.sheet (no actor type):
      .attr-column-block (line 76), .attr-header (line 81), .attr-skills-grid (line 68)
      .skill-list, .skill-row (further in file)
      .combat-weapons-table (line 437+), .combat-wounds-section (line 446+)
      .wound-grid (line 480), .wound-cell (line 486), .hit-box (line 505)
    NPC-specific existing rules: .starwarsd6.sheet.npc .npc-section (lines 554–595)
    Portrait rules currently tab-scoped: .starwarsd6.sheet .tab[data-tab="bio"] .bio-portrait
      — NPC portrait needs its own rule under .starwarsd6.sheet.npc
    Bio-portrait dimensions: width/height 90px, border, cursor pointer

- file: tests/unit/npc-data.test.mjs
  why: Test pattern to follow if tests need updating
```

### Codebase Tree (relevant files only)

```
starwarsd6/
├── templates/actors/
│   ├── character-sheet.hbs   ← reference
│   └── npc-sheet.hbs         ← REWRITE
├── modules/apps/
│   ├── character-sheet.mjs   ← reference for editImage
│   └── npc-sheet.mjs         ← MODIFY: add editImage action + extend combatData
├── styles/
│   └── starwarsd6.css        ← MODIFY: add NPC portrait rule, remove dead npc-section rules
└── tests/unit/
    └── npc-data.test.mjs     ← verify still passes (no data model changes)
```

### Known Gotchas

```
CRITICAL: combatData on NPC does NOT currently have any defense field.
  Add only: defense: sys.rangedDefense
  Template shows one "Defense" label + editable input bound to system.rangedDefense.
  meleeDefense and brawlingDefense remain in data model, not shown anywhere on sheet.

CRITICAL: document.img availability in template.
  ActorSheetV2 / HandlebarsApplicationMixin likely injects `document` into context already
  (PC sheet uses {{document.img}} and {{document.name}} without explicit assignment).
  Verify by grepping character-sheet.mjs _prepareContext — if no `context.document =` line,
  then super._prepareContext() does it. No extra code needed for document.img on NPC.

CRITICAL: NPC weapons — NO equipped filter.
  PC combat tab has {{#if weapon.equipped}} guard (character-sheet.hbs line 312).
  NPC must show ALL weapons. Remove that guard entirely in npc-sheet.hbs.

CRITICAL: attr-skills-grid is a 2-column CSS grid.
  NPC has 6 attributes = 3 rows × 2 cols — same as PC. Use identical structure.
  Do NOT wrap in a tab section. Sheet body flows directly without .tab/.active classes.

CRITICAL: sheet-body on NPC needs overflow-y:auto to scroll.
  Existing .starwarsd6.sheet.npc .sheet-body already has flex:1, overflow-y:auto (line 548).
  Keep this — do not change it.

CRITICAL: NPC sheet width is 480px (vs PC 650px).
  The 2-column attr-skills-grid at 480px may be tight. Consider keeping existing width
  or bumping to ~560px in DEFAULT_OPTIONS.position. The feature spec says match PC visual
  language — keep the grid but if too cramped, widen the sheet.

CRITICAL: Bio-portrait CSS.
  Current .bio-portrait rules are scoped to .tab[data-tab="bio"] — they WON'T apply to NPC.
  Must add .starwarsd6.sheet.npc .bio-portrait rule with: width/height, border, cursor:pointer.

GOTCHA: skill-list in PC sheet uses <ul>/<li> not <table>/<tr>.
  Current npc-sheet uses <table class="skills-table"> — must replace with <ul class="skill-list">.

GOTCHA: NPC sheet has a standalone "Damage" section (system.damageDice / system.damagePips)
  that doesn't exist on PC sheet. The feature spec does NOT include this section in the new layout.
  Drop it — damage is shown per-weapon in the weapons table.

GOTCHA: Old npc-section, npc-row, hit-box-tracker, hit-box-hint, hit-box-row, tier-label CSS
  classes will become orphaned. Clean them from CSS or leave (they won't hurt but are dead code).
  Prefer removing to keep CSS clean.
```

## Implementation Blueprint

### Task 1 — Extend NpcSheet._prepareContext() + add editImage action

```
MODIFY modules/apps/npc-sheet.mjs:

1. Add editImage to DEFAULT_OPTIONS.actions:
   editImage: NpcSheet.#editImage

2. In _prepareContext, add single defense field to combatData:
   context.combatData = {
     ...existing fields...
     defense: sys.rangedDefense,
   };

3. Add static #editImage method (copy from CharacterSheet verbatim):
   static async #editImage(_event, target) {
     const attr = target.dataset.edit;
     const current = foundry.utils.getProperty(this.document._source, attr);
     const fp = new foundry.applications.apps.FilePicker.implementation({
       current, type: "image",
       callback: path => this.document.update({ [attr]: path })
     });
     fp.browse(current);
   }

NOTE: Do NOT add context.document = this.document — ActorSheetV2 injects it via super.
Verify by checking if {{document.name}} works in existing npc-sheet.hbs (it does, line 3).
```

### Task 2 — Rewrite npc-sheet.hbs

Structure (top to bottom):
```
<div class="starwarsd6 sheet actor npc">
  <header class="sheet-header">
    <div class="npc-header-layout">
      <!-- Portrait top-left -->
      <img src="{{document.img}}" data-action="editImage" data-edit="img"
           class="bio-portrait" title="Click to change portrait" />
      <!-- Name input fills remaining space -->
      <input type="text" name="name" value="{{document.name}}" placeholder="NPC Name" />
    </div>
  </header>

  <div class="sheet-body">

    <!-- SECTION 1: Attributes & Skills -->
    <div class="attr-skills-grid">
      {{#each attributeGroups as |group|}}
      <div class="attr-column-block">
        <div class="attr-header">
          <button type="button" class="attr-roll-btn" data-action="rollAttribute"
                  data-attribute-key="{{group.key}}" title="Roll">
            <i class="fas fa-dice-d6"></i>
          </button>
          <span class="attr-name">{{localize group.label}}</span>
          <span class="attr-dice">
            <input type="number" name="system.{{group.key}}.dice" value="{{group.dice}}"
                   min="1" class="attr-dice-input" />D+<input type="number"
                   name="system.{{group.key}}.pips" value="{{group.pips}}"
                   min="0" max="2" class="attr-pips-input" />
          </span>
        </div>
        {{#if group.skills.length}}
        <ul class="skill-list">
          {{#each group.skills as |skill|}}
          <li class="skill-row">
            <span class="skill-name">{{skill.name}}</span>
            <span class="skill-pool">{{skill.dicePool}}D{{#if skill.pips}}+{{skill.pips}}{{/if}}</span>
            <button type="button" class="skill-roll-btn" data-action="rollSkill"
                    data-skill-id="{{skill.id}}"><i class="fas fa-dice-d6"></i></button>
            <button type="button" class="item-delete" data-action="deleteItem"
                    data-item-id="{{skill.id}}" title="Delete">✕</button>
          </li>
          {{/each}}
        </ul>
        {{/if}}
      </div>
      {{/each}}
    </div>

    <!-- SECTION 2: Weapons -->
    <h3>{{localize "STARWARSD6.Combat.Weapons"}}</h3>
    {{#if weapons.length}}
    <table class="combat-weapons-table">
      <thead>
        <tr>
          <th>{{localize "STARWARSD6.Skill.Name"}}</th>
          <th>{{localize "STARWARSD6.Item.Weapon.Damage"}}</th>
          <th>{{localize "STARWARSD6.Item.Weapon.AttackSkill"}}</th>
          <th>{{localize "STARWARSD6.Combat.AttackRoll"}}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {{#each weapons as |weapon|}}
        <tr>   <!-- NO equipped filter — NPCs show all weapons -->
          <td>{{weapon.name}}</td>
          <td>{{weapon.damageDice}}D{{#if weapon.damagePips}}+{{weapon.damagePips}}{{/if}}</td>
          <td>{{weapon.attackSkill}}</td>
          <td><button type="button" data-action="rollAttack"
                      data-weapon-id="{{weapon.id}}">{{localize "STARWARSD6.Combat.Roll"}}</button></td>
          <td><button type="button" class="item-delete" data-action="deleteItem"
                      data-item-id="{{weapon.id}}" title="Delete">✕</button></td>
        </tr>
        {{/each}}
      </tbody>
    </table>
    {{else}}
    <p class="no-items">{{localize "STARWARSD6.Inventory.Empty"}}</p>
    {{/if}}

    <!-- SECTION 3: Wounds (defense + hit boxes + thresholds) -->
    <div class="combat-wounds-section">
      <h3 class="wounds-caption">WOUNDS</h3>
      <div class="combat-defense-inline">
        <span class="defense-label">{{localize "STARWARSD6.Combat.Defense"}}</span>
        <input type="number" name="system.rangedDefense" value="{{combatData.defense}}"
               min="0" class="defense-value" />
      </div>
      <div class="wound-grid">
        <!-- Stunned -->
        <div class="wound-cell">
          <div class="wound-cell-header">{{localize "STARWARSD6.Combat.Stun"}} ({{combatData.thresholdStun}})</div>
          <div class="hit-boxes">
            {{#each combatData.stunBoxes as |box|}}
            <button type="button" class="hit-box {{#if box.marked}}marked{{/if}}"
                    data-action="markHitBox" data-tier="stun"></button>
            {{/each}}
          </div>
          <div class="wound-consequence">{{combatData.hitBoxes}} = Unconscious</div>
        </div>
        <!-- Wounded -->
        <div class="wound-cell">
          <div class="wound-cell-header">{{localize "STARWARSD6.Combat.Wound"}} ({{combatData.thresholdWound}})</div>
          <div class="hit-boxes">
            {{#each combatData.woundBoxes as |box|}}
            <button type="button" class="hit-box {{#if box.marked}}marked{{/if}}"
                    data-action="markHitBox" data-tier="wound"></button>
            {{/each}}
          </div>
          <div class="wound-consequence">{{combatData.hitBoxes}} = Incapacitated</div>
        </div>
        <!-- Incapacitated -->
        <div class="wound-cell">
          <div class="wound-cell-header">{{localize "STARWARSD6.Combat.Incap"}} ({{combatData.thresholdIncap}})</div>
          <div class="hit-boxes">
            {{#each combatData.incapBoxes as |box|}}
            <button type="button" class="hit-box {{#if box.marked}}marked{{/if}}"
                    data-action="markHitBox" data-tier="incap"></button>
            {{/each}}
          </div>
          <div class="wound-consequence">{{combatData.hitBoxes}} = Mortally Wounded</div>
        </div>
        <!-- Mortally Wounded -->
        <div class="wound-cell">
          <div class="wound-cell-header">{{localize "STARWARSD6.Combat.Mortal"}} ({{combatData.thresholdMortal}})</div>
          <div class="hit-boxes">
            {{#each combatData.mortalBoxes as |box|}}
            <button type="button" class="hit-box {{#if box.marked}}marked{{/if}}"
                    data-action="markHitBox" data-tier="mortal"></button>
            {{/each}}
          </div>
          <div class="wound-consequence">{{combatData.hitBoxes}} = Dead</div>
        </div>
      </div>
    </div>

    <!-- SECTION 4: Notes -->
    <section class="npc-section">
      <h3>{{localize "STARWARSD6.NPC.Notes"}}</h3>
      <div class="form-group">
        <textarea name="system.notes">{{system.notes}}</textarea>
      </div>
    </section>

  </div>
</div>
```

### Task 3 — Update styles/starwarsd6.css

```
ADD under existing .starwarsd6.sheet.npc block (after line ~595):

/* NPC portrait */
.starwarsd6.sheet.npc .bio-portrait {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border: 1px solid #999;
  cursor: pointer;
  flex-shrink: 0;
}
.starwarsd6.sheet.npc .bio-portrait:hover {
  border-color: #333;
}

/* NPC header layout: portrait left + name input right */
.starwarsd6.sheet.npc .npc-header-layout {
  display: flex;
  align-items: center;
  gap: 8px;
}
.starwarsd6.sheet.npc .npc-header-layout input[type="text"] {
  flex: 1;
}

REMOVE or keep dead rules for: .npc-row, .npc-row .form-group, .npc-row input, hit-box-tracker etc.
  (These become orphaned — clean up to avoid confusion.)

NOTE: All PC-shared classes (.attr-column-block, .combat-weapons-table, .wound-grid, .hit-box etc.)
  are already scoped under .starwarsd6.sheet and will apply to NPC sheet without changes.
  Do NOT duplicate them.

OPTIONALLY: If 480px NPC width is too cramped for the 2-col attr grid, bump DEFAULT_OPTIONS.position.width to 560 in npc-sheet.mjs.
```

### Task 4 — Verify tests pass

No data model changes. Run:
```bash
npx vitest run tests/unit/npc-data.test.mjs
```
If `_prepareContext` is touched, the context shape changes but no unit tests cover sheet context — no new tests needed unless a new pure function is extracted.

## Validation Gates

### Level 1: Syntax check
```bash
# Check JS syntax
node --input-type=module < modules/apps/npc-sheet.mjs 2>&1 || echo "SYNTAX ERROR"
```

### Level 2: Unit tests
```bash
npx vitest run
# Expected: all tests pass. npc-data.test.mjs has no sheet tests — should be unaffected.
```

### Level 3: Manual verification checklist (in Foundry)
```
1. Open NPC actor sheet
   - Portrait visible top-left, clicking opens FilePicker
   - Name input in header to right of portrait
2. Attributes+Skills section
   - 6 attr blocks in 2-column grid
   - Each has roll button (dice icon), name label, dice/pips inputs
   - Skills indented as bullet list with roll + delete buttons
3. Weapons section
   - combat-weapons-table renders correctly
   - ALL weapons shown (no equipped filter)
   - Roll attack button works
4. Wounds section
   - Single "Defense" editable input shown inline (bound to system.rangedDefense)
   - 2×2 wound-grid renders
   - Hit-box buttons respond to Alt+click
5. Notes section at bottom
   - Textarea present, edits persist
6. No regressions on PC character sheet
```

## Final Validation Checklist

- [ ] `node --input-type=module < modules/apps/npc-sheet.mjs` — no syntax error
- [ ] `npx vitest run` — all tests green
- [ ] NPC portrait clickable, opens FilePicker
- [ ] All 6 attributes render in 2-col grid with skills
- [ ] Weapons table shows all weapons (no equipped guard)
- [ ] Wounds grid shows single Defense input (system.rangedDefense) + hit boxes + thresholds
- [ ] Alt+click on hit-box marks damage
- [ ] Notes textarea at bottom
- [ ] No new CSS rules duplicate existing `.starwarsd6.sheet` rules
- [ ] `doc/implementation-plan.md` updated to mark feat021 complete

## Anti-Patterns to Avoid

- Do NOT add `context.document = this.document` — already injected by ActorSheetV2 super
- Do NOT add `{{#if weapon.equipped}}` guard — NPCs show all weapons
- Do NOT introduce `<nav class="sheet-tabs">` or tab sections
- Do NOT duplicate shared CSS rules under `.starwarsd6.sheet.npc`
- Do NOT add `system.damageDice` / `system.damagePips` standalone section — dropped per spec
- Do NOT use `<table>` for skills — use `<ul class="skill-list">` / `<li class="skill-row">`

---

**Confidence score: 9/10**

High confidence because: purely template+CSS change with one small MJS addition, all patterns directly copy from existing working code, all data bindings already exist in `_prepareContext`, zero data model changes, comprehensive reference snippets included above.
