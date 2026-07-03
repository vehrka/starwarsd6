# feat028 — Migrate system v13 → v14 (keep v13 compat)

## Context

`doc/fvtt/fvtt_v13_to_v14_migration.md` flags v14 platform shifts: Scene Levels, Active Effects V2, Template Regions (replacing Measured Templates), canvas refactors, stricter typed fields, and `template.json` deprecation. Goal: plan the v13→v14 upgrade and keep v13 working from one codebase.

**Key finding from code exploration:** this system is *already* on the modern v13 stack — ApplicationV2 sheets + `TypeDataModel` schemas + `foundry.applications.*` namespaces throughout. It uses **none** of v14's biggest breaking surfaces:

- No `ActiveEffect` / `CONFIG.statusEffects` — health tracked via plain numeric schema fields (`stunMarks`/`woundMarks`/`incapMarks`/`mortalMarks`) updated with `actor.update()` in `modules/helpers/damage.mjs`.
- No `MeasuredTemplate` / Scene Regions / elevation / canvas geometry — canvas use is read-only token lookups (`canvas.tokens?.get(id)`).
- No legacy `template.json` schema — already `TypeDataModel` (satisfies the v14 deprecation).
- No v1 sheets (`FormApplication`/`getData`/`activateListeners`) in system code.

So this is an **API audit + manifest bump + targeted runtime-gating**, not a rewrite.

**Scope decided:** single runtime-gated codebase (no fork), v14 test install available.

## Approach

Single branch runs on both. Add `game.release.generation >= 14` (or `foundry.utils.isNewerVersion`) branches **only** where an API actually differs on the live v14 install. Do not pre-emptively fork or rewrite working v13 code.

## Risk register (audit targets, highest first)

Verify each on the v14 install; add a runtime gate only if it actually broke.

| # | Surface | Files | v14 concern |
|---|---------|-------|-------------|
| 1 | Legacy appv1 sheet classes (used only to `unregisterSheet` core defaults) | `starwarsd6.mjs:47,60` — `foundry.appv1.sheets.ActorSheet` / `ItemSheet` | `foundry.appv1` namespace most likely removed/renamed. If gone, core defaults may auto-unregister or need a new unregister path. |
| 2 | FilePicker | `character-sheet.mjs:743`, `npc-sheet.mjs:126` — `foundry.applications.apps.FilePicker.implementation` | FilePicker moved namespaces across versions; confirm path. |
| 3 | AppV2 lifecycle overrides | `character-sheet.mjs:48,59`; `npc-sheet.mjs:34,42`; `character-print.mjs`, `npc-print.mjs`, `roll-dialog.mjs` `_onRender`/`_replaceHTML`/`_onClose` | AppV2 internals are the likeliest signature/behavior shift. |
| 4 | Internal Roll/Die construction for Dice So Nice | `dsn.mjs:2,11-14` — `new foundry.dice.terms.Die`, hand-set `roll.terms`/`roll._evaluated` | Relies on internal Roll/Die shape; fragile across versions. |
| 5 | Chat card hook | `starwarsd6.mjs:73` — `Hooks.on("renderChatMessageHTML", …)` | v13 hook name; confirm still valid in v14 (native DOM handler). |
| 6 | Sheet registration | `starwarsd6.mjs:46` — `foundry.applications.apps.DocumentSheetConfig` | Confirm namespace stable. |
| 7 | Roll evaluate() form | `dice.mjs:18,78`; `force.mjs:19` — `new Roll(...).evaluate()` async | Low risk; verify no-arg async evaluate unchanged. |

**Not applicable** (system doesn't touch them — checked, not missed): Active Effects V2, Measured Templates → Scene Regions, Scene Levels/elevation, canvas layering/roofs, `TokenMovementActionConfig`, `EffectChangeData`.

## Manifest — `system.json`

- `compatibility`: set `"minimum": "13"`, `"verified": "14"`. Leave `maximum` unset (Foundry-preferred).
- `version`/`url`/`manifest`/`download` keep `#{VERSION}#` etc. CI placeholders — untouched.
- No `packs`/`relationships` exist → nothing else to reconcile. (Optional: declare Dice So Nice as an optional `relationships` entry — currently used but undeclared. Out of scope unless wanted.)

## Data migration

No stored-data schema change is being introduced, so **no `migrateData`/`shimData` needed yet**. If any field is renamed/retyped during the audit, add a `static migrateData(source)` on the affected `TypeDataModel` (per `doc/…/migration.md` — prefer schema migration over ad-hoc rewrite). There is currently **no** `migrationVersion` flag; only introduce one if a real data migration lands.

Asymmetry to keep in mind if fields ever get shared/migrated: `rangedDefense`/`meleeDefense`/`brawlingDefense` are **stored** NumberFields on `npc-data.mjs` but **derived** (non-schema) on `character-data.mjs`.

## Runtime-gating pattern (apply only where audit proves a break)

Central helper instead of scattered checks (promote to `modules/helpers/version.mjs` per repo scope ladder once 3+ call sites appear): a small `isV14()` returning `game.release.generation >= 14`, then `if (isV14()) { …v14 path… } else { …v13 path… }` at the specific broken call. Keep both paths in one file; no dynamic dispatch (KISS per CLAUDE.md).

## Deploy — `deploy.sh`

Target is hardcoded to `share/foundrydata_13/…` (v13-only). For v14 testing, add a parallel target (env var or `--v14` flag pointing at the v14 data path) — do **not** repoint the existing v13 deploy.

## Execution order

1. Back up world + repo; branch `v14-compat` (or work on `dev`).
2. Deploy current code to the v14 install (add v14 deploy target).
3. Open the v14 test world; watch console for deprecation warnings / errors.
4. Walk the risk register 1→7; gate only what actually breaks.
5. Bump `system.json` `verified: "14"`.
6. Re-run the regression checklist below on **both** v13 and v14.

## Verification

- **Unit tests** (version-agnostic, run first): `npm test` (vitest). Existing 15 suites cover dice/damage/defense/force/schemas via dependency-injected roll fns — must stay green on the single codebase.
- **v14 live smoke** (on the available v14 install):
  1. Create character + NPC; open both sheets (incl. print pop-outs → `window.print`).
  2. Open all item sheets (skill/weapon/armor/equipment/forcePower).
  3. Roll a skill via RollDialog (wild die: force a 1 → complication, a 6 → explode).
  4. Damage flow: roll damage chat card → resolve tier → mark hit box (as GM and as non-GM via socket).
  5. Spend CP extra-die button on a chat card.
  6. Dice So Nice animation renders (if module active) with the 3 colorsets.
  7. Console clean of errors + deprecation warnings.
- **v13 regression**: repeat 1–7 on the v13 install to confirm no gate broke v13.

## Files touched at execution time

- `system.json` (compatibility bump)
- `deploy.sh` (add v14 target)
- Only the specific files in the risk register that fail on v14 (gate in place)
- Possibly a new `modules/helpers/version.mjs` (`isV14`) if 3+ gate sites appear
