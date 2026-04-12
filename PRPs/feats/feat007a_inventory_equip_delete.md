# feat007a — Inventory: Equip Toggle and Delete from Character Sheet

**Depends on:** feat007 (equipped field on items)

## What was added

Two missing inventory interactions on the character sheet's Inventory tab:

1. **Equipped toggle** — each weapon and armor row shows an equip button (○ / ✓). Clicking it calls `item.update({ "system.equipped": !item.system.equipped })`, which triggers `prepareDerivedData()` on the actor and immediately updates the derived defense values.

2. **Delete item** — every inventory row (weapons, armor, equipment) has a ✕ button that calls `item.delete()`.

## Files modified

| File | Change |
|------|--------|
| `modules/apps/character-sheet.mjs` | Added `equipped` to `weapons`/`armors` context maps; added `deleteItem` and `toggleEquipped` to `DEFAULT_OPTIONS.actions`; added `#deleteItem` and `#toggleEquipped` static handlers |
| `templates/actors/character-sheet.hbs` | Added Equipped column (weapons, armor) and delete column (all three inventory sections) |
| `styles/starwarsd6.css` | Styled `.item-delete` and `.equip-toggle` / `.equip-toggle.equipped` |

## Key implementation notes

- `#toggleEquipped` and `#deleteItem` both resolve `data-item-id` from the closest `[data-item-id]` ancestor — the attribute lives on the `<tr>`, buttons are inside `<td>`.
- Equipment items have no `equipped` field — only weapons and armor get the toggle column.
- No new actions are needed on the item sheet itself; `submitOnChange=true` already handles checkbox changes there (from feat007). The character sheet toggle is an independent path for convenience.
