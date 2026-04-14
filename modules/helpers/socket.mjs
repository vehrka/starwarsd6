import { applyDamage } from "./damage.mjs";

/**
 * Emit a socket message asking the GM client to apply damage to a target actor.
 * The handler is registered in starwarsd6.mjs Hooks.once("ready").
 * @param {string} targetActorId
 * @param {"stun"|"wound"|"incap"|"mortal"} tier
 */
export function requestApplyDamage(targetActorId, tier) {
  game.socket.emit("system.starwarsd6", { action: "applyDamage", targetActorId, tier });
}

/**
 * Handle an incoming socket message on the GM client.
 * Exported for unit testing; registered in starwarsd6.mjs Hooks.once("ready").
 * @param {{ action: string, targetActorId: string, tier: string }} message
 */
export async function handleSocketMessage({ action, targetActorId, tier }) {
  if (!game.user.isGM) return;
  if (action === "applyDamage") {
    const actor = game.actors.get(targetActorId);
    if (actor) await applyDamage(actor, tier);
  }
}
