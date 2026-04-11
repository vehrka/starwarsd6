# PRP-feat002 — Bug: Actor Sheet Fails to Render

## Goal

Fix `CharacterSheet` so that opening a character actor no longer throws a console error and the sheet renders correctly. One file changes; one line changes.

## Why

- The system is currently unusable — every actor open attempt crashes with an unhandled promise rejection
- Root cause is a missing mixin; it is a single-line fix
- Unblocks all further development

## What

`modules/apps/character-sheet.mjs` currently extends `foundry.applications.sheets.ActorSheetV2` directly. `ActorSheetV2` inherits from `ApplicationV2`, which declares `_renderHTML` and `_replaceHTML` as abstract methods. Without `HandlebarsApplicationMixin`, those abstract methods are never implemented, so Foundry throws the error at render time.

**Fix:** Wrap the base class with `HandlebarsApplicationMixin` before extending it.

### Success Criteria

- [ ] Opening a character actor produces no console errors
- [ ] The character sheet renders (attributes table + skills section visible)
- [ ] Editing an attribute value persists (submitOnChange still works)

---

## All Needed Context

### Error (verbatim)

```
Uncaught (in promise) Error: The CharacterSheet Application class is not renderable
because it does not implement the abstract methods _renderHTML and _replaceHTML.
Consider using a mixin such as foundry.applications.api.HandlebarsApplicationMixin
for this purpose.
```

### Documentation & References

```yaml
- url: https://foundryvtt.com/api/v13/functions/foundry.applications.api.HandlebarsApplicationMixin.html
  why: Official API for the mixin — documents _renderHTML, _replaceHTML, and PARTS contract

- file: ref/dnd5e/module/applications/api/application-v2-mixin.mjs
  why: Shows the canonical pattern for combining HandlebarsApplicationMixin with ActorSheetV2
       Line 4: const { HandlebarsApplicationMixin } = foundry.applications.api;
       Line 20: const _Base = HandlebarsApplicationMixin(Base);

- file: ref/dnd5e/module/applications/actor/api/base-actor-sheet.mjs
  why: Shows that BaseActorSheet wraps its base class through ApplicationV2Mixin which
       applies HandlebarsApplicationMixin internally — same pattern needed here
```

### Current Codebase Tree

```
fvtt-starwarsd6/
├── system.json
├── starwarsd6.mjs                        ← registers CharacterSheet; no change needed
├── modules/
│   ├── actors/
│   │   ├── character-data.mjs            ← no change needed
│   │   └── character.mjs                 ← no change needed
│   ├── items/
│   │   ├── skill-data.mjs                ← no change needed
│   │   └── skill.mjs                     ← no change needed
│   └── apps/
│       └── character-sheet.mjs           ← THE ONLY FILE THAT CHANGES
├── templates/
│   └── actors/
│       └── character-sheet.hbs           ← no change needed
├── styles/
│   └── starwarsd6.css
└── lang/
    └── en.json
```

### Desired Codebase Tree

No new files. Same tree, with `character-sheet.mjs` fixed.

### Known Gotchas & Critical Constraints

```js
// CRITICAL: HandlebarsApplicationMixin is a Foundry global — access via the namespace,
// do NOT import it. The correct destructure is:
//   const { HandlebarsApplicationMixin } = foundry.applications.api;
// This must be at module top-level (file scope), before the class declaration.

// CRITICAL: PARTS must be declared on the class for HandlebarsApplicationMixin to work.
// The existing static PARTS = { sheet: { template: "..." } } is correct — keep it.

// CRITICAL: _prepareContext() is the correct ApplicationV2 context method.
// Do NOT switch to getData(). Keep existing _prepareContext() as-is.

// CRITICAL: The mixin call wraps the base class, not the subclass:
//   HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2)
// NOT:
//   HandlebarsApplicationMixin(CharacterSheet)   ← WRONG

// GOTCHA: static DEFAULT_OPTIONS merging still works the same way after applying the mixin.
// All existing DEFAULT_OPTIONS and PARTS remain valid.

// GOTCHA: super._prepareContext(options) in _prepareContext() still works after the mixin.
// The mixin does not remove or override _prepareContext.
```

---

## Implementation Blueprint

### Current file (`modules/apps/character-sheet.mjs`)

```js
export default class CharacterSheet extends foundry.applications.sheets.ActorSheetV2 {
  // ... rest unchanged
```

### Fixed file (`modules/apps/character-sheet.mjs`)

```js
const { HandlebarsApplicationMixin } = foundry.applications.api;

export default class CharacterSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  // ... rest unchanged (DEFAULT_OPTIONS, PARTS, _prepareContext all stay identical)
```

### Tasks

```yaml
Task 1 — MODIFY modules/apps/character-sheet.mjs:
  - ADD at line 1 (before the class declaration):
      const { HandlebarsApplicationMixin } = foundry.applications.api;
  - CHANGE the class declaration from:
      export default class CharacterSheet extends foundry.applications.sheets.ActorSheetV2 {
    TO:
      export default class CharacterSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  - PRESERVE everything else exactly: DEFAULT_OPTIONS, PARTS, _prepareContext body
```

---

## Validation Loop

### Level 1 — Static Syntax Checks

```bash
# Verify HandlebarsApplicationMixin is referenced (not imported) as a global
grep -n "HandlebarsApplicationMixin" modules/apps/character-sheet.mjs
# Expected output (2 lines):
#   1: const { HandlebarsApplicationMixin } = foundry.applications.api;
#   3: export default class CharacterSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {

# Verify no forbidden import of HandlebarsApplicationMixin
grep -n "^import.*HandlebarsApplicationMixin" modules/apps/character-sheet.mjs \
  && echo "ERROR: HandlebarsApplicationMixin must not be imported" || echo "OK"

# Verify no deprecated APIs crept in
grep -n "getData\|mergeObject\|duplicate" modules/apps/character-sheet.mjs \
  && echo "ERROR: deprecated API found" || echo "OK: no deprecated APIs"

# Verify PARTS still defined (required by HandlebarsApplicationMixin)
grep -n "static PARTS" modules/apps/character-sheet.mjs \
  && echo "OK: PARTS defined" || echo "ERROR: PARTS missing — mixin requires it"

# Verify _prepareContext still present
grep -n "_prepareContext" modules/apps/character-sheet.mjs \
  && echo "OK: _prepareContext present" || echo "ERROR: _prepareContext missing"
```

### Level 2 — Deploy and Functional Validation (Manual, in Foundry)

```bash
./deploy.sh
```

Then in Foundry:

1. **No init errors**: Open the starwarsd6 world → browser console must be clean (no red errors)
2. **Sheet opens**: Double-click any character actor → sheet window appears
3. **Attributes render**: All 6 attribute rows (DEX, KNO, MEC, PER, STR, TEC) visible with dice/pips inputs and baseValue
4. **Edit persists**: Change DEX dice from 2 to 3 → tab out → re-open sheet → DEX dice still shows 3
5. **Skills render**: If the actor has skill items, they appear in the skills table

### Final Validation Checklist

- [ ] `grep "HandlebarsApplicationMixin" modules/apps/character-sheet.mjs` shows 2 hits (destructure + class extends)
- [ ] No `import` statement for `HandlebarsApplicationMixin` (it's a global)
- [ ] `static PARTS` still present with correct template path `systems/starwarsd6/templates/actors/character-sheet.hbs`
- [ ] `_prepareContext` unchanged
- [ ] `./deploy.sh` exits 0
- [ ] Character sheet opens in Foundry with no console errors
- [ ] Attribute edits persist after sheet close/reopen

---

## Anti-Patterns to Avoid

- **Do not** `import { HandlebarsApplicationMixin } from "..."` — it is a Foundry global
- **Do not** add `_renderHTML` or `_replaceHTML` manually — the mixin provides them
- **Do not** change `_prepareContext` or touch `PARTS` — they are correct as-is
- **Do not** restructure the class or add extra features — this is a one-line bug fix

---

## Confidence Score: 10/10

The root cause is unambiguous (error message names the missing mixin), the fix is surgical (one destructure + one class declaration change), all surrounding code remains valid, and the pattern is directly observable in `ref/dnd5e/module/applications/api/application-v2-mixin.mjs` line 4 and 20.
