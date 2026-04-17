To build a **System** for Foundry VTT v13, start by creating a system folder with a `system.json` manifest at the root, then define your data models, custom document classes, styles, localization, and any game logic in an ES module entry file. Foundry’s official system-development guide and the v13 API docs are the best starting points, and the community wiki is especially useful for practical development pitfalls and workflow advice. [foundryvtt](https://foundryvtt.com/article/module-development/)

## Recommended steps

1. Define your system idea and scope first. Keep the first version small: one actor type, one item type, and the minimum mechanics needed to prove the system works. [foundryvtt](https://foundryvtt.com/article/module-development/)

2. Create the folder structure inside Foundry’s `Data/systems/` directory. Foundry recommends that the system folder name match the `id` in `system.json` exactly, using lowercase and hyphens where possible. [foundryvtt](https://foundryvtt.com/article/module-development/)

3. Write `system.json`. This is the required manifest file, and it declares things like `id`, `title`, `version`, compatibility, authors, `esmodules`, `styles`, `languages`, `packs`, and `manifest`/`download` URLs for distribution. [foundryvtt](https://foundryvtt.com/article/module-development/)

4. Build your data model. In v13, systems are expected to define Data Models for custom actor/item types, and the official guide shows how to map sub-types to schemas and apply them through `CONFIG.Actor.dataModels` and `CONFIG.Item.dataModels`. [foundryvtt](https://foundryvtt.com/api/v13/modules.html)

5. Add your custom document logic. If your system needs special actor or item behavior, subclass the core document classes and assign them with `CONFIG.Actor.documentClass` and `CONFIG.Item.documentClass`. [foundryvtt](https://foundryvtt.com/article/module-development/)

6. Register initialization code in your ES module entry point. The official guide uses a `Hooks.once("init", ...)` block to set up models, trackable attributes, and other system configuration. [foundryvtt](https://foundryvtt.com/article/module-development/)

7. Add sheets, CSS, localization, and compendium packs. Once the core data works, you can layer on Handlebars sheets, styles, translation files, and packs. [foundryvtt](https://foundryvtt.com/article/module-development/)

8. Test in a real Foundry world, then iterate. The community wiki emphasizes checking common issues like manifest naming, directory mismatch, and data handling mistakes early. [foundryvtt](https://foundryvtt.com/article/module-development/)

## Where to learn

- Official system guide: `Introduction to System Development`, which covers manifest structure, data models, custom documents, derived data, and the entry-point setup. [foundryvtt](https://foundryvtt.com/article/module-development/)
- Foundry v13 API docs: useful for the current core API surface and v13-specific classes and hooks. [foundryvtt](https://foundryvtt.com/api/v13/modules.html)
- Community wiki development hub: a practical index of package-development articles, FAQs, and best practices. [foundryvtt](https://foundryvtt.wiki/en/development)
- Community “getting started” guide: good for common mistakes, hooks debugging, flags/settings, and other day-to-day development concerns. [foundryvtt](https://foundryvtt.com/article/module-development/)
- Official release notes for v13: helpful for understanding major breaking changes like the ApplicationV2/UI overhaul and ESM migration. [foundryvtt](https://foundryvtt.com/releases/13.338)

## v13 things to watch

v13 is important because Foundry completed a major migration to ESM and overhauled large parts of the UI around `ApplicationV2`, so older tutorials may be outdated even if their concepts still help. That means you should prefer v13-specific docs and treat older YouTube tutorials as conceptual references, not exact implementation guides. [foundryvtt](https://foundryvtt.com/releases/13.341)

## Practical starting path

A good first milestone is:
- `system.json`
- one `mysystem.mjs` entry file
- one actor data model
- one item data model
- one simple actor sheet
- a minimal test world

That gives you a working vertical slice without getting lost in every advanced feature at once. [foundryvtt](https://foundryvtt.com/article/module-development/)

If you want, I can also give you a **minimal v13 system folder template** with example `system.json` and starter files.

## Scroll preservation in single-part sheets

`scrollable: [""]` on a PART and `scrollY` in `DEFAULT_OPTIONS` only work when the scrollable element **is the PART root**. For single-part sheets with CSS-based tabs (one template, `.tab.active` shown via CSS), neither mechanism works because the scroller is a child element that gets replaced wholesale.

**Working pattern** — override `_replaceHTML` to save/restore scroll before/after the DOM swap:

```js
async _replaceHTML(result, content, options) {
  // Save scroll positions of all tab sections
  const scrolls = {};
  content.querySelectorAll("section.tab[data-tab]").forEach(el => {
    scrolls[el.dataset.tab] = el.scrollTop;
  });
  await super._replaceHTML(result, content, options);
  // Restore after swap
  content.querySelectorAll("section.tab[data-tab]").forEach(el => {
    if (scrolls[el.dataset.tab]) el.scrollTop = scrolls[el.dataset.tab];
  });
}
```

For sheets without tabs (e.g. NPC with a single `.sheet-body` scroller), same pattern with a single element:

```js
async _replaceHTML(result, content, options) {
  const body = content.querySelector(".sheet-body");
  const scrollTop = body?.scrollTop ?? 0;
  await super._replaceHTML(result, content, options);
  const newBody = content.querySelector(".sheet-body");
  if (newBody && scrollTop) newBody.scrollTop = scrollTop;
}
```

**Alternative**: use one PART per tab with `scrollable: [""]` on each (tor2e/dnd5e pattern). More code, but Foundry handles scroll automatically.
