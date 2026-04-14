import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSocketMessage, requestApplyDamage } from "../../modules/helpers/socket.mjs";
import { applyDamage } from "../../modules/helpers/damage.mjs";

vi.mock("../../modules/helpers/damage.mjs", () => ({
  applyDamage: vi.fn().mockResolvedValue(undefined)
}));

function setupGame({ isGM = true, actor = null, tokenActor = null } = {}) {
  globalThis.game = {
    user: { isGM },
    actors: { get: vi.fn().mockReturnValue(actor) },
    socket: { emit: vi.fn() }
  };
  globalThis.canvas = {
    tokens: { get: vi.fn().mockReturnValue(tokenActor ? { actor: tokenActor } : null) }
  };
}

describe("handleSocketMessage()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when user is not GM", async () => {
    setupGame({ isGM: false });
    await handleSocketMessage({ action: "applyDamage", targetActorId: "abc", targetTokenId: null, tier: "wound" });
    expect(applyDamage).not.toHaveBeenCalled();
  });

  it("does nothing for unknown action", async () => {
    const actor = { system: {} };
    setupGame({ isGM: true, actor });
    await handleSocketMessage({ action: "unknownAction", targetActorId: "abc", targetTokenId: null, tier: "wound" });
    expect(applyDamage).not.toHaveBeenCalled();
  });

  it("resolves actor via token when targetTokenId provided", async () => {
    const tokenActor = { id: "abc", system: {} };
    setupGame({ isGM: true, tokenActor });
    await handleSocketMessage({ action: "applyDamage", targetActorId: "abc", targetTokenId: "tok1", tier: "stun" });
    expect(canvas.tokens.get).toHaveBeenCalledWith("tok1");
    expect(applyDamage).toHaveBeenCalledWith(tokenActor, "stun");
  });

  it("falls back to game.actors when token not found", async () => {
    const actor = { id: "abc", system: {} };
    setupGame({ isGM: true, actor, tokenActor: null });
    await handleSocketMessage({ action: "applyDamage", targetActorId: "abc", targetTokenId: "missing-tok", tier: "stun" });
    expect(game.actors.get).toHaveBeenCalledWith("abc");
    expect(applyDamage).toHaveBeenCalledWith(actor, "stun");
  });

  it("does not call applyDamage when actor not found via either path", async () => {
    setupGame({ isGM: true, actor: null, tokenActor: null });
    await handleSocketMessage({ action: "applyDamage", targetActorId: "missing", targetTokenId: "missing-tok", tier: "wound" });
    expect(applyDamage).not.toHaveBeenCalled();
  });
});

describe("requestApplyDamage()", () => {
  beforeEach(() => vi.clearAllMocks());

  it("emits the correct socket message with token ID", () => {
    setupGame();
    requestApplyDamage("target-id", "tok1", "mortal");
    expect(game.socket.emit).toHaveBeenCalledWith("system.starwarsd6", {
      action: "applyDamage",
      targetActorId: "target-id",
      targetTokenId: "tok1",
      tier: "mortal"
    });
  });
});
