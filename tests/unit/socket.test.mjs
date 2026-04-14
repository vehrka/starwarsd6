import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSocketMessage, requestApplyDamage } from "../../modules/helpers/socket.mjs";
import { applyDamage } from "../../modules/helpers/damage.mjs";

vi.mock("../../modules/helpers/damage.mjs", () => ({
  applyDamage: vi.fn().mockResolvedValue(undefined)
}));

function setupGame({ isGM = true, actor = null } = {}) {
  globalThis.game = {
    user: { isGM },
    actors: { get: vi.fn().mockReturnValue(actor) },
    socket: { emit: vi.fn() }
  };
}

describe("handleSocketMessage()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when user is not GM", async () => {
    setupGame({ isGM: false });
    await handleSocketMessage({ action: "applyDamage", targetActorId: "abc", tier: "wound" });
    expect(applyDamage).not.toHaveBeenCalled();
  });

  it("does nothing for unknown action", async () => {
    const actor = { system: {} };
    setupGame({ isGM: true, actor });
    await handleSocketMessage({ action: "unknownAction", targetActorId: "abc", tier: "wound" });
    expect(applyDamage).not.toHaveBeenCalled();
  });

  it("calls applyDamage when GM and action is applyDamage", async () => {
    const actor = { id: "abc", system: {} };
    setupGame({ isGM: true, actor });
    await handleSocketMessage({ action: "applyDamage", targetActorId: "abc", tier: "stun" });
    expect(game.actors.get).toHaveBeenCalledWith("abc");
    expect(applyDamage).toHaveBeenCalledWith(actor, "stun");
  });

  it("does not call applyDamage when actor not found", async () => {
    setupGame({ isGM: true, actor: null });
    await handleSocketMessage({ action: "applyDamage", targetActorId: "missing", tier: "wound" });
    expect(applyDamage).not.toHaveBeenCalled();
  });
});

describe("requestApplyDamage()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("emits the correct socket message", () => {
    setupGame();
    requestApplyDamage("target-id", "mortal");
    expect(game.socket.emit).toHaveBeenCalledWith("system.starwarsd6", {
      action: "applyDamage",
      targetActorId: "target-id",
      tier: "mortal"
    });
  });
});
