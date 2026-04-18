# Data — Compendium Source Files

Source data for Star Wars D6 compendiums. Each subdirectory contains a CSV data file and a JSON template for use with the [Data Toolbox](https://github.com/svenwerlen/fvtt-data-toolbox) Foundry module.

## Directory Structure

| Directory | CSV | Template | Entity Type |
|-----------|-----|----------|-------------|
| `armor/` | `armor.csv` | `armor-template.json` | Item |
| `equipment/` | `equipment.csv` | `equipment-template.json` | Item |
| `forcepowers/` | `forcepowers.csv` | `forcepowers-template.json` | Item |
| `skills/` | `skills.csv` | `skills-template.json` | Item |
| `weapons/` | `weapons.csv` | `weapons-template.json` | Item |

## Import with Data Toolbox

### Prerequisites

Install the **Data Toolbox** module in Foundry VTT. From Setup → Add-on Modules → Install Module, search for "Data Toolbox" or use the manifest URL:

```
https://raw.githubusercontent.com/svenwerlen/fvtt-data-toolbox/master/module.json
```

### Steps (per dataset)

1. Open the `Data macros` compendium from the Data Toolbox module
2. Import and execute the `Show Toolbox` macro
3. In the dialog:
   - **Source file**: path to the `.csv` file (e.g. `systems/starwarsd6/data/weapons/weapons.csv`)
   - **Template file**: path to the matching `-template.json` (e.g. `systems/starwarsd6/data/weapons/weapons-template.json`)
   - **Entity type**: `Item`
   - **Compendium name**: choose a name (e.g. `starwarsd6-weapons`)
4. Click **Generate compendium** and wait for completion

Repeat for each subdirectory.

## File Format

### CSV

- First row: column headers — must match `{{variable}}` names in the template
- Optional second row: `sample` in first column, remaining columns set default values for empty fields
- Numbers and strings are auto-detected from the first non-sample value

### Template (JSON)

Standard Foundry document JSON with `{{ColumnName}}` placeholders. Example (`weapons-template.json`):

```json
{
  "name": "{{name}}",
  "type": "weapon",
  "system": {
    "damageDice": {{damageDice}},
    "damagePips": {{damagePips}},
    "attackSkill": "{{attackSkill}}",
    "weaponBonus": {{weaponBonus}},
    "range": "{{range}}"
  }
}
```

String values use `"{{placeholder}}"`, numbers use `{{placeholder}}` (no quotes).
