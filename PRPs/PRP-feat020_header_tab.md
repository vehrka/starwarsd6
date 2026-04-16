# PRP-feat020 — Bio Tab: Character Identity Fields + Portrait

## Goal

Add a **Bio** tab to the PC character sheet displaying identity fields and the actor portrait, matching the layout of `doc/ref/old_header.png`. Six new `StringField` entries in `CharacterData` plus template + CSS only. No roll logic.

## Why

The paper Star Wars D6 sheet has a prominent identity block (Character Type, Name, Height, Weight, Sex, Age, Physical Description, portrait). The digital sheet currently lacks this. It is a standalone cosmetic feature — no rules impact.

## What

### New DataModel Fields (`character-data.mjs`)

| Field | Type | Notes |
|-------|------|-------|
| `characterType` | `StringField` | Free-text (e.g. "Rebel Pilot") |
| `height` | `StringField` | Free-text (e.g. "1.8m") |
| `weight` | `StringField` | Free-text |
| `sex` | `StringField` | Free-text |
| `age` | `StringField` | Free-text |
| `description` | `StringField` | Multiline physical description (textarea in template) |

All: `required: false, initial: ""`.

### New Tab

- Tab id: `"bio"`, group: `"primary"`, localization key: `STARWARSD6.Tab.Bio`
- Default active tab stays `"attributes"` (no change to `tabGroups`)
- Tab added **first** in the nav list (before Attributes & Skills)

### Layout (matching `doc/ref/old_header.png`)

```
Row 1: [ Character Type _________________ ]   [ Portrait (actor.img) ]
Row 2: [ Character Name (actor.name) _____ ]   (portrait spans rows 1-2)
Row 3: [ Height ____  Weight ____  Sex ____  Age ____ ]
Row 4: [ Physical Description (textarea) ___________________________________ ]
```

Portrait: top-right, clicking opens Foundry file-picker using `data-edit="img"` on the `<img>` element — this is the standard ApplicationV2 / ActorSheetV2 built-in mechanism (no custom action handler needed).

Character Name is read from `actor.name` (already in the header `<input>`). On the Bio tab it shows as a read-only display **or** a second editable input (`name="name"`) — use read-only `<span>` to avoid double-edit surface.

### Success Criteria

- [ ] Six new `StringField` fields in `character-data.mjs` `defineSchema()`
- [ ] `STARWARSD6.Tab.Bio` key in `lang/en.json`
- [ ] Six field label keys in `lang/en.json`
- [ ] Bio tab nav entry in `character-sheet.hbs`
- [ ] Bio tab `<section>` panel in `character-sheet.hbs` with correct layout
- [ ] Portrait `<img>` with `data-edit="img"` renders `actor.img` and is clickable
- [ ] CSS scoped under `.starwarsd6.sheet .tab[data-tab="bio"]`
- [ ] All existing unit tests pass (`npm test`)
- [ ] `doc/implementation-plan.md` updated to list feat020

---

## All Needed Context

### Key Files

```yaml
- file: modules/actors/character-data.mjs
  why: PRIMARY TARGET for new StringField entries. Current schema ends at line 47 (mortalMarks).
       Pattern to follow exactly:
         new StringField({ required: false, initial: "" })
       Destructure already includes StringField at line 5:
         const { NumberField, SchemaField, BooleanField, StringField, ArrayField } = foundry.data.fields;
       Add six entries before the closing `};` of defineSchema().

- file: modules/apps/character-sheet.mjs (lines 53-168)
  why: _prepareContext() — no changes needed. `context.system` already exposes all
       DataModel fields to the template. New StringFields are available as
       `system.characterType`, `system.height`, etc. automatically.
       tabGroups (line 41): `{ primary: "attributes" }` — default active tab unchanged.
       No JS changes required.

- file: templates/actors/character-sheet.hbs (lines 11-30)
  why: Tab nav pattern. Each tab link:
         <a class="item {{#if (eq tabs.primary 'TAB_ID')}}active{{/if}}"
            data-action="tab" data-tab="TAB_ID" data-group="primary">
           {{localize "STARWARSD6.Tab.TAB_LABEL"}}
         </a>
       Add the Bio tab FIRST (before the attributes link at line 12).

- file: templates/actors/character-sheet.hbs (lines 32-125)
  why: Tab panel pattern. Each tab section:
         <section class="tab {{#if (eq tabs.primary 'TAB_ID')}}active{{/if}}"
                  data-tab="TAB_ID" data-group="primary">
           ...content...
         </section>
       Add Bio tab section BEFORE the Attributes tab section (before line 32).

- file: styles/starwarsd6.css (lines 55-65)
  why: Tab show/hide pattern — `.tab { display:none }` / `.tab.active { display:block }`.
       All new CSS must be scoped under `.starwarsd6.sheet .tab[data-tab="bio"]`.

- file: lang/en.json
  why: Add new keys. Pattern: `"STARWARSD6.Bio.CharacterType": "Character Type"`.
       Existing keys relevant to bio: none — all six field labels are new.
       Tab key `STARWARSD6.Tab.Bio` is also new.

- file: doc/ref/old_header.png
  why: Visual reference. Layout: Character Type + portrait top-right (portrait spans 2 rows),
       Character Name below Character Type, then Height/Weight/Sex/Age inline,
       then Physical Description textarea. Two-column layout: left=fields, right=portrait.
```

### Portrait Editing Mechanism

In ApplicationV2 / `ActorSheetV2`, the built-in image editing is triggered by:

```html
<img src="{{document.img}}" data-edit="img" class="bio-portrait" title="Click to change portrait" />
```

The `data-edit="img"` attribute is the standard Foundry v13 mechanism — `ActorSheetV2` inherits it from the base application class. No custom `data-action` or JS handler needed. The existing sheet's `_onRender` does not handle image editing specifically; it is handled by the framework automatically.

**Do NOT** use `data-action="editImage"` (that is an older ApplicationV1/FormApplication pattern). Use `data-edit="img"` only.

### `_prepareContext` — no changes needed

```js
// modules/apps/character-sheet.mjs line 58:
context.system = this.document.system;
// This already exposes ALL DataModel fields including the six new ones.
// Template accesses them as {{system.characterType}}, {{system.height}}, etc.
// No additional context preparation required.
```

### Tab Registration — no JS needed

The sheet uses `tabGroups = { primary: "attributes" }` (line 41) to track active tab and `_prepareContext` exposes it as `context.tabs` (line 56). The template checks `(eq tabs.primary 'TAB_ID')`. Adding a new tab is purely a template change — no JS array/object registration needed in this system's ApplicationV2 setup.

```js
// character-sheet.mjs line 41:
tabGroups = { primary: "attributes" };
// This drives: context.tabs = this.tabGroups; (line 56)
// Template uses: {{#if (eq tabs.primary 'bio')}}active{{/if}}
// Clicking the tab nav link (data-action="tab") sets tabGroups.primary = "bio" automatically
// via ApplicationV2 built-in tab handling.
```

---

## Implementation Blueprint

### Task 1 — `modules/actors/character-data.mjs`

Add six `StringField` entries to `defineSchema()`. Insert before `stunMarks` line (line 43) to keep wound marks grouped:

```js
// AFTER line 42 (keptUpPowers), BEFORE line 43 (stunMarks):
characterType: new StringField({ required: false, initial: "" }),
height:        new StringField({ required: false, initial: "" }),
weight:        new StringField({ required: false, initial: "" }),
sex:           new StringField({ required: false, initial: "" }),
age:           new StringField({ required: false, initial: "" }),
description:   new StringField({ required: false, initial: "" }),
```

No other changes to this file.

### Task 2 — `lang/en.json`

Add before the closing `}`. After line 172 (`"STARWARSD6.RollFailure": "Failure"`):

```json
"STARWARSD6.Tab.Bio": "Bio",
"STARWARSD6.Bio.CharacterType": "Character Type",
"STARWARSD6.Bio.CharacterName": "Character Name",
"STARWARSD6.Bio.Height": "Height",
"STARWARSD6.Bio.Weight": "Weight",
"STARWARSD6.Bio.Sex": "Sex",
"STARWARSD6.Bio.Age": "Age",
"STARWARSD6.Bio.Description": "Physical Description"
```

### Task 3 — `templates/actors/character-sheet.hbs`

**Step A — Tab nav:** Insert Bio tab link as first entry in `<nav class="sheet-tabs">` (before current line 12):

```hbs
<a class="item {{#if (eq tabs.primary 'bio')}}active{{/if}}"
   data-action="tab" data-tab="bio" data-group="primary">
  {{localize "STARWARSD6.Tab.Bio"}}
</a>
```

**Step B — Tab panel:** Insert Bio tab section before the Attributes tab section (before current `{{!-- ATTRIBUTES + SKILLS TAB --}}` comment). Full panel:

```hbs
{{!-- BIO TAB --}}
<section class="tab {{#if (eq tabs.primary 'bio')}}active{{/if}}"
         data-tab="bio" data-group="primary">

  <div class="bio-layout">

    <div class="bio-fields">

      <div class="bio-row">
        <label class="bio-label">{{localize "STARWARSD6.Bio.CharacterType"}}</label>
        <input type="text" name="system.characterType"
               value="{{system.characterType}}"
               class="bio-input" />
      </div>

      <div class="bio-row">
        <label class="bio-label">{{localize "STARWARSD6.Bio.CharacterName"}}</label>
        <span class="bio-name-display">{{document.name}}</span>
      </div>

      <div class="bio-row bio-row--inline">
        <span class="bio-inline-group">
          <label class="bio-label">{{localize "STARWARSD6.Bio.Height"}}</label>
          <input type="text" name="system.height"
                 value="{{system.height}}"
                 class="bio-input bio-input--short" />
        </span>
        <span class="bio-inline-group">
          <label class="bio-label">{{localize "STARWARSD6.Bio.Weight"}}</label>
          <input type="text" name="system.weight"
                 value="{{system.weight}}"
                 class="bio-input bio-input--short" />
        </span>
        <span class="bio-inline-group">
          <label class="bio-label">{{localize "STARWARSD6.Bio.Sex"}}</label>
          <input type="text" name="system.sex"
                 value="{{system.sex}}"
                 class="bio-input bio-input--short" />
        </span>
        <span class="bio-inline-group">
          <label class="bio-label">{{localize "STARWARSD6.Bio.Age"}}</label>
          <input type="text" name="system.age"
                 value="{{system.age}}"
                 class="bio-input bio-input--short" />
        </span>
      </div>

      <div class="bio-row bio-row--description">
        <label class="bio-label">{{localize "STARWARSD6.Bio.Description"}}</label>
        <textarea name="system.description"
                  class="bio-textarea">{{system.description}}</textarea>
      </div>

    </div>{{!-- .bio-fields --}}

    <div class="bio-portrait-col">
      <img src="{{document.img}}"
           data-edit="img"
           class="bio-portrait"
           title="Click to change portrait" />
    </div>

  </div>{{!-- .bio-layout --}}

</section>
```

### Task 4 — `styles/starwarsd6.css`

Append at end of file. All rules scoped under `.starwarsd6.sheet .tab[data-tab="bio"]`:

```css
/* ===== BIO TAB ===== */
.starwarsd6.sheet .tab[data-tab="bio"] .bio-layout {
  display: flex;
  gap: 1em;
  padding: 8px 4px;
  align-items: flex-start;
}

.starwarsd6.sheet .tab[data-tab="bio"] .bio-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.starwarsd6.sheet .tab[data-tab="bio"] .bio-portrait-col {
  flex-shrink: 0;
  width: 100px;
}

.starwarsd6.sheet .tab[data-tab="bio"] .bio-portrait {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border: 1px solid #999;
  cursor: pointer;
  display: block;
}

.starwarsd6.sheet .tab[data-tab="bio"] .bio-portrait:hover {
  border-color: #333;
}

.starwarsd6.sheet .tab[data-tab="bio"] .bio-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  border-bottom: 1px dotted #ddd;
  padding-bottom: 2px;
}

.starwarsd6.sheet .tab[data-tab="bio"] .bio-row--inline {
  flex-wrap: wrap;
  gap: 8px 16px;
  border-bottom: 1px dotted #ddd;
}

.starwarsd6.sheet .tab[data-tab="bio"] .bio-row--description {
  flex-direction: column;
  align-items: flex-start;
  border-bottom: none;
}

.starwarsd6.sheet .tab[data-tab="bio"] .bio-inline-group {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.starwarsd6.sheet .tab[data-tab="bio"] .bio-label {
  font-weight: bold;
  font-size: 0.85em;
  color: #333;
  white-space: nowrap;
  flex-shrink: 0;
}

.starwarsd6.sheet .tab[data-tab="bio"] .bio-input {
  flex: 1;
  border: none;
  border-bottom: 1px solid #aaa;
  background: transparent;
  font-size: 0.9em;
  padding: 0 2px;
}

.starwarsd6.sheet .tab[data-tab="bio"] .bio-input--short {
  flex: 0 0 4em;
  width: 4em;
}

.starwarsd6.sheet .tab[data-tab="bio"] .bio-name-display {
  font-size: 0.9em;
  color: #222;
  border-bottom: 1px solid #ddd;
  flex: 1;
  padding: 0 2px;
}

.starwarsd6.sheet .tab[data-tab="bio"] .bio-textarea {
  width: 100%;
  min-height: 4em;
  border: 1px solid #aaa;
  background: transparent;
  font-size: 0.85em;
  resize: vertical;
  padding: 4px;
  box-sizing: border-box;
  font-family: inherit;
}
```

### Task 5 — `doc/implementation-plan.md`

Add feat020 to the Phase Overview table after Phase 9. Insert new row:

```
| 10 | Bio Tab | Bio identity fields + portrait on character sheet | S | 1 |
```

And add a brief Phase 10 section at the end of the document.

---

## Known Gotchas & Critical Constraints

```
CRITICAL: `data-edit="img"` is the correct v13 ApplicationV2 mechanism for portrait editing.
  - ActorSheetV2 inherits this from the base application layer.
  - Do NOT use data-action="editImage" (that's v1/FormApplication).
  - The existing sheet has no custom portrait editing — this is the first usage.
  - If data-edit="img" does not trigger in the deployed sheet, fall back to wrapping
    the img in a button with data-action="editImage" and adding a static handler:
      static async #editImage(event, target) {
        const fp = new FilePicker({ type: "image", callback: src => this.document.update({ img: src }) });
        fp.browse(this.document.img);
      }
    But try data-edit="img" first — it's the documented v13 pattern.

CRITICAL: `description` field name — check for collision.
  - equipment items have `i.system.description` (character-data.mjs line 101).
  - This is on the ITEM DataModel (equipment-data.mjs), NOT CharacterData.
  - Adding `description` to CharacterData is safe — different document type.
  - Template accesses it as `system.description` (actor's system, not item).

CRITICAL: `name="system.description"` in the textarea — Foundry form handling.
  - `form: { submitOnChange: true }` (character-sheet.mjs line 15) means the textarea
    fires a change event on blur/change → triggers actor.update({ "system.description": value }).
  - Use `<textarea name="system.description">{{system.description}}</textarea>` — do NOT
    use value= attribute (that's for <input>, not <textarea>).

GOTCHA: Character Name display — actor.name is NOT in `system.*`.
  - `document.name` is the top-level actor name.
  - The sheet header already has `<input name="name" value="{{document.name}}" ...>`.
  - On the Bio tab, show it as read-only `<span>` to avoid a duplicate edit surface.
  - Do NOT add a second `<input name="name">` — that would create two inputs binding
    to the same field, causing race conditions on submitOnChange.

GOTCHA: `actor.img` vs `document.img`.
  - In the template context, `document` is the actor document.
  - Use `{{document.img}}` — this is the standard portrait path.
  - The context already exposes `document` (from super._prepareContext).

GOTCHA: `form.submitOnChange: true` — all `<input>` and `<textarea>` elements with
  a `name` attribute will auto-save on change. This is the existing pattern — no special
  handling needed for the new fields.

GOTCHA: Tab ordering matters for UX — Bio tab is added FIRST before Attributes & Skills.
  The default active tab stays `"attributes"` (tabGroups = { primary: "attributes" }),
  so the sheet always opens on the Attributes tab. Bio is accessible by clicking.

GOTCHA: The `<section>` for Bio must be placed BEFORE the Attributes section in the HBS.
  Tab visibility is CSS-driven (display:none vs display:block) — order in DOM doesn't
  affect which is active, but convention is to keep DOM order matching nav order.

GOTCHA: CSS selector `.tab[data-tab="bio"]` — this requires the section element to have
  both `class="tab ..."` and `data-tab="bio"`. Verify the template has both attributes.
  The active class pattern: `class="tab {{#if (eq tabs.primary 'bio')}}active{{/if}}"`.

DO NOT: run deploy.sh — user deploys manually.
DO NOT: modify character-sheet.mjs (no JS changes needed).
DO NOT: add a duplicate `<input name="name">` for actor name.
DO NOT: use data-action="editImage" — use data-edit="img".
```

---

## Validation Gates

### Level 1 — DataModel Fields

```bash
cd /home/perico/1_projects/101_dev/fvtt-starwarsd6

# Verify all 6 new fields present in defineSchema
grep -n "characterType\|height\|weight\|sex\|age\|description" modules/actors/character-data.mjs
# Expected: 6 lines, each showing new StringField entry

# Verify StringField destructure already present (should exist from before)
grep "StringField" modules/actors/character-data.mjs
# Expected: found at line 5
```

### Level 2 — Localization Keys

```bash
# Verify all new lang keys added
grep "STARWARSD6.Tab.Bio\|STARWARSD6.Bio\." lang/en.json
# Expected: 8 matches (Tab.Bio + 7 Bio.* field labels)
```

### Level 3 — Template Structure

```bash
# Bio tab nav entry present
grep -n "data-tab=\"bio\"" templates/actors/character-sheet.hbs
# Expected: 2 matches (nav link + section panel)

# Portrait with data-edit="img"
grep -n "data-edit" templates/actors/character-sheet.hbs
# Expected: 1 match (bio-portrait img)

# All 5 editable field inputs present (not description — textarea)
grep -n 'name="system.characterType"\|name="system.height"\|name="system.weight"\|name="system.sex"\|name="system.age"' templates/actors/character-sheet.hbs
# Expected: 5 matches

# Description textarea present
grep -n 'name="system.description"' templates/actors/character-sheet.hbs
# Expected: 1 match

# No second name input (actor.name not duplicated)
grep -c 'name="name"' templates/actors/character-sheet.hbs
# Expected: 1 (only the sheet header input)

# Bio tab active class pattern correct
grep -n "eq tabs.primary 'bio'" templates/actors/character-sheet.hbs
# Expected: 2 matches (nav link + section)
```

### Level 4 — CSS Scope

```bash
# New CSS rules scoped correctly
grep -n "data-tab=\"bio\"\|data-tab='bio'" styles/starwarsd6.css
# Expected: multiple matches (one per CSS rule block)

# No unscoped .bio-* rules leaking
grep -n "^\.bio-" styles/starwarsd6.css
# Expected: 0 (all rules should be nested under .starwarsd6.sheet .tab[data-tab="bio"])
```

### Level 5 — Unit Tests

```bash
npm test
# Expected: all tests pass (green). No JS was modified.
# If any test fails, run: git diff modules/ to confirm no accidental JS change.
```

---

## Files Changed

```
modules/actors/character-data.mjs     ← ADD 6 StringField entries to defineSchema()
lang/en.json                          ← ADD 8 keys (Tab.Bio + 7 Bio.* labels)
templates/actors/character-sheet.hbs  ← ADD bio tab nav entry + bio tab section panel
styles/starwarsd6.css                 ← APPEND bio tab CSS (scoped)
doc/implementation-plan.md            ← ADD Phase 10 row + section
```

No new files. No changes to: `character-sheet.mjs`, `starwarsd6.mjs`, `system.json`.

---

## Confidence Score: 9/10

**Strong:**
- Pattern is well-established (existing tabs, existing StringField usage in DataModel).
- No new JS, no new roll logic, no new files.
- All CSS patterns (flex layout, input styling) already proven in codebase.
- The `submitOnChange: true` form pattern handles persistence automatically.
- `context.system` already exposes all DataModel fields to template.

**Deduction (-1):**
- Portrait `data-edit="img"` behavior in v13 ActorSheetV2 is correct per Foundry docs but untested in this codebase. If it doesn't work, a fallback JS handler is documented in the gotchas above.
