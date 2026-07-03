## What changed
Foundry v14 introduces major platform shifts that can affect a game system: Scene Levels, a reworked Active Effects model, Template Regions replacing Measured Templates, pop-out applications, and several API/data-structure changes . Foundry’s own release notes also warn that systems and modules are not instantly updated just because core Foundry is stable, so you should expect some lag and breaking changes in your system code .


## Checklist

- Verify your system’s `minimumCoreVersion` / compatibility metadata and set a clear V14 target before testing. Foundry recommends checking package compatibility before updating, and V14 is a new generation that requires reinstalling rather than in-place updating. [foundryvtt](https://foundryvtt.com/releases/14.359)
- Test on a clean V14 install with a separate user data folder and modules disabled. Foundry explicitly recommends this to avoid confusing system issues with module conflicts. [foundryvtt](https://foundryvtt.com/releases/14.359)
- Update your build to account for V14’s core feature shifts: Scene Levels, Scene Regions, and Active Effects V2. These are not just optional additions; they affect how many systems should model elevation, area effects, and movement logic. [foundryvtt](https://foundryvtt.com/releases/14.352)
- Remove or replace any reliance on Measured Templates as a primary gameplay mechanic. V14 replaces them with Template Regions, which means code, data, UI, and compendium entries that reference measured templates need a migration path. [foundryvtt](https://foundryvtt.com/releases/14.352)
- Audit all Active Effect code. V14 changes effect duration handling, expiration events, token modifications, and effect storage, so any custom effect application or expiry logic should be retested and likely refactored. [foundryvtt](https://foundryvtt.com/releases/14.352)
- Review scene/elevation logic if your system or modules depend on vertical positioning, line of sight, reach, or movement costs. V14 makes levels native, and many V13-era scene assumptions may no longer be the best implementation strategy. [foundryvtt](https://foundryvtt.com/releases/14.352)
- Check any data schema code for breaking changes in document and field types. V14 continues the migration toward stricter typed fields and validation behavior, so custom schema definitions and update handlers should be verified against current API docs. [foundryvtt](https://foundryvtt.com/article/migration/)
- Revisit any code that interacts with `DataModel` validation, migrations, or shims. Foundry’s migration framework is built around `migrateData` and `shimData`, so systems should prefer schema-based migrations instead of ad hoc data rewriting. [foundryvtt](https://foundryvtt.com/article/migration/)
- Audit scene/canvas code that touches tokens, tiles, roofs, elevation, or rendering order. V14 includes multiple internal canvas refactors, so systems depending on legacy assumptions about object layering or token/terrain handling may need changes. [foundryvtt](https://foundryvtt.com/releases/14.359)
- Test all sheet and config classes, especially if you subclassed older `FormApplication`-style implementations or relied on old UI flows. V13 already moved heavily toward `ApplicationV2`, and V14 continues with more UI and pop-out application changes. [foundryvtt](https://foundryvtt.com/releases/13.347)
- Recheck any packaging, dependency, or compendium assumptions. V14 keeps improving package compatibility handling, but your system should still declare the correct compatibility and required relationships cleanly. [foundryvtt](https://foundryvtt.com/article/migration/)
- Run a full regression pass on core gameplay loops: character creation, item rolls, status effects, movement, area effects, vision, and scene setup. The highest-risk changes are often not syntax errors but mechanics that now behave differently because core support changed. [foundryvtt](https://foundryvtt.com/releases/14.352)

## Highest-risk areas

| Area | What to check |
|---|---|
| Templates | Replace Measured Templates logic with Template Regions.  [foundryvtt](https://foundryvtt.com/releases/14.359) |
| Effects | Rework Active Effect durations, expiration, and token changes.  [foundryvtt](https://foundryvtt.com/releases/14.352) |
| Elevation | Validate all level-based movement and visibility rules.  [foundryvtt](https://foundryvtt.com/releases/14.359) |
| Schemas | Confirm custom document fields still validate and migrate correctly.  [foundryvtt](https://foundryvtt.com/releases/14.352) |
| Canvas code | Retest tiles, roofs, tokens, and rendering assumptions.  [foundryvtt](https://foundryvtt.com/releases/14.352) |
| UI/sheets | Verify older sheet/config patterns still behave correctly.  [foundryvtt](https://foundryvtt.com/releases/13.347) |

## Suggested order

1. Back up your V13 world and package source. [foundryvtt](https://foundryvtt.com/releases/14.359)
2. Stand up a separate V14 test install. [foundryvtt](https://foundryvtt.com/releases/14.359)
3. Fix metadata and compatibility declarations. [foundryvtt](https://foundryvtt.com/article/migration/)
4. Migrate template/effect/region logic first. [foundryvtt](https://foundryvtt.com/releases/14.352)
5. Run schema and migration tests next. [foundryvtt](https://foundryvtt.com/article/migration/)

## Migration approach
A safe upgrade path is:
1. Make a full backup of your Foundry data folder and your system repository.
2. Install v14 in a separate environment or portable build.
3. Run the system with no modules first.
4. Open a copy of your world so Foundry runs its migration scripts.
5. Fix system code, documents, sheets, and migrations until the world loads cleanly .

Foundry’s release notes explicitly say v14 is not an in-place update inside Foundry; you need to uninstall/reinstall or use a separate installation, and testing in isolation is the recommended approach .

## System code areas to check
Focus your migration review on:
- Document schemas and prepared data.
- Active Effects application logic.
- Token/scene/region-related code.
- Template handling, since measured templates were removed.
- UI code for sheets, dialogs, and pop-out behavior.
- Any canvas, vision, or movement hooks tied to scene geometry .

Because v14 includes changes to how scene regions, elevations, and token-linked regions work, any system that uses custom movement, area effects, or map interactions should be regression-tested carefully .

## Practical refactor plan
A good order of work is:
- Update `system.json` compatibility fields for v14.
- Fix deprecated or removed API calls.
- Run migrations for actor, item, scene, and effect data.
- Test character sheets and item use workflows.
- Test combat, targeting, conditions, and area effects.
- Test compendium import/export and world migration .

If your system uses a lot of automation, expect the biggest pain points in data migration and effect resolution rather than basic sheet rendering .

## Recommended workflow
For a developed system, I’d use this sequence:
- Branch for v14.
- Add a migration test world with sample actors/items/scenes.
- Run the system under v14 with debug logging enabled.
- Fix schema/migration issues first.
- Then fix rendering and interaction issues.
- Finally, validate with real player workflows .

