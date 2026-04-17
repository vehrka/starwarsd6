/**
 * @typedef {Object} RollResult
 * @property {number} total         — Final total (normalDice + wildTotal + pips)
 * @property {number[]} normalDice  — Individual normal d6 results (length = effective-1)
 * @property {number[]} wildRolls   — Wild die chain: [first, ...explosions] (≥1 element)
 * @property {boolean} isComplication — true when first wild roll was 1
 * @property {number} pips          — Pip bonus applied
 * @property {boolean} doubled      — true if Force Point doubling was applied
 */

/**
 * Default roll function — rolls one d6 using Foundry's Roll API.
 * Injected in production; replaced in tests.
 * @returns {Promise<number>}
 */
async function rollOneDie() {
  const r = await new Roll("1d6").evaluate();
  return r.total;
}

/**
 * Roll a skill or attribute using the Star Wars D6 wild die mechanic.
 *
 * @param {number} dice                       Base die code (number of d6s)
 * @param {number} pips                       Pip bonus (0, 1, or 2)
 * @param {number} [multipleActionPenalty=0]  Penalty dice from multiple actions
 * @param {Function} [_rollFn=rollOneDie]     Injected roll function — override in tests
 * @param {object} [options={}]               Options object
 * @param {boolean} [options.doubled=false]   If true, double base dice (Force Point spend) before penalty
 * @returns {Promise<RollResult>}
 */
export async function rollWithWildDie(dice, pips, multipleActionPenalty = 0, _rollFn = rollOneDie, { doubled = false } = {}) {
  const baseDice = doubled ? dice * 2 : dice;
  const effective = Math.max(1, baseDice - multipleActionPenalty);

  // Roll (effective - 1) normal d6s
  const normalDice = [];
  for (let i = 0; i < effective - 1; i++) {
    normalDice.push(await _rollFn());
  }

  // Roll wild die (chain on 6)
  const wildRolls = [];
  let wildResult = await _rollFn();
  wildRolls.push(wildResult);
  while (wildResult === 6) {
    wildResult = await _rollFn();
    wildRolls.push(wildResult);
  }

  const isComplication = wildRolls[0] === 1;
  const normalTotal = normalDice.reduce((sum, n) => sum + n, 0);
  const wildTotal = wildRolls.reduce((sum, n) => sum + n, 0);
  const total = normalTotal + wildTotal + pips;

  return { total, normalDice, wildRolls, isComplication, pips, doubled };
}

/**
 * Roll one extra d6 — used for Character Point spend after a roll resolves.
 *
 * @param {Function} [_rollFn=rollOneDie]  Injected roll function — override in tests
 * @returns {Promise<number>}  The single die result
 */
export async function rollExtraDie(_rollFn = rollOneDie) {
  return _rollFn();
}

/**
 * Roll a flat damage die code — no wild die.
 *
 * @param {number} dice  Number of d6s
 * @param {number} pips  Pip bonus
 * @returns {Promise<{ total: number, roll: Roll }>}
 */
export async function rollDamage(dice, pips) {
  const formula = pips > 0 ? `${dice}d6 + ${pips}` : `${dice}d6`;
  const roll = await new Roll(formula).evaluate();
  return { total: roll.total, roll };
}
