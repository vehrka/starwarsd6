## Phase 7 — Combat Bonuses from Equipped Items

**Goal:** `armorBonus` and `weaponBonus` used in defense calculations are derived automatically from items in the actor's inventory that are marked as **equipped**, replacing the current manual-override fields on `CharacterData`.

**Complexity:** M | **Dependencies:** Phase 5 (item types), Phase 6 (combat defense values)

---

### Background

The defense formulas (feat006) already consume `actor.system.armorBonus` and `actor.system.weaponBonus`. Both are currently stored as manual `NumberField` overrides on `CharacterData`. This feature replaces those manual inputs: the system sums bonuses from equipped armor and weapon items automatically, then exposes the totals as derived values.

**Rules reference** (`doc/rules-reference.md`):

- **Ranged Defense:** `floor(3.5 × dodge_dice) + dodge_pips + armor_bonus`
  - `armor_bonus` comes from worn armor items
- **Melee Defense:** `floor(3.5 × melee_parry_dice) + melee_parry_pips + weapon_bonus`
  - `weapon_bonus` comes from the parrying weapon held
- **Brawling Defense:** no equipment bonus (unarmed by definition)

---

### Data model changes

#### `ArmorData` (`modules/items/armor-data.mjs`)

Add an `equipped` boolean field:

```js
equipped: new BooleanField({ initial: false })
```

#### `WeaponData` (`modules/items/weapon-data.mjs`)

Add an `equipped` boolean field:

```js
equipped: new BooleanField({ initial: false })
```

`weaponBonus` already exists on `WeaponData` — no change needed there.

#### `CharacterData` (`modules/actors/character-data.mjs`)

- **Remove** `armorBonus: NumberField` and `weaponBonus: NumberField` from `defineSchema()`.
- In `prepareDerivedData()`, after existing penalty calculations, sum bonuses from equipped items:

```js
// Derived from equipped items — requires actor context
if (this.parent) {
  this.armorBonus = this.parent.items
    .filter(i => i.type === "armor" && i.system.equipped)
    .reduce((sum, i) => sum + i.system.armorBonus, 0);

  this.weaponBonus = this.parent.items
    .filter(i => i.type === "weapon" && i.system.equipped)
    .reduce((sum, i) => sum + i.system.weaponBonus, 0);
} else {
  this.armorBonus = 0;
  this.weaponBonus = 0;
}
```

`calculateRangedDefense` and `calculateMeleeDefense` in `modules/helpers/defense.mjs` already read `actor.system.armorBonus` and `actor.system.weaponBonus` — **no changes needed** there.

---

### Sheet changes

#### Item sheets — add equipped toggle

Both `ArmorSheet` and `WeaponSheet` (or their shared template) need an **Equipped** checkbox that persists via `item.update()`.

In each item sheet template, within the item's stats section:

```hbs
<label class="equipped-label">
  <input type="checkbox" name="system.equipped" {{checked item.system.equipped}}>
  {{localize "STARWARSD6.Item.Equipped"}}
</label>
```

#### Character sheet — display only (no manual input)

Remove the manual `armorBonus` / `weaponBonus` number inputs from the combat tab. Defense values already reflect the derived totals — no additional display change is required unless a breakdown tooltip is desired (out of scope here).

---

### Localization (`lang/en.json`)

Add:

```json
"STARWARSD6.Item.Equipped": "Equipped"
```

---

### Files to modify

| File | Change |
|------|--------|
| `modules/items/armor-data.mjs` | Add `equipped: BooleanField` |
| `modules/items/weapon-data.mjs` | Add `equipped: BooleanField` |
| `modules/actors/character-data.mjs` | Remove manual bonus fields; derive `armorBonus`/`weaponBonus` from equipped items in `prepareDerivedData()` |
| `templates/items/armor-sheet.hbs` | Add equipped checkbox |
| `templates/items/weapon-sheet.hbs` | Add equipped checkbox |
| `templates/actors/character-sheet.hbs` | Remove manual bonus inputs from combat tab |
| `lang/en.json` | Add `STARWARSD6.Item.Equipped` |

---

### Invariants & edge cases

- A character with **no equipped armor** → `armorBonus = 0` (existing behavior preserved).
- A character with **no equipped weapon** → `weaponBonus = 0` (existing behavior preserved).
- **Multiple armor pieces** equipped simultaneously: bonuses stack (sum). This matches the rules, which list no restriction on stacking.
- **Multiple equipped weapons**: all `weaponBonus` values sum. Realistic use is one melee weapon at a time, but the system does not enforce that constraint.
- `equipment` items have no combat bonus fields — they are excluded from the filter by `i.type`.
- `armorBonus` on `CharacterData` transitions from a schema field to a derived-only property. Any saved actor data that previously stored a manual value will be ignored after this change (migration not required — the old field simply goes away; Foundry ignores unknown fields on load).

---

### Testing

1. Create a character with dodge `3D+2`.
2. Add an armor item (`armorBonus = 1`), leave unequipped → `rangedDefense` unchanged.
3. Equip the armor → `rangedDefense` increases by 1.
4. Add a second armor item (`armorBonus = 2`), equip it → `rangedDefense` increases by a further 2.
5. Unequip first armor → `rangedDefense` drops by 1.
6. Repeat analogous steps for a weapon item and `meleeDefense`.
7. Verify `brawlingDefense` is unaffected by equipping any item.
