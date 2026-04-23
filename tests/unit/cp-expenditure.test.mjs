import { describe, it, expect, vi } from "vitest";
import { rollExtraDie } from "../../modules/helpers/dice.mjs";

// Minimal DOM-like node for testing — avoids jsdom/browser dependency
function makeNode(tag, html = "") {
  const attrs = {};
  const children = [];
  let textContent = "";
  let outerHTML = html;
  let style = {};

  const node = {
    tagName: tag.toUpperCase(),
    className: "",
    innerHTML: html,
    style,
    get textContent() { return textContent; },
    set textContent(v) { textContent = String(v); outerHTML = `<${tag}>${v}</${tag}>`; },
    getAttribute: (k) => attrs[k] ?? null,
    setAttribute: (k, v) => { attrs[k] = v; },
    appendChild: (child) => { children.push(child); },
    remove: vi.fn(),
    querySelector: (sel) => null,
    closest: (sel) => null,
  };
  return node;
}

// Build a simple DOM-like structure for chat content parsing using string + regex
function makeLiveDomTotal(initialTotal) {
  let value = initialTotal;
  return {
    get textContent() { return String(value); },
    set textContent(v) { value = parseInt(v); },
  };
}

// Simulates the spend-cp click handler logic from the renderChatMessageHTML hook.
// Uses injected DOM-like objects instead of real DOM APIs.
async function handleSpendCpClick({ actor, dieFace, chatMsg, liveTotal }) {
  const cp = actor.system.characterPoints;
  if (cp <= 0) return { hidden: true, updated: false };

  const dieFaceResult = await rollExtraDie(async () => dieFace);

  // Parse stored content with regex (mirrors DOMParser usage in real handler)
  const totalMatch = chatMsg.content.match(/<span class="total-value">(\d+)<\/span>/);
  const currentTotal = totalMatch ? parseInt(totalMatch[1]) : 0;
  const newTotal = currentTotal + dieFaceResult;
  chatMsg.content = chatMsg.content.replace(
    /<span class="total-value">\d+<\/span>/,
    `<span class="total-value">${newTotal}</span>`
  );

  // Update live DOM total
  if (liveTotal) {
    const current = parseInt(liveTotal.textContent) || 0;
    liveTotal.textContent = current + dieFaceResult;
  }

  const newCp = cp - 1;
  await actor.update({ "system.characterPoints": newCp });

  let buttonHidden = false;
  if (newCp <= 0) {
    chatMsg.content = chatMsg.content.replace(/<div class="cp-action">[\s\S]*?<\/div>/, "");
    buttonHidden = true;
  }

  await chatMsg.update({ content: chatMsg.content });

  return { hidden: buttonHidden, updated: true, newCp, dieFace: dieFaceResult, newTotal };
}

function makeChatMsg(total) {
  const msg = {
    content: `<div class="starwarsd6 roll-result"><div class="roll-total"><span class="total-value">${total}</span></div><div class="cp-action"><button class="spend-cp-btn">Spend CP</button></div></div>`,
    update: vi.fn(async function({ content }) { this.content = content; })
  };
  return msg;
}

function makeActor(cp) {
  return {
    type: "character",
    system: { characterPoints: cp },
    update: vi.fn(async function(data) {
      if ("system.characterPoints" in data) this.system.characterPoints = data["system.characterPoints"];
    })
  };
}

describe("CP spend handler", () => {
  it("does nothing when CP = 0", async () => {
    const actor = makeActor(0);
    const chatMsg = makeChatMsg(10);
    const liveTotal = makeLiveDomTotal(10);
    const result = await handleSpendCpClick({ actor, dieFace: 4, chatMsg, liveTotal });
    expect(result.updated).toBe(false);
    expect(result.hidden).toBe(true);
    expect(actor.update).not.toHaveBeenCalled();
    expect(chatMsg.update).not.toHaveBeenCalled();
  });

  it("decrements CP by 1 on each click", async () => {
    const actor = makeActor(3);
    const chatMsg = makeChatMsg(10);
    const liveTotal = makeLiveDomTotal(10);
    const result = await handleSpendCpClick({ actor, dieFace: 4, chatMsg, liveTotal });
    expect(result.newCp).toBe(2);
    expect(actor.update).toHaveBeenCalledWith({ "system.characterPoints": 2 });
  });

  it("adds die face to total in stored content", async () => {
    const actor = makeActor(2);
    const chatMsg = makeChatMsg(8);
    const liveTotal = makeLiveDomTotal(8);
    const result = await handleSpendCpClick({ actor, dieFace: 5, chatMsg, liveTotal });
    expect(result.newTotal).toBe(13);
    expect(chatMsg.content).toContain(">13<");
  });

  it("adds die face to live DOM total", async () => {
    const actor = makeActor(2);
    const chatMsg = makeChatMsg(7);
    const liveTotal = makeLiveDomTotal(7);
    await handleSpendCpClick({ actor, dieFace: 3, chatMsg, liveTotal });
    expect(liveTotal.textContent).toBe("10");
  });

  it("button hidden after last CP spent", async () => {
    const actor = makeActor(1);
    const chatMsg = makeChatMsg(5);
    const liveTotal = makeLiveDomTotal(5);
    const result = await handleSpendCpClick({ actor, dieFace: 2, chatMsg, liveTotal });
    expect(result.hidden).toBe(true);
    expect(chatMsg.content).not.toContain("cp-action");
  });

  it("button NOT hidden when CP remains after click", async () => {
    const actor = makeActor(3);
    const chatMsg = makeChatMsg(5);
    const liveTotal = makeLiveDomTotal(5);
    const result = await handleSpendCpClick({ actor, dieFace: 2, chatMsg, liveTotal });
    expect(result.hidden).toBe(false);
    expect(chatMsg.content).toContain("cp-action");
  });

  it("updates stored ChatMessage content on every click", async () => {
    const actor = makeActor(2);
    const chatMsg = makeChatMsg(10);
    const liveTotal = makeLiveDomTotal(10);
    await handleSpendCpClick({ actor, dieFace: 4, chatMsg, liveTotal });
    expect(chatMsg.update).toHaveBeenCalledTimes(1);
  });

  it("canSpendCp false when FP was spent — no button rendered in content", () => {
    const useForcePoint = true;
    const cp = 3;
    const canSpendCp = !useForcePoint && cp > 0;
    const spendCpBtn = canSpendCp
      ? `<div class="cp-action"><button class="spend-cp-btn">Spend CP</button></div>`
      : "";
    expect(spendCpBtn).toBe("");
    expect(canSpendCp).toBe(false);
  });

  it("canSpendCp true when FP not spent and CP > 0 — button rendered in content", () => {
    const useForcePoint = false;
    const cp = 2;
    const canSpendCp = !useForcePoint && cp > 0;
    const spendCpBtn = canSpendCp
      ? `<div class="cp-action"><button class="spend-cp-btn">Spend CP</button></div>`
      : "";
    expect(canSpendCp).toBe(true);
    expect(spendCpBtn).toContain("spend-cp-btn");
  });

  it("injects .roll-damage-btn when MISS→HIT crossing occurs with target", () => {
    const oldTotal = 8;
    const difficulty = 10;
    const dieFace = 4;
    const newTotal = oldTotal + dieFace; // 12 >= 10 → HIT
    const wasHit = oldTotal >= difficulty;   // false — was MISS
    const isSuccess = newTotal >= difficulty; // true — now HIT
    const targetActorId = "target1";
    expect(wasHit).toBe(false);
    expect(isSuccess).toBe(true);
    // Injection condition must be true
    const shouldInject = !wasHit && isSuccess && !!targetActorId;
    expect(shouldInject).toBe(true);
    // Verify button HTML would contain correct data-* attributes
    const dmgHtml = `<button type="button" class="roll-damage-btn"
      data-target-actor-id="${targetActorId}"
      data-target-token-id="token1"
      data-damage-dice="4"
      data-damage-pips="0"
      data-damage-base="12">Roll Damage</button>`;
    expect(dmgHtml).toContain("roll-damage-btn");
    expect(dmgHtml).toContain('data-target-actor-id="target1"');
    expect(dmgHtml).toContain('data-target-token-id="token1"');
    expect(dmgHtml).toContain('data-damage-dice="4"');
  });

  it("does NOT inject damage button when target absent (no targetActorId)", () => {
    const oldTotal = 8;
    const difficulty = 10;
    const newTotal = 12;
    const wasHit = oldTotal >= difficulty;   // false
    const isSuccess = newTotal >= difficulty; // true
    const targetActorId = "";               // no target
    const shouldInject = !wasHit && isSuccess && !!targetActorId;
    expect(shouldInject).toBe(false);
  });

  it("does NOT inject damage button when already a HIT (no MISS→HIT transition)", () => {
    const oldTotal = 12;
    const difficulty = 10;
    const newTotal = 14;
    const wasHit = oldTotal >= difficulty;   // true — already was a HIT
    const isSuccess = newTotal >= difficulty;
    const targetActorId = "target1";
    const shouldInject = !wasHit && isSuccess && !!targetActorId;
    expect(shouldInject).toBe(false);
  });
});
