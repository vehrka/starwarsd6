/**
 * Damage threshold calculation, tier resolution, and hit-box application.
 * applyDamage is async — it calls actor.update() exactly once.
 */

/**
 * Compute the base damage threshold from STR.
 * @param {number} strDice
 * @param {number} strPips
 * @returns {{ base: number }}
 */
export function calculateDamageThresholds(strDice, strPips) {
  const base = Math.floor(3.5 * strDice) + strPips;
  return { base };
}

/**
 * Resolve which damage tier a damage total falls into.
 * - stun:  damageTotal < base
 * - wound: base <= damageTotal < 2*base
 * - incap: 2*base <= damageTotal < 3*base
 * - mortal: damageTotal >= 3*base
 * @param {number} damageTotal
 * @param {number} base  — From calculateDamageThresholds().base
 * @returns {"stun"|"wound"|"incap"|"mortal"}
 */
export function resolveDamageTier(damageTotal, base) {
  if (damageTotal < base) return "stun";
  if (damageTotal < 2 * base) return "wound";
  if (damageTotal < 3 * base) return "incap";
  return "mortal";
}

const MARK_KEY = { stun: "stunMarks", wound: "woundMarks", incap: "incapMarks", mortal: "mortalMarks" };

/**
 * Remove one mark from the given tier — no cascade, floored at 0.
 * Used for Shift+Alt+click on a hit-box button.
 * @param {Actor} actor
 * @param {"stun"|"wound"|"incap"|"mortal"} tier
 * @returns {Promise<void>}
 */
export async function removeOneMark(actor, tier) {
  const key = MARK_KEY[tier];
  if (!key) throw new Error(`removeOneMark: unknown tier "${tier}"`);
  const current = actor.system[key];
  await actor.update({ [`system.${key}`]: Math.max(current - 1, 0) });
}

/**
 * Apply one mark of damage to the given tier, cascading overflow to next tier.
 * Computes all final mark values in pure JS, then calls actor.update() exactly once.
 * @param {Actor} actor
 * @param {"stun"|"wound"|"incap"|"mortal"} tier
 * @returns {Promise<void>}
 */
export async function applyDamage(actor, tier) {
  const system = actor.system;
  const hitBoxes = system.hitBoxes;

  let { stunMarks, woundMarks, incapMarks, mortalMarks } = system;

  if (tier === "stun") {
    stunMarks++;
  } else if (tier === "wound") {
    woundMarks++;
  } else if (tier === "incap") {
    incapMarks++;
  } else if (tier === "mortal") {
    mortalMarks++;
  } else {
    throw new Error(`applyDamage: unknown tier "${tier}"`);
  }

  // Overflow cascade: stun fills → wound, wound fills → incap, incap fills → mortal
  if (stunMarks >= hitBoxes) {
    stunMarks = hitBoxes;
    woundMarks++;
  }
  if (woundMarks >= hitBoxes) {
    woundMarks = hitBoxes;
    incapMarks++;
  }
  if (incapMarks >= hitBoxes) {
    incapMarks = hitBoxes;
    mortalMarks++;
  }
  // mortalMarks capped at hitBoxes (full mortal = dead, GM narrates)
  mortalMarks = Math.min(mortalMarks, hitBoxes);

  await actor.update({
    "system.stunMarks": stunMarks,
    "system.woundMarks": woundMarks,
    "system.incapMarks": incapMarks,
    "system.mortalMarks": mortalMarks
  });
}
