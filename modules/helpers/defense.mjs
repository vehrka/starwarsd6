/**
 * Pure defense value calculators.
 * All functions accept an Actor document and read actor.items + actor.system.
 * No Foundry API calls beyond the actor argument passed in.
 */

/**
 * Ranged Defense = floor(3.5 * dodge_dice) + dodge_pips + armorBonus
 * Falls back to DEX if no Dodge skill item found.
 * @param {Actor} actor
 * @returns {number}
 */
export function calculateRangedDefense(actor) {
  const dodge = actor.items.find(i => i.type === "skill" && i.name.toLowerCase() === "dodge");
  const dice = dodge ? dodge.system.dicePool : actor.system.DEX.dice;
  const pips = dodge ? dodge.system.pips : actor.system.DEX.pips;
  return Math.floor(3.5 * dice) + pips + actor.system.armorBonus;
}

/**
 * Melee Defense = floor(3.5 * melee_parry_dice) + melee_parry_pips + weaponBonus
 * Falls back to DEX if no Melee Parry skill item found.
 * @param {Actor} actor
 * @returns {number}
 */
export function calculateMeleeDefense(actor) {
  const skill = actor.items.find(i => i.type === "skill" && i.name.toLowerCase() === "melee parry");
  const dice = skill ? skill.system.dicePool : actor.system.DEX.dice;
  const pips = skill ? skill.system.pips : actor.system.DEX.pips;
  return Math.floor(3.5 * dice) + pips + actor.system.weaponBonus;
}

/**
 * Brawling Defense = floor(3.5 * brawling_parry_dice) + brawling_parry_pips
 * Falls back to DEX if no Brawling Parry skill item found. No equipment bonus.
 * @param {Actor} actor
 * @returns {number}
 */
export function calculateBrawlingDefense(actor) {
  const skill = actor.items.find(i => i.type === "skill" && i.name.toLowerCase() === "brawling parry");
  const dice = skill ? skill.system.dicePool : actor.system.DEX.dice;
  const pips = skill ? skill.system.pips : actor.system.DEX.pips;
  return Math.floor(3.5 * dice) + pips;
}
