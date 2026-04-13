/**
 * Calculate the Force dice bonus from dark side points.
 * - dsp 0: no bonus
 * - dsp 1-2: +2 pips per DSP, normalized (3 pips = 1 die)
 * - dsp 3+: +1D per DSP
 * @param {number} dsp  Current dark side points
 * @returns {{ bonusDice: number, bonusPips: number }}
 */
export function calculateForceDiceBonus(dsp) {
  if (dsp <= 0) return { bonusDice: 0, bonusPips: 0 };
  if (dsp >= 3) return { bonusDice: dsp, bonusPips: 0 };
  // dsp 1-2: +2 pips per DSP, then normalize (3 pips = 1 die)
  const rawPips = 2 * dsp;
  return { bonusDice: Math.floor(rawPips / 3), bonusPips: rawPips % 3 };
}

// Default roll function — inline to avoid importing non-exported rollOneDie from dice.mjs
async function defaultRollFn() {
  const r = await new Roll("1d6").evaluate();
  return r.total;
}

/**
 * Increment an actor's dark side points by 1 and perform the conversion check.
 * Rolls 1d6: if result < new DSP total, posts a "consumed by the dark side" warning to chat.
 * @param {Actor} actor
 * @param {Function} [_rollFn]  Injectable for tests (same pattern as rollWithWildDie)
 * @returns {Promise<void>}
 */
export async function applyDarkSidePoint(actor, _rollFn = defaultRollFn) {
  const newDsp = actor.system.darkSidePoints + 1;
  await actor.update({ "system.darkSidePoints": newDsp });
  const rolled = await _rollFn();
  const speaker = ChatMessage.getSpeaker({ actor });
  if (rolled < newDsp) {
    await ChatMessage.create({
      speaker,
      content: `<div class="starwarsd6 roll-result dsp-warning">
        <h3>Dark Side Point Gained (total: ${newDsp})</h3>
        <div>Conversion roll: <strong>${rolled}</strong> vs DSP ${newDsp}</div>
        <div class="dark-side-consumed"><strong>&#9888; Character consumed by the dark side!</strong></div>
      </div>`
    });
  } else {
    await ChatMessage.create({
      speaker,
      content: `<div class="starwarsd6 roll-result">
        <h3>Dark Side Point Gained (total: ${newDsp})</h3>
        <div>Conversion roll: <strong>${rolled}</strong> vs DSP ${newDsp} — resisted</div>
      </div>`
    });
  }
}
