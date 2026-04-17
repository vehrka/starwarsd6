function makeDie(results, colorset) {
  const die = new foundry.dice.terms.Die({ number: results.length, faces: 6 });
  die.results = results.map(r => ({ result: r, active: true }));
  die._evaluated = true;
  die.options.appearance = { colorset };
  return die;
}

function buildRoll(terms) {
  // Build a dummy Roll then replace terms — avoids Roll.fromTerms formula re-parsing.
  const roll = new Roll("0");
  roll.terms = terms;
  roll._evaluated = true;
  return roll;
}

/**
 * Animate a wild-die roll using Dice So Nice.
 * All dice in one showForRoll call; per-term colorsets applied via die.options.appearance.
 * No-ops if Dice So Nice is not installed/active.
 *
 * @param {number[]} normalDice  Normal d6 results
 * @param {number[]} wildRolls   Wild die chain results (including explosions)
 * @param {"character"|"npc"} actorType  Controls wild die colorset
 */
export async function showDiceAnimation(normalDice, wildRolls, actorType) {
  if (!game.modules.get("dice-so-nice")?.active) return;

  const wildColorset = actorType === "npc" ? "swd6-npc-wild" : "swd6-pc-wild";
  const terms = [];

  if (normalDice.length > 0) {
    terms.push(makeDie(normalDice, "swd6-normal"));
  }
  terms.push(makeDie(wildRolls, wildColorset));

  await game.dice3d.showForRoll(buildRoll(terms), game.user, true, null, false);
}

/**
 * Animate a Foundry Roll object using Dice So Nice.
 * Used for damage rolls. Uses DSN user default appearance.
 * No-ops if Dice So Nice is not installed/active.
 *
 * @param {Roll} roll  An already-evaluated Foundry Roll
 */
export async function showRollAnimation(roll) {
  if (!game.modules.get("dice-so-nice")?.active) return;
  await game.dice3d.showForRoll(roll, game.user, true, null, false);
}
