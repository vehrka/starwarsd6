import { describe, it, expect } from "vitest";
import NpcData from "../../modules/actors/npc-data.mjs";

function makeNpcData(overrides = {}) {
  const instance = Object.create(NpcData.prototype);
  instance.DEX = { dice: 2, pips: 0 };
  instance.KNO = { dice: 2, pips: 0 };
  instance.MEC = { dice: 2, pips: 0 };
  instance.PER = { dice: 2, pips: 0 };
  instance.STR = { dice: 2, pips: 0 };
  instance.TEC = { dice: 2, pips: 0 };
  instance.stunMarks  = 0;
  instance.woundMarks = 0;
  instance.incapMarks = 0;
  instance.mortalMarks = 0;
  Object.assign(instance, overrides);
  return instance;
}

describe("NpcData.prepareDerivedData()", () => {
  describe("baseValue derivation", () => {
    it("computes baseValue for all 6 attributes", () => {
      const data = makeNpcData({
        DEX: { dice: 3, pips: 1 },
        STR: { dice: 4, pips: 2 }
      });
      data.prepareDerivedData();
      expect(data.DEX.baseValue).toBe(11); // floor(10.5)+1
      expect(data.STR.baseValue).toBe(16); // floor(14.0)+2
      expect(data.KNO.baseValue).toBe(7);  // floor(7.0)+0
    });

    it("hitBoxes = STR.dice", () => {
      const data = makeNpcData({ STR: { dice: 3, pips: 2 } });
      data.prepareDerivedData();
      expect(data.hitBoxes).toBe(3);
    });
  });

  describe("penaltyDice / penaltyPips", () => {
    it("no wounds → penaltyDice=0 penaltyPips=0", () => {
      const data = makeNpcData();
      data.prepareDerivedData();
      expect(data.penaltyDice).toBe(0);
      expect(data.penaltyPips).toBe(0);
    });

    it("1 wound mark → penaltyDice=1", () => {
      const data = makeNpcData({ woundMarks: 1 });
      data.prepareDerivedData();
      expect(data.penaltyDice).toBe(1);
    });

    it("1 incap mark → penaltyDice=2", () => {
      const data = makeNpcData({ incapMarks: 1 });
      data.prepareDerivedData();
      expect(data.penaltyDice).toBe(2);
    });

    it("1 mortal mark → penaltyDice=3", () => {
      const data = makeNpcData({ mortalMarks: 1 });
      data.prepareDerivedData();
      expect(data.penaltyDice).toBe(3);
    });

    it("combined wound/incap/mortal marks stack correctly", () => {
      const data = makeNpcData({ woundMarks: 1, incapMarks: 1, mortalMarks: 1 });
      data.prepareDerivedData();
      expect(data.penaltyDice).toBe(6); // 1+2+3
    });

    it("1 stun mark → penaltyPips=1", () => {
      const data = makeNpcData({ stunMarks: 1 });
      data.prepareDerivedData();
      expect(data.penaltyPips).toBe(1);
    });

    it("stun marks do not affect penaltyDice", () => {
      const data = makeNpcData({ stunMarks: 3 });
      data.prepareDerivedData();
      expect(data.penaltyDice).toBe(0);
      expect(data.penaltyPips).toBe(3);
    });
  });
});
