# Star Wars D6 — Unified Rules Reference

This document is the single authoritative rules reference for implementing the Star Wars D6 Foundry VTT system. It merges the base 1st edition rules (player handout) with Bill Slavicsek's convention house rules. Where the house rules modify or replace a base rule, the house rules take precedence. Where the house rules are silent, the base rules apply unchanged.

**Sources:**
- Base rules: `doc/ref/player_handout.md`
- House rules: `doc/ref/Bill_Slavicsek_1e_House_Rules_Sheet.md`

---

## Attributes

Every character has six attributes. Each attribute has a die code (e.g., `3D+2`).

| Abbreviation | Attribute   | Description                                              |
|--------------|-------------|----------------------------------------------------------|
| DEX          | Dexterity   | Eye-hand coordination and agility                        |
| KNO          | Knowledge   | Knowledge of the galaxy                                  |
| MEC          | Mechanical  | Ability to pilot vehicles and starships                  |
| PER          | Perception  | Powers of observation; ability to influence others        |
| STR          | Strength    | Physical strength, health, and ability to resist damage   |
| TEC          | Technical   | Ability to fix, repair, and modify technology             |

A die code of `2D` is about average; `4D` is notably skilled.

---

## Skills

A skill is listed under its parent attribute. An unskilled character rolls the parent attribute's die code for that skill's checks.

### Character Creation

Characters receive **7D** to distribute among skills. A maximum of **2D** may be added to any single skill. Each die added increases the number before the "D" by one; pips carry over from the parent attribute.

> Formula: `skill_die_code = attribute_die_code + allocated_dice`

### Skill List

#### Dexterity Skills

| Skill           | Description                                      |
|-----------------|--------------------------------------------------|
| blaster         | Fire blaster weapons                             |
| brawling parry  | Block unarmed (brawling) attacks                 |
| dodge           | Avoid ranged attacks                             |
| melee combat    | Fight with hand-held melee weapons               |
| melee parry     | Block melee weapon attacks (requires holding a weapon) |

#### Knowledge Skills

| Skill             | Description                                            |
|-------------------|--------------------------------------------------------|
| alien species     | Knowledge of species other than your own               |
| languages         | Speak and understand foreign languages                 |
| planetary systems | Knowledge of planets and star systems                  |
| streetwise        | Knowledge of criminal groups and the Fringe            |
| survival          | Survive in harsh environments                          |

#### Mechanical Skills

| Skill                | Description                                      |
|----------------------|--------------------------------------------------|
| astrogation          | Plot hyperspace jumps                            |
| beast riding         | Ride living mounts                               |
| repulsorlift operation | Fly repulsorlift vehicles (speeders, cloud cars) |
| space transports     | Fly freighters and non-fighter, non-capital ships |
| starfighter piloting | Fly starfighters (X-wings, Y-wings, etc.)        |
| starship gunnery     | Fire starship-mounted weapons                    |

#### Perception Skills

| Skill    | Description                                    |
|----------|------------------------------------------------|
| bargain  | Negotiate deals                                |
| con      | Deceive or persuade others                     |
| gambling | Gamble                                         |
| search   | Spot hidden objects or details                 |
| sneak    | Move without being detected                    |

#### Strength Skills

| Skill            | Description                                  |
|------------------|----------------------------------------------|
| brawling         | Unarmed combat                               |
| climbing/jumping | Climb surfaces and jump gaps                  |
| stamina          | Resist fatigue, disease, and physical strain  |

#### Technical Skills

| Skill                        | Description                                  |
|------------------------------|----------------------------------------------|
| computer programming/repair  | Use, repair, and program computers            |
| droid programming            | Program droids                                |
| droid repair                 | Repair droids                                 |
| first aid                    | Apply first aid techniques                    |
| medicine                     | Advanced medical treatment (Requires 5D in First Aid) |
| space transports repair      | Repair freighters                             |
| starfighter repair           | Repair starfighters                           |

#### Force Skills

Force skills are **not** listed under any attribute. They have independent die codes and are only available to Force-sensitive characters.

| Skill   | Description                                              |
|---------|----------------------------------------------------------|
| control | Control one's own body and internal Force abilities       |
| sense   | Sense the Force in surroundings, beings, and objects      |
| alter   | Manipulate the Force to affect others and the environment |

See **The Force** section for full mechanics on learning, using, and advancing Force skills.

---

## Die Codes & Rolling

### Die Code Notation

A die code is written as `ND+P`, where:
- `N` = number of six-sided dice to roll
- `P` = a pip bonus (0, +1, or +2) added to the total

> Example: `3D+2` means roll 3 dice and add 2 to the sum.

### The Wild Die

One die (visually distinct) is designated the **Wild Die**. It is always included in every attribute and skill roll.

| Wild Die Result | Effect |
|-----------------|--------|
| 2–5             | Add to total normally |
| 6               | Add 6 to total, then reroll the Wild Die and add again. Keep rerolling and adding as long as the result is 6. |
| 1               | The GM chooses one of three outcomes: (a) add 1 to total normally; (b) subtract the Wild Die **and** the next highest die from the total; (c) add 1 to total normally but a **complication** occurs — something unexpected and disadvantageous happens. |

The Wild Die applies to all attribute and skill rolls. It does not apply to damage rolls or other non-skill rolls.

---

## Actions & Rounds

### Rounds

A **round** represents approximately 5 seconds of game time.

### Single Action

A character may perform **one action** per round at their full die code.

### Multiple Actions

A character may attempt more than one action per round. For each additional action beyond the first, apply a **−1D penalty to every skill and attribute roll** that round.

| Actions Attempted | Penalty per Roll |
|-------------------|-----------------|
| 1                 | 0               |
| 2                 | −1D             |
| 3                 | −2D             |
| 4                 | −3D             |
| N                 | −(N−1)D         |

> Formula: `effective_die_code = base_die_code − (total_actions − 1)D`

The penalty applies to **all** rolls made that round, including reactive rolls (e.g., dodge declared as one of the round's actions).

---

## Difficulty Numbers

When a character attempts a non-opposed action, the GM assigns a difficulty number. Roll the relevant skill (or attribute if unskilled). If the total equals or exceeds the difficulty number, the action succeeds.

### Difficulty Chart

| Difficulty       | Range | Reference Die Code |
|------------------|-------|--------------------|
| Very Easy        | 3–5   | `1D`               |
| Easy             | 6–10  | `2D–3D`            |
| Moderate         | 11–15 | `4D`               |
| Difficult        | 16–20 | `5D–6D`            |
| Very Difficult   | 21–25 | `7D`               |
| Impossible       | 26–30 | `8D–9D`            |

The "Reference Die Code" column indicates the approximate skill level needed to have a reasonable chance of success at that difficulty.

### Opposed Rolls (Non-Combat)

When two characters act against each other outside of combat (e.g., con vs. willpower, sneak vs. search), both roll their relevant skill dice. The higher total wins. Ties go to the initiating character.

---

## Combat

Combat replaces the base game's opposed attack/defense rolls with a static Defense target number system (house rule).

### Attack Rolls

To attack, roll the appropriate combat skill. The difficulty number is the target's **Defense value** (see below). If the roll equals or exceeds the Defense, the attack hits.

| Attack Type    | Skill Used     | Defense Used      |
|----------------|----------------|-------------------|
| Ranged         | blaster (or starship gunnery, etc.) | Ranged Defense |
| Melee weapon   | melee combat   | Melee Defense     |
| Brawling       | brawling       | Brawling Defense  |

### Defense Values

Defense is a **static derived value**, not a roll. Each character has up to three Defense values:

#### Ranged Defense

> Formula: `ranged_defense = floor(3.5 × dodge_dice) + dodge_pips + armor_bonus`

- `dodge_dice`: the number of dice in the character's `dodge` skill (or DEX if unskilled in dodge)
- `dodge_pips`: the +1 or +2 from the dodge die code
- `armor_bonus`: a variable modifier from worn armor (input per character/situation)

> Example: Dodge `3D+2`, blast vest (+1 armor) → `floor(3.5 × 3) + 2 + 1` = `10 + 2 + 1` = **13**

#### Melee Defense

> Formula: `melee_defense = floor(3.5 × melee_parry_dice) + melee_parry_pips + weapon_bonus`

- `melee_parry_dice`: the number of dice in the character's `melee parry` skill (or DEX if unskilled)
- `melee_parry_pips`: the +1 or +2 from the melee parry die code
- `weapon_bonus`: a variable modifier from the parrying weapon (input per character/situation)

#### Brawling Defense

> Formula: `brawling_defense = floor(3.5 × brawling_parry_dice) + brawling_parry_pips`

- `brawling_parry_dice`: the number of dice in the character's `brawling parry` skill (or DEX if unskilled)
- No equipment bonus (unarmed by definition)

### Damage Roll

On a successful hit, roll the weapon's **damage die code**. Compare the total against the target's **damage thresholds** to determine the severity.

### Damage Thresholds

Damage thresholds are derived from the character's **Strength** attribute.

> Base value formula: `base = floor(3.5 × STR_dice) + STR_pips`

| Damage Tier       | Threshold Range          |
|--------------------|--------------------------|
| Stun               | damage_total < base      |
| Wound              | base ≤ damage_total < 2 × base |
| Incapacitated      | 2 × base ≤ damage_total < 3 × base |
| Mortally Wounded   | damage_total ≥ 3 × base |

> Example: STR `3D` → base = `floor(3.5 × 3)` = **10**.
> Stun: < 10, Wound: 10–19, Incapacitated: 20–29, Mortally Wounded: 30+.

### Hit Boxes

Each damage tier has a number of **hit boxes** equal to the character's **STR dice** (pips do not contribute).

> Formula: `hit_boxes_per_tier = STR_dice`

> Example: STR `3D+1` → 3 hit boxes per tier.

When a character takes damage of a given tier, mark one hit box in that tier.

### Damage Effects

Each damage tier imposes cumulative penalties:

| Tier             | Penalty per Mark          | Overflow Effect                                    |
|------------------|---------------------------|----------------------------------------------------|
| Stun             | −1 to all skill/attribute rolls per stun mark | If stun marks = stun boxes → character falls **unconscious** |
| Wound            | −1D to all skill/attribute rolls per wound mark | If wound marks = wound boxes → character is **incapacitated** (add 1 incapacitated mark) |
| Incapacitated    | −2D to all skill/attribute rolls per incap mark | If incap marks = incap boxes → character is **mortally wounded** (add 1 mortal mark) |
| Mortally Wounded | −3D to all skill/attribute rolls per mortal mark | If mortal marks = mortal boxes → character is **dead** |

### Targeted Combat Resolution (Automated)

When a player has a token targeted before clicking Roll Attack:

1. The system reads the **target actor's** defense value (ranged/melee/brawling based on weapon skill) and pre-fills the **Difficulty** field in the roll dialog with that value.
2. The Difficulty field is **editable** — adjust before rolling for range penalties, cover bonuses, called shots, aiming, or any other situational modifier. The roll resolves against the **edited** value, not the raw defense.
3. The chat card shows the target name, the **effective difficulty used** (post-edit), and hit/miss result automatically.
4. On a **hit**, a "Roll Damage" button appears. Clicking it rolls the weapon's flat damage dice (no wild die) and shows the resulting tier (Stun/Wound/Incap/Mortal).
5. A "Mark Hit Box" button applies one mark to the target's appropriate tier, with cascade overflow. This button is GM-only; non-GM players trigger a socket request that the GM client fulfills.

With **no target** selected, the Difficulty field is pre-filled with the skill's base value (`ceil(3.5 × skill_dice)`) and remains editable. No damage button is shown — the GM adjudicates damage manually.

Only the **first** targeted token is used when multiple tokens are targeted.

---

## Healing

Healing must address the **most serious condition first**. A character cannot heal wounds while incapacitated marks remain, etc.

### Stun

- **Automatic recovery:** All stun marks clear at the end of a combat scene.
- **Unconsciousness:** Removed with an **Easy** (6–10) `medicine` check.

### Wound

Two methods:

#### Stamina Recovery (after combat, no equipment needed)

Roll `stamina`. Wounds healed by result:

| Stamina Roll | Wounds Healed |
|--------------|---------------|
| 6–10         | 1             |
| 11–15        | 2             |
| 16–20        | 3             |

#### Medical Treatment (requires medpac or medkit)

Roll `medicine`. Wounds healed by result:

| Medicine Roll | Wounds Healed |
|---------------|---------------|
| 3–5           | 1             |
| 6–8           | 2             |
| 9–12          | 3             |
| 13–16         | 4             |

### Incapacitated

Can **only** be healed with `medicine` and a **medpac**.

| Medicine Roll | Incap Marks Healed |
|---------------|--------------------|
| 6–10          | 1                  |
| 11–15         | 2                  |
| 16–20         | 3                  |
| 21–25         | 4                  |

### Mortally Wounded

Can **only** be healed with `medicine` and a **medpac**.

| Medicine Roll | Mortal Marks Healed |
|---------------|---------------------|
| 11–15         | 1                   |
| 16–20         | 2                   |
| 21–25         | 3                   |
| 26–30         | 4                   |

---

## The Force

The Force is an energy field that some characters can tap into through three Force skills. This section covers the mechanical framework for Force use; individual Force power descriptions are catalogued separately.

**Source:** `doc/ref/force_skills.pdf`

### Force Skills

Force skills are **not** governed by any of the six attributes. Each has its own independent die code.

| Force Skill | Description |
|-------------|-------------|
| control     | Ability to control one's own body — internal Force use (healing self, resisting damage, enhancing physical abilities) |
| sense       | Ability to sense the Force in the environment, in other beings, and in objects |
| alter        | Ability to change the distribution and nature of the Force — affect other objects, beings, and the environment |

A character must be **Force-sensitive** to learn Force skills.

### Learning Force Skills

- A character must have a **teacher** with at least `1D` in the Force skill to learn it.
- A Jedi master must have a Force skill at least equal to the student's skill level +1D to teach that skill.
- A teacher can only train **one student** in **one Force skill** at a time.
- **Training time:** one day per Character Point spent.
- The character gains the skill at `1D` (or the character is already improving an existing Force skill; see advancement below).

### Learning Force Powers

- A teacher must know a power to teach it.
- A character may learn **one new power** each time a Force skill is improved by one pip.
- A character may be taught a Force power **without** improving a Force skill, but the character must spend **five** Character Points per power learned this way.
- A power that uses two or three Force skills counts as **one** power belonging to the skill the teacher chooses to teach it under.

### Force Skill Advancement

Force skills advance using Character Points, like normal skills.

> Formula: `CP_cost = current_dice_number × 12` (with a teacher)
> Without a teacher: `CP_cost = current_dice_number × 12 × 2`

- **Training time with teacher:** one day per Character Point spent.
- **Training time without teacher:** two days per Character Point spent.
- When a Force skill is improved by one pip, the character may learn one new Force power pertaining to that skill (see "Force Powers" above).

### Using Force Powers

#### Activating a Power

Each Force power lists which Force skills are required (one, two, or three of control/sense/alter) and a difficulty for each. Rolling each required Force skill counts as a **separate action**.

A character may:
- Roll each required skill in **consecutive rounds** (one skill per round, no multiple-action penalty), or
- Roll multiple required skills in **one round** (incurring normal multiple-action penalties for all rolls that round).

If any required skill roll fails, the power fails to activate.

#### Difficulty Modifiers

Force power difficulties may be modified by two factors:

**Relationship to target:**

| Relationship                        | Difficulty Modifier |
|-------------------------------------|---------------------|
| Close relatives (spouse, parent, child, etc.) | +0 |
| Close friends                       | +2                  |
| Friends                             | +5                  |
| Acquaintances                       | +7                  |
| Slight acquaintances                | +10                 |
| Met once                            | +12                 |
| Never met, but know each other by reputation | +15 |
| Complete strangers                  | +20                 |
| Complete strangers, not of the same species | +30 |

**Proximity to target:**

| Proximity                                    | Difficulty Modifier |
|----------------------------------------------|---------------------|
| Touching                                     | +0                  |
| In line of sight but not touching             | +2                  |
| Not in line of sight, 1–100 meters away       | +5                  |
| 101 meters to 10 km away                     | +7                  |
| 11 to 1,000 km away                          | +10                 |
| Same planet but more than 1,000 km away       | +15                 |
| Same star system but not on the same planet   | +20                 |
| Not in the same star system                   | +30                 |

Not all powers are affected by relationship or proximity — only those whose descriptions specify it.

#### Keeping Powers "Up"

Some powers state "This Power May Be Kept Up." A power kept "up" operates continuously without requiring new Force skill rolls each round.

- The player must announce the intent to keep a power "up" **when the power is activated**.
- If the initial Force roll succeeds, the power continues until the character **voluntarily drops it** or is **stunned, wounded, or worse**.
- A character keeping a power "up" counts those Force skills as **active actions** — they contribute to the multiple-action penalty for any other actions the character takes.
- If no "Time to Use" listing is given, the power requires **one round** to activate.

#### Resistance

As listed in individual power descriptions, the target may roll `control` or `Perception` to resist the effects of the power.

#### Dark Side Warning

Some powers are inherently evil and **automatically** cause a character to receive a Dark Side Point whenever they are used. Any use of Force powers in anger, fear, or for evil purposes also grants a Dark Side Point regardless of the power used.

### The Lure of the Dark Side

Characters with Dark Side Points receive bonuses to Force skills but face increased difficulties:

- A character with Dark Side Points gains a **bonus of +1D** to all Force skills per Dark Side Point.
- Exception: if a character has only 1–2 Dark Side Points, the bonus is **+2 pips** per DSP instead of +1D.
- A Jedi may **refuse** this bonus. The GM may then increase difficulties as appropriate.
- **All** Force power difficulties are increased by **at least one difficulty level** for characters who have gone over to the dark side.
- Jedi characters with Dark Side Points are responsible for the actions of those they teach. If a Jedi's pupil turns to the dark side, the Jedi is morally obligated to resolve the situation (if possible).

### Force Power Description Format

Each Force power is documented with the following fields:

| Field | Description |
|-------|-------------|
| **Control/Sense/Alter Difficulty** | The difficulty for each required Force skill roll. May include modifiers (relationship, proximity). |
| **Required Powers** | Other powers the Jedi must know before learning this one. |
| **This Power May Be Kept "Up"** | Whether the power can be maintained continuously (see Keeping Powers "Up"). |
| **Time to Use** | How long to activate. If absent, defaults to one round. |
| **Warning** | If present, using this power automatically grants a Dark Side Point. |
| **Effect** | The mechanical effect of the power. |

---

## Special Points

### Character Points

- **During play:** Spend 1 Character Point to gain **+1D** on a single roll. May be spent **after** rolling but **before** the GM announces the result. Multiple Character Points may be spent on the same roll (each adds +1D).
- **Restriction:** Cannot spend Character Points in a round where a Force Point is spent.
- **Between adventures:** Character Points are spent to permanently improve skills

### Force Points

- Spend 1 Force Point to **double all skill and attribute die codes** for one round.
- Must be declared **before** any dice are rolled that round.
- Only **one** Force Point may be spent per round (GM-managed table rule; not system-enforced).
- **Cannot** spend Character Points in the same round (GM-managed table rule; not system-enforced).
- Using a Force Point in anger, fear, or for selfish/evil purposes risks the **dark side** (see Dark Side Points).

### Dark Side Points

- A character receives a Dark Side Point for performing a hateful, vengeful, or evil act.
- **Conversion check:** When a Dark Side Point is gained, roll `1D`. If the result is **less than** the character's current number of Dark Side Points (after gaining the new one), the character is consumed by the dark side — they become a GM-controlled character and the player must create a new character.

---

## Movement

Each character has a **Move** stat expressed in **meters per round**.

- **Cautious movement:** half Move (no action penalty).
- **Full movement:**  free action up to Move rate, with running as an additional action.
- **Running:** double Move or more (counts as an action; additional speed may require a skill roll at GM discretion).

---

## Summary of House Rule Overrides

For quick reference, the following base rules are **replaced** by house rules:

| Mechanic               | Base Rule                           | House Rule Override                              |
|------------------------|-------------------------------------|--------------------------------------------------|
| Combat attack resolution | Opposed roll (attacker vs. dodge)  | Attack roll vs. static Defense value             |
| Combat damage resolution | Opposed roll (damage vs. Strength) | Damage roll vs. STR-derived threshold table      |
| Damage tracking        | Single wound level                  | Four-tier hit box system (Stun/Wound/Incap/Mortal) |
| Healing                | Not detailed in handout             | Tiered healing with stamina and medicine checks   |
| Dark Side conversion   | Accumulate points → turn            | Roll 1D; if < current DSP count → turned          |
| Difficulty chart       | Not provided in handout             | Six-tier chart with ranges and reference die codes |
