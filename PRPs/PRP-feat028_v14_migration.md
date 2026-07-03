name: "feat028 — Foundry VTT v13 → v14 migration (single dual-compat codebase)"
description: |
  Audit-and-gate migration. This system is already on the modern v13 stack (ApplicationV2 +
  TypeDataModel + foundry.applications.* namespaces). v14 is an API audit + manifest bump +
  targeted runtime-gating — NOT a rewrite. Goal: one branch that runs on both v13 and v14.

## Purpose
Bring the `starwarsd6` system to Foundry VTT v14 compatibility from a **single runtime-gated
codebase** (no fork), keeping v13 fully working. Verify each risk-register surface on the live
v14 install; add a `game.release.generation >= 14` gate **only where an API actually breaks**.

## Core Principles
1. **Context is King**: full risk register + exact file:line targets are in this PRP.
2. **Validation Loops**: `npm test` (183 tests, 14 suites) must stay green on the one codebase after every change.
3. **Information Dense**: mirror existing AppV2/TypeDataModel patterns; no new abstractions.
4. **Progressive Success**: deploy current code to v14 → observe → gate only what broke → re-verify both.
5. **Global rules**: follow `CLAUDE.md` — KISS (explicit `if`, no dynamic dispatch), YAGNI (no pre-emptive forks), scope ladder (promote `isV14` to `modules/helpers/version.mjs` only at 3+ call sites), one export per file, never assign document props directly (`actor.update()`).

---

## Goal
`system.json` declares `compatibility.minimum: "13"`, `verified: "14"`. System loads clean on a
v14 test world — no console errors, no deprecation warnings — and the full regression checklist
passes on **both** v13 and v14. Any API divergence is handled by a minimal in-file runtime gate,
not a rewrite. No stored-data schema change unless the audit forces one.

## Why
- v14 is a new Foundry generation with breaking platform shifts; the system must keep working for players when servers upgrade.
- v14 is **not** an in-place update — it requires a separate/reinstalled build, so migration must be verified on an isolated v14 install.
- Single codebase avoids maintaining two branches; users on v13 and v14 both run the same release.

## What
Runtime-gated dual-compat. Deploy current code to the available v14 install, walk the risk
register highest-first, and gate each surface only if it actually breaks on the live v14 build.
Bump the manifest. Add a parallel v14 deploy target (do not repoint the v13 one).

### Success Criteria
- [ ] `npm test` → 14 suites / 183 tests green (unchanged) after all edits.
- [ ] System loads on v14 test world: no errors, no deprecation warnings in console.
- [ ] Full regression checklist (below) passes on v14 **and** v13.
- [ ] `system.json` → `verified: "14"`, `minimum: "13"`, no `maximum`.
- [ ] Only risk-register files that genuinely broke on v14 are modified, each with a runtime gate.
- [ ] `deploy.sh` has a v14 target; the existing v13 target is untouched.
- [ ] `isV14()` lives in `modules/helpers/version.mjs` **iff** 3+ gate sites appeared; otherwise inline.

## All Needed Context

### Documentation & References
```yaml
- file: PRPs/feats/feat028_v14_migration.md
  why: The source feature spec — risk register, scope decision (single gated codebase, v14 install available), execution order, verification checklist. Authoritative; this PRP expands it.

- file: doc/fvtt/fvtt_v13_to_v14_migration.md
  why: v14 platform-shift checklist + official Foundry release-note URLs. Note most items (Scene Levels, Regions, Active Effects V2, canvas) are N/A here — this system doesn't touch them.

- url: https://foundryvtt.com/article/migration/
  section: migrateData / shimData — schema-based migration framework
  critical: Prefer static migrateData(source) on the TypeDataModel over ad-hoc rewrite IF (and only if) a field is renamed/retyped during the audit. No data migration is planned.

- url: https://foundryvtt.com/releases/14.359
  why: v14 stable notes — separate install required, test clean with modules disabled, package compatibility, canvas refactors.

- url: https://foundryvtt.com/releases/14.352
  why: v14 feature shifts (Scene Levels, Regions, Active Effects V2) — confirm N/A for this system.

- file: doc/fvtt/fvtt_sysdev.md
  why: Foundry v13 system-dev guide and pitfalls — AppV2 lifecycle, DataModel patterns.

- dir: ref/dnd5e/module/
  why: PRIMARY reference (official Foundry-recommended v13 system). Consult for AppV2 lifecycle / FilePicker / DocumentSheetConfig namespace usage if a v14 signature is unclear.

- file: CLAUDE.md
  why: mandatory engineering standards — KISS/YAGNI/Rule-of-Three/scope-ladder/one-export, document-mutation rule, Foundry globals never imported.
```

### Current Codebase (relevant slice)
```bash
starwarsd6.mjs                    # entry: init hook — data models, sheet registration, chat hooks, DSN colorsets
system.json                       # manifest — compatibility.verified currently "13"
deploy.sh                         # rsync to share/foundrydata_13/... (v13-only, hardcoded)
package.json                      # "test": "vitest run" ; vitest ^2
modules/
  apps/
    character-sheet.mjs           # ActorSheetV2 + Handlebars; FilePicker @ :743
    npc-sheet.mjs                 # ActorSheetV2; FilePicker @ :126; _replaceHTML @ :34, _onRender @ :42
    character-print.mjs           # ApplicationV2; _onRender @ :99 (window.print pop-out)
    npc-print.mjs                 # ApplicationV2; _onRender @ :73
    roll-dialog.mjs               # ApplicationV2; _onClose @ :95
    item-sheet.mjs / skill-sheet.mjs   # ItemSheetV2
  helpers/
    dice.mjs                      # new Roll("1d6").evaluate() @ :18,78
    force.mjs                     # new Roll("1d6").evaluate() @ :19
    dsn.mjs                       # new foundry.dice.terms.Die; hand-sets roll.terms/_evaluated @ :1-15
    damage.mjs / defense.mjs / socket.mjs
  actors/ *-data.mjs              # TypeDataModel schemas (character, npc)
  items/  *-data.mjs              # TypeDataModel schemas (skill, weapon, armor, equipment, forcePower)
tests/
  unit/*.test.mjs (14 files, 183 tests)   # version-agnostic, DI'd roll fns
  mocks/foundry.mjs
# NOTE: no template.json exists → v14 template.json deprecation already satisfied.
```

### Desired end state
```bash
system.json                       # compatibility.verified "14", minimum "13", no maximum
deploy.sh                         # + v14 target (--v14 flag or env var → v14 data path)
modules/helpers/version.mjs       # NEW, ONLY IF 3+ gate sites: export default isV14()
# + only the specific risk-register files that broke on v14, each with an inline/helper gate.
# If nothing breaks: only system.json + deploy.sh change.
```

### Known Gotchas & Library Quirks
```js
// CRITICAL: v14 is NOT an in-place update. Must run on a SEPARATE v14 install with a distinct
//           user-data folder, modules DISABLED first, to distinguish system vs module breakage.

// CRITICAL: This system uses NONE of v14's biggest breaking surfaces — do not "migrate" them:
//   - No ActiveEffect / CONFIG.statusEffects (health = plain numeric schema fields updated via actor.update() in damage.mjs).
//   - No MeasuredTemplate / Scene Regions / elevation / canvas geometry (canvas use = read-only canvas.tokens?.get(id)).
//   - No legacy template.json (already TypeDataModel).
//   - No v1 sheets in system code (FormApplication/getData/activateListeners) — appv1 is referenced ONLY to unregister core defaults.

// GOTCHA (Risk 1, HIGHEST): starwarsd6.mjs:47,60 use foundry.appv1.sheets.ActorSheet / ItemSheet
//   purely to DocumentSheetConfig.unregisterSheet the core defaults. If foundry.appv1 is removed/renamed
//   in v14, this throws at init and nothing loads. Likely fix: core defaults auto-unregister when a
//   makeDefault sheet is registered → the unregister call may be droppable, OR a new unregister path.
//   VERIFY on v14; check ref/dnd5e for how it unregisters core sheets on v14.

// GOTCHA (Risk 4, fragile): dsn.mjs builds a Roll by hand — new foundry.dice.terms.Die({...}),
//   then sets die.results / die._evaluated / die.options.appearance, and buildRoll() sets
//   roll.terms + roll._evaluated to skip Roll.fromTerms re-parsing. Relies on INTERNAL Roll/Die
//   shape. Most likely to silently break DSN animation on v14. If it breaks, prefer the documented
//   Roll construction path (see ref/dnd5e Roll usage) over patching internals further.

// GOTCHA (Risk 3): AppV2 lifecycle overrides call super._onRender / super._replaceHTML / super._onClose.
//   These are the likeliest signature/behavior shifts. npc-sheet.mjs:34 _replaceHTML preserves
//   scrollTop; print sheets' _onRender @ character-print:99 / npc-print:73 wire window.print;
//   roll-dialog:95 _onClose. If a super signature changed, gate the specific call.

// GOTCHA (Risk 2): FilePicker path foundry.applications.apps.FilePicker.implementation
//   (character-sheet:743, npc-sheet:126). FilePicker has moved namespaces across versions — confirm on v14.

// GOTCHA (Risk 5): chat hook Hooks.on("renderChatMessageHTML", (message, html) => ...) in
//   starwarsd6.mjs:73. v13 native-DOM hook (html is a DOM element, uses querySelectorAll). Confirm the
//   hook name/signature is still valid in v14; all Roll Damage / Mark Hit Box / Spend CP buttons hang off it.

// GOTCHA (Risk 6/7, LOW): DocumentSheetConfig namespace (foundry.applications.apps) @ starwarsd6.mjs:46;
//   no-arg async Roll.evaluate() @ dice.mjs:18,78 & force.mjs:19. Confirm unchanged; likely fine.

// RULE: Gate with an explicit `if (isV14()) { …v14… } else { …v13… }` at the broken call site only.
//   No dynamic dispatch, no runtime string→function lookup (KISS). Keep BOTH paths in one file.

// RULE: isV14() = game.release.generation >= 14 (or foundry.utils.isNewerVersion). Inline it while
//   there are <3 call sites; promote to modules/helpers/version.mjs (one default export) at the 3rd site,
//   updating all existing call sites in the promoting change. Never skip the scope level.

// RULE: game/CONFIG/Hooks/Roll/Actor/Item are Foundry globals — never import them.

// DATA: rangedDefense/meleeDefense/brawlingDefense are STORED NumberFields on npc-data.mjs but
//   DERIVED (non-schema) on character-data.mjs. If any of these is ever migrated, mind that asymmetry.
//   There is currently NO migrationVersion flag — introduce one only if a real data migration lands.
```

## Implementation Blueprint

### Approach (pseudocode)
```text
# Phase A — set up & observe (no code gates yet)
1. Back up v14 test world + repo. Branch v14-compat (or work on dev per feature spec).
2. Add a v14 deploy target to deploy.sh (parallel; do NOT touch v13 target).
3. Deploy current unchanged code to the v14 install.
4. Open the v14 test world with modules DISABLED. Watch console: record every error + deprecation warning,
   mapping each to a risk-register row.

# Phase B — gate only what broke, highest risk first
for surface in [appv1-unregister, FilePicker, AppV2-lifecycle, DSN-Roll/Die, chat-hook, DocumentSheetConfig, Roll.evaluate]:
    if surface errors/deprecates on v14:
        write minimal v14 path at the exact call site
        gate: if (isV14()) { v14 } else { v13 }   # inline until 3rd gate → then modules/helpers/version.mjs
        re-deploy to v14, confirm that error is gone
    else:
        leave untouched (YAGNI — no pre-emptive fork)

# Phase C — manifest + regression
5. system.json: compatibility → minimum "13", verified "14", no maximum.
6. npm test → must stay 14/183 green (version-agnostic; DI'd roll fns).
7. Run the live smoke checklist on v14, then repeat on v13 to prove no gate regressed v13.

# Data migration: only if Phase B renamed/retyped a stored field →
#   add static migrateData(source) on the affected TypeDataModel (dnd5e / foundryvtt.com/article/migration pattern)
#   + introduce a migrationVersion flag. Otherwise skip entirely.
```

### isV14 helper (only when promoted — modules/helpers/version.mjs)
```js
// One default export (CLAUDE.md one-export-per-file). game is a global — do not import.
/** True when running on Foundry v14 or newer. */
export default function isV14() {
  return game.release.generation >= 14;
}
```

### list of tasks (in order)
```yaml
Task 1 — Branch & backup:
  - Create branch v14-compat (feature spec allows working on dev; prefer a branch).
  - Ensure v14 test world + repo are backed up (v14 is not an in-place update).

Task 2 — MODIFY deploy.sh:
  - PRESERVE REMOTE_BASE="share/foundrydata_13/Data/systems/starwarsd6" (v13 target untouched).
  - ADD a v14 target: e.g. a `--v14` flag (or env var) that swaps REMOTE_BASE to the v14 data path.
  - KEEP the existing RSYNC_OPTS excludes identical.

Task 3 — Deploy current code to v14 & observe (no gates yet):
  - Run ./deploy.sh --v14. Open the v14 world (modules disabled).
  - Record each console error / deprecation warning → map to risk rows 1–7.

Task 4 — Gate Risk 1 (appv1 unregister) IF broken:
  - FILE starwarsd6.mjs:47,60 — foundry.appv1.sheets.ActorSheet / ItemSheet.
  - If foundry.appv1 removed: gate the two unregisterSheet calls (or drop if core auto-unregisters on register). Mirror ref/dnd5e v14 unregister pattern.

Task 5 — Gate Risk 2 (FilePicker) IF broken:
  - FILES character-sheet.mjs:743, npc-sheet.mjs:126 — foundry.applications.apps.FilePicker.implementation.
  - Gate to the v14 namespace/path; keep v13 path in else.

Task 6 — Gate Risk 3 (AppV2 lifecycle) IF broken:
  - FILES npc-sheet.mjs:34/42, character-print.mjs:99, npc-print.mjs:73, roll-dialog.mjs:95, character-sheet.mjs.
  - Only gate the specific super._onRender/_replaceHTML/_onClose call whose signature changed.

Task 7 — Gate Risk 4 (DSN Roll/Die internals) IF broken:
  - FILE dsn.mjs:1-15 — makeDie/buildRoll hand-set die.results/_evaluated/options.appearance, roll.terms/_evaluated.
  - Prefer documented Roll construction on the v14 path over deeper internal patching. Guard remains no-op when DSN inactive.

Task 8 — Gate Risk 5 (chat hook) IF broken:
  - FILE starwarsd6.mjs:73 — Hooks.on("renderChatMessageHTML", (message, html) => ...).
  - Confirm hook name/signature (message + DOM html). If renamed in v14, register the v14 hook name under the gate.

Task 9 — Confirm Risks 6 & 7 (LOW):
  - starwarsd6.mjs:46 DocumentSheetConfig namespace; dice.mjs:18,78 & force.mjs:19 no-arg async Roll.evaluate(). Verify; gate only if actually broken.

Task 10 — Promote isV14 IF 3+ gate sites:
  - CREATE modules/helpers/version.mjs (isV14, one default export). Update all gate call sites to import it in the same change. Skip if <3 sites (keep inline).

Task 11 — MODIFY system.json:
  - compatibility.minimum "13", verified "14". Do NOT set maximum. Leave #{VERSION}#/#{URL}# CI placeholders untouched.

Task 12 — Data migration ONLY IF a field changed in Tasks 4–9:
  - ADD static migrateData(source) on the affected *-data.mjs TypeDataModel + a migrationVersion flag. Otherwise skip.

Task 13 — Validate (see Validation Loop): npm test green + live smoke on v14 AND v13.
```

## Integration Points
```yaml
MANIFEST:
  - file: system.json
  - change: compatibility → { minimum: "13", verified: "14" } ; no maximum
  - untouched: version/url/manifest/download CI placeholders; documentTypes; socket; languages

DEPLOY:
  - file: deploy.sh
  - add: v14 target (--v14 flag or env var) pointing at the v14 data path
  - preserve: v13 REMOTE_BASE and all rsync excludes

RUNTIME GATE:
  - locus: exact broken call site in a risk-register file
  - pattern: if (isV14()) { …v14 path… } else { …v13 path… }   # explicit, KISS
  - promote: modules/helpers/version.mjs (isV14) only at 3+ sites

DATA (conditional):
  - locus: affected modules/{actors,items}/*-data.mjs TypeDataModel
  - pattern: static migrateData(source) + migrationVersion flag — only if a field renamed/retyped
```

## Validation Loop

### Level 1: Unit tests (version-agnostic — run first, after every edit)
```bash
npm test
# Expected: Test Files 14 passed (14) ; Tests 183 passed (183).
# These use dependency-injected roll fns and are Foundry-version-agnostic — they MUST stay green
# on the single codebase. A red test after a gate means the gate leaked into shared logic — fix, don't mock.
```

### Level 2: v14 live smoke (on the available v14 install; modules disabled first)
```text
Deploy: ./deploy.sh --v14   →  open v14 test world  →  console must be clean (no errors, no deprecations).
1. Create a character + an NPC; open both sheets, incl. print pop-outs (window.print).
2. Open every item sheet: skill / weapon / armor / equipment / forcePower.
3. Roll a skill via RollDialog. Force wild die = 1 → complication; = 6 → explode.
4. Damage flow: attack chat card → Roll Damage → resolve tier → Mark Hit Box
   (as GM directly, and as non-GM via socket).
5. Spend CP extra-die button on a chat card (repeatable; decrements CP; removes block at 0).
6. Dice So Nice animation renders (if module active) with the 3 colorsets (normal / pc-wild / npc-wild).
7. Console clean of errors + deprecation warnings.
```

### Level 3: v13 regression (prove no gate broke v13)
```text
Repeat smoke steps 1–7 on the v13 install (./deploy.sh, existing target).
Every v13 behavior must be identical to pre-migration.
```

## Final Validation Checklist
- [ ] `npm test` → 14 suites / 183 tests green.
- [ ] v14 world loads: no console errors, no deprecation warnings.
- [ ] v14 smoke steps 1–7 all pass.
- [ ] v13 smoke steps 1–7 all pass (no regression).
- [ ] `system.json`: minimum "13", verified "14", no maximum, CI placeholders intact.
- [ ] `deploy.sh`: v14 target added; v13 target unchanged.
- [ ] Only risk-register files that actually broke were modified; each has an explicit gate.
- [ ] `isV14` inline if <3 sites, else in `modules/helpers/version.mjs` (one export) with all sites updated.
- [ ] No data migration added unless a field was renamed/retyped (then migrateData + migrationVersion).

## Anti-Patterns to Avoid
- ❌ Don't rewrite Active Effects / Templates / canvas code — the system doesn't use them.
- ❌ Don't pre-emptively fork working v13 code (YAGNI). Gate only proven breaks.
- ❌ Don't add `migrateData`/`migrationVersion` "just in case" — only for a real field change.
- ❌ Don't use dynamic dispatch or string→function lookup for version branching — explicit `if` (KISS).
- ❌ Don't scatter `game.release.generation` checks — inline until 3 sites, then one helper.
- ❌ Don't repoint the v13 deploy target; add a parallel v14 one.
- ❌ Don't set `compatibility.maximum` (Foundry-preferred to leave unset).
- ❌ Don't import Foundry globals (game/CONFIG/Hooks/Roll/Actor/Item).
- ❌ Don't assign document props directly — use `actor.update()` / `item.update()`.
- ❌ Don't mock a failing test to green — a red test means a gate leaked into shared logic.

---
## Confidence Score: 9/10
One-pass success is high: the feature spec already did the codebase audit, the risk register maps
every concern to exact file:line, all N/A surfaces are pre-cleared, and validation is a single
`npm test` plus a concrete smoke script. The only residual uncertainty (−1) is inherent: the exact
v14 API deltas can't be known until the code runs on the live v14 install (Phase A observation) —
which is precisely why the approach is observe-then-gate rather than blind rewrite.
